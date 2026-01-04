#!/usr/bin/env python3
"""
Encrypt/Decrypt .env files for secure storage
Usage:
    python encrypt_env.py encrypt    # Encrypt .env to .env.enc
    python encrypt_env.py decrypt    # Decrypt .env.enc to .env
"""

import os
import sys
import getpass
import base64
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


def encrypt_file(input_file: str, output_file: str, password: str):
    """Encrypt a file using password-based encryption"""
    # Generate random salt
    salt = os.urandom(16)
    
    # Derive key from password
    key = derive_key(password, salt)
    fernet = Fernet(key)
    
    # Read input file
    with open(input_file, 'rb') as f:
        data = f.read()
    
    # Encrypt data
    encrypted_data = fernet.encrypt(data)
    
    # Write salt + encrypted data
    with open(output_file, 'wb') as f:
        f.write(salt + encrypted_data)
    
    print(f"✅ Encrypted {input_file} → {output_file}")


def decrypt_file(input_file: str, output_file: str, password: str):
    """Decrypt a file using password-based encryption"""
    # Read encrypted file
    with open(input_file, 'rb') as f:
        data = f.read()
    
    # Extract salt and encrypted data
    salt = data[:16]
    encrypted_data = data[16:]
    
    # Derive key from password
    key = derive_key(password, salt)
    fernet = Fernet(key)
    
    try:
        # Decrypt data
        decrypted_data = fernet.decrypt(encrypted_data)
        
        # Write decrypted file
        with open(output_file, 'wb') as f:
            f.write(decrypted_data)
        
        print(f"✅ Decrypted {input_file} → {output_file}")
        return True
    
    except Exception as e:
        print(f"❌ Decryption failed: {e}")
        print("Incorrect password or corrupted file")
        return False


def main():
    if len(sys.argv) < 2:
        print("Usage: python encrypt_env.py [encrypt|decrypt]")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "encrypt":
        # Encrypt .env to .env.enc
        if not os.path.exists('.env'):
            print("❌ .env file not found!")
            sys.exit(1)
        
        password = getpass.getpass("Enter encryption password: ")
        confirm = getpass.getpass("Confirm password: ")
        
        if password != confirm:
            print("❌ Passwords don't match!")
            sys.exit(1)
        
        encrypt_file('.env', '.env.enc', password)
        print("\n⚠️  IMPORTANT:")
        print("1. Keep .env.enc in your repository")
        print("2. Add .env to .gitignore (never commit plain .env)")
        print("3. Remember your password - you'll need it to decrypt!")
    
    elif command == "decrypt":
        # Decrypt .env.enc to .env
        if not os.path.exists('.env.enc'):
            print("❌ .env.enc file not found!")
            sys.exit(1)
        
        password = getpass.getpass("Enter decryption password: ")
        
        if decrypt_file('.env.enc', '.env', password):
            print("\n✅ .env file ready to use!")
        else:
            sys.exit(1)
    
    else:
        print(f"❌ Unknown command: {command}")
        print("Usage: python encrypt_env.py [encrypt|decrypt]")
        sys.exit(1)


if __name__ == "__main__":
    main()
