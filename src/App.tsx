import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  ShoppingCart, 
  Package, 
  Scale, 
  BarChart3, 
  Building2, 
  LogOut, 
  Printer, 
  Plus, 
  Trash2, 
  Store,
  RefreshCw,
  Settings,
  HelpCircle,
  ShieldCheck,
  Users,
  TrendingUp,
  PieChart,
  CheckCircle,
  AlertCircle,
  Edit3,
  Download,
  CreditCard,
  Clock,
  UserCheck,
  ArrowRightLeft,
  Boxes,
  BookOpen,
  Truck,
  Wallet,
  Factory,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

function generateQrisPayload(bank: string, nomor: string, atasNama: string, amount: number): string {
  const cleanBank = (bank || 'BANK').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const cleanNomor = (nomor || '88888888').replace(/[^0-9]/g, '');
  const cleanName = (atasNama || 'MERCHANT').substring(0, 25).toUpperCase();
  
  const tag00 = "000201";
  const tag01 = amount > 0 ? "010212" : "010211";
  
  const domain = "ID.OR.GPNQRIS";
  const sub00 = `00${domain.length < 10 ? '0' + domain.length : domain.length}${domain}`;
  const nmid = "ID10" + (cleanNomor.padEnd(10, '0')).substring(0, 10);
  const sub01 = `01${nmid.length < 10 ? '0' + nmid.length : nmid.length}${nmid}`;
  const sub02 = `02${cleanNomor.length < 10 ? '0' + cleanNomor.length : cleanNomor.length}${cleanNomor}`;
  const sub03 = "0303UMI";
  
  const innerAcct = sub00 + sub01 + sub02 + sub03;
  const tag26 = `26${innerAcct.length < 10 ? '0' + innerAcct.length : innerAcct.length}${innerAcct}`;
  
  const tag52 = "52045499";
  const tag53 = "5303360";
  
  let tag54 = "";
  if (amount > 0) {
    const amtStr = amount.toString();
    tag54 = `54${amtStr.length < 10 ? '0' + amtStr.length : amtStr.length}${amtStr}`;
  }
  
  const tag58 = "5802ID";
  const tag59 = `59${cleanName.length < 10 ? '0' + cleanName.length : cleanName.length}${cleanName}`;
  const tag60 = "6007JAKARTA";
  const addData = `0105${cleanBank}`;
  const tag62 = `62${addData.length < 10 ? '0' + addData.length : addData.length}${addData}`;
  
  const partial = tag00 + tag01 + tag26 + tag52 + tag53 + tag54 + tag58 + tag59 + tag60 + tag62 + "6304";
  
  let crc = 0xFFFF;
  for (let c = 0; c < partial.length; c++) {
    crc ^= partial.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  let hex = (crc & 0xFFFF).toString(16).toUpperCase();
  while (hex.length < 4) hex = '0' + hex;
  return partial + hex;
}

function formatNumberWithDots(num: number | string): string {
  if (num === undefined || num === null || num === '') return '';
  const clean = String(num).replace(/[^0-9]/g, '');
  if (!clean) return '';
  return Number(clean).toLocaleString('id-ID');
}

function parseNumberFromDots(str: string): number {
  const clean = String(str).replace(/[^0-9]/g, '');
  return clean ? Number(clean) : 0;
}

interface User {
  email: string;
  nama: string;
  role: string; // 'Owner', 'Admin Cabang', 'Kasir'
  cabang: string; // 'Semua Cabang' or specific branch name
  shift: string;
  loginTime: string;
}

interface CartItem {
  kode: string;
  nama: string;
  harga: number;
  hpp: number;
  qty: number;
}

interface Rekening {
  id: string;
  bank: string;
  nomor: string;
  atasNama: string;
  qrisUrl: string;
}

export const THEMES = [
  {
    id: "sakura",
    nama: "🌸 Sakura Blossom (Pink - Default)",
    primary: "#ff3377",
    primaryHover: "#ff1a5c",
    secondary: "#ff6699",
    secondaryHover: "#ff4d80",
    bg: "#fff0f5",
    lightTint: "#ffe4e1",
    borderTint: "#fbcfe8",
    textColor: "#ff3377",
    glow: "rgba(255, 51, 119, 0.15)",
    sidebarBg: "#ff6699",
  },
  {
    id: "emerald",
    nama: "🌲 Emerald Garden (Hijau Corporate)",
    primary: "#059669",
    primaryHover: "#047857",
    secondary: "#10b981",
    secondaryHover: "#059669",
    bg: "#f0fdf4",
    lightTint: "#dcfce7",
    borderTint: "#a7f3d0",
    textColor: "#059669",
    glow: "rgba(5, 150, 105, 0.15)",
    sidebarBg: "#10b981",
  },
  {
    id: "ocean",
    nama: "💙 Royal Ocean (Biru Navy & Sky)",
    primary: "#1d4ed8",
    primaryHover: "#1e40af",
    secondary: "#3b82f6",
    secondaryHover: "#2563eb",
    bg: "#f0f6ff",
    lightTint: "#dbeafe",
    borderTint: "#bfdbfe",
    textColor: "#1d4ed8",
    glow: "rgba(29, 78, 216, 0.15)",
    sidebarBg: "#3b82f6",
  },
  {
    id: "amethyst",
    nama: "🍇 Amethyst Lavender (Ungu Elegan)",
    primary: "#7c3aed",
    primaryHover: "#6d28d9",
    secondary: "#8b5cf6",
    secondaryHover: "#7c3aed",
    bg: "#f5f3ff",
    lightTint: "#ede9fe",
    borderTint: "#ddd6fe",
    textColor: "#7c3aed",
    glow: "rgba(124, 58, 237, 0.15)",
    sidebarBg: "#8b5cf6",
  },
  {
    id: "sunset",
    nama: "🍊 Tangerine Sunset (Orange Fresh)",
    primary: "#ea580c",
    primaryHover: "#c2410c",
    secondary: "#f97316",
    secondaryHover: "#ea580c",
    bg: "#fff7ed",
    lightTint: "#ffedd5",
    borderTint: "#fed7aa",
    textColor: "#ea580c",
    glow: "rgba(234, 88, 12, 0.15)",
    sidebarBg: "#f97316",
  },
  {
    id: "carbon",
    nama: "🕶️ Carbon Tech (Modern Slate/Black)",
    primary: "#111827",
    primaryHover: "#1f2937",
    secondary: "#4b5563",
    secondaryHover: "#374151",
    bg: "#f9fafb",
    lightTint: "#f3f4f6",
    borderTint: "#e5e7eb",
    textColor: "#111827",
    glow: "rgba(17, 24, 39, 0.15)",
    sidebarBg: "#4b5563",
  }
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pos' | 'barang' | 'opname' | 'laporan' | 'audit' | 'cabang' | 'staff' | 'settings' | 'panduan' | 'transfer' | 'erp' | 'ledger' | 'po' | 'payroll' | 'production'>('pos');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [settings, setSettings] = useState({
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
    ] as Rekening[]
  });

  const currentTheme = THEMES.find(t => t.id === (settings.theme || 'sakura')) || THEMES[0];
  
  // Login form state
  const [emailInput, setEmailInput] = useState('owner@usaha.com');
  const [sandiInput, setSandiInput] = useState('123456');
  const [shiftInput, setShiftInput] = useState('Pagi');

  // Database state
  const [barangList, setBarangList] = useState<any[]>([]);
  const [cabangList, setCabangList] = useState<any[]>([]);
  const [transaksiList, setTransaksiList] = useState<any[]>([]);
  const [opnameList, setOpnameList] = useState<any[]>([]);
  const [transferList, setTransferList] = useState<any[]>([]);
  const [purchaseOrdersList, setPurchaseOrdersList] = useState<any[]>([]);
  const [ledgerList, setLedgerList] = useState<any[]>([]);
  const [payrollList, setPayrollList] = useState<any[]>([]);
  const [productionList, setProductionList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  // ERP Forms
  const [poSupplier, setPoSupplier] = useState('');
  const [poCabang, setPoCabang] = useState('Cabang Pusat');
  const [poKodeBarang, setPoKodeBarang] = useState('');
  const [poQty, setPoQty] = useState('');
  const [poHargaBeli, setPoHargaBeli] = useState('');

  const [payPeriode, setPayPeriode] = useState('Juli 2026');
  const [payPegawai, setPayPegawai] = useState('');
  const [payCabang, setPayCabang] = useState('Cabang Pusat');
  const [payGaji, setPayGaji] = useState('');
  const [payKomisi, setPayKomisi] = useState('');

  const [prdProduk, setPrdProduk] = useState('');
  const [prdQty, setPrdQty] = useState('');
  const [prdBahan, setPrdBahan] = useState('Kain Katun Rayon Premium');
  const [prdQtyBahan, setPrdQtyBahan] = useState('15 Meter');

  // Operational Expenses per Branch (Sewa Gedung, Listrik, Air, Gaji Pokok, Telekomunikasi, Transport, CSR)
  const [branchOpExpenses, setBranchOpExpenses] = useState<{
    [cabang: string]: { sewa: number; listrik: number; air: number; gaji: number; telepon: number; transport: number; csr: number }
  }>({
    "Cabang Pusat": { sewa: 5000000, listrik: 1500000, air: 300000, gaji: 15000000, telepon: 500000, transport: 1000000, csr: 500000 },
    "Cabang Jakarta Selatan": { sewa: 7500000, listrik: 2200000, air: 450000, gaji: 18000000, telepon: 600000, transport: 1500000, csr: 750000 },
    "Cabang Bandung": { sewa: 4000000, listrik: 1200000, air: 250000, gaji: 12000000, telepon: 400000, transport: 800000, csr: 450000 }
  });
  const [selectedOpBranch, setSelectedOpBranch] = useState<string>("Cabang Pusat");

  // Settings form state
  const [setNamaToko, setSetNamaToko] = useState('');
  const [setAlamat, setSetAlamat] = useState('');
  const [setAlamatPo, setSetAlamatPo] = useState('');
  const [setTheme, setSetTheme] = useState('sakura');
  const [setLogoUrl, setSetLogoUrl] = useState('');
  const [setPajak, setSetPajak] = useState('');
  const [setDiskonMember, setSetDiskonMember] = useState('');
  const [setFooter, setSetFooter] = useState('');
  const [rekeningList, setRekeningList] = useState<Rekening[]>([]);

  // New Bank Account Form
  const [newBank, setNewBank] = useState('');
  const [newNoRek, setNewNoRek] = useState('');
  const [newAtasNama, setNewAtasNama] = useState('');

  // Staff form state & edit state
  const [staffEmail, setStaffEmail] = useState('');
  const [staffSandi, setStaffSandi] = useState('');
  const [staffNama, setStaffNama] = useState('');
  const [staffRole, setStaffRole] = useState('Kasir');
  const [staffCabang, setStaffCabang] = useState('Cabang Pusat');
  const [editingStaffEmail, setEditingStaffEmail] = useState<string | null>(null);

  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [metodeBayar, setMetodeBayar] = useState('Cash');
  const [uangBayar, setUangBayar] = useState<number>(0);
  const [selectedRekeningId, setSelectedRekeningId] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [useTax, setUseTax] = useState(true);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [showStrukModal, setShowStrukModal] = useState(false);

  // New Item Form state
  const [newKode, setNewKode] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newBeli, setNewBeli] = useState('');
  const [newHpp, setNewHpp] = useState('');
  const [newJual, setNewJual] = useState('');
  const [newStok, setNewStok] = useState('');
  const [newFoto, setNewFoto] = useState('');
  const [editingItemKode, setEditingItemKode] = useState<string | null>(null);
  const [branchStokMap, setBranchStokMap] = useState<{ [cabang: string]: number }>({});
  const [branchHppMap, setBranchHppMap] = useState<{ [cabang: string]: number }>({});

  // Opname state
  const [opKode, setOpKode] = useState('');
  const [opSistem, setOpSistem] = useState(0);
  const [opFisik, setOpFisik] = useState(0);
  const [opKet, setOpKet] = useState('');

  // Branch Form & edit state
  const [cId, setCId] = useState('');
  const [cNama, setCNama] = useState('');
  const [cAlamat, setCAlamat] = useState('');
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);

  // Report filters
  const [reportBranchFilter, setReportBranchFilter] = useState('ALL');
  const [reportPeriodFilter, setReportPeriodFilter] = useState('ALL'); // ALL, daily, monthly, yearly

  // Transfer state
  const [trfDariCabang, setTrfDariCabang] = useState('');
  const [trfKeCabang, setTrfKeCabang] = useState('');
  const [trfKode, setTrfKode] = useState('');
  const [trfQty, setTrfQty] = useState('');
  const [trfCatatan, setTrfCatatan] = useState('');

  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'delete_barang' | 'delete_branch' | 'delete_staff' | 'process_po' | 'process_transfer' | null;
    payload: any;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: null,
    payload: null
  });

  const triggerConfirm = (
    title: string, 
    message: string, 
    type: 'delete_barang' | 'delete_branch' | 'delete_staff' | 'process_po' | 'process_transfer',
    payload: any
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      type,
      payload
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.type) return;
    const { type, payload } = confirmDialog;
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));

    try {
      if (type === 'delete_barang') {
        const res = await fetch('/api/hapusBarang', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kode: payload.kode })
        });
        const data = await res.json();
        alert(data.m);
        fetchData();
      } else if (type === 'delete_branch') {
        const res = await fetch('/api/hapusCabang', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: payload.id })
        });
        const data = await res.json();
        alert(data.m);
        fetchData();
      } else if (type === 'delete_staff') {
        const res = await fetch('/api/hapusUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: payload.email })
        });
        const data = await res.json();
        alert(data.m);
        fetchData();
      } else if (type === 'process_po') {
        const res = await fetch('/api/prosesPO', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: payload.id, status: payload.status })
        });
        const data = await res.json();
        alert(data.m);
        fetchData();
      } else if (type === 'process_transfer') {
        const res = await fetch('/api/prosesTransfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: payload.id, status: payload.status })
        });
        const data = await res.json();
        try {
          alert(data.m);
        } catch (alertErr) {
          console.warn("window.alert is blocked/unavailable.", alertErr);
        }
        fetchData();
      }
    } catch (e) {
      console.error(e);
      alert("Gagal memproses tindakan");
    }
  };

  const [showValuasiModal, setShowValuasiModal] = useState(false);
  const [selectedPoForSuratJalan, setSelectedPoForSuratJalan] = useState<any | null>(null);

  const handlePrintSuratJalan = () => {
    window.print();
  };

  const handleDownloadSuratJalanHTML = () => {
    if (!selectedPoForSuratJalan) return;
    
    const po = selectedPoForSuratJalan;
    const storeName = settings.namaToko || "PINKY POS & BOUTIQUE";
    const storeAddress = settings.alamatPo || settings.alamat || "Jl. Merdeka No. 45, Kebayoran Baru, Jakarta Selatan";
    const storeLogoHtml = settings.logoUrl 
      ? `<img src="${settings.logoUrl}" alt="Logo Toko" style="width: 64px; height: 64px; object-fit: cover; border-radius: 12px; border: 1px solid #fbcfe8; flex-shrink: 0;" />`
      : '';

    const itemsHtml = po.items.map((it: any, idx: number) => `
      <tr style="border-bottom: 1px solid #d1d5db;">
        <td style="padding: 10px; text-align: center; border-right: 1px solid #d1d5db;">${idx + 1}</td>
        <td style="padding: 10px; font-weight: bold; border-right: 1px solid #d1d5db; color: #111827;">${it.nama}</td>
        <td style="padding: 10px; text-align: center; font-weight: 900; border-right: 1px solid #d1d5db; color: #111827;">${it.qty}</td>
        <td style="padding: 10px; text-align: center; border-right: 1px solid #d1d5db;">Pcs</td>
        <td style="padding: 10px; text-align: right; border-right: 1px solid #d1d5db; color: #111827;">Rp ${(it.hargaBeli || 0).toLocaleString('id-ID')}</td>
        <td style="padding: 10px; text-align: right; color: #111827; font-weight: bold;">Rp ${((it.qty || 0) * (it.hargaBeli || 0)).toLocaleString('id-ID')}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Purchase Order - PO-${po.id}</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @media print {
              body {
                padding: 0;
                margin: 0;
                background-color: white;
              }
              .no-print {
                display: none !important;
              }
              .paper-border {
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
              }
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              background-color: #f3f4f6;
              padding: 2rem 1rem;
              color: #1f2937;
            }
          </style>
        </head>
        <body class="flex flex-col items-center justify-start min-h-screen">
          <!-- Control Panel banner (Hidden on print) -->
          <div class="no-print bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-4 rounded-2xl shadow-xl mb-6 w-full max-w-4xl flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 class="font-bold text-lg">📄 Purchase Order (PO) Siap Cetak (PO-${po.id})</h3>
              <p class="text-xs text-pink-100 mt-1">Dokumen pemesanan resmi dari ${storeName}. Klik tombol untuk mencetak atau mengunduh sebagai PDF.</p>
            </div>
            <div class="flex gap-2">
              <button onclick="window.print()" class="px-5 py-2.5 bg-white text-pink-600 font-bold text-sm rounded-xl shadow hover:bg-pink-50 transition-all cursor-pointer">
                🖨️ Cetak / Simpan PDF
              </button>
              <button onclick="window.close()" class="px-4 py-2.5 bg-pink-700 text-white font-medium text-sm rounded-xl hover:bg-pink-800 transition-all cursor-pointer">
                Tutup Halaman
              </button>
            </div>
          </div>

          <!-- Document Paper -->
          <div class="paper-border bg-white border-2 border-gray-300 p-8 rounded-2xl shadow-lg w-full max-w-4xl text-gray-800">
            <!-- Paper Header -->
            <div class="flex flex-col md:flex-row justify-between items-start border-b-4 border-double border-gray-800 pb-4 mb-6 gap-4" style="border-bottom: 4px double #1f2937; padding-bottom: 1rem; margin-bottom: 1.5rem;">
              <div style="display: flex; gap: 1rem; align-items: center;">
                ${storeLogoHtml}
                <div>
                  <h2 class="text-2xl font-black text-gray-900 tracking-tight uppercase" style="font-weight: 900; font-size: 1.5rem; margin: 0;">
                    ${storeName}
                  </h2>
                  <p class="text-xs font-semibold text-pink-600 uppercase tracking-widest mt-0.5" style="font-size: 0.75rem; letter-spacing: 0.1em; color: #db2777; font-weight: 600; margin: 0;">Fashion, Retail & Supply Chain Management</p>
                  <p class="text-xs text-gray-500 mt-1 max-w-md" style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">${storeAddress}</p>
                </div>
              </div>
              <div class="md:text-right" style="text-align: right;">
                <h3 class="text-xl font-bold text-gray-900 tracking-wider" style="font-size: 1.25rem; font-weight: 700; margin: 0;">PURCHASE ORDER (PO)</h3>
                <p class="text-xs text-gray-400 font-mono uppercase" style="font-size: 0.75rem; color: #9ca3af; font-family: monospace; margin: 0;">SURAT PESANAN BARANG</p>
                <div class="mt-3 text-xs" style="font-size: 0.75rem; margin-top: 0.75rem;">
                  <p style="margin: 2px 0;"><span style="color: #6b7280;">Nomor Dokumen:</span> <b style="color: #111827; font-family: monospace;">PO-${po.id}</b></p>
                  <p style="margin: 2px 0;"><span style="color: #6b7280;">Tanggal PO:</span> <b style="color: #111827;">${new Date(po.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</b></p>
                  <p style="margin: 2px 0;"><span style="color: #6b7280;">Metode Pengiriman:</span> <b style="color: #111827;">Kurir / Expedisi Rekanan</b></p>
                </div>
              </div>
            </div>

            <!-- Buyer & Supplier Info -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-xs" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-200" style="background-color: #f9fafb; padding: 1rem; border-radius: 12px; border: 1px solid #e5e7eb;">
                <span class="text-gray-500 uppercase font-semibold tracking-wider block mb-1.5" style="color: #6b7280; font-weight: 600; display: block; margin-bottom: 0.5rem;">PEMESAN (BUYER):</span>
                <p class="font-bold text-sm text-gray-900" style="font-size: 0.875rem; font-weight: 700; color: #111827;">${storeName}</p>
                <p class="text-gray-500 mt-1" style="color: #6b7280; margin-top: 0.25rem;">Pembuat Pesanan Resmi</p>
                <p class="text-gray-400 mt-2" style="color: #9ca3af; margin-top: 0.5rem; font-size: 0.75rem;">Lokasi Tujuan Pengiriman: <b>${po.cabang}</b></p>
              </div>
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-200" style="background-color: #f9fafb; padding: 1rem; border-radius: 12px; border: 1px solid #e5e7eb;">
                <span class="text-gray-500 uppercase font-semibold tracking-wider block mb-1.5" style="color: #6b7280; font-weight: 600; display: block; margin-bottom: 0.5rem;">PENYEDIA (SUPPLIER):</span>
                <p class="font-bold text-sm text-gray-900" style="font-size: 0.875rem; font-weight: 700; color: #111827;">${po.supplier}</p>
                <p class="text-gray-500 mt-1" style="color: #6b7280; margin-top: 0.25rem;">Mitra Penyedia & Rekanan Eksternal</p>
                <p class="text-gray-500" style="color: #6b7280; font-size: 0.75rem;">Harap memproses pesanan sesuai dengan harga disepakati di bawah ini.</p>
              </div>
            </div>

            <!-- Message -->
            <p class="text-xs text-gray-600 mb-4 italic leading-relaxed" style="font-size: 0.75rem; color: #4b5563; font-style: italic; margin-bottom: 1rem;">
              Bersama surat ini, kami mengirimkan Purchase Order resmi (Surat Pesanan) untuk pemesanan barang sediaan (stock) dengan rincian kuantitas, spesifikasi, dan harga yang disepakati sebagai berikut:
            </p>

            <!-- Table of Items -->
            <div class="overflow-x-auto mb-6" style="margin-bottom: 1.5rem; overflow-x: auto;">
              <table class="w-full text-left text-xs border border-gray-300" style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; font-size: 0.75rem;">
                <thead>
                  <tr class="bg-gray-100 text-gray-700 font-bold border-b border-gray-300 uppercase" style="background-color: #f3f4f6; color: #374151; font-weight: bold; text-transform: uppercase;">
                    <th style="padding: 10px; text-align: center; border-right: 1px solid #d1d5db; border-bottom: 1px solid #d1d5db; width: 50px;">No</th>
                    <th style="padding: 10px; border-right: 1px solid #d1d5db; border-bottom: 1px solid #d1d5db; text-align: left;">Deskripsi / Nama Produk</th>
                    <th style="padding: 10px; text-align: center; border-right: 1px solid #d1d5db; border-bottom: 1px solid #d1d5db; width: 100px;">Jumlah (Qty)</th>
                    <th style="padding: 10px; text-align: center; border-right: 1px solid #d1d5db; border-bottom: 1px solid #d1d5db; width: 80px;">Satuan</th>
                    <th style="padding: 10px; text-align: right; border-right: 1px solid #d1d5db; border-bottom: 1px solid #d1d5db; width: 140px;">Harga Satuan</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 1px solid #d1d5db; width: 150px;">Jumlah Harga</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  <tr style="border-top: 2px solid #1f2937; font-weight: bold; background-color: #f9fafb;">
                    <td colspan="5" style="padding: 10px; text-align: right; border-right: 1px solid #d1d5db; font-weight: bold;">TOTAL NILAI PESANAN (ESTIMASI):</td>
                    <td style="padding: 10px; text-align: right; color: #db2777; font-size: 0.875rem; font-weight: 900;">Rp ${(po.total || 0).toLocaleString('id-ID')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Terms / Notes -->
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-3 text-[11px] text-gray-500 mb-8 leading-relaxed" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.75rem; font-size: 11px; color: #6b7280; margin-bottom: 2rem;">
              <p class="font-bold mb-1 text-gray-700" style="font-weight: 700; color: #374151; margin-bottom: 0.25rem;">📌 Syarat & Ketentuan Pemesanan (Purchase Order):</p>
              <ol class="list-decimal pl-4 space-y-0.5" style="list-style-type: decimal; padding-left: 1rem; margin: 0;">
                <li>Mohon berikan konfirmasi kesiapan barang dan estimasi tanggal pengiriman setelah menerima lembar PO resmi ini.</li>
                <li>Seluruh produk yang dikirimkan wajib dalam kondisi fisik prima, baru, lolos QC, serta sesuai spesifikasi deskripsi di atas.</li>
                <li>Lampirkan dokumen Surat Jalan pengiriman fisik dari Supplier dengan mencantumkan nomor referensi <b>PO-${po.id}</b> ini.</li>
              </ol>
            </div>

            <!-- Signatures -->
            <div class="grid grid-cols-3 gap-4 text-center text-xs mt-6 pt-4 border-t border-dashed border-gray-300" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px dashed #d1d5db; text-align: center;">
              <div class="flex flex-col justify-between h-28" style="display: flex; flex-direction: column; justify-content: space-between; height: 112px;">
                <div>
                  <p class="font-semibold text-gray-500 uppercase tracking-wider text-[10px]" style="font-weight: 600; color: #6b7280; font-size: 10px; text-transform: uppercase;">PEMBELI / PEMESAN</p>
                  <p class="text-gray-400 text-[10px] italic mt-0.5" style="color: #9ca3af; font-size: 10px; font-style: italic;">(Staf / Admin Cabang)</p>
                </div>
                <div>
                  <p class="font-bold border-t border-gray-300 pt-1.5 text-gray-900" style="font-weight: 700; border-top: 1px solid #e5e7eb; padding-top: 6px; color: #111827; margin: 0;">${user?.nama || 'Staff Pembeli'}</p>
                  <p class="text-[10px] text-gray-400 font-mono" style="font-size: 10px; color: #9ca3af; font-family: monospace; margin: 0;">Tgl: .../ .../ ......</p>
                </div>
              </div>
              <div class="flex flex-col justify-between h-28" style="display: flex; flex-direction: column; justify-content: space-between; height: 112px;">
                <div>
                  <p class="font-semibold text-gray-500 uppercase tracking-wider text-[10px]" style="font-weight: 600; color: #6b7280; font-size: 10px; text-transform: uppercase;">SUPPLIER / REKANAN</p>
                  <p class="text-gray-400 text-[10px] italic mt-0.5" style="color: #9ca3af; font-size: 10px; font-style: italic;">(Konfirmasi Penerimaan PO)</p>
                </div>
                <div>
                  <p class="font-bold border-t border-gray-300 pt-1.5 text-gray-900" style="font-weight: 700; border-top: 1px solid #e5e7eb; padding-top: 6px; color: #111827; margin: 0;">_________________</p>
                  <p class="text-[10px] text-gray-400 font-mono" style="font-size: 10px; color: #9ca3af; font-family: monospace; margin: 0;">Tgl: .../ .../ ......</p>
                </div>
              </div>
              <div class="flex flex-col justify-between h-28" style="display: flex; flex-direction: column; justify-content: space-between; height: 112px;">
                <div>
                  <p class="font-semibold text-gray-500 uppercase tracking-wider text-[10px]" style="font-weight: 600; color: #6b7280; font-size: 10px; text-transform: uppercase;">MENGETAHUI / MENYETUJUI</p>
                  <p class="text-gray-400 text-[10px] italic mt-0.5" style="color: #9ca3af; font-size: 10px; font-style: italic;">(Owner / Manajemen Pusat)</p>
                </div>
                <div>
                  <p class="font-bold border-t border-gray-300 pt-1.5 text-[#ff3377]" style="font-weight: 700; border-top: 1px solid #e5e7eb; padding-top: 6px; color: #db2777; margin: 0;">Owner / Pusat</p>
                  <p class="text-[10px] text-gray-400 font-mono" style="font-size: 10px; color: #9ca3af; font-family: monospace; margin: 0;">Verified System ✅</p>
                </div>
              </div>
            </div>
          </div>

          <script>
            // Automatically focus and prompt print on load
            window.onload = function() {
              window.focus();
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Purchase_Order_PO-${po.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderSuratJalanPaper = (po: any) => {
    if (!po) return null;
    return (
      <div className="bg-white border-2 border-gray-300 p-6 rounded-xl text-gray-800">
        {/* Paper Header */}
        <div className="flex flex-col md:flex-row justify-between items-start border-b-4 border-double border-gray-800 pb-4 mb-6 gap-4">
          <div className="flex gap-4 items-center">
            {settings.logoUrl && (
              <img 
                src={settings.logoUrl} 
                alt="Logo Toko" 
                className="w-16 h-16 object-cover rounded-xl border border-pink-200 shrink-0" 
                referrerPolicy="no-referrer" 
              />
            )}
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
                {settings.namaToko || "PINKY POS & BOUTIQUE"}
              </h2>
              <p className="text-xs font-semibold text-pink-600 uppercase tracking-widest mt-0.5">Fashion, Retail & Supply Chain Management</p>
              <p className="text-xs text-gray-500 mt-1 max-w-md">{settings.alamatPo || settings.alamat || "Jl. Merdeka No. 45, Kebayoran Baru, Jakarta Selatan"}</p>
            </div>
          </div>
          <div className="md:text-right">
            <h3 className="text-xl font-bold text-gray-900 tracking-wider">PURCHASE ORDER (PO)</h3>
            <p className="text-xs text-gray-400 font-mono uppercase">SURAT PESANAN BARANG</p>
            <div className="mt-3 text-xs space-y-1">
              <p><span className="text-gray-500">Nomor Dokumen:</span> <b className="font-mono text-gray-900">PO-{po.id}</b></p>
              <p><span className="text-gray-500">Tanggal PO:</span> <b className="text-gray-900">{new Date(po.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</b></p>
              <p><span className="text-gray-500">Metode Kirim:</span> <b className="text-gray-900">Kurir / Expedisi</b></p>
            </div>
          </div>
        </div>

        {/* Sender & Receiver Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-xs">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <span className="text-gray-500 uppercase font-semibold tracking-wider block mb-1.5">PEMESAN (BUYER):</span>
            <p className="font-bold text-sm text-gray-900">{settings.namaToko || "PINKY POS & BOUTIQUE"}</p>
            <p className="text-gray-500 mt-1">Pembuat Pesanan Resmi</p>
            <p className="text-gray-400 mt-2">Tujuan Pengiriman: <b>{po.cabang}</b></p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <span className="text-gray-500 uppercase font-semibold tracking-wider block mb-1.5">PENYEDIA (SUPPLIER):</span>
            <p className="font-bold text-sm text-gray-900">{po.supplier}</p>
            <p className="text-gray-500 mt-1">Mitra Penyedia & Rekanan Eksternal</p>
            <p className="text-gray-400 mt-2">Harap proses pesanan sesuai sediaan barang & kuantitas yang disepakati.</p>
          </div>
        </div>

        {/* Message */}
        <p className="text-xs text-gray-600 mb-4 italic leading-relaxed">
          Bersama surat ini, kami mengirimkan Purchase Order resmi (Surat Pesanan) untuk pemesanan barang sediaan (stock) dengan rincian kuantitas, spesifikasi, dan harga yang disepakati sebagai berikut:
        </p>

        {/* Table of Items */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-left text-xs border border-gray-300">
            <thead>
              <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300 uppercase">
                <th className="p-2.5 text-center border-r border-gray-300 w-12">No</th>
                <th className="p-2.5 border-r border-gray-300">Deskripsi / Nama Produk</th>
                <th className="p-2.5 text-center border-r border-gray-300 w-24">Jumlah (Qty)</th>
                <th className="p-2.5 text-center border-r border-gray-300 w-20">Satuan</th>
                <th className="p-2.5 text-right border-r border-gray-300 w-32">Harga Satuan</th>
                <th className="p-2.5 text-right">Jumlah Harga</th>
              </tr>
            </thead>
            <tbody>
              {po.items.map((it: any, idx: number) => (
                <tr key={idx} className="border-b border-gray-300 hover:bg-gray-50/50">
                  <td className="p-2.5 text-center border-r border-gray-300">{idx + 1}</td>
                  <td className="p-2.5 font-bold border-r border-gray-300 text-gray-900">
                    {it.nama}
                  </td>
                  <td className="p-2.5 text-center font-black border-r border-gray-300 text-gray-900">
                    {it.qty}
                  </td>
                  <td className="p-2.5 text-center border-r border-gray-300">Pcs</td>
                  <td className="p-2.5 text-right border-r border-gray-300 text-gray-900">
                    Rp {(it.hargaBeli || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="p-2.5 text-right text-gray-900 font-bold">
                    Rp {((it.qty || 0) * (it.hargaBeli || 0)).toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold border-t-2 border-gray-800">
                <td colSpan={5} className="p-2.5 text-right border-r border-gray-300 uppercase">
                  Total Nilai Pesanan (Estimasi):
                </td>
                <td className="p-2.5 text-right text-[#ff3377] font-black text-sm">
                  Rp {(po.total || 0).toLocaleString('id-ID')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Terms / Notes */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-[11px] text-gray-500 mb-8 leading-relaxed">
          <p className="font-bold mb-1 text-gray-700">📌 Syarat & Ketentuan Pemesanan (Purchase Order):</p>
          <ol className="list-decimal pl-4 space-y-0.5">
            <li>Mohon berikan konfirmasi kesiapan barang dan estimasi tanggal pengiriman setelah menerima lembar PO resmi ini.</li>
            <li>Seluruh produk yang dikirimkan wajib dalam kondisi fisik prima, baru, lolos QC, serta sesuai spesifikasi deskripsi di atas.</li>
            <li>Lampirkan dokumen Surat Jalan pengiriman fisik dari Supplier dengan mencantumkan nomor referensi <b>PO-{po.id}</b> ini.</li>
          </ol>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-4 text-center text-xs mt-6 pt-4 border-t border-dashed border-gray-300">
          <div className="flex flex-col justify-between h-28">
            <div>
              <p className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">PEMBELI / PEMESAN</p>
              <p className="text-gray-400 text-[10px] italic mt-0.5">(Staf / Admin Cabang)</p>
            </div>
            <div>
              <p className="font-bold border-t border-gray-300 pt-1.5 text-gray-900">{user?.nama || 'Staff Pembeli'}</p>
              <p className="text-[10px] text-gray-400 font-mono">Tgl: .../ .../ ......</p>
            </div>
          </div>
          <div className="flex flex-col justify-between h-28">
            <div>
              <p className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">SUPPLIER / REKANAN</p>
              <p className="text-gray-400 text-[10px] italic mt-0.5">(Konfirmasi Penerimaan PO)</p>
            </div>
            <div>
              <p className="font-bold border-t border-gray-300 pt-1.5 text-gray-900">_________________</p>
              <p className="text-[10px] text-gray-400 font-mono">Tgl: .../ .../ ......</p>
            </div>
          </div>
          <div className="flex flex-col justify-between h-28">
            <div>
              <p className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">MENGETAHUI / MENYETUJUI</p>
              <p className="text-gray-400 text-[10px] italic mt-0.5">(Owner / Manajemen Pusat)</p>
            </div>
            <div>
              <p className="font-bold border-t border-gray-300 pt-1.5 text-[#ff3377]">Owner / Pusat</p>
              <p className="text-[10px] text-gray-400 font-mono">Verified System ✅</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (user) {
      fetchData();
      if (user.cabang && user.cabang !== 'Semua Cabang') {
        setTrfDariCabang(user.cabang);
      } else {
        setTrfDariCabang('Cabang Pusat');
      }
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/getAwal');
      const data = await res.json();
      setBarangList(data.barang || []);
      setCabangList(data.cabang || []);
      setTransaksiList(data.transaksi || []);
      setOpnameList(data.opname || []);
      setTransferList(data.transfer || []);
      setPurchaseOrdersList(data.purchaseOrders || []);
      setLedgerList(data.ledger || []);
      setPayrollList(data.payroll || []);
      setProductionList(data.production || []);
      setUsersList(data.users || []);
      if (data.settings) {
        setSettings(data.settings);
        setSetNamaToko(data.settings.namaToko);
        setSetAlamat(data.settings.alamat);
        setSetAlamatPo(data.settings.alamatPo || data.settings.alamat || '');
        setSetTheme(data.settings.theme || 'sakura');
        setSetLogoUrl(data.settings.logoUrl);
        setSetPajak(String(data.settings.pajakPersen));
        setSetDiskonMember(String(data.settings.diskonMemberPersen));
        setSetFooter(data.settings.footerStruk);
        if (data.settings.rekeningOwner) {
          setRekeningList(data.settings.rekeningOwner);
        }
        if (data.settings.branchOpExpenses) {
          setBranchOpExpenses(data.settings.branchOpExpenses);
        }
      }
    } catch (e) {
      console.error("Gagal memuat data", e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, sandi: sandiInput, shift: shiftInput })
      });
      const data = await res.json();
      if (data.s === 1) {
        const loginTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
        setUser({
          email: data.email,
          nama: data.nama,
          role: data.role,
          cabang: data.cabang,
          shift: data.shift || shiftInput,
          loginTime
        });
      } else {
        alert(data.m || "Gagal Autentikasi");
      }
    } catch (err) {
      alert("Terjadi kesalahan koneksi server.");
    } finally {
      setLoading(false);
    }
  };

  const tambahKeKeranjang = (kode: string, nama: string, harga: number, hpp: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.kode === kode);
      if (existing) {
        return prev.map(item => item.kode === kode ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { kode, nama, harga, hpp, qty: 1 }];
    });
  };

  // Calculations
  const subtotal = cart.reduce((acc, curr) => acc + (curr.harga * curr.qty), 0);
  const diskonAmount = isMember ? Math.round(subtotal * (settings.diskonMemberPersen / 100)) : 0;
  const afterDiscount = Math.max(0, subtotal - diskonAmount);
  const pajakAmount = useTax ? Math.round(afterDiscount * (settings.pajakPersen / 100)) : 0;
  const grandTotal = afterDiscount + pajakAmount;
  const kembalian = uangBayar - grandTotal >= 0 ? uangBayar - grandTotal : 0;

  const prosesBayar = async () => {
    if (cart.length === 0) return alert("Keranjang belanja masih kosong!");
    const finalUangBayar = metodeBayar === 'Cash' ? (uangBayar || grandTotal) : grandTotal;
    if (metodeBayar === 'Cash' && finalUangBayar < grandTotal) {
      return alert("Uang tunai kurang dari total belanja!");
    }

    const selectedRekeningObj = rekeningList.find(r => `${r.bank} - ${r.nomor} a.n ${r.atasNama}` === selectedRekeningId || r.id === selectedRekeningId) || rekeningList[0];
    const metodeText = metodeBayar === 'QRIS' && selectedRekeningObj 
      ? `QRIS - ${selectedRekeningObj.bank} (${selectedRekeningObj.nomor} a.n ${selectedRekeningObj.atasNama})` 
      : metodeBayar;

    const nota = "TXT-" + Date.now();
    const payload = {
      nota,
      email: user?.email,
      kasir: user?.nama,
      cabang: user?.cabang,
      total: grandTotal,
      subtotal,
      diskon: diskonAmount,
      pajak: pajakAmount,
      metode: metodeText,
      shift: user?.shift,
      item: cart,
      bayar: metodeBayar === 'Cash' ? finalUangBayar : grandTotal,
      kembalian: metodeBayar === 'Cash' ? (finalUangBayar - grandTotal) : 0,
      rekeningOwnerInfo: selectedRekeningObj || null
    };

    try {
      const res = await fetch('/api/simpanTransaksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.s === 1) {
        setLastReceipt({ ...payload, timestamp: Date.now() });
        setShowStrukModal(true);
        setCart([]);
        setUangBayar(0);
        setIsMember(false);
        fetchData();
      } else {
        alert("Gagal memproses transaksi");
      }
    } catch (e) {
      alert("Error saat menyimpan transaksi");
    }
  };

  const simpanBarang = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama || !newJual) return alert("Nama dan Harga Jual wajib diisi!");
    
    try {
      const res = await fetch('/api/simpanBarang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kode: newKode || `BRG${Date.now().toString().slice(-4)}`,
          nama: newNama,
          beli: newBeli,
          hpp: newHpp || newBeli,
          jual: newJual,
          stok: newStok || 10,
          foto: newFoto || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=150',
          cabang: user?.cabang,
          oldKode: editingItemKode,
          branchStokMap,
          branchHppMap
        })
      });
      const data = await res.json();
      alert(data.m);
      setNewKode('');
      setNewNama('');
      setNewBeli('');
      setNewHpp('');
      setNewJual('');
      setNewStok('');
      setNewFoto('');
      setEditingItemKode(null);
      setBranchStokMap({});
      setBranchHppMap({});
      fetchData();
    } catch (err) {
      alert("Gagal menyimpan barang");
    }
  };

  const handleEditBarang = (b: any) => {
    setNewKode(b[1]);
    setNewNama(b[2]);
    setNewBeli(String(b[3]));
    setNewHpp(String(b[4]));
    setNewJual(String(b[5]));
    setNewFoto(b[7]);
    setEditingItemKode(b[1]);

    const stockMap: any = {};
    const hppMap: any = {};
    cabangList.forEach(c => {
      const found = barangList.find(item => item[1] === b[1] && item[8] === c[1]);
      stockMap[c[1]] = found ? found[6] : 10;
      hppMap[c[1]] = found ? found[4] : Number(b[4]);
    });
    setBranchStokMap(stockMap);
    setBranchHppMap(hppMap);
  };

  const handleHapusBarang = async (kode: string) => {
    triggerConfirm(
      'Hapus Barang',
      `Apakah Anda yakin ingin menghapus barang dengan kode ${kode} dari semua cabang? Tindakan ini tidak dapat dibatalkan.`,
      'delete_barang',
      { kode }
    );
  };

  const simpanCabang = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cNama) return alert("Nama cabang wajib diisi!");
    try {
      const res = await fetch('/api/simpanCabang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: cId || `CBR${Date.now().toString().slice(-3)}`, 
          nama: cNama, 
          alamat: cAlamat,
          oldId: editingBranchId 
        })
      });
      const data = await res.json();
      alert(data.m);
      setCId('');
      setCNama('');
      setCAlamat('');
      setEditingBranchId(null);
      fetchData();
    } catch (err) {
      alert("Gagal menyimpan cabang");
    }
  };

  const handleEditBranch = (c: any) => {
    setCId(c[0]);
    setCNama(c[1]);
    setCAlamat(c[2]);
    setEditingBranchId(c[0]);
  };

  const handleHapusBranch = async (id: string) => {
    triggerConfirm(
      'Hapus Cabang',
      `Apakah Anda yakin ingin menghapus cabang dengan ID ${id}? Tindakan ini tidak dapat dibatalkan.`,
      'delete_branch',
      { id }
    );
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/updateSettings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namaToko: setNamaToko,
          alamat: setAlamat,
          alamatPo: setAlamatPo,
          theme: setTheme,
          logoUrl: setLogoUrl,
          pajakPersen: setPajak,
          diskonMemberPersen: setDiskonMember,
          footerStruk: setFooter,
          rekeningOwner: rekeningList,
          branchOpExpenses: branchOpExpenses
        })
      });
      const data = await res.json();
      alert(data.m);
      fetchData();
    } catch (err) {
      alert("Gagal memperbarui pengaturan");
    }
  };

  const tambahRekening = () => {
    if (!newBank || !newNoRek) return alert("Nama Bank dan Nomor Rekening wajib diisi!");
    const newRek: Rekening = {
      id: newBank.toLowerCase() + Date.now().toString().slice(-3),
      bank: newBank,
      nomor: newNoRek,
      atasNama: newAtasNama || user?.nama || "Owner",
      qrisUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${newBank}-${newNoRek}`
    };
    const updated = [...rekeningList, newRek];
    setRekeningList(updated);
    setNewBank('');
    setNewNoRek('');
    setNewAtasNama('');
  };

  const hapusRekening = (id: string) => {
    setRekeningList(rekeningList.filter(r => r.id !== id));
  };

  const handleSimpanStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffEmail || !staffNama) return alert("Email dan Nama staff wajib diisi!");
    try {
      const res = await fetch('/api/simpanUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: staffEmail,
          sandi: staffSandi || "123456",
          nama: staffNama,
          role: staffRole,
          cabang: staffCabang,
          oldEmail: editingStaffEmail
        })
      });
      const data = await res.json();
      alert(data.m);
      setStaffEmail('');
      setStaffSandi('');
      setStaffNama('');
      setEditingStaffEmail(null);
      fetchData();
    } catch (err) {
      alert("Gagal menyimpan data staff");
    }
  };

  const handleEditStaff = (u: any) => {
    setStaffEmail(u.email);
    setStaffSandi(u.sandi);
    setStaffNama(u.nama);
    setStaffRole(u.role);
    setStaffCabang(u.cabang);
    setEditingStaffEmail(u.email);
  };

  const handleHapusStaff = async (email: string) => {
    triggerConfirm(
      'Hapus Akun Staff',
      `Apakah Anda yakin ingin menghapus akun staff dengan email ${email}? Tindakan ini tidak dapat dibatalkan.`,
      'delete_staff',
      { email }
    );
  };

  const handleOpnameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;
    setOpKode(selectedCode);
    const found = barangList.find(b => b[1] === selectedCode);
    if (found) {
      setOpSistem(Number(found[6]) || 0);
      setOpFisik(Number(found[6]) || 0);
    } else {
      setOpSistem(0);
      setOpFisik(0);
    }
  };

  const simpanOpname = async () => {
    if (!opKode) return alert("Pilih barang terlebih dahulu!");
    const found = barangList.find(b => b[1] === opKode);
    if (!found) return;

    try {
      const res = await fetch('/api/simpanOpname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cabang: user?.cabang,
          kode: opKode,
          nama: found[2],
          sistem: opSistem,
          fisik: opFisik,
          selisih: opFisik - opSistem,
          ket: opKet
        })
      });
      const data = await res.json();
      alert(data.m);
      setOpKet('');
      fetchData();
    } catch (err) {
      alert("Gagal menyimpan opname");
    }
  };

  const buatTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trfDariCabang || !trfKeCabang || !trfKode || !trfQty) return alert("Lengkapi data transfer barang!");
    const normalizedDari = trfDariCabang === 'Pusat' ? 'Cabang Pusat' : trfDariCabang;
    const normalizedKe = trfKeCabang === 'Pusat' ? 'Cabang Pusat' : trfKeCabang;

    if (normalizedDari === normalizedKe) return alert("Cabang asal dan cabang tujuan tidak boleh sama!");
    const foundItem = barangList.find(b => b[1] === trfKode && (b[8] === normalizedDari || (!b[8] && normalizedDari === 'Cabang Pusat')));
    if (!foundItem) return alert(`Barang tidak ditemukan di stok cabang asal (${trfDariCabang}).`);
    if (Number(trfQty) > Number(foundItem[6])) {
      return alert(`Stok tidak mencukupi! Stok ${trfDariCabang} saat ini: ${foundItem[6]}`);
    }

    try {
      const res = await fetch('/api/buatTransfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dariCabang: normalizedDari,
          keCabang: normalizedKe,
          kode: trfKode,
          nama: foundItem[2],
          qty: Number(trfQty),
          catatan: trfCatatan,
          pengaju: user?.nama
        })
      });
      const data = await res.json();
      alert(data.m);
      setTrfKeCabang('');
      setTrfKode('');
      setTrfQty('');
      setTrfCatatan('');
      fetchData();
    } catch (e) {
      alert("Gagal mengajukan transfer barang");
    }
  };

  const buatPO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poSupplier || !poKodeBarang || !poQty) return alert("Lengkapi data Purchase Order!");
    const itemRef = barangList.find(b => b[1] === poKodeBarang);
    const nama = itemRef ? itemRef[2] : "Produk Baru";
    const hBeli = Number(poHargaBeli) || (itemRef ? Number(itemRef[3]) : 50000);
    const total = hBeli * Number(poQty);

    try {
      const res = await fetch('/api/buatPO', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier: poSupplier,
          cabang: poCabang,
          items: [{ kode: poKodeBarang, nama, qty: Number(poQty), hargaBeli: hBeli }],
          total
        })
      });
      const data = await res.json();
      alert(data.m);
      setPoSupplier('');
      setPoQty('');
      setPoHargaBeli('');
      fetchData();
    } catch (e) {
      alert("Gagal membuat PO");
    }
  };

  const prosesPO = async (id: string, status: 'Received' | 'Cancelled') => {
    triggerConfirm(
      'Ubah Status Purchase Order',
      `Apakah Anda yakin ingin mengubah status PO ${id} menjadi ${status === 'Received' ? 'Diterima (Received)' : 'Dibatalkan (Cancelled)'}?`,
      'process_po',
      { id, status }
    );
  };

  const [commissionMap, setCommissionMap] = useState<{ [email: string]: number }>({});

  useEffect(() => {
    if (usersList.length > 0) {
      const map: { [email: string]: number } = {};
      usersList.forEach(u => {
        map[u.email] = u.komisiPersen !== undefined ? u.komisiPersen : 5;
      });
      setCommissionMap(map);
    }
  }, [usersList]);

  const handleUpdateCommission = async (email: string) => {
    const val = commissionMap[email];
    if (val === undefined || isNaN(val)) return alert("Masukkan persentase komisi yang valid!");
    try {
      const res = await fetch('/api/updateUserCommission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, komisiPersen: val })
      });
      const data = await res.json();
      alert(data.m);
      fetchData();
    } catch (e) {
      alert("Gagal memperbarui persentase komisi.");
    }
  };

  const handleSelectPayrollPegawai = (val: string) => {
    setPayPegawai(val);
    const foundUser = usersList.find(u => `${u.nama} (${u.role})` === val);
    if (foundUser) {
      setPayCabang(foundUser.cabang);
      const branchTxs = transaksiList.filter(t => foundUser.cabang === 'Semua Cabang' || t[4] === foundUser.cabang);
      let branchGross = 0;
      branchTxs.forEach(t => {
        const items = t[7];
        if (Array.isArray(items)) {
          items.forEach((it: any) => {
            const itemHpp = Number(it.hpp || it.harga * 0.7);
            branchGross += (Number(it.harga) - itemHpp) * Number(it.qty);
          });
        } else {
          branchGross += Number(t[5] || 0) * 0.3;
        }
      });
      const targetU = foundUser.cabang;
      const bOp = branchOpExpenses[targetU] || { sewa: 5000000, listrik: 1500000, air: 300000, gaji: 15000000, telepon: 500000, transport: 1000000, csr: 500000 };
      const totalBiayaOperasional = targetU === 'Semua Cabang'
        ? Object.values(branchOpExpenses).reduce((acc, o) => acc + o.sewa + o.listrik + o.air + o.gaji + o.telepon + o.transport + o.csr, 0)
        : (bOp.sewa + bOp.listrik + bOp.air + bOp.gaji + bOp.telepon + bOp.transport + bOp.csr);
      const branchNet = Math.max(0, branchGross - totalBiayaOperasional);
      const komisiPct = foundUser.komisiPersen !== undefined ? foundUser.komisiPersen : 5;
      const calcKomisi = Math.round((komisiPct / 100) * branchNet);
      setPayKomisi(calcKomisi.toString());
      if (!payGaji) setPayGaji('3500000');
    }
  };

  const buatPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payPegawai || !payGaji) return alert("Lengkapi data gaji & pegawai!");
    try {
      const res = await fetch('/api/buatPayroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periode: payPeriode,
          pegawai: payPegawai,
          cabang: payCabang,
          gajiPokok: Number(payGaji) || 0,
          komisi: Number(payKomisi) || 0
        })
      });
      const data = await res.json();
      alert(data.m);
      setPayPegawai('');
      setPayGaji('');
      setPayKomisi('');
      fetchData();
    } catch (e) {
      alert("Gagal mencatat payroll");
    }
  };

  const buatProduksi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prdProduk || !prdQty) return alert("Lengkapi data work order produksi!");
    try {
      const res = await fetch('/api/buatProduksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produk: prdProduk,
          qtyProduksi: Number(prdQty) || 1,
          bahanBaku: prdBahan,
          qtyBahan: prdQtyBahan,
          pic: user?.nama || 'Supervisor'
        })
      });
      const data = await res.json();
      alert(data.m);
      setPrdProduk('');
      setPrdQty('');
      fetchData();
    } catch (e) {
      alert("Gagal mencatat produksi manufaktur");
    }
  };

  const prosesTransfer = async (id: string, status: 'Approved' | 'Rejected') => {
    triggerConfirm(
      status === 'Approved' ? 'Setujui Transfer Barang' : 'Tolak Transfer Barang',
      `Apakah Anda yakin ingin ${status === 'Approved' ? 'Menyetujui & Memutasi Stok' : 'Menolak'} transfer barang dengan ID ${id}?`,
      'process_transfer',
      { id, status }
    );
  };

  // Export Audit Stock Opname to Excel Workbook (.csv format)
  const downloadExcelOpname = () => {
    const filteredOpname = opnameList.filter(op => user?.role === 'Owner' || op.cabang === user?.cabang);
    if (filteredOpname.length === 0) return alert("Tidak ada data audit untuk diunduh.");

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Waktu Audit,Cabang,Kode Barang,Nama Produk,Stok Sistem,Stok Fisik,Selisih,Keterangan\n";

    filteredOpname.forEach(op => {
      const timeStr = new Date(op.timestamp).toLocaleString();
      const row = `"${timeStr}","${op.cabang}","${op.kode}","${op.nama}",${op.sistem},${op.fisik},${op.selisih},"${op.ket || '-'}"`;
      csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Audit_Stock_Opname_${user?.cabang || 'All'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fff0f5] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-pink-100">
          <div className="mb-4">
            <img src={settings.logoUrl} alt="Logo" className="w-24 h-24 rounded-full object-cover mx-auto shadow-md border-2 border-pink-300" referrerPolicy="no-referrer" />
          </div>
          <h2 className="text-2xl font-bold text-[#ff3377] mb-2 tracking-tight">🌸 {settings.namaToko} 🌸</h2>
          <p className="text-gray-500 text-sm mb-6">Sistem Kasir POS & Manajemen Butik Multi-Cabang</p>
          
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Email Akun (Login)</label>
              <input 
                type="email" 
                value={emailInput} 
                onChange={e => setEmailInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6699] focus:outline-none"
                placeholder="email@usaha.com"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Kata Sandi</label>
              <input 
                type="password" 
                value={sandiInput} 
                onChange={e => setSandiInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6699] focus:outline-none"
                placeholder="******"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Shift Kerja</label>
              <select 
                value={shiftInput} 
                onChange={e => setShiftInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6699] focus:outline-none bg-white"
              >
                <option value="Pagi">Shift Pagi (08:00 - 15:00)</option>
                <option value="Siang">Shift Siang (15:00 - 22:00)</option>
                <option value="Malam">Shift Malam / Full</option>
              </select>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#ff6699] hover:bg-[#ff3377] text-white font-medium py-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Masuk & Catat Jam Masuk 📝"}
            </button>
          </form>
          <div className="mt-4 text-xs text-gray-400 space-y-1">
            <p><b>Owner (Superadmin):</b> owner@usaha.com / 123456</p>
            <p><b>Admin Cabang:</b> admin.pst@usaha.com | admin.jkt@usaha.com</p>
            <p><b>Kasir Cabang:</b> kasir.pst@usaha.com | kasir.jkt@usaha.com</p>
          </div>
        </div>
      </div>
    );
  }

  // Group barangList by kode to show unique products in POS with stock and HPP per branch
  const posProductsMap = new Map();
  barangList.forEach(b => {
    if (!b || !b[1]) return;
    const kode = b[1];
    const cabangName = b[8];
    const stokVal = Number(b[6]) || 0;
    const hppVal = Number(b[4]) || 0;

    if (!posProductsMap.has(kode)) {
      posProductsMap.set(kode, {
        kode: b[1],
        nama: b[2],
        beli: b[3],
        hpp: b[4],
        jual: b[5],
        foto: b[7],
        branchStok: {},
        branchHpp: {}
      });
    }
    const prod = posProductsMap.get(kode);
    prod.branchStok[cabangName] = stokVal;
    prod.branchHpp[cabangName] = hppVal;
    if (b[2]) prod.nama = b[2];
    if (b[4]) prod.hpp = b[4];
    if (b[5]) prod.jual = b[5];
    if (b[7]) prod.foto = b[7];
  });

  const posProducts = Array.from(posProductsMap.values());

  // Strict branch financial report isolation
  // Owner can filter by any branch. Admin Cabang and Kasir can ONLY see their own branch.
  const actualBranchFilter = user.role === 'Owner' ? reportBranchFilter : user.cabang;

  const filteredTransaksi = transaksiList.filter(t => {
    // t format: [timestamp, nota, email, kasir, cabang, total, metode, item, subtotal, diskon, pajak, bayar, kembalian]
    const branchMatch = actualBranchFilter === 'ALL' || t[4] === actualBranchFilter;
    const tTime = Number(t[0]);
    const now = Date.now();
    let periodMatch = true;
    if (reportPeriodFilter === 'daily') {
      const oneDay = 86400000;
      periodMatch = (now - tTime) <= oneDay;
    } else if (reportPeriodFilter === 'monthly') {
      const oneMonth = 86400000 * 30;
      periodMatch = (now - tTime) <= oneMonth;
    } else if (reportPeriodFilter === 'yearly') {
      const oneYear = 86400000 * 365;
      periodMatch = (now - tTime) <= oneYear;
    }
    return branchMatch && periodMatch;
  });

  const totalOmset = filteredTransaksi.reduce((acc, curr) => acc + Number(curr[5] || 0), 0);
  const totalPajak = filteredTransaksi.reduce((acc, curr) => acc + Number(curr[10] || 0), 0);
  const totalDiskon = filteredTransaksi.reduce((acc, curr) => acc + Number(curr[9] || 0), 0);
  
  let totalLabaKotor = 0;
  let cashTotal = 0;
  let qrisTotal = 0;
  filteredTransaksi.forEach(t => {
    const metode = t[6];
    const totalVal = Number(t[5] || 0);
    if (metode && metode.startsWith('QRIS')) qrisTotal += totalVal;
    else cashTotal += totalVal;

    const items = t[7];
    if (Array.isArray(items)) {
      items.forEach((it: any) => {
        const itemHpp = Number(it.hpp || it.harga * 0.7);
        totalLabaKotor += (Number(it.harga) - itemHpp) * Number(it.qty);
      });
    } else {
      totalLabaKotor += totalVal * 0.3;
    }
  });

  const targetOpBranch = user.role === 'Owner' ? selectedOpBranch : user.cabang;

  let totalBiayaOperasional = 0;
  if (actualBranchFilter === 'ALL') {
    cabangList.forEach(c => {
      const op = branchOpExpenses[c[1]] || { sewa: 5000000, listrik: 1500000, air: 300000, gaji: 15000000, telepon: 500000, transport: 1000000, csr: 500000 };
      totalBiayaOperasional += (op.sewa + op.listrik + op.air + op.gaji + op.telepon + op.transport + op.csr);
    });
  } else {
    const op = branchOpExpenses[actualBranchFilter] || { sewa: 5000000, listrik: 1500000, air: 300000, gaji: 15000000, telepon: 500000, transport: 1000000, csr: 500000 };
    totalBiayaOperasional = op.sewa + op.listrik + op.air + op.gaji + op.telepon + op.transport + op.csr;
  }
  const totalLabaBersih = totalLabaKotor - totalBiayaOperasional;

  const filteredOpname = opnameList.filter(op => user.role === 'Owner' || op.cabang === user.cabang);
  const filteredBarang = barangList
    .filter(b => user.role === 'Owner' || b[8] === user.cabang)
    .sort((a, b) => String(a[1] || '').localeCompare(String(b[1] || '')));

  return (
    <>
      <style>{`
        :root {
          --primary-color: ${currentTheme.primary};
          --primary-hover: ${currentTheme.primaryHover};
          --secondary-color: ${currentTheme.secondary};
          --secondary-hover: ${currentTheme.secondaryHover};
          --bg-color: ${currentTheme.bg};
          --light-tint: ${currentTheme.lightTint};
          --border-tint: ${currentTheme.borderTint};
          --text-color: ${currentTheme.textColor};
          --glow: ${currentTheme.glow};
        }

        /* Dynamically override pink-themed background and colors across the app to support corporate colors */
        #root-app-layout {
          background-color: var(--bg-color) !important;
        }

        /* Dynamic classes overrides */
        .sidebar-theme-bg {
          background-color: var(--secondary-color) !important;
        }
        .toggle-btn-theme {
          background-color: var(--primary-color) !important;
        }
        .toggle-btn-theme:hover {
          background-color: var(--primary-hover) !important;
        }
        .nav-btn-active {
          background-color: var(--primary-color) !important;
          color: #ffffff !important;
          box-shadow: 0 4px 6px -1px var(--glow), 0 2px 4px -1px var(--glow) !important;
        }
        .nav-btn-inactive {
          background-color: transparent !important;
          color: rgba(255, 255, 255, 0.85) !important;
          box-shadow: none !important;
        }
        .nav-btn-inactive:hover {
          background-color: rgba(0, 0, 0, 0.12) !important;
          color: #ffffff !important;
        }
        .nav-category-header {
          color: var(--light-tint) !important;
          opacity: 0.95;
        }

        /* Wildcard/Attribute overrides for total precision across every button & component */
        [class*="bg-[#ff3377]"], [class*="bg-pink-600"] {
          background-color: var(--primary-color) !important;
        }
        [class*="bg-[#ff6699]"], [class*="bg-pink-500"] {
          background-color: var(--secondary-color) !important;
        }
        [class*="hover:bg-[#ff1a5c]"]:hover, [class*="hover:bg-pink-700"]:hover, [class*="hover:bg-pink-800"]:hover {
          background-color: var(--primary-hover) !important;
        }
        [class*="hover:bg-[#ff3377]"]:hover {
          background-color: var(--primary-color) !important;
        }
        [class*="text-[#ff3377]"], [class*="text-pink-600"], [class*="text-pink-500"] {
          color: var(--primary-color) !important;
        }
        [class*="text-[#ff6699]"] {
          color: var(--secondary-color) !important;
        }
        [class*="border-pink-100"], [class*="border-pink-200"], [class*="border-pink-300"], [class*="border-pink-400"] {
          border-color: var(--border-tint) !important;
        }
        [class*="bg-pink-50"], [class*="bg-pink-100"] {
          background-color: var(--light-tint) !important;
        }
        [class*="focus:ring-[#ff6699]"]:focus, [class*="focus:ring-pink-500"]:focus {
          --tw-ring-color: var(--primary-color) !important;
        }
        [class*="focus:border-[#ff6699]"]:focus, [class*="focus:border-pink-500"]:focus {
          border-color: var(--primary-color) !important;
        }
        [class*="text-pink-700"] {
          color: var(--primary-hover) !important;
        }

        .text-\[\#ff3377\] {
          color: var(--primary-color) !important;
        }
        .bg-\[\#ff3377\] {
          background-color: var(--primary-color) !important;
        }
        .hover\:bg-\[\#ff1a5c\]:hover {
          background-color: var(--primary-hover) !important;
        }
        .bg-\[\#ff6699\] {
          background-color: var(--secondary-color) !important;
        }
        .hover\:bg-\[\#ff3377\]:hover {
          background-color: var(--primary-color) !important;
        }
        .hover\:bg-\[\#ff6699\]\/60:hover {
          background-color: rgba(${currentTheme.id === 'sakura' ? '255, 102, 153' : currentTheme.id === 'emerald' ? '16, 185, 129' : currentTheme.id === 'ocean' ? '59, 130, 246' : currentTheme.id === 'amethyst' ? '139, 92, 246' : currentTheme.id === 'sunset' ? '249, 115, 22' : '75, 85, 99'}, 0.6) !important;
        }
        .bg-\[\#fff0f5\] {
          background-color: var(--bg-color) !important;
        }
        .bg-pink-50, .bg-pink-50\/40 {
          background-color: var(--light-tint) !important;
        }
        .bg-pink-100 {
          background-color: var(--light-tint) !important;
        }
        .border-pink-100, .border-pink-200, .border-pink-300 {
          border-color: var(--border-tint) !important;
        }
        .text-pink-500, .text-pink-600 {
          color: var(--primary-color) !important;
        }
        .text-pink-700 {
          color: var(--primary-hover) !important;
        }
        .bg-pink-500, .bg-pink-600 {
          background-color: var(--primary-color) !important;
        }
        .bg-pink-700 {
          background-color: var(--primary-hover) !important;
        }
        .hover\:bg-pink-800:hover, .hover\:bg-pink-700:hover {
          background-color: var(--primary-hover) !important;
        }
        .hover\:bg-pink-50:hover {
          background-color: var(--light-tint) !important;
        }

        /* Summary table colors */
        .bg-\[\#ffebf0\] {
          background-color: var(--light-tint) !important;
        }
        .hover\:bg-\[\#ffebf0\]\/80:hover {
          background-color: rgba(${currentTheme.id === 'sakura' ? '255, 102, 153' : currentTheme.id === 'emerald' ? '16, 185, 129' : currentTheme.id === 'ocean' ? '59, 130, 246' : currentTheme.id === 'amethyst' ? '139, 92, 246' : currentTheme.id === 'sunset' ? '249, 115, 22' : '75, 85, 99'}, 0.15) !important;
        }
        .bg-\[\#ffd1df\] {
          background-color: var(--light-tint) !important;
        }
        .bg-\[\#ffd1df\]\/20 {
          background-color: rgba(${currentTheme.id === 'sakura' ? '255, 102, 153' : currentTheme.id === 'emerald' ? '16, 185, 129' : currentTheme.id === 'ocean' ? '59, 130, 246' : currentTheme.id === 'amethyst' ? '139, 92, 246' : currentTheme.id === 'sunset' ? '249, 115, 22' : '75, 85, 99'}, 0.1) !important;
        }
        .bg-\[\#ffd1df\]\/10 {
          background-color: rgba(${currentTheme.id === 'sakura' ? '255, 102, 153' : currentTheme.id === 'emerald' ? '16, 185, 129' : currentTheme.id === 'ocean' ? '59, 130, 246' : currentTheme.id === 'amethyst' ? '139, 92, 246' : currentTheme.id === 'sunset' ? '249, 115, 22' : '75, 85, 99'}, 0.05) !important;
        }

        /* Buttons glow shadow override */
        .shadow-pink-200 {
          box-shadow: 0 4px 6px -1px var(--glow), 0 2px 4px -1px var(--glow) !important;
        }
        .from-pink-500 {
          --tw-gradient-from: var(--primary-color) !important;
          --tw-gradient-to: var(--secondary-color) !important;
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
        }
        .to-pink-600 {
          --tw-gradient-to: var(--primary-hover) !important;
        }
        .from-pink-50 {
          --tw-gradient-from: var(--light-tint) !important;
          --tw-gradient-to: white !important;
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
        }

        @media print {
          /* Hide all screen components */
          #root-app-layout, 
          .fixed, 
          .backdrop-blur-xs, 
          div[role="dialog"],
          button,
          nav,
          header {
            display: none !important;
          }
          body {
            background-color: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #po-print-container {
            display: block !important;
            width: 100% !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <div id="root-app-layout" className="min-h-screen bg-[#fff0f5] flex font-sans text-gray-800 print:hidden">
      {/* Sidebar with wider, prominent logo */}
      <div className={`${isSidebarCollapsed ? 'w-20' : 'w-72'} bg-[#ff6699] sidebar-theme-bg text-white flex flex-col p-5 shadow-lg shrink-0 transition-all duration-300 relative`}>
        {/* Collapse Toggle Button */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          className="absolute top-4 -right-3.5 bg-[#ff3377] toggle-btn-theme text-white p-1 rounded-full border border-white hover:bg-[#ff1a5c] shadow transition-transform duration-200 z-50 flex items-center justify-center cursor-pointer"
          title={isSidebarCollapsed ? "Expand Navigation" : "Collapse Navigation"}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className="flex flex-col items-center justify-center mb-4 text-center">
          {isSidebarCollapsed ? (
            <img src={settings.logoUrl} alt="Logo" className="w-10 h-10 object-cover rounded-full shadow-md border border-white mb-1" referrerPolicy="no-referrer" />
          ) : (
            <>
              <img src={settings.logoUrl} alt="Logo" className="w-full h-28 object-cover rounded-xl shadow-md border-2 border-white mb-2" referrerPolicy="no-referrer" />
              <h3 className="text-xl font-bold tracking-tight">{settings.namaToko}</h3>
            </>
          )}
        </div>

        {!isSidebarCollapsed ? (
          <div className="text-center mb-5 text-xs bg-white/10 p-3 rounded-xl backdrop-blur-sm space-y-1">
            <b className="text-sm font-semibold">{user.nama}</b> ({user.role})<br/>
            <span className="inline-block px-2.5 py-0.5 bg-white text-gray-900 rounded font-bold text-xs">{user.cabang}</span>
            <div className="text-white/90 text-[11px] flex items-center justify-center gap-1 pt-1">
              <Clock className="w-3 h-3"/> Masuk: {user.loginTime} | Shift: {user.shift}
            </div>
          </div>
        ) : (
          <div className="text-center mb-3 bg-white/10 py-1.5 px-1 rounded-lg text-[10px] truncate font-bold" title={`${user.nama} (${user.role})`}>
            {user.role.substring(0, 5)}..
          </div>
        )}

        <hr className="border-white/20 mb-4" />

        <nav className="space-y-1.5 flex-1 text-sm overflow-y-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('pos')}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-2.5'} rounded-lg font-medium transition-colors ${activeTab === 'pos' ? 'nav-btn-active bg-[#ff3377] text-white shadow' : 'nav-btn-inactive text-white/90 hover:bg-[#ff3377]/60'}`}
            title="Kasir POS"
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Kasir POS</span>}
          </button>
          
          {(user.role === 'Owner' || user.role === 'Admin Cabang') && (
            <button 
              onClick={() => setActiveTab('barang')}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-2.5'} rounded-lg font-medium transition-colors ${activeTab === 'barang' ? 'nav-btn-active bg-[#ff3377] text-white shadow' : 'nav-btn-inactive text-white/90 hover:bg-[#ff3377]/60'}`}
              title="Kelola Barang"
            >
              <Package className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Kelola Barang</span>}
            </button>
          )}

          {(user.role === 'Owner' || user.role === 'Admin Cabang') && (
            <button 
              onClick={() => setActiveTab('opname')}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-2.5'} rounded-lg font-medium transition-colors ${activeTab === 'opname' ? 'nav-btn-active bg-[#ff3377] text-white shadow' : 'nav-btn-inactive text-white/90 hover:bg-[#ff3377]/60'}`}
              title="Stok Opname"
            >
              <Scale className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Stok Opname</span>}
            </button>
          )}

          <button 
            onClick={() => setActiveTab('laporan')}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-2.5'} rounded-lg font-medium transition-colors ${activeTab === 'laporan' ? 'nav-btn-active bg-[#ff3377] text-white shadow' : 'nav-btn-inactive text-white/90 hover:bg-[#ff3377]/60'}`}
            title="Lap. Keuangan Analitik"
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Lap. Keuangan Analitik</span>}
          </button>

          {(user.role === 'Owner' || user.role === 'Admin Cabang') && (
            <button 
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-2.5'} rounded-lg font-medium transition-colors ${activeTab === 'audit' ? 'nav-btn-active bg-[#ff3377] text-white shadow' : 'nav-btn-inactive text-white/90 hover:bg-[#ff3377]/60'}`}
              title="Audit Stok Opname"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Audit Stok Opname</span>}
            </button>
          )}

          <button 
            onClick={() => setActiveTab('transfer')}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-2.5'} rounded-lg font-medium transition-colors ${activeTab === 'transfer' ? 'nav-btn-active bg-[#ff3377] text-white shadow' : 'nav-btn-inactive text-white/90 hover:bg-[#ff3377]/60'}`}
            title="Transfer Antar Cabang"
          >
            <ArrowRightLeft className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Transfer Antar Cabang</span>}
          </button>

          {isSidebarCollapsed ? (
            <hr className="border-white/20 my-2" />
          ) : (
            <div className="pt-2 pb-1 border-t border-white/25 my-2">
              <span className="text-[10px] uppercase font-bold tracking-wider nav-category-header text-pink-200 px-3">Modul ERP Terpusat</span>
            </div>
          )}

          <button 
            onClick={() => setActiveTab('erp')}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'gap-3 px-4 py-2'} rounded-lg font-medium transition-colors ${activeTab === 'erp' ? 'nav-btn-active bg-[#ff3377] text-white shadow' : 'nav-btn-inactive text-white/90 hover:bg-[#ff3377]/60'}`}
            title="ERP Executive Cockpit"
          >
            <Boxes className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>ERP Executive Cockpit</span>}
          </button>
          <button 
            onClick={() => setActiveTab('ledger')}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'gap-3 px-4 py-2'} rounded-lg font-medium transition-colors ${activeTab === 'ledger' ? 'nav-btn-active bg-[#ff3377] text-white shadow' : 'nav-btn-inactive text-white/90 hover:bg-[#ff3377]/60'}`}
            title="Buku Besar Akuntansi"
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Buku Besar Akuntansi</span>}
          </button>
          <button 
            onClick={() => setActiveTab('po')}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'gap-3 px-4 py-2'} rounded-lg font-medium transition-colors ${activeTab === 'po' ? 'nav-btn-active bg-[#ff3377] text-white shadow' : 'nav-btn-inactive text-white/90 hover:bg-[#ff3377]/60'}`}
            title="Rantai Pasok & PO"
          >
            <Truck className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Rantai Pasok & PO</span>}
          </button>
          <button 
            onClick={() => setActiveTab('payroll')}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'gap-3 px-4 py-2'} rounded-lg font-medium transition-colors ${activeTab === 'payroll' ? 'nav-btn-active bg-[#ff3377] text-white shadow' : 'nav-btn-inactive text-white/90 hover:bg-[#ff3377]/60'}`}
            title="SDM & Payroll Komisi"
          >
            <Wallet className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>SDM & Payroll Komisi</span>}
          </button>
          <button 
            onClick={() => setActiveTab('production')}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'gap-3 px-4 py-2'} rounded-lg font-medium transition-colors ${activeTab === 'production' ? 'nav-btn-active bg-[#ff3377] text-white shadow' : 'nav-btn-inactive text-white/90 hover:bg-[#ff3377]/60'}`}
            title="Manufaktur & BOM"
          >
            <Factory className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Manufaktur & BOM</span>}
          </button>

          {user.role === 'Owner' && (
            <>
              {isSidebarCollapsed ? (
                <hr className="border-white/20 my-2" />
              ) : (
                <div className="pt-2 pb-1 border-t border-white/25 my-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider nav-category-header text-pink-200 px-3">Manajemen Cabang</span>
                </div>
              )}
              <button 
                onClick={() => setActiveTab('cabang')}
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-2.5'} rounded-lg font-medium transition-colors ${activeTab === 'cabang' ? 'nav-btn-active bg-[#ff3377] text-white shadow' : 'nav-btn-inactive text-white/90 hover:bg-[#ff3377]/60'}`}
                title="Kelola Cabang"
              >
                <Building2 className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Kelola Cabang</span>}
              </button>
              <button 
                onClick={() => setActiveTab('staff')}
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-2.5'} rounded-lg font-medium transition-colors ${activeTab === 'staff' ? 'nav-btn-active bg-[#ff3377] text-white shadow' : 'nav-btn-inactive text-white/90 hover:bg-[#ff3377]/60'}`}
                title="Kelola Staff & Akses"
              >
                <Users className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Kelola Staff & Akses</span>}
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-2.5'} rounded-lg font-medium transition-colors ${activeTab === 'settings' ? 'nav-btn-active bg-[#ff3377] text-white shadow' : 'nav-btn-inactive text-white/90 hover:bg-[#ff3377]/60'}`}
                title="Pengaturan Toko & Bank"
              >
                <Settings className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Pengaturan Toko & Bank</span>}
              </button>
            </>
          )}

          <button 
            onClick={() => setActiveTab('panduan')}
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-2.5'} rounded-lg font-medium transition-colors ${activeTab === 'panduan' ? 'nav-btn-active bg-[#ff3377] text-white shadow' : 'nav-btn-inactive text-white/90 hover:bg-[#ff3377]/60'}`}
            title="Panduan & Cara Pakai"
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Panduan & Cara Pakai</span>}
          </button>
        </nav>

        <button 
          onClick={() => setUser(null)}
          className={`mt-auto w-full bg-red-500 hover:bg-red-600 text-white font-medium ${isSidebarCollapsed ? 'p-2.5 justify-center' : 'py-2.5 justify-center'} rounded-lg flex items-center gap-2 text-sm shadow transition-colors`}
          title="Keluar / Log Out"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isSidebarCollapsed && <span>Keluar / Log Out</span>}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto max-h-screen">
        
        {/* TAB POS */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-pink-100">
                <h5 className="text-[#ff3377] font-bold text-lg mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" /> Pilih Produk ({user.cabang})
                </h5>
                {posProducts.length === 0 ? (
                  <p className="text-gray-400 p-6 text-center">Stok produk kosong. Tambahkan di menu Kelola Barang.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto p-1">
                    {posProducts.map((p, idx) => {
                      const currentBranchStock = p.branchStok[user.cabang] !== undefined ? p.branchStok[user.cabang] : 0;
                      return (
                        <div key={idx} className="bg-white border border-gray-100 rounded-xl p-3 flex flex-col items-center text-center shadow-xs hover:shadow-md transition-shadow">
                          <img 
                            src={p.foto || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=150'} 
                            alt={p.nama}
                            className="w-full h-28 object-cover rounded-lg mb-2"
                            referrerPolicy="no-referrer"
                          />
                          <h6 className="font-semibold text-sm text-gray-800 line-clamp-1">{p.nama}</h6>
                          <span className="text-xs font-bold text-gray-700 mb-0.5">Stok {user.cabang}: {currentBranchStock}</span>
                          <div className="text-[10px] text-gray-500 mb-1 flex flex-wrap justify-center gap-1">
                            {Object.entries(p.branchStok).map(([cab, st], sIdx) => (
                              <span key={sIdx} className="bg-pink-50 px-1.5 py-0.5 rounded text-[#ff3377]">
                                {cab}: {st as number}
                              </span>
                            ))}
                          </div>
                          <span className="text-sm font-bold text-[#ff3377] mb-2">Rp {Number(p.jual || 0).toLocaleString()}</span>
                          <button 
                            onClick={() => {
                              const currentHpp = p.branchHpp && p.branchHpp[user.cabang] !== undefined ? p.branchHpp[user.cabang] : (p.hpp || p.beli || 0);
                              tambahKeKeranjang(p.kode, p.nama, Number(p.jual || 0), Number(currentHpp));
                            }}
                            className="mt-auto w-full bg-[#ff6699] hover:bg-[#ff3377] text-white text-xs font-medium py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Beli
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-pink-100 sticky top-6">
                {(() => {
                  const currentUserObj = usersList.find(u => u.email === user?.email) || user;
                  const staffKomisi = currentUserObj?.komisiPersen !== undefined ? currentUserObj.komisiPersen : 5;
                  const myTxs = transaksiList.filter(t => t[4] === user?.cabang || user?.cabang === 'Semua Cabang');
                  const todaySales = myTxs.filter(t => Date.now() - t[0] < 86400000).reduce((acc, t) => acc + Number(t[5]), 0);
                  const monthSales = myTxs.filter(t => Date.now() - t[0] < 86400000 * 30).reduce((acc, t) => acc + Number(t[5]), 0);
                  let myGross = 0;
                  myTxs.forEach(t => {
                    const items = t[7];
                    if (Array.isArray(items)) {
                      items.forEach((it: any) => {
                        const itemHpp = Number(it.hpp || it.harga * 0.7);
                        myGross += (Number(it.harga) - itemHpp) * Number(it.qty);
                      });
                    } else {
                      myGross += Number(t[5] || 0) * 0.3;
                    }
                  });
                  const myNet = Math.max(0, myGross - totalBiayaOperasional);
                  const estKomisi = Math.round((staffKomisi / 100) * myNet);
                  return (
                    <div className="bg-gradient-to-br from-pink-50 to-white p-3.5 rounded-xl border border-pink-200 mb-4 text-xs space-y-1.5 shadow-xs">
                      <div className="font-bold text-[#ff3377] flex items-center justify-between">
                        <span>📊 Referensi Penjualan & Komisi Anda</span>
                        <span className="bg-[#ff3377] text-white px-2 py-0.5 rounded-full text-[10px] font-bold">{staffKomisi}% Komisi</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Penjualan Hari Ini:</span>
                        <span className="font-bold">Rp {todaySales.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Penjualan Bulan Ini:</span>
                        <span className="font-bold">Rp {monthSales.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-900 border-t border-pink-200 pt-1 font-semibold">
                        <span>Estimasi Komisi ({staffKomisi}%):</span>
                        <span className="text-[#ff3377] font-bold">Rp {estKomisi.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })()}

                <h5 className="text-[#ff3377] font-bold text-lg mb-4">Keranjang Belanja</h5>
                
                <div className="max-h-48 overflow-y-auto mb-4 border border-gray-100 rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-pink-50 text-gray-600 text-xs">
                      <tr>
                        <th className="p-2 text-left">Nama</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2 text-right">Subtotal</th>
                        <th className="p-2 text-center">Hapus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cart.length === 0 ? (
                        <tr><td colSpan={4} className="text-center text-gray-400 py-6 text-xs">Keranjang kosong</td></tr>
                      ) : (
                        cart.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-2 font-medium">{item.nama}</td>
                            <td className="p-2 text-center">{item.qty}</td>
                            <td className="p-2 text-right font-semibold">{(item.harga * item.qty).toLocaleString()}</td>
                            <td className="p-2 text-center">
                              <button 
                                onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Options: Member Discount & Tax */}
                <div className="space-y-2 mb-4 bg-pink-50/50 p-3 rounded-xl border border-pink-100 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
                    <input 
                      type="checkbox" 
                      checked={isMember} 
                      onChange={e => setIsMember(e.target.checked)}
                      className="rounded text-[#ff6699] focus:ring-[#ff6699]"
                    />
                    <span>Diskon Member ({settings.diskonMemberPersen}%)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700">
                    <input 
                      type="checkbox" 
                      checked={useTax} 
                      onChange={e => setUseTax(e.target.checked)}
                      className="rounded text-[#ff6699] focus:ring-[#ff6699]"
                    />
                    <span>Pajak PPN ({settings.pajakPersen}%)</span>
                  </label>
                </div>

                {/* Calculation breakdown */}
                <div className="space-y-1 mb-4 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl">
                  <div className="flex justify-between"><span>Subtotal:</span> <span>Rp {subtotal.toLocaleString()}</span></div>
                  {isMember && <div className="flex justify-between text-green-600 font-medium"><span>Diskon Member ({settings.diskonMemberPersen}%):</span> <span>- Rp {diskonAmount.toLocaleString()}</span></div>}
                  {useTax && <div className="flex justify-between"><span>Pajak PPN ({settings.pajakPersen}%):</span> <span>+ Rp {pajakAmount.toLocaleString()}</span></div>}
                  <div className="border-t border-gray-200 pt-2 flex justify-between items-center text-base font-bold text-[#ff3377]">
                    <span>Total Tagihan:</span>
                    <span>Rp {grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Metode Bayar</label>
                    <select 
                      value={metodeBayar} 
                      onChange={e => setMetodeBayar(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                    >
                      <option value="Cash">Tunai / Cash</option>
                      <option value="QRIS">QRIS (Rekening Owner)</option>
                    </select>
                  </div>

                  {metodeBayar === 'Cash' ? (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-gray-600">Uang Tunai (Rp)</label>
                        <button 
                          type="button" 
                          onClick={() => setUangBayar(grandTotal)}
                          className="text-[11px] text-[#ff3377] font-bold hover:underline"
                        >
                          [Uang Pas]
                        </button>
                      </div>
                      <input 
                        type="number" 
                        value={uangBayar || ''} 
                        onChange={e => setUangBayar(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        placeholder="Contoh: 100000"
                      />
                      <div className="mt-1 text-xs text-gray-500 font-medium flex justify-between">
                        <span>Kembalian:</span>
                        <span className={`font-bold ${uangBayar === grandTotal ? 'text-blue-600' : 'text-green-600'}`}>
                          {uangBayar === grandTotal ? 'Uang Pas (Rp 0)' : `Rp ${kembalian.toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-3 border border-pink-300 rounded-xl bg-pink-50/50">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Pilih Rekening Tujuan Owner:</p>
                      <select 
                        value={selectedRekeningId} 
                        onChange={e => setSelectedRekeningId(e.target.value)}
                        className="w-full mb-3 px-3 py-1.5 text-xs border border-gray-300 rounded bg-white"
                      >
                        <option value="">-- Pilih Rekening / Bank Owner --</option>
                        {rekeningList.map((rek: any, idx: number) => (
                          <option key={idx} value={rek.id}>
                            {rek.bank} ({rek.nomor}) - {rek.atasNama}
                          </option>
                        ))}
                      </select>
                      {(() => {
                        const selRek = rekeningList.find(r => r.id === selectedRekeningId) || rekeningList[0];
                        return (
                          <>
                            <div className="bg-white p-2 rounded shadow-xs mb-1 flex justify-center">
                               <QRCodeSVG value={generateQrisPayload(selRek?.bank, selRek?.nomor, selRek?.atasNama, grandTotal)} size={118} level="M" includeMargin={true} />
                             </div>
                            {selRek ? (
                              <div className="text-[11px] text-gray-700 bg-white p-2 rounded border border-pink-200 mt-1">
                                <div className="font-bold text-[#ff3377]">Terhubung: {selRek.bank} - {selRek.nomor}</div>
                                <div className="text-gray-500">Atas Nama: {selRek.atasNama}</div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-gray-500">Pilih rekening untuk menampilkan QRIS owner</span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <button 
                  onClick={prosesBayar}
                  className="w-full bg-[#ff6699] hover:bg-[#ff3377] text-white font-medium py-3 rounded-xl shadow transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Proses & Cetak Struk 🖨️
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB KELOLA BARANG */}
        {activeTab === 'barang' && (user.role === 'Owner' || user.role === 'Admin Cabang') && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100">
            <h4 className="text-[#ff3377] font-bold text-lg mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" /> Kelola & Tambah Item Barang ({user.cabang})
            </h4>

            <form onSubmit={simpanBarang} className="space-y-4 mb-8 bg-pink-50/40 p-4 rounded-xl border border-pink-100">
              {editingItemKode && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-xs flex justify-between items-center font-medium">
                  <span>Sedang Mengedit Barang Kode: <b>{editingItemKode}</b> (Stok dapat disesuaikan per cabang di bawah)</span>
                  <button type="button" onClick={() => { setEditingItemKode(null); setNewKode(''); setNewNama(''); setNewBeli(''); setNewHpp(''); setNewJual(''); setNewStok(''); setNewFoto(''); setBranchStokMap({}); }} className="text-blue-900 underline font-bold">
                    Batal Edit
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Kode Barang</label>
                  <input type="text" value={newKode} onChange={e => setNewKode(e.target.value)} placeholder="Contoh: BRG010" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Nama Barang</label>
                  <input type="text" value={newNama} onChange={e => setNewNama(e.target.value)} placeholder="Nama Produk" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Harga Beli</label>
                  <input type="number" value={newBeli} onChange={e => setNewBeli(e.target.value)} placeholder="0" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">HPP</label>
                  <input type="number" value={newHpp} onChange={e => setNewHpp(e.target.value)} placeholder="0" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Harga Jual</label>
                  <input type="number" value={newJual} onChange={e => setNewJual(e.target.value)} placeholder="0" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" required />
                </div>
                {!editingItemKode && (
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Stok Awal</label>
                    <input type="number" value={newStok} onChange={e => setNewStok(e.target.value)} placeholder="10" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Link URL Gambar (Opsional)</label>
                  <input type="text" value={newFoto} onChange={e => setNewFoto(e.target.value)} placeholder="https://images.unsplash.com/..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-pink-200 space-y-3">
                <label className="text-xs font-bold text-gray-800 block">Penyesuaian Stok & HPP Masing-Masing Cabang (Tarif Regional Dinamis):</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {cabangList.map((c, i) => (
                    <div key={i} className="p-3 bg-pink-50/50 rounded-lg border border-pink-100 space-y-2">
                      <label className="text-xs font-bold text-[#ff3377] block">{c[1]}</label>
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-0.5">Stok Cabang</label>
                        <input 
                          type="number" 
                          value={branchStokMap[c[1]] !== undefined ? branchStokMap[c[1]] : (Number(newStok) || 10)} 
                          onChange={e => setBranchStokMap({ ...branchStokMap, [c[1]]: Number(e.target.value) })}
                          className="w-full px-2 py-1 text-xs border rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-0.5">HPP Cabang (Rp)</label>
                        <input 
                          type="number" 
                          value={branchHppMap[c[1]] !== undefined ? branchHppMap[c[1]] : (Number(newHpp) || Number(newBeli) || 0)} 
                          onChange={e => setBranchHppMap({ ...branchHppMap, [c[1]]: Number(e.target.value) })}
                          className="w-full px-2 py-1 text-xs border rounded bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button type="submit" className="bg-[#ff6699] hover:bg-[#ff3377] text-white px-6 py-2.5 rounded-lg text-sm font-medium shadow transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> {editingItemKode ? 'Perbarui Barang & HPP Cabang 💾' : 'Simpan Barang Baru & HPP Cabang 📦'}
                </button>
              </div>
            </form>

            <h5 className="text-[#ff3377] font-bold text-base mb-3">Tabel Master Barang ({user.cabang})</h5>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm text-left">
                <thead className="bg-pink-50 text-gray-700 text-xs">
                  <tr>
                    <th className="p-3">Gambar</th>
                    <th className="p-3">Kode</th>
                    <th className="p-3">Nama Produk</th>
                    <th className="p-3">Harga Beli</th>
                    <th className="p-3">HPP</th>
                    <th className="p-3">Harga Jual</th>
                    <th className="p-3 text-center">Stok</th>
                    <th className="p-3">Lokasi Cabang</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBarang.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-6 text-gray-400">Belum ada data barang.</td></tr>
                  ) : (
                    filteredBarang.map((b, idx) => (
                      <tr key={idx} className="hover:bg-pink-50/20">
                        <td className="p-3">
                          <img src={b[7] || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=150'} alt="" className="w-10 h-10 object-cover rounded-lg" referrerPolicy="no-referrer" />
                        </td>
                        <td className="p-3 font-mono text-xs">{b[1]}</td>
                        <td className="p-3 font-medium">{b[2]}</td>
                        <td className="p-3">Rp {Number(b[3] || 0).toLocaleString()}</td>
                        <td className="p-3">Rp {Number(b[4] || 0).toLocaleString()}</td>
                        <td className="p-3 font-semibold text-[#ff3377]">Rp {Number(b[5] || 0).toLocaleString()}</td>
                        <td className="p-3 text-center font-bold">{b[6]}</td>
                        <td className="p-3"><span className="px-2 py-1 bg-pink-100 text-[#ff3377] text-xs rounded-full font-medium">{b[8]}</span></td>
                        <td className="p-3 text-center flex items-center justify-center gap-1.5">
                          <button onClick={() => handleEditBarang(b)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1">
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button onClick={() => handleHapusBarang(b[1])} className="bg-red-50 text-red-600 hover:bg-red-100 px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1">
                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-pink-50 border-t-2 border-pink-200 font-bold text-gray-800 text-xs">
                  <tr className="hover:bg-pink-50/50">
                    <td colSpan={3} className="p-3 text-right text-xs uppercase tracking-wider text-gray-500 font-bold">
                      Total ({user.cabang}):
                    </td>
                    <td className="p-3 text-gray-800 font-semibold">
                      Rp {filteredBarang.reduce((sum, b) => sum + (Number(b[6] || 0) * Number(b[3] || 0)), 0).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-gray-800 font-semibold">
                      Rp {filteredBarang.reduce((sum, b) => sum + (Number(b[6] || 0) * Number(b[4] || 0)), 0).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-[#ff3377] font-semibold">
                      Rp {filteredBarang.reduce((sum, b) => sum + (Number(b[6] || 0) * Number(b[5] || 0)), 0).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-center text-sm font-extrabold text-[#ff3377] bg-pink-100/30">
                      {filteredBarang.reduce((sum, b) => sum + Number(b[6] || 0), 0).toLocaleString('id-ID')}
                    </td>
                    <td colSpan={2} className="p-3"></td>
                  </tr>
                  <tr className="bg-[#ffebf0] border-t border-pink-200 hover:bg-[#ffebf0]/80">
                    <td colSpan={3} className="p-3 text-right text-xs uppercase tracking-wider text-[#ff3377] font-extrabold">
                      Total Seluruh Cabang (Konsolidasi):
                    </td>
                    <td className="p-3 text-gray-900 font-extrabold bg-[#ffd1df]/20">
                      Rp {barangList.reduce((sum, b) => sum + (Number(b[6] || 0) * Number(b[3] || 0)), 0).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-gray-900 font-extrabold bg-[#ffd1df]/20">
                      Rp {barangList.reduce((sum, b) => sum + (Number(b[6] || 0) * Number(b[4] || 0)), 0).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-[#ff3377] font-extrabold bg-[#ffd1df]/20">
                      Rp {barangList.reduce((sum, b) => sum + (Number(b[6] || 0) * Number(b[5] || 0)), 0).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-center text-sm font-extrabold text-[#ff3377] bg-[#ffd1df]">
                      {barangList.reduce((sum, b) => sum + Number(b[6] || 0), 0).toLocaleString('id-ID')}
                    </td>
                    <td colSpan={2} className="p-3 bg-[#ffd1df]/10"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* TAB OPNAME */}
        {activeTab === 'opname' && (user.role === 'Owner' || user.role === 'Admin Cabang') && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 max-w-4xl mx-auto">
            <h4 className="text-[#ff3377] font-bold text-lg mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5" /> Stok Opname ({user.cabang})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 bg-pink-50/40 p-4 rounded-xl border border-pink-100">
              <div className="md:col-span-2 lg:col-span-3">
                <label className="text-xs font-semibold text-gray-600 block mb-1">Pilih Barang</label>
                <select 
                  value={opKode} 
                  onChange={handleOpnameChange}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                >
                  <option value="">-- Pilih Barang --</option>
                  {filteredBarang.map((b, idx) => (
                    <option key={idx} value={b[1]}>{b[2]} (Stok Sistem: {b[6]})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Stok Sistem</label>
                <input type="number" value={opSistem} readOnly className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Stok Fisik</label>
                <input type="number" value={opFisik} onChange={e => setOpFisik(Number(e.target.value))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Selisih</label>
                <input type="number" value={opFisik - opSistem} readOnly className={`w-full px-3 py-2 border rounded-lg text-sm font-bold ${opFisik - opSistem < 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`} />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="text-xs font-semibold text-gray-600 block mb-1">Keterangan / Alasan Selisih</label>
                <input type="text" value={opKet} onChange={e => setOpKet(e.target.value)} placeholder="Contoh: Barang rusak / hilang" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
              </div>

              <div className="md:col-span-2 lg:col-span-3 text-right">
                <button 
                  onClick={simpanOpname}
                  className="bg-[#ff6699] hover:bg-[#ff3377] text-white px-6 py-2.5 rounded-lg text-sm font-medium shadow transition-colors"
                >
                  Kirim Opname ⚖️
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB LAPORAN KEUANGAN ANALITIK */}
        {activeTab === 'laporan' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100">
            <h4 className="text-[#ff3377] font-bold text-lg mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" /> Laporan Keuangan Analitik {user.role !== 'Owner' ? `(${user.cabang})` : ''}
            </h4>

            {/* Filter controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-pink-50/40 p-4 rounded-xl border border-pink-100">
              {user.role === 'Owner' ? (
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Filter Cabang (Konsolidasi Owner)</label>
                  <select 
                    value={reportBranchFilter} 
                    onChange={e => setReportBranchFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="ALL">🌐 Semua Cabang (Konsolidasi)</option>
                    {cabangList.map((c, i) => (
                      <option key={i} value={c[1]}>{c[1]}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Cabang Laporan (Terkunci)</label>
                  <input type="text" value={user.cabang} disabled className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600 font-medium" />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Periode Analisis</label>
                <select 
                  value={reportPeriodFilter} 
                  onChange={e => setReportPeriodFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                >
                  <option value="ALL">Semua Waktu</option>
                  <option value="daily">Harian (24 Jam Terakhir)</option>
                  <option value="monthly">Bulanan (30 Hari Terakhir)</option>
                  <option value="yearly">Tahunan (365 Hari Terakhir)</option>
                </select>
              </div>
            </div>

            {/* HPP & Biaya Operasional (Overheads) Configuration Card */}
            <div className="bg-pink-50/60 p-5 rounded-2xl border border-pink-200 mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h5 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <span>🏢</span> HPP & Biaya Operasional Usaha (Tarif Berbeda Per Cabang)
                </h5>
                {user.role === 'Owner' ? (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-gray-600">Pilih Cabang:</label>
                    <select 
                      value={selectedOpBranch} 
                      onChange={e => setSelectedOpBranch(e.target.value)}
                      className="px-3 py-1 bg-white border border-pink-200 rounded-lg text-xs font-semibold text-[#ff3377]"
                    >
                      {cabangList.map((c, i) => (
                        <option key={i} value={c[1]}>{c[1]}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-[#ff3377] bg-white px-3 py-1 rounded-lg border border-pink-200">
                    Cabang: {user.cabang}
                  </span>
                )}
              </div>

              {(() => {
                const curOp = branchOpExpenses[targetOpBranch] || { sewa: 5000000, listrik: 1500000, air: 300000, gaji: 15000000, telepon: 500000, transport: 1000000, csr: 500000 };
                const updateCurOp = (field: string, val: number) => {
                  setBranchOpExpenses(prev => ({
                    ...prev,
                    [targetOpBranch]: {
                      ...(prev[targetOpBranch] || { sewa: 5000000, listrik: 1500000, air: 300000, gaji: 15000000, telepon: 500000, transport: 1000000, csr: 500000 }),
                      [field]: val
                    }
                  }));
                };
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-gray-600 block mb-1">Sewa Gedung</label>
                      <input type="text" value={formatNumberWithDots(curOp.sewa)} onChange={e => updateCurOp('sewa', parseNumberFromDots(e.target.value))} className="w-full px-2.5 py-1.5 bg-white border rounded font-bold" />
                    </div>
                    <div>
                      <label className="font-semibold text-gray-600 block mb-1">Listrik</label>
                      <input type="text" value={formatNumberWithDots(curOp.listrik)} onChange={e => updateCurOp('listrik', parseNumberFromDots(e.target.value))} className="w-full px-2.5 py-1.5 bg-white border rounded font-bold" />
                    </div>
                    <div>
                      <label className="font-semibold text-gray-600 block mb-1">Air</label>
                      <input type="text" value={formatNumberWithDots(curOp.air)} onChange={e => updateCurOp('air', parseNumberFromDots(e.target.value))} className="w-full px-2.5 py-1.5 bg-white border rounded font-bold" />
                    </div>
                    <div>
                      <label className="font-semibold text-gray-600 block mb-1">Gaji Pokok</label>
                      <input type="text" value={formatNumberWithDots(curOp.gaji)} onChange={e => updateCurOp('gaji', parseNumberFromDots(e.target.value))} className="w-full px-2.5 py-1.5 bg-white border rounded font-bold" />
                    </div>
                    <div>
                      <label className="font-semibold text-gray-600 block mb-1">Telekomunikasi</label>
                      <input type="text" value={formatNumberWithDots(curOp.telepon)} onChange={e => updateCurOp('telepon', parseNumberFromDots(e.target.value))} className="w-full px-2.5 py-1.5 bg-white border rounded font-bold" />
                    </div>
                    <div>
                      <label className="font-semibold text-gray-600 block mb-1">Transport</label>
                      <input type="text" value={formatNumberWithDots(curOp.transport)} onChange={e => updateCurOp('transport', parseNumberFromDots(e.target.value))} className="w-full px-2.5 py-1.5 bg-white border rounded font-bold" />
                    </div>
                    <div>
                      <label className="font-semibold text-gray-600 block mb-1">CSR / Lainnya</label>
                      <input type="text" value={formatNumberWithDots(curOp.csr)} onChange={e => updateCurOp('csr', parseNumberFromDots(e.target.value))} className="w-full px-2.5 py-1.5 bg-white border rounded font-bold" />
                    </div>
                  </div>
                );
              })()}

              <div className="flex flex-wrap items-center justify-between text-xs text-gray-700 pt-2 border-t border-pink-200">
                <span>Laba Kotor: <b>Rp {Math.round(totalLabaKotor).toLocaleString('id-ID')}</b></span>
                <span>Total Biaya Operasional ({actualBranchFilter === 'ALL' ? 'Semua Cabang Konsolidasi' : actualBranchFilter}): <b className="text-red-600">Rp {Math.round(totalBiayaOperasional).toLocaleString('id-ID')}</b></span>
                <span className="text-[#ff3377] font-bold text-sm">Laba Bersih (Net Profit): Rp {Math.round(totalLabaBersih).toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Analytical Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-gradient-to-br from-[#ff6699] to-[#ff3377] text-white p-4 rounded-2xl shadow">
                <h5 className="text-xs font-medium opacity-90 mb-1 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5"/> Total Omset</h5>
                <h3 className="text-lg font-bold">Rp {totalOmset.toLocaleString('id-ID')}</h3>
              </div>
              <div className="bg-pink-50 text-[#ff3377] p-4 rounded-2xl border border-pink-100 shadow-xs">
                <h5 className="text-xs font-medium opacity-90 mb-1">Perkiraan Laba Bersih</h5>
                <h3 className="text-lg font-bold">Rp {Math.round(totalLabaBersih).toLocaleString('id-ID')}</h3>
              </div>
              <div className="bg-white text-gray-800 p-4 rounded-2xl border border-gray-200 shadow-xs">
                <h5 className="text-xs font-medium text-gray-500 mb-1">Pajak PPN (11%)</h5>
                <h3 className="text-lg font-bold text-gray-800">Rp {totalPajak.toLocaleString('id-ID')}</h3>
              </div>
              <div className="bg-white text-gray-800 p-4 rounded-2xl border border-gray-200 shadow-xs">
                <h5 className="text-xs font-medium text-gray-500 mb-1">Diskon Member</h5>
                <h3 className="text-lg font-bold text-gray-800">Rp {totalDiskon.toLocaleString('id-ID')}</h3>
              </div>
              <div className="bg-white text-gray-800 p-4 rounded-2xl border border-gray-200 shadow-xs">
                <h5 className="text-xs font-medium text-gray-500 mb-1">Metode Bayar (Cash / QRIS)</h5>
                <div className="text-xs font-semibold text-gray-700 mt-1">
                  Cash: Rp {cashTotal.toLocaleString('id-ID')}<br/>
                  QRIS: Rp {qrisTotal.toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {/* Monthly Sales Trend Chart Card */}
            <div className="bg-pink-50/30 p-5 rounded-2xl border border-pink-100 mb-6">
              <h5 className="text-[#ff3377] font-bold text-sm mb-3 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4" /> Tren Omset Bulanan (Rp)
              </h5>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(() => {
                      const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
                      const groups: { [key: string]: number } = {};

                      const now = new Date();
                      for (let i = 5; i >= 0; i--) {
                        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                        const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
                        groups[key] = 0;
                      }

                      filteredTransaksi.forEach(t => {
                        const d = new Date(t[0]);
                        if (!isNaN(d.getTime())) {
                          const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
                          if (groups[key] !== undefined) {
                            groups[key] += Number(t[5] || 0);
                          }
                        }
                      });

                      const keys = Object.keys(groups).sort((a, b) => {
                        const partsA = a.split(' ');
                        const partsB = b.split(' ');
                        const yearA = parseInt(partsA[1]);
                        const yearB = parseInt(partsB[1]);
                        if (yearA !== yearB) return yearA - yearB;
                        return monthNames.indexOf(partsA[0]) - monthNames.indexOf(partsB[0]);
                      });

                      return keys.map(k => ({
                        Bulan: k,
                        Omset: groups[k]
                      }));
                    })()}
                    margin={{ top: 10, right: 10, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0e0e5" />
                    <XAxis 
                      dataKey="Bulan" 
                      tick={{ fill: currentTheme.primary, fontSize: 11, fontWeight: 'bold' }} 
                      axisLine={{ stroke: currentTheme.borderTint }} 
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#666', fontSize: 10 }} 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={(value) => `Rp ${value >= 1000000 ? (value / 1000000).toFixed(1) + 'M' : value.toLocaleString('id-ID')}`}
                    />
                    <Tooltip 
                      formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Omset']}
                      contentStyle={{ backgroundColor: '#fff', border: `1px solid ${currentTheme.borderTint}`, borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Bar 
                      dataKey="Omset" 
                      fill={currentTheme.secondary} 
                      radius={[6, 6, 0, 0]} 
                      maxBarSize={50} 
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <h5 className="text-[#ff3377] font-bold text-base mb-3">Histori Transaksi Analitik ({filteredTransaksi.length} Transaksi)</h5>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm text-left">
                <thead className="bg-pink-50 text-gray-700 text-xs">
                  <tr>
                    <th className="p-3">Waktu</th>
                    <th className="p-3">Nota</th>
                    <th className="p-3">Kasir</th>
                    <th className="p-3">Cabang</th>
                    <th className="p-3">Subtotal</th>
                    <th className="p-3">Diskon</th>
                    <th className="p-3">Pajak</th>
                    <th className="p-3">Total Tagihan</th>
                    <th className="p-3">Metode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransaksi.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-6 text-gray-400">Belum ada transaksi tercatat untuk filter ini.</td></tr>
                  ) : (
                    filteredTransaksi.map((t, idx) => (
                      <tr key={idx} className="hover:bg-pink-50/20">
                        <td className="p-3 text-xs text-gray-500">{new Date(t[0]).toLocaleString()}</td>
                        <td className="p-3 font-mono font-medium text-xs">{t[1]}</td>
                        <td className="p-3">{t[3]}</td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-pink-100 text-[#ff3377] text-xs rounded font-medium">{t[4]}</span></td>
                        <td className="p-3">Rp {Number(t[8] || t[5] || 0).toLocaleString('id-ID')}</td>
                        <td className="p-3 text-green-600">- Rp {Number(t[9] || 0).toLocaleString('id-ID')}</td>
                        <td className="p-3">+ Rp {Number(t[10] || 0).toLocaleString('id-ID')}</td>
                        <td className="p-3 font-bold text-[#ff3377]">Rp {Number(t[5] || 0).toLocaleString('id-ID')}</td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded font-medium">{t[6]}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB AUDIT STOK OPNAME */}
        {activeTab === 'audit' && (user.role === 'Owner' || user.role === 'Admin Cabang') && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-[#ff3377] font-bold text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" /> Laporan Audit Stok Opname ({user.cabang})
                </h4>
                <p className="text-xs text-gray-500">Riwayat pemeriksaan fisik dan audit selisih stok barang.</p>
              </div>
              <button 
                onClick={downloadExcelOpname}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-medium shadow flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" /> Download Excel Workbook (.csv) 📊
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm text-left">
                <thead className="bg-pink-50 text-gray-700 text-xs">
                  <tr>
                    <th className="p-3">Waktu Audit</th>
                    <th className="p-3">Cabang</th>
                    <th className="p-3">Kode Barang</th>
                    <th className="p-3">Nama Produk</th>
                    <th className="p-3 text-center">Stok Sistem</th>
                    <th className="p-3 text-center">Stok Fisik</th>
                    <th className="p-3 text-center">Selisih</th>
                    <th className="p-3">Keterangan / Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOpname.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-6 text-gray-400">Belum ada data audit stok opname.</td></tr>
                  ) : (
                    filteredOpname.map((op, idx) => (
                      <tr key={idx} className="hover:bg-pink-50/20">
                        <td className="p-3 text-xs text-gray-500">{new Date(op.timestamp).toLocaleString()}</td>
                        <td className="p-3 font-medium">{op.cabang}</td>
                        <td className="p-3 font-mono text-xs">{op.kode}</td>
                        <td className="p-3 font-semibold">{op.nama}</td>
                        <td className="p-3 text-center">{op.sistem}</td>
                        <td className="p-3 text-center">{op.fisik}</td>
                        <td className={`p-3 text-center font-bold ${op.selisih < 0 ? 'text-red-600' : op.selisih > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                          {op.selisih > 0 ? `+${op.selisih}` : op.selisih}
                        </td>
                        <td className="p-3 text-xs text-gray-600">{op.ket || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB KELOLA CABANG */}
        {activeTab === 'cabang' && user.role === 'Owner' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100">
            <h4 className="text-[#ff3377] font-bold text-lg mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" /> Daftar & Kelola Cabang Butik
            </h4>

            <form onSubmit={simpanCabang} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-pink-50/40 p-4 rounded-xl border border-pink-100">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Kode Cabang</label>
                <input type="text" value={cId} onChange={e => setCId(e.target.value)} placeholder="Contoh: CBR04" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Nama Cabang</label>
                <input type="text" value={cNama} onChange={e => setCNama(e.target.value)} placeholder="Contoh: Cabang Surabaya" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Alamat Cabang</label>
                <input type="text" value={cAlamat} onChange={e => setCAlamat(e.target.value)} placeholder="Jl. Tunjungan No. 10" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="md:col-span-3 flex justify-end gap-2">
                {editingBranchId && (
                  <button type="button" onClick={() => { setEditingBranchId(null); setCId(''); setCNama(''); setCAlamat(''); }} className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
                    Batal Edit
                  </button>
                )}
                <button type="submit" className="bg-[#ff6699] hover:bg-[#ff3377] text-white px-6 py-2.5 rounded-lg text-sm font-medium shadow transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> {editingBranchId ? 'Perbarui Cabang' : 'Daftarkan Cabang Baru'} 🏢
                </button>
              </div>
            </form>

            <h5 className="text-[#ff3377] font-bold text-base mb-3">Daftar Cabang Aktif</h5>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm text-left">
                <thead className="bg-pink-50 text-gray-700 text-xs">
                  <tr>
                    <th className="p-3">ID Cabang</th>
                    <th className="p-3">Nama Cabang</th>
                    <th className="p-3">Alamat</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cabangList.map((c, idx) => (
                    <tr key={idx} className="hover:bg-pink-50/20">
                      <td className="p-3 font-mono font-medium">{c[0]}</td>
                      <td className="p-3 font-bold text-[#ff3377]">{c[1]}</td>
                      <td className="p-3 text-gray-600">{c[2]}</td>
                      <td className="p-3 text-center flex items-center justify-center gap-2">
                        <button onClick={() => handleEditBranch(c)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded text-xs font-medium flex items-center gap-1">
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={() => handleHapusBranch(c[0])} className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1 rounded text-xs font-medium flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB KELOLA STAFF & AKSES */}
        {activeTab === 'staff' && user.role === 'Owner' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100">
            <h4 className="text-[#ff3377] font-bold text-lg mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" /> Kelola Akun Staff, Kasir & Hak Akses Berjenjang
            </h4>
            <p className="text-xs text-gray-500 mb-6">Atur username (email), password, peran (Owner / Admin Cabang / Kasir), dan penugasan cabang masing-masing staff.</p>

            <form onSubmit={handleSimpanStaff} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-pink-50/40 p-4 rounded-xl border border-pink-100">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Email / Username Login</label>
                <input type="email" value={staffEmail} onChange={e => setStaffEmail(e.target.value)} placeholder="staff@usaha.com" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Kata Sandi</label>
                <input type="text" value={staffSandi} onChange={e => setStaffSandi(e.target.value)} placeholder="123456" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Nama Lengkap Staff</label>
                <input type="text" value={staffNama} onChange={e => setStaffNama(e.target.value)} placeholder="Nama Staff" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Hak Akses / Peran</label>
                <select value={staffRole} onChange={e => setStaffRole(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
                  <option value="Kasir">Kasir</option>
                  <option value="Admin Cabang">Admin Cabang</option>
                  <option value="Owner">Owner (Superadmin)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Penugasan Cabang</label>
                <select value={staffCabang} onChange={e => setStaffCabang(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
                  <option value="Semua Cabang">Semua Cabang (Owner)</option>
                  {cabangList.map((c, i) => (
                    <option key={i} value={c[1]}>{c[1]}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3 flex justify-end gap-2">
                {editingStaffEmail && (
                  <button type="button" onClick={() => { setEditingStaffEmail(null); setStaffEmail(''); setStaffSandi(''); setStaffNama(''); }} className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
                    Batal Edit
                  </button>
                )}
                <button type="submit" className="bg-[#ff6699] hover:bg-[#ff3377] text-white px-6 py-2.5 rounded-lg text-sm font-medium shadow transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> {editingStaffEmail ? 'Perbarui Akun Staff' : 'Tambah Akun Staff Baru'} 👤
                </button>
              </div>
            </form>

            <h5 className="text-[#ff3377] font-bold text-base mb-3">Daftar Akun Staff Terdaftar</h5>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm text-left">
                <thead className="bg-pink-50 text-gray-700 text-xs">
                  <tr>
                    <th className="p-3">Nama Staff</th>
                    <th className="p-3">Email / Username</th>
                    <th className="p-3">Sandi</th>
                    <th className="p-3">Peran / Hak Akses</th>
                    <th className="p-3">Cabang Tugas</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usersList.map((u, idx) => (
                    <tr key={idx} className="hover:bg-pink-50/20">
                      <td className="p-3 font-semibold text-gray-800">{u.nama}</td>
                      <td className="p-3 font-mono text-xs text-gray-600">{u.email}</td>
                      <td className="p-3 font-mono text-xs">••••••</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${u.role === 'Owner' ? 'bg-purple-100 text-purple-700' : u.role === 'Admin Cabang' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-[#ff3377]'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-xs font-medium">{u.cabang}</td>
                      <td className="p-3 text-center flex items-center justify-center gap-2">
                        <button onClick={() => handleEditStaff(u)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded text-xs font-medium flex items-center gap-1">
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        {u.email !== 'owner@usaha.com' && (
                          <button onClick={() => handleHapusStaff(u.email)} className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1 rounded text-xs font-medium flex items-center gap-1">
                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB TRANSFER ANTAR CABANG */}
        {activeTab === 'transfer' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-pink-100">
            <h3 className="text-xl font-bold text-[#ff3377] mb-2 flex items-center gap-2">
              <ArrowRightLeft className="w-6 h-6" /> Mutasi & Transfer Barang Antar Cabang
            </h3>
            <p className="text-sm text-gray-500 mb-6">Ajukan transfer stok dari cabang Anda ke cabang lain. Membutuhkan persetujuan (Approval) dari Owner / Pusat agar stok otomatis berpindah.</p>

            {(user.role === 'Owner' || user.role === 'Admin Cabang' || user.role === 'Kasir') && (
              <form onSubmit={buatTransfer} className="bg-pink-50/50 p-5 rounded-xl border border-pink-200 mb-8 space-y-4">
                <h4 className="font-bold text-gray-800 text-sm">Form Pengajuan Transfer Stok Baru</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Dari Cabang (Asal)</label>
                    <select 
                      value={trfDariCabang} 
                      onChange={e => {
                        setTrfDariCabang(e.target.value);
                        setTrfKode(''); // reset product when source changes
                      }}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                      required
                    >
                      <option value="">-- Pilih Cabang Asal --</option>
                      {cabangList.map((c, i) => (
                        <option key={i} value={c[1]}>{c[1]}</option>
                      ))}
                      <option value="Pusat">Pusat</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Ke Cabang (Tujuan)</label>
                    <select 
                      value={trfKeCabang} 
                      onChange={e => setTrfKeCabang(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                      required
                    >
                      <option value="">-- Pilih Cabang Tujuan --</option>
                      {cabangList.map((c, i) => (
                        c[1] !== trfDariCabang && <option key={i} value={c[1]}>{c[1]}</option>
                      ))}
                      {trfDariCabang !== 'Pusat' && <option value="Pusat">Pusat</option>}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Pilih Produk</label>
                    <select 
                      value={trfKode} 
                      onChange={e => setTrfKode(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                      required
                    >
                      <option value="">-- Pilih Barang & Stok --</option>
                      {barangList
                        .filter(b => {
                          const normalizedDari = trfDariCabang === 'Pusat' ? 'Cabang Pusat' : trfDariCabang;
                          return b[8] === normalizedDari || (!b[8] && normalizedDari === 'Cabang Pusat');
                        })
                        .map((b, i) => (
                          <option key={i} value={b[1]}>
                            {b[1]} - {b[2]} ({b[8] || 'Pusat'} - Stok: {b[6]})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Jumlah (Qty)</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={trfQty} 
                      onChange={e => setTrfQty(e.target.value)} 
                      placeholder="Contoh: 5" 
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                      required 
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Catatan / Alasan Transfer</label>
                    <input 
                      type="text" 
                      value={trfCatatan} 
                      onChange={e => setTrfCatatan(e.target.value)} 
                      placeholder="Contoh: Restock pameran weekend / permintaan cabang..." 
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm" 
                    />
                  </div>
                  <div className="md:col-span-1 flex items-end">
                    <button type="submit" className="w-full bg-[#ff6699] hover:bg-[#ff3377] text-white font-medium py-2 rounded-lg text-sm shadow transition-colors flex items-center justify-center gap-1.5">
                      <Plus className="w-4 h-4" /> Ajukan Transfer
                    </button>
                  </div>
                </div>
              </form>
            )}

            <h4 className="font-bold text-gray-800 text-sm mb-3">Daftar Riwayat & Approval Transfer Antar Cabang</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-pink-50 text-gray-700 text-xs uppercase font-semibold">
                    <th className="p-3">ID Transfer</th>
                    <th className="p-3">Waktu</th>
                    <th className="p-3">Dari &rarr; Tujuan Cabang</th>
                    <th className="p-3">Produk</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3">Pengaju</th>
                    <th className="p-3">Catatan</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Aksi (Pusat / Owner)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transferList.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-6 text-gray-400">Belum ada data transfer antar cabang.</td></tr>
                  ) : (
                    transferList.map((t, idx) => (
                      <tr key={idx} className="hover:bg-pink-50/20">
                        <td className="p-3 font-bold text-[#ff3377]">{t.id}</td>
                        <td className="p-3 text-xs text-gray-500">{new Date(t.tanggal).toLocaleString('id-ID')}</td>
                        <td className="p-3 font-medium">
                          <span className="text-gray-700">{t.dariCabang}</span>
                          <span className="mx-2 text-[#ff3377]">➔</span>
                          <span className="text-gray-900 font-semibold">{t.keCabang}</span>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-gray-800">{t.nama}</div>
                          <div className="text-[11px] text-gray-500">Kode: {t.kode}</div>
                        </td>
                        <td className="p-3 text-center font-bold text-base">{t.qty}</td>
                        <td className="p-3 text-xs text-gray-600">{t.pengaju}</td>
                        <td className="p-3 text-xs text-gray-500">{t.catatan || '-'}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block ${
                            t.status === 'Approved' ? 'bg-green-100 text-green-700' :
                            t.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {t.status === 'Approved' ? '✓ Disetujui' : t.status === 'Rejected' ? '✕ Ditolak' : '⏳ Menunggu Approval'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {t.status === 'Pending' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button onClick={() => prosesTransfer(t.id, 'Approved')} className="bg-green-500 hover:bg-green-600 text-white px-2.5 py-1 rounded text-xs font-medium shadow-xs">
                                Approve ✓
                              </button>
                              <button onClick={() => prosesTransfer(t.id, 'Rejected')} className="bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 rounded text-xs font-medium shadow-xs">
                                Tolak ✕
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Selesai</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB PENGATURAN TOKO & REKENING OWNER */}
        {activeTab === 'settings' && user.role === 'Owner' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 max-w-4xl mx-auto">
            <h4 className="text-[#ff3377] font-bold text-lg mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" /> Pengaturan Toko & Daftar Rekening Owner
            </h4>

            <form onSubmit={handleUpdateSettings} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-pink-50/40 p-4 rounded-xl border border-pink-100">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Nama Toko / Butik</label>
                  <input type="text" value={setNamaToko} onChange={e => setSetNamaToko(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Alamat Utama (Struk & POS)</label>
                  <input type="text" value={setAlamat} onChange={e => setSetAlamat(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Alamat Khusus Surat Purchase Order (PO)</label>
                  <input type="text" value={setAlamatPo} onChange={e => setSetAlamatPo(e.target.value)} placeholder="Tulis alamat kantor pusat / buyer untuk dokumen PO..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                  <span className="text-[10px] text-gray-400">Jika dikosongkan, dokumen PO akan otomatis menggunakan Alamat Utama di atas.</span>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-700 block mb-2">Corporate Color Theme (Warna Aplikasi & Navigator)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {THEMES.map((th) => (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => setSetTheme(th.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          setTheme === th.id
                            ? 'border-gray-800 bg-gray-50 ring-2 ring-gray-400'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className="w-3.5 h-3.5 rounded-full inline-block border border-black/10 shadow-xs"
                            style={{ backgroundColor: th.primary }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full inline-block border border-black/10 shadow-xs -ml-2"
                            style={{ backgroundColor: th.secondary }}
                          />
                        </div>
                        <span className="text-[11px] font-bold block text-gray-800 leading-tight">
                          {th.nama.split(" ")[1] || th.nama}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">URL Logo Toko (Perbesar Tampilan)</label>
                  <input type="text" value={setLogoUrl} onChange={e => setSetLogoUrl(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Pajak PPN (%)</label>
                  <input type="number" value={setPajak} onChange={e => setSetPajak(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Diskon Member (%)</label>
                  <input type="number" value={setDiskonMember} onChange={e => setSetDiskonMember(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Footer Struk Belanja</label>
                  <input type="text" value={setFooter} onChange={e => setSetFooter(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>

              {/* Daftar Rekening Owner untuk QRIS */}
              <div className="bg-pink-50/40 p-4 rounded-xl border border-pink-100">
                <h5 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#ff3377]" /> Daftar Rekening & QRIS Owner
                </h5>
                <p className="text-xs text-gray-500 mb-4">Rekening bank dan QRIS ini akan otomatis terhubung saat kasir memilih pembayaran QRIS di POS.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <input type="text" value={newBank} onChange={e => setNewBank(e.target.value)} placeholder="Nama Bank (BCA/Mandiri)" className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                  <input type="text" value={newNoRek} onChange={e => setNewNoRek(e.target.value)} placeholder="Nomor Rekening" className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                  <input type="text" value={newAtasNama} onChange={e => setNewAtasNama(e.target.value)} placeholder="Atas Nama Pemilik" className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                </div>
                <button type="button" onClick={tambahRekening} className="mb-4 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Tambah Rekening Owner
                </button>

                <div className="space-y-2">
                  {rekeningList.map((rek, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center text-xs">
                      <div>
                        <b>{rek.bank}</b> - {rek.nomor} (a.n {rek.atasNama})
                      </div>
                      <button type="button" onClick={() => hapusRekening(rek.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full bg-[#ff6699] hover:bg-[#ff3377] text-white py-3 rounded-xl font-medium shadow transition-colors">
                Simpan Semua Pengaturan Toko & Rekening 💾
              </button>
            </form>
          </div>
        )}

        {/* TAB PANDUAN */}
        {activeTab === 'panduan' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 max-w-3xl mx-auto space-y-4">
            <h4 className="text-[#ff3377] font-bold text-lg flex items-center gap-2">
              <HelpCircle className="w-5 h-5" /> Panduan Penggunaan Sistem Pinky POS
            </h4>
            <div className="text-sm text-gray-600 space-y-3 leading-relaxed">
              <p><b>1. Hak Akses Berjenjang (Role):</b><br/>
              - <b>Owner (Superadmin):</b> Memiliki akses penuh melihat laporan konsolidasi seluruh cabang, mengatur rekening owner, menambah/mengedit staff & cabang, serta pengaturan toko.<br/>
              - <b>Admin Cabang:</b> Mengelola stok barang, opname, dan laporan keuangan khusus cabang tempatnya bertugas.<br/>
              - <b>Kasir:</b> Melakukan transaksi POS, melihat katalog produk cabang, dan mencetak struk belanja. Laporan keuangan cabang bersifat rahasia dan tidak dapat dibaca oleh cabang lain.</p>

              <p><b>2. Pembayaran & QRIS Terhubung Rekening Owner:</b><br/>
              Saat melakukan transaksi di Kasir POS, kasir dapat memilih pembayaran Cash (dengan perhitungan kembalian otomatis & tombol Uang Pas) atau QRIS yang otomatis terhubung ke daftar rekening bank owner yang diatur di menu Pengaturan.</p>

              <p><b>3. Audit Stok Opname & Export Excel:</b><br/>
              Admin Cabang atau Owner dapat melakukan opname fisik stok dan mengunduh laporan audit selisih stok ke dalam format Excel Workbook (.csv) dengan satu klik.</p>
            </div>
          </div>
        )}

        {/* TAB ERP EXECUTIVE COCKPIT */}
        {activeTab === 'erp' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-pink-100">
              <h3 className="text-xl font-bold text-[#ff3377] mb-2 flex items-center gap-2">
                <Boxes className="w-6 h-6" /> ERP Executive Cockpit & Pusat Integrasi Bisnis
              </h3>
              <p className="text-sm text-gray-500 mb-6">Enterprise Resource Planning (ERP) menyatukan keuangan, rantai pasokan, SDM, manufaktur, dan penjualan ke dalam satu platform terpusat standar industri.</p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-pink-50 to-white p-5 rounded-xl border border-pink-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Valuasi Persediaan</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                      Rp {barangList.reduce((acc, b) => acc + (Number(b[6]) * Number(b[3] || 50000)), 0).toLocaleString('id-ID')}
                    </div>
                    <div className="text-xs text-pink-600 mt-1 font-medium">Seluruh cabang terintegrasi</div>
                  </div>
                  <button 
                    onClick={() => setShowValuasiModal(true)}
                    className="mt-3 text-left text-xs text-[#ff3377] hover:text-[#ff1a5c] font-bold flex items-center gap-1 hover:underline"
                  >
                    Rincian & Penjelasan Angka 🔍
                  </button>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-white p-5 rounded-xl border border-purple-200 shadow-xs">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Pendapatan Penjualan</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">
                    Rp {transaksiList.reduce((acc, t) => acc + Number(t[5]), 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-purple-600 mt-1 font-medium">{transaksiList.length} Transaksi POS</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl border border-blue-200 shadow-xs">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Purchase Orders (PO) Aktif</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">
                    {purchaseOrdersList.filter(p => p.status === 'Pending').length} Pending
                  </div>
                  <div className="text-xs text-blue-600 mt-1 font-medium">{purchaseOrdersList.length} Total PO Supplier</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-white p-5 rounded-xl border border-green-200 shadow-xs">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Work Orders Manufaktur</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">
                    {productionList.length} Batch Selesai
                  </div>
                  <div className="text-xs text-green-600 mt-1 font-medium">BOM Otomatis Terhubung</div>
                </div>
              </div>

              <div className="bg-pink-50/50 p-6 rounded-2xl border border-pink-200">
                <h4 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                  <span>🤖</span> AI ERP Smart Business Advisor & Supply Chain Recommendations
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-white p-4 rounded-xl border border-pink-200 shadow-xs space-y-2">
                    <span className="font-bold text-[#ff3377] block">Stok Kritis Terdeteksi</span>
                    <p className="text-gray-600">Beberapa cabang memiliki stok di bawah 10 unit. Gunakan modul Rantai Pasok (PO) untuk restock otomatis dari supplier.</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-pink-200 shadow-xs space-y-2">
                    <span className="font-bold text-purple-600 block">Jurnal Keuangan Real-Time</span>
                    <p className="text-gray-600">Setiap transaksi POS otomatis mencatat debet/kredit ke Buku Besar tanpa entri manual.</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-pink-200 shadow-xs space-y-2">
                    <span className="font-bold text-blue-600 block">Integrasi Cabang & Pajak</span>
                    <p className="text-gray-600">Pajak PPN 11% dan perhitungan komisi staff dihitung instan pada akhir shift atau periode.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB BUKU BESAR AKUNTANSI (GENERAL LEDGER) */}
        {activeTab === 'ledger' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-pink-100">
            <h3 className="text-xl font-bold text-[#ff3377] mb-2 flex items-center gap-2">
              <BookOpen className="w-6 h-6" /> Buku Besar Akuntansi (General Ledger - Double-Entry)
            </h3>
            <p className="text-sm text-gray-500 mb-6">Pencatatan otomatis seluruh aliran finansial (Pendapatan, Piutang, Hutang Usaha, Beban Gaji, Persediaan) dari transaksi POS dan PO.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-pink-50 text-gray-700 text-xs uppercase font-semibold">
                    <th className="p-3">ID Jurnal</th>
                    <th className="p-3">Waktu</th>
                    <th className="p-3">Nama Akun Akuntansi</th>
                    <th className="p-3">Cabang</th>
                    <th className="p-3 text-center">Posisi</th>
                    <th className="p-3 text-right">Jumlah (Rp)</th>
                    <th className="p-3">Referensi Dokumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ledgerList.map((l, i) => (
                    <tr key={i} className="hover:bg-pink-50/20">
                      <td className="p-3 font-bold text-[#ff3377]">{l.id}</td>
                      <td className="p-3 text-xs text-gray-500">{new Date(l.tanggal).toLocaleString('id-ID')}</td>
                      <td className="p-3 font-semibold text-gray-800">{l.akun}</td>
                      <td className="p-3 text-xs text-gray-600">{l.cabang}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${l.tipe === 'Debet' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                          {l.tipe}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-gray-900">Rp {Number(l.jumlah).toLocaleString()}</td>
                      <td className="p-3 text-xs font-mono text-gray-500">{l.referensi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB RANTAI PASOK & PURCHASE ORDERS (PO) */}
        {activeTab === 'po' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-pink-100">
            <h3 className="text-xl font-bold text-[#ff3377] mb-2 flex items-center gap-2">
              <Truck className="w-6 h-6" /> Manajemen Rantai Pasok & Purchase Order (PO Supplier)
            </h3>
            <p className="text-sm text-gray-500 mb-6">Pesan stok barang dari supplier eksternal. Ketika status diubah menjadi "Diterima (Received)", stok gudang cabang dan Buku Besar akan ter-update otomatis.</p>

            {(user.role === 'Owner' || user.role === 'Admin Cabang') && (
              <form onSubmit={buatPO} className="bg-pink-50/50 p-5 rounded-xl border border-pink-200 mb-8 space-y-4">
                <h4 className="font-bold text-gray-800 text-sm">Buat Purchase Order (PO) Baru ke Supplier</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Nama Supplier</label>
                    <input 
                      type="text" 
                      value={poSupplier} 
                      onChange={e => setPoSupplier(e.target.value)} 
                      placeholder="Contoh: PT Tekstil Jaya" 
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Cabang Tujuan</label>
                    <select 
                      value={poCabang} 
                      onChange={e => setPoCabang(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                    >
                      {cabangList.map((c, i) => <option key={i} value={c[1]}>{c[1]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Pilih Produk</label>
                    <select 
                      value={poKodeBarang} 
                      onChange={e => setPoKodeBarang(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                      required
                    >
                      <option value="">-- Pilih Barang --</option>
                      {barangList.filter(b => b[8] === (user.role === 'Owner' ? 'Cabang Pusat' : user.cabang)).map((b, i) => (
                        <option key={i} value={b[1]}>{b[1]} - {b[2]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Jumlah (Qty)</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={poQty} 
                      onChange={e => setPoQty(e.target.value)} 
                      placeholder="50" 
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Harga Beli Satuan (Rp)</label>
                    <input 
                      type="number" 
                      value={poHargaBeli} 
                      onChange={e => setPoHargaBeli(e.target.value)} 
                      placeholder="70000" 
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm" 
                    />
                  </div>
                  <div className="md:col-span-5 flex justify-end">
                    <button type="submit" className="bg-[#ff6699] hover:bg-[#ff3377] text-white px-6 py-2 rounded-lg font-medium text-sm shadow">
                      + Ajukan Purchase Order
                    </button>
                  </div>
                </div>
              </form>
            )}

            <h4 className="font-bold text-gray-800 text-sm mb-3">Daftar Purchase Order Supplier</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-pink-50 text-gray-700 text-xs uppercase font-semibold">
                    <th className="p-3">ID PO</th>
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">Supplier</th>
                    <th className="p-3">Cabang Tujuan</th>
                    <th className="p-3">Rincian Barang & Qty</th>
                    <th className="p-3 text-right">Total Tagihan</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Dokumen</th>
                    <th className="p-3 text-center">Aksi / Penerimaan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {purchaseOrdersList.map((po, i) => (
                    <tr key={i} className="hover:bg-pink-50/20">
                      <td className="p-3 font-bold text-[#ff3377]">{po.id}</td>
                      <td className="p-3 text-xs text-gray-500">{new Date(po.tanggal).toLocaleDateString()}</td>
                      <td className="p-3 font-semibold text-gray-800">{po.supplier}</td>
                      <td className="p-3 text-xs text-gray-600">{po.cabang}</td>
                      <td className="p-3 text-xs">
                        {po.items.map((it: any, idx: number) => (
                          <div key={idx}><b>{it.nama}</b> ({it.qty} pcs @ Rp {(it.hargaBeli || 0).toLocaleString()})</div>
                        ))}
                      </td>
                      <td className="p-3 text-right font-bold text-gray-900">Rp {(po.total || 0).toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block ${
                          po.status === 'Received' ? 'bg-green-100 text-green-700' :
                          po.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {po.status === 'Received' ? '✓ Diterima' : po.status === 'Cancelled' ? '✕ Dibatalkan' : '⏳ Pending'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => setSelectedPoForSuratJalan(po)}
                          className="bg-pink-100 hover:bg-pink-200 text-[#ff3377] px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs inline-flex items-center gap-1 transition-colors"
                        >
                          📄 PO / Surat Pesanan
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        {po.status === 'Pending' && (user.role === 'Owner' || user.role === 'Admin Cabang') ? (
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => prosesPO(po.id, 'Received')} className="bg-green-500 hover:bg-green-600 text-white px-2.5 py-1 rounded text-xs font-medium shadow-xs">
                              Terima Barang ✓
                            </button>
                            <button onClick={() => prosesPO(po.id, 'Cancelled')} className="bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 rounded text-xs font-medium shadow-xs">
                              Batalkan
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Selesai</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB SDM & PAYROLL KOMISI */}
        {activeTab === 'payroll' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-pink-100 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-[#ff3377] mb-2 flex items-center gap-2">
                <Wallet className="w-6 h-6" /> SDM, Penggajian & Komisi Penjualan (Payroll)
              </h3>
              <p className="text-sm text-gray-500">Masing-masing karyawan menerima gaji pokok dan komisi penjualan (% dikali total penjualan). Nilai persentase komisi bervariatif sesuai posisi jabatan dan dapat di-adjust oleh Owner.</p>
            </div>

            {user.role === 'Owner' && (
              <div className="bg-pink-50/60 p-5 rounded-xl border border-pink-200 space-y-4">
                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <span>⚙️</span> Pengaturan Prosentase Komisi Jabatan & Staff (Adjustable by Owner)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {usersList.filter(u => u.role !== 'Owner').map((u, idx) => {
                    const currentPct = commissionMap[u.email] !== undefined ? commissionMap[u.email] : (u.komisiPersen !== undefined ? u.komisiPersen : 5);
                    return (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-pink-200 flex items-center justify-between gap-2 shadow-xs">
                        <div>
                          <div className="font-semibold text-xs text-gray-800">{u.nama}</div>
                          <div className="text-[10px] text-pink-600 font-medium">{u.role} ({u.cabang})</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <input 
                            type="number" 
                            min="0" 
                            max="100" 
                            value={currentPct}
                            onChange={e => setCommissionMap({ ...commissionMap, [u.email]: Number(e.target.value) })}
                            className="w-16 px-2 py-1 text-xs border rounded text-center font-bold"
                          />
                          <span className="text-xs font-bold text-gray-600">%</span>
                          <button 
                            onClick={() => handleUpdateCommission(u.email)}
                            className="bg-[#ff6699] hover:bg-[#ff3377] text-white px-2.5 py-1 rounded text-xs font-medium shadow-xs"
                          >
                            Simpan
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {user.role === 'Owner' && (
              <form onSubmit={buatPayroll} className="bg-pink-50/50 p-5 rounded-xl border border-pink-200 space-y-4">
                <h4 className="font-bold text-gray-800 text-sm">Proses Slip Gaji & Komisi Staff</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Periode Gaji</label>
                    <input 
                      type="text" 
                      value={payPeriode} 
                      onChange={e => setPayPeriode(e.target.value)} 
                      placeholder="Juli 2026" 
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Nama Pegawai</label>
                    <select 
                      value={payPegawai} 
                      onChange={e => handleSelectPayrollPegawai(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                      required
                    >
                      <option value="">-- Pilih Pegawai --</option>
                      {usersList.map((u, i) => (
                        <option key={i} value={`${u.nama} (${u.role})`}>
                          {u.nama} - {u.role} ({u.cabang}) [{u.komisiPersen !== undefined ? u.komisiPersen : 5}% Komisi]
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Gaji Pokok (Rp)</label>
                    <input 
                      type="number" 
                      value={payGaji} 
                      onChange={e => setPayGaji(e.target.value)} 
                      placeholder="3500000" 
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Komisi Penjualan (Rp)</label>
                    <input 
                      type="number" 
                      value={payKomisi} 
                      onChange={e => setPayKomisi(e.target.value)} 
                      placeholder="350000" 
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm" 
                    />
                    <span className="text-[10px] text-pink-600 mt-0.5 block">Otomatis dihitung dari % x Total Penjualan Cabang</span>
                  </div>
                  <div className="flex items-end">
                    <button type="submit" className="w-full bg-[#ff6699] hover:bg-[#ff3377] text-white py-2 rounded-lg font-medium text-sm shadow">
                      + Bayar & Catat
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div>
              <h4 className="font-bold text-gray-800 text-sm mb-3">Riwayat Penggajian & Komisi Staff</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-pink-50 text-gray-700 text-xs uppercase font-semibold">
                      <th className="p-3">ID Pay</th>
                      <th className="p-3">Periode</th>
                      <th className="p-3">Pegawai</th>
                      <th className="p-3">Cabang</th>
                      <th className="p-3 text-right">Gaji Pokok</th>
                      <th className="p-3 text-right">Komisi</th>
                      <th className="p-3 text-right">Total Diterima</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payrollList.map((p, i) => (
                      <tr key={i} className="hover:bg-pink-50/20">
                        <td className="p-3 font-bold text-[#ff3377]">{p.id}</td>
                        <td className="p-3 text-xs text-gray-600 font-medium">{p.periode}</td>
                        <td className="p-3 font-semibold text-gray-800">{p.pegawai}</td>
                        <td className="p-3 text-xs text-gray-500">{p.cabang}</td>
                        <td className="p-3 text-right">Rp {(p.gajiPokok || 0).toLocaleString()}</td>
                        <td className="p-3 text-right text-pink-600">Rp {(p.komisi || 0).toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-gray-900">Rp {(p.totalTerima || 0).toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                            {p.status} ✓
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB MANUFAKTUR & BOM (PRODUCTION) */}
        {activeTab === 'production' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-pink-100">
            <h3 className="text-xl font-bold text-[#ff3377] mb-2 flex items-center gap-2">
              <Factory className="w-6 h-6" /> Manufaktur, Perakitan & Bill of Materials (BOM)
            </h3>
            <p className="text-sm text-gray-500 mb-6">Kelola perintah kerja produksi (Work Order) untuk mengubah bahan baku menjadi produk jadi siap jual di cabang.</p>

            {(user.role === 'Owner' || user.role === 'Admin Cabang') && (
              <form onSubmit={buatProduksi} className="bg-pink-50/50 p-5 rounded-xl border border-pink-200 mb-8 space-y-4">
                <h4 className="font-bold text-gray-800 text-sm">Buat Work Order (WO) Manufaktur Baru</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Nama Produk Jadi</label>
                    <input 
                      type="text" 
                      value={prdProduk} 
                      onChange={e => setPrdProduk(e.target.value)} 
                      placeholder="Contoh: Blouse Pink Pastel" 
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Jumlah Produksi (Qty)</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={prdQty} 
                      onChange={e => setPrdQty(e.target.value)} 
                      placeholder="30" 
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Bahan Baku (BOM)</label>
                    <input 
                      type="text" 
                      value={prdBahan} 
                      onChange={e => setPrdBahan(e.target.value)} 
                      placeholder="Kain Katun Rayon" 
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm" 
                    />
                  </div>
                  <div className="flex items-end">
                    <button type="submit" className="w-full bg-[#ff6699] hover:bg-[#ff3377] text-white py-2 rounded-lg font-medium text-sm shadow">
                      + Selesaikan Produksi
                    </button>
                  </div>
                </div>
              </form>
            )}

            <h4 className="font-bold text-gray-800 text-sm mb-3">Daftar Work Order Produksi Selesai</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-pink-50 text-gray-700 text-xs uppercase font-semibold">
                    <th className="p-3">ID WO</th>
                    <th className="p-3">Waktu Selesai</th>
                    <th className="p-3">Produk Jadi</th>
                    <th className="p-3 text-center">Qty Hasil</th>
                    <th className="p-3">Bahan Baku (BOM)</th>
                    <th className="p-3">Supervisor / PIC</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productionList.map((pr, i) => (
                    <tr key={i} className="hover:bg-pink-50/20">
                      <td className="p-3 font-bold text-[#ff3377]">{pr.id}</td>
                      <td className="p-3 text-xs text-gray-500">{new Date(pr.tanggal).toLocaleString()}</td>
                      <td className="p-3 font-semibold text-gray-800">{pr.produk}</td>
                      <td className="p-3 text-center font-bold text-base text-pink-600">{pr.qtyProduksi} pcs</td>
                      <td className="p-3 text-xs text-gray-600">{pr.bahanBaku}</td>
                      <td className="p-3 text-xs text-gray-600">{pr.pic}</td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                          {pr.status} ✓
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* STRUK MODAL */}
      {showStrukModal && lastReceipt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm text-center border border-pink-100">
            <div className="mb-2">
              <img src={settings.logoUrl} alt="Logo" className="w-16 h-16 rounded-full object-cover mx-auto shadow border border-pink-200" referrerPolicy="no-referrer" />
              <h4 className="font-bold text-base text-[#ff3377] mt-1">{settings.namaToko}</h4>
              <p className="text-[11px] text-gray-500">{settings.alamat}</p>
            </div>
            <div className="text-left text-xs text-gray-600 border-b border-t border-dashed border-gray-300 py-2 my-2 space-y-0.5">
              <p>Nota: <b>{lastReceipt.nota}</b></p>
              <p>Waktu: {new Date(lastReceipt.timestamp).toLocaleString()}</p>
              <p>Kasir: {lastReceipt.kasir} ({lastReceipt.shift})</p>
              <p>Cabang: {lastReceipt.cabang}</p>
            </div>

            <div className="text-left text-xs space-y-1 mb-3 max-h-40 overflow-y-auto">
              {lastReceipt.item.map((it: any, i: number) => (
                <div key={i} className="flex justify-between">
                  <span>{it.nama} x{it.qty}</span>
                  <span>Rp {(it.harga * it.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="text-right text-xs border-t border-gray-200 pt-2 space-y-1 text-gray-700">
              <div className="flex justify-between"><span>Subtotal:</span><span>Rp {lastReceipt.subtotal.toLocaleString()}</span></div>
              {lastReceipt.diskon > 0 && <div className="flex justify-between text-green-600"><span>Diskon Member:</span><span>- Rp {lastReceipt.diskon.toLocaleString()}</span></div>}
              {lastReceipt.pajak > 0 && <div className="flex justify-between"><span>PPN:</span><span>+ Rp {lastReceipt.pajak.toLocaleString()}</span></div>}
              <div className="flex justify-between font-bold text-sm text-[#ff3377] pt-1">
                <span>Total:</span>
                <span>Rp {lastReceipt.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between"><span>Bayar ({lastReceipt.metode}):</span><span>Rp {lastReceipt.bayar.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Kembalian:</span><span>Rp {lastReceipt.kembalian.toLocaleString()}</span></div>
            </div>

            <p className="text-[11px] text-gray-500 italic mt-4">{settings.footerStruk}</p>

            <button 
              onClick={() => { window.print(); setShowStrukModal(false); }}
              className="mt-4 w-full bg-[#ff6699] hover:bg-[#ff3377] text-white py-2 rounded-xl text-xs font-medium shadow flex items-center justify-center gap-1"
            >
              <Printer className="w-4 h-4" /> Cetak Struk 🖨️
            </button>
            <button 
              onClick={() => setShowStrukModal(false)}
              className="mt-2 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-xl text-xs font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md border border-pink-100 animate-in zoom-in-95 duration-150">
            <h4 className="font-bold text-lg text-gray-900 mb-2 border-b border-pink-100 pb-2 text-[#ff3377] flex items-center gap-2">
              ⚠️ Konfirmasi Tindakan
            </h4>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-all"
              >
                Batal ✕
              </button>
              <button 
                onClick={handleConfirmAction}
                className="px-5 py-2 bg-[#ff3377] hover:bg-[#ff1a5c] text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-pink-200"
              >
                Ya, Lanjutkan ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM VALUASI PERSYARATAN MODAL BREAKDOWN */}
      {showValuasiModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-3xl border border-pink-100 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4 border-b border-pink-100 pb-3">
              <h4 className="font-bold text-lg text-[#ff3377] flex items-center gap-2">
                📊 Rincian Perhitungan Valuasi Persediaan (ERP)
              </h4>
              <button 
                onClick={() => setShowValuasiModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 mb-4 text-xs text-gray-700 space-y-2 leading-relaxed">
              <p className="font-bold text-[#ff3377]">
                💡 Mengapa total valuasi persediaan bernilai Rp 19.885.000?
              </p>
              <p>
                Di dalam sistem akuntansi standar dan modul ERP, <b>Valuasi Persediaan (Inventory Valuation)</b> selalu dihitung berdasarkan <b>Harga Beli / Harga Pokok Pembelian (Cost Price)</b>, bukan Harga Jual (Retail Price).
              </p>
              <p>
                Jika dihitung berdasarkan Harga Jual, maka kita mengantisipasi profit yang belum terealisasikan (karena barang-barang tersebut belum laku terjual ke pembeli). Hal ini melanggar <b>Prinsip Konservatisme Akuntansi</b> karena melebih-lebihkan nilai aset bersih (net assets) perusahaan.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 mb-4 max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-pink-50 text-gray-700 sticky top-0 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="p-3">Cabang Toko</th>
                    <th className="p-3">Kode</th>
                    <th className="p-3">Nama Produk</th>
                    <th className="p-3 text-center">Stok Fisik</th>
                    <th className="p-3 text-right">Harga Beli (Cost)</th>
                    <th className="p-3 text-right bg-pink-100/20">Subtotal Valuasi</th>
                    <th className="p-3 text-right text-gray-400">Harga Jual (Retail)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {barangList.map((b, idx) => {
                    const stok = Number(b[6] || 0);
                    const hargaBeli = Number(b[3] || 50000);
                    const subtotal = stok * hargaBeli;
                    const hargaJual = Number(b[5] || 0);
                    return (
                      <tr key={idx} className="hover:bg-pink-50/20">
                        <td className="p-3 font-medium text-gray-600">{b[8] || 'Cabang Pusat'}</td>
                        <td className="p-3 font-mono font-semibold text-[#ff3377]">{b[1]}</td>
                        <td className="p-3 text-gray-800">{b[2]}</td>
                        <td className="p-3 text-center font-bold text-gray-900">{stok.toLocaleString('id-ID')}</td>
                        <td className="p-3 text-right text-gray-700">Rp {hargaBeli.toLocaleString('id-ID')}</td>
                        <td className="p-3 text-right font-extrabold text-gray-900 bg-pink-100/10">Rp {subtotal.toLocaleString('id-ID')}</td>
                        <td className="p-3 text-right text-gray-400">Rp {hargaJual.toLocaleString('id-ID')}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-pink-50 font-bold text-gray-800 sticky bottom-0 border-t-2 border-pink-200">
                  <tr>
                    <td colSpan={3} className="p-3 text-right">TOTAL KONSOLIDASI:</td>
                    <td className="p-3 text-center text-sm font-extrabold text-[#ff3377]">
                      {barangList.reduce((sum, b) => sum + Number(b[6] || 0), 0).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3"></td>
                    <td className="p-3 text-right text-sm font-extrabold text-[#ff3377] bg-pink-100/40">
                      Rp {barangList.reduce((sum, b) => sum + (Number(b[6] || 0) * Number(b[3] || 50000)), 0).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-right text-xs text-gray-400">
                      Rp {barangList.reduce((sum, b) => sum + (Number(b[6] || 0) * Number(b[5] || 0)), 0).toLocaleString('id-ID')} (Jual)
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500 italic">
                *Stok telah disinkronkan di seluruh cabang.
              </span>
              <button 
                onClick={() => setShowValuasiModal(false)}
                className="px-5 py-2.5 bg-[#ff3377] hover:bg-[#ff1a5c] text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-pink-200"
              >
                Saya Mengerti, Tutup ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PURCHASE ORDER / SURAT PESANAN SUPPLIER */}
      {selectedPoForSuratJalan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in overflow-y-auto print:hidden">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-4xl border border-pink-100 max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            
            {/* Modal Actions Header */}
            <div className="flex justify-between items-center mb-4 border-b border-pink-100 pb-3">
              <h4 className="font-bold text-lg text-[#ff3377] flex items-center gap-2">
                📄 Dokumen Purchase Order (PO) / Surat Pesanan
              </h4>
              <button 
                onClick={() => setSelectedPoForSuratJalan(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Preview Paper */}
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              {renderSuratJalanPaper(selectedPoForSuratJalan)}
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-5 gap-3 pt-3 border-t border-gray-100">
              <div className="text-left max-w-md">
                <span className="text-xs text-gray-500 italic block">
                  *Gunakan tombol cetak untuk mencetak langsung, atau tombol <b>Unduh File Cetak</b> sebagai solusi anti-blokir paling andal.
                </span>
                <span className="text-[10px] text-[#ff3377] font-medium block mt-1">
                  💡 Tips: Unduh File Cetak akan mengunduh file dokumen mandiri (.html) yang otomatis membuka dialog print saat dibuka di komputer/hp Anda!
                </span>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto shrink-0 justify-end">
                <button 
                  onClick={() => setSelectedPoForSuratJalan(null)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-all"
                >
                  Tutup ✕
                </button>
                <button 
                  onClick={handleDownloadSuratJalanHTML}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5"
                >
                  📥 Unduh File Cetak (Sangat Direkomendasikan) ✓
                </button>
                <button 
                  onClick={handlePrintSuratJalan}
                  className="px-4 py-2.5 bg-[#ff3377] hover:bg-[#ff1a5c] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-pink-200 flex items-center justify-center gap-1.5"
                >
                  🖨️ Cetak Langsung
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>

    {/* AREA PRINT KHUSUS PURCHASE ORDER (ONLY VISIBLE ON PRINT) */}
    {selectedPoForSuratJalan && (
      <div id="po-print-container" className="hidden print:block bg-white text-gray-800">
        {renderSuratJalanPaper(selectedPoForSuratJalan)}
      </div>
    )}

  </>
  );
}
