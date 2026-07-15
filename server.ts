import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory database matching the Pinky POS schema
let db = {
  settings: {
    namaToko: "PINKY SHOP",
    alamat: "Jl. Pink Utama No. 88 Jakarta",
    alamatPo: "Jl. Pink Utama No. 88 Jakarta (Kantor Pusat)",
    theme: "sakura",
    logoUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300",
    pajakPersen: 11,
    diskonMemberPersen: 10,
    footerStruk: "Terima kasih telah berbelanja di Pinky Shop 🌸",
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
  ]
};

function syncMasterBarang() {
  const masterMap = new Map();
  db.barang.forEach((b: any) => {
    if (!masterMap.has(b[1])) {
      masterMap.set(b[1], {
        nama: b[2],
        beli: b[3],
        hpp: b[4],
        jual: b[5],
        foto: b[7]
      });
    }
  });

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
          branchName
        ]);
      }
    });
  });
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
    users: db.users
  });
});

app.post("/api/updateSettings", (req, res) => {
  const { namaToko, alamat, alamatPo, theme, logoUrl, pajakPersen, diskonMemberPersen, footerStruk, rekeningOwner, branchOpExpenses } = req.body;
  db.settings = {
    namaToko: namaToko || db.settings.namaToko,
    alamat: alamat || db.settings.alamat,
    alamatPo: alamatPo !== undefined ? alamatPo : db.settings.alamatPo,
    theme: theme || db.settings.theme,
    logoUrl: logoUrl || db.settings.logoUrl,
    pajakPersen: Number(pajakPersen) || 0,
    diskonMemberPersen: Number(diskonMemberPersen) || 0,
    footerStruk: footerStruk || db.settings.footerStruk,
    rekeningOwner: rekeningOwner || db.settings.rekeningOwner,
    branchOpExpenses: branchOpExpenses || db.settings.branchOpExpenses
  };
  res.json({ s: 1, m: "Pengaturan toko, rekening & biaya operasional per cabang berhasil diperbarui!" });
});

app.post("/api/simpanUser", (req, res) => {
  const { email, sandi, nama, role, cabang } = req.body;
  const existing = db.users.find(u => u.email === email);
  if (existing) {
    existing.sandi = sandi || existing.sandi;
    existing.nama = nama || existing.nama;
    existing.role = role || existing.role;
    existing.cabang = cabang || existing.cabang;
    res.json({ s: 1, m: "Data staff berhasil diperbarui!" });
  } else {
    db.users.push({ email, sandi: sandi || "123456", nama: nama || "Staff Baru", role: role || "Kasir", cabang: cabang || "Cabang Pusat", komisiPersen: 5 });
    res.json({ s: 1, m: "Staff baru berhasil ditambahkan!" });
  }
});

app.post("/api/hapusUser", (req, res) => {
  const { email } = req.body;
  db.users = db.users.filter(u => u.email !== email);
  res.json({ s: 1, m: "Staff berhasil dihapus dari sistem." });
});

app.post("/api/simpanBarang", (req, res) => {
  const { kode, nama, beli, hpp, jual, stok, foto, cabang, oldKode, branchStokMap, branchHppMap } = req.body;
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
        branchName
      ]);
    }
  });

  res.json({ s: 1, m: "Barang berhasil disimpan & HPP serta stok disesuaikan per cabang!" });
});

app.post("/api/hapusBarang", (req, res) => {
  const { kode } = req.body;
  db.barang = db.barang.filter((b: any) => b[1] !== kode);
  res.json({ s: 1, m: "Barang berhasil dihapus dari semua cabang." });
});

app.post("/api/simpanCabang", (req, res) => {
  const { id, nama, alamat, oldId } = req.body;
  if (oldId) {
    const idx = db.cabang.findIndex(c => c[0] === oldId);
    if (idx !== -1) {
      db.cabang[idx] = [id || oldId, nama, alamat];
      res.json({ s: 1, m: "Data cabang berhasil diperbarui!" });
      return;
    }
  }
  db.cabang.push([id || `CBR${db.cabang.length + 1}`, nama, alamat]);
  res.json({ s: 1, m: "Cabang baru berhasil didaftarkan!" });
});

app.post("/api/hapusCabang", (req, res) => {
  const { id } = req.body;
  db.cabang = db.cabang.filter(c => c[0] !== id);
  res.json({ s: 1, m: "Cabang berhasil dihapus." });
});

