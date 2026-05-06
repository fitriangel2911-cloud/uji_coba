from extensions import sp
import datetime

class AuthModel:
    @staticmethod
    def sign_up(email, password, full_name, phone_number, role="member", akad=None):
        try:
            # Sign up user in Supabase Auth
            # Note: Profile is now handled by Supabase Database Trigger (handle_new_user)
            res = sp.db.auth.sign_up({
                "email": email, 
                "password": password,
                "options": {
                    "data": {
                        "full_name": full_name, 
                        "role": role, 
                        "akad": akad,
                        "phone_number": phone_number
                    }
                }
            })
            print(f"DEBUG: Supabase Registration Success for {email}")
            return res
        except Exception as e:
            print(f"DEBUG: SUPABASE REGISTRATION ERROR: {str(e)}")
            raise e

    @staticmethod
    def sign_in(email, password):
        return sp.db.auth.sign_in_with_password({"email": email, "password": password})

    @staticmethod
    def upsert_profile(user_id, full_name, email, phone_number, password, role, akad=None):
        return sp.db_admin.table("profiles").upsert({
            "id": user_id,
            "full_name": full_name,
            "email": email,
            "phone_number": phone_number,
            "password": password,
            "role": role,
            "akad": akad # New akad field
        }).execute()

    @staticmethod
    def get_profile(user_id):
        try:
            res = sp.db_admin.table("profiles").select("*").eq("id", user_id).execute()
            if res.data:
                return res.data[0]
        except Exception as e:
            print(f"Error fetching profile: {e}")
        return None

    @staticmethod
    def check_demo_limit(email):
        """
        Check if a demo account has reached the login limit (max 2).
        Returns (is_allowed, login_count)
        """
        try:
            res = sp.db_admin.table("demo_tracking").select("login_count").eq("email", email).execute()
            if res.data:
                count = res.data[0]['login_count']
                return (count < 2, count)
            return (True, 0)
        except Exception:
            # Fallback if table doesn't exist
            return (True, 0)

    @staticmethod
    def increment_demo_count(email):
        try:
            # Get current count
            res = sp.db_admin.table("demo_tracking").select("login_count").eq("email", email).execute()
            if res.data:
                new_count = res.data[0]['login_count'] + 1
                sp.db_admin.table("demo_tracking").update({
                    "login_count": new_count,
                    "last_login": "now()"
                }).eq("email", email).execute()
            else:
                sp.db_admin.table("demo_tracking").insert({
                    "email": email,
                    "login_count": 1
                }).execute()
        except Exception as e:
            print(f"Error incrementing demo count: {e}")
