from functools import wraps
from flask import session, redirect, url_for, flash, request

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('auth.login'))
        if session.get('role') not in ('admin', 'staff', 'cs', 'bendahara', 'manager', 'dps'):
            flash("Akses ditolak: Area khusus manajemen.", "error")
            return redirect(url_for('dashboard.index'))
        return f(*args, **kwargs)
    return decorated_function
def active_member_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('auth.login'))
        if session.get('role') != 'member_active':
            flash("Akses ditolak: Fitur ini hanya untuk Anggota Aktif (KYC Terverifikasi).", "error")
            return redirect(url_for('dashboard.index'))
        return f(*args, **kwargs)
    return decorated_function
