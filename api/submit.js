// File: /api/submit.js
// Versi: Fire-and-Forget

// (Fungsi crc16 dan generateFinalQrisString Anda tetap sama di atas)
function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
function generateFinalQrisString(nominal) {
  const qrisBaseLama = process.env.QRIS_BASE_STRING;
  if (!qrisBaseLama) { throw new Error("Kesalahan Server: QRIS_BASE_STRING tidak ditemukan."); }
  const nominalStr = String(Math.round(nominal));
  const amountTag = "54" + String(nominalStr.length).padStart(2, "0") + nominalStr;
  const qrisBaseTanpaCRC = qrisBaseLama.substring(0, qrisBaseLama.length - 8);
  const titikSisip = "5802ID";
  const indexSisip = qrisBaseTanpaCRC.indexOf(titikSisip);
  if (indexSisip === -1) { throw new Error("Kesalahan Server: String qrisBase tidak valid"); }
  const part1 = qrisBaseTanpaCRC.substring(0, indexSisip);
  const part2 = qrisBaseTanpaCRC.substring(indexSisip);
  let qrisNoCRC = part1 + amountTag + part2 + "6304";
  const crc = crc16(qrisNoCRC);
  return qrisNoCRC + crc;
}
// --- AKHIR FUNGSI ---


export default async function handler(request, response) {
  // Hanya izinkan metode POST
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Hanya metode POST yang diizinkan' });
  }

  // Definisikan variabel di scope atas
  let totalFinal;
  let orderId;
  let finalQrisString;
  let sheetData;
  const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

  // ===================================================================
  // === BAGIAN 1: PEKERJAAN KRITIS (DIKIRIM KE FRONTEND) ===
  // ===================================================================
  // Semua ini HARUS berhasil. Jika gagal, frontend akan dapat error 500.
  try {
    const data = request.body;

    // Validasi Environment Variables
    if (!GOOGLE_SCRIPT_URL) {
        throw new Error("Kesalahan Server: GOOGLE_SCRIPT_URL tidak diatur.");
    }
    // Validasi QRIS_BASE_STRING dipindahkan ke dalam generateFinalQrisString
    
    // Hitung Total Final di backend
    const kodeUnik = Math.floor(Math.random() * 99) + 1;
    totalFinal = data.totalAsli + kodeUnik;
    orderId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Buat String QRIS Dinamis di backend (bisa melempar error jika env var hilang)
    finalQrisString = generateFinalQrisString(totalFinal);

    // Siapkan data untuk Google Sheet (disimpan di variabel)
    sheetData = {
      nama: data.nama,
      telepon: data.telepon,
      kelas: data.kelas,
      itemsString: data.itemsString,
      totalFinal: totalFinal
    };
    
    // =======================================================
    // === LANGSUNG KIRIM BALASAN KE FRONTEND ===
    // =======================================================
    // Frontend akan menerima data ini dan menampilkan modal QRIS.
    // Koneksi ke frontend selesai di sini.
    response.status(200).json({
      status: "success", 
      orderId: orderId, 
      finalAmount: totalFinal,
      qrisString: finalQrisString 
    });

  } catch (error) {
    // Jika ada error di BAGIAN 1 (misal QRIS_BASE_STRING tidak ada),
    // kirim error ke frontend dan hentikan eksekusi.
    console.error("Error Kritis di /api/submit:", error.message);
    if (!response.headersSent) {
        response.status(500).json({ status: "error", message: error.message });
    }
    return; // Hentikan fungsi
  }


  // ===================================================================
  // === BAGIAN 2: FIRE-AND-FORGET (DIKERJAKAN DI LATAR BELAKANG) ===
  // ===================================================================
  // Kode ini dieksekusi SETELAH response.json() dikirim ke frontend.
  // Frontend tidak akan menunggu ini selesai.
  try {
    // Kita 'await' di sini, tapi frontend sudah tidak peduli.
    const googleResponse = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(sheetData), // Ambil data dari variabel di atas
        headers: { "Content-Type": "text/plain;charset=utf-8" }, 
    });

    // Cek apakah Google merespons dengan OK (hanya untuk logging di Vercel)
    if (!googleResponse.ok) {
      // Jika Gagal, log ke Vercel, frontend tidak akan tahu
      console.error(`Google Script GAGAL dihubungi (background). Status: ${googleResponse.statusText}`);
    } else {
      const googleResult = await googleResponse.json();
      if (googleResult.status !== "success") {
        console.error(`Google Script ERROR (background): ${googleResult.message}`);
      } else {
        // Sukses
        console.log("Sukses kirim ke Google Sheet (background).");
      }
    }
  } catch (error) {
    // Tangkap jika fetch-nya sendiri gagal (misal Google down)
    console.error("Error saat 'fire and forget' ke Google Script:", error.message);
  }
  
  // Fungsi serverless selesai dengan sendirinya
}