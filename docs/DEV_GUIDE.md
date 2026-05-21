# DEVELOPER & CONTRIBUTION GUIDE

Panduan teknis bagi para *developer* untuk berkontribusi pada pengembangan, pengujian, dan pemeliharaan basis kode **IQ-RA System (Koperasi Syariah Digital)**.

---

## 1. Standar Penulisan Kode (Coding Standards)

Guna menjaga kualitas dan kebersihan kode (*clean code*), seluruh kontributor wajib mematuhi standar berikut:

### 1.1. TypeScript & React
* Gunakan TypeScript secara ketat (*strict mode*). Hindari penggunaan tipe data `any`. Seluruh objek database dan akuntansi wajib memiliki tipe interface yang jelas (misal: `User`, `Member`, `FinancingContract`, `JournalEntry`).
* Manfaatkan kekuatan Next.js Server-Side or Client-Side rendering dengan bijak. Interaktivitas UI dashboard menggunakan fungsionalitas React State untuk rendering ultra-cepat tanpa overhead.

### 1.2. Desain Antarmuka (Tailwind CSS v4)
* Aplikasi menggunakan **Tailwind CSS v4** dengan import direktif baru (`@import "tailwindcss";` di `globals.css`).
* Seluruh komponen wajib menggunakan tema warna terstandarisasi yang selaras dengan nilai-nilai syariah (kombinasi warna hijau zamrud premium/emerald, slate, dan putih/gelap).
* Hindari penulisan kode CSS ad-hoc; manfaatkan utilitas kelas Tailwind CSS v4 dan variabel CSS `@theme` untuk konsistensi layout.

---

## 2. Struktur Direktori Utama

* `/docs`: Seluruh file dokumentasi rancangan, kepatuhan, dan panduan arsitektur sistem.
* `/src/app`: Menggunakan App Router Next.js.
  - `page.tsx`: Berisi halaman utama dashboard interaktif terintegrasi yang melayani simulasi seluruh peran pengguna (Jamaah, Takmir, DPS, Admin) serta asisten AI.
  - `globals.css`: Konfigurasi global styling Tailwind CSS v4.
  - `layout.tsx`: Penyusunan layout root HTML, metadata, dan pemuatan font.
* `/src/services`: Modul logika bisnis inti.
  - `db.ts`: Pengelolaan data simulasi relasional, akuntansi ledger ganda, serta penyimpanan persistent di `localStorage`.
  - `ai.ts`: Jalur pipa integrasi asisten kecerdasan buatan syariah dengan Google Gemini API menggunakan LangChain.

---

## 3. Menjalankan Lingkungan Pengembangan Lokal

### 3.1. Prasyarat
Pastikan komputer Anda sudah terinstal **Node.js** (versi 18+) dan **npm**.

### 3.2. Langkah Setup & Eksekusi
1. Pasang seluruh dependensi proyek:
   ```bash
   npm install
   ```
2. Buat file konfigurasi `.env.local` di direktori utama dan isi dengan Google API Key untuk AI Assistant:
   ```env
   GOOGLE_API_KEY=AIzaSyADcXaRiqHwyN-ykbNgsoCs0GJrCZ-eFlE
   ```
3. Jalankan server pengembangan lokal:
   ```bash
   npm run dev
   ```
4. Buka browser dan arahkan ke alamat: `http://localhost:3000`

---

## 4. Kualitas Kode & Analisis Statis (SonarCloud)

Proyek ini telah dikonfigurasi untuk pengujian kualitas kode otomatis menggunakan **SonarCloud / SonarQube** melalui file `sonar-project.properties` di root direktori.

Sebelum melakukan Pull Request (PR):
* Jalankan linter bawaan Next.js untuk mendeteksi kesalahan sintaksis:
  ```bash
  npm run lint
  ```
* Pastikan kode Anda tidak memicu peringatan *code smells*, potensi kebocoran data, atau masalah keamanan yang dapat terdeteksi oleh analisis statis SonarCloud.
