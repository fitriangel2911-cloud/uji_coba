# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## IQ-RA SYSTEM
### Platform Keuangan Mikro Syariah Terintegrasi AI Berbasis Flask + HTMX + Supabase

---

### 1. Ringkasan Eksekutif
IQ-RA System adalah platform digital koperasi syariah berbasis web yang dirancang untuk mendukung operasional koperasi simpan pinjam syariah secara end-to-end.
Sistem ini mengintegrasikan:
* **Core Banking Syariah**: Manajemen keanggotaan, teller, serta pembukuan simpanan harian.
* **Automasi Akuntansi SAK EP & PSAK Syariah**: Pencatatan jurnal ganda (double-entry ledger) otomatis.
* **AI Assistant berbasis Retrieval-Augmented Generation (RAG)**: Asisten cerdas terintegrasi Fatwa DSN-MUI untuk kepatuhan akad syariah.
* **Integrasi Payment Gateway & PPOB**: Automasi setoran Virtual Account serta pembayaran tagihan (PPOB).
* **Audit dan Monitoring Sistem**: Log aktivitas menyeluruh guna pencegahan kecurangan (fraud prevention).
* **Manajemen Keanggotaan dan Pembiayaan**: Sistem maker-checker terpadu.

IQ-RA System dibangun menggunakan pendekatan **Single Tier Server-Side Rendering (SSR)** dengan Flask, HTMX, Alpine.js, dan Supabase PostgreSQL + pgvector untuk memastikan:
* Maintainability tinggi
* Kompleksitas frontend rendah
* Performa tinggi
* Keamanan data finansial maksimal

---

### 2. Tujuan Pengembangan
Tujuan utama pengembangan IQ-RA System adalah:
1. Mengembangkan sistem core banking koperasi syariah yang patuh terhadap regulasi nasional (OJK, Kemenkop) dan hukum syariah (MUI).
2. Menyediakan otomasi pencatatan akuntansi berbasis SAK EP untuk mempermudah audit eksternal secara real-time.
3. Mengintegrasikan teknologi AI berbasis RAG untuk mempermudah verifikasi kepatuhan syariah dan membantu staf operasional serta anggota dalam konsultasi hukum syariah.
4. Memastikan skalabilitas sistem dengan arsitektur modern yang ringan dan efisien secara resource (resource-efficient).

---

### 3. Latar Belakang dan Problem Statement
#### 3.1 Ketergantungan Sistem Legacy
Banyak koperasi syariah masih menggunakan aplikasi desktop offline yang rentan terhadap kehilangan data finansial, tidak sinkron secara real-time, dan sulit diintegrasikan dengan teknologi modern (seperti payment gateway).
#### 3.2 Kesulitan Migrasi SAK EP
Banyak pengurus koperasi kesulitan melakukan penyesuaian laporan keuangan berbasis SAK EP yang dinamis dan membutuhkan keahlian akuntansi mendalam. Hal ini menghambat kesiapan audit tahunan.
#### 3.3 Risiko Kesalahan Akad Syariah
Sulit memverifikasi secara real-time apakah akad pembiayaan yang diajukan atau diproses sudah 100% patuh terhadap kaidah syariah tanpa adanya alat bantu pengawasan otomatis.
#### 3.4 Risiko Integritas Data
Kurangnya audit trail yang komprehensif dan *Role-Based Access Control (RBAC)* yang ketat pada sistem legacy memicu potensi kecurangan (fraud) internal.

---

### 4. Target Pengguna
1. **Anggota Koperasi (Jamaah)**: Melakukan setoran, pengajuan pembiayaan, cek saldo simpanan, dan tanya jawab hukum transaksi syariah dengan AI.
2. **Admin/Teller Koperasi**: Mengelola data anggota, transaksi harian, pencatatan kas, dan melakukan verifikasi awal akad.
3. **Pengurus & DPS (Dewan Pengawas Syariah)**: Mengawasi transaksi secara real-time, menyetujui pembiayaan besar, memantau laporan keuangan bulanan/tahunan otomatis, serta memverifikasi kepatuhan syariah setiap akad.

---

