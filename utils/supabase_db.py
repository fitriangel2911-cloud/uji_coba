import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.getenv("SUPABASE_URL", "")
key: str = os.getenv("SUPABASE_KEY", "")

def get_supabase_client() -> Client:
    """
    Menginisialisasi dan mengembalikan klien Supabase.
    Pastikan SUPABASE_URL dan SUPABASE_KEY sudah diisi di file .env.
    """
    if not url or not key:
        print("Peringatan: Kredensial Supabase belum diatur di .env")
        # Dalam produksi, ini harus menaikkan exception
    
    return create_client(url, key)

# Contoh penggunaan pencatatan jurnal (Murabahah, dll)
def log_journal_entry(data):
    supabase = get_supabase_client()
    # Logika untuk memasukkan data ke tabel journal_entries
    # res = supabase.table("journal_entries").insert(data).execute()
    # return res
    pass
