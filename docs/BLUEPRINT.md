# Dokumen Rancangan Sistem: Koperasi Syariah Digital (KSD)
### Platform Keuangan Mikro Syariah Terintegrasi dengan Mekanisme Retrieval-Augmented Generation (RAG) dan Kepatuhan SAK EP
**Spesifikasi Teknologi:** Python (Flask Framework) / Next.js (TypeScript), HTMX / React, Alpine JS, Supabase (PostgreSQL & pgvector)

---

### 1. Ringkasan Eksekutif
IQ-RA System merupakan platform berbasis web komprehensif yang dirancang untuk mentransformasi operasional koperasi syariah konvensional menuju ekosistem digital yang transparan dan akuntabel. Melalui implementasi arsitektur modern, sistem ini menawarkan efisiensi pengembangan tanpa mengorbankan performa. Integrasi teknologi Kecerdasan Buatan (AI) melalui *Retrieval-Augmented Generation* (RAG) berfungsi sebagai asisten kepatuhan syariah interaktif bagi anggota dan pengelola, sementara standarisasi laporan keuangan dilakukan berdasarkan regulasi SAK EP terbaru.

#### Matriks Fitur Utama dan Manfaat Strategis:
- **Arsitektur Reaktif Modern:** Optimalisasi reaktivitas antarmuka dengan kompleksitas kode minimal (Next.js + Tailwind CSS v4). (Target: Pengembang & Pengguna Akhir)
- **Asisten Syariah Berbasis RAG:** Penyediaan konsultasi fatwa dan regulasi syariah secara real-time. (Target: Anggota & Administrator)
- **Automasi Laporan SAK EP:** Penyajian laporan keuangan yang presisi sesuai standar akuntansi privasi terbaru. (Target: Administrator & Manajemen)
- **Manajemen Arus Kas Terpadu:** Pengawasan sistematis terhadap siklus penerimaan dan pengeluaran kas. (Target: Administrator & Auditor)
- **Integrasi SonarCloud:** Penjaminan kualitas kode dan mitigasi kerentanan keamanan perangkat keras. (Target: Pengembang)

---

### 2. Analisis Problematika dan Justifikasi Pengembangan
Pengembangan KSD didasari oleh beberapa tantangan fundamental yang dihadapi oleh institusi koperasi syariah pada era digital, antara lain:
1. **Migrasi Standar Akuntansi:** Adanya kewajiban bagi entitas privat untuk mengadopsi **SAK EP** sebagai pengganti SAK ETAP memerlukan sistem yang adaptif dalam pengklasifikasian akun dan penyajian laporan.
2. **Ambiguitas Implementasi Akad:** Keterbatasan pemahaman anggota mengenai substansi perbedaan berbagai akad syariah (seperti Wadiah, Murabahah, dan Mudharabah) yang berpotensi menimbulkan ketidakpatuhan prinsip.
3. **Integritas Data Keuangan:** Risiko hilangnya data atau manipulasi informasi akibat pencatatan manual yang belum terpusat secara digital.
4. **Standarisasi Perangkat Lunak:** Kebutuhan akan audit kualitas kode guna memastikan bahwa platform finansial bebas dari *bug* kritikal dan celah keamanan.

---

### 3. Arsitektur Sistem dan Infrastruktur Teknologi
Sistem mengadopsi paradigma *Next.js + TypeScript + Supabase* (dan opsi rendering reaktif) guna mereduksi latensi komunikasi antar-layanan serta mempermudah pemeliharaan sistem secara berkelanjutan.

#### Komponen Teknologi
- **Web Server & Framework:** Next.js (TypeScript) & React berperan sebagai mesin pengolah logika dan penyaji *Server-Side* & *Client-Side*.
- **Interaktivitas Antarmuka:** Penggunaan **Tailwind CSS v4** untuk styling yang reaktif dan premium.
- **Manajemen Data:** **Supabase** sebagai penyedia layanan PostgreSQL relasional dan ekstensi pgvector untuk penyimpanan data vektor AI.
- **Mesin Kecerdasan Buatan:** Jalur pipa RAG untuk ekstraksi teks dokumen (PDF/Excel), konversi menjadi *embeddings*, dan penyimpanan pada database vektor.
- **Siklus Pengembangan:** Pemanfaatan GitHub Actions yang terintegrasi dengan **SonarCloud / SonarQube** untuk tinjauan kualitas kode secara otomatis.

