import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// Automatically save database on non-GET /api/ requests to prevent data loss on server restart
app.use((req, res, next) => {
  res.on("finish", () => {
    if (req.method !== "GET" && req.path && req.path.startsWith("/api/")) {
      saveDatabase();
    }
  });
  next();
});

const DB_FILE = path.join(process.cwd(), "db_store.json");

// Helper to validate & diagnose Google Apps Script Web App URL format
function validateGasUrlFormat(url: string): { valid: boolean; message?: string } {
  const cleanUrl = (url || "").trim();
  if (!cleanUrl) {
    return { valid: false, message: "URL Google Sheets belum dikonfigurasi!" };
  }
  if (cleanUrl.includes("docs.google.com/spreadsheets/d/")) {
    return {
      valid: false,
      message: "🛑 SALAH FORMAT URL: Anda memasukkan URL Spreadsheet Google Sheets, BUKAN Web App URL!\n\nSOLUSI:\n1. Buka Spreadsheet Anda > Extensions > Apps Script.\n2. Klik Deploy > New Deployment > Web App.\n3. Salin 'Web App URL' yang berakhiran '/exec'."
    };
  }
  if (cleanUrl.endsWith("/dev")) {
    return {
      valid: false,
      message: "🛑 SALAH FORMAT URL: URL berakhiran '/dev' hanya bisa diakses saat Anda login di browser pemilik.\n\nSOLUSI:\nGanti '/dev' di akhir URL menjadi '/exec', atau lakukan Deploy ulang sebagai Web App publik."
    };
  }
  if (!cleanUrl.startsWith("https://script.google.com/macros/s/")) {
    return {
      valid: false,
      message: "🛑 FORMAT URL TIDAK VALID: URL Google Apps Script Web App harus diawali dengan 'https://script.google.com/macros/s/' dan berakhiran '/exec'."
    };
  }
  return { valid: true };
}

// Google Sheets Sync Helper Function
async function syncEntityToSheet(entityName: string, payloadData?: any, bypassEnabledCheck = false) {
  if (!db.settings.googleSheetUrl) {
    return { success: false, message: "URL Google Sheets belum dikonfigurasi." };
  }
  if (!bypassEnabledCheck && !db.settings.isSheetEnabled) {
    return { success: false, message: "Sinkronisasi Google Sheets dinonaktifkan di pengaturan." };
  }

  const url = db.settings.googleSheetUrl.trim();
  const urlCheck = validateGasUrlFormat(url);
  if (!urlCheck.valid) {
    return { success: false, message: urlCheck.message };
  }

  let sheetName = "";
  let headers: string[] = [];
  let action = "sync_row";
  let keyIndex = 0;
  let rowData: any[] = [];
  let rows: any[][] = [];

  switch (entityName) {
    case "transaksi":
      sheetName = "Transaksi";
      headers = [
        "Tanggal & Waktu",
        "No. Nota",
        "Email Kasir",
        "Nama Kasir",
        "Cabang",
        "Subtotal",
        "Diskon",
        "Pajak",
        "Total Transaksi",
        "Metode Pembayaran",
        "Shift",
        "Uang Bayar",
        "Kembalian",
        "Detail Barang",
        "Status Sinkronisasi"
      ];
      action = "sync_row";
      keyIndex = 1; // Match by No. Nota
      
      const t = payloadData || {};
      let itemsSummary = "";
      if (Array.isArray(t.item)) {
        itemsSummary = t.item.map((it: any) => `${it.nama} (x${it.qty})`).join(", ");
      } else if (Array.isArray(t[7])) {
        itemsSummary = t[7].map((it: any) => `${it.nama} (x${it.qty})`).join(", ");
      }
      
      rowData = [
        new Date(t.timestamp || t[0] || Date.now()).toLocaleString("id-ID"),
        t.nota || t[1] || "",
        t.email || t[2] || "",
        t.kasir || t[3] || "",
        t.cabang || t[4] || "",
        Number(t.subtotal || t[8] || 0),
        Number(t.diskon || t[9] || 0),
        Number(t.pajak || t[10] || 0),
        Number(t.total || t[5] || 0),
        t.metode || t[6] || "",
        t.shift || "Pagi",
        Number(t.bayar || t[11] || 0),
        Number(t.kembalian || t[12] || 0),
        itemsSummary,
        "Tersinkronisasi"
      ];
      break;

    case "barang":
      sheetName = "Data Barang";
      headers = ["ID", "Kode Barang", "Nama Barang", "Harga Beli", "HPP", "Harga Jual", "Stok", "Foto URL", "Cabang"];
      action = "sync_bulk";
      rows = db.barang.map((b: any) => [
        b[0],
        b[1],
        b[2],
        Number(b[3] || 0),
        Number(b[4] || 0),
        Number(b[5] || 0),
        Number(b[6] || 0),
        b[7],
        b[8]
      ]);
      break;

    case "cabang":
      sheetName = "Data Cabang";
      headers = ["ID Cabang", "Nama Cabang", "Alamat"];
      action = "sync_bulk";
      rows = db.cabang.map((c: any) => [c[0], c[1], c[2]]);
      break;

    case "users":
      sheetName = "Data Staff";
      headers = ["Email", "Sandi", "Nama Staff", "Role", "Cabang", "Komisi (%)"];
      action = "sync_bulk";
      rows = db.users.map((u: any) => [
        u.email,
        u.sandi,
        u.nama,
        u.role,
        u.cabang,
        Number(u.komisiPersen || 0)
      ]);
      break;

    case "kasHarian":
      sheetName = "Kas Harian";
      headers = ["ID Kas", "Tanggal", "Keterangan", "Tipe", "Jumlah", "Cabang"];
      action = "sync_bulk";
      rows = db.kasHarian.map((k: any) => [
        k.id,
        new Date(k.tanggal).toLocaleString("id-ID"),
        k.keterangan,
        k.tipe,
        Number(k.jumlah || 0),
        k.cabang
      ]);
      break;

    case "opname":
      sheetName = "Stok Opname";
      headers = ["Tanggal", "Cabang", "Kode Barang", "Nama Barang", "Stok Sistem", "Stok Fisik", "Selisih", "Keterangan"];
      action = "sync_bulk";
      rows = db.opname.map((o: any) => [
        new Date(o.timestamp).toLocaleString("id-ID"),
        o.cabang,
        o.kode,
        o.nama,
        Number(o.sistem || 0),
        Number(o.fisik || 0),
        Number(o.selisih || 0),
        o.ket
      ]);
      break;

    case "transfer":
      sheetName = "Transfer Barang";
      headers = ["ID Transfer", "Tanggal", "Dari Cabang", "Ke Cabang", "Kode Barang", "Nama Barang", "Qty", "Status", "Pengaju", "Catatan"];
      action = "sync_bulk";
      rows = db.transfer.map((tr: any) => [
        tr.id,
        new Date(tr.tanggal).toLocaleString("id-ID"),
        tr.dariCabang,
        tr.keCabang,
        tr.kode,
        tr.nama,
        Number(tr.qty || 0),
        tr.status,
        tr.pengaju,
        tr.catatan
      ]);
      break;

    case "purchaseOrders":
      sheetName = "Purchase Orders";
      headers = ["ID PO", "Tanggal", "Supplier", "Cabang", "Detail Items", "Total PO", "Status"];
      action = "sync_bulk";
      rows = db.purchaseOrders.map((po: any) => {
        const poItemsSummary = Array.isArray(po.items) ? po.items.map((it: any) => `${it.nama} (x${it.qty})`).join(", ") : "";
        return [
          po.id,
          new Date(po.tanggal).toLocaleString("id-ID"),
          po.supplier,
          po.cabang,
          poItemsSummary,
          Number(po.total || 0),
          po.status
        ];
      });
      break;

    case "ledger":
      sheetName = "Buku Besar Ledger";
      headers = ["ID Ledger", "Tanggal", "Akun", "Tipe", "Jumlah", "Cabang", "Referensi"];
      action = "sync_bulk";
      rows = db.ledger.map((ld: any) => [
        ld.id,
        new Date(ld.tanggal).toLocaleString("id-ID"),
        ld.akun,
        ld.tipe,
        Number(ld.jumlah || 0),
        ld.cabang,
        ld.referensi
      ]);
      break;

    case "payroll":
      sheetName = "Payroll Gaji";
      headers = ["ID Payroll", "Periode", "Nama Pegawai", "Cabang", "Gaji Pokok", "Komisi", "Total Diterima", "Status"];
      action = "sync_bulk";
      rows = db.payroll.map((pay: any) => [
        pay.id,
        pay.periode,
        pay.pegawai,
        pay.cabang,
        Number(pay.gajiPokok || 0),
        Number(pay.komisi || 0),
        Number(pay.totalTerima || 0),
        pay.status
      ]);
      break;

    case "production":
      sheetName = "Produksi";
      headers = ["ID Produksi", "Tanggal", "Nama Produk", "Qty Produksi", "Bahan Baku", "Qty Bahan", "Status", "PIC"];
      action = "sync_bulk";
      rows = db.production.map((prd: any) => [
        prd.id,
        new Date(prd.tanggal).toLocaleString("id-ID"),
        prd.produk,
        Number(prd.qtyProduksi || 0),
        prd.bahanBaku,
        prd.qtyBahan,
        prd.status,
        prd.pic
      ]);
      break;

    default:
      return { success: false, message: "Entitas data tidak didukung." };
  }

  const payload: any = { action, sheetName, headers };
  if (action === "sync_row") {
    payload.rowData = rowData;
    payload.keyIndex = keyIndex;
  } else {
    payload.rows = rows;
  }

  try {
    const controller = new AbortController();
    const idTimeout = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(idTimeout);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();
    let resJson: any;
    try {
      resJson = JSON.parse(responseText);
    } catch (e) {
      if (responseText.includes("<!DOCTYPE") || responseText.includes("<html") || responseText.includes("<script") || responseText.includes("Google Accounts")) {
        throw new Error("Apps Script mengembalikan halaman HTML/Login. Pastikan setelan deployment 'Who has access' (Siapa yang memiliki akses) diatur ke 'Anyone' (Siapa saja) dan Anda telah memberikan otorisasi akun Google.");
      }
      throw new Error(`Respon bukan format JSON valid: ${responseText.slice(0, 100)}...`);
    }

    if (resJson && resJson.status === "success") {
      return { success: true, message: resJson.message };
    } else {
      return { success: false, message: resJson?.message || "Format respon dari Google Sheets Apps Script tidak valid." };
    }
  } catch (error: any) {
    console.error(`Error syncing ${entityName} to Google Sheet:`, error);
    return { success: false, message: error.message || "Koneksi terputus atau timeout saat menghubungi Google Sheet." };
  }
}

