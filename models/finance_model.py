from extensions import sp

class FinanceModel:
    @staticmethod
    def log_journal(description, amount, type="revenue", reference=None):
        # type: revenue or expenditure
        data = {
            "description": description,
            "amount": amount,
            "transaction_type": type,
            "reference": reference or f"TRX-{sp.db.auth.get_user().user.id[:8]}"
        }
        return sp.db.table("journal_entries").insert(data).execute()

    @staticmethod
    def get_recent_journals(limit=10):
        return sp.db.table("journal_entries").select("*").order("created_at", desc=True).limit(limit).execute().data