app.post("/api/simpanTransaksi", (req, res) => {
  const { nota, email, kasir, cabang, total, metode, shift, item, subtotal, diskon, pajak, bayar, kembalian } = req.body;
  const timestamp = Date.now();
  db.transaksi.unshift([timestamp, nota, email, kasir, cabang, total, metode, item, subtotal, diskon, pajak, bayar, kembalian]);

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

  res.json({ s: 1, m: "Transaksi berhasil diproses & dicatat!" });
});

app.post("/api/simpanOpname", (req, res) => {
  const { cabang, kode, nama, sistem, fisik, selisih, ket } = req.body;
  db.opname.unshift({ timestamp: Date.now(), cabang, kode, nama, sistem, fisik, selisih, ket });
  
  // Adjust stock in db.barang
  const found = db.barang.find((b: any) => b[1] === kode && b[8] === cabang);
  if (found) {
    found[6] = Number(fisik);
  }

  res.json({ s: 1, m: "Stok Opname berhasil dikirim & stok disesuaikan!" });
});

app.post("/api/buatTransfer", (req, res) => {
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
  res.json({ s: 1, m: "Permintaan transfer barang berhasil dikirim ke Pusat untuk approval!" });
});

app.post("/api/prosesTransfer", (req, res) => {
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

  res.json({ s: 1, m: `Transfer ${id} berhasil ${status === 'Approved' ? 'di-approve & stok berhasil dimutasi antar cabang' : 'ditolak'}!` });
});

// ERP Purchase Orders (Supply Chain Management)
app.post("/api/buatPO", (req, res) => {
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

  res.json({ s: 1, m: `Purchase Order ${id} berhasil diajukan ke supplier ${supplier}!` });
});

app.post("/api/prosesPO", (req, res) => {
  const { id, status } = req.body;
  const po = db.purchaseOrders.find((p: any) => p.id === id);
  if (!po) return res.json({ s: 0, m: "Purchase Order tidak ditemukan." });

  po.status = status;
  if (status === 'Received') {
    // Add stock to branch
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

    db.ledger.unshift({
      id: "LED-" + Date.now().toString().slice(-5),
      tanggal: Date.now(),
      akun: "Persediaan Barang Masuk (Inventory Asset)",
      tipe: "Debet",
      jumlah: po.total,
      cabang: po.cabang,
      referensi: id
    });
  }

  res.json({ s: 1, m: `Purchase Order ${id} berhasil diperbarui statusnya menjadi ${status} & stok otomatis diperbarui!` });
});

// ERP HR & Payroll Management
app.post("/api/updateUserCommission", (req, res) => {
  const { email, komisiPersen } = req.body;
  const targetUser = db.users.find((u: any) => u.email === email);
  if (!targetUser) return res.json({ s: 0, m: "Pegawai tidak ditemukan." });
  targetUser.komisiPersen = Number(komisiPersen) || 0;
  res.json({ s: 1, m: `Persentase komisi untuk ${targetUser.nama} berhasil diatur menjadi ${targetUser.komisiPersen}% oleh Owner!` });
});

app.post("/api/buatPayroll", (req, res) => {
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

  res.json({ s: 1, m: `Payroll & komisi untuk ${pegawai} berhasil diproses & dicatat dalam buku besar!` });
});

// ERP Manufacturing / Production (Bill of Materials)
app.post("/api/buatProduksi", (req, res) => {
  const { produk, qtyProduksi, bahanBaku, qtyBahan, pic } = req.body;
  if (!produk || !qtyProduksi) return res.json({ s: 0, m: "Data produksi tidak lengkap!" });
  const id = "PRD-" + Math.floor(100 + Math.random() * 900);
  
  db.production.unshift({
    id,
    tanggal: Date.now(),
    produk,
    qtyProduksi: Number(qtyProduksi) || 1,
    bahanBaku: bahanBaku || "Kain / Bahan Baku Utama",
    qtyBahan: qtyBahan || "Standar",
    status: "Completed",
    pic: pic || "Supervisor Produksi"
  });

  // Add finished goods to Cabang Pusat
  let b = db.barang.find((x: any) => x[2] === produk && x[8] === "Cabang Pusat");
  if (b) {
    b[6] = Number(b[6]) + Number(qtyProduksi);
  }

  res.json({ s: 1, m: `Work Order Produksi ${id} selesai! ${qtyProduksi} pcs ${produk} telah ditambahkan ke stok Cabang Pusat.` });
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