// In-memory default database matching the Pinky POS schema
const defaultDb = {
  settings: {
    namaToko: "PINKY SHOP",
    alamat: "Jl. Pink Utama No. 88 Jakarta",
    alamatPo: "Jl. Pink Utama No. 88 Jakarta (Kantor Pusat)",
    theme: "sakura",
    tagline: "Fashion, Retail & Supply Chain Management",
    logoUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300",
    pajakPersen: 11,
    diskonMemberPersen: 10,
    footerStruk: "Terima kasih telah berbelanja di toko kami",
    googleSheetUrl: "",
    isSheetEnabled: false,
    rekeningOwner: [
      { id: "bni", bank: "BNI", nomor: "2064972", atasNama: "ROUFI MALY", qrisUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BNI-2064972" },
      { id: "bca", bank: "BCA", nomor: "1234567890", atasNama: "Ibu Boss Owner", qrisUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BCA-1234567890" },
      { id: "mandiri", bank: "Mandiri", nomor: "0987654321", atasNama: "Ibu Boss Owner", qrisUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Mandiri-0987654321" }
    ],
    branchOpExpenses: {
      "Cabang Pusat": { sewa: 5000000, listrik: 1500000, air: 300000, gaji: 15000000, telepon: 500000, transport: 1000000, csr: 500000 },
      "Cabang Jakarta Selatan": { sewa: 7500000, listrik: 2200000, air: 450000, gaji: 18000000, telepon: 600000, transport: 1500000, csr: 750000 },
      "Cabang Bandung": { sewa: 4000000, listrik: 1200000, air: 250000, gaji: 12000000, telepon: 400000, transport: 800000, csr: 450000 }
    }
  },
  users: [
    { email: "owner@usaha.com", sandi: "123456", nama: "Ibu Boss Owner", role: "Owner", cabang: "Semua Cabang", komisiPersen: 0 },
    { email: "admin.pst@usaha.com", sandi: "123456", nama: "Admin Pusat", role: "Admin Cabang", cabang: "Cabang Pusat", komisiPersen: 3 },
    { email: "admin.jkt@usaha.com", sandi: "123456", nama: "Admin JKT", role: "Admin Cabang", cabang: "Cabang Jakarta Selatan", komisiPersen: 3 },
    { email: "admin.bdg@usaha.com", sandi: "123456", nama: "Admin BDG", role: "Admin Cabang", cabang: "Cabang Bandung", komisiPersen: 3 },
    { email: "kasir.pst@usaha.com", sandi: "123456", nama: "Kasir Pusat", role: "Kasir", cabang: "Cabang Pusat", komisiPersen: 5 },
    { email: "kasir.jkt@usaha.com", sandi: "123456", nama: "Kasir JKT", role: "Kasir", cabang: "Cabang Jakarta Selatan", komisiPersen: 5 },
    { email: "kasir.bdg@usaha.com", sandi: "123456", nama: "Kasir BDG", role: "Kasir", cabang: "Cabang Bandung", komisiPersen: 5 }
  ],
  cabang: [
    ["PST", "Cabang Pusat", "Jl. Merdeka No. 1 Jakarta"],
    ["JKT", "Cabang Jakarta Selatan", "Jl. Senopati No. 45"],
    ["BDG", "Cabang Bandung", "Jl. Riau No. 12"]
  ],
  barang: [
    [1, "BRG001", "Blouse Pink Pastel", 75000, 70000, 120000, 25, "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=150", "Cabang Pusat"],
    [2, "BRG002", "Skater Skirt Denim", 90000, 85000, 149000, 18, "https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=150", "Cabang Pusat"],
    [3, "BRG003", "Kemeja Oversized Lilac", 80000, 75000, 135000, 30, "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=150", "Cabang Jakarta Selatan"],
    [4, "BRG004", "Tas Selempang Kulit Pink", 120000, 110000, 199000, 12, "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=150", "Cabang Pusat"],
    [5, "BRG005", "Sneakers Kanvas Putih-Pink", 175000, 160000, 275000, 10, "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=150", "Cabang Bandung"]
  ],
  transaksi: [
    // [timestamp, nota, email, kasir, cabang, total, metode, item, subtotal, diskon, pajak, bayar, kembalian]
    [Date.now() - 3600000 * 2, "TXT-17180001", "kasir.pst@usaha.com", "Kasir Pusat", "Cabang Pusat", 266400, "Cash", [
      { kode: "BRG001", nama: "Blouse Pink Pastel", harga: 120000, hpp: 70000, qty: 2 }
    ], 240000, 0, 26400, 300000, 33600],
    [Date.now() - 3600000, "TXT-17180002", "kasir.jkt@usaha.com", "Kasir JKT", "Cabang Jakarta Selatan", 135000, "QRIS", [
      { kode: "BRG003", nama: "Kemeja Oversized Lilac", harga: 135000, hpp: 75000, qty: 1 }
    ], 135000, 0, 0, 135000, 0]
  ],
  opname: [
    { timestamp: Date.now() - 86400000, cabang: "Cabang Pusat", kode: "BRG001", nama: "Blouse Pink Pastel", sistem: 26, fisik: 25, selisih: -1, ket: "Barang sample display" }
  ],
  transfer: [
    { id: "TRF-171801", tanggal: Date.now() - 86400000, dariCabang: "Cabang Pusat", keCabang: "Cabang Bandung", kode: "BRG001", nama: "Blouse Pink Pastel", qty: 5, status: "Approved", pengaju: "Admin Pusat", catatan: "Restock etalase Bandung" }
  ],
  purchaseOrders: [
    { id: "PO-9001", tanggal: Date.now() - 172800000, supplier: "PT Tekstil Makmur Jaya", cabang: "Cabang Pusat", items: [{ kode: "BRG001", nama: "Blouse Pink Pastel", qty: 50, hargaBeli: 70000 }], total: 3500000, status: "Received" }
  ],
  ledger: [
    { id: "LED-001", tanggal: Date.now() - 3600000 * 2, akun: "Pendapatan Penjualan (Sales Revenue)", tipe: "Kredit", jumlah: 240000, cabang: "Cabang Pusat", referensi: "TXT-17180001" },
    { id: "LED-002", tanggal: Date.now() - 3600000 * 2, akun: "Kas / QRIS Asset", tipe: "Debet", jumlah: 266400, cabang: "Cabang Pusat", referensi: "TXT-17180001" }
  ],
  payroll: [
    { id: "PAY-101", periode: "Juni 2026", pegawai: "Kasir Pusat", cabang: "Cabang Pusat", gajiPokok: 3500000, komisi: 450000, totalTerima: 3950000, status: "Paid" }
  ],
  production: [
    { id: "PRD-501", tanggal: Date.now() - 86400000, produk: "Blouse Pink Pastel", qtyProduksi: 30, bahanBaku: "Kain Katun Rayon Pink", qtyBahan: "15 Meter", status: "Completed", pic: "Supervisor Manufaktur" }
  ],
  kasHarian: [
    { id: "KAS-1001", tanggal: Date.now() - 3600000 * 24, keterangan: "Saldo Awal Kas Toko", tipe: "Debet", jumlah: 5000000, cabang: "Cabang Pusat" },
    { id: "KAS-1002", tanggal: Date.now() - 3600000 * 12, keterangan: "Beli Alat Tulis Kantor", tipe: "Kredit", jumlah: 150000, cabang: "Cabang Pusat" }
  ],
  googleSheetLogs: [] as any[]
};

let db: any = { ...defaultDb };

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving database to file:", error);
  }
}

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(data);
      db = { ...defaultDb, ...parsed };
      db.settings = { ...defaultDb.settings, ...(parsed.settings || {}) };
      console.log("Database successfully loaded from db_store.json.");
    } else {
      console.log("No persistent file found, creating db_store.json.");
      saveDatabase();
    }
  } catch (err) {
    console.error("Error loading persistent database:", err);
  }
}

