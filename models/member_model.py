from extensions import sp

class MemberModel:
    @staticmethod
    def create_member(user_id, data, ktp_url=None, payment_proof_url=None):
        insert_data = {
            "user_id": user_id,
            "full_name": data.get("full_name"),
            "identity_number": data.get("identity_number"),
            "family_card_number": data.get("family_card_number"), # No. KK
            "religion": data.get("religion"),
            "address": data.get("address"),
            "mother_name": data.get("mother_name"),
            "income": data.get("income"),
            "npwp": data.get("npwp"),
            "phone_number": data.get("phone_number"),
            "ktp_url": ktp_url,
            "payment_proof_url": payment_proof_url, # New field
            "contract_type": data.get("contract_type"),
            "is_contract_accepted": data.get("is_contract_accepted") in ("on", True),
            "status": "pending"
        }
        return sp.db_admin.table("members").insert(insert_data).execute()

    @staticmethod
    def get_member_by_user_id(user_id):
        res = sp.db_admin.table("members").select("*").eq("user_id", user_id).execute()
        return res.data[0] if res.data else None

    @staticmethod
    def get_all_members(query=None, roles=None):
        # Default to 'member' if roles not specified
        if roles is None:
            roles = ["member"]
            
        # Mengambil dari tabel profiles untuk melihat semua pendaftar awal
        builder = sp.db_admin.table("profiles").select("*").in_("role", roles)
        if query:
            builder = builder.or_(f"full_name.ilike.%{query}%,email.ilike.%{query}%")
        
        # Urutkan berdasarkan yang terbaru mendaftar
        return builder.order("created_at", desc=True).execute().data

    @staticmethod
    def update_status(user_id, status):
        # Update role di tabel profiles berdasarkan hasil verifikasi CS
        new_role = "member_active" if status == "active" else "member_rejected"
        sp.db_admin.table("profiles").update({"role": new_role}).eq("id", user_id).execute()
        
        # Update status di tabel members
        return sp.db_admin.table("members").update({"status": status}).eq("user_id", user_id).execute()

    @staticmethod
    def update_member_data(user_id, data):
        return sp.db_admin.table("members").update(data).eq("user_id", user_id).execute()

    @staticmethod
    def get_stats():
        # Menghitung anggota yang sudah di-ACC (role: member_active)
        res = sp.db_admin.table("profiles").select("id", count="exact").eq("role", "member_active").execute()
        return res.count if res.count is not None else 0
