import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from utils.supabase_db import get_member_stats, get_members, create_member, update_member_status

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dev-key-12345")

@app.route("/")
def index():
    """Halaman Dashboard Utama dengan Statistik Real"""
    stats = {
        "total_members": get_member_stats(),
        "cash_balance": "450.2M", # Placeholder untuk fase selanjutnya
        "compliance": "100%"
    }
    return render_template("index.html", stats=stats)

@app.route("/kyc")
def kyc_page():
    """Halaman Manajemen Keanggotaan"""
    return render_template("kyc.html")

@app.route("/api/members", methods=["GET", "POST"])
def members_api():
    """API untuk mengelola data anggota (HTMX)"""
    if request.method == "POST":
        # Ambil data form
        data = {
            "full_name": request.form.get("full_name"),
            "identity_number": request.form.get("identity_number"),
            "address": request.form.get("address"),
            "phone_number": request.form.get("phone_number"),
            "contract_type": request.form.get("contract_type"),
            "is_contract_accepted": request.form.get("is_contract_accepted")
        }
        file_ktp = request.files.get("ktp_photo")
        
        result = create_member(data, file_ktp)
        
        # Ambil list anggota terbaru untuk tabel
        members = get_members()
        table_html = render_template("components/member_list_rows.html", members=members)
        
        if result:
            alert_html = '<div id="kyc-alert" hx-swap-oob="innerHTML" class="alert-success">Pendaftaran Berhasil! Menunggu verifikasi admin.</div>'
        else:
            alert_html = '<div id="kyc-alert" hx-swap-oob="innerHTML" class="alert-error">Pendaftaran Gagal! Cek koneksi atau NIK sudah ada.</div>'
            
        # Meng gabungkan respon dengan baris baru untuk kejelasan parsing htmx
        return f"{table_html}\n{alert_html}"
    
    # GET request - Mendukung pencarian
    query = request.args.get("q", "")
    members = get_members(query)
    return render_template("components/member_list_rows.html", members=members)

@app.route("/api/members/update-status", methods=["POST"])
def update_status_api():
    """API untuk menyetujui atau menolak anggota"""
    member_id = request.form.get("member_id")
    status = request.form.get("status")
    
    update_member_status(member_id, status)
    
    # Kembalikan list anggota terbaru untuk refresh tabel
    members = get_members()
    return render_template("components/member_list_rows.html", members=members)

@app.route("/api/health")
def health_check():
    """Endpoint untuk memastikan sistem berjalan"""
    return jsonify({"status": "ok", "message": "Sistem IQ-RA siap beroperasi"})

if __name__ == "__main__":
    # Menjalankan aplikasi dalam mode debug agar mempermudah pengembangan
    app.run(debug=True, port=int(os.getenv("PORT", 5000)))
