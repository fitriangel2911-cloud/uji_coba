from flask import Blueprint, render_template, request, session, redirect, url_for
from decorators import login_required, admin_required
from models.member_model import MemberModel
from extensions import sp
import datetime

kyc_bp = Blueprint('kyc', __name__)

@kyc_bp.route('/kyc')
@login_required
def index():
    user_id = session.get('user_id')
    role = session.get('role')
    
    if role in ('admin', 'staff', 'cs', 'bendahara', 'manager'):
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
                                   active_members=active_members)
            
        return render_template('kyc/admin_index.html', 
                               pending_members=pending_members, 
                               active_members=active_members)
    
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
    
    # Handle File Upload
    payment_proof_url = None
    if 'payment_proof' in request.files:
        file = request.files['payment_proof']
        if file.filename != '':
            try:
                # Generate unique filename
                ext = file.filename.split('.')[-1]
                filename = f"proof_{user_id}_{int(datetime.datetime.now().timestamp())}.{ext}"
                file_content = file.read()
                
                # Upload to Supabase Storage (Bucket: member-files)
                # Note: Bucket must be public or handled via policy
                sp.db_admin.storage.from_("member-files").upload(
                    path=filename,
                    file=file_content,
                    file_options={"content-type": file.content_type}
                )
                
                # Get Public URL
                res_url = sp.db_admin.storage.from_("member-files").get_public_url(filename)
                payment_proof_url = res_url
            except Exception as e:
                print(f"Upload Error: {e}")
                # Fallback: continue without URL if upload fails (or return error)
    
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
    
    res = MemberModel.create_member(user_id, data, payment_proof_url=payment_proof_url)
    
    if res:
        return '<div class="alert-success">Data KYC & Bukti Transfer berhasil dikirim! Menunggu verifikasi.</div>'
    return '<div class="alert-error">Gagal mengirim data. Coba lagi.</div>'

@kyc_bp.route('/api/kyc/verify', methods=['POST'])
@admin_required
def verify():
    member_id = request.form.get("member_id")
    status = request.form.get("status") # active/rejected
    MemberModel.update_status(member_id, status)
    
    members = MemberModel.get_all_members()
    return render_template('components/member_rows.html', members=members)
