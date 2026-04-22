from flask import Blueprint, render_template, request, session, redirect, url_for, flash
from models.auth_model import AuthModel

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        try:
            res = AuthModel.sign_in(email, password)
            user_id = res.user.id
            profile = AuthModel.get_profile(user_id)
            role = profile.get('role', 'member') if profile else 'member'
            
            # Prevent demo users from using regular login if restricted
            if role == 'demo':
                return '<div class="alert-error">Akses Ditolak: Gunakan jalur Login Demo.</div>'
            
            session['user_id'] = user_id
            session['role'] = role
            session['user_name'] = profile.get('full_name', email.split('@')[0]) if profile else email.split('@')[0]
            
            return '<script>window.location.href = "/dashboard";</script>'
        except Exception:
            return '<div class="alert-error">Login Gagal: Periksa email & password.</div>'
            
    return render_template('auth/login.html')

@auth_bp.route('/login-demo', methods=['GET', 'POST'])
def login_demo():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        try:
            # 1. Sign in
            res = AuthModel.sign_in(email, password)
            user_id = res.user.id
            
            # 2. Check Role
            profile = AuthModel.get_profile(user_id)
            if profile.get('role') != 'demo':
                return '<div class="alert-error">Error: Akun ini bukan akun demo.</div>'
            
            # 3. Check Demo Limit (Maks 2)
            is_allowed, count = AuthModel.check_demo_limit(email)
            if not is_allowed:
                return f'<div class="alert-error">Batas Demo: Akun ini sudah login {count} kali. Batas maksimal adalah 2.</div>'
            
            # 4. Increment Count & Login
            AuthModel.increment_demo_count(email)
            session['user_id'] = user_id
            session['role'] = 'demo'
            session['user_name'] = profile.get('full_name', 'User Demo')
            
            return '<script>window.location.href = "/dashboard";</script>'
        except Exception as e:
            return f'<div class="alert-error">Login Demo Gagal: {str(e)}</div>'
            
    return render_template('auth/login_demo.html')

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        full_name = request.form.get('full_name')
        role = request.form.get('role', 'member') # Can be 'member' or 'demo'
        
        try:
            res = AuthModel.sign_up(email, password, full_name, role)
            if res.user:
                if res.user.confirmed_at is None:
                    return f'<div class="alert-success">Registrasi Berhasil! Silakan konfirmasi email <strong>{email}</strong>.</div>'
                else:
                    session['user_id'] = res.user.id
                    session['role'] = role
                    return '<script>window.location.href = "/dashboard";</script>'
            return '<div class="alert-error">Registrasi Gagal.</div>'
        except Exception as e:
            return f'<div class="alert-error">Error: {str(e)}</div>'
            
    return render_template('auth/register.html')

@auth_bp.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('auth.login'))
