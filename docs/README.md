# IQ-RA System: Koperasi Syariah Digital (KSD)

Selamat datang di basis kode **IQ-RA System (Koperasi Syariah Digital)**. Aplikasi ini dirancang untuk mendigitalisasi operasional lembaga keuangan mikro syariah secara terintegrasi dengan prinsip kehati-hatian, kepatuhan hukum syariah, dan akuntabilitas keuangan berbasis standar **SAK EP**.

---

## 🚀 Fitur Utama

1. **Core Banking Syariah**:
   - Manajemen Keanggotaan & Verifikasi Identitas (KYC).
   - Pengelolaan setoran/penarikan kas teller untuk **Simpanan Pokok & Wajib**, **Simpanan Wadiah** (titipan), dan **Simpanan Mudharabah** (investasi).
2. **Akuntansi Otomatis (SAK EP & PSAK Syariah)**:
   - Pencatatan buku besar berpasangan (*double-entry ledger*) otomatis untuk setiap transaksi.
   - Penyusunan laporan keuangan otomatis secara real-time: **Neraca (Balance Sheet)**, **Perhitungan Hasil Usaha (PHU / Laporan Laba Rugi)**, dan **Laporan Arus Kas (Cash Flow)**.
   - Mekanisme otomatis perhitungan bagi hasil (*Nisbah*) bulanan untuk pemegang simpanan Mudharabah.
3. **Pembiayaan Berbasis Akad Syariah (Maker-Checker Flow)**:
   - **Akad Murabahah**: Pembiayaan jual beli barang dengan kalkulator angsuran syariah terpadu (pemisahan porsi pokok & margin laba).
   - **Akad Qardhul Hasan**: Pinjaman kebajikan tanpa margin/bunga untuk keadaan darurat sosial.
   - Alur persetujuan ganda (*Maker-Checker*): Diajukan oleh Jamaah, diverifikasi awal oleh **Takmir** (Maker), dan disetujui akhir oleh **Dewan Pengawas Syariah / DPS** (Checker).
4. **Sharia AI Compliance Assistant (RAG Pipeline)**:
   - Chatbot interaktif cerdas yang ditenagai oleh **Google Gemini API** dan **LangChain**.
   - Menyediakan konsultasi kepatuhan akad secara real-time yang merujuk pada standar **Fatwa DSN-MUI**.

---

## 🛠️ Konfigurasi Environment (`.env.local`)

Untuk menjalankan sistem secara lokal, buat file `.env.local` di direktori utama dan isi variabel berikut:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# Sharia Compliance Assistant (RAG)
GOOGLE_API_KEY=your-gemini-api-key
```

*Catatan: Sistem menyertakan **Robust Mock Database Layer** secara otomatis. Jika Supabase sedang offline atau dinonaktifkan, aplikasi akan tetap berfungsi 100% menggunakan database lokal berbasis `localStorage` sehingga pengujian fitur tetap dapat berjalan dengan lancar.*

---

## 📂 Struktur Dokumentasi (`/docs`)

Seluruh rancangan sistem telah disusun secara modular di dalam folder ini:
* [📄 PRD - Persyaratan Produk](./PRD.md): Dokumen spesifikasi produk dan fungsionalitas sistem.
* [📄 BLUEPRINT - Rancangan Teknis](./BLUEPRINT.md): Rancangan arsitektur, basis data, dan RAG pipeline.
* [📄 ARCHITECTURE - Skema & Aliran Data](./ARCHITECTURE.md): Rancangan database COA (Chart of Accounts) dan data flow akuntansi.
* [📄 BUSINESS RULES - Aturan Bisnis](./BUSINESS_RULES.md): Alur kerja maker-checker, threshold transaksi, dan hak akses.
* [📄 COMPLIANCE - Regulasi & Audit Trail](./COMPLIANCE.md): Standar kepatuhan SAK EP, KYC, dan spesifikasi log audit.
* [📄 DEV_GUIDE - Standar Penulisan & Git](./DEV_GUIDE.md): Standar kualitas kode Next.js, TypeScript, dan SonarCloud.
* [📄 SECURITY - Kebijakan Keamanan](./SECURITY.md): Kebijakan Row-Level Security (RLS) database dan runbook tanggap darurat.
* [📄 BACKLOG - Rencana Pengembangan](./BACKLOG.md): Backlog prioritas pengembangan, migrasi Supabase, pgvector, dan integrasi API riil.