### 5. Arsitektur Teknologi
* **Backend**: Flask (Python) sebagai server utama yang cepat dan fleksibel.
* **Frontend**: HTMX + Alpine.js + Tailwind CSS v4 untuk user experience interaktif sekelas Single Page Application (SPA) tanpa overhead/kompleksitas React/Vue.
* **Database**: Supabase (PostgreSQL) untuk relational database dan `pgvector` sebagai vector store data pengetahuan syariah.
* **AI dan RAG**: Google Gemini API via LangChain untuk natural language processing dan pencarian basis pengetahuan syariah (Fatwa DSN-MUI).
* **Infrastruktur**: Dockerized deployment, server cloud regional dengan latensi rendah.
* **Security**: HTTPS, JSON Web Tokens (JWT) / Supabase Auth, Role-Based Access Control (RBAC), database encryption at rest.

---

### 6. Arsitektur Sistem
IQ-RA System menggunakan arsitektur **Single Tier Server-Side Rendering (SSR)**. Setiap interaksi di sisi frontend memicu request HTMX yang langsung mengembalikan fragmen HTML dari server Flask. Ini mengurangi overhead rendering di sisi klien, mempercepat *first contentful paint*, dan memudahkan penulisan kode di satu tempat.

---

### 7. Modul Fungsional
#### 7.1 Modul Keanggotaan dan KYC
* Pendaftaran anggota baru secara online/offline dengan upload KTP/identitas diri.
* Verifikasi berjenjang oleh admin (Maker-Checker Flow).
* Dashboard profil anggota lengkap: informasi data diri, status keaktifan, total simpanan, dan total pembiayaan berjalan.

#### 7.2 Modul Teller (Simpanan)
* Pencatatan transaksi setoran dan penarikan kas secara real-time.
* Jenis Simpanan:
  * **Simpanan Pokok & Wajib**: Dana keanggotaan syirkah non-penarikan rutin.
  * **Simpanan Wadiah (Titipan)**: Penarikan sewaktu-waktu tanpa bagi hasil tetap (opsi bonus sukarela).
  * **Simpanan Mudharabah (Investasi)**: Bagi hasil proporsional berdasarkan pendapatan operasional bulanan (Nisbah).

#### 7.3 Modul Pembiayaan (Akad Syariah)
* **Akad Murabahah (Jual Beli)**: Koperasi membelikan barang kebutuhan anggota, lalu menjualnya kembali dengan margin keuntungan yang disepakati (angsuran tetap bulanan).
* **Akad Qardhul Hasan (Kebajikan)**: Pembiayaan tanpa margin keuntungan, pengembalian pokok saja, ditujukan untuk jamaah yang membutuhkan bantuan sosial/darurat.
* **Fitur**: Pengajuan online, kalkulator angsuran syariah terpadu, analisis kelayakan pembiayaan, sistem unggah bukti pembelian barang, dan verifikasi status akad oleh DPS.

#### 7.4 Modul Akuntansi (Double-entry Ledger)
* Otomatisasi pembuatan jurnal akuntansi untuk setiap transaksi simpanan, penarikan, pencairan pembiayaan, dan pembayaran angsuran.
* Laporan Keuangan berbasis SAK EP otomatis:
  * Neraca (Balance Sheet)
  * Laporan Hasil Usaha (Income Statement / Laba Rugi)
  * Laporan Perubahan Ekuitas
  * Laporan Arus Kas (Cash Flow Statement)
* Sistem distribusi bagi hasil (Nisbah) otomatis untuk pemegang Simpanan Mudharabah setiap akhir bulan.

#### 7.5 Modul AI RAG Assistant (Sharia Compliance Assistant)
* Floating chatbot yang terintegrasi langsung di dashboard.
* Menjawab pertanyaan seputar hukum syariah, status kepatuhan akad koperasi, dan panduan transaksi berdasarkan Fatwa DSN-MUI.
* **Pipeline RAG**: Dokumen Fatwa DSN-MUI di-embed menggunakan `pgvector`, di-retrieve saat ada pertanyaan anggota/staf, dan dijawab secara akurat oleh LLM Gemini.

#### 7.6 Modul Monitoring dan Audit (Audit Trail)
* Pencatatan log aktivitas user secara mendetail (siapa, melakukan apa, kapan, pada IP mana).
* Laporan ketidaksesuaian akad otomatis jika ditemukan parameter transaksi yang melanggar aturan syariah atau batas limit risiko.

---

