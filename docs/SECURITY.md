# SYSTEM SECURITY & DATA PROTECTION POLICIES

Dokumen ini mendefinisikan kebijakan keamanan sistem, pengaturan perlindungan data sensitif, spesifikasi *Row-Level Security* (RLS) Supabase, serta protokol mitigasi kerentanan keamanan pada **IQ-RA System (Koperasi Syariah Digital)**.

---

## 1. Keamanan Basis Data & Row-Level Security (RLS) Supabase

Saat sistem dihubungkan dengan basis data Supabase PostgreSQL secara penuh, proteksi data wajib dikendalikan di tingkat database melalui kebijakan **Row-Level Security (RLS)**. Kebijakan ini menjamin pengguna hanya dapat mengakses data sesuai wewenangnya:

### 1.1. Kebijakan RLS Tabel `members`
* **Anggota (Jamaah)**: Hanya diizinkan untuk melihat (`SELECT`) dan memperbarui (`UPDATE`) baris data milik mereka sendiri berdasarkan ID pengguna terotentikasi:
  ```sql
  CREATE POLICY select_own_member ON members 
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);
  ```
* **Takmir (Maker)**: Diizinkan membaca seluruh profil anggota di bawah wilayah masjid binaannya untuk proses verifikasi KYC.
* **DPS & Admin (Checker/Manager)**: Diizinkan membaca seluruh data keanggotaan untuk audit syariah dan operasional.

### 1.2. Kebijakan RLS Tabel `accounts` & `transactions`
* Anggota hanya dapat membaca saldo dan histori transaksi simpanan mereka sendiri.
* Transaksi setoran atau penarikan dana hanya dapat diinisiasi atau diubah oleh teller/admin koperasi yang memiliki otorisasi khusus.

### 1.3. Kebijakan RLS Tabel `financing_contracts`
* Anggota dapat membuat pengajuan pembiayaan baru (`INSERT`) dan melihat riwayat kontrak milik mereka sendiri.
* Takmir (`maker`) memiliki hak untuk membaca dan memperbarui status pembiayaan dari `draft` ke `verified_by_takmir`.
* DPS (`checker`) memiliki hak eksklusif untuk menyetujui final (`approved_by_dps`) kontrak pembiayaan.

---

## 2. Enkripsi Data Sensitif (AES-256)

Untuk melindungi informasi pribadi anggota dari kebocoran data, sistem mewajibkan enkripsi data sensitif tingkat kolom (*Column-Level Encryption*) sebelum disimpan ke basis data:
* **Kolom Sensitif**: Nomor Induk Kependudukan (NIK - 16 digit) dan Nomor Telepon wajib dienkripsi di sisi server Next.js sebelum disimpan ke PostgreSQL menggunakan algoritma **AES-256-GCM**.
* Kunci enkripsi dikelola secara terpisah melalui variabel lingkungan rahasia (*Environment Variables*) dan tidak boleh dimasukkan ke dalam repositori git.

---

## 3. Keamanan Kode & Kebersihan Environment

* **Proteksi Git**: File `.gitignore` dikonfigurasi secara ketat untuk menyaring file `.env.local` dan folder `.next/` agar kunci API (seperti Google Gemini API Key dan Supabase Keys) tidak pernah bocor ke publik.
* **Analisis Statis (SonarCloud)**: Pipeline integrasi berkelanjutan (CI/CD) secara rutin memindai kode program untuk mendeteksi *hardcoded credentials*, kerentanan XSS (*Cross-Site Scripting*), dan kelemahan SQL Injection.
* **Validasi Input**: Semua input form di dashboard divalidasi ketat di sisi server untuk mencegah injeksi kode berbahaya.
