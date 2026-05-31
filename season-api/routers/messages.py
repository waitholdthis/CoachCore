from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db
from models.user import User
from models.team import TeamMember
from models.message import Channel, Message, ReadReceipt
from schemas.message import (
    MessageCreate, MessageRead, MessageEdit,
    ChannelRead, ChannelWithMeta, DMRequest,
)
from schemas.auth import UserRead
from services.auth_service import get_current_user, get_current_approved_member, require_coach_or_admin
from services.moderation import check_text
from services.websocket_manager import manager

router = APIRouter(prefix="/api/messages", tags=["messages"])


async def _build_message_read(message: Message, db: AsyncSession) -> MessageRead:
    user_result = await db.execute(select(User).where(User.id == message.sender_id))
    sender = user_result.scalar_one()
    return MessageRead(
        id=message.id,
        channel_id=message.channel_id,
        sender_id=message.sender_id,
        content=message.content,
        is_deleted=message.is_deleted,
        edited_at=message.edited_at,
        attachment_key=message.attachment_key,
        attachment_type=message.attachment_type,
        created_at=message.created_at,
        sender=UserRead.model_validate(sender),
    )


async def _build_channel_with_meta(
    channel: Channel, current_user: User, db: AsyncSession
) -> ChannelWithMeta:
    # Get last message
    last_msg_result = await db.execute(
        select(Message)
        .where(Message.channel_id == channel.id)
        .order_by(Message.created_at.desc())
        .limit(1)
    )
    last_msg = last_msg_result.scalar_one_or_none()
    last_message = None
    if last_msg:
        last_message = await _build_message_read(last_msg, db)

    # Get unread count
    rr_result = await db.execute(
        select(ReadReceipt).where(
            ReadReceipt.user_id == current_user.id,
            ReadReceipt.channel_id == channel.id,
        )
    )
    rr = rr_result.scalar_one_or_none()
    if rr:
        unread_result = await db.execute(
            select(func.count()).select_from(Message).where(
                Message.channel_id == channel.id,
                Message.created_at > rr.last_read_at,
                Message.is_deleted == False,
            )
        )
    else:
        unread_result = await db.execute(
            select(func.count()).select_from(Message).where(
                Message.channel_id == channel.id,
                Message.is_deleted == False,
            )
        )
    unread_count = unread_result.scalar_one()

    # Get other user for DMs
    other_user = None
    if channel.channel_type == "direct":
        other_id = channel.dm_user2_id if channel.dm_user1_id == current_user.id else channel.dm_user1_id
        if other_id:
            other_result = await db.execute(select(User).where(User.id == other_id))
            other = other_result.scalar_one_or_none()
            if other:
                other_user = UserRead.model_validate(other)

    return ChannelWithMeta(
        **ChannelRead.model_validate(channel).model_dump(),
        unread_count=unread_count,
        last_message=last_message,
        other_user=other_user,
    )


