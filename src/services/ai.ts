// Koperasi Syariah Digital (KSD) - Sharia AI Assistant RAG Service
// File: src/services/ai.ts

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

export interface FatwaArticle {
  number: string;
  title: string;
  keywords: string[];
  content: string;
}

// -------------------------------------------------------------
// Fatwa DSN-MUI Preloaded Knowledge Base Index
// -------------------------------------------------------------

const FATWA_DATABASE: FatwaArticle[] = [
  {
    number: 'Fatwa DSN-MUI No. 02/DSN-MUI/IV/2000',
    title: 'Akad Pembiayaan Murabahah (Jual Beli)',
    keywords: ['murabahah', 'jual beli', 'margin', 'keuntungan', 'harga jual', 'tenor', 'angsuran', 'cicil', 'beli barang'],
    content: `Ketentuan Akad Murabahah menurut Fatwa DSN-MUI No. 02:
1. Syarat Barang: Barang yang diperjualbelikan harus halal, jelas spesifikasinya, dan dimiliki oleh koperasi sebelum diserahkan kepada anggota.
2. Transparansi Biaya: Koperasi wajib memberitahukan secara jujur harga beli asli barang (biaya perolehan) kepada anggota beserta nominal keuntungan (margin) yang disepakati.
3. Harga Jual Akhir: Harga jual adalah harga perolehan ditambah margin keuntungan. Sekali disepakati di awal akad, harga ini bersifat mengikat dan TIDAK BOLEH BERUBAH selama masa tenor, bahkan jika anggota mengalami keterlambatan pembayaran.
4. Cara Pembayaran: Pembayaran dilakukan secara angsuran berkala (bulanan) yang besarnya tetap hingga lunas.`
  },
  {
    number: 'Fatwa DSN-MUI No. 19/DSN-MUI/IV/2001',
    title: 'Akad Qardh (Pinjaman Kebajikan Qardhul Hasan)',
    keywords: ['qardh', 'qardhul hasan', 'kebajikan', 'sosial', 'darurat', 'bunga', 'riba', 'tanpa margin', 'biaya admin'],
    content: `Ketentuan Akad Qardh/Qardhul Hasan menurut Fatwa DSN-MUI No. 19:
1. Karakter Sosial: Qardh adalah pinjaman kebajikan untuk membantu anggota yang mengalami kesulitan finansial mendesak atau kebutuhan sosial darurat.
2. Larangan Riba/Keuntungan: Koperasi DILARANG KERAS mengambil keuntungan, margin, bunga, atau mensyaratkan imbalan apa pun dari pokok pinjaman. Anggota wajib mengembalikan pokok pinjaman sama persis dengan yang diterima.
3. Biaya Administrasi: Koperasi diperbolehkan memungut biaya administrasi riil yang wajar (seperti materai atau biaya transfer) dalam bentuk nominal tetap yang wajar (bukan persentase dari nilai pinjaman).
4. Penundaan Pelunasan: Jika anggota terbukti mengalami kesulitan keuangan yang nyata, koperasi disarankan memberikan perpanjangan waktu pengembalian.`
  },
  {
    number: 'Fatwa DSN-MUI No. 07/DSN-MUI/IV/2000',
    title: 'Akad Mudharabah (Pembiayaan Bagi Hasil)',
    keywords: ['mudharabah', 'bagi hasil', 'investasi', 'modal', 'nisbah', 'rasio', 'rugi', 'pengelola', 'usaha'],
    content: `Ketentuan Akad Mudharabah menurut Fatwa DSN-MUI No. 07:
1. Pembiayaan Kemitraan: Koperasi bertindak sebagai pemilik modal (Shahibul Maal) yang menyediakan 100% dana modal usaha, dan anggota bertindak sebagai pengelola usaha (Mudharib).
2. Nisbah Bagi Hasil: Rasio bagi hasil keuntungan (Nisbah) harus disepakati secara jelas di awal akad (misalnya 40% koperasi dan 60% anggota) dari hasil laba operasional usaha.
3. Tanggung Jawab Kerugian: Kerugian finansial sepenuhnya ditanggung oleh koperasi sebagai pemilik modal. Anggota pengelola hanya kehilangan tenaga dan waktu, KECUALI jika terbukti kerugian tersebut terjadi karena kelalaian, pelanggaran kontrak, atau kecurangan (fraud) oleh anggota pengelola.`
  }
];

