import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from extensions import sp
from models.auth_model import AuthModel

def setup():
    # 1. Create DPS account using Admin API (bypasses validation and auto-confirms email)
    try:
        res = sp.db_admin.auth.admin.create_user({
            "email": "dps@gmail.com",
            "password": "DPS@123",
            "email_confirm": True,
            "user_metadata": {
                "full_name": "Dewan Pengawas Syariah",
                "role": "dps",
                "phone_number": "08123456789"
            }
        })
        print("DPS account created successfully using Admin API.")
    except Exception as e:
        print("DPS account creation via Admin API error or exists:", e)

if __name__ == "__main__":
    setup()
