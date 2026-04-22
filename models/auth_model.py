from extensions import sp
import datetime

class AuthModel:
    @staticmethod
    def sign_up(email, password, full_name, role="member"):
        # Sign up user in Supabase Auth
        res = sp.db.auth.sign_up({
            "email": email, 
            "password": password,
            "options": {"data": {"full_name": full_name, "role": role}}
        })
        if res.user:
            # Upsert into profiles table using admin client to bypass RLS
            AuthModel.upsert_profile(res.user.id, full_name, role)
        return res

    @staticmethod
    def sign_in(email, password):
        return sp.db.auth.sign_in_with_password({"email": email, "password": password})

    @staticmethod
    def upsert_profile(user_id, full_name, role):
        return sp.db_admin.table("profiles").upsert({
            "id": user_id,
            "full_name": full_name,
            "role": role
        }).execute()

    @staticmethod
    def get_profile(user_id):
        res = sp.db.table("profiles").select("*").eq("id", user_id).execute()
        return res.data[0] if res.data else None

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
