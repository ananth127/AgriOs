import random
import string

def generate_numeric_id(length=12) -> str:
    """Generates a numeric ID of specified length (default 12)."""
    return "".join(random.choices(string.digits, k=length))

def generate_alphanumeric_id(length=12) -> str:
    """
    Generates an alternating alphanumeric ID: Letter-Number-Letter-Number...
    Total length: 12 chars (L N L N L N L N L N L N)
    Example: A8B4C9D2E5F7
    """
    letters = string.ascii_uppercase
    digits = string.digits
    result = []
    
    # We want pairs of (Letter, Number) to make total length
    # If length is odd, the last char will be a Letter
    for i in range(length):
        if i % 2 == 0: # Even index (0, 2, 4...) -> Letter
            result.append(random.choice(letters))
        else: # Odd index (1, 3, 5...) -> Number
            result.append(random.choice(digits))
            
    return "".join(result)
