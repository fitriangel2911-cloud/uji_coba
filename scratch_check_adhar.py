import sys
from extensions import sp

def check():
    print("=== PROFILES ===")
    profiles = sp.db_admin.table("profiles").select("*").execute().data
    adhar_profiles = [p for p in profiles if 'adhar' in str(p.get('full_name', '')).lower() or 'adhar' in str(p.get('email', '')).lower()]
    for p in adhar_profiles:
        print(p)
        
    print("\n=== MEMBERS ===")
    members = sp.db_admin.table("members").select("*").execute().data
    adhar_members = [m for m in members if 'adhar' in str(m.get('full_name', '')).lower()]
    for m in adhar_members:
        print(m)

if __name__ == "__main__":
    check()
