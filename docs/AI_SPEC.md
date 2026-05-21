# SHARIA AI COMPLIANCE ASSISTANT (RAG SPECIFICATION)

Dokumen ini mendefinisikan spesifikasi teknis, rancangan pipa data AI (*RAG Pipeline*), serta pendaftaran *prompt* sistem (*System Prompt Registry*) yang digunakan untuk mengoperasikan Asisten Kepatuhan Syariah interaktif pada **IQ-RA System (Koperasi Syariah Digital)**.

---

## 1. Arsitektur AI RAG (LangChain + Google Gemini)

Sistem mengintegrasikan teknologi Kecerdasan Buatan (AI) berbasis pencarian semantik untuk menyediakan konsultasi hukum syariah yang valid dan akurat:
* **Engine LLM**: Google Gemini API (menggunakan `@langchain/google-genai`).
* **Framework Kontrol**: `@langchain/core` untuk manajemen prompt dan parsing hasil respon model.
* **Vector Store (pgvector)**: Menyimpan embeddings dari potongan teks fatwa DSN-MUI dengan model embedding Gemini, yang kemudian dicari kemiripannya saat pengguna mengajukan pertanyaan.

---

## 2. Pendaftaran Prompt Sistem (System Prompt Registry)

Asisten AI dikendalikan menggunakan instruksi sistem (*System Prompt*) yang ketat guna memastikan jawaban tetap fokus, profesional, patuh syariah, dan terpercaya:

```markdown
Anda adalah "Asisten Kepatuhan Syariah IQ-RA", asisten AI profesional untuk Koperasi Syariah Digital (KSD) IQ-RA System. Tugas utama Anda adalah memberikan bimbingan mengenai keabsahan transaksi, akad syariah, dan kepatuhan operasional berdasarkan Fatwa DSN-MUI (Dewan Syariah Nasional - Majelis Ulama Indonesia).

Aturan Menjawab:
1. Selalu bersikap sopan, ramah, dan gunakan tata bahasa profesional dalam bahasa Indonesia.
2. Jawab pertanyaan dengan merujuk langsung pada konteks Fatwa DSN-MUI yang relevan yang disediakan di bawah ini.
3. Sebutkan secara spesifik nomor Fatwa dan pasal/ketentuan terkait apabila relevan (misalnya Fatwa DSN-MUI No. 02 tentang Murabahah).
4. Jika pertanyaan di luar topik keuangan syariah, ingatkan pengguna secara sopan bahwa tugas Anda terbatas pada kepatuhan syariah dan panduan koperasi.
5. Gunakan format Markdown yang rapi (bullet points, tebal, dll.) agar mudah dibaca oleh anggota koperasi dan takmir.

Konteks Dokumen Kepatuhan Syariah:
[KONTEKS_DOKUMEN_YANG_DI_RETRIEVE]
```

---

## 3. Korpus Dokumen Kepatuhan Syariah (Preloaded Fatwas)

Asisten AI dibekali dengan basis pengetahuan semantik (*Vectorized Context*) yang bersumber langsung dari Fatwa DSN-MUI berikut:

### 3.1. Fatwa DSN-MUI No. 02 / DSN-MUI / IV / 2000 tentang Akad Murabahah
* **Ketentuan Akad**: Penjual harus memberitahukan biaya perolehan barang kepada nasabah, dan menyatakan nominal keuntungan (margin) yang disepakati secara transparan.
* **Harga Jual**: Harga jual adalah harga perolehan ditambah margin keuntungan. Harga jual ini dikunci di awal akad dan **TIDAK BOLEH BERUBAH** selama masa angsuran, meskipun ada keterlambatan pembayaran.
* **Pembayaran**: Dilakukan dengan cara angsuran bulanan tetap.

### 3.2. Fatwa DSN-MUI No. 19 / DSN-MUI / IV / 2001 tentang Akad Qardh (Qardhul Hasan)
* **Ketentuan Pinjaman**: Akad Qardh adalah pinjaman kebajikan yang diberikan kepada nasabah yang membutuhkan dana darurat sosial.
* **Keuntungan**: Koperasi **DILARANG KERAS** memungut tambahan keuntungan, bunga, atau persentase apa pun dari pinjaman Qardhul Hasan. Pengembalian wajib sama persis dengan nominal pokok yang dicairkan.
* **Biaya**: Koperasi hanya boleh memungut biaya administrasi riil (seperti biaya materai atau biaya transfer antarbank jika ada) dalam nominal tetap yang wajar, bukan persentase dari nominal pinjaman.

### 3.3. Fatwa DSN-MUI No. 07 / DSN-MUI / IV / 2000 tentang Pembiayaan Mudharabah
* **Prinsip**: Pembiayaan kemitraan di mana koperasi menyediakan 100% modal operasional dan anggota menjadi pengelola usaha (*Mudharib*).
* **Bagi Hasil (Nisbah)**: Keuntungan usaha dibagi berdasarkan rasio Nisbah yang disepakati di awal akad (misalnya 40% koperasi, 60% pengelola).
* **Kerugian**: Kerugian finansial sepenuhnya ditanggung oleh koperasi sebagai pemilik modal, kecuali jika kerugian tersebut terbukti disebabkan oleh kelalaian, pelanggaran kesepakatan, atau kecurangan oleh pengelola usaha.
