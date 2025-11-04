// File: /api/submit.js
// VERSI FINAL (FIRE-AND-FORGET)

// ===================================================================
// === FUNGSI HELPER (JANGAN DIHAPUS) ===
// ===================================================================
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
// --- AKHIR FUNGSI HELPER ---


// ===================================================================
// === FUNGSI HANDLER (FIRE-AND-FORGET) ===
// ===================================================================
export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Hanya metode POST yang diizinkan' });
  }

  // Definisikan variabel di scope atas
  let sheetData;
  const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

  // ===================================================================
  // === BAGIAN 1: PEKERJAAN KRITIS (DIKIRIM KE FRONTEND) ===
  // ===================================================================
  try {
    const data = request.body;
    if (!GOOGLE_SCRIPT_URL) {
        throw new Error("Kesalahan Server: GOOGLE_SCRIPT_URL tidak diatur.");
    }
    
    // Hitung Total Final
    const kodeUnik = Math.floor(Math.random() * 99) + 1;
    const totalFinal = data.totalAsli + kodeUnik;
    const orderId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Buat String QRIS Dinamis (bisa error jika QRIS_BASE_STRING hilang)
    const finalQrisString = generateFinalQrisString(totalFinal);

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
    console.log("Fire-and-Forget: Mencoba kirim ke Google Sheet...");
    
    const googleResponse = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(sheetData), // Ambil data dari variabel di atas
        headers: { "Content-Type": "text/plain;charset=utf-8" }, 
    });

    // Kita tidak peduli lagi dengan balasan 'googleResponse.json()'
    // Kita hanya cek log untuk kita sendiri
    if (!googleResponse.ok) {
      console.error(`Google Script GAGAL dihubungi (background). Status: ${googleResponse.statusText}`);
    } else {
      // Kita bahkan tidak perlu cek googleResult.json() lagi, data sudah pasti masuk
      console.log("Fire-and-Forget: Sukses terkirim ke Google Sheet (background).");
    }

  } catch (error) {
    // Tangkap jika fetch-nya sendiri gagal (misal Google down)
    console.error("Error saat 'fire and forget' ke Google Script:", error.message);
  }
  
  // Fungsi serverless selesai dengan sendirinya
}