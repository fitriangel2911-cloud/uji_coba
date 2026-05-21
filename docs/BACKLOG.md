# PRODUCT BACKLOG: IQ-RA SYSTEM (KOPERASI SYARIAH DIGITAL)

Dokumen ini mendefinisikan *Product Backlog* untuk memandu pengembangan masa depan **IQ-RA System (Koperasi Syariah Digital)** dari fase simulasi saat ini (*offline-first / local storage fallback*) menuju perilisan produksi (*production-ready*) skala penuh.

---

## 📋 Matriks Backlog Utama & Prioritas Pengembangan

| ID Fitur | Deskripsi Task | Modul / Komponen | Prioritas | Estimasi | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BACKLOG-01** | Migrasi Layer Database Lokal ke Production Supabase PostgreSQL | `src/services/db.ts` | **CRITICAL** | 3 Hari | `Ready` |
| **BACKLOG-02** | Implementasi PostgreSQL RLS (Row-Level Security) & Kebijakan Hak Akses | PostgreSQL | **HIGH** | 2 Hari | `Ready` |
| **BACKLOG-03** | Migrasi AI RAG Knowledge Base dari Heuristik Lokal ke pgvector Store | `src/services/ai.ts` | **HIGH** | 2 Hari | `Ready` |
| **BACKLOG-04** | Integrasi Webhook Gateway VA Riil (BSI / Bank Muamalat) | `src/app/page.tsx` | **MEDIUM** | 3 Hari | `Future` |
| **BACKLOG-05** | Integrasi API Vendor PPOB Riil (Digiflazz / Tripay) | `src/app/page.tsx` | **MEDIUM** | 3 Hari | `Future` |
| **BACKLOG-06** | Pembuatan Automated Unit Testing Suite untuk Logika Double-entry SAK EP | `src/services/db.test.ts` | **HIGH** | 2 Hari | `Ready` |
| **BACKLOG-07** | Integrasi Github Actions CI Pipeline dengan SonarCloud / SonarQube | CI/CD | **MEDIUM** | 1 Hari | `Ready` |

---

## 🛠️ Rincian Teknis Pekerjaan (Technical Specifications)

### Phase 1: Integrasi Basis Data & Keamanan (Supabase PostgreSQL)

#### BACKLOG-01: Migrasi Layer Database Lokal ke Production Supabase PostgreSQL
* **Deskripsi**: Mengganti penyimpanan `localStorage` pada berkas `db.ts` dengan panggilan `@supabase/supabase-js` client query.
* **Kriteria Penerimaan (Acceptance Criteria)**:
  - Seluruh status data (Users, Members, Accounts, Transactions, FinancingContracts, JournalEntries, AuditLogs) tersimpan secara persisten pada cloud PostgreSQL.
  - Memanfaatkan *database pooling* Supabase untuk meningkatkan waktu respon di bawah 500ms.
  - Mengimplementasikan mekanisme otomatisasi trigger PostgreSQL untuk pembentukan jurnal entri pada database jika memungkinkan, atau mempertahankan trigger di tingkat application service.

#### BACKLOG-02: Kebijakan RLS (Row-Level Security) Supabase
* **Deskripsi**: Menerapkan kebijakan keamanan *Row-Level Security* di tingkat database PostgreSQL berdasarkan file `docs/SECURITY.md`.
* **Kriteria Penerimaan**:
  - Anggota (`jamaah`) hanya dapat melakukan query terhadap data member, akun, transaksi, dan pembiayaan miliknya sendiri (`auth.uid() = user_id`).
  - DPS dan Takmir memiliki izin khusus untuk melihat dan memperbarui status persetujuan akad (`status` transition) tanpa izin menghapus atau memutasi saldo secara langsung.
  - Admin memiliki akses penuh terhadap Jurnal Buku Besar Umum dan Laporan PHU, namun dibatasi kebijakan proteksi enkripsi data pribadi.

---

### Phase 2: Kecerdasan Buatan & RAG Skala Penuh

#### BACKLOG-03: Ingesti Vektor Fatwa DSN-MUI ke pgvector PostgreSQL
* **Deskripsi**: Mengganti string-matching lokal pada `ai.ts` dengan pencarian kemiripan kosinus (*cosine similarity search*) menggunakan ekstensi `pgvector` di database Supabase.
* **Kriteria Penerimaan**:
  - Membuat tabel `sharia_knowledge` dengan kolom `embedding` bertipe `vector(1536)` (menggunakan model `text-embedding-3-small` / `text-embedding-004`).
  - Menulis naskah ingesti script (`ingest-fatwa.ts`) untuk memotong dokumen fatwa MUI (PDF/Teks) menjadi chunking kecil dan menyimpannya beserta representasi embeddings-nya.
  - Panggilan `queryShariaAssistant` mengirim kueri pertanyaan pengguna ke model embeddings, melakukan kueri pencarian kemiripan semantik PostgreSQL, dan menyisipkannya sebagai instruksi context LLM.

---

### Phase 3: Integrasi Transaksi Digital Riil (Gateway & Vendor)

#### BACKLOG-04: Integrasi Webhook Gateway VA Riil
* **Deskripsi**: Menghubungkan modul simulator Virtual Account ke sistem gateway pembayaran nasional (seperti Midtrans atau Xendit).
* **Kriteria Penerimaan**:
  - Membuat API Route `/api/payment/webhook` di Next.js untuk menerima notifikasi setoran VA dari provider.
  - Webhook memvalidasi *signature key* transaksi, mendebet dana Kas (101) dan mengkredit Simpanan Wadiah anggota (201) secara otomatis setelah pembayaran sukses.

#### BACKLOG-05: Integrasi API Vendor PPOB Riil
* **Deskripsi**: Mengganti data simulasi token, pulsa, dan tagihan air dengan request API ke PPOB Biller riil (seperti Digiflazz).
* **Kriteria Penerimaan**:
  - Menghubungkan form pembelian PPOB ke endpoint provider, memproses transaksi secara asinkronus, serta memotong saldo Wadiah anggota hanya ketika transaksi sukses dari sisi provider.

---

### Phase 4: Pengujian & Kualitas Kode (Quality Assurance)

#### BACKLOG-06: Pengujian Unit Ledger SAK EP & Distribusi Nisbah
* **Deskripsi**: Menulis tes unit otomatis menggunakan Jest atau Vitest untuk menjamin kekokohan perhitungan keuangan.
* **Kriteria Penerimaan**:
  - Test case memvalidasi bahwa setiap transaksi (setoran, penarikan, pembiayaan) menghasilkan saldo debet-kredit jurnal yang seimbang sempurna (selisih = 0).
  - Test case memvalidasi proporsionalitas pembagian hasil Nisbah Mudharabah bulanan tidak melebihi alokasi pool bagi hasil 40% dari laba bersih.

#### BACKLOG-07: Integrasi Github Actions & SonarCloud
* **Deskripsi**: Mengatur workflow Git CI otomatis untuk memindai kode pada setiap pull request berdasarkan konfigurasi `sonar-project.properties`.
* **Kriteria Penerimaan**:
  - Setiap commit di-scan secara otomatis terhadap kerentanan keamanan (*security hotspots*), bug, dan cakupan tes minimal 80%.
