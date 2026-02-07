import os
import sys
from sqlalchemy import create_engine, text
from app.core.config import settings

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Use the database URL
database_url = "postgresql://postgres.uhqjgahpxhcenzpmgjrr:2c%UH5-sQukJLMN@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"

print(f"Connecting to: {database_url}")
engine = create_engine(database_url)

with engine.connect() as connection:
    query = text("SELECT id, email, full_name, role FROM users ORDER BY id")
    result = connection.execute(query).fetchall()
    print("\nUsers found:")
    for row in result:
        print(f"ID: {row.id}, Email: {row.email}, Name: {row.full_name}, Role: {row.role}")
