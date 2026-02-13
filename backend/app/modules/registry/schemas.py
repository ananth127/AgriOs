from pydantic import BaseModel
from typing import Dict, Any

class RegistryBase(BaseModel):
    name: str
    category: str
    definition: Dict[str, Any]

class RegistryCreate(RegistryBase):
    pass

class RegistryItem(RegistryBase):
    id: int

    class Config:
        from_attributes = True