// Initial load
loadDatabase();

function syncMasterBarang() {
  const masterMap = new Map();
  db.barang.forEach((b: any) => {
    if (!masterMap.has(b[1])) {
      masterMap.set(b[1], {
        nama: b[2],
        beli: b[3],
        hpp: b[4],
        jual: b[5],
        foto: b[7],
        satuan: b[9] || "Pcs"
      });
    }
  });

  const activeBranchNames = db.cabang.map(c => c[1]);
  let modified = false;

  // Filter out any products whose branch location is no longer in the list of active branches
  const originalCount = db.barang.length;
  db.barang = db.barang.filter((b: any) => activeBranchNames.includes(b[8]));
  if (db.barang.length !== originalCount) {
    modified = true;
  }

  db.cabang.forEach((c) => {
    const branchName = c[1];
    masterMap.forEach((info, code) => {
      const exists = db.barang.find((b: any) => b[1] === code && b[8] === branchName);
      if (!exists) {
        db.barang.push([
          db.barang.length + 1,
          code,
          info.nama,
          info.beli,
          info.hpp,
          info.jual,
          10, // default stock for branch
          info.foto,
          branchName,
          info.satuan || "Pcs"
        ]);
        modified = true;
      } else {
        // Ensure existing products have a default unit if not set
        if (exists[9] === undefined) {
          exists[9] = info.satuan || "Pcs";
          modified = true;
        }
      }
    });
  });

  if (modified) {
    saveDatabase();
  }
}

syncMasterBarang();

// API Routes
app.post("/api/login", (req, res) => {
  const { email, sandi, shift } = req.body;
  const user = db.users.find(u => u.email === email && u.sandi === sandi);
  if (user) {
    res.json({
      s: 1,
      m: "Login Berhasil",
      email: user.email,
      nama: user.nama,
      role: user.role,
      cabang: user.cabang,
      shift: shift || "Pagi"
    });
  } else {
    // If not found in registered users, allow dynamic fallback for demo convenience or error
    res.json({ s: 0, m: "Email atau kata sandi salah. Silakan periksa kembali." });
  }
});

app.get("/api/getAwal", (req, res) => {
  syncMasterBarang();
  res.json({
    barang: db.barang,
    cabang: db.cabang,
    transaksi: db.transaksi,
    opname: db.opname,
    transfer: db.transfer,
    purchaseOrders: db.purchaseOrders,
    ledger: db.ledger,
    payroll: db.payroll,
    production: db.production,
    settings: db.settings,
    users: db.users,
    kasHarian: db.kasHarian,
    googleSheetLogs: db.googleSheetLogs
  });
});

app.post("/api/simpanKasHarian", async (req, res) => {
  const { tanggal, keterangan, tipe, jumlah, cabang } = req.body;
  const entry = {
    id: `KAS-${Date.now().toString().slice(-4)}`,
    tanggal: Number(tanggal) || Date.now(),
    keterangan: keterangan || "Catatan Kas",
    tipe: tipe || "Debet",
    jumlah: Number(jumlah) || 0,
    cabang: cabang || "Cabang Pusat"
  };
  db.kasHarian.unshift(entry);
  saveDatabase();
  await syncEntityToSheet("kasHarian");
  res.json({ s: 1, m: "Catatan kas harian berhasil disimpan!" });
});

