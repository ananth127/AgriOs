
from pydantic import BaseModel, EmailStr, ValidationError

class User(BaseModel):
    email: EmailStr

try:
    User(email="9876543210@agri.local")
    print("Email valid")
except ValidationError as e:
    print(f"Email invalid: {e}")
