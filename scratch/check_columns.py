import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from extensions import sp

def check():
    print("Mengecek kolom tabel members...")
    res = sp.db_admin.table('members').select('*').limit(1).execute()
    if res.data:
        print("Kolom yang ada:", list(res.data[0].keys()))
    else:
        print("Tidak ada data di tabel members, tidak bisa mendapatkan kolom.")

if __name__ == "__main__":
    check()