app.post("/api/hapusKasHarian", async (req, res) => {
  const { id } = req.body;
  db.kasHarian = db.kasHarian.filter(k => k.id !== id);
  saveDatabase();
  await syncEntityToSheet("kasHarian");
  res.json({ s: 1, m: "Catatan kas harian berhasil dihapus." });
});

app.get("/api/getSettings", (req, res) => {
  res.json(db.settings);
});

app.post("/api/updateSettings", (req, res) => {
  const { namaToko, alamat, alamatPo, tagline, theme, logoUrl, pajakPersen, diskonMemberPersen, footerStruk, rekeningOwner, branchOpExpenses, googleSheetUrl, isSheetEnabled } = req.body;
  
  db.settings = {
    ...db.settings,
    ...(namaToko !== undefined && { namaToko }),
    ...(alamat !== undefined && { alamat }),
    ...(alamatPo !== undefined && { alamatPo }),
    ...(tagline !== undefined && { tagline }),
    ...(theme !== undefined && { theme }),
    ...(logoUrl !== undefined && { logoUrl }),
    ...(pajakPersen !== undefined && { pajakPersen: isNaN(Number(pajakPersen)) ? 0 : Number(pajakPersen) }),
    ...(diskonMemberPersen !== undefined && { diskonMemberPersen: isNaN(Number(diskonMemberPersen)) ? 0 : Number(diskonMemberPersen) }),
    ...(footerStruk !== undefined && { footerStruk }),
    ...(rekeningOwner !== undefined && { rekeningOwner }),
    ...(branchOpExpenses !== undefined && { branchOpExpenses }),
    ...(googleSheetUrl !== undefined && { googleSheetUrl }),
    ...(isSheetEnabled !== undefined && { isSheetEnabled: !!isSheetEnabled })
  };
  
  saveDatabase();
  res.json({ s: 1, m: "Pengaturan toko, rekening & biaya operasional per cabang berhasil disimpan secara permanen!", settings: db.settings });
});

app.post("/api/simpanUser", async (req, res) => {
  const { email, sandi, nama, role, cabang, oldEmail, isOffline, komisiPersen, gajiPokok } = req.body;
  
  const targetEmail = oldEmail || email;
  const existing = db.users.find(u => u.email === targetEmail);
  
  if (existing) {
    if (email && email !== targetEmail) {
      existing.email = email;
    }
    existing.sandi = sandi || existing.sandi || "123456";
    existing.nama = nama || existing.nama;
    existing.role = role || existing.role;
    existing.cabang = cabang || existing.cabang;
    if (isOffline !== undefined) existing.isOffline = !!isOffline;
    if (komisiPersen !== undefined) existing.komisiPersen = Number(komisiPersen);
    if (gajiPokok !== undefined) existing.gajiPokok = Number(gajiPokok);
    
    saveDatabase();
    await syncEntityToSheet("users");
    res.json({ s: 1, m: "Data staff berhasil diperbarui!" });
  } else {
    db.users.push({
      email,
      sandi: sandi || "123456",
      nama: nama || "Staff Baru",
      role: role || "Kasir",
      cabang: cabang || "Cabang Pusat",
      komisiPersen: komisiPersen !== undefined ? Number(komisiPersen) : 5,
      isOffline: !!isOffline,
      gajiPokok: gajiPokok !== undefined ? Number(gajiPokok) : 2500000
    });
    saveDatabase();
    await syncEntityToSheet("users");
    res.json({ s: 1, m: "Staff baru berhasil ditambahkan!" });
  }
});

app.post("/api/hapusUser", async (req, res) => {
  const { email } = req.body;
  db.users = db.users.filter(u => u.email !== email);
  saveDatabase();
  await syncEntityToSheet("users");
  res.json({ s: 1, m: "Staff berhasil dihapus dari sistem." });
});

app.post("/api/simpanBarang", async (req, res) => {
  const { kode, nama, beli, hpp, jual, stok, foto, cabang, oldKode, branchStokMap, branchHppMap, satuan } = req.body;
  const baseKode = kode || `BRG${Date.now().toString().slice(-4)}`;

  if (oldKode && oldKode !== baseKode) {
    db.barang = db.barang.filter((b: any) => b[1] !== oldKode);
  }

  db.cabang.forEach((c) => {
    const branchName = c[1];
    const existing = db.barang.find((b: any) => b[1] === baseKode && b[8] === branchName);
    const branchStokVal = branchStokMap && branchStokMap[branchName] !== undefined 
      ? Number(branchStokMap[branchName]) 
      : (branchName === (cabang || "Cabang Pusat") && stok !== undefined && stok !== "" ? Number(stok) : (existing ? existing[6] : 10));

    const branchHppVal = branchHppMap && branchHppMap[branchName] !== undefined
      ? Number(branchHppMap[branchName])
      : (branchName === (cabang || "Cabang Pusat") && hpp !== undefined && hpp !== "" ? Number(hpp) : (existing ? existing[4] : Number(hpp) || Number(beli) || 45000));

    if (existing) {
      existing[1] = baseKode;
      existing[2] = nama || existing[2];
      existing[3] = Number(beli) || existing[3];
      existing[4] = branchHppVal;
      existing[5] = Number(jual) || existing[5];
      existing[6] = branchStokVal;
      existing[7] = foto || existing[7];
      existing[9] = satuan || existing[9] || "Pcs";
    } else {
      db.barang.push([
        db.barang.length + 1,
        baseKode,
        nama || "Produk Baru",
        Number(beli) || 0,
        branchHppVal,
        Number(jual) || 0,
        branchStokVal,
        foto || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=150",
        branchName,
        satuan || "Pcs"
      ]);
    }
  });

  await syncEntityToSheet("barang");
  res.json({ s: 1, m: "Barang berhasil disimpan & HPP serta stok disesuaikan per cabang!" });
});

app.post("/api/hapusBarang", async (req, res) => {
  const { kode } = req.body;
  db.barang = db.barang.filter((b: any) => b[1] !== kode);
  await syncEntityToSheet("barang");
  res.json({ s: 1, m: "Barang berhasil dihapus dari semua cabang." });
});

