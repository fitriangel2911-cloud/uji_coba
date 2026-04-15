import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from utils.db import db

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dev-key-12345")

@app.route("/")
def index():
    """Halaman Dashboard Utama"""
    return render_template("index.html")

@app.route("/api/health")
def health_check():
    """Endpoint untuk memastikan sistem berjalan"""
    try:
        # Menggunakan tabel 'members' sesuai dengan database yang ada
        result = db.table("members").select("*").limit(1).execute()
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return jsonify({"status": "ok", "db_status": db_status, "message": "Sistem IQ-RA siap beroperasi"})

@app.route("/finance", methods=["GET"])
def finance_center():
    """Halaman Pusat Keuangan Terpadu"""
    return render_template("finance.html")

@app.route("/finance/revenue", methods=["GET"])
def revenue_page():
    return render_template("revenue.html")

@app.route("/api/finance/revenue", methods=["POST"])
def process_revenue():
    # Simulasi memproses penerimaan kas (misal ansuran Murabahah)
    amount = request.form.get("amount")
    desc = request.form.get("description", "Penerimaan Kas Umum")
    
    try:
        # Insert to journal_entries via Supabase
        db.table("journal_entries").insert({
            "description": desc,
            "transaction_date": "2026-04-14", # Simulasi tgl
            "reference": "REV-" + str(os.urandom(4).hex())
        }).execute()
        return render_template("partials/toast.html", message=f"Penerimaan kas Rp {amount} berhasil dicatat!", type="success")
    except Exception as e:
        return render_template("partials/toast.html", message=f"Gagal mencatat penerimaan: {str(e)}", type="error")

@app.route("/finance/expenditure", methods=["GET"])
def expenditure_page():
    return render_template("expenditure.html")

@app.route("/api/finance/expenditure", methods=["POST"])
def process_expenditure():
    amount = request.form.get("amount")
    desc = request.form.get("description", "Pengeluaran Kas Umum")
    
    try:
        # Insert to journal_entries via Supabase
        db.table("journal_entries").insert({
            "description": desc,
            "transaction_date": "2026-04-14", 
            "reference": "EXP-" + str(os.urandom(4).hex())
        }).execute()
        return render_template("partials/toast.html", message=f"Pengeluaran kas Rp {amount} berhasil dicatat!", type="success")
    except Exception as e:
        return render_template("partials/toast.html", message=f"Gagal mencatat pengeluaran: {str(e)}", type="error")

if __name__ == "__main__":
    # Menjalankan aplikasi dalam mode debug agar mempermudah pengembangan
    app.run(debug=True, port=int(os.getenv("PORT", 5000)))
