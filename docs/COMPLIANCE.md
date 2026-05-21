# COMPLIANCE, SAK EP STANDARDS & AUDIT TRAIL

Dokumen ini menjelaskan kebijakan kepatuhan regulasi pemerintah, standar pelaporan akuntansi keuangan **SAK EP** (Standar Akuntansi Keuangan Entitas Privat), prosedur verifikasi *Know Your Customer* (KYC), serta arsitektur log penelusuran (*Audit Trail*) untuk mencegah penyelewengan (*Fraud Prevention*) pada **IQ-RA System (Koperasi Syariah Digital)**.

---

## 1. Kepatuhan Standar Akuntansi SAK EP

Koperasi Syariah Digital diwajibkan untuk mengadopsi standar **SAK EP** sebagai kerangka pelaporan keuangan. Sistem memastikan kepatuhan akuntansi melalui kontrol otomatis berikut:

### 1.1. Persamaan Dasar Akuntansi Neraca
Sistem secara ketat menerapkan validasi bahwa total Aset (Aktiva) harus selalu sama dengan jumlah Liabilitas ditambah Ekuitas (Pasiva) pada setiap detik transaksi:
$$\text{Aset (COA 1xx)} = \text{Liabilitas (COA 2xx)} + \text{Ekuitas (COA 3xx)}$$
Jika terjadi ketidakseimbangan, sistem akan memblokir transaksi di tingkat basis data.

### 1.2. Pengakuan Pendapatan Margin Berbasis Akrual
* Pada akad Murabahah, margin keuntungan yang disepakati di awal diakui sebagai piutang Murabahah. 
* Laba margin direalisasikan secara berkala (*accrued*) seiring pembayaran angsuran bulanan oleh anggota, yang secara transparan membagi pembayaran angsuran menjadi porsi pengembalian pokok dan porsi pendapatan margin koperasi (akrual bulanan).

---

## 2. Prosedur KYC & Anti-Money Laundering (AML)

Guna mematuhi Peraturan OJK dan Kementerian Koperasi tentang pencegahan pencucian uang dan pendanaan terorisme (APU-PPT), koperasi menerapkan alur verifikasi keanggotaan terstruktur:

1. **Pengumpulan Identitas**: Setiap pendaftar wajib melengkapi data profil meliputi Nama Lengkap (sesuai KTP), Nomor Induk Kependudukan (NIK - 16 digit), Alamat Domisili, dan Nomor Telepon Aktif.
2. **Validasi Administratif (Takmir)**: Takmir masjid bertindak sebagai pihak pertama yang memverifikasi keabsahan profil jamaah di lingkungannya secara langsung sebelum memberikan persetujuan KYC.
3. **Pemberian Akun Anggota**: Setelah disetujui, status KYC anggota disetujui menjadi `verified`, yang secara otomatis memicu pembukaan buku tabungan virtual untuk simpanan pokok, wajib, wadiah, dan mudharabah.

---

## 3. Spesifikasi Jejak Audit (Audit Trail Spec)

Audit Trail adalah catatan elektronik permanen (*immutable*) yang merekam seluruh peristiwa penting dalam basis data sistem untuk kebutuhan forensik dan audit tahunan.

### 3.1. Struktur Log Audit (`audit_logs`)
Setiap kali terjadi perubahan data sensitif (seperti pendaftaran pengguna, persetujuan pembiayaan, setoran teller, atau penarikan dana), sistem menulis entri baru ke tabel `audit_logs` dengan format data:
* `id`: Unique Identifier.
* `user_id`: Referensi ID pengguna yang melakukan tindakan.
* `action`: Penjelasan tindakan (misal: `KYC_APPROVAL`, `FINANCING_DISBURSEMENT`, `WITHDRAWAL`).
* `target_table`: Nama tabel yang terdampak (misal: `members`, `financing_contracts`, `transactions`).
* `ip_address`: Alamat IP asal request untuk pelacakan lokasi.
* `created_at`: Stempel waktu presisi tinggi (*timestamp*).

---

## 4. Kepatuhan Kualifikasi Akad Syariah (Sharia Audit)

Sistem secara terprogram mencegah pelanggaran syariah (Riba, Gharar, Maysir) melalui validasi parameter akad secara otomatis:

* **Pemeriksaan Akad Murabahah (Jual Beli)**:
  - Wajib memiliki harga beli barang (pokok) dan harga jual akhir (pokok + margin) yang disepakati dan dikunci di awal akad. Harga tidak boleh berubah di tengah jalan meskipun ada keterlambatan pembayaran.
  - Sanksi keterlambatan (*Ta'zir*) tidak boleh dihitung sebagai bunga bergulung dan tidak boleh diakui sebagai pendapatan koperasi, melainkan wajib disalurkan langsung sebagai dana kebajikan/sosial (*Dana Qardh*).
* **Pemeriksaan Akad Qardhul Hasan (Pinjaman Kebajikan)**:
  - Dipastikan **100% bebas bunga/margin**. Nilai total yang harus dikembalikan oleh anggota wajib sama persis dengan nominal dana yang dicairkan di awal akad.
