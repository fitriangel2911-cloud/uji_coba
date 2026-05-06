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
        except Exception as e:
            error_msg = str(e)
            if "Email not confirmed" in error_msg:
                return f'<div class="alert-error">Akun Belum Aktif: Silakan konfirmasi email <strong>{email}</strong> terlebih dahulu.</div>'
            return '<div class="alert-error">Login Gagal: Periksa email & password.</div>'
            
    return render_template('auth/login.html')

@auth_bp.route('/login-demo')
def login_demo():
    return redirect(url_for('auth.login'))

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    # Detect default role from query param (e.g. /register?role=demo)
    default_role = request.args.get('role', 'member')
    
    if request.method == 'POST':
        print("\n" + "="*50)
        print("PENDAFTARAN DITERIMA!")
        email = request.form.get('email')
        role = request.form.get('role', 'member')
        print(f"Email: {email}")
        print(f"Role: {role}")
        print("="*50 + "\n")
        
        password = request.form.get('password')
        full_name = request.form.get('full_name')
        phone_number = request.form.get('phone_number')
        akad = request.form.get('akad')
        
        try:
            res = AuthModel.sign_up(email, password, full_name, phone_number, role, akad)
            if res.user:
                print(f"Supabase Auth Berhasil: {res.user.id}")
                
                # Jika role adalah demo, login otomatis
                if role == 'demo':
                    session['user_id'] = res.user.id
                    session['role'] = 'demo'
                    session['user_name'] = full_name
                    return '<script>window.location.href = "/dashboard";</script>'

                # Jika email belum dikonfirmasi (untuk akun real)
                if not getattr(res.user, 'email_confirmed_at', None):
                    return f'<script>window.location.href = "{url_for("auth.verification_pending", email=email)}";</script>'
                else:
                    session['user_id'] = res.user.id
                    session['role'] = role
                    session['user_name'] = full_name
                    return '<script>window.location.href = "/dashboard";</script>'
            
            return '<div class="alert-error">❌ Supabase Auth Gagal: User tidak terbentuk. Silakan coba email lain.</div>'
            
        except Exception as e:
            print(f"ERROR FATAL: {str(e)}")
            return f'<div class="alert-error">Koneksi Gagal: {str(e)}</div>'
            
    return render_template('auth/register.html', default_role=default_role)

@auth_bp.route('/verification-pending')
def verification_pending():
    email = request.args.get('email', 'Email Anda')
    return render_template('auth/verification_pending.html', email=email)

@auth_bp.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('auth.login'))
