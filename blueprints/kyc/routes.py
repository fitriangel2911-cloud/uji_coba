from flask import Blueprint, render_template, request, session, redirect, url_for
from decorators import login_required, admin_required
from models.member_model import MemberModel

kyc_bp = Blueprint('kyc', __name__)

@kyc_bp.route('/kyc')
@login_required
def index():
    user_id = session.get('user_id')
    role = session.get('role')
    
    if role in ('admin', 'staff'):
        members = MemberModel.get_all_members()
        return render_template('kyc/admin_index.html', members=members)
    
    # Member view
    member = MemberModel.get_member_by_user_id(user_id)
    return render_template('kyc/member_view.html', member=member)

@kyc_bp.route('/api/kyc/submit', methods=['POST'])
@login_required
def submit():
    user_id = session.get('user_id')
    data = {
        "full_name": request.form.get("full_name"),
        "identity_number": request.form.get("identity_number"),
        "address": request.form.get("address"),
        "phone_number": request.form.get("phone_number"),
        "contract_type": request.form.get("contract_type"),
        "is_contract_accepted": request.form.get("is_contract_accepted")
    }
    # For now, we skip file upload logic to keep rebuild fast, or we can use previous logic.
    res = MemberModel.create_member(user_id, data)
    
    if res:
        return '<div class="alert-success">Data KYC berhasil dikirim! Menunggu verifikasi.</div>'
    return '<div class="alert-error">Gagal mengirim data. Coba lagi.</div>'

@kyc_bp.route('/api/kyc/verify', methods=['POST'])
@admin_required
def verify():
    member_id = request.form.get("member_id")
    status = request.form.get("status") # active/rejected
    MemberModel.update_status(member_id, status)
    
    members = MemberModel.get_all_members()
    return render_template('components/member_rows.html', members=members)
