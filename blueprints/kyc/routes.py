from flask import Blueprint, render_template, request, session, redirect, url_for
from decorators import login_required, admin_required
from models.member_model import MemberModel
from extensions import sp
from models.saran_model import SaranModel
import datetime

kyc_bp = Blueprint('kyc', __name__)

@kyc_bp.route('/kyc')
@login_required
def index():
    user_id = session.get('user_id')
    role = session.get('role')
    
    if role in ('admin', 'staff', 'cs', 'bendahara', 'manager', 'dps'):
        query = request.args.get('q')
        
        # Ambil calon anggota (pending)
        pending_members = MemberModel.get_all_members(query, roles=["member"])
        # Ambil anggota aktif
        active_members = MemberModel.get_all_members(query, roles=["member_active"])
        
        # Inject unique code to both lists
        for m in pending_members + active_members:
            if m.get('id'):
                ucode = int(m['id'].replace('-', ''), 16) % 1000
                m['unique_code'] = 123 if ucode == 0 else ucode
        
        if request.headers.get('HX-Request'):
            # Return partial if requested (for search) - we'll update admin_index_content accordingly
            return render_template('kyc/admin_index_content.html', 
                                   pending_members=pending_members, 
                                   active_members=active_members,
                                   role=role)
            
        return render_template('kyc/admin_index.html', 
                               pending_members=pending_members, 
                               active_members=active_members,
                               role=role)
    
    # Member view
    member = MemberModel.get_member_by_user_id(user_id)
    
    # Sinkronisasi Otomatis: Jika role sudah aktif tapi status anggota masih pending, perbaiki otomatis.
    if role == 'member_active' and member and member.get('status') == 'pending':
        MemberModel.update_status(user_id, 'active')
        member['status'] = 'active'
        
    return render_template('kyc/member_view.html', member=member)

@kyc_bp.route('/api/kyc/submit', methods=['POST'])
@login_required
def submit():
    user_id = session.get('user_id')
    
    # Handle File Uploads (KTP and Payment Proof)
    ktp_url = None
    payment_proof_url = None
    
    # 1. Handle KTP/Paspor Upload
    if 'ktp_file' in request.files:
        file = request.files['ktp_file']
        if file.filename != '':
            try:
                ext = file.filename.split('.')[-1]
                filename = f"ktp_{user_id}_{int(datetime.datetime.now().timestamp())}.{ext}"
                file_content = file.read()
                
                sp.db_admin.storage.from_("member-files").upload(
                    path=filename,
                    file=file_content,
                    file_options={"content-type": file.content_type}
                )
                ktp_url = sp.db_admin.storage.from_("member-files").get_public_url(filename)
            except Exception as e:
                print(f"KTP Upload Error: {e}")
                
    # 2. Handle Payment Proof Upload (Optional in KYC)
    if 'payment_proof' in request.files:
        file = request.files['payment_proof']
        if file.filename != '':
            try:
                ext = file.filename.split('.')[-1]
                filename = f"proof_{user_id}_{int(datetime.datetime.now().timestamp())}.{ext}"
                file_content = file.read()
                
                sp.db_admin.storage.from_("member-files").upload(
                    path=filename,
                    file=file_content,
                    file_options={"content-type": file.content_type}
                )
                payment_proof_url = sp.db_admin.storage.from_("member-files").get_public_url(filename)
            except Exception as e:
                print(f"Upload Error: {e}")
    
    data = {
        "full_name": request.form.get("full_name"),
        "identity_number": request.form.get("identity_number"),
        "family_card_number": request.form.get("family_card_number"),
        "religion": request.form.get("religion"),
        "address": request.form.get("address"),
        "mother_name": request.form.get("mother_name"),
        "income": request.form.get("income"),
        "npwp": request.form.get("npwp"),
        "phone_number": request.form.get("phone_number"),
        "contract_type": request.form.get("contract_type"),
        "is_contract_accepted": request.form.get("is_contract_accepted")
    }
    
    try:
        res = MemberModel.create_member(user_id, data, ktp_url=ktp_url, payment_proof_url=payment_proof_url)
        if res:
            return '<div class="alert-success">Data KYC & Bukti Identitas berhasil dikirim! Menunggu verifikasi.</div>'
    except Exception as e:
        print(f"Error submitting KYC: {e}")
        return f'<div class="alert-error">Gagal mengirim data: {str(e)}</div>'
    
    return '<div class="alert-error">Gagal mengirim data. Coba lagi.</div>'

@kyc_bp.route('/api/kyc/member/<user_id>', methods=['GET'])
@admin_required
def member_details(user_id):
    member = MemberModel.get_member_by_user_id(user_id)
    if not member:
        return "<div class='alert-error'>Data tidak ditemukan</div>"
    return render_template('components/member_details_modal.html', member=member)

@kyc_bp.route('/api/kyc/verify', methods=['POST'])
@admin_required
def verify():
    member_id = request.form.get("member_id")
    status = request.form.get("status") # active/rejected
    MemberModel.update_status(member_id, status)
    
    members = MemberModel.get_all_members()
    return render_template('components/member_rows.html', members=members)

@kyc_bp.route('/api/kyc/saran', methods=['POST'])
@admin_required
def submit_saran():
    member_id = request.form.get("member_id")
    saran_text = request.form.get("saran_text")
    dps_name = session.get("user_name", "DPS")
    
    if saran_text and member_id:
        SaranModel.add_saran(member_id, saran_text, dps_name)
        return '<div class="alert-success" style="font-size: 0.8rem; padding: 0.5rem; margin-top: 0.5rem;">Saran terkirim!</div>'
    return '<div class="alert-error" style="font-size: 0.8rem; padding: 0.5rem; margin-top: 0.5rem;">Gagal mengirim saran.</div>'

@kyc_bp.route('/api/kyc/saran/popup')
@admin_required
def saran_popup():
    role = session.get('role')
    # DPS doesn't need to see the popup for their own saran, maybe? or they can.
    # We will show it to admins.
    if role in ('admin', 'staff', 'cs', 'bendahara', 'manager'):
        sarans = SaranModel.get_all_saran()
        if sarans:
            return render_template('components/saran_popup.html', sarans=sarans)
    return ''