app.post("/api/simpanCabang", async (req, res) => {
  const { id, nama, alamat, oldId } = req.body;
  if (oldId) {
    const idx = db.cabang.findIndex(c => c[0] === oldId);
    if (idx !== -1) {
      const oldNama = db.cabang[idx][1];
      db.cabang[idx] = [id || oldId, nama, alamat];
      
      if (oldNama !== nama) {
        // Update all related branch name references
        db.barang.forEach((b: any) => {
          if (b[8] === oldNama) b[8] = nama;
        });
        db.users.forEach((u: any) => {
          if (u.cabang === oldNama) u.cabang = nama;
        });
        db.transaksi.forEach((t: any) => {
          if (t[4] === oldNama) t[4] = nama;
        });
        db.opname.forEach((op: any) => {
          if (op.cabang === oldNama) op.cabang = nama;
        });
        db.transfer.forEach((tr: any) => {
          if (tr.dariCabang === oldNama) tr.dariCabang = nama;
          if (tr.keCabang === oldNama) tr.keCabang = nama;
        });
        db.purchaseOrders.forEach((po: any) => {
          if (po.cabang === oldNama) po.cabang = nama;
        });
        db.payroll.forEach((pay: any) => {
          if (pay.cabang === oldNama) pay.cabang = nama;
        });
        db.production.forEach((prod: any) => {
          if (prod.cabang === oldNama) prod.cabang = nama;
        });
        db.kasHarian.forEach((k: any) => {
          if (k.cabang === oldNama) k.cabang = nama;
        });
        db.ledger.forEach((ld: any) => {
          if (ld.cabang === oldNama) ld.cabang = nama;
        });

        // Update operational expenses settings key
        if (db.settings.branchOpExpenses && db.settings.branchOpExpenses[oldNama]) {
          db.settings.branchOpExpenses[nama] = db.settings.branchOpExpenses[oldNama];
          delete db.settings.branchOpExpenses[oldNama];
        }
      }

      saveDatabase();
      await syncEntityToSheet("cabang");
      if (oldNama !== nama) {
        await syncEntityToSheet("barang");
        await syncEntityToSheet("users");
        await syncEntityToSheet("transaksi");
        await syncEntityToSheet("kasHarian");
        await syncEntityToSheet("ledger");
        await syncEntityToSheet("opname");
        await syncEntityToSheet("purchaseOrders");
      }
      res.json({ s: 1, m: "Data cabang berhasil diperbarui!" });
      return;
    }
  }
  
  // Registering new branch
  db.cabang.push([id || `CBR${db.cabang.length + 1}`, nama, alamat]);
  
  // Initialize existing products for the new branch with 0 stock
  const uniqueProductKodes = Array.from(new Set(db.barang.map((b: any) => b[1])));
  uniqueProductKodes.forEach(kode => {
    const sample = db.barang.find((b: any) => b[1] === kode);
    if (sample) {
      const existing = db.barang.find((b: any) => b[1] === kode && b[8] === nama);
      if (!existing) {
        db.barang.push([
          db.barang.length + 1,
          kode,
          sample[2] || "Produk Baru",
          sample[3] || 0,
          sample[4] || 0, // HPP
          sample[5] || 0, // Jual
          0, // Default stock for new branch is 0
          sample[7] || "",
          nama,
          sample[9] || "Pcs"
        ]);
      }
    }
  });

  // Initialize branch operational expenses for the new branch
  if (!db.settings.branchOpExpenses) db.settings.branchOpExpenses = {};
  if (!db.settings.branchOpExpenses[nama]) {
    db.settings.branchOpExpenses[nama] = { sewa: 5000000, listrik: 1500000, air: 300000, gaji: 15000000, telepon: 500000, transport: 1000000, csr: 500000 };
  }

  saveDatabase();
  await syncEntityToSheet("cabang");
  await syncEntityToSheet("barang");
  res.json({ s: 1, m: "Cabang baru berhasil didaftarkan!" });
});

app.post("/api/hapusCabang", async (req, res) => {
  const { id } = req.body;
  const targetCabang = db.cabang.find(c => c[0] === id);
  if (!targetCabang) {
    res.json({ s: 0, m: "Cabang tidak ditemukan." });
    return;
  }
  const branchName = targetCabang[1];

  // 1. Remove branch
  db.cabang = db.cabang.filter(c => c[0] !== id);

  // Determine fallback branch
  const remainingBranches = db.cabang.map(c => c[1]);
  const fallbackBranch = remainingBranches.length > 0 ? remainingBranches[0] : "Cabang Pusat";

  // 2. Reassign any product that ONLY exists under the deleted branch so they are NOT lost!
  db.barang.forEach((b: any) => {
    if (b[8] === branchName) {
      // Check if this product code exists in any other remaining branch
      const hasOther = db.barang.some((other: any) => other[1] === b[1] && other[8] !== branchName && remainingBranches.includes(other[8]));
      if (!hasOther && remainingBranches.length > 0) {
        // Change its branch to fallback branch to preserve the product definition!
        b[8] = fallbackBranch;
      }
    }
  });

  // Now, safely filter out any remaining products that are still mapped to the deleted branch
  db.barang = db.barang.filter((b: any) => b[8] !== branchName);

  // 3. Reassign users assigned to this branch
  db.users.forEach((u: any) => {
    if (u.cabang === branchName) {
      u.cabang = fallbackBranch;
    }
  });

  // Reassign payroll records assigned to this branch so historical database records stay valid
  db.payroll.forEach((p: any) => {
    if (p.cabang === branchName) {
      p.cabang = fallbackBranch;
    }
  });

  // Reassign ledger and kasHarian records assigned to this branch
  db.ledger.forEach((l: any) => {
    if (l.cabang === branchName) {
      l.cabang = fallbackBranch;
    }
  });
  db.kasHarian.forEach((k: any) => {
    if (k.cabang === branchName) {
      k.cabang = fallbackBranch;
    }
  });

  saveDatabase();
  await syncEntityToSheet("cabang");
  await syncEntityToSheet("barang");
  await syncEntityToSheet("users");
  await syncEntityToSheet("payroll");
  await syncEntityToSheet("ledger");
  await syncEntityToSheet("kasHarian");

  res.json({ s: 1, m: "Cabang berhasil dihapus." });
});

app.post("/api/simpanTransaksi", async (req, res) => {
  const { nota, email, kasir, cabang, total, metode, shift, item, subtotal, diskon, pajak, bayar, kembalian } = req.body;
  const timestamp = Date.now();
  
  // Create transaction with synced flag set to false initially
  const newTx: any = [timestamp, nota, email, kasir, cabang, total, metode, item, subtotal, diskon, pajak, bayar, kembalian, false, ""];
  db.transaksi.unshift(newTx);

  // Update stock quantities
  if (Array.isArray(item)) {
    item.forEach((cartItem: any) => {
      let found = db.barang.find((b: any) => b[1] === cartItem.kode && b[8] === cabang);
      if (!found) {
        found = db.barang.find((b: any) => b[1] === cartItem.kode);
      }
      if (found) {
        found[6] = Math.max(0, Number(found[6]) - Number(cartItem.qty));
      }
    });
  }

  // Auto-sync to Google Sheet if enabled and configured
  let sheetSyncResult = null;
  if (db.settings.isSheetEnabled && db.settings.googleSheetUrl) {
    const syncRes = await syncEntityToSheet("transaksi", {
      timestamp, nota, email, kasir, cabang, total, metode, shift, item, subtotal, diskon, pajak, bayar, kembalian
    });

    if (syncRes.success) {
      newTx[13] = true;
      newTx[14] = "";
      sheetSyncResult = { success: true, message: syncRes.message };
      db.googleSheetLogs.unshift({
        timestamp: Date.now(),
        action: "Auto Sync",
        status: "Success",
        nota: nota,
        message: syncRes.message
      });
    } else {
      newTx[13] = false;
      newTx[14] = syncRes.message;
      sheetSyncResult = { success: false, message: syncRes.message };
      db.googleSheetLogs.unshift({
        timestamp: Date.now(),
        action: "Auto Sync",
        status: "Failed",
        nota: nota,
        message: syncRes.message
      });
    }

    // Auto-sync current stock (barang) to sheet as well
    await syncEntityToSheet("barang");
  }

  res.json({ 
    s: 1, 
    m: "Transaksi berhasil diproses & dicatat!", 
    sheetSync: sheetSyncResult,
    logs: db.googleSheetLogs
  });
});