### 8. Struktur Database
#### Relasional (Supabase PostgreSQL)
* `users`: `id`, `email`, `password_hash`, `role` (admin, member, dps), `created_at`
* `members`: `id`, `user_id`, `full_name`, `nik`, `address`, `phone`, `status`, `created_at`
* `accounts`: `id`, `member_id`, `account_type` (wadiah, mudharabah, pokok, wajib), `balance`, `created_at`
* `transactions`: `id`, `account_id`, `transaction_type` (deposit, withdrawal), `amount`, `reference_number`, `created_at`
* `journal_entries`: `id`, `transaction_id`, `code_coa`, `debit`, `credit`, `description`, `created_at`
* `financing_contracts`: `id`, `member_id`, `contract_type` (murabahah, qard), `principal_amount`, `margin_amount`, `installment_period`, `status`, `created_at`
* `approvals`: `id`, `target_id` (member/financing), `approved_by`, `status`, `notes`, `created_at`
* `audit_logs`: `id`, `user_id`, `action`, `target_table`, `ip_address`, `created_at`

#### Vector Database (pgvector)
* `sharia_knowledge`: `id`, `document_title`, `section_header`, `content`, `embedding` (vector size 768 / 1536)

---

### 9. Integrasi Sistem
* **Payment Gateway**: Virtual Account (VA) bank syariah untuk setoran simpanan dan pembayaran angsuran pembiayaan secara otomatis.
* **PPOB (Payment Point Online Bank)**: Pembelian pulsa, token listrik, tagihan air syariah untuk menambah pendapatan koperasi.
* **Mobile Banking Integrasi**: API service yang siap diintegrasikan dengan mobile app koperasi di masa mendatang.

---

### 10. Keamanan Sistem
* Enkripsi data sensitif (seperti NIK dan nomor rekening) menggunakan AES-256.
* Penerapan HTTPS and secure cookies.
* Backup database harian otomatis ke cloud storage terpisah.

---

### 11. Non Functional Requirements
* Ketersediaan sistem (uptime) minimal 99.9%.
* Response time halaman utama di bawah 500ms.
* Kompatibel dengan semua browser modern (Chrome, Safari, Firefox, Edge) serta responsif di mobile viewport.

---

### 12. Workflow Sistem
* **Workflow Simpanan**: Anggota setor -> Teller input transaksi -> Database terupdate -> Jurnal otomatis terbentuk (Debet Kas, Kredit Simpanan).
* **Workflow Pembiayaan**: Anggota mengajukan -> Admin memverifikasi -> Sistem menilai kelayakan & kepatuhan syariah (AI checklist) -> Pengurus/DPS menyetujui (Checker) -> Dana dicairkan -> Jurnal otomatis terbentuk (Debet Piutang Murabahah, Kredit Kas).

---

### 13. Roadmap Implementasi
* **Fase 1 — Infrastruktur**: Setup repo, database Supabase, auth, dan role system.
* **Fase 2 — Core Banking**: Modul keanggotaan, modul teller, simpanan wadiah & mudharabah.
* **Fase 3 — Pembiayaan dan AI**: Modul pembiayaan murabahah/qard, modul AI RAG Assistant (Gemini + pgvector).
* **Fase 4 — Integrasi**: Payment gateway VA, modul akuntansi (double-entry ledger, CoA, auto jurnal).
* **Fase 5 — Hardening dan Go Live**: Penataan tampilan Tailwind CSS v4, security audit, penyusunan laporan keuangan otomatis, dan launch.

---

### 14. KPI Sistem
* Nol kesalahan pencatatan transaksi kas.
* Waktu persetujuan pembiayaan kurang dari 24 jam.
* Akurasi asisten AI dalam menjawab pertanyaan syariah minimal 95%.

---

### 15. Risiko dan Mitigasi
* **Downtime server** -> Backup server dan monitoring aktif.
* **Kebocoran data** -> Enkripsi end-to-end dan RBAC ketat.
* **Salah akad syariah** -> AI recommendation dan manual approval berjenjang (Maker-Checker).
* **Human error** -> Jurnal otomatis dan validasi form ketat.
* **Kehilangan data** -> Daily backup terjadwal.

---

### 16. Penutup
IQ-RA System dirancang sebagai platform koperasi syariah generasi baru yang menggabungkan core banking, AI, akuntansi syariah, keamanan, dan digitalisasi operasional. Pendekatan Flask + HTMX memberikan keseimbangan antara performa, maintainability, scalability, serta efisiensi pengembangan. Sistem ini diharapkan mampu menjadi fondasi transformasi digital koperasi syariah modern di Indonesia.
