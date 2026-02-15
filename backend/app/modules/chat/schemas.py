from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.modules.auth.schemas import User

class MessageBase(BaseModel):
    content: Optional[str] = None
    message_type: str = "text" # text, image, video, call
    attachment_url: Optional[str] = None

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: int
    conversation_id: int
    sender_id: int
    is_read: bool
    created_at: datetime
    sender: dict

    class Config:
        from_attributes = True

class ConversationCreate(BaseModel):
    participant_ids: List[int]

class Conversation(BaseModel):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    participants: List[dict]
    last_message: Optional[Message] = None

    class Config:
        from_attributes = True

class ContactSearch(BaseModel):
    phone_numbers: List[str] # List of phone numbers to search