// Test Connection Endpoint
app.post("/api/syncSheetsTest", async (req, res) => {
  const { url } = req.body;
  const testUrl = (url || db.settings.googleSheetUrl || "").trim();
  
  const urlValidation = validateGasUrlFormat(testUrl);
  if (!urlValidation.valid) {
    return res.json({ s: 0, m: urlValidation.message });
  }

  try {
    const controller = new AbortController();
    const idTimeout = setTimeout(() => controller.abort(), 12000); // 12 seconds timeout

    const response = await fetch(testUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "test" }),
      signal: controller.signal
    });
    
    clearTimeout(idTimeout);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("HTTP " + response.status + ": Akses ditolak oleh Google. Setelan 'Who has access' di Apps Script wajib diubah ke 'Anyone' (Siapa saja).");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      if (responseText.includes("<!DOCTYPE") || responseText.includes("<html") || responseText.includes("<script") || responseText.includes("Google Accounts")) {
        throw new Error(
          "🔒 HASIL DIAGNOSTIK KONEKSI (BEDA PERUSAHAAN):\n" +
          "Google Apps Script mengembalikan halaman Login HTML. Ini menandakan setelan 'Who has access' Anda masih terbatas pada internal organisasi saja.\n\n" +
          "SOLUSI SUPAYA LINK BISA DIBAGIKAN KE BEDA PERUSAHAAN:\n" +
          "1. Buka editor Google Apps Script > Deploy > Manage deployments.\n" +
          "2. Edit deployment aktif Anda (tombol ikon pensil).\n" +
          "3. Ubah 'Execute as' -> 'Me' (Pemilik Akun).\n" +
          "4. Ubah 'Who has access' -> 'Anyone' (Siapa Saja - bahkan tanpa akun Google).\n" +
          "5. Jika akun Google Perusahaan (Workspace) membatasi opsi 'Anyone', buatlah Spreadsheet di akun @gmail.com pribadi agar Web App dapat dihubungi dari semua perusahaan/cabang!"
        );
      }
      throw new Error(`Format respon salah (Bukan JSON): ${responseText.slice(0, 100)}...`);
    }

    if (data && data.status === "success") {
      db.googleSheetLogs.unshift({
        timestamp: Date.now(),
        action: "Test Koneksi",
        status: "Success",
        nota: "-",
        message: data.message || "Koneksi Berhasil"
      });
      res.json({ s: 1, m: "Koneksi Google Sheet Berhasil! 🌸 Web App siap menerima data dari semua perusahaan/cabang.", logs: db.googleSheetLogs });
    } else {
      db.googleSheetLogs.unshift({
        timestamp: Date.now(),
        action: "Test Koneksi",
        status: "Failed",
        nota: "-",
        message: data?.message || "Format respon salah"
      });
      res.json({ s: 0, m: data?.message || "Koneksi gagal atau format respon Google Sheets salah.", logs: db.googleSheetLogs });
    }
  } catch (err: any) {
    db.googleSheetLogs.unshift({
      timestamp: Date.now(),
      action: "Test Koneksi",
      status: "Failed",
      nota: "-",
      message: err.message || "Network error"
    });
    res.json({ s: 0, m: err.message || "Timeout / Tidak dapat terhubung ke Google Sheets", logs: db.googleSheetLogs });
  }
});

// Manual Sync All Unsynced Transactions
app.post("/api/syncSheetsManual", async (req, res) => {
  if (!db.settings.googleSheetUrl) {
    return res.json({ s: 0, m: "URL Google Sheets belum diatur!" });
  }

  let successCount = 0;
  let failCount = 0;
  const unsynced: any[] = db.transaksi.filter((t: any) => !t[13]); // Index 13 is isSyncedToSheet

  if (unsynced.length === 0) {
    return res.json({ s: 1, m: "Semua transaksi sudah tersinkronisasi!", logs: db.googleSheetLogs });
  }

  for (const t of unsynced) {
    const result = await syncEntityToSheet("transaksi", t, true);
    if (result.success) {
      t[13] = true;
      t[14] = "";
      successCount++;
      db.googleSheetLogs.unshift({
        timestamp: Date.now(),
        action: "Manual Sync",
        status: "Success",
        nota: t[1],
        message: "Berhasil disinkronisasi"
      });
    } else {
      t[13] = false;
      t[14] = result.message;
      failCount++;
      db.googleSheetLogs.unshift({
        timestamp: Date.now(),
        action: "Manual Sync",
        status: "Failed",
        nota: t[1],
        message: result.message
      });
    }
  }

  // Also sync products
  await syncEntityToSheet("barang", null, true);

  res.json({
    s: 1,
    m: `Sinkronisasi manual selesai! Berhasil: ${successCount} transaksi, Gagal: ${failCount} transaksi.`,
    logs: db.googleSheetLogs,
    transaksi: db.transaksi
  });
});

// Clear Sheet Logs
app.post("/api/clearSheetLogs", (req, res) => {
  db.googleSheetLogs = [];
  res.json({ s: 1, m: "Log sinkronisasi berhasil dibersihkan!", logs: [] });
});

// Sync All Master Data Entities
app.post("/api/syncAllSheets", async (req, res) => {
  if (!db.settings.googleSheetUrl) {
    return res.json({ s: 0, m: "URL Google Sheets belum diatur!" });
  }

  const entities = ["barang", "cabang", "users", "kasHarian", "opname", "transfer", "purchaseOrders", "ledger", "payroll", "production"];
  let successCount = 0;
  let failCount = 0;

  for (const entity of entities) {
    const result = await syncEntityToSheet(entity, null, true);
    if (result.success) {
      successCount++;
      db.googleSheetLogs.unshift({
        timestamp: Date.now(),
        action: `Sync Bulk: ${entity}`,
        status: "Success",
        nota: "-",
        message: `Berhasil sinkronisasi tabel ${entity}`
      });
    } else {
      failCount++;
      db.googleSheetLogs.unshift({
        timestamp: Date.now(),
        action: `Sync Bulk: ${entity}`,
        status: "Failed",
        nota: "-",
        message: result.message
      });
    }
  }

  res.json({
    s: 1,
    m: `Sinkronisasi semua tabel selesai! Sukses: ${successCount} tabel, Gagal: ${failCount} tabel.`,
    logs: db.googleSheetLogs
  });
});

app.post("/api/simpanOpname", async (req, res) => {
  const { cabang, kode, nama, sistem, fisik, selisih, ket } = req.body;
  db.opname.unshift({ timestamp: Date.now(), cabang, kode, nama, sistem, fisik, selisih, ket });
  
  // Adjust stock in db.barang
  const found = db.barang.find((b: any) => b[1] === kode && b[8] === cabang);
  if (found) {
    found[6] = Number(fisik);
  }

  await syncEntityToSheet("opname");
  await syncEntityToSheet("barang");
  saveDatabase();

  res.json({ s: 1, m: "Stok Opname berhasil dikirim & stok disesuaikan!" });
});

