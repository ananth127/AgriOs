from typing import Optional
from app.core.config import settings
import requests
import base64

class SMSClient:
    def __init__(self):
        self.sid = settings.TWILIO_ACCOUNT_SID
        self.token = settings.TWILIO_AUTH_TOKEN
        self.from_number = settings.SMS_FROM_NUMBER
        self.enabled = bool(self.sid and self.token and self.from_number)

    def send_message(self, to_number: str, body: str) -> bool:
        """
        Sends an SMS via Twilio API.
        Returns True if successful (queued or sent), False otherwise.
        """
        if not self.enabled:
            print(f"⚠️ SMS Gateway Not Configured. Mock Send: To {to_number}: {body}")
            return False

        url = f"https://api.twilio.com/2010-04-01/Accounts/{self.sid}/Messages.json"
        
        try:
            response = requests.post(
                url,
                data={
                    "To": to_number,
                    "From": self.from_number,
                    "Body": body,
                },
                auth=(self.sid, self.token),
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                print(f"✅ SMS Sent to {to_number}")
                return True
            else:
                print(f"❌ SMS Failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ SMS Exception: {e}")
            return False

client = SMSClient()
