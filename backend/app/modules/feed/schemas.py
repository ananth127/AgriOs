from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.modules.auth.schemas import UserBase 

class UserLimited(UserBase):
    id: int
    full_name: str
    role: str
    avatar: Optional[str] = None # Will add if you modify User model later, for now just placeholder

class PostBase(BaseModel):
    content: str
    image_url: Optional[str] = None

class PostCreate(PostBase):
    pass

class PostUpdate(PostBase):
    pass

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    post_id: int

class Comment(CommentBase):
    id: int
    post_id: int
    user_id: int
    created_at: datetime
    author: UserLimited

    class Config:
        from_attributes = True

class Like(BaseModel):
    id: int
    post_id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Share(BaseModel):
    id: int
    post_id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Post(PostBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    author: UserLimited
    comments: List[Comment] = []
    likes_count: int = 0
    shares_count: int = 0
    is_liked: bool = False # Whether current user liked it

    class Config:
        from_attributes = True

class NotificationBase(BaseModel):
    type: str # like, comment, share
    message: str
    related_id: Optional[int] = None

class Notification(NotificationBase):
    id: int
    user_id: int
    actor_id: int
    is_read: bool
    created_at: datetime
    actor: UserLimited

    class Config:
        from_attributes = True
