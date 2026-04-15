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
    
    return create_client(url, key)

# Instance database global untuk kemudahan import di modul lain
db = get_supabase_client()

def get_members(query=None):
    """
    Mengambil data anggota dari tabel members.
    Mendukung pencarian berdasarkan Nama atau NIK jika parameter query diberikan.
    """
    supabase = get_supabase_client()
    try:
        builder = supabase.table("members").select("*")
        
        if query:
            # Pencarian sederhana NIK atau Nama
            builder = builder.or_(f"full_name.ilike.%{query}%,identity_number.ilike.%{query}%")
            
        response = builder.order("submission_date", desc=True).execute()
        return response.data
    except Exception as e:
        print(f"Error fetching members: {e}")
        return []

def get_member_stats():
    """Menghitung total anggota aktif"""
    supabase = get_supabase_client()
    try:
        response = supabase.table("members").select("id", count="exact").eq("status", "active").execute()
        return response.count if response.count is not None else 0
    except Exception as e:
        print(f"Error fetching member stats: {e}")
        return 0

def create_member(data, file_ktp=None):
    """
    Menyimpan anggota baru ke database dengan informasi Akad.
    """
    supabase = get_supabase_client()
    ktp_url = None

    if file_ktp:
        try:
            # Pengecekan ukuran file (Maksimal 2MB)
            file_ktp.seek(0, os.SEEK_END)
            file_size = file_ktp.tell()
            file_ktp.seek(0) # Reset pointer
            
            if file_size > 2 * 1024 * 1024:
                print("DEBUG: File KTP terlalu besar (> 2MB)")
                return None

            # Generate unique filename
            file_ext = file_ktp.filename.split('.')[-1]
            file_name = f"{data.get('identity_number')}_{int(os.path.getmtime(__file__))}.{file_ext}"
            
            # Read file content
            file_content = file_ktp.read()
            
            # Upload to Supabase Storage
            storage_res = supabase.storage.from_("ktp-images").upload(
                path=file_name,
                file=file_content,
                file_options={"content-type": file_ktp.content_type}
            )
            
            # Get Public URL
            ktp_url = supabase.storage.from_("ktp-images").get_public_url(file_name)
        except Exception as e:
            print(f"Error uploading KTP: {e}")

    # Prepare insert data
    insert_data = {
        "full_name": data.get("full_name"),
        "identity_number": data.get("identity_number"),
        "address": data.get("address"),
        "phone_number": data.get("phone_number"),
        "ktp_url": ktp_url,
        "contract_type": data.get("contract_type"),
        "is_contract_accepted": data.get("is_contract_accepted") == "on",
        "status": "pending"
    }
    
    try:
        # Mencoba memasukkan data ke tabel members
        response = supabase.table("members").insert(insert_data).execute()
        return response.data
    except Exception as e:
        # Logging error detail untuk membantu diagnosa jika gagal (misal RLS blocked)
        print(f"DEBUG: Pendaftaran Gagal! Detail Error: {e}")
        return None

def update_member_status(member_id, status):
    """Mengupdate status anggota (active/rejected)"""
    supabase = get_supabase_client()
    try:
        response = supabase.table("members").update({"status": status}).eq("id", member_id).execute()
        return response.data
    except Exception as e:
        print(f"Error updating member status: {e}")
        return None

def log_journal_entry(data):
    supabase = get_supabase_client()
    try:
        res = supabase.table("journal_entries").insert(data).execute()
        return res
    except Exception as e:
        print(f"Error logging journal: {e}")
        return None
