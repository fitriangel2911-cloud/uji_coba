import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from extensions import sp

def check_payments():
    # Fetch all profiles to find Lina's user_id
    profiles = sp.db_admin.table("profiles").select("*").ilike("full_name", "%Lina%").execute().data
    if not profiles:
        print("Lina profile not found.")
        return
    
    print("PROFILES FOUND:")
    for p in profiles:
        print(f"Name: {p['full_name']}, ID: {p['id']}, Role: {p['role']}")
        
        # Fetch payments for this user_id
        payments = sp.db_admin.table("member_payments").select("*").eq("user_id", p['id']).execute().data
        print(f"PAYMENTS FOR {p['full_name']}:")
        for pm in payments:
            print(pm)

if __name__ == "__main__":
    check_payments()