---

### 4. Spesifikasi Modul Fungsional

#### 4.1. Manajemen Identitas dan *Know Your Customer* (KYC)
Modul ini memfasilitasi registrasi anggota disertai validasi identitas guna memastikan integritas data keanggotaan dan kepatuhan terhadap regulasi anti-pencucian uang.

#### 4.2. Siklus Penerimaan Kas (Revenue Cycle)
Mencakup mekanisme setoran dana melalui integrasi API *Payment Gateway*. Sistem secara otomatis mengalokasikan pembayaran angsuran pembiayaan Murabahah ke dalam komponen Pokok dan Margin berdasarkan jurnal akuntansi yang telah ditentukan.

#### 4.3. Siklus Pengeluaran Kas (Expenditure Cycle)
Mengatur diseminasi dana pembiayaan kepada anggota atau vendor terkait, serta perhitungan distribusi bagi hasil (Nisbah) secara otomatis berdasarkan kinerja laba bersih entitas.

#### 4.4. Asisten Kepatuhan Syariah (RAG Pipeline)
Layanan konsultasi berbasis AI yang mengekstraksi informasi dari korpus dokumen Fatwa DSN-MUI dan Standar Operasional Prosedur (SOP) internal guna memberikan jawaban yang valid secara yuridis syariah.

#### 4.5. Laporan Keuangan Berbasis SAK EP
Automasi penyusunan laporan posisi keuangan (neraca), laporan aktivitas (perhitungan hasil usaha), laporan arus kas, serta catatan atas laporan keuangan sesuai dengan kerangka akuntansi SAK EP.

---

### 5. Perancangan Basis Data dan Keamanan Informasi

#### Struktur Data Keuangan (Relasional)
Model relasional PostgreSQL di Supabase menyimpan data transaksional seperti tabel:
- `users`: Data autentikasi dan informasi akun pengguna.
- `members`: Profil anggota koperasi dan status KYC.
- `savings`: Transaksi simpanan Wadiah (bisa ditarik kapan saja) dan Mudharabah (investasi bagi hasil).
- `financing`: Pengajuan dan histori pembayaran angsuran pembiayaan Murabahah (jual beli) dan Qardhul Hasan (pinjaman kebajikan).
- `journals`: Jurnal umum pencatatan akuntansi debit-kredit ganda.
- `audit_logs`: Jejak audit aktivitas sensitif guna penjaminan kepatuhan.

#### Struktur Data Pengetahuan (Vektor)
Memanfaatkan ekstensi `pgvector` untuk menyimpan embeddings dari dokumen fatwa dan kepatuhan syariah pada tabel `syariah_knowledge_embeddings`.

#### Protokol Keamanan Kode
- Implementasi file `.gitignore` yang ketat untuk mencegah kebocoran kunci API dan konfigurasi sensitif pada repositori publik.
- Analisis statis berkala melalui **SonarCloud** untuk mendeteksi *vulnerability* dan *code smells*.

---

### 6. Metodologi RAG Pipeline
Implementasi RAG dilakukan melalui beberapa tahapan sistematis:
1. **Ingesti:** Pengunggahan dokumen regulasi oleh administrator.
2. **Transformasi:** Fragmentasi teks (*chunking*) untuk mempertahankan konteks informasi.
3. **Vektorisasi:** Konversi fragmen teks menjadi representasi vektor melalui model embedding.
4. **Retrieval:** Pencarian fragmen teks yang memiliki relevansi semantik tertinggi terhadap kueri pengguna.
5. **Generasi:** Sintesis jawaban oleh Large Language Model (LLM) berdasarkan konteks dokumen yang ditemukan.

---

### 7. Rencana Strategis Implementasi (Roadmap)
- **Fase I:** Inisialisasi infrastruktur, konfigurasi lingkungan pengembangan, dan integrasi awal SonarCloud.
- **Fase II:** Pengembangan modul inti keuangan (Siklus Penerimaan dan Pengeluaran).
- **Fase III:** Implementasi jalur pipa RAG dan integrasi basis data vektor.
- **Fase IV:** Validasi laporan keuangan berbasis SAK EP dan audit keamanan menyeluruh.

---
Koperasi Syariah Digital | Laporan Teknis Tugas Akhir 2026
