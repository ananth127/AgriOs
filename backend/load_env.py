#!/usr/bin/env python3
"""
Runtime .env decryption loader with DEV mode support

DEV Mode:
- DEV=true  (Development) → Use encrypted .env.enc with password prompt
- DEV=false (Production)  → Use plain .env file (set by platform)
"""

import os
import sys
import getpass
import base64
from pathlib import Path
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


def derive_key(password: str, salt: bytes) -> bytes:
    """Derive encryption key from password using PBKDF2"""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = kdf.derive(password.encode())
    # Fernet requires base64-encoded key
    return base64.urlsafe_b64encode(key)


def is_dev_mode() -> bool:
    """
    Check if running in development mode
    
    Returns:
        True if DEV=true (development), False otherwise (production)
    """
    dev = os.getenv('DEV', 'true').lower()
    
    # Render automatically sets RENDER=true
    if os.getenv('RENDER'):
        return False
        
    return dev in ('true', '1', 'yes', 'on')


def load_plain_env() -> dict:
    """
    Load plain .env file (Production mode)
    
    Returns:
        Dictionary of environment variables
    """
    env_path = Path('.env')
    env_vars = {}
    
    if not env_path.exists():
        print("⚠️  .env file not found!")
        return {}
    
    try:
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                # Skip empty lines and comments
                if not line or line.startswith('#'):
                    continue
                
                # Parse KEY=VALUE
                if '=' in line:
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip()
                    
                    # Remove quotes if present
                    if value.startswith('"') and value.endswith('"'):
                        value = value[1:-1]
                    elif value.startswith("'") and value.endswith("'"):
                        value = value[1:-1]
                    
                    env_vars[key] = value
        
        print(f"✅ Loaded {len(env_vars)} variables from .env (production mode)")
        return env_vars
    
    except Exception as e:
        print(f"❌ Failed to load .env: {e}")
        return {}


def decrypt_env_to_memory(password: str = None) -> dict:
    """
    Decrypt .env.enc directly into memory (Development mode)
    
    Args:
        password: Decryption password (if None, will prompt)
    
    Returns:
        Dictionary of environment variables
    """
    env_enc_path = Path('.env.enc')
    
    # Check if .env.enc exists
    if not env_enc_path.exists():
        print("⚠️  .env.enc file not found!")
        return {}
    
    # Get password from environment variable or prompt
    if password is None:
        password = os.getenv('ENV_PASSWORD')
    
    if password is None:
        # Always prompt for password (more secure)
        try:
            password = getpass.getpass("🔐 Enter .env decryption password: ")
        except Exception:
            # Fallback for environments where getpass doesn't work
            print("🔐 Enter .env decryption password: ", end='', flush=True)
            password = input()
    
    try:
        # Read encrypted file
        with open(env_enc_path, 'rb') as f:
            data = f.read()
        
        # Extract salt and encrypted data
        salt = data[:16]
        encrypted_data = data[16:]
        
        # Derive key from password
        key = derive_key(password, salt)
        fernet = Fernet(key)
        
        # Decrypt data
        decrypted_data = fernet.decrypt(encrypted_data)
        
        # Parse decrypted data into dictionary
        env_vars = {}
        for line in decrypted_data.decode('utf-8').splitlines():
            line = line.strip()
            # Skip empty lines and comments
            if not line or line.startswith('#'):
                continue
            
            # Parse KEY=VALUE
            if '=' in line:
                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip()
                
                # Remove quotes if present
                if value.startswith('"') and value.endswith('"'):
                    value = value[1:-1]
                elif value.startswith("'") and value.endswith("'"):
                    value = value[1:-1]
                
                env_vars[key] = value
        
        print(f"✅ Decrypted {len(env_vars)} variables from .env.enc (development mode)")
        return env_vars
    
    except Exception as e:
        print(f"❌ Decryption failed: {e}")
        return {}


def load_env_with_decryption():
    """
    Load environment variables based on DEV mode
    
    - DEV=true  (Development) → Use encrypted .env.enc with password
    - DEV=false (Production)  → Use plain .env file
    """
    dev_mode = is_dev_mode()
    
    if dev_mode:
        print("🔧 Running in DEVELOPMENT mode (encrypted .env.enc)")
        env_vars = decrypt_env_to_memory()
    else:
        print("🚀 Running in PRODUCTION mode (plain .env)")
        env_vars = load_plain_env()
    
    if env_vars:
        # Load variables into os.environ
        for key, value in env_vars.items():
            os.environ[key] = value
        
        print(f"✅ Loaded {len(env_vars)} environment variables into memory")
        
        # Show loaded keys (not values for security)
        print(f"📋 Variables: {', '.join(env_vars.keys())}")
    else:
        print("⚠️  No environment variables loaded")


if __name__ == "__main__":
    # Can be run standalone to test
    dev_mode = is_dev_mode()
    
    print(f"DEV mode: {dev_mode}")
    print(f"Mode: {'DEVELOPMENT (encrypted)' if dev_mode else 'PRODUCTION (plain)'}")
    print()
    
    if dev_mode:
        env_vars = decrypt_env_to_memory()
    else:
        env_vars = load_plain_env()
    
    if env_vars:
        print(f"\n✅ Successfully loaded {len(env_vars)} variables")
        print("📋 Variables:")
        for key in env_vars.keys():
            print(f"  - {key}")
        sys.exit(0)
    else:
        print("\n❌ Failed to load environment variables")
        sys.exit(1)
