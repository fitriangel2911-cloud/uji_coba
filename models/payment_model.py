from extensions import supabase, sp

class PaymentModel:
    @staticmethod
    def get_member_payments(user_id):
        """Mengambil semua riwayat pembayaran milik anggota"""
        try:
            response = sp.db_admin.table('member_payments')\
                .select('*')\
                .eq('user_id', user_id)\
                .order('created_at', desc=True)\
                .execute()
            return response.data
        except Exception as e:
            print(f"Error fetching payments: {e}")
            return []

    @staticmethod
    def get_pending_payments():
        """Mengambil semua pembayaran online yang pending (Untuk diverifikasi CS)"""
        try:
            # We also need member info. Supabase allows nested select if foreign keys are set.
            response = sp.db_admin.table('member_payments')\
                .select('*, members(full_name, user_id)')\
                .eq('status', 'pending')\
                .order('created_at', desc=True)\
                .execute()
            return response.data
        except Exception as e:
            print(f"Error fetching pending payments: {e}")
            return []

    @staticmethod
    def approve_payment(payment_id):
        """Menyetujui pembayaran (Ubah status jadi lunas)"""
        try:
            return sp.db_admin.table('member_payments').update({"status": "lunas"}).eq('id', payment_id).execute()
        except Exception as e:
            print(f"Error approving payment: {e}")
            return None

    @staticmethod
    def create_payment(user_id, data):
        """Mencatat pengajuan pembayaran baru oleh anggota"""
        try:
            insert_data = {
                "user_id": user_id,
                "payment_type": data.get("payment_type"),
                "amount": float(data.get("amount")) if data.get("amount") else 0.0,
                "payment_month": data.get("payment_month"),
                "proof_url": data.get("proof_url"),
                "status": "pending"
            }
            res = sp.db_admin.table('member_payments').insert(insert_data).execute()
            return True, "Berhasil"
        except Exception as e:
            print(f"Error creating payment: {e}")
            return False, str(e)

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
                        # Kurangi biaya administrasi Rp 5.000 & Infak Rp 10.000 dari total bayar Rp 2.015.000
                        saving_part = amount - 15000.0 if amount >= 15000.0 else amount
                        summary['pokok'] += saving_part
                        summary['total_aset'] += saving_part
                    elif p['payment_type'].lower() == 'wajib':
                        # Kurangi biaya administrasi Rp 5.000 & Infak Rp 10.000 dari iuran wajib bulanan Rp 115.000
                        saving_part = amount - 15000.0 if amount >= 15000.0 else amount
                        summary['wajib'] += saving_part
                        summary['total_aset'] += saving_part
                    elif p['payment_type'].lower() == 'gabungan':
                        # Gabungan Pokok (Rp 2jt) + Wajib (Rp 100rb) + Adm (Rp 5rb) + Infak (Rp 10rb) = Rp 2.115.000
                        summary['pokok'] += 2000000.0
                        summary['wajib'] += 100000.0
                        summary['total_aset'] += 2100000.0
                    else:
                        summary['total_aset'] += amount
            
            return summary
        except Exception as e:
            print(f"Error calculating summary: {e}")
            return {'pokok': 0, 'wajib': 0, 'total_aset': 0}
