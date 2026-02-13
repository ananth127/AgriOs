import os
import sys
import json
from sqlalchemy import create_engine, text

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import local load_env module to load environment variables
try:
    import load_env
    # Load environment variables into os.environ
    print("Loading environment variables...")
    # We use load_plain_env as we see a .env file is being used
    env_vars = load_env.load_plain_env()
    if env_vars:
        for key, value in env_vars.items():
            os.environ[key] = value
        print("Environment variables loaded.")
    else:
        print("No variables loaded from .env (it might be empty or missing).")
except ImportError:
    print("Warning: Could not import load_env.py. Relying on existing environment variables.")

# Now import settings, which will read the updated os.environ
try:
    from app.core.config import settings
except ImportError as e:
    print(f"Error importing settings: {e}")
    sys.exit(1)

def retrieve_users():
    """
    Connect to PostgreSQL and retrieve all user details.
    """
    database_url = settings.DATABASE_URL
    
    if not database_url:
        print("Error: DATABASE_URL not found in settings.")
        return

    print(f"Using Database URL: {database_url}")
    
    # Simple check to warn if it's the default SQLite
    if "sqlite" in database_url and "postgres" not in database_url:
        print("Warning: The URL suggests SQLite is being used.")
        print("If you intend to use PostgreSQL, ensure DATABASE_URL is set in your .env file.")

    try:
        engine = create_engine(database_url)
        with engine.connect() as connection:
            print("Connected to database successfully.")
            
            # Query to get all columns from users table
            query = text("SELECT * FROM users")
            result = connection.execute(query)
            
            rows = result.fetchall()
            print(f"Retrieved {len(rows)} users from the 'users' table.")
            print("=" * 100)
            
            if not rows:
                print("No users found.")
                return

            # Get column names from the result keys
            columns = result.keys()
            
            # Print a formatted table header
            # We'll pick a few common columns for the table view
            header_format = "{:<5} | {:<30} | {:<20} | {:<15} | {:<10}"
            print(header_format.format("ID", "Email", "Full Name", "Role", "Active"))
            print("-" * 100)
            
            for row in rows:
                row_dict = row._mapping
                uid = str(row_dict.get('id', 'N/A'))
                email = str(row_dict.get('email', 'N/A'))
                name = str(row_dict.get('full_name', 'N/A'))
                role = str(row_dict.get('role', 'N/A'))
                active = str(row_dict.get('is_active', 'N/A'))
                
                # Truncate long emails/names for display
                if len(email) > 28: email = email[:25] + "..."
                if len(name) > 18: name = name[:15] + "..."
                
                print(header_format.format(uid, email, name, role, active))

            print("=" * 100)
            
            # Print full details of all users in JSON format (optional, or just the first/last)
            # The user asked to "see the users details", which might imply full schema.
            print("\nFull details (JSON format):")
            all_users_data = []
            for row in rows:
                user_dict = dict(row._mapping)
                # Handle datetime serialization
                for k, v in user_dict.items():
                    if hasattr(v, 'isoformat'):
                        user_dict[k] = v.isoformat()
                all_users_data.append(user_dict)
            
            print(json.dumps(all_users_data, indent=4, default=str))

    except Exception as e:
        print(f"An error occurred while connecting or querying: {e}")

if __name__ == "__main__":
    retrieve_users()
