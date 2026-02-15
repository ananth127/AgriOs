from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.auth import dependencies as auth_deps
from app.modules.auth import schemas as auth_schemas
from . import schemas, service

router = APIRouter()

@router.post("/posts", response_model=schemas.Post)
def create_post(
    post: schemas.PostCreate,
    db: Session = Depends(get_db),
    current_user: auth_schemas.User = Depends(auth_deps.get_current_user)
):
    return service.create_post(db=db, post=post, user_id=current_user.id)

@router.get("/posts", response_model=List[schemas.Post])
def get_feed(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: auth_schemas.User = Depends(auth_deps.get_current_user)
):
    return service.get_feed(db=db, user_id=current_user.id, skip=skip, limit=limit)

@router.post("/posts/{post_id}/comments", response_model=schemas.Comment)
def create_comment(
    post_id: int,
    comment: schemas.CommentBase,
    db: Session = Depends(get_db),
    current_user: auth_schemas.User = Depends(auth_deps.get_current_user)
):
    # Construct PostCreate schema with post_id
    comment_create = schemas.CommentCreate(post_id=post_id, content=comment.content)
    return service.create_comment(db=db, comment=comment_create, user_id=current_user.id)

@router.post("/posts/{post_id}/like", response_model=bool)
def toggle_like(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: auth_schemas.User = Depends(auth_deps.get_current_user)
):
    return service.like_post(db=db, post_id=post_id, user_id=current_user.id)

@router.post("/posts/{post_id}/share", response_model=bool)
def share_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: auth_schemas.User = Depends(auth_deps.get_current_user)
):
    return service.share_post(db=db, post_id=post_id, user_id=current_user.id)

@router.get("/notifications", response_model=List[schemas.Notification])
def get_notifications(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: auth_schemas.User = Depends(auth_deps.get_current_user)
):
    return service.get_notifications(db=db, user_id=current_user.id, skip=skip, limit=limit)

@router.put("/notifications/{id}/read", response_model=bool)
def mark_notification_read(
    id: int,
    db: Session = Depends(get_db),
    current_user: auth_schemas.User = Depends(auth_deps.get_current_user)
):
    success = service.mark_notification_read(db=db, notif_id=id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return True
