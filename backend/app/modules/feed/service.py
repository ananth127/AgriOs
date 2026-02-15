from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from . import models, schemas
from app.modules.auth import models as auth_models

def create_post(db: Session, post: schemas.PostCreate, user_id: int):
    new_post = models.Post(
        user_id=user_id,
        content=post.content,
        image_url=post.image_url
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post

def get_feed(db: Session, user_id: int, skip: int = 0, limit: int = 20):
    posts = db.query(models.Post).order_by(desc(models.Post.created_at)).offset(skip).limit(limit).all()
    
    feed_posts = []
    for post in posts:
        # Check if current user liked this post
        is_liked = db.query(models.Like).filter(
            models.Like.post_id == post.id,
            models.Like.user_id == user_id
        ).first() is not None
        
        # Count likes and shares
        likes_count = db.query(func.count(models.Like.id)).filter(models.Like.post_id == post.id).scalar()
        shares_count = db.query(func.count(models.Share.id)).filter(models.Share.post_id == post.id).scalar()
        
        # Prepare response object manually or use Pydantic `from_orm` after enhancing the object
        post_response = {
            "id": post.id,
            "user_id": post.user_id,
            "content": post.content,
            "image_url": post.image_url,
            "created_at": post.created_at,
            "updated_at": post.updated_at,
            "author": post.author, # Relationship
            "comments": post.comments, # Relationship
            "likes_count": likes_count,
            "shares_count": shares_count,
            "is_liked": is_liked
        }
        feed_posts.append(post_response)
        
    return feed_posts

def create_comment(db: Session, comment: schemas.CommentCreate, user_id: int):
    new_comment = models.Comment(
        post_id=comment.post_id,
        user_id=user_id,
        content=comment.content
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    # Create notification for post owner if it's not their own comment
    post = db.query(models.Post).get(comment.post_id)
    if post.user_id != user_id:
        create_notification(db, recipient_id=post.user_id, actor_id=user_id, type="comment", message="commented on your post", related_id=post.id)
        
    return new_comment

def like_post(db: Session, post_id: int, user_id: int):
    existing_like = db.query(models.Like).filter(
        models.Like.post_id == post_id,
        models.Like.user_id == user_id
    ).first()
    
    if existing_like:
        db.delete(existing_like)
        db.commit()
        return False # unliked
    else:
        new_like = models.Like(post_id=post_id, user_id=user_id)
        db.add(new_like)
        db.commit()
        
        # Notify post owner
        post = db.query(models.Post).get(post_id)
        if post.user_id != user_id:
            create_notification(db, recipient_id=post.user_id, actor_id=user_id, type="like", message="liked your post", related_id=post.id)
            
        return True # liked

def share_post(db: Session, post_id: int, user_id: int):
    # Logic for sharing could be complex (reposting), for now just a counter/record
    new_share = models.Share(post_id=post_id, user_id=user_id)
    db.add(new_share)
    db.commit()
    
    # Notify post owner
    post = db.query(models.Post).get(post_id)
    if post.user_id != user_id:
        create_notification(db, recipient_id=post.user_id, actor_id=user_id, type="share", message="shared your post", related_id=post.id)
        
    return True

def create_notification(db: Session, recipient_id: int, actor_id: int, type: str, message: str, related_id: int = None):
    notif = models.Notification(
        user_id=recipient_id,
        actor_id=actor_id,
        type=type,
        message=message,
        related_id=related_id
    )
    db.add(notif)
    db.commit()

def get_notifications(db: Session, user_id: int, skip: int = 0, limit: int = 20):
    return db.query(models.Notification).filter(models.Notification.user_id == user_id).order_by(desc(models.Notification.created_at)).offset(skip).limit(limit).all()

def mark_notification_read(db: Session, notif_id: int, user_id: int):
    notif = db.query(models.Notification).filter(models.Notification.id == notif_id, models.Notification.user_id == user_id).first()
    if notif:
        notif.is_read = True
        db.commit()
        return True
    return False
