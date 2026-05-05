from flask import Blueprint, render_template, request, session
from decorators import admin_required, active_member_required
from models.finance_model import FinanceModel
from models.payment_model import PaymentModel
from extensions import sp
import datetime

finance_bp = Blueprint('finance', __name__)

@finance_bp.route('/finance/apply')
@active_member_required
def apply():
    # Interface for members to apply for financing
    user_name = session.get('user_name')
    apps = FinanceModel.get_applications_for_member(user_name)
    return render_template('finance/member_apply.html', apps=apps)

@finance_bp.route('/api/finance/apply', methods=['POST'])
@active_member_required
def api_apply():
    data = {
        "member_name": session.get("user_name"),
        "amount": request.form.get("amount"),
        "contract_type": request.form.get("contract_type"),
        "purpose": request.form.get("purpose"),
        "status": "recommended", # Directly enter recommendation queue
        "recommended_by": "self"
    }
    res = FinanceModel.create_application(data)
    if res:
        return '<div class="alert-success">Pengajuan Pembiayaan Berhasil Dikirim! Mohon tunggu verifikasi.</div>'
    return '<div class="alert-error">Gagal mengirim pengajuan.</div>'

@finance_bp.route('/finance/deposit')
@active_member_required
def deposit():
    user_id = session.get('user_id')
    now_month = datetime.datetime.now().strftime("%Y-%m")
    
    # Generate 3-digit unique code based on UUID
    unique_code = int(user_id.replace('-', ''), 16) % 1000
    if unique_code == 0: unique_code = 123
        
    return render_template('finance/deposit.html', now_month=now_month, unique_code=unique_code)

@finance_bp.route('/api/finance/deposit', methods=['POST'])
@active_member_required
def api_deposit():
    user_id = session.get('user_id')
    
    # Handle Proof Upload
    proof_url = None
    if 'payment_proof' in request.files:
        file = request.files['payment_proof']
        if file.filename != '':
            try:
                ext = file.filename.split('.')[-1]
                filename = f"payment_{user_id}_{int(datetime.datetime.now().timestamp())}.{ext}"
                file_content = file.read()
                
                sp.db_admin.storage.from_("member-files").upload(
                    path=filename,
                    file=file_content,
                    file_options={"content-type": file.content_type}
                )
                proof_url = sp.db_admin.storage.from_("member-files").get_public_url(filename)
            except Exception as e:
                print(f"Upload Error: {e}")
    
    data = {
        "payment_type": request.form.get("payment_type"),
        "amount": request.form.get("amount"),
        "payment_month": request.form.get("payment_month"),
        "proof_url": proof_url
    }
    
    success, err_msg = PaymentModel.create_payment(user_id, data)
    if success:
        return '<div class="alert-success" style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; color: #10b981; padding: 1rem; border-radius: 8px;">✅ Bukti pembayaran berhasil dikirim! Mohon tunggu verifikasi Admin.</div>'
    return f'<div class="alert-error" style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; color: #fca5a5; padding: 1rem; border-radius: 8px;">❌ Gagal mengirim bukti pembayaran.<br><small>{err_msg}</small></div>'

@finance_bp.route('/finance')
@admin_required
def index():
    # Regular finance index (ledger/journals)
    return render_template('finance/index.html')

@finance_bp.route('/finance/kasir')
@admin_required
def kasir():
    # Interface for CS to record deposits & verify online payments
    user_id = session.get('user_id')
    history = FinanceModel.get_cashier_transactions(user_id)
    pending_payments = PaymentModel.get_pending_payments()
    
    # Menambahkan unique code ke data pending agar CS bisa melihatnya
    for p in pending_payments:
        if p.get('user_id'):
            ucode = int(p['user_id'].replace('-', ''), 16) % 1000
            p['unique_code'] = 123 if ucode == 0 else ucode
            
    return render_template('finance/kasir.html', history=history, pending_payments=pending_payments)

@finance_bp.route('/finance/financing')
@admin_required
def financing():
    # Interface for CS to recommend financing
    user_id = session.get('user_id')
    recommendations = FinanceModel.get_applications_by_recommender(user_id)
    return render_template('finance/financing.html', recommendations=recommendations)

@finance_bp.route('/finance/approvals')
@admin_required
def approvals():
    # Interface for Bendahara & Manager to approve
    role = session.get('role')
    apps = FinanceModel.get_applications_for_approval(role)
    return render_template('finance/approvals.html', apps=apps, role=role)

@finance_bp.route('/api/finance/kasir', methods=['POST'])
@admin_required
def api_kasir():
    data = {
        "member_id": request.form.get("member_id"),
        "amount": request.form.get("amount"),
        "transaction_type": request.form.get("type"),
        "recorded_by": session.get("user_id")
    }
    res = FinanceModel.record_cashier_transaction(data)
    if res:
        return '<div class="alert-success">Setoran berhasil dicatat!</div>'
    return '<div class="alert-error">Gagal mencatat setoran.</div>'

@finance_bp.route('/api/finance/verify_payment', methods=['POST'])
@admin_required
def api_verify_payment():
    payment_id = request.form.get("payment_id")
    res = PaymentModel.approve_payment(payment_id)
    if res:
        return '<span style="color: #10b981; font-weight: 700; font-size: 0.8rem;">✅ Terverifikasi</span>'
    return '<span style="color: #ef4444; font-weight: 700; font-size: 0.8rem;">❌ Gagal</span>'

@finance_bp.route('/api/finance/recommend', methods=['POST'])
@admin_required
def api_recommend():
    data = {
        "member_name": request.form.get("member_name"),
        "amount": request.form.get("amount"),
        "contract_type": request.form.get("contract_type"),
        "purpose": request.form.get("purpose"),
        "recommendation_note": request.form.get("recommendation_note"),
        "status": "recommended",
        "recommended_by": session.get("user_id")
    }
    res = FinanceModel.create_application(data)
    if res:
        return f'<div class="alert-success">Rekomendasi Pembiayaan Rp {int(data["amount"]):,} Berhasil Dikirim!</div>'
    return '<div class="alert-error">Gagal mengirim rekomendasi.</div>'

@finance_bp.route('/api/finance/approve', methods=['POST'])
@admin_required
def api_approve():
    app_id = request.form.get("app_id")
    status = request.form.get("status") # approved/rejected
    role = session.get('role')
    
    res = FinanceModel.update_application_status(app_id, status, session.get('user_id'))
    if res:
        apps = FinanceModel.get_applications_for_approval(role)
        return render_template('components/financing_rows.html', apps=apps, role=role)
    return '<div class="alert-error">Gagal memproses persetujuan.</div>'
