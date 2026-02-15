from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.modules.auth import dependencies as auth_deps
from app.modules.auth import schemas as auth_schemas
from . import schemas, service

router = APIRouter()

@router.get("/conversations", response_model=List[schemas.Conversation])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: auth_schemas.User = Depends(auth_deps.get_current_user)
):
    return service.get_conversations(db=db, user_id=current_user.id)

@router.post("/conversations", response_model=schemas.Conversation) # Simplified response
def create_conversation(
    conv: schemas.ConversationCreate,
    db: Session = Depends(get_db),
    current_user: auth_schemas.User = Depends(auth_deps.get_current_user)
):
    return service.create_conversation(db=db, participant_ids=conv.participant_ids, current_user_id=current_user.id)

@router.get("/conversations/{conversation_id}/messages", response_model=List[schemas.Message])
def get_messages(
    conversation_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: auth_schemas.User = Depends(auth_deps.get_current_user)
):
    return service.get_messages(db=db, conversation_id=conversation_id, user_id=current_user.id, skip=skip, limit=limit)

@router.post("/conversations/{conversation_id}/messages", response_model=schemas.Message)
def send_message(
    conversation_id: int,
    message: schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: auth_schemas.User = Depends(auth_deps.get_current_user)
):
    return service.send_message(db=db, conversation_id=conversation_id, sender_id=current_user.id, message=message)

@router.get("/contacts/search", response_model=List[auth_schemas.User]) # Simplified user response
def search_contacts(
    q: str,
    db: Session = Depends(get_db),
    current_user: auth_schemas.User = Depends(auth_deps.get_current_user)
):
    return service.search_contacts(db=db, query=q)

@router.post("/contacts/sync", response_model=List[auth_schemas.User])
def sync_contacts(
    data: schemas.ContactSearch,
    db: Session = Depends(get_db),
    current_user: auth_schemas.User = Depends(auth_deps.get_current_user)
):
    return service.sync_contacts(db=db, phone_numbers=data.phone_numbers)
