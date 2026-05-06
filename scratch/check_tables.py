import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from extensions import sp

def check_tables():
    tables = ['demo_profiles', 'demo_tracking', 'profiles', 'members', 'member_payments']
    print("Mengecek ketersediaan tabel di Supabase...")
    for t in tables:
        try:
            sp.db_admin.table(t).select('id').limit(1).execute()
            print(f"✅ Tabel '{t}' ADA.")
        except Exception as e:
            if "column" in str(e):
                print(f"✅ Tabel '{t}' ADA (Error kolom id tidak ada, tapi tabel terdeteksi).")
            else:
                print(f"❌ Tabel '{t}' TIDAK ADA atau Error: {e}")

if __name__ == "__main__":
    check_tables()