// -------------------------------------------------------------
// RAG Search Retrieval Engine
// -------------------------------------------------------------

function retrieveContext(query: string): string {
  const normalizedQuery = query.toLowerCase();
  const matchedArticles: FatwaArticle[] = [];

  // Semantic string search matching
  FATWA_DATABASE.forEach(article => {
    const score = article.keywords.filter(keyword => normalizedQuery.includes(keyword)).length;
    // Add if at least one keyword matches, or if query mentions the fatwa number/title
    if (score > 0 || normalizedQuery.includes(article.number.toLowerCase()) || normalizedQuery.includes('fatwa')) {
      matchedArticles.push(article);
    }
  });

  if (matchedArticles.length === 0) {
    // Return all as default context if no specific matches found to guide the LLM
    return FATWA_DATABASE.map(a => `[${a.number} - ${a.title}]\n${a.content}`).join('\n\n');
  }

  return matchedArticles.map(a => `[${a.number} - ${a.title}]\n${a.content}`).join('\n\n');
}

// -------------------------------------------------------------
// Local Heuristics Sharia Agent (Fallback Handler)
// -------------------------------------------------------------

function generateLocalFallbackResponse(query: string, context: string): string {
  const normalized = query.toLowerCase();

  let intro = `### 🕌 Tanggapan Asisten Kepatuhan Syariah IQ-RA (Mode Offline)\n\n`;
  let body = '';

  if (normalized.includes('murabahah') || normalized.includes('jual beli')) {
    body = `**Akad Murabahah (Jual Beli dengan Keuntungan)** diatur secara ketat berdasarkan **Fatwa DSN-MUI No. 02**. Berikut poin penting yang wajib diperhatikan:\n
* **Transparansi Margin**: Koperasi wajib memberitahukan harga beli asli dan margin keuntungan yang disepakati secara terbuka.\n
* **Harga Dikunci**: Sekali akad ditandatangani, harga jual akhir (pokok + margin) dikunci dan **TIDAK BOLEH bertambah** meskipun terjadi keterlambatan pembayaran. Hal ini untuk menghindari Riba Jahiliyyah.\n
* **Kepemilikan Barang**: Koperasi harus menguasai atau memiliki barang tersebut sebelum menjualnya kepada anggota.\n\n*Apakah Anda ingin mencoba simulasi pengajuan pembiayaan Murabahah pada portal anggota di atas?*`;
  } else if (normalized.includes('qard') || normalized.includes('pinjaman') || normalized.includes('sosial') || normalized.includes('darurat')) {
    body = `**Akad Qardhul Hasan (Pinjaman Kebajikan)** diatur berdasarkan **Fatwa DSN-MUI No. 19**. Akad ini bersifat sosial murni:\n
* **Nol Persen Margin**: Koperasi dilarang keras memungut margin keuntungan, bunga, atau imbalan persentase lainnya. Pengembalian dana wajib sama persis (100% pokok saja).\n
* **Biaya Operasional**: Hanya boleh memungut biaya administrasi riil (seperti meterai) berupa nominal tetap (*flat*) wajar, bukan persentase dari nominal pinjaman.\n
* **Tujuan**: Sangat cocok digunakan untuk keperluan mendesak, darurat medis, atau bantuan kebajikan sosial.\n\n*Anda dapat menyimulasikan pengajuan Qardhul Hasan hingga Rp 5.000.000 pada portal anggota.*`;
  } else if (normalized.includes('mudharabah') || normalized.includes('investasi') || normalized.includes('bagi hasil')) {
    body = `**Akad Mudharabah (Kemitraan Bagi Hasil)** diatur berdasarkan **Fatwa DSN-MUI No. 07**:\n
* **Penyertaan Modal**: Koperasi bertindak sebagai penyedia 100% modal usaha (*Shahibul Maal*), sedangkan anggota adalah pengelola usaha (*Mudharib*).\n
* **Nisbah**: Penentuan bagi hasil dihitung berdasarkan persentase rasio (Nisbah) dari keuntungan operasional usaha yang disepakati di awal akad.\n
* **Pembagian Risiko**: Kerugian finansial usaha ditanggung sepenuhnya oleh pemilik modal (koperasi), kecuali jika disebabkan oleh kelalaian nyata atau penyelewengan oleh pengelola usaha.\n\n*Sistem ini memiliki Nisbah Engine otomatis yang membagi hasil keuntungan koperasi ke anggota Mudharabah setiap akhir bulan.*`;
  } else {
    body = `Terima kasih atas pertanyaan Anda. Saya adalah **Asisten Kepatuhan Syariah IQ-RA**. \n\nSaya mendeteksi pertanyaan Anda mengenai ketentuan koperasi syariah. Berikut adalah rangkuman aturan syariah berdasarkan **Fatwa DSN-MUI**:\n
1. **Murabahah**: Transaksi jual beli barang dengan kejelasan harga pokok dan margin keuntungan yang dikunci di awal akad.\n
2. **Qardhul Hasan**: Pinjaman kebajikan tanpa tambahan bunga/margin apa pun khusus untuk keperluan sosial darurat.\n
3. **Mudharabah**: Kerja sama bisnis bagi hasil berdasarkan kesepakatan rasio (Nisbah) di mana kerugian ditanggung pemilik modal.\n\nSilakan ajukan pertanyaan lebih spesifik mengenai ketiga akad di atas untuk mendapatkan rincian fatwa syariah secara detail!`;
  }

  return intro + body;
}