app.post("/api/buatTransfer", async (req, res) => {
  let { dariCabang, keCabang, kode, nama, qty, catatan, pengaju } = req.body;
  if (!dariCabang || !keCabang || !kode || !qty) {
    return res.json({ s: 0, m: "Data transfer tidak lengkap!" });
  }
  if (dariCabang === 'Pusat') dariCabang = 'Cabang Pusat';
  if (keCabang === 'Pusat') keCabang = 'Cabang Pusat';
  const id = "TRF-" + Date.now().toString().slice(-6);
  db.transfer.unshift({
    id,
    tanggal: Date.now(),
    dariCabang,
    keCabang,
    kode,
    nama: nama || "Produk",
    qty: Number(qty) || 1,
    status: "Pending",
    pengaju: pengaju || "Staff Cabang",
    catatan: catatan || "-"
  });

  saveDatabase();
  await syncEntityToSheet("transfer");

  res.json({ s: 1, m: "Permintaan transfer barang berhasil dikirim ke Pusat untuk approval!" });
});

app.post("/api/prosesTransfer", async (req, res) => {
  const { id, status } = req.body;
  const transferItem = db.transfer.find((t: any) => t.id === id);
  if (!transferItem) return res.json({ s: 0, m: "Data transfer tidak ditemukan." });

  if (transferItem.status !== 'Pending') {
    return res.json({ s: 0, m: "Transfer ini sudah diproses sebelumnya." });
  }

  if (transferItem.dariCabang === 'Pusat') transferItem.dariCabang = 'Cabang Pusat';
  if (transferItem.keCabang === 'Pusat') transferItem.keCabang = 'Cabang Pusat';

  transferItem.status = status;

  if (status === 'Approved') {
    const q = Number(transferItem.qty) || 1;
    // Deduct from dariCabang
    let sourceBarang = db.barang.find((b: any) => b[1] === transferItem.kode && (b[8] === transferItem.dariCabang || (!b[8] && transferItem.dariCabang === 'Cabang Pusat')));
    if (sourceBarang) {
      sourceBarang[6] = Math.max(0, Number(sourceBarang[6] || 0) - q);
    } else {
      const ref = db.barang.find((b: any) => b[1] === transferItem.kode);
      db.barang.push([
        db.barang.length + 1,
        transferItem.kode,
        transferItem.nama,
        ref ? ref[3] : 50000,
        ref ? ref[4] : 45000,
        ref ? ref[5] : 100000,
        0,
        ref ? ref[7] : "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=150",
        transferItem.dariCabang
      ]);
    }

    // Add to keCabang
    let destBarang = db.barang.find((b: any) => b[1] === transferItem.kode && (b[8] === transferItem.keCabang || (!b[8] && transferItem.keCabang === 'Cabang Pusat')));
    if (destBarang) {
      destBarang[6] = Number(destBarang[6] || 0) + q;
    } else {
      const ref = db.barang.find((b: any) => b[1] === transferItem.kode);
      db.barang.push([
        db.barang.length + 1,
        transferItem.kode,
        transferItem.nama,
        ref ? ref[3] : 50000,
        ref ? ref[4] : 45000,
        ref ? ref[5] : 100000,
        q,
        ref ? ref[7] : "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=150",
        transferItem.keCabang
      ]);
    }
  }

  saveDatabase();
  await syncEntityToSheet("transfer");
  await syncEntityToSheet("barang");

  res.json({ s: 1, m: `Transfer ${id} berhasil ${status === 'Approved' ? 'di-approve & stok berhasil dimutasi antar cabang' : 'ditolak'}!` });
});

// ERP Purchase Orders (Supply Chain Management)
app.post("/api/buatPO", async (req, res) => {
  const { supplier, cabang, items, total } = req.body;
  if (!supplier || !cabang || !items) return res.json({ s: 0, m: "Data Purchase Order tidak lengkap!" });
  const id = "PO-" + Math.floor(1000 + Math.random() * 9000);
  db.purchaseOrders.unshift({
    id,
    tanggal: Date.now(),
    supplier,
    cabang,
    items,
    total: Number(total) || 0,
    status: "Pending"
  });

  // Ledger entry for PO liability / expense draft
  db.ledger.unshift({
    id: "LED-" + Date.now().toString().slice(-5),
    tanggal: Date.now(),
    akun: "Hutang Usaha / Pembelian (Accounts Payable)",
    tipe: "Kredit",
    jumlah: Number(total) || 0,
    cabang,
    referensi: id
  });

  saveDatabase();
  await syncEntityToSheet("purchaseOrders");
  await syncEntityToSheet("ledger");

  res.json({ s: 1, m: `Purchase Order ${id} berhasil diajukan ke supplier ${supplier}!` });
});

app.post("/api/prosesPO", async (req, res) => {
  const { id, status } = req.body;
  const po = db.purchaseOrders.find((p: any) => p.id === id);
  if (!po) return res.json({ s: 0, m: "Purchase Order tidak ditemukan." });

  const prevStatus = po.status;
  po.status = status;

  if ((status === 'Received' || status === 'Paid') && !po.isStockAdded) {
    // Add stock to branch if not already added
    po.items.forEach((item: any) => {
      let b = db.barang.find((x: any) => x[1] === item.kode && x[8] === po.cabang);
      if (b) {
        b[6] = Number(b[6]) + Number(item.qty);
      } else {
        db.barang.push([
          db.barang.length + 1,
          item.kode,
          item.nama,
          item.hargaBeli || 50000,
          item.hargaBeli ? item.hargaBeli - 5000 : 45000,
          item.hargaBeli ? item.hargaBeli * 1.5 : 100000,
          Number(item.qty),
          "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=150",
          po.cabang
        ]);
      }
    });
    po.isStockAdded = true;

    db.ledger.unshift({
      id: "LED-" + Date.now().toString().slice(-5),
      tanggal: Date.now(),
      akun: "Persediaan Barang Masuk (Inventory Asset)",
      tipe: "Debet",
      jumlah: Number(po.total) || 0,
      cabang: po.cabang,
      referensi: id
    });
  }

  if (status === 'Paid' && prevStatus !== 'Paid') {
    // Record Ledger Debet to clear Accounts Payable liability
    db.ledger.unshift({
      id: "LED-" + Date.now().toString().slice(-5),
      tanggal: Date.now(),
      akun: "Hutang Usaha / Pembelian (Accounts Payable)",
      tipe: "Debet",
      jumlah: Number(po.total) || 0,
      cabang: po.cabang,
      referensi: id
    });

    // Record Ledger Kredit for Cash Outflow
    db.ledger.unshift({
      id: "LED-" + (Date.now() + 1).toString().slice(-5),
      tanggal: Date.now(),
      akun: "Kas / QRIS Asset",
      tipe: "Kredit",
      jumlah: Number(po.total) || 0,
      cabang: po.cabang,
      referensi: id
    });

    // Record Kas Harian Pengeluaran (Kredit) for Supplier Payment
    db.kasHarian.unshift({
      id: `KAS-${Date.now().toString().slice(-4)}`,
      tanggal: Date.now(),
      keterangan: `Pelunasan Pembayaran Supplier ${po.supplier} (${po.id})`,
      tipe: "Kredit",
      jumlah: Number(po.total) || 0,
      cabang: po.cabang || "Cabang Pusat"
    });
  }

  saveDatabase();
  await syncEntityToSheet("purchaseOrders");
  await syncEntityToSheet("ledger");
  await syncEntityToSheet("kasHarian");
  await syncEntityToSheet("barang");

  let statusMsg = status === 'Paid' ? 'Lunas / Tagihan Selesai & Laporan Keuangan Terupdate' : status === 'Received' ? 'Diterima Gudang & Stok Bertambah' : 'Dibatalkan';
  res.json({ s: 1, m: `Purchase Order ${id} berhasil diperbarui menjadi [${statusMsg}]!` });
});

