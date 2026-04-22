from extensions import sp

class MemberModel:
    @staticmethod
    def create_member(user_id, data, ktp_url=None):
        insert_data = {
            "user_id": user_id,
            "full_name": data.get("full_name"),
            "identity_number": data.get("identity_number"),
            "address": data.get("address"),
            "phone_number": data.get("phone_number"),
            "ktp_url": ktp_url,
            "contract_type": data.get("contract_type"),
            "is_contract_accepted": data.get("is_contract_accepted") in ("on", True),
            "status": "pending"
        }
        return sp.db.table("members").insert(insert_data).execute()

    @staticmethod
    def get_member_by_user_id(user_id):
        res = sp.db.table("members").select("*").eq("user_id", user_id).execute()
        return res.data[0] if res.data else None

    @staticmethod
    def get_all_members(query=None):
        builder = sp.db.table("members").select("*")
        if query:
            builder = builder.or_(f"full_name.ilike.%{query}%,identity_number.ilike.%{query}%")
        return builder.order("submission_date", desc=True).execute().data

    @staticmethod
    def update_status(member_id, status):
        return sp.db_admin.table("members").update({"status": status}).eq("id", member_id).execute()

    @staticmethod
    def get_stats():
        res = sp.db.table("members").select("id", count="exact").eq("status", "active").execute()
        return res.count if res.count is not None else 0
