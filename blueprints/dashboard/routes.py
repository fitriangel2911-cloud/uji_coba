from flask import Blueprint, render_template, session, redirect, url_for
from decorators import login_required
from models.member_model import MemberModel
from models.auth_model import AuthModel

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/')
def landing():
    if 'user_id' in session:
        return redirect(url_for('dashboard.index'))
    return render_template('landing.html')

@dashboard_bp.route('/dashboard')
@login_required
def index():
    user_id = session.get('user_id')
    role = session.get('role')
    
    # Refresh user name from profile
    profile = AuthModel.get_profile(user_id)
    user_name = profile.get('full_name', 'User') if profile else 'User'
    
    if role in ('admin', 'staff'):
        stats = {
            "total_members": MemberModel.get_stats(),
            "cash_balance": "Rp 750.000.000",
            "compliance": "98%"
        }
        return render_template('dashboard/admin.html', stats=stats, user_name=user_name)
    
    # Member or Demo
    member_record = MemberModel.get_member_by_user_id(user_id)
    return render_template('dashboard/member.html', 
                           user_name=user_name, 
                           member=member_record,
                           role=role)
