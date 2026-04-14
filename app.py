import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dev-key-12345")

@app.route("/")
def index():
    """Halaman Dashboard Utama"""
    return render_template("index.html")

@app.route("/api/health")
def health_check():
    """Endpoint untuk memastikan sistem berjalan"""
    return jsonify({"status": "ok", "message": "Sistem IQ-RA siap beroperasi"})

if __name__ == "__main__":
    # Menjalankan aplikasi dalam mode debug agar mempermudah pengembangan
    app.run(debug=True, port=int(os.getenv("PORT", 5000)))
