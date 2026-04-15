import sys
import importlib.metadata
import os
from supabase import create_client

def check_versions():
    pkgs = ['supabase', 'postgrest', 'httpx', 'gotrue', 'storage3']
    print("--- RUNTIME PACKAGE VERSIONS ---")
    for p in pkgs:
        try:
            version = importlib.metadata.version(p)
            print(f"{p}: {version}")
        except importlib.metadata.PackageNotFoundError:
            print(f"{p}: NOT FOUND")
            
    print("\n--- TESTING INITIALIZATION ---")
    try:
        url = "https://example.supabase.co"
        key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.sWN6hlEY05DWLY4gSapzJFO9avruEUrNGtL3d_30nXk"
        c = create_client(url, key)
        print("[SUCCESS] Client initialized successfully!")
    except Exception as e:
        print(f"[FAIL] Initialization error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_versions()
