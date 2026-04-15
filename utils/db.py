import os
from supabase import create_client, Client

def get_db_client() -> Client:
    """Menginisialisasi dan mereturn instance Supabase client."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    # Untuk fallback saat environment tidak benar saat dev
    if not url or not key or "your_supabase_url_here" in url:
        print("WARNING: SUPABASE_URL atau SUPABASE_KEY tidak valid/ditemukan di .env. Menggunakan Mock.")
        url = "https://mock-url.supabase.co"
        key = "mock-key"

    return create_client(url, key)

db = get_db_client()