@router.get("/teams/{team_id}/channels", response_model=list[ChannelWithMeta])
async def list_channels(
    team_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_current_approved_member(team_id, current_user, db)

    # Get team channels (team_chat, announcements)
    result = await db.execute(
        select(Channel).where(
            Channel.team_id == team_id,
            Channel.channel_type.in_(["team_chat", "announcements"]),
            Channel.is_archived == False,
        )
    )
    team_channels = result.scalars().all()

    # Get DM channels where user is participant
    dm_result = await db.execute(
        select(Channel).where(
            Channel.team_id == team_id,
            Channel.channel_type == "direct",
            Channel.is_archived == False,
            (Channel.dm_user1_id == current_user.id) | (Channel.dm_user2_id == current_user.id),
        )
    )
    dm_channels = dm_result.scalars().all()

    all_channels = list(team_channels) + list(dm_channels)
    return [await _build_channel_with_meta(ch, current_user, db) for ch in all_channels]


@router.get("/channels/{channel_id}/messages", response_model=list[MessageRead])
async def list_messages(
    channel_id: str,
    before: str | None = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    limit = min(limit, 100)

    channel_result = await db.execute(select(Channel).where(Channel.id == channel_id))
    channel = channel_result.scalar_one_or_none()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    await get_current_approved_member(channel.team_id, current_user, db)

    query = select(Message).where(Message.channel_id == channel_id)
    if before:
        cursor_result = await db.execute(select(Message).where(Message.id == before))
        cursor_msg = cursor_result.scalar_one_or_none()
        if cursor_msg:
            query = query.where(Message.created_at < cursor_msg.created_at)

    query = query.order_by(Message.created_at.desc()).limit(limit)
    result = await db.execute(query)
    messages = result.scalars().all()

    return [await _build_message_read(m, db) for m in messages]


@router.post("/channels/{channel_id}/messages", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
async def send_message(
    channel_id: str,
    body: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    channel_result = await db.execute(select(Channel).where(Channel.id == channel_id))
    channel = channel_result.scalar_one_or_none()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    member = await get_current_approved_member(channel.team_id, current_user, db)

    # Parents cannot post to announcements
    if channel.channel_type == "announcements" and member.role == "parent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coaches and admins can post to the announcements channel",
        )

    _, content = check_text(body.content)

    message = Message(
        channel_id=channel_id,
        sender_id=current_user.id,
        content=content,
        attachment_key=body.attachment_key,
        attachment_type=body.attachment_type,
    )
    db.add(message)
    await db.flush()
    await db.refresh(message)

    message_read = await _build_message_read(message, db)

    await manager.broadcast_to_team(
        channel.team_id,
        "new_message",
        {
            "channel_id": channel_id,
            "message": message_read.model_dump(mode="json"),
        },
    )

    return message_read


@router.patch("/channels/{channel_id}/messages/{message_id}", response_model=MessageRead)
async def edit_message(
    channel_id: str,
    message_id: str,
    body: MessageEdit,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    channel_result = await db.execute(select(Channel).where(Channel.id == channel_id))
    channel = channel_result.scalar_one_or_none()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    await get_current_approved_member(channel.team_id, current_user, db)

    msg_result = await db.execute(
        select(Message).where(Message.id == message_id, Message.channel_id == channel_id)
    )
    message = msg_result.scalar_one_or_none()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    if message.sender_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own messages",
        )

    _, content = check_text(body.content)
    message.content = content
    message.edited_at = datetime.utcnow()

    await db.flush()
    await db.refresh(message)

    message_read = await _build_message_read(message, db)

    await manager.broadcast_to_team(
        channel.team_id,
        "message_edited",
        {
            "channel_id": channel_id,
            "message": message_read.model_dump(mode="json"),
        },
    )

    return message_read


@router.delete("/channels/{channel_id}/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    channel_id: str,
    message_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    channel_result = await db.execute(select(Channel).where(Channel.id == channel_id))
    channel = channel_result.scalar_one_or_none()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    member = await get_current_approved_member(channel.team_id, current_user, db)

    msg_result = await db.execute(
        select(Message).where(Message.id == message_id, Message.channel_id == channel_id)
    )
    message = msg_result.scalar_one_or_none()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    if message.sender_id != current_user.id and member.role not in ("coach", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to delete this message",
        )

    message.is_deleted = True
    message.content = "[Message deleted]"

    await db.flush()

    await manager.broadcast_to_team(
        channel.team_id,
        "message_deleted",
        {"channel_id": channel_id, "message_id": message_id},
    )


@router.post("/channels/{channel_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_read(
    channel_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    channel_result = await db.execute(select(Channel).where(Channel.id == channel_id))
    channel = channel_result.scalar_one_or_none()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    await get_current_approved_member(channel.team_id, current_user, db)

    rr_result = await db.execute(
        select(ReadReceipt).where(
            ReadReceipt.user_id == current_user.id,
            ReadReceipt.channel_id == channel_id,
        )
    )
    rr = rr_result.scalar_one_or_none()
    if rr:
        rr.last_read_at = datetime.utcnow()
    else:
        rr = ReadReceipt(
            user_id=current_user.id,
            channel_id=channel_id,
            last_read_at=datetime.utcnow(),
        )
        db.add(rr)


@router.post("/teams/{team_id}/dm", response_model=ChannelWithMeta)
async def get_or_create_dm(
    team_id: str,
    body: DMRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_current_approved_member(team_id, current_user, db)

    target_id = str(body.target_user_id)

    # Verify target is approved member
    target_result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == target_id,
            TeamMember.is_approved == True,
        )
    )
    if not target_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target user is not an approved member of this team",
        )

    # Check for existing DM channel
    u1, u2 = sorted([current_user.id, target_id])
    existing_result = await db.execute(
        select(Channel).where(
            Channel.team_id == team_id,
            Channel.channel_type == "direct",
            Channel.dm_user1_id == u1,
            Channel.dm_user2_id == u2,
        )
    )
    channel = existing_result.scalar_one_or_none()

    if not channel:
        channel = Channel(
            team_id=team_id,
            channel_type="direct",
            dm_user1_id=u1,
            dm_user2_id=u2,
        )
        db.add(channel)
        await db.flush()
        await db.refresh(channel)

    return await _build_channel_with_meta(channel, current_user, db)
