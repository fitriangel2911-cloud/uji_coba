import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

class SupabaseExtensions:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_KEY")
        self.service_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not self.url or not self.key:
            print("WARNING: Supabase credentials missing!")
            
        # Anon Client (Common operations, subject to RLS)
        self.db: Client = create_client(self.url, self.key) if self.url and self.key else None
        
        # Admin Client (Service Role, bypasses RLS)
        self.db_admin: Client = create_client(self.url, self.service_key or self.key) if self.url and (self.service_key or self.key) else None

sp = SupabaseExtensions()
supabase = sp.db
supabase_admin = sp.db_admin
