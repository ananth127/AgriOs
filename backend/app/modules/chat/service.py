from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func, or_
from . import models, schemas
from app.modules.auth import models as auth_models

def get_conversations(db: Session, user_id: int):
    subquery = db.query(models.Participant.conversation_id).filter(models.Participant.user_id == user_id).subquery()
    
    conversations = db.query(models.Conversation)\
        .filter(models.Conversation.id.in_(subquery))\
        .options(joinedload(models.Conversation.participants).joinedload(models.Participant.user))\
        .all()
        
    result = []
    for conv in conversations:
        last_msg = db.query(models.Message).filter(models.Message.conversation_id == conv.id).order_by(desc(models.Message.created_at)).first()
        participants = []
        for p in conv.participants:
            participants.append({
                "id": p.user.id,
                "full_name": p.user.full_name,
                "role": p.user.role,
                "avatar": None # Placeholder
            })
            
        conv_data = {
            "id": conv.id,
            "created_at": conv.created_at,
            "updated_at": conv.updated_at,
            "participants": participants,
            "last_message": last_msg
        }
        result.append(conv_data)
        
    result.sort(key=lambda x: x['last_message'].created_at if x['last_message'] else x['created_at'], reverse=True)
    return result

def get_messages(db: Session, conversation_id: int, user_id: int, skip: int = 0, limit: int = 50):
    is_participant = db.query(models.Participant).filter(
        models.Participant.conversation_id == conversation_id,
        models.Participant.user_id == user_id
    ).first()
    
    if not is_participant:
        return []

    return db.query(models.Message)\
        .filter(models.Message.conversation_id == conversation_id)\
        .order_by(desc(models.Message.created_at))\
        .offset(skip).limit(limit).all()

def create_conversation(db: Session, participant_ids: list[int], current_user_id: int):
    # Basic check for existing 1-on-1 (simplified)
    if len(participant_ids) == 1:
        partner_id = participant_ids[0]
        # Implementation of finding existing conversation omitted for brevity, creating new always for now
        pass

    db_conv = models.Conversation()
    db.add(db_conv)
    db.commit()
    db.refresh(db_conv)

    db.add(models.Participant(conversation_id=db_conv.id, user_id=current_user_id))
    for pid in participant_ids:
        if pid != current_user_id:
            db.add(models.Participant(conversation_id=db_conv.id, user_id=pid))
            
    db.commit()
    return db_conv

def send_message(db: Session, conversation_id: int, sender_id: int, message: schemas.MessageCreate):
    msg = models.Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        content=message.content,
        message_type=message.message_type,
        attachment_url=message.attachment_url
    )
    db.add(msg)
    
    conv = db.query(models.Conversation).get(conversation_id)
    conv.updated_at = func.now()
    
    db.commit()
    db.refresh(msg)
    return msg

def search_contacts(db: Session, query: str):
    # Search by Name, UniqueID (Phone), or Profile ID
    # Assuming unique_id logic: 2 digitt country code + phone
    # Or strict check against phone_number column
    
    results = db.query(auth_models.User).filter(
        or_(
            auth_models.User.full_name.ilike(f"%{query}%"),
            auth_models.User.phone_number.ilike(f"%{query}%"),
            # auth_models.User.user_unique_id.ilike(f"%{query}%") # If this column exists and is populated
        )
    ).limit(10).all()
    
    return results

def sync_contacts(db: Session, phone_numbers: list[str]):
    # Find users whose phone numbers are in the list
    # Normalize phone numbers if needed (strip +, spaces)
    results = db.query(auth_models.User).filter(
        auth_models.User.phone_number.in_(phone_numbers)
    ).all()
    return results
