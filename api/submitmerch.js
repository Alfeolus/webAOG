// File: /api/submitmerch.js
// (FungSI crc16 dan generateFinalQrisString Anda tetap di atas)

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Hanya metode POST yang diizinkan' });
  }

  try {
    const data = request.body;
    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL_MERCH; 

    if (!GOOGLE_SCRIPT_URL) {
        throw new Error("Kesalahan Server: GOOGLE_SCRIPT_URL_MERCH tidak diatur.");
    }

    // --- Validasi (Ini bisa Anda tambahkan lagi jika perlu) ---
    const { nama, telepon, kelas, itemsString, totalAsli, referralCode } = data;
    if (!nama || !telepon || !itemsString) {
      throw new Error("Mohon lengkapi semua data yang wajib diisi.");
    }
    // --- Akhir Validasi ---

    const kodeUnik = Math.floor(Math.random() * 99) + 1;
    const totalFinal = totalAsli + kodeUnik;
    const orderId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const finalQrisString = generateFinalQrisString(totalFinal);

    const sheetData = {
      nama: nama,
      telepon: telepon,
      kelas: kelas,
      itemsString: itemsString,
      totalFinal: totalFinal,
      referralCode: referralCode
    };
    
    // =======================================================
    // === KIRIM KE GOOGLE SHEET (VERSI SEDERHANA & BENAR) ===
    // =======================================================
    const googleResponse = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(sheetData),
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        redirect: 'manual' // PENTING: Jangan ikuti redirect
    });

    // Jika deployment salah, Google kirim 302. 
    // 'redirect: manual' membuat .ok menjadi 'false' jika status bukan 2xx.
    if (!googleResponse.ok) {
      throw new Error(`Google Script GAGAL merespons. Status: ${googleResponse.status}. Cek Deployment 'Who has access', HARUS 'Anyone'.`);
    }

    // Jika lolos, berarti status 200 OK dan kita HARUSNYA dapat JSON
    const googleResult = await googleResponse.json(); 

    if (googleResult.status !== "success") {
      throw new Error(`Google Script ERROR: ${googleResult.message}`);
    }
    // =======================================================

    // KIRIM BALASAN SUKSES KE FRONTEND
    response.status(200).json({
      status: "success", 
      orderId: orderId, 
      finalAmount: totalFinal,
      qrisString: finalQrisString 
    });

  } catch (error) {
    // Error akan ditangkap di sini, termasuk error 'Unexpected token <'
    console.error("Error di /api/submit-merch:", error.message);
    response.status(500).json({ status: "error", message: error.message });
  }
}