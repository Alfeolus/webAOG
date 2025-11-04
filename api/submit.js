// File: /api/submit.js
// VERSI DEBUG (SEMENTARA)

// ... (fungsi crc16 dan generateFinalQrisString Anda tetap di sini) ...
// ...

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Hanya metode POST yang diizinkan' });
  }

  const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

  try {
    const data = request.body;
    if (!GOOGLE_SCRIPT_URL) {
      throw new Error("Kesalahan Server: GOOGLE_SCRIPT_URL tidak diatur.");
    }
    
    // Hitung Total Final
    const kodeUnik = Math.floor(Math.random() * 99) + 1;
    const totalFinal = data.totalAsli + kodeUnik;
    const orderId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Buat QRIS
    const finalQrisString = generateFinalQrisString(totalFinal);

    // Siapkan data sheet
    const sheetData = {
      nama: data.nama,
      telepon: data.telepon,
      kelas: data.kelas,
      itemsString: data.itemsString,
      totalFinal: totalFinal
    };
    
    // =======================================================
    // === INI BAGIAN DEBUG ===
    // Kita 'await' Google SEBELUM membalas ke frontend
    // =======================================================
    const googleResponse = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(sheetData),
        headers: { "Content-Type": "text/plain;charset=utf-8" }, 
    });

    if (!googleResponse.ok) {
      // Jika Google error, lempar error LENGKAP
      throw new Error(`Google Script GAGAL dihubungi. Status: ${googleResponse.status} ${googleResponse.statusText}`);
    }

    const googleResult = await googleResponse.json();
    if (googleResult.status !== "success") {
      throw new Error(`Google Script ERROR: ${googleResult.message}`);
    }
    // =======================================================
    // === AKHIR BAGIAN DEBUG ===
    // =======================================================

    // Jika sampai sini, berarti Google SUKSES.
    // Baru kita kirim balasan ke frontend.
    response.status(200).json({
      status: "success", 
      orderId: orderId, 
      finalAmount: totalFinal,
      qrisString: finalQrisString 
    });

  } catch (error) {
    // Jika Vercel error ATAU Google error, errornya akan dikirim ke frontend
    console.error("Error di /api/submit (MODE DEBUG):", error.message);
    response.status(500).json({ status: "error", message: error.message });
  }
}