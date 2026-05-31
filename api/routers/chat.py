from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from schemas.chat import ChatQuery, ChatResponse
from services.chat.generator import answer_question

router = APIRouter()


@router.post("/", response_model=ChatResponse)
async def chat(query: ChatQuery, db: AsyncSession = Depends(get_db)):
    """Instant rule-check chatbot endpoint."""
    return await answer_question(query, db)
