
from sqlalchemy import create_engine, text
from app.core.config import settings
from load_env import load_env_with_decryption

def inspect_farms():
    load_env_with_decryption()
    print(f"Connecting to: {settings.DATABASE_URL.split('@')[-1]}") 
    engine = create_engine(str(settings.DATABASE_URL))
    with engine.connect() as conn:
        print("Checking 'farms' table:")
        farms = conn.execute(text("SELECT id, name, owner_id FROM farms;")).fetchall()
        print(farms)

if __name__ == "__main__":
    inspect_farms()
