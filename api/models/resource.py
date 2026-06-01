from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import text
from database import Base


class Resource(Base):
    __tablename__ = "resources"

    id = Column(UUID(as_uuid=False), primary_key=True, server_default=text("uuid_generate_v4()"))
    title = Column(String(200), nullable=False)
    body = Column(Text, nullable=False)
    resource_type = Column(String(30), nullable=False, server_default="tip")
    sport = Column(String(50), nullable=True)
    tags = Column(JSONB, nullable=False, server_default=text("'[]'"))
    is_featured = Column(Boolean, nullable=False, server_default=text("false"))
    read_time_minutes = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))


class SavedItem(Base):
    __tablename__ = "saved_items"

    id = Column(UUID(as_uuid=False), primary_key=True, server_default=text("uuid_generate_v4()"))
    item_type = Column(String(30), nullable=False)
    item_id = Column(UUID(as_uuid=False), nullable=False)
    title = Column(String(300), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