// ERP HR & Payroll Management
app.post("/api/updateUserCommission", async (req, res) => {
  const { email, komisiPersen, gajiPokok } = req.body;
  const targetUser = db.users.find((u: any) => u.email === email);
  if (!targetUser) return res.json({ s: 0, m: "Pegawai tidak ditemukan." });
  if (komisiPersen !== undefined) targetUser.komisiPersen = Number(komisiPersen) || 0;
  if (gajiPokok !== undefined) targetUser.gajiPokok = Number(gajiPokok) || 0;

  saveDatabase();
  await syncEntityToSheet("users");

  res.json({ s: 1, m: `Pengaturan komisi & gaji untuk ${targetUser.nama} berhasil diperbarui!` });
});

app.post("/api/updateBatchCommissions", async (req, res) => {
  const { updates } = req.body; // Array of { email, komisiPersen, gajiPokok }
  if (!Array.isArray(updates)) return res.json({ s: 0, m: "Data pembaruan tidak valid." });

  let updatedCount = 0;
  updates.forEach((item: any) => {
    const targetUser = db.users.find((u: any) => u.email === item.email);
    if (targetUser) {
      if (item.komisiPersen !== undefined) targetUser.komisiPersen = Number(item.komisiPersen) || 0;
      if (item.gajiPokok !== undefined) targetUser.gajiPokok = Number(item.gajiPokok) || 0;
      updatedCount++;
    }
  });

  saveDatabase();
  await syncEntityToSheet("users");

  res.json({ s: 1, m: `Berhasil memperbarui pengaturan komisi & gaji untuk ${updatedCount} staf!` });
});

app.post("/api/buatPayroll", async (req, res) => {
  const { periode, pegawai, cabang, gajiPokok, komisi } = req.body;
  if (!pegawai || !gajiPokok) return res.json({ s: 0, m: "Data payroll tidak lengkap!" });
  const id = "PAY-" + Math.floor(100 + Math.random() * 900);
  const gp = Number(gajiPokok) || 0;
  const km = Number(komisi) || 0;
  const totalTerima = gp + km;

  db.payroll.unshift({
    id,
    periode: periode || "Bulan Ini",
    pegawai,
    cabang: cabang || "Cabang Pusat",
    gajiPokok: gp,
    komisi: km,
    totalTerima,
    status: "Paid"
  });

  db.ledger.unshift({
    id: "LED-" + Date.now().toString().slice(-5),
    tanggal: Date.now(),
    akun: "Beban Gaji & Komisi SDM (HR Expense)",
    tipe: "Debet",
    jumlah: totalTerima,
    cabang: cabang || "Cabang Pusat",
    referensi: id
  });

  saveDatabase();
  await syncEntityToSheet("payroll");
  await syncEntityToSheet("ledger");

  res.json({ s: 1, m: `Payroll & komisi untuk ${pegawai} berhasil diproses & dicatat dalam buku besar!` });
});

// ERP Manufacturing / Production (Bill of Materials)
app.post("/api/buatProduksi", async (req, res) => {
  const { produk, qtyProduksi, bahanBaku, qtyBahan, pic, cabang } = req.body;
  if (!produk || !qtyProduksi) return res.json({ s: 0, m: "Data produksi tidak lengkap!" });
  const id = "PRD-" + Math.floor(100 + Math.random() * 900);
  const targetCabang = cabang || (db.cabang[0] ? db.cabang[0][1] : "Cabang Utama");
  
  db.production.unshift({
    id,
    tanggal: Date.now(),
    produk,
    qtyProduksi: Number(qtyProduksi) || 1,
    bahanBaku: bahanBaku || "Kain / Bahan Baku Utama",
    qtyBahan: qtyBahan || "Standar",
    status: "Completed",
    pic: pic || "Supervisor Produksi",
    cabang: targetCabang
  });

  // Add finished goods to target branch
  let b = db.barang.find((x: any) => x[2] === produk && x[8] === targetCabang);
  if (!b) {
    b = db.barang.find((x: any) => x[2] === produk);
  }
  if (b) {
    b[6] = Number(b[6]) + Number(qtyProduksi);
  }

  saveDatabase();
  await syncEntityToSheet("production");
  await syncEntityToSheet("barang");

  res.json({ s: 1, m: `Work Order Produksi ${id} selesai! ${qtyProduksi} pcs ${produk} telah ditambahkan ke stok ${targetCabang}.` });
});

// Go-Live Initialization & Real Cash Setup
app.post("/api/initGoLive", async (req, res) => {
  try {
    const { initialBalances, clearTransactions, clearKas, clearStock, clearPoAndTransfer } = req.body || {};

    if (clearTransactions) {
      db.transaksi = [];
    }

    if (clearPoAndTransfer) {
      db.purchaseOrders = [];
      db.transfer = [];
      db.opname = [];
      db.production = [];
      db.payroll = [];
    }

    if (clearKas) {
      db.kasHarian = [];
      db.ledger = [];
    }

    // Set initial cash balances per branch
    if (initialBalances && typeof initialBalances === "object") {
      Object.keys(initialBalances).forEach((cabangName) => {
        const amount = Number(initialBalances[cabangName]) || 0;
        db.kasHarian.unshift({
          id: `KAS-GO-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`,
          tanggal: Date.now(),
          keterangan: `[GO-LIVE] Saldo Awal Kas Real - ${cabangName}`,
          tipe: "Debet",
          jumlah: amount,
          cabang: cabangName
        });

        db.ledger.unshift({
          id: `LED-GO-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`,
          tanggal: Date.now(),
          akun: "Saldo Awal Modal Kas",
          tipe: "Debet",
          jumlah: amount,
          cabang: cabangName,
          referensi: "GO-LIVE-INIT"
        });
      });
    }

    if (clearStock) {
      db.barang.forEach((b: any) => {
        if (Array.isArray(b)) {
          b[6] = 0; // set stock to 0
        }
      });
    }

    saveDatabase();

    try {
      await syncEntityToSheet("kasHarian");
      await syncEntityToSheet("ledger");
      await syncEntityToSheet("transaksi");
      await syncEntityToSheet("barang");
    } catch (syncErr) {
      console.warn("Sheet sync warning during go-live:", syncErr);
    }

    res.json({
      s: 1,
      m: "Aplikasi berhasil dipersiapkan untuk Go-Live Real! Data simulasi telah disesuaikan & Saldo Awal Kas Real telah berhasil dipasang per cabang.",
      kasHarian: db.kasHarian || [],
      transaksi: db.transaksi || [],
      barang: db.barang || [],
      ledger: db.ledger || [],
      purchaseOrders: db.purchaseOrders || [],
      opname: db.opname || [],
      transfer: db.transfer || [],
      production: db.production || [],
      payroll: db.payroll || []
    });
  } catch (err: any) {
    console.error("Error in initGoLive:", err);
    res.status(500).json({ s: 0, m: err?.message || "Terjadi kesalahan server saat Inisialisasi Go-Live" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Pinky POS Server running on http://localhost:${PORT}`);
  });
}

startServer();