// -------------------------------------------------------------
// Main AI Query Executor
// -------------------------------------------------------------

export async function queryShariaAssistant(query: string): Promise<string> {
  const context = retrieveContext(query);
  const apiKey = process.env.GOOGLE_API_KEY;

  // If no API key is provided, or it is a placeholder string, trigger fallback immediately
  if (!apiKey || apiKey.startsWith('MASUKKAN') || apiKey === 'your-gemini-api-key') {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(generateLocalFallbackResponse(query, context));
      }, 600); // Small delay to feel like a premium real-time AI response
    });
  }

  try {
    const chat = new ChatGoogleGenerativeAI({
      apiKey: apiKey,
      model: 'gemini-1.5-flash',
      maxOutputTokens: 1000,
      temperature: 0.3
    });

    const systemPrompt = `Anda adalah "Asisten Kepatuhan Syariah IQ-RA", asisten AI profesional untuk Koperasi Syariah Digital (KSD) IQ-RA System. Tugas utama Anda adalah memberikan bimbingan mengenai keabsahan transaksi, akad syariah, dan kepatuhan operasional berdasarkan Fatwa DSN-MUI (Dewan Syariah Nasional - Majelis Ulama Indonesia).

Aturan Menjawab:
1. Selalu bersikap sopan, ramah, dan gunakan tata bahasa profesional dalam bahasa Indonesia.
2. Jawab pertanyaan dengan merujuk langsung pada konteks Fatwa DSN-MUI yang relevan yang disediakan di bawah ini.
3. Sebutkan secara spesifik nomor Fatwa dan pasal/ketentuan terkait apabila relevan (misalnya Fatwa DSN-MUI No. 02 tentang Murabahah).
4. Jika pertanyaan di luar topik keuangan syariah, ingatkan pengguna secara sopan bahwa tugas Anda terbatas pada kepatuhan syariah dan panduan koperasi.
5. Gunakan format Markdown yang rapi (bullet points, tebal, dll.) agar mudah dibaca oleh anggota koperasi dan takmir.

Konteks Dokumen Kepatuhan Syariah Fatwa DSN-MUI:
${context}`;

    const response = await chat.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(query)
    ]);

    return response.content as string;
  } catch (error: any) {
    console.warn("Gemini API call failed, running heuristics sharia engine fallback:", error.message);
    return generateLocalFallbackResponse(query, context);
  }
}
