from typing import List, Optional
from pydantic import BaseModel

class ActiveOperation(BaseModel):
    id: str
    name: str 
    type: str 
    status: str 
    details: str 
    duration: Optional[str] = None 

class Suggestion(BaseModel):
    id: str
    title: str 
    reason: str 
    severity: str 
    action_link: str 

class RealtimeDashboardResponse(BaseModel):
    summary_text: str 
    active_operations: List[ActiveOperation]
    suggestions: List[Suggestion]
