from extensions import supabase

class PaymentModel:
    @staticmethod
    def get_member_payments(user_id):
        """Mengambil semua riwayat pembayaran milik anggota"""
        try:
            response = supabase.table('member_payments')\
                .select('*')\
                .eq('user_id', user_id)\
                .order('created_at', desc=True)\
                .execute()
            return response.data
        except Exception as e:
            print(f"Error fetching payments: {e}")
            return []

    @staticmethod
    def get_savings_summary(user_id):
        """Menghitung ringkasan simpanan (Pokok, Wajib, Total Aset)"""
        try:
            payments = PaymentModel.get_member_payments(user_id)
            summary = {
                'pokok': 0,
                'wajib': 0,
                'total_aset': 0
            }
            
            for p in payments:
                if p['status'].lower() == 'lunas':
                    amount = float(p['amount'])
                    if p['payment_type'].lower() == 'pokok':
                        summary['pokok'] += amount
                    elif p['payment_type'].lower() == 'wajib':
                        summary['wajib'] += amount
                    summary['total_aset'] += amount
            
            return summary
        except Exception as e:
            print(f"Error calculating summary: {e}")
            return {'pokok': 0, 'wajib': 0, 'total_aset': 0}
