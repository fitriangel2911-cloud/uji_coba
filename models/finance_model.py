from extensions import sp

class FinanceModel:
    @staticmethod
    def create_application(data):
        """
        Dibuat oleh CS untuk rekomendasi pembiayaan.
        """
        return sp.db_admin.table("financing_applications").insert(data).execute()

    @staticmethod
    def get_applications_for_approval(role):
        """
        Mengambil daftar pengajuan berdasarkan otoritas nominal.
        """
        builder = sp.db_admin.table("financing_applications").select("*").eq("status", "recommended")
        
        if role == "bendahara":
            # Bendahara: Rp 0 - Rp 15.000.000
            builder = builder.lte("amount", 15000000)
        elif role == "manager":
            # Manager: > Rp 15.000.000
            builder = builder.gt("amount", 15000000)
        
        return builder.order("created_at", desc=True).execute().data

    @staticmethod
    def update_application_status(app_id, status, approver_id):
        """
        Update status persetujuan oleh Bendahara atau Manager.
        """
        update_data = {
            "status": status,
            "approved_by": approver_id,
            "updated_at": "now()"
        }
        return sp.db_admin.table("financing_applications").update(update_data).eq("id", app_id).execute()

    @staticmethod
    def record_cashier_transaction(data):
        """
        Mencatat setoran atau angsuran oleh CS.
        """
        return sp.db_admin.table("cashier_transactions").insert(data).execute()

    @staticmethod
    def get_applications_by_recommender(user_id):
        """
        Mengambil daftar pengajuan yang dibuat oleh CS tertentu.
        """
        return sp.db_admin.table("financing_applications").select("*").eq("recommended_by", user_id).order("created_at", desc=True).execute().data

    @staticmethod
    def get_cashier_transactions(user_id=None):
        """
        Mengambil riwayat transaksi kasir.
        """
        builder = sp.db_admin.table("cashier_transactions").select("*, members(full_name)")
        if user_id:
            builder = builder.eq("recorded_by", user_id)
        return builder.order("created_at", desc=True).execute().data

    @staticmethod
    def get_applications_for_member(member_name):
        """
        Mengambil daftar pengajuan berdasarkan nama anggota.
        """
        return sp.db_admin.table("financing_applications").select("*").eq("member_name", member_name).order("created_at", desc=True).execute().data
