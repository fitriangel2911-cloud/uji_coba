from flask import Blueprint, render_template, session, redirect, url_for, request
from decorators import login_required
from models.member_model import MemberModel
from models.auth_model import AuthModel
from models.finance_model import FinanceModel
from models.payment_model import PaymentModel

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/')
def landing():
    if 'user_id' in session:
        return redirect(url_for('dashboard.index'))
    return render_template('landing.html')

@dashboard_bp.route('/api/profile/modal')
@login_required
def api_profile_modal():
    user_id = session.get('user_id')
    user_name = session.get('user_name')
    # Ambil data lengkap dari MemberModel
    member = MemberModel.get_member_by_user_id(user_id)
    return render_template('components/profile_modal_content.html', member=member, user_name=user_name)

@dashboard_bp.route('/api/profile/update', methods=['POST'])
@login_required
def api_profile_update():
    user_id = session.get('user_id')
    data = {
        "full_name": request.form.get("full_name"),
        "identity_number": request.form.get("identity_number"),
        "family_card_number": request.form.get("family_card_number"),
        "religion": request.form.get("religion"),
        "mother_name": request.form.get("mother_name"),
        "address": request.form.get("address"),
        "income": request.form.get("income"),
        "npwp": request.form.get("npwp")
    }
    # Update di tabel members
    res = MemberModel.update_member_data(user_id, data)
    if res:
        return '<div style="padding: 1rem; border-radius: 8px; background: rgba(16,185,129,0.1); color: #10b981; margin-bottom: 1.5rem; text-align: center; font-weight: 700;">✅ Profil Berhasil Diperbarui!</div>'
    return '<div style="padding: 1rem; border-radius: 8px; background: rgba(239,68,68,0.1); color: #fca5a5; margin-bottom: 1.5rem; text-align: center; font-weight: 700;">❌ Gagal memperbarui profil.</div>'

@dashboard_bp.route('/dashboard')
@login_required
def index():
    user_id = session.get('user_id')
    role = session.get('role')
    
    # Refresh user name from profile
    profile = AuthModel.get_profile(user_id)
    user_name = profile.get('full_name', 'User') if profile else 'User'
    
    if role in ('admin', 'staff', 'cs', 'bendahara', 'manager'):
        # For CS, Bendahara, and Manager, we might want different stats
        # but for now we give them a unified admin base with role-specific components
        stats = {
            "total_members": MemberModel.get_stats(),
            "cash_balance": "Rp 750.000.000",
            "compliance": "98%",
            "pending_approvals": len(FinanceModel.get_applications_for_approval(role)) if role in ('bendahara', 'manager') else 0
        }
        return render_template('dashboard/admin.html', stats=stats, user_name=user_name, role=role)
    
    # Member or Demo
    financing_apps = FinanceModel.get_applications_for_member(user_name) if role != 'demo' else []
    
    # Fetch real payment data
    payments = PaymentModel.get_member_payments(user_id)
    savings = PaymentModel.get_savings_summary(user_id)
    
    return render_template('dashboard/member.html', 
                           user_name=user_name, 
                           profile=profile, 
                           financing_apps=financing_apps,
                           payments=payments,
                           savings=savings,
                           role=role)
@dashboard_bp.route('/payments')
@login_required
def payments():
    user_id = session.get('user_id')
    user_name = session.get('user_name')
    role = session.get('role')
    
    # Fetch real payment data
    payments_data = PaymentModel.get_member_payments(user_id)
    savings = PaymentModel.get_savings_summary(user_id)
    
    return render_template('dashboard/payments.html', 
                           user_name=user_name,
                           payments=payments_data,
                           savings=savings,
                           role=role)

@dashboard_bp.route('/chatbot')
@login_required
def chatbot():
    return render_template('dashboard/chatbot.html')

@dashboard_bp.route('/catalog')
@login_required
def catalog():
    # Example products
    products = [
        {"name": "Pembiayaan Murabahah", "desc": "Pembiayaan jual beli untuk kebutuhan barang/aset.", "icon": "🤝"},
        {"name": "Simpanan Wadi'ah", "desc": "Simpanan titipan murni yang aman dan berkah.", "icon": "💰"},
        {"name": "Investasi Mudharabah", "desc": "Kerjasama bagi hasil untuk pengembangan usaha.", "icon": "📈"},
        {"name": "Pembiayaan Ijarah", "desc": "Layanan sewa menyewa barang atau jasa.", "icon": "🏠"}
    ]
    return render_template('dashboard/catalog.html', products=products)

@dashboard_bp.route('/api/chatbot/ask', methods=['POST'])
@login_required
def api_chatbot_ask():
    # Placeholder for RAG logic
    user_message = request.form.get('message', '')
    query = user_message.lower()
    
    if 'syariah' in query:
        response = "Sistem ekonomi Syariah berlandaskan pada Al-Qur'an dan Hadist, mengedepankan keadilan dan menghindari Riba."
    elif 'koperasi' in query:
        response = "Koperasi IQ-RA adalah lembaga keuangan syariah yang dikelola secara profesional untuk kesejahteraan anggota."
    else:
        response = "Terima kasih atas pertanyaannya. Saya adalah asisten AI Koperasi IQ-RA yang siap membantu Anda."
    
    # Return both user and bot messages
    return f"""
        <div class="chat-msg user">{user_message}</div>
        <div class="chat-msg bot">{response}</div>
    """
