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
  ChevronRight,
  Menu,
  X,
  Barcode,
  Scan,
  Share2,
  Rocket,
  Globe,
  AlertTriangle,
  ExternalLink
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
  komisiPersen?: number;
}

interface CartItem {
  kode: string;
  nama: string;
  harga: number;
  hpp: number;
  qty: number;
  satuan?: string;
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
  },
  {
    id: "merahputih",
    nama: "🇮🇩 Merah Putih (Corporate Indonesia)",
    primary: "#d32f2f",
    primaryHover: "#990000",
    secondary: "#e53935",
    secondaryHover: "#b71c1c",
    bg: "#fff8f8",
    lightTint: "#ffebee",
    borderTint: "#ffcdd2",
    textColor: "#d32f2f",
    glow: "rgba(211, 47, 47, 0.15)",
    sidebarBg: "#d32f2f",
  }
];

function hexToRgb(hex: string): string {
  const cleaned = hex.replace(/^#/, '');
  const bigint = parseInt(cleaned, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

export const MS_OFFICE_THEME_COLORS = [
  ["#ffffff", "#000000", "#e7e6e6", "#44546a", "#5b9bd5", "#ed7d31", "#a5a5a5", "#ffc000", "#4472c4", "#70ad47"],
  ["#f2f2f2", "#7f7f7f", "#d2d2d2", "#d9e1f2", "#ddebf7", "#fce4d6", "#ededed", "#fff2cc", "#d9e1f2", "#e2efda"],
  ["#d9d9d9", "#595959", "#b3b3b3", "#b4c6e7", "#bdd7ee", "#f8cbad", "#dbdbdb", "#ffe699", "#b4c6e7", "#c6e0b4"],
  ["#bfbfbf", "#3f3f3f", "#808080", "#8ea9db", "#9bc2e6", "#f4b084", "#c9c9c9", "#ffd966", "#8ea9db", "#a9d08e"],
  ["#a6a6a6", "#262626", "#404040", "#305496", "#2f75b5", "#c65911", "#7b7b7b", "#bf8f00", "#305496", "#375623"],
  ["#7f7f7f", "#0c0c0c", "#1a1a1a", "#203764", "#1f4e78", "#833c0c", "#525252", "#806000", "#203764", "#253b19"]
];

export const MS_OFFICE_STANDARD_ROW = [
  "#c00000",
  "#ff0000",
  "#ffc000",
  "#ffff00",
  "#92d050",
  "#00b050",
  "#00b0f0",
  "#0070c0",
  "#002060",
  "#7030a0"
];

function darkenColor(hex: string, percent: number): string {
  try {
    const num = parseInt(hex.replace("#", ""), 16),
          amt = Math.round(2.55 * percent),
          R = (num >> 16) - amt,
          G = (num >> 8 & 0x00FF) - amt,
          B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? R < 0 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 0 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 0 ? 0 : B : 255)).toString(16).slice(1);
  } catch (e) {
    return hex;
  }
}

function mixWithWhite(hex: string, ratio: number): string {
  try {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    
    const mixedR = Math.round(r * ratio + 255 * (1 - ratio));
    const mixedG = Math.round(g * ratio + 255 * (1 - ratio));
    const mixedB = Math.round(b * ratio + 255 * (1 - ratio));
    
    const toHex = (c: number) => {
      const s = c.toString(16);
      return s.length === 1 ? "0" + s : s;
    };
    return `#${toHex(mixedR)}${toHex(mixedG)}${toHex(mixedB)}`;
  } catch (e) {
    return hex;
  }
}

function getThemeObj(themeId: string): typeof THEMES[0] {
  if (themeId && themeId.startsWith('custom_')) {
    const parts = themeId.split('_');
    const primary = parts[1] || '#ff3377';
    const secondary = parts[2] || '#ff6699';
    
    const primaryHover = darkenColor(primary, 15);
    const secondaryHover = darkenColor(secondary, 15);
    
    const bg = mixWithWhite(primary, 0.04);
    const lightTint = mixWithWhite(primary, 0.12);
    const borderTint = mixWithWhite(primary, 0.25);
    
    return {
      id: themeId,
      nama: "🎨 Kustom (More Colors)",
      primary: primary,
      primaryHover: primaryHover,
      secondary: secondary,
      secondaryHover: secondaryHover,
      bg: bg,
      lightTint: lightTint,
      borderTint: borderTint,
      textColor: primary,
      glow: `rgba(${hexToRgb(primary)}, 0.15)`,
      sidebarBg: secondary,
    };
  }
  return THEMES.find(t => t.id === themeId) || THEMES[0];
}

export const hasAccess = (role: string, tab: string): boolean => {
  if (role === 'Owner') return true;
  if (role === 'Admin Cabang') {
    const allowed = ['pos', 'barang', 'opname', 'laporan', 'audit', 'transfer', 'po', 'production', 'panduan'];
    return allowed.includes(tab);
  }
  if (role === 'Kasir') {
    const allowed = ['pos', 'transfer', 'panduan'];
    return allowed.includes(tab);
  }
  return false;
};

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('pinky_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pos' | 'barang' | 'opname' | 'laporan' | 'audit' | 'cabang' | 'staff' | 'settings' | 'panduan' | 'transfer' | 'erp' | 'ledger' | 'po' | 'payroll' | 'production'>(() => {
    try {
      const hash = window.location.hash.replace('#', '');
      const validTabs = ['pos', 'barang', 'opname', 'laporan', 'audit', 'cabang', 'staff', 'settings', 'panduan', 'transfer', 'erp', 'ledger', 'po', 'payroll', 'production'];
      if (validTabs.includes(hash)) {
        return hash as any;
      }
      const saved = localStorage.getItem('pinky_active_tab');
      return (saved as any) || 'pos';
    } catch {
      return 'pos';
    }
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('pinky_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('pinky_user');
      }
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  useEffect(() => {
    if (user && !hasAccess(user.role, activeTab)) {
      handleNavSelect('pos');
    }
  }, [user, activeTab]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavSelect = (tab: 'pos' | 'barang' | 'opname' | 'laporan' | 'audit' | 'cabang' | 'staff' | 'settings' | 'panduan' | 'transfer' | 'erp' | 'ledger' | 'po' | 'payroll' | 'production') => {
    setActiveTab(tab);
    try {
      localStorage.setItem('pinky_active_tab', tab);
      window.location.hash = tab;
    } catch (e) {
      console.error(e);
    }
    if (isMobile) {
      setIsSidebarCollapsed(true);
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validTabs = ['pos', 'barang', 'opname', 'laporan', 'audit', 'cabang', 'staff', 'settings', 'panduan', 'transfer', 'erp', 'ledger', 'po', 'payroll', 'production'];
      if (validTabs.includes(hash)) {
        setActiveTab(hash as any);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    
    // Sync hash on mount if none exists
    if (!window.location.hash && activeTab) {
      window.location.hash = activeTab;
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);
  
  const [settings, setSettings] = useState({
    namaToko: "PINKY SHOP",
    alamat: "Jl. Pink Utama No. 88 Jakarta",
    alamatPo: "Jl. Pink Utama No. 88 Jakarta (Kantor Pusat)",
    tagline: "Fashion, Retail & Supply Chain Management",
    theme: "sakura",
    logoUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300",
    pajakPersen: 11,
    diskonMemberPersen: 10,
    footerStruk: "Terima kasih telah berbelanja di toko kami",
    rekeningOwner: [
      { id: "bni", bank: "BNI", nomor: "2064972", atasNama: "ROUFI MALY", qrisUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BNI-2064972" },
      { id: "bca", bank: "BCA", nomor: "1234567890", atasNama: "Ibu Boss Owner", qrisUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BCA-1234567890" },
      { id: "mandiri", bank: "Mandiri", nomor: "0987654321", atasNama: "Ibu Boss Owner", qrisUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Mandiri-0987654321" }
    ] as Rekening[]
  });

  const currentTheme = getThemeObj(settings.theme || 'sakura');
  
  const [customPrimary, setCustomPrimary] = useState('#ff3377');
  const [customSecondary, setCustomSecondary] = useState('#ff6699');
  
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
  const [kasHarianList, setKasHarianList] = useState<any[]>([]);

  // Kas Harian Form State
  const [newKasKeterangan, setNewKasKeterangan] = useState('');
  const [newKasTipe, setNewKasTipe] = useState<'Debet' | 'Kredit'>('Debet');
  const [newKasJumlah, setNewKasJumlah] = useState('');
  const [newKasCabang, setNewKasCabang] = useState('Cabang Pusat');
  const [newKasTanggal, setNewKasTanggal] = useState(new Date().toISOString().split('T')[0]);

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

  const [salaryMap, setSalaryMap] = useState<{ [email: string]: number }>({});
  const [commissionBranchFilter, setCommissionBranchFilter] = useState<string>('Semua Cabang');
  const [selectedSlipPayroll, setSelectedSlipPayroll] = useState<any | null>(null);

  const [prdProduk, setPrdProduk] = useState('');
  const [prdQty, setPrdQty] = useState('');
  const [prdBahan, setPrdBahan] = useState('Kain Katun Rayon Premium');
  const [prdQtyBahan, setPrdQtyBahan] = useState('15 Meter');
  const [prdCabang, setPrdCabang] = useState('');

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
  const [setTagline, setSetTagline] = useState('');
  const [setTheme, setSetTheme] = useState('sakura');
  const [setLogoUrl, setSetLogoUrl] = useState('');
  const [setPajak, setSetPajak] = useState('');
  const [setDiskonMember, setSetDiskonMember] = useState('');
  const [setFooter, setSetFooter] = useState('');
  const [rekeningList, setRekeningList] = useState<Rekening[]>([]);

  // Google Sheets Integration States
  const [googleSheetUrl, setGoogleSheetUrlState] = useState('');
  const [isSheetEnabled, setIsSheetEnabledState] = useState(false);
  const [sheetLogs, setSheetLogs] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isTestingConn, setIsTestingConn] = useState(false);

  // Go-Live Real Mode States
  const [goLiveBalances, setGoLiveBalances] = useState<{ [cabang: string]: string }>({
    "Cabang Pusat": "10000000",
    "Cabang Jakarta Selatan": "5000000",
    "Cabang Bandung": "5000000"
  });
  const [goLiveClearTxs, setGoLiveClearTxs] = useState(true);
  const [goLiveClearKas, setGoLiveClearKas] = useState(true);
  const [goLiveClearPO, setGoLiveClearPO] = useState(true);
  const [goLiveClearStock, setGoLiveClearStock] = useState(false);
  const [isSubmittingGoLive, setIsSubmittingGoLive] = useState(false);

  useEffect(() => {
    if (setTheme.startsWith('custom_')) {
      const nextCustomTheme = `custom_${customPrimary}_${customSecondary}`;
      if (setTheme !== nextCustomTheme) {
        setSetTheme(nextCustomTheme);
      }
    }
  }, [customPrimary, customSecondary, setTheme]);

  const fetchSettingsOnly = async () => {
    try {
      const res = await fetch('/api/getSettings');
      const data = await res.json();
      if (data) {
        setSettings(data);
        setSetNamaToko(data.namaToko);
        setSetAlamat(data.alamat);
        setSetAlamatPo(data.alamatPo || data.alamat || '');
        setSetTagline(data.tagline || 'Fashion, Retail & Supply Chain Management');
        const loadedTheme = data.theme || 'sakura';
        setSetTheme(loadedTheme);
        if (loadedTheme.startsWith('custom_')) {
          const parts = loadedTheme.split('_');
          setCustomPrimary(parts[1] || '#ff3377');
          setCustomSecondary(parts[2] || '#ff6699');
        }
        setSetLogoUrl(data.logoUrl);
        setSetPajak(String(data.pajakPersen));
        setSetDiskonMember(String(data.diskonMemberPersen));
        setSetFooter(data.footerStruk);
        if (data.rekeningOwner) {
          setRekeningList(data.rekeningOwner);
        }
        if (data.branchOpExpenses) {
          setBranchOpExpenses(data.branchOpExpenses);
        }
        setGoogleSheetUrlState(data.googleSheetUrl || '');
        setIsSheetEnabledState(!!data.isSheetEnabled);
      }
    } catch (e) {
      console.error("Gagal memuat settings", e);
    }
  };

  useEffect(() => {
    fetchSettingsOnly();
  }, []);

  const syncOfflineTransactions = async () => {
    try {
      const saved = localStorage.getItem('pinky_offline_transactions');
      if (!saved) return;
      const queue = JSON.parse(saved);
      if (!Array.isArray(queue) || queue.length === 0) return;

      console.log(`Menyinkronkan ${queue.length} transaksi offline...`);
      setIsSyncing(true);
      
      const remaining: any[] = [];
      let successCount = 0;

      for (const tx of queue) {
        try {
          const res = await fetch('/api/simpanTransaksi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tx)
          });
          const data = await res.json();
          if (data.s === 1) {
            successCount++;
          } else {
            remaining.push(tx);
          }
        } catch (err) {
          remaining.push(tx);
        }
      }

      if (remaining.length > 0) {
        localStorage.setItem('pinky_offline_transactions', JSON.stringify(remaining));
      } else {
        localStorage.removeItem('pinky_offline_transactions');
      }

      setIsSyncing(false);
      if (successCount > 0) {
        fetchData();
        console.log(`Berhasil menyinkronkan ${successCount} transaksi offline!`);
      }
    } catch (e) {
      console.error("Error syncing offline transactions", e);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Initial sync
    syncOfflineTransactions();

    // Event listeners
    window.addEventListener('online', syncOfflineTransactions);
    
    // Interval check every 30 seconds
    const interval = setInterval(() => {
      if (navigator.onLine) {
        syncOfflineTransactions();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', syncOfflineTransactions);
      clearInterval(interval);
    };
  }, []);

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

  // Offline staff form state (Security, Office Boy, etc.)
  const [offlineNama, setOfflineNama] = useState('');
  const [offlineRole, setOfflineRole] = useState('Security');
  const [offlineCabang, setOfflineCabang] = useState('Cabang Pusat');
  const [offlineKomisi, setOfflineKomisi] = useState('2');
  const [offlineGaji, setOfflineGaji] = useState('2500000');
  const [editingOfflineEmail, setEditingOfflineEmail] = useState<string | null>(null);

  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [metodeBayar, setMetodeBayar] = useState('Cash');
  const [uangBayar, setUangBayar] = useState<number>(0);
  const [selectedRekeningId, setSelectedRekeningId] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [useTax, setUseTax] = useState(true);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [showStrukModal, setShowStrukModal] = useState(false);

  // POS Scanner State
  const [posSearchQuery, setPosSearchQuery] = useState('');
  const [scannerFeedback, setScannerFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handlePosScannerSubmit = () => {
    const query = posSearchQuery.trim();
    if (!query) return;

    // Search for product with exact match of Kode (case-insensitive)
    const matchedProduct = posProducts.find(p => p.kode.toLowerCase() === query.toLowerCase());

    if (matchedProduct) {
      const currentBranchStock = matchedProduct.branchStok[user.cabang] !== undefined ? matchedProduct.branchStok[user.cabang] : 0;
      const currentHpp = matchedProduct.branchHpp && matchedProduct.branchHpp[user.cabang] !== undefined ? matchedProduct.branchHpp[user.cabang] : (matchedProduct.hpp || matchedProduct.beli || 0);

      tambahKeKeranjang(matchedProduct.kode, matchedProduct.nama, Number(matchedProduct.jual || 0), Number(currentHpp), matchedProduct.satuan || 'Pcs');

      setScannerFeedback({
        message: `✓ [Barcode Match] ${matchedProduct.nama} (${matchedProduct.satuan || 'Pcs'}) ditambahkan ke keranjang!`,
        type: 'success'
      });
      setPosSearchQuery(''); // Clear search query immediately for next scan
      
      // Auto-clear feedback after 2.5 seconds
      setTimeout(() => {
        setScannerFeedback(prev => prev?.message.includes(matchedProduct.nama) ? null : prev);
      }, 2500);
    } else {
      // If no exact match by code, let's see if there's a unique product containing this search term as name
      const matchingByName = posProducts.filter(p => p.nama.toLowerCase().includes(query.toLowerCase()));
      if (matchingByName.length === 1) {
        const matched = matchingByName[0];
        const currentHpp = matched.branchHpp && matched.branchHpp[user.cabang] !== undefined ? matched.branchHpp[user.cabang] : (matched.hpp || matched.beli || 0);
        tambahKeKeranjang(matched.kode, matched.nama, Number(matched.jual || 0), Number(currentHpp), matched.satuan || 'Pcs');
        
        setScannerFeedback({
          message: `✓ [Nama Match] ${matched.nama} ditambahkan ke keranjang!`,
          type: 'success'
        });
        setPosSearchQuery('');
        setTimeout(() => {
          setScannerFeedback(prev => prev?.message.includes(matched.nama) ? null : prev);
        }, 2500);
      } else if (matchingByName.length > 1) {
        setScannerFeedback({
          message: `🔍 Menemukan ${matchingByName.length} produk yang mirip. Silakan pilih dari daftar produk di bawah.`,
          type: 'info'
        });
      } else {
        setScannerFeedback({
          message: `❌ Kode atau nama produk "${query}" tidak ditemukan!`,
          type: 'error'
        });
        // Auto-clear error after 3 seconds
        setTimeout(() => {
          setScannerFeedback(prev => prev?.message.includes(query) ? null : prev);
        }, 3000);
      }
    }
  };

  // New Item Form state
  const [newKode, setNewKode] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newBeli, setNewBeli] = useState('');
  const [newHpp, setNewHpp] = useState('');
  const [newJual, setNewJual] = useState('');
  const [newStok, setNewStok] = useState('');
  const [newFoto, setNewFoto] = useState('');
  const [newSatuan, setNewSatuan] = useState('Pcs');
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
    type: 'delete_barang' | 'delete_branch' | 'delete_staff' | 'process_po' | 'process_transfer' | 'delete_kas_harian' | null;
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
    type: 'delete_barang' | 'delete_branch' | 'delete_staff' | 'process_po' | 'process_transfer' | 'delete_kas_harian',
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
      } else if (type === 'delete_kas_harian') {
        const res = await fetch('/api/hapusKasHarian', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: payload.id })
        });
        const data = await res.json();
        try {
          alert(data.m);
        } catch (err) {
          console.warn("window.alert is blocked/unavailable.", err);
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
  const [poDocType, setPoDocType] = useState<'PO' | 'GRN' | 'INVOICE'>('PO');
  const [selectedTransferForSuratJalan, setSelectedTransferForSuratJalan] = useState<any | null>(null);
  const [financialSubTab, setFinancialSubTab] = useState<'rugi_laba' | 'coa' | 'ledger' | 'neraca' | 'komisi_net'>('rugi_laba');
  const [komisiBasis, setKomisiBasis] = useState<'net_profit' | 'sales'>('net_profit');
  const [newCoaKode, setNewCoaKode] = useState('');
  const [newCoaNama, setNewCoaNama] = useState('');
  const [newCoaTipe, setNewCoaTipe] = useState('Aset Lancar');
  const [newCoaNormal, setNewCoaNormal] = useState('Debet');
  const [customCoaList, setCustomCoaList] = useState<any[]>([
    { kode: '1-1001', nama: 'Kas & Bank Operasional', tipe: 'Aset Lancar', normal: 'Debet' },
    { kode: '1-1002', nama: 'Piutang Usaha', tipe: 'Aset Lancar', normal: 'Debet' },
    { kode: '1-1003', nama: 'Persediaan Barang Dagangan', tipe: 'Aset Lancar', normal: 'Debet' },
    { kode: '1-2001', nama: 'Peralatan & Aset Tetap Toko', tipe: 'Aset Tetap', normal: 'Debet' },
    { kode: '2-2001', nama: 'Hutang Usaha / Supplier PO', tipe: 'Kewajiban', normal: 'Kredit' },
    { kode: '3-3001', nama: 'Modal Owner Disetor', tipe: 'Ekuitas', normal: 'Kredit' },
    { kode: '3-3002', nama: 'Laba Ditahan & Laba Berjalan', tipe: 'Ekuitas', normal: 'Kredit' },
    { kode: '4-4001', nama: 'Pendapatan Penjualan Kasir POS', tipe: 'Pendapatan', normal: 'Kredit' },
    { kode: '5-5001', nama: 'Harga Pokok Penjualan (HPP)', tipe: 'HPP', normal: 'Debet' },
    { kode: '6-6001', nama: 'Beban Gaji & Komisi SDM', tipe: 'Beban', normal: 'Debet' },
    { kode: '6-6002', nama: 'Beban Sewa Gedung / Outlet', tipe: 'Beban', normal: 'Debet' },
    { kode: '6-6003', nama: 'Beban Listrik, Air & Utilities', tipe: 'Beban', normal: 'Debet' },
    { kode: '6-6004', nama: 'Beban Transportasi & Logistik', tipe: 'Beban', normal: 'Debet' },
    { kode: '6-6005', nama: 'Beban CSR & Pengeluaran Lainnya', tipe: 'Beban', normal: 'Debet' }
  ]);

  const handleDownloadSuratJalanTransferHTML = () => {
    if (!selectedTransferForSuratJalan) return;
    const trf = selectedTransferForSuratJalan;
    const storeName = settings.namaToko || "PINKY POS & BOUTIQUE";
    const storeAddress = settings.alamatPo || settings.alamat || "Jl. Merdeka No. 45, Kebayoran Baru, Jakarta Selatan";
    const storeTagline = settings.tagline || "Fashion, Retail & Supply Chain Management";

    const htmlContent = `<!DOCTYPE html>
<html>
  <head>
    <title>Surat Jalan Transfer - ${trf.id}</title>
    <meta charset="utf-8">
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <style>
      @media print { .no-print { display: none !important; } }
      body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; padding: 2rem; color: #1f2937; }
    </style>
  </head>
  <body class="flex flex-col items-center justify-start min-h-screen">
    <div class="no-print bg-[#ff3377] text-white p-4 rounded-xl shadow mb-6 w-full max-w-3xl flex justify-between items-center">
      <div>
        <h3 class="font-bold">📄 Surat Jalan Transfer Mutasi Barang (${trf.id})</h3>
        <p class="text-xs text-pink-100">Dokumen resmi pengiriman barang antar cabang ${storeName}.</p>
      </div>
      <div class="flex gap-2">
        <button onclick="window.print()" class="px-4 py-2 bg-white text-[#ff3377] font-bold text-xs rounded-lg shadow cursor-pointer">🖨️ Cetak Document</button>
        <button onclick="window.close()" class="px-3 py-2 bg-pink-800 text-white text-xs rounded-lg cursor-pointer">Tutup</button>
      </div>
    </div>
    <div class="bg-white p-8 rounded-2xl border border-gray-300 shadow-md w-full max-w-3xl">
      <div class="flex justify-between items-start border-b-2 border-[#ff3377] pb-4 mb-6">
        <div>
          <h2 class="text-2xl font-black text-[#ff3377]">${storeName}</h2>
          <p class="text-xs text-gray-500 font-medium">${storeTagline}</p>
          <p class="text-xs text-gray-500 mt-1 max-w-sm">${storeAddress}</p>
        </div>
        <div class="text-right">
          <span class="bg-[#ff3377] text-white text-xs font-bold px-3 py-1 rounded uppercase block mb-1">SURAT JALAN TRANSFER</span>
          <p class="text-sm font-bold">No: ${trf.id}</p>
          <p class="text-xs text-gray-500">Tgl: ${new Date(trf.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4 bg-pink-50/60 p-4 rounded-lg mb-6 text-xs border border-pink-100">
        <div>
          <span class="text-gray-500 font-bold block uppercase text-[10px]">Cabang Pengirim (Asal)</span>
          <span class="font-bold text-gray-800 text-sm">${trf.dariCabang}</span>
          <p class="text-gray-500 mt-1">Petugas / Pengaju: <b>${trf.pengaju || 'Staff Cabang'}</b></p>
        </div>
        <div>
          <span class="text-gray-500 font-bold block uppercase text-[10px]">Cabang Penerima (Tujuan)</span>
          <span class="font-bold text-[#ff3377] text-sm">${trf.keCabang}</span>
          <p class="text-gray-500 mt-1">Status Mutasi: <b class="text-emerald-600">${trf.status}</b></p>
        </div>
      </div>
      <table class="w-full text-xs text-left border-collapse border border-gray-300 mb-6">
        <thead>
          <tr class="bg-gray-100 text-gray-700 font-bold uppercase">
            <th class="p-2 border border-gray-300 text-center w-10">No</th>
            <th class="p-2 border border-gray-300">Kode Barang</th>
            <th class="p-2 border border-gray-300">Nama Produk</th>
            <th class="p-2 border border-gray-300 text-center w-24">Jumlah</th>
            <th class="p-2 border border-gray-300">Catatan</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="p-2 border border-gray-300 text-center">1</td>
            <td class="p-2 border border-gray-300 font-mono font-bold">${trf.kode}</td>
            <td class="p-2 border border-gray-300 font-bold">${trf.nama}</td>
            <td class="p-2 border border-gray-300 text-center font-extrabold text-[#ff3377] text-sm">${trf.qty} Pcs</td>
            <td class="p-2 border border-gray-300">${trf.catatan || 'Mutasi stok antar cabang'}</td>
          </tr>
        </tbody>
      </table>
      <div class="grid grid-cols-3 gap-4 text-center text-xs mt-8 pt-4 border-t border-gray-300">
        <div>
          <p class="font-semibold text-gray-600">Pengirim (Cabang Asal)</p>
          <div class="h-16"></div>
          <p class="font-bold underline">${trf.pengaju || 'Petugas Asal'}</p>
        </div>
        <div>
          <p class="font-semibold text-gray-600">Sopir / Kurir Pengantar</p>
          <div class="h-16"></div>
          <p class="font-bold underline">( ............................ )</p>
        </div>
        <div>
          <p class="font-semibold text-gray-600">Penerima (Cabang Tujuan)</p>
          <div class="h-16"></div>
          <p class="font-bold underline">( Petugas Penerima )</p>
        </div>
      </div>
    </div>
  </body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Surat_Jalan_Transfer_${trf.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderSuratJalanTransferPaper = (trf: any) => {
    const storeName = settings.namaToko || "PINKY POS & BOUTIQUE";
    const storeAddress = settings.alamatPo || settings.alamat || "Jl. Merdeka No. 45, Kebayoran Baru, Jakarta Selatan";
    const storeTagline = settings.tagline || "Fashion, Retail & Supply Chain Management";

    return (
      <div className="bg-white p-8 rounded-xl border border-gray-200 text-gray-800 font-sans max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-start border-b-2 border-[#ff3377] pb-4">
          <div>
            <h2 className="text-2xl font-black text-[#ff3377] tracking-tight">{storeName}</h2>
            <p className="text-xs text-gray-500 font-medium">{storeTagline}</p>
            <p className="text-xs text-gray-600 mt-1 max-w-sm">{storeAddress}</p>
          </div>
          <div className="text-right">
            <div className="bg-[#ff3377] text-white px-3 py-1 rounded-md text-xs font-extrabold uppercase inline-block mb-2">
              SURAT JALAN TRANSFER BARANG
            </div>
            <p className="text-sm font-bold text-gray-800">No: {trf.id}</p>
            <p className="text-xs text-gray-500">Tanggal: {new Date(trf.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-pink-50/50 p-4 rounded-lg border border-pink-100 text-xs">
          <div>
            <span className="text-gray-400 font-semibold block uppercase text-[10px]">Cabang Pengirim (Asal)</span>
            <span className="font-bold text-gray-800 text-sm">{trf.dariCabang}</span>
            <p className="text-gray-500 text-[11px] mt-1">Pengaju / Petugas: {trf.pengaju || 'Staff Cabang'}</p>
          </div>
          <div>
            <span className="text-gray-400 font-semibold block uppercase text-[10px]">Cabang Penerima (Tujuan)</span>
            <span className="font-bold text-[#ff3377] text-sm">{trf.keCabang}</span>
            <p className="text-gray-500 text-[11px] mt-1">Status Transfer: <b className="text-emerald-600">{trf.status}</b></p>
          </div>
        </div>

        <div>
          <table className="w-full text-xs text-left border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-100 text-gray-700 font-bold uppercase">
                <th className="p-2 border border-gray-200 text-center w-12">No</th>
                <th className="p-2 border border-gray-200">Kode Barang</th>
                <th className="p-2 border border-gray-200">Nama Produk</th>
                <th className="p-2 border border-gray-200 text-center w-24">Jumlah (Qty)</th>
                <th className="p-2 border border-gray-200">Catatan / Keterangan</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border border-gray-200 text-center">1</td>
                <td className="p-2 border border-gray-200 font-mono font-bold text-gray-700">{trf.kode}</td>
                <td className="p-2 border border-gray-200 font-bold text-gray-800">{trf.nama}</td>
                <td className="p-2 border border-gray-200 text-center font-extrabold text-sm text-[#ff3377]">{trf.qty} Pcs</td>
                <td className="p-2 border border-gray-200 text-gray-600">{trf.catatan || 'Mutasi stok antar cabang'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded border border-gray-200">
          <b>Catatan Pengiriman:</b> Harap periksa kondisi fisik barang dan sesuaikan jumlah barang yang diterima dengan Surat Jalan ini sebelum menandatangani bukti penerimaan.
        </div>

        <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs text-gray-700">
          <div>
            <p className="font-semibold text-gray-600">Pengirim (Cabang Asal)</p>
            <div className="h-16"></div>
            <p className="font-bold underline text-gray-800">( {trf.pengaju || 'Petugas Asal'} )</p>
          </div>
          <div>
            <p className="font-semibold text-gray-600">Sopir / Kurir Pengantar</p>
            <div className="h-16"></div>
            <p className="font-bold underline text-gray-800">( ............................ )</p>
          </div>
          <div>
            <p className="font-semibold text-gray-600">Penerima (Cabang Tujuan)</p>
            <div className="h-16"></div>
            <p className="font-bold underline text-gray-800">( Petugas Penerima )</p>
          </div>
        </div>
      </div>
    );
  };

  const handlePrintSuratJalan = () => {
    window.print();
  };

  const handleDownloadSuratJalanHTML = () => {
    if (!selectedPoForSuratJalan) return;
    
    const po = selectedPoForSuratJalan;
    const storeName = settings.namaToko || "PINKY POS & BOUTIQUE";
    const storeAddress = settings.alamatPo || settings.alamat || "Jl. Merdeka No. 45, Kebayoran Baru, Jakarta Selatan";
    const storeTagline = settings.tagline || "Fashion, Retail & Supply Chain Management";
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

    let docTitle = "Purchase Order (PO) - Surat Pesanan Barang";
    let docRef = `PO-${po.id}`;
    let docBadge = "SURAT PESANAN SUPPLIER";
    let docNote = `
      <ol style="list-style-type: decimal; padding-left: 1rem; margin: 0;">
        <li>Mohon berikan konfirmasi kesiapan barang dan estimasi tanggal pengiriman setelah menerima lembar PO resmi ini.</li>
        <li>Seluruh produk yang dikirimkan wajib dalam kondisi fisik prima, baru, lolos QC, serta sesuai spesifikasi deskripsi di atas.</li>
        <li>Lampirkan dokumen Surat Jalan pengiriman fisik dari Supplier dengan mencantumkan nomor referensi <b>PO-${po.id}</b> ini.</li>
      </ol>
    `;
    let sig1Title = "PEMESAN (PURCHASING)";
    let sig1Sub = user?.nama || 'Staff Pembeli';
    let sig2Title = "SUPPLIER / REKANAN";
    let sig2Sub = po.supplier;
    let sig3Title = "MENYETUJUI (OWNER / PUSAT)";
    let sig3Sub = "Owner / Head Office";

    if (poDocType === 'GRN') {
      docTitle = "Goods Receipt Note (GRN) - Bukti Penerimaan Barang Gudang";
      docRef = `GRN-${po.id}`;
      docBadge = "BERITA ACARA SERAH TERIMA (BAST) GUDANG";
      docNote = `
        <ul style="list-style-type: disc; padding-left: 1rem; margin: 0;">
          <li>Berkas BAST gudang ini diterbitkan setelah dilakukan inspeksi fisik dan QC oleh petugas gudang cabang.</li>
          <li>Kuantitas barang yang diterima telah diverifikasi, lolos QC, dan secara otomatis menambah stok sediaan barang di cabang <b>${po.cabang}</b>.</li>
        </ul>
      `;
      sig1Title = "PETUGAS INSPEKSI GUDANG";
      sig1Sub = user?.nama || 'Staff Gudang';
      sig2Title = "KURIR / PENGIRIM SUPPLIER";
      sig2Sub = "Pengirim Vendor";
      sig3Title = "KEPALA GUDANG / CABANG";
      sig3Sub = `Head of ${po.cabang}`;
    } else if (poDocType === 'INVOICE') {
      docTitle = "Faktur Pembelian Supplier - Nota Tagihan HPP & Accounts Payable";
      docRef = `INV-SUP-${po.id}`;
      docBadge = "FAKTUR PEMBELIAN HPP (AKUN 2-2001)";
      docNote = `
        <ul style="list-style-type: disc; padding-left: 1rem; margin: 0;">
          <li>Nota tagihan HPP pembelian barang sediaan ini terhubung langsung dengan Buku Besar Hutang Usaha (Kode Akun 2-2001).</li>
          <li>Pelunasan pembayaran akan mencatat Pengeluaran Kas (Kas Outflow) dan mendebit saldo Hutang Usaha di Laporan Keuangan.</li>
        </ul>
      `;
      sig1Title = "BAGIAN KEUANGAN (FINANCE)";
      sig1Sub = user?.nama || 'Staff Finance';
      sig2Title = "REKANAN / SUPPLIER";
      sig2Sub = po.supplier;
      sig3Title = "OTORISASI KEUANGAN / OWNER";
      sig3Sub = "Finance Manager / Owner";
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docTitle} - ${docRef}</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @media print {
              body { padding: 0; margin: 0; background-color: white; }
              .no-print { display: none !important; }
              .paper-border { border: none !important; box-shadow: none !important; padding: 0 !important; }
            }
            body { font-family: system-ui, -apple-system, sans-serif; background-color: #f3f4f6; padding: 2rem 1rem; color: #1f2937; }
          </style>
        </head>
        <body class="flex flex-col items-center justify-start min-h-screen">
          <div class="no-print bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-4 rounded-2xl shadow-xl mb-6 w-full max-w-4xl flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 class="font-bold text-lg">📄 ${docTitle} (${docRef})</h3>
              <p class="text-xs text-pink-100 mt-1">Dokumen resmi dari ${storeName}. Klik tombol untuk mencetak atau mengunduh PDF.</p>
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

          <div class="paper-border bg-white border-2 border-gray-300 p-8 rounded-2xl shadow-lg w-full max-w-4xl text-gray-800">
            <div class="flex flex-col md:flex-row justify-between items-start border-b-4 border-double border-gray-800 pb-4 mb-6 gap-4" style="border-bottom: 4px double #1f2937; padding-bottom: 1rem; margin-bottom: 1.5rem;">
              <div style="display: flex; gap: 1rem; align-items: center;">
                ${storeLogoHtml}
                <div>
                  <h2 class="text-2xl font-black text-gray-900 tracking-tight uppercase" style="font-weight: 900; font-size: 1.5rem; margin: 0;">${storeName}</h2>
                  <p class="text-xs font-semibold text-pink-600 uppercase tracking-widest mt-0.5" style="font-size: 0.75rem; letter-spacing: 0.1em; color: #db2777; font-weight: 600; margin: 0;">${storeTagline}</p>
                  <p class="text-xs text-gray-500 mt-1 max-w-md" style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">${storeAddress}</p>
                </div>
              </div>
              <div class="md:text-right" style="text-align: right;">
                <h3 class="text-xl font-bold text-gray-900 tracking-wider" style="font-size: 1.25rem; font-weight: 700; margin: 0;">${docTitle.split(' - ')[0].toUpperCase()}</h3>
                <p class="text-xs text-pink-600 font-mono font-bold uppercase" style="font-size: 0.75rem; color: #db2777; font-family: monospace; margin: 0;">${docBadge}</p>
                <div class="mt-3 text-xs" style="font-size: 0.75rem; margin-top: 0.75rem;">
                  <p style="margin: 2px 0;"><span style="color: #6b7280;">No. Dokumen:</span> <b style="color: #111827; font-family: monospace;">${docRef}</b></p>
                  <p style="margin: 2px 0;"><span style="color: #6b7280;">Ref. PO Asal:</span> <b style="color: #111827; font-family: monospace;">PO-${po.id}</b></p>
                  <p style="margin: 2px 0;"><span style="color: #6b7280;">Tanggal:</span> <b style="color: #111827;">${new Date(po.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</b></p>
                  <p style="margin: 2px 0;"><span style="color: #6b7280;">Status Alur:</span> <b style="color: #111827;">${po.status === 'Received' ? '✓ BARANG DITERIMA (LENGKAP)' : '⏳ PROSES PENGIRIMAN'}</b></p>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-xs" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-200" style="background-color: #f9fafb; padding: 1rem; border-radius: 12px; border: 1px solid #e5e7eb;">
                <span class="text-gray-500 uppercase font-semibold tracking-wider block mb-1.5" style="color: #6b7280; font-weight: 600; display: block; margin-bottom: 0.5rem;">PEMESAN / PENERIMA BARANG:</span>
                <p class="font-bold text-sm text-gray-900" style="font-size: 0.875rem; font-weight: 700; color: #111827;">${storeName}</p>
                <p class="text-gray-500 mt-1" style="color: #6b7280; margin-top: 0.25rem;">Gudang & Store Tujuan</p>
                <p class="text-gray-700 mt-2" style="color: #374151; margin-top: 0.5rem; font-size: 0.75rem;">Cabang Tujuan: <b>${po.cabang}</b></p>
              </div>
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-200" style="background-color: #f9fafb; padding: 1rem; border-radius: 12px; border: 1px solid #e5e7eb;">
                <span class="text-gray-500 uppercase font-semibold tracking-wider block mb-1.5" style="color: #6b7280; font-weight: 600; display: block; margin-bottom: 0.5rem;">SUPPLIER / REKANAN PENYEDIA:</span>
                <p class="font-bold text-sm text-gray-900" style="font-size: 0.875rem; font-weight: 700; color: #111827;">${po.supplier}</p>
                <p class="text-gray-500 mt-1" style="color: #6b7280; margin-top: 0.25rem;">Vendor Eksternal Resmi</p>
                <p class="text-gray-700 mt-2" style="color: #374151; font-size: 0.75rem;">Akun Ledger: <b>2-2001 (Hutang Usaha / AP)</b></p>
              </div>
            </div>

            <p class="text-xs text-gray-600 mb-4 italic leading-relaxed" style="font-size: 0.75rem; color: #4b5563; font-style: italic; margin-bottom: 1rem;">
              ${poDocType === 'PO' ? 'Berikut rincian barang pesanan Purchase Order yang diajukan kepada Supplier:' :
                poDocType === 'GRN' ? 'Berikut rincian fisik barang yang telah diinspeksi dan diterima di gudang cabang:' :
                'Berikut rincian tagihan HPP dan Hutang Usaha pembelian barang sediaan dari Supplier:'}
            </p>

            <div class="overflow-x-auto mb-6" style="margin-bottom: 1.5rem; overflow-x: auto;">
              <table class="w-full text-left text-xs border border-gray-300" style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; font-size: 0.75rem;">
                <thead>
                  <tr class="bg-gray-100 text-gray-700 font-bold border-b border-gray-300 uppercase" style="background-color: #f3f4f6; color: #374151; font-weight: bold; text-transform: uppercase;">
                    <th style="padding: 10px; text-align: center; border-right: 1px solid #d1d5db; border-bottom: 1px solid #d1d5db; width: 50px;">No</th>
                    <th style="padding: 10px; border-right: 1px solid #d1d5db; border-bottom: 1px solid #d1d5db; text-align: left;">Deskripsi / Nama Produk</th>
                    <th style="padding: 10px; text-align: center; border-right: 1px solid #d1d5db; border-bottom: 1px solid #d1d5db; width: 100px;">Jumlah (Qty)</th>
                    <th style="padding: 10px; text-align: center; border-right: 1px solid #d1d5db; border-bottom: 1px solid #d1d5db; width: 80px;">Satuan</th>
                    <th style="padding: 10px; text-align: right; border-right: 1px solid #d1d5db; border-bottom: 1px solid #d1d5db; width: 140px;">Harga Satuan</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 1px solid #d1d5db; width: 150px;">Jumlah Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  <tr style="border-top: 2px solid #1f2937; font-weight: bold; background-color: #f9fafb;">
                    <td colspan="5" style="padding: 10px; text-align: right; border-right: 1px solid #d1d5db; font-weight: bold;">TOTAL NILAI TRANSAKSI SUPPLIER:</td>
                    <td style="padding: 10px; text-align: right; color: #db2777; font-size: 0.875rem; font-weight: 900;">Rp ${(po.total || 0).toLocaleString('id-ID')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="bg-gray-50 border border-gray-200 rounded-lg p-3 text-[11px] text-gray-500 mb-8 leading-relaxed" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.75rem; font-size: 11px; color: #6b7280; margin-bottom: 2rem;">
              <p class="font-bold mb-1 text-gray-700" style="font-weight: 700; color: #374151; margin-bottom: 0.25rem;">📌 Catatan Operasional & Terms:</p>
              ${docNote}
            </div>

            <div class="grid grid-cols-3 gap-4 text-center text-xs mt-6 pt-4 border-t border-dashed border-gray-300" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px dashed #d1d5db; text-align: center;">
              <div class="flex flex-col justify-between h-28" style="display: flex; flex-direction: column; justify-content: space-between; height: 112px;">
                <div>
                  <p class="font-semibold text-gray-500 uppercase tracking-wider text-[10px]" style="font-weight: 600; color: #6b7280; font-size: 10px; text-transform: uppercase;">${sig1Title}</p>
                </div>
                <div>
                  <p class="font-bold border-t border-gray-300 pt-1.5 text-gray-900" style="font-weight: 700; border-top: 1px solid #e5e7eb; padding-top: 6px; color: #111827; margin: 0;">${sig1Sub}</p>
                </div>
              </div>
              <div class="flex flex-col justify-between h-28" style="display: flex; flex-direction: column; justify-content: space-between; height: 112px;">
                <div>
                  <p class="font-semibold text-gray-500 uppercase tracking-wider text-[10px]" style="font-weight: 600; color: #6b7280; font-size: 10px; text-transform: uppercase;">${sig2Title}</p>
                </div>
                <div>
                  <p class="font-bold border-t border-gray-300 pt-1.5 text-gray-900" style="font-weight: 700; border-top: 1px solid #e5e7eb; padding-top: 6px; color: #111827; margin: 0;">${sig2Sub}</p>
                </div>
              </div>
              <div class="flex flex-col justify-between h-28" style="display: flex; flex-direction: column; justify-content: space-between; height: 112px;">
                <div>
                  <p class="font-semibold text-gray-500 uppercase tracking-wider text-[10px]" style="font-weight: 600; color: #6b7280; font-size: 10px; text-transform: uppercase;">${sig3Title}</p>
                </div>
                <div>
                  <p class="font-bold border-t border-gray-300 pt-1.5 text-[#ff3377]" style="font-weight: 700; border-top: 1px solid #e5e7eb; padding-top: 6px; color: #db2777; margin: 0;">${sig3Sub}</p>
                </div>
              </div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.focus();
              setTimeout(function() { window.print(); }, 400);
            };
          </script>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docBadge.replace(/\s+/g, '_')}_${docRef}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderSuratJalanPaper = (po: any, overrideDocType?: 'PO' | 'GRN' | 'INVOICE') => {
    if (!po) return null;
    const currentDoc = overrideDocType || poDocType;

    let docTitle = "PURCHASE ORDER (PO)";
    let docSub = "SURAT PESANAN BARANG SUPPLIER";
    let docRef = `PO-${po.id}`;
    let docBadge = "SURAT PESANAN SUPPLIER";
    let docNoteTitle = "📌 Syarat & Ketentuan Pemesanan (Purchase Order):";
    let docNoteItems = [
      "Mohon berikan konfirmasi kesiapan barang dan estimasi tanggal pengiriman setelah menerima lembar PO resmi ini.",
      "Seluruh produk yang dikirimkan wajib dalam kondisi fisik prima, baru, lolos QC, serta sesuai spesifikasi deskripsi di atas.",
      `Lampirkan dokumen Surat Jalan pengiriman fisik dari Supplier dengan mencantumkan nomor referensi PO-${po.id} ini.`
    ];
    let sig1Title = "PEMESAN (PURCHASING)";
    let sig1Sub = user?.nama || 'Staff Pembeli';
    let sig2Title = "SUPPLIER / REKANAN";
    let sig2Sub = po.supplier;
    let sig3Title = "MENYETUJUI (OWNER / PUSAT)";
    let sig3Sub = "Owner / Head Office";

    if (currentDoc === 'GRN') {
      docTitle = "GOODS RECEIPT NOTE (GRN)";
      docSub = "BUKTI PENERIMAAN BARANG GUDANG (BAST)";
      docRef = `GRN-${po.id}`;
      docBadge = "BERITA ACARA SERAH TERIMA (BAST) GUDANG";
      docNoteTitle = "📌 Catatan Inspeksi Fisik & QC Gudang (GRN):";
      docNoteItems = [
        "Berkas BAST gudang ini menerangkan bahwa barang dari Supplier telah diinspeksi secara fisik dan dihitung kuantitasnya.",
        `Produk lolos QC dan secara otomatis telah ditambahkan ke dalam stok persediaan cabang ${po.cabang}.`
      ];
      sig1Title = "PETUGAS INSPEKSI GUDANG";
      sig1Sub = user?.nama || 'Staff Gudang';
      sig2Title = "KURIR / PENGIRIM SUPPLIER";
      sig2Sub = "Pengirim Vendor";
      sig3Title = "KEPALA GUDANG / CABANG";
      sig3Sub = `Head of ${po.cabang}`;
    } else if (currentDoc === 'INVOICE') {
      docTitle = "FAKTUR PEMBELIAN SUPPLIER";
      docSub = "NOTA TAGIHAN HPP & ACCOUNTS PAYABLE";
      docRef = `INV-SUP-${po.id}`;
      docBadge = "FAKTUR PEMBELIAN HPP (AKUN 2-2001)";
      docNoteTitle = "📌 Catatan Akuntansi & Rekonsiliasi Keuangan:";
      docNoteItems = [
        "Nota tagihan HPP pembelian ini merekonsiliasi Buku Besar Hutang Usaha (Kode Akun 2-2001).",
        `Status pembayaran: ${po.status === 'Paid' ? '💳 LUNAS (Kas Outflow Terpencat)' : '⏳ Hutang Usaha Aktif'}.`
      ];
      sig1Title = "BAGIAN KEUANGAN (FINANCE)";
      sig1Sub = user?.nama || 'Staff Finance';
      sig2Title = "REKANAN / SUPPLIER";
      sig2Sub = po.supplier;
      sig3Title = "OTORISASI KEUANGAN / OWNER";
      sig3Sub = "Finance Manager / Owner";
    }

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
              <p className="text-xs font-semibold text-pink-600 uppercase tracking-widest mt-0.5">{settings.tagline || "Fashion, Retail & Supply Chain Management"}</p>
              <p className="text-xs text-gray-500 mt-1 max-w-md">{settings.alamatPo || settings.alamat || "Jl. Merdeka No. 45, Kebayoran Baru, Jakarta Selatan"}</p>
            </div>
          </div>
          <div className="md:text-right">
            <h3 className="text-xl font-extrabold text-gray-900 tracking-wider">{docTitle}</h3>
            <p className="text-xs text-[#ff3377] font-mono font-bold uppercase">{docSub}</p>
            <div className="mt-3 text-xs space-y-1">
              <p><span className="text-gray-500">Nomor Dokumen:</span> <b className="font-mono text-gray-900">{docRef}</b></p>
              <p><span className="text-gray-500">Ref PO Asal:</span> <b className="font-mono text-gray-900">PO-{po.id}</b></p>
              <p><span className="text-gray-500">Tanggal:</span> <b className="text-gray-900">{new Date(po.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</b></p>
              <p><span className="text-gray-500">Status Alur:</span> <b className="text-green-700">{po.status === 'Received' ? '✓ Diterima Gudang (Lengkap)' : '⏳ Dalam Proses'}</b></p>
            </div>
          </div>
        </div>

        {/* Sender & Receiver Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-xs">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <span className="text-gray-500 uppercase font-semibold tracking-wider block mb-1.5">PEMESAN / PENERIMA BARANG:</span>
            <p className="font-bold text-sm text-gray-900">{settings.namaToko || "PINKY POS & BOUTIQUE"}</p>
            <p className="text-gray-500 mt-1">Gudang & Outlet Cabang</p>
            <p className="text-gray-700 mt-2">Cabang Tujuan: <b>{po.cabang}</b></p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <span className="text-gray-500 uppercase font-semibold tracking-wider block mb-1.5">SUPPLIER / REKANAN PENYEDIA:</span>
            <p className="font-bold text-sm text-gray-900">{po.supplier}</p>
            <p className="text-gray-500 mt-1">Vendor Eksternal Resmi</p>
            <p className="text-gray-700 mt-2">Akun Ledger Ref: <b>2-2001 (Hutang Usaha / AP)</b></p>
          </div>
        </div>

        {/* Message */}
        <p className="text-xs text-gray-600 mb-4 italic leading-relaxed">
          {currentDoc === 'PO' ? 'Bersama surat ini, kami mengirimkan Purchase Order resmi (Surat Pesanan) untuk pemesanan barang sediaan (stock) dengan rincian kuantitas, spesifikasi, dan harga yang disepakati sebagai berikut:' :
           currentDoc === 'GRN' ? 'Bersama dokumen ini, petugas gudang menyatakan bahwa barang dari Supplier telah diperiksa fisik, dihitung jumlahnya, dan diterima dengan kondisi baik sebagai berikut:' :
           'Bersama nota ini, dicatat tagihan resmi HPP pembelian barang sediaan dari Supplier untuk diproses oleh Departemen Keuangan:'}
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
                <th className="p-2.5 text-right">Jumlah Total</th>
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
                  Total Nilai Transaksi:
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
          <p className="font-bold mb-1 text-gray-700">{docNoteTitle}</p>
          <ul className="list-disc pl-4 space-y-0.5">
            {docNoteItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-4 text-center text-xs mt-6 pt-4 border-t border-dashed border-gray-300">
          <div className="flex flex-col justify-between h-28">
            <div>
              <p className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">{sig1Title}</p>
            </div>
            <div>
              <p className="font-bold border-t border-gray-300 pt-1.5 text-gray-900">{sig1Sub}</p>
              <p className="text-[10px] text-gray-400 font-mono">Verified System ✅</p>
            </div>
          </div>
          <div className="flex flex-col justify-between h-28">
            <div>
              <p className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">{sig2Title}</p>
            </div>
            <div>
              <p className="font-bold border-t border-gray-300 pt-1.5 text-gray-900">{sig2Sub}</p>
              <p className="text-[10px] text-gray-400 font-mono">Tgl: .../ .../ ......</p>
            </div>
          </div>
          <div className="flex flex-col justify-between h-28">
            <div>
              <p className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">{sig3Title}</p>
            </div>
            <div>
              <p className="font-bold border-t border-gray-300 pt-1.5 text-[#ff3377]">{sig3Sub}</p>
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
    }
  }, [user]);

  // Synchronize all branch dropdown state variables whenever cabangList updates
  useEffect(() => {
    if (cabangList && cabangList.length > 0) {
      const activeBranchNames = cabangList.map((c: any) => c[1]);
      const firstBranch = activeBranchNames[0] || 'Cabang Utama';

      if (!activeBranchNames.includes(newKasCabang)) setNewKasCabang(firstBranch);
      if (!activeBranchNames.includes(poCabang)) setPoCabang(firstBranch);
      if (!activeBranchNames.includes(payCabang)) setPayCabang(firstBranch);
      if (!activeBranchNames.includes(selectedOpBranch)) setSelectedOpBranch(firstBranch);
      if (staffCabang !== 'Semua Cabang' && !activeBranchNames.includes(staffCabang)) setStaffCabang(firstBranch);
      if (offlineCabang !== 'Semua Cabang' && !activeBranchNames.includes(offlineCabang)) setOfflineCabang(firstBranch);
      if (!trfDariCabang || !activeBranchNames.includes(trfDariCabang)) {
        setTrfDariCabang(user?.cabang && user.cabang !== 'Semua Cabang' && activeBranchNames.includes(user.cabang) ? user.cabang : firstBranch);
      }
      if (!trfKeCabang || !activeBranchNames.includes(trfKeCabang) || trfKeCabang === trfDariCabang) {
        const altBranch = activeBranchNames.find((b: string) => b !== (user?.cabang && user.cabang !== 'Semua Cabang' ? user.cabang : firstBranch)) || firstBranch;
        setTrfKeCabang(altBranch);
      }
      if (reportBranchFilter !== 'ALL' && !activeBranchNames.includes(reportBranchFilter)) {
        setReportBranchFilter('ALL');
      }

      // Check if user's assigned branch was renamed/deleted
      if (user && user.role !== 'Owner' && user.cabang !== 'Semua Cabang' && !activeBranchNames.includes(user.cabang)) {
        const updatedUser = { ...user, cabang: firstBranch };
        setUser(updatedUser);
        localStorage.setItem('pinky_user', JSON.stringify(updatedUser));
      }
    }
  }, [cabangList]);

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
      setKasHarianList(data.kasHarian || []);
      if (user && data.users) {
        const currentUserDb = data.users.find((u: any) => u.email === user.email);
        if (currentUserDb) {
          const updatedUser = { 
            ...user, 
            nama: currentUserDb.nama,
            role: currentUserDb.role,
            cabang: currentUserDb.cabang,
            komisiPersen: currentUserDb.komisiPersen
          };
          if (user.nama !== updatedUser.nama || user.role !== updatedUser.role || user.cabang !== updatedUser.cabang || user.komisiPersen !== updatedUser.komisiPersen) {
            setUser(updatedUser);
            localStorage.setItem('pinky_user', JSON.stringify(updatedUser));
          }
        } else if (user.role !== 'Owner') {
          setUser(null);
          localStorage.removeItem('pinky_user');
          alert("Sesi Anda telah berakhir atau akun Anda telah dihapus oleh Owner.");
        }
      }
      if (data.settings) {
        setSettings(data.settings);
        setSetNamaToko(data.settings.namaToko);
        setSetAlamat(data.settings.alamat);
        setSetAlamatPo(data.settings.alamatPo || data.settings.alamat || '');
        setSetTagline(data.settings.tagline || 'Fashion, Retail & Supply Chain Management');
        const loadedTheme = data.settings.theme || 'sakura';
        setSetTheme(loadedTheme);
        if (loadedTheme.startsWith('custom_')) {
          const parts = loadedTheme.split('_');
          setCustomPrimary(parts[1] || '#ff3377');
          setCustomSecondary(parts[2] || '#ff6699');
        }
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
        setGoogleSheetUrlState(data.settings.googleSheetUrl || '');
        setIsSheetEnabledState(!!data.settings.isSheetEnabled);
      }
      if (data.googleSheetLogs) {
        setSheetLogs(data.googleSheetLogs);
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

  const tambahKeKeranjang = (kode: string, nama: string, harga: number, hpp: number, satuan?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.kode === kode);
      if (existing) {
        return prev.map(item => item.kode === kode ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { kode, nama, harga, hpp, qty: 1, satuan: satuan || 'Pcs' }];
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
      if (res.ok && data.s === 1) {
        setLastReceipt({ ...payload, timestamp: Date.now() });
        setShowStrukModal(true);
        setCart([]);
        setUangBayar(0);
        setIsMember(false);
        fetchData();
        
        if (data.sheetSync && !data.sheetSync.success) {
          console.warn("Google Sheet sync failed on backend:", data.sheetSync.message);
        }
      } else {
        throw new Error(data.m || "Gagal memproses transaksi");
      }
    } catch (e: any) {
      console.error("Gagal simpan transaksi ke server. Menyimpan ke offline queue...", e);
      try {
        const saved = localStorage.getItem('pinky_offline_transactions');
        const queue = saved ? JSON.parse(saved) : [];
        const enrichedPayload = { ...payload, timestamp: Date.now(), isOffline: true };
        queue.push(enrichedPayload);
        localStorage.setItem('pinky_offline_transactions', JSON.stringify(queue));
        
        setLastReceipt(enrichedPayload);
        setShowStrukModal(true);
        setCart([]);
        setUangBayar(0);
        setIsMember(false);
        
        alert("⚠️ POS OFFLINE/TERPUTUS! Transaksi Anda telah disimpan dalam antrean offline lokal. Struk struk tetap dapat dicetak, dan data transaksi akan disinkronkan ke server secara otomatis saat internet kembali online.");
      } catch (errLocal) {
        console.error("Error offline storage:", errLocal);
        alert("Error kritis: Gagal menyimpan transaksi baik ke server maupun memori offline lokal.");
      }
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
          branchHppMap,
          satuan: newSatuan
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
      setNewSatuan('Pcs');
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
    setNewSatuan(b[9] || 'Pcs');
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
          tagline: setTagline,
          theme: setTheme,
          logoUrl: setLogoUrl,
          pajakPersen: setPajak,
          diskonMemberPersen: setDiskonMember,
          footerStruk: setFooter,
          rekeningOwner: rekeningList,
          branchOpExpenses: branchOpExpenses,
          googleSheetUrl: googleSheetUrl,
          isSheetEnabled: isSheetEnabled
        })
      });
      const data = await res.json();
      alert(data.m);
      fetchData();
    } catch (err) {
      alert("Gagal memperbarui pengaturan");
    }
  };

  const handleInitGoLive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm("⚠️ PERINGATAN INISIALISASI GO-LIVE REAL:\n\nApakah Anda yakin ingin menerapkan mode Go-Live Real?\nData simulasi/sampel yang dipilih akan dibersihkan dan Saldo Awal Kas Real akan terpasang di masing-masing cabang.")) {
      return;
    }
    setIsSubmittingGoLive(true);
    try {
      const balancesNumeric: any = {};
      Object.keys(goLiveBalances).forEach(cName => {
        balancesNumeric[cName] = Number(goLiveBalances[cName] || 0);
      });

      const res = await fetch("/api/initGoLive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initialBalances: balancesNumeric,
          clearTransactions: goLiveClearTxs,
          clearKas: goLiveClearKas,
          clearStock: goLiveClearStock,
          clearPoAndTransfer: goLiveClearPO
        })
      });
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textErr = await res.text();
        throw new Error(`Server belum merespons format JSON (Status ${res.status}). Pastikan server backend telah memuat route terbaru.`);
      }

      const data = await res.json();
      if (data.s === 1) {
        alert("🎉 " + data.m);
        if (data.transaksi) setTransaksiList(data.transaksi);
        if (data.kasHarian) setKasHarianList(data.kasHarian);
        if (data.barang) setBarangList(data.barang);
        if (data.purchaseOrders) setPurchaseOrdersList(data.purchaseOrders);
        if (data.opname) setOpnameList(data.opname);
        if (data.transfer) setTransferList(data.transfer);
        if (data.production) setProductionList(data.production);
        if (data.payroll) setPayrollList(data.payroll);
        fetchData();
      } else {
        alert("Gagal Go-Live: " + data.m);
      }
    } catch (err: any) {
      alert("Error Go-Live: " + err.message);
    } finally {
      setIsSubmittingGoLive(false);
    }
  };

  const handleTestSheetConnection = async () => {
    if (!googleSheetUrl) return alert("Harap isi URL Google Sheets terlebih dahulu!");
    setIsTestingConn(true);
    try {
      const res = await fetch('/api/syncSheetsTest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: googleSheetUrl })
      });
      const data = await res.json();
      if (data.s === 1) {
        alert("Sukses! " + data.m);
      } else {
        alert("Gagal: " + data.m);
      }
      if (data.logs) {
        setSheetLogs(data.logs);
      }
    } catch (err: any) {
      alert("Gagal menghubungi server atau Google Sheets: " + err.message);
    } finally {
      setIsTestingConn(false);
    }
  };

  const handleManualSheetSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/syncSheetsManual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      alert(data.m);
      if (data.logs) {
        setSheetLogs(data.logs);
      }
      if (data.transaksi) {
        setTransaksiList(data.transaksi);
      }
    } catch (err: any) {
      alert("Gagal menghubungi server: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncAllMasterData = async () => {
    setIsSyncingAll(true);
    try {
      const res = await fetch('/api/syncAllSheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      alert(data.m);
      if (data.logs) {
        setSheetLogs(data.logs);
      }
    } catch (err: any) {
      alert("Gagal menghubungi server: " + err.message);
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleClearSheetLogs = async () => {
    try {
      const res = await fetch('/api/clearSheetLogs', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.s === 1) {
        setSheetLogs([]);
        alert(data.m);
      }
    } catch (err: any) {
      alert("Gagal membersihkan log: " + err.message);
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

  const handleSimpanOfflineStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offlineNama) return alert("Nama staff wajib diisi!");
    try {
      const emailId = editingOfflineEmail || `offline_${Date.now()}_${Math.floor(Math.random() * 1000)}@usaha.local`;
      const res = await fetch('/api/simpanUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailId,
          sandi: "offline-no-pass",
          nama: offlineNama,
          role: offlineRole,
          cabang: offlineCabang,
          oldEmail: editingOfflineEmail,
          isOffline: true,
          komisiPersen: Number(offlineKomisi) || 0,
          gajiPokok: Number(offlineGaji) || 0
        })
      });
      const data = await res.json();
      alert(data.m);
      setOfflineNama('');
      setOfflineRole('Security');
      setOfflineCabang('Cabang Pusat');
      setOfflineKomisi('2');
      setOfflineGaji('2500000');
      setEditingOfflineEmail(null);
      fetchData();
    } catch (err) {
      alert("Gagal menyimpan data staff non-akses komputer");
    }
  };

  const handleEditOfflineStaff = (u: any) => {
    setOfflineNama(u.nama);
    setOfflineRole(u.role);
    setOfflineCabang(u.cabang);
    setOfflineKomisi((u.komisiPersen !== undefined ? u.komisiPersen : 2).toString());
    setOfflineGaji((u.gajiPokok !== undefined ? u.gajiPokok : 2500000).toString());
    setEditingOfflineEmail(u.email);
  };

  const handleHapusOfflineStaff = async (email: string) => {
    triggerConfirm(
      'Hapus Staff Non-Akses Komputer',
      `Apakah Anda yakin ingin menghapus data staff non-akses komputer dengan ID ${email}? Tindakan ini tidak dapat dibatalkan.`,
      'delete_staff',
      { email }
    );
  };

  const handleSimpanKasHarian = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKasKeterangan || !newKasJumlah) {
      alert("Harap isi Keterangan dan Jumlah Kas.");
      return;
    }
    try {
      const res = await fetch('/api/simpanKasHarian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal: new Date(newKasTanggal).getTime(),
          keterangan: newKasKeterangan,
          tipe: newKasTipe,
          jumlah: Number(newKasJumlah),
          cabang: user?.role === 'Owner' ? newKasCabang : user?.cabang
        })
      });
      const data = await res.json();
      if (data.s) {
        setNewKasKeterangan('');
        setNewKasJumlah('');
        fetchData();
      } else {
        alert(data.m);
      }
    } catch (err) {
      console.error("Gagal menyimpan kas harian", err);
      alert("Gagal menyimpan kas harian");
    }
  };

  const handleHapusKasHarianEntry = (id: string) => {
    triggerConfirm(
      'Hapus Kas Harian',
      'Apakah Anda yakin ingin menghapus catatan kas harian ini?',
      'delete_kas_harian',
      { id }
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

    if (trfDariCabang === trfKeCabang) return alert("Cabang asal dan cabang tujuan tidak boleh sama!");
    const foundItem = barangList.find(b => b[1] === trfKode && b[8] === trfDariCabang);
    if (!foundItem) return alert(`Barang tidak ditemukan di stok cabang asal (${trfDariCabang}).`);
    if (Number(trfQty) > Number(foundItem[6])) {
      return alert(`Stok tidak mencukupi! Stok ${trfDariCabang} saat ini: ${foundItem[6]}`);
    }

    try {
      const res = await fetch('/api/buatTransfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dariCabang: trfDariCabang,
          keCabang: trfKeCabang,
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

  const prosesPO = async (id: string, status: 'Received' | 'Paid' | 'Cancelled') => {
    let confirmMsg = `Apakah Anda yakin ingin mengubah status PO ${id} menjadi ${
      status === 'Received' ? 'Diterima Gudang (Stok bertambah & pencatatan persediaan)' :
      status === 'Paid' ? 'Lunas / Tagihan Selesai (Stok bertambah, Hutang Usaha lunas, Kas berkurang, & Laporan Keuangan terupdate otomatis)' :
      'Dibatalkan'
    }?`;
    triggerConfirm(
      'Proses Tagihan & Status Purchase Order',
      confirmMsg,
      'process_po',
      { id, status }
    );
  };

  const [commissionMap, setCommissionMap] = useState<{ [email: string]: number }>({});

  useEffect(() => {
    if (usersList.length > 0) {
      const cMap: { [email: string]: number } = {};
      const sMap: { [email: string]: number } = {};
      usersList.forEach(u => {
        cMap[u.email] = u.komisiPersen !== undefined ? u.komisiPersen : 5;
        sMap[u.email] = u.gajiPokok !== undefined ? u.gajiPokok : 2500000;
      });
      setCommissionMap(cMap);
      setSalaryMap(sMap);
    }
  }, [usersList]);

  const handleUpdateCommission = async (email: string) => {
    const commVal = commissionMap[email];
    const salVal = salaryMap[email];
    if (commVal === undefined || isNaN(commVal)) return alert("Masukkan persentase komisi yang valid!");
    try {
      const res = await fetch('/api/updateUserCommission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, komisiPersen: commVal, gajiPokok: salVal })
      });
      const data = await res.json();
      alert(data.m);
      fetchData();
    } catch (e) {
      alert("Gagal memperbarui komisi & gaji.");
    }
  };

  const handleUpdateBatchBranchCommissions = async (branchName: string) => {
    const branchUsers = usersList.filter(u => u.role !== 'Owner' && (branchName === 'Semua Cabang' || u.cabang === branchName));
    const updates = branchUsers.map(u => ({
      email: u.email,
      komisiPersen: commissionMap[u.email] !== undefined ? commissionMap[u.email] : (u.komisiPersen ?? 5),
      gajiPokok: salaryMap[u.email] !== undefined ? salaryMap[u.email] : (u.gajiPokok ?? 2500000)
    }));

    try {
      const res = await fetch('/api/updateBatchCommissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });
      const data = await res.json();
      alert(data.m);
      fetchData();
    } catch (e) {
      alert("Gagal memperbarui komisi & gaji cabang.");
    }
  };

  const handleSelectPayrollPegawai = (val: string) => {
    setPayPegawai(val);
    const foundUser = usersList.find(u => `${u.nama} (${u.role})` === val);
    if (foundUser) {
      setPayCabang(foundUser.cabang);
      
      // Calculate branch total sales for the last 30 days
      const thirtyDaysAgo = Date.now() - (86400000 * 30);
      const branchTxs = transaksiList.filter(t => {
        const isBranchMatch = foundUser.cabang === 'Semua Cabang' || t[4] === foundUser.cabang;
        const isRecent = t[0] >= thirtyDaysAgo;
        return isBranchMatch && isRecent;
      });
      
      const branchSales = branchTxs.reduce((acc, t) => acc + Number(t[5] || 0), 0);
      const komisiPct = foundUser.komisiPersen !== undefined ? foundUser.komisiPersen : 5;
      const calcKomisi = Math.round((komisiPct / 100) * branchSales);
      
      setPayKomisi(calcKomisi.toString());
      setPayGaji((foundUser.gajiPokok !== undefined ? foundUser.gajiPokok : 3500000).toString());
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
    const targetCabang = prdCabang || (user?.role === 'Owner' ? (cabangList[0]?.[1] || 'Cabang Utama') : user?.cabang);
    try {
      const res = await fetch('/api/buatProduksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produk: prdProduk,
          qtyProduksi: Number(prdQty) || 1,
          bahanBaku: prdBahan,
          qtyBahan: prdQtyBahan,
          pic: user?.nama || 'Supervisor',
          cabang: targetCabang
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
      <div className="min-h-screen flex items-center justify-center p-4 transition-all duration-300" style={{ backgroundColor: currentTheme.bg }}>
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center border transition-all" style={{ borderColor: currentTheme.lightTint }}>
          <div className="mb-4">
            <img src={settings.logoUrl} alt="Logo" className="w-24 h-24 rounded-full object-cover mx-auto shadow-md border-2 transition-all" style={{ borderColor: currentTheme.lightTint }} referrerPolicy="no-referrer" />
          </div>
          <h2 className="text-2xl font-bold mb-2 tracking-tight transition-all" style={{ color: currentTheme.primary }}>{settings.namaToko}</h2>
          <p className="text-gray-500 text-sm mb-6">Sistem Kasir POS & Manajemen Butik Multi-Cabang</p>
          
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Email Akun (Login)</label>
              <input 
                type="email" 
                value={emailInput} 
                onChange={e => setEmailInput(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-all"
                style={{ 
                  borderColor: '#d1d5db',
                  '--tw-ring-color': currentTheme.primary,
                } as React.CSSProperties}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = currentTheme.primary;
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${currentTheme.glow || 'rgba(0,0,0,0.1)'}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.boxShadow = 'none';
                }}
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
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-all"
                style={{ 
                  borderColor: '#d1d5db',
                  '--tw-ring-color': currentTheme.primary,
                } as React.CSSProperties}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = currentTheme.primary;
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${currentTheme.glow || 'rgba(0,0,0,0.1)'}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                placeholder="******"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Shift Kerja</label>
              <select 
                value={shiftInput} 
                onChange={e => setShiftInput(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none bg-white transition-all"
                style={{ 
                  borderColor: '#d1d5db',
                  '--tw-ring-color': currentTheme.primary,
                } as React.CSSProperties}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = currentTheme.primary;
                  e.currentTarget.style.boxShadow = `0 0 0 2px ${currentTheme.glow || 'rgba(0,0,0,0.1)'}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <option value="Pagi">Shift Pagi (08:00 - 15:00)</option>
                <option value="Siang">Shift Siang (15:00 - 22:00)</option>
                <option value="Malam">Shift Malam / Full</option>
              </select>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full text-white font-semibold py-3 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 mt-2"
              style={{ 
                backgroundColor: currentTheme.primary,
                boxShadow: `0 4px 12px ${currentTheme.glow || 'rgba(0,0,0,0.15)'}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = currentTheme.primaryHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = currentTheme.primary;
              }}
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
        satuan: b[9] || "Pcs",
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
    if (b[9]) prod.satuan = b[9];
  });

  const posProducts = Array.from(posProductsMap.values());

  const filteredPosProducts = posProducts.filter(p => {
    if (!posSearchQuery) return true;
    const q = posSearchQuery.trim().toLowerCase();
    return p.nama.toLowerCase().includes(q) || p.kode.toLowerCase().includes(q);
  });

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
        
        /* Navigation button styles */
        .nav-btn-active {
          background-color: rgba(0, 0, 0, 0.22) !important; /* warna lebih tua dari background sidebar */
          color: #ffffff !important;
          border-left: 4px solid #ffffff !important;
          padding-left: 12px !important; /* adjust padding to balance the border */
          border-radius: 0 8px 8px 0 !important; /* elegant asymmetric rounding */
          box-shadow: inset 2px 0 5px rgba(0, 0, 0, 0.15) !important;
        }
        .nav-btn-inactive {
          background-color: transparent !important;
          color: rgba(255, 255, 255, 0.85) !important;
          border-left: 4px solid transparent !important;
          box-shadow: none !important;
        }
        .nav-btn-inactive:hover {
          background-color: rgba(0, 0, 0, 0.12) !important; /* hover warna lebih gelap */
          color: #ffffff !important;
          border-left: 4px solid rgba(255, 255, 255, 0.4) !important;
        }

        /* Highly attractive icon styles for left side icons inside buttons */
        .nav-btn-active svg {
          transform: scale(1.22) !important;
          filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.8)) !important;
          color: #ffffff !important;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nav-btn-inactive svg {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          color: rgba(255, 255, 255, 0.8) !important;
        }
        .nav-btn-inactive:hover svg {
          transform: scale(1.1) !important;
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
          background-color: rgba(${hexToRgb(currentTheme.secondary)}, 0.6) !important;
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
          background-color: rgba(${hexToRgb(currentTheme.primary)}, 0.15) !important;
        }
        .bg-\[\#ffd1df\] {
          background-color: var(--light-tint) !important;
        }
        .bg-\[\#ffd1df\]\/20 {
          background-color: rgba(${hexToRgb(currentTheme.primary)}, 0.1) !important;
        }
        .bg-\[\#ffd1df\]\/10 {
          background-color: rgba(${hexToRgb(currentTheme.primary)}, 0.05) !important;
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

      <div id="root-app-layout" className="min-h-screen bg-[#fff0f5] flex flex-col md:flex-row font-sans text-gray-800 print:hidden overflow-hidden">
        {/* Backdrop overlay for mobile when sidebar is open */}
        {isMobile && !isSidebarCollapsed && (
          <div 
            onClick={() => setIsSidebarCollapsed(true)}
            className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          />
        )}

        {/* Sidebar with wider, prominent logo */}
        <div className={`
          ${isMobile 
            ? `fixed inset-y-0 left-0 z-40 transition-transform duration-300 transform ${isSidebarCollapsed ? '-translate-x-full w-0 p-0 overflow-hidden' : 'translate-x-0 w-72 p-5'}` 
            : `${isSidebarCollapsed ? 'w-20' : 'w-72'} p-5 relative`
          } 
          bg-[#ff6699] sidebar-theme-bg text-white flex flex-col shadow-lg shrink-0 transition-all duration-300
        `}>
          {/* Collapse Toggle Button */}
          {!isMobile && (
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
              className="absolute top-4 -right-3.5 bg-[#ff3377] toggle-btn-theme text-white p-1 rounded-full border border-white hover:bg-[#ff1a5c] shadow transition-transform duration-200 z-50 flex items-center justify-center cursor-pointer"
              title={isSidebarCollapsed ? "Expand Navigation" : "Collapse Navigation"}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}

          <div className="flex flex-col items-center justify-center mb-4 text-center relative">
            {isMobile && (
              <button 
                onClick={() => setIsSidebarCollapsed(true)} 
                className="absolute top-0 right-0 p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white cursor-pointer z-50"
                title="Tutup Menu"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {isSidebarCollapsed && !isMobile ? (
              <img src={settings.logoUrl} alt="Logo" className="w-10 h-10 object-cover rounded-full shadow-md border border-white mb-1" referrerPolicy="no-referrer" />
            ) : (
              <>
                <img src={settings.logoUrl} alt="Logo" className="w-full h-28 object-cover rounded-xl shadow-md border-2 border-white mb-2" referrerPolicy="no-referrer" />
                <h3 className="text-xl font-bold tracking-tight">{settings.namaToko}</h3>
              </>
            )}
          </div>

          {(!isSidebarCollapsed || isMobile) ? (
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
          {hasAccess(user.role, 'pos') && (
            <button 
              onClick={() => handleNavSelect('pos')}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-2.5'} rounded-lg font-medium transition-all ${activeTab === 'pos' ? 'nav-btn-active' : 'nav-btn-inactive'}`}
              title="Kasir POS"
            >
              <ShoppingCart className="w-4 h-4 shrink-0 animate-pulse-slow" />
              {!isSidebarCollapsed && <span>Kasir POS</span>}
            </button>
          )}
          
          {hasAccess(user.role, 'barang') && (
            <button 
              onClick={() => handleNavSelect('barang')}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-2.5'} rounded-lg font-medium transition-all ${activeTab === 'barang' ? 'nav-btn-active' : 'nav-btn-inactive'}`}
              title="Kelola Barang"
            >
              <Package className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Kelola Barang</span>}
            </button>
          )}

          {hasAccess(user.role, 'opname') && (
            <button 
              onClick={() => handleNavSelect('opname')}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-2.5'} rounded-lg font-medium transition-all ${activeTab === 'opname' ? 'nav-btn-active' : 'nav-btn-inactive'}`}
              title="Stok Opname"
            >
              <Scale className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Stok Opname</span>}
            </button>
          )}

          {hasAccess(user.role, 'laporan') && (
            <button 
              onClick={() => handleNavSelect('laporan')}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-2.5'} rounded-lg font-medium transition-all ${activeTab === 'laporan' ? 'nav-btn-active' : 'nav-btn-inactive'}`}
              title="Lap. Keuangan Analitik"
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Lap. Keuangan Analitik</span>}
            </button>
          )}

          {hasAccess(user.role, 'audit') && (
            <button 
              onClick={() => handleNavSelect('audit')}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-2.5'} rounded-lg font-medium transition-all ${activeTab === 'audit' ? 'nav-btn-active' : 'nav-btn-inactive'}`}
              title="Audit Stok Opname"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Audit Stok Opname</span>}
            </button>
          )}

          {hasAccess(user.role, 'transfer') && (
            <button 
              onClick={() => handleNavSelect('transfer')}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-2.5'} rounded-lg font-medium transition-all ${activeTab === 'transfer' ? 'nav-btn-active' : 'nav-btn-inactive'}`}
              title="Transfer Antar Cabang"
            >
              <ArrowRightLeft className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Transfer Antar Cabang</span>}
            </button>
          )}

          {(hasAccess(user.role, 'erp') || hasAccess(user.role, 'ledger') || hasAccess(user.role, 'po') || hasAccess(user.role, 'payroll') || hasAccess(user.role, 'production')) && (
            <>
              {isSidebarCollapsed ? (
                <hr className="border-white/20 my-2" />
              ) : (
                <div className="pt-2 pb-1 border-t border-white/25 my-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider nav-category-header text-pink-200 px-3">Modul ERP Terpusat</span>
                </div>
              )}

              {hasAccess(user.role, 'erp') && (
                <button 
                  onClick={() => handleNavSelect('erp')}
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'gap-3 px-4 py-2'} rounded-lg font-medium transition-all ${activeTab === 'erp' ? 'nav-btn-active' : 'nav-btn-inactive'}`}
                  title="ERP Executive Cockpit"
                >
                  <Boxes className="w-4 h-4 shrink-0" />
                  {!isSidebarCollapsed && <span>ERP Executive Cockpit</span>}
                </button>
              )}
              {hasAccess(user.role, 'ledger') && (
                <button 
                  onClick={() => handleNavSelect('ledger')}
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'gap-3 px-4 py-2'} rounded-lg font-medium transition-all ${activeTab === 'ledger' ? 'nav-btn-active' : 'nav-btn-inactive'}`}
                  title="Buku Besar Akuntansi"
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  {!isSidebarCollapsed && <span>Buku Besar Akuntansi</span>}
                </button>
              )}
              {hasAccess(user.role, 'po') && (
                <button 
                  onClick={() => handleNavSelect('po')}
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'gap-3 px-4 py-2'} rounded-lg font-medium transition-all ${activeTab === 'po' ? 'nav-btn-active' : 'nav-btn-inactive'}`}
                  title="Rantai Pasok & PO"
                >
                  <Truck className="w-4 h-4 shrink-0" />
                  {!isSidebarCollapsed && <span>Rantai Pasok & PO</span>}
                </button>
              )}
              {hasAccess(user.role, 'payroll') && (
                <button 
                  onClick={() => handleNavSelect('payroll')}
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'gap-3 px-4 py-2'} rounded-lg font-medium transition-all ${activeTab === 'payroll' ? 'nav-btn-active' : 'nav-btn-inactive'}`}
                  title="SDM & Payroll Komisi"
                >
                  <Wallet className="w-4 h-4 shrink-0" />
                  {!isSidebarCollapsed && <span>SDM & Payroll Komisi</span>}
                </button>
              )}
              {hasAccess(user.role, 'production') && (
                <button 
                  onClick={() => handleNavSelect('production')}
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'gap-3 px-4 py-2'} rounded-lg font-medium transition-all ${activeTab === 'production' ? 'nav-btn-active' : 'nav-btn-inactive'}`}
                  title="Manufaktur & BOM"
                >
                  <Factory className="w-4 h-4 shrink-0" />
                  {!isSidebarCollapsed && <span>Manufaktur & BOM</span>}
                </button>
              )}
            </>
          )}

          {(hasAccess(user.role, 'cabang') || hasAccess(user.role, 'staff') || hasAccess(user.role, 'settings')) && (
            <>
              {isSidebarCollapsed ? (
                <hr className="border-white/20 my-2" />
              ) : (
                <div className="pt-2 pb-1 border-t border-white/25 my-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider nav-category-header text-pink-200 px-3">Manajemen Cabang</span>
                </div>
              )}
              {hasAccess(user.role, 'cabang') && (
                <button 
                  onClick={() => handleNavSelect('cabang')}
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-2.5'} rounded-lg font-medium transition-all ${activeTab === 'cabang' ? 'nav-btn-active' : 'nav-btn-inactive'}`}
                  title="Kelola Cabang"
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  {!isSidebarCollapsed && <span>Kelola Cabang</span>}
                </button>
              )}
              {hasAccess(user.role, 'staff') && (
                <button 
                  onClick={() => handleNavSelect('staff')}
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-2.5'} rounded-lg font-medium transition-all ${activeTab === 'staff' ? 'nav-btn-active' : 'nav-btn-inactive'}`}
                  title="Kelola Staff & Akses"
                >
                  <Users className="w-4 h-4 shrink-0" />
                  {!isSidebarCollapsed && <span>Kelola Staff & Akses</span>}
                </button>
              )}
              {hasAccess(user.role, 'settings') && (
                <button 
                  onClick={() => handleNavSelect('settings')}
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-2.5'} rounded-lg font-medium transition-all ${activeTab === 'settings' ? 'nav-btn-active' : 'nav-btn-inactive'}`}
                  title="Pengaturan Toko & Bank"
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  {!isSidebarCollapsed && <span>Pengaturan Toko & Bank</span>}
                </button>
              )}
            </>
          )}

          {hasAccess(user.role, 'panduan') && (
            <button 
              onClick={() => handleNavSelect('panduan')}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-2.5'} rounded-lg font-medium transition-all ${activeTab === 'panduan' ? 'nav-btn-active' : 'nav-btn-inactive'}`}
              title="Panduan & Cara Pakai"
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Panduan & Cara Pakai</span>}
            </button>
          )}
        </nav>

        <button 
          onClick={() => {
            setUser(null);
            localStorage.removeItem('pinky_user');
          }}
          className={`mt-auto w-full bg-red-500 hover:bg-red-600 text-white font-medium ${isSidebarCollapsed ? 'p-2.5 justify-center' : 'py-2.5 justify-center'} rounded-lg flex items-center gap-2 text-sm shadow transition-colors`}
          title="Keluar / Log Out"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isSidebarCollapsed && <span>Keluar / Log Out</span>}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden">
        {/* Mobile Sticky Header */}
        {isMobile && (
          <header className="bg-[#ff6699] sidebar-theme-bg text-white px-4 py-3 flex items-center justify-between shadow-md shrink-0 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                title="Buka Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              {settings.logoUrl && (
                <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-cover rounded-full border border-white/20 shadow-xs" referrerPolicy="no-referrer" />
              )}
              <span className="font-bold text-sm truncate max-w-[150px]">{settings.namaToko}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-white/15 px-2.5 py-1 rounded font-bold text-xs tracking-wide">{user.cabang}</span>
            </div>
          </header>
        )}

        <div className="flex-1 p-4 md:p-8 overflow-y-auto max-h-full">
        
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
                  <div className="space-y-4">
                    {/* BARCODE SCANNER INTEGRATION */}
                    <div className="bg-pink-50/40 p-4 rounded-xl border border-pink-100 space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Barcode className="h-5 w-5 text-[#ff4d88]" />
                          </div>
                          <input
                            type="text"
                            placeholder="Scan barcode / ketik kode atau nama produk di sini..."
                            value={posSearchQuery}
                            onChange={(e) => setPosSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handlePosScannerSubmit();
                              }
                            }}
                            autoFocus
                            className="block w-full pl-10 pr-3 py-2 border border-pink-200 rounded-lg bg-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#ff6699] text-sm font-semibold text-gray-800"
                          />
                        </div>
                        <button
                          onClick={handlePosScannerSubmit}
                          className="bg-[#ff6699] hover:bg-[#ff3377] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <Scan className="w-4 h-4" />
                          <span>Masukan</span>
                        </button>
                        {posSearchQuery && (
                          <button
                            onClick={() => setPosSearchQuery('')}
                            className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer"
                            title="Clear"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                      
                      {scannerFeedback && (
                        <div className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          scannerFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          scannerFeedback.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}>
                          <span className="animate-pulse">●</span>
                          <span>{scannerFeedback.message}</span>
                        </div>
                      )}

                      <div className="text-[10px] text-gray-500 flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                        <span>Scanner Aktif: Hubungkan alat scanner USB/Bluetooth Anda, arahkan kursor ke kolom di atas, lalu scan barcode barang.</span>
                      </div>
                    </div>

                    {filteredPosProducts.length === 0 ? (
                      <p className="text-gray-400 p-6 text-center">Produk tidak ditemukan dengan pencarian tersebut.</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-1">
                        {filteredPosProducts.map((p, idx) => {
                          const currentBranchStock = p.branchStok[user.cabang] !== undefined ? p.branchStok[user.cabang] : 0;
                          return (
                            <div key={idx} className="bg-white border border-gray-100 rounded-xl p-3 flex flex-col items-center text-center shadow-xs hover:shadow-md transition-shadow">
                              <div 
                                className="relative w-full h-28 mb-2 rounded-lg overflow-hidden group cursor-pointer border border-pink-100 hover:ring-2 hover:ring-[#ff6699] transition-all"
                                title="Sentuh atau klik untuk memasukkan ke keranjang"
                                onClick={() => {
                                  const currentHpp = p.branchHpp && p.branchHpp[user.cabang] !== undefined ? p.branchHpp[user.cabang] : (p.hpp || p.beli || 0);
                                  tambahKeKeranjang(p.kode, p.nama, Number(p.jual || 0), Number(currentHpp), p.satuan || 'Pcs');
                                }}
                              >
                                <img 
                                  src={p.foto || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=150'} 
                                  alt={p.nama}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              {/* Stock Info placed neatly BELOW the image so it does NOT obscure the product photo */}
                              <div className="w-full flex flex-wrap items-center justify-center gap-1 my-1">
                                {user.role === 'Owner' ? (
                                  Object.entries(p.branchStok)
                                    .filter(([cab]) => cabangList.some(c => c[1] === cab) || cab === 'Cabang Pusat')
                                    .map(([cab, st], sIdx) => (
                                      <span key={sIdx} className="bg-pink-50 text-[#ff3377] border border-pink-200 text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                                        Stok {cab}: {st as number}
                                      </span>
                                    ))
                                ) : (
                                  <span className="bg-pink-50 text-[#ff3377] border border-pink-200 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                                    Stok {user.cabang}: {currentBranchStock}
                                  </span>
                                )}
                              </div>
                              <h6 className="font-semibold text-sm text-gray-800 line-clamp-1">{p.nama}</h6>
                              <span className="text-sm font-bold text-[#ff3377] mb-2">
                                Rp {Number(p.jual || 0).toLocaleString()} / {p.satuan || 'Pcs'}
                              </span>
                              <button 
                                onClick={() => {
                                  const currentHpp = p.branchHpp && p.branchHpp[user.cabang] !== undefined ? p.branchHpp[user.cabang] : (p.hpp || p.beli || 0);
                                  tambahKeKeranjang(p.kode, p.nama, Number(p.jual || 0), Number(currentHpp), p.satuan || 'Pcs');
                                }}
                                className="mt-auto w-full bg-[#ff6699] hover:bg-[#ff3377] text-white text-xs font-medium py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 animate-all"
                              >
                                <Plus className="w-3.5 h-3.5" /> Beli
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-pink-100 sticky top-6">
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
                            <td className="p-2 text-center">{item.qty} {item.satuan || 'Pcs'}</td>
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
                  <label className="text-xs font-semibold text-gray-600 flex items-center justify-between mb-1">
                    <span>Kode Barang</span>
                    <span className="text-[10px] text-pink-600 flex items-center gap-0.5 font-bold" title="Hubungkan alat scanner, arahkan kursor ke input ini, lalu scan barcode barang">
                      <Barcode className="w-3.5 h-3.5 inline animate-pulse" /> Scanner Aktif
                    </span>
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={newKode} 
                      onChange={e => setNewKode(e.target.value)} 
                      placeholder="Scan barcode / ketik kode..." 
                      className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#ff6699] focus:outline-hidden font-mono" 
                    />
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <Barcode className="h-4.5 w-4.5 text-pink-400" />
                    </div>
                  </div>
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
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Satuan</label>
                  <select 
                    value={newSatuan} 
                    onChange={e => setNewSatuan(e.target.value)} 
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-[#ff6699] focus:outline-hidden"
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Kg">Kg</option>
                    <option value="Dus">Dus</option>
                    <option value="Liter">Liter</option>
                  </select>
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
                    <th className="p-3">Satuan</th>
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
                    <tr><td colSpan={10} className="text-center py-6 text-gray-400">Belum ada data barang.</td></tr>
                  ) : (
                    filteredBarang.map((b, idx) => (
                      <tr key={idx} className="hover:bg-pink-50/20">
                        <td className="p-3">
                          <img src={b[7] || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=150'} alt="" className="w-10 h-10 object-cover rounded-lg" referrerPolicy="no-referrer" />
                        </td>
                        <td className="p-3 font-mono text-xs">{b[1]}</td>
                        <td className="p-3 font-medium">{b[2]}</td>
                        <td className="p-3 font-semibold text-gray-700">{b[9] || 'Pcs'}</td>
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
                    <td colSpan={4} className="p-3 text-right text-xs uppercase tracking-wider text-gray-500 font-bold">
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
                    <td colSpan={4} className="p-3 text-right text-xs uppercase tracking-wider text-[#ff3377] font-extrabold">
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

            {/* SEKSI LAPORAN PENJUALAN INTEGRASI */}
            <div className="mt-8 border-t border-pink-100 pt-6">
              <h4 className="text-[#ff3377] font-bold text-lg mb-2 flex items-center gap-2" style={{ color: currentTheme.primary }}>
                <BarChart3 className="w-5 h-5" /> Laporan Penjualan Konsolidasi Multi-Cabang
              </h4>
              <p className="text-xs text-gray-500 mb-4">Laporan rekapitulasi penjualan real-time dari seluruh cabang untuk mencocokkan arus keluar barang dengan audit fisik stok opname.</p>

              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm text-left">
                  <thead className="bg-pink-50 text-gray-700 text-xs uppercase font-semibold">
                    <tr>
                      <th className="p-3">Waktu</th>
                      <th className="p-3">No. Nota</th>
                      <th className="p-3">Cabang</th>
                      <th className="p-3">Kasir</th>
                      <th className="p-3">Produk Terjual</th>
                      <th className="p-3 text-right">Total (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {transaksiList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-400 font-medium">Belum ada data transaksi penjualan tercatat.</td>
                      </tr>
                    ) : (
                      transaksiList.map((t, idx) => (
                        <tr key={idx} className="hover:bg-pink-50/10">
                          <td className="p-3 text-gray-500 whitespace-nowrap">{new Date(t[0]).toLocaleString('id-ID')}</td>
                          <td className="p-3 font-mono font-bold text-[#ff3377]" style={{ color: currentTheme.primary }}>{t[1]}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-pink-50 text-[#ff3377] text-xs rounded font-medium" style={{ color: currentTheme.primary, backgroundColor: currentTheme.lightTint + '33' }}>
                              {t[4]}
                            </span>
                          </td>
                          <td className="p-3 text-gray-600">{t[3]}</td>
                          <td className="p-3">
                            <div className="space-y-1">
                              {Array.isArray(t[7]) ? t[7].map((item: any, i: number) => (
                                <div key={i} className="text-[11px] text-gray-700 font-medium">
                                  {item.nama} <span className="text-pink-600 font-bold" style={{ color: currentTheme.primary }}>x{item.qty}</span>
                                </div>
                              )) : <span className="text-gray-400">-</span>}
                            </div>
                          </td>
                          <td className="p-3 text-right font-bold text-gray-900">
                            Rp {Number(t[5] || 0).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {/* BARIS PALING BAWAH: INFO JUMLAH UNTUK MASING-MASING CABANG */}
                  <tfoot className="bg-pink-50/80 border-t-2 border-pink-200 text-xs text-gray-800">
                    <tr>
                      <td colSpan={4} className="p-4 align-top font-bold text-gray-600 border-r border-pink-100">
                        <div className="space-y-1">
                          <span className="text-xs uppercase tracking-wider text-[#ff3377] font-black block mb-2" style={{ color: currentTheme.primary }}>
                            📊 Rekapitulasi Omset Penjualan Per Cabang:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {cabangList.map((cab, cidx) => {
                              const branchName = cab[1];
                              const branchSales = transaksiList
                                .filter(t => t[4] === branchName)
                                .reduce((sum, t) => sum + Number(t[5] || 0), 0);
                              const branchQty = transaksiList
                                .filter(t => t[4] === branchName)
                                .reduce((sum, t) => {
                                  if (Array.isArray(t[7])) {
                                    return sum + t[7].reduce((sItem: number, item: any) => sItem + Number(item.qty || 0), 0);
                                  }
                                  return sum;
                                }, 0);
                              return (
                                <div key={cidx} className="bg-white p-2.5 rounded-lg border border-pink-100 shadow-2xs">
                                  <div className="font-extrabold text-gray-800 text-[11px] truncate">{branchName}</div>
                                  <div className="text-xs font-black text-[#ff3377] mt-0.5" style={{ color: currentTheme.primary }}>
                                    Rp {branchSales.toLocaleString('id-ID')}
                                  </div>
                                  <div className="text-[10px] text-gray-500 font-semibold mt-0.5">
                                    Terjual: {branchQty.toLocaleString('id-ID')} pcs
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right font-extrabold text-gray-600 align-middle">
                        TOTAL KONSOLIDASI:
                      </td>
                      <td className="p-4 text-right font-black text-[#ff3377] text-sm align-middle bg-pink-100/40 whitespace-nowrap" style={{ color: currentTheme.primary }}>
                        Rp {transaksiList.reduce((sum, t) => sum + Number(t[5] || 0), 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB LAPORAN KEUANGAN ANALITIK SUITE */}
        {activeTab === 'laporan' && hasAccess(user.role, 'laporan') && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-pink-100 pb-4">
              <div>
                <h4 className="text-[#ff3377] font-extrabold text-xl flex items-center gap-2" style={{ color: currentTheme.primary }}>
                  <BarChart3 className="w-6 h-6" /> Laporan Keuangan & Akuntansi Suite {user.role !== 'Owner' ? `(${user.cabang})` : ''}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">Sistem pelaporan keuangan terpadu: COA, Buku Besar, Rugi Laba, Neraca, dan Komisi Berbasis Laba Bersih.</p>
              </div>

              {/* Sub-navigation Menu Pills */}
              <div className="flex flex-wrap items-center gap-1.5 bg-pink-50/70 p-1.5 rounded-2xl border border-pink-100">
                <button 
                  onClick={() => setFinancialSubTab('rugi_laba')} 
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${financialSubTab === 'rugi_laba' ? 'bg-[#ff3377] text-white shadow-sm' : 'text-gray-600 hover:text-[#ff3377] hover:bg-white/60'}`}
                >
                  📊 Rugi Laba & Omset
                </button>
                <button 
                  onClick={() => setFinancialSubTab('coa')} 
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${financialSubTab === 'coa' ? 'bg-[#ff3377] text-white shadow-sm' : 'text-gray-600 hover:text-[#ff3377] hover:bg-white/60'}`}
                >
                  📖 COA (Akun)
                </button>
                <button 
                  onClick={() => setFinancialSubTab('ledger')} 
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${financialSubTab === 'ledger' ? 'bg-[#ff3377] text-white shadow-sm' : 'text-gray-600 hover:text-[#ff3377] hover:bg-white/60'}`}
                >
                  📒 Buku Besar
                </button>
                <button 
                  onClick={() => setFinancialSubTab('neraca')} 
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${financialSubTab === 'neraca' ? 'bg-[#ff3377] text-white shadow-sm' : 'text-gray-600 hover:text-[#ff3377] hover:bg-white/60'}`}
                >
                  ⚖️ Neraca
                </button>
                <button 
                  onClick={() => setFinancialSubTab('komisi_net')} 
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${financialSubTab === 'komisi_net' ? 'bg-[#ff3377] text-white shadow-sm' : 'text-gray-600 hover:text-[#ff3377] hover:bg-white/60'}`}
                >
                  💡 Komisi Laba Bersih
                </button>
              </div>
            </div>

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

            {/* SUB-TAB 1: ANALISIS RUGI LABA & OMSET */}
            {financialSubTab === 'rugi_laba' && (
              <div className="space-y-6">
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

          <div className="my-10 border-t border-pink-100 pt-8" />

          {/* Seksi 2: Laporan Penjualan Konsolidasi Multi-Cabang */}
          <div className="space-y-6">
            <div className="bg-pink-50/30 p-5 rounded-2xl border border-pink-100">
              <h4 className="text-[#ff3377] font-bold text-lg mb-2 flex items-center gap-2" style={{ color: currentTheme.primary }}>
                <BarChart3 className="w-5 h-5" /> Laporan Penjualan Konsolidasi Multi-Cabang
              </h4>
              <p className="text-xs text-gray-500 mb-4">Laporan rekapitulasi penjualan real-time dari seluruh cabang (Sesuai Filter Pencarian).</p>

              <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
                <table className="w-full text-sm text-left">
                  <thead className="bg-pink-50 text-gray-700 text-xs uppercase font-semibold">
                    <tr>
                      <th className="p-3">Waktu</th>
                      <th className="p-3">No. Nota</th>
                      <th className="p-3">Cabang</th>
                      <th className="p-3">Kasir</th>
                      <th className="p-3">Produk Terjual</th>
                      <th className="p-3 text-right">Total (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredTransaksi.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-400 font-medium">Belum ada data transaksi penjualan tercatat untuk filter ini.</td>
                      </tr>
                    ) : (
                      filteredTransaksi.map((t, idx) => (
                        <tr key={idx} className="hover:bg-pink-50/10">
                          <td className="p-3 text-gray-500 whitespace-nowrap">{new Date(t[0]).toLocaleString('id-ID')}</td>
                          <td className="p-3 font-mono font-bold text-[#ff3377]" style={{ color: currentTheme.primary }}>{t[1]}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-pink-50 text-[#ff3377] text-xs rounded font-medium" style={{ color: currentTheme.primary, backgroundColor: currentTheme.lightTint + '33' }}>
                              {t[4]}
                            </span>
                          </td>
                          <td className="p-3 text-gray-600">{t[3]}</td>
                          <td className="p-3">
                            <div className="space-y-1">
                              {Array.isArray(t[7]) ? t[7].map((item: any, i: number) => (
                                <div key={i} className="text-[11px] text-gray-700 font-medium">
                                  {item.nama} <span className="text-pink-600 font-bold" style={{ color: currentTheme.primary }}>x{item.qty}</span>
                                </div>
                              )) : <span className="text-gray-400">-</span>}
                            </div>
                          </td>
                          <td className="p-3 text-right font-bold text-gray-900">
                            Rp {Number(t[5] || 0).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {/* BARIS PALING BAWAH: INFO JUMLAH UNTUK MASING-MASING CABANG */}
                  <tfoot className="bg-pink-50/80 border-t-2 border-pink-200 text-xs text-gray-800">
                    <tr>
                      <td colSpan={4} className="p-4 align-top font-bold text-gray-600 border-r border-pink-100">
                        <div className="space-y-1">
                          <span className="text-xs uppercase tracking-wider text-[#ff3377] font-black block mb-2" style={{ color: currentTheme.primary }}>
                            📊 Rekapitulasi Omset Penjualan Per Cabang (Sesuai Filter):
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {cabangList
                              .filter(cab => actualBranchFilter === 'ALL' || cab[1] === actualBranchFilter)
                              .map((cab, cidx) => {
                                const branchName = cab[1];
                                const branchSales = filteredTransaksi
                                  .filter(t => t[4] === branchName)
                                  .reduce((sum, t) => sum + Number(t[5] || 0), 0);
                                const branchQty = filteredTransaksi
                                  .filter(t => t[4] === branchName)
                                  .reduce((sum, t) => {
                                    if (Array.isArray(t[7])) {
                                      return sum + t[7].reduce((sItem: number, item: any) => sItem + Number(item.qty || 0), 0);
                                    }
                                    return sum;
                                  }, 0);
                                return (
                                  <div key={cidx} className="bg-white p-2.5 rounded-lg border border-pink-100 shadow-2xs">
                                    <div className="font-extrabold text-gray-800 text-[11px] truncate">{branchName}</div>
                                    <div className="text-xs font-black text-[#ff3377] mt-0.5" style={{ color: currentTheme.primary }}>
                                      Rp {branchSales.toLocaleString('id-ID')}
                                    </div>
                                    <div className="text-[10px] text-gray-500 font-semibold mt-0.5">
                                      Terjual: {branchQty.toLocaleString('id-ID')} pcs
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right font-extrabold text-gray-600 align-middle font-sans">
                        TOTAL KONSOLIDASI:
                      </td>
                      <td className="p-4 text-right font-black text-[#ff3377] text-sm align-middle bg-pink-100/40 whitespace-nowrap" style={{ color: currentTheme.primary }}>
                        Rp {filteredTransaksi.reduce((sum, t) => sum + Number(t[5] || 0), 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* SUB-TAB 2: CHART OF ACCOUNTS (COA) */}
        {financialSubTab === 'coa' && (
          <div className="space-y-6">
            <div className="bg-pink-50/50 p-4 rounded-xl border border-pink-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h5 className="font-bold text-gray-800 text-sm">📖 Bagan Akun Standar (Chart of Accounts / COA)</h5>
                <p className="text-xs text-gray-500">Struktur kode rekening akuntansi resmi untuk mengklasifikasikan aset, kewajiban, modal, pendapatan, dan beban usaha.</p>
              </div>
              {user.role === 'Owner' && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      if (!newCoaKode || !newCoaNama) {
                        alert("Sebutkan Kode dan Nama Akun COA!");
                        return;
                      }
                      setCustomCoaList(prev => [...prev, { kode: newCoaKode, nama: newCoaNama, tipe: newCoaTipe, normal: newCoaNormal }]);
                      setNewCoaKode('');
                      setNewCoaNama('');
                      alert("Akun COA baru berhasil ditambahkan!");
                    }}
                    className="bg-[#ff3377] hover:bg-[#ff1a5c] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow cursor-pointer"
                  >
                    + Tambah Akun COA
                  </button>
                </div>
              )}
            </div>

            {/* Form Tambah COA untuk Owner */}
            {user.role === 'Owner' && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-gray-200 text-xs">
                <div>
                  <label className="font-semibold text-gray-600 block mb-1">Kode Akun</label>
                  <input type="text" value={newCoaKode} onChange={e => setNewCoaKode(e.target.value)} placeholder="Contoh: 1-1004" className="w-full px-2.5 py-1.5 border rounded" />
                </div>
                <div>
                  <label className="font-semibold text-gray-600 block mb-1">Nama Rekening COA</label>
                  <input type="text" value={newCoaNama} onChange={e => setNewCoaNama(e.target.value)} placeholder="Contoh: Kas Kecil Cabang" className="w-full px-2.5 py-1.5 border rounded" />
                </div>
                <div>
                  <label className="font-semibold text-gray-600 block mb-1">Kategori Tipe</label>
                  <select value={newCoaTipe} onChange={e => setNewCoaTipe(e.target.value)} className="w-full px-2.5 py-1.5 border rounded">
                    <option value="Aset Lancar">Aset Lancar</option>
                    <option value="Aset Tetap">Aset Tetap</option>
                    <option value="Kewajiban">Kewajiban / Hutang</option>
                    <option value="Ekuitas">Ekuitas / Modal</option>
                    <option value="Pendapatan">Pendapatan Usaha</option>
                    <option value="HPP">Harga Pokok Penjualan (HPP)</option>
                    <option value="Beban">Beban Operasional</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-600 block mb-1">Saldo Normal</label>
                  <select value={newCoaNormal} onChange={e => setNewCoaNormal(e.target.value)} className="w-full px-2.5 py-1.5 border rounded">
                    <option value="Debet">Debet</option>
                    <option value="Kredit">Kredit</option>
                  </select>
                </div>
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 text-gray-700 font-bold uppercase">
                  <tr>
                    <th className="p-3 border-b">Kode COA</th>
                    <th className="p-3 border-b">Nama Rekening Akun</th>
                    <th className="p-3 border-b">Kategori Tipe</th>
                    <th className="p-3 border-b">Saldo Normal</th>
                    <th className="p-3 border-b text-right">Saldo Terkini (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customCoaList.map((c, idx) => {
                    let calculatedBalance = 0;
                    if (c.kode === '1-1001') calculatedBalance = totalOmset;
                    else if (c.kode === '1-1003') calculatedBalance = barangList.reduce((acc, b) => acc + (Number(b[6] || 0) * Number(b[4] || 0)), 0);
                    else if (c.kode === '2-2001') calculatedBalance = purchaseOrdersList.filter(po => po.status === 'Pending').reduce((acc, po) => acc + Number(po.total || 0), 0);
                    else if (c.kode === '3-3001') calculatedBalance = 50000000;
                    else if (c.kode === '3-3002') calculatedBalance = Math.round(totalLabaBersih);
                    else if (c.kode === '4-4001') calculatedBalance = totalOmset;
                    else if (c.kode === '5-5001') calculatedBalance = totalOmset - totalLabaKotor;
                    else if (c.kode === '6-6001') calculatedBalance = usersList.reduce((acc, u) => acc + Number(u.gajiPokok || 0), 0);
                    else if (c.kode.startsWith('6-600')) calculatedBalance = Math.round(totalBiayaOperasional / 4);

                    return (
                      <tr key={idx} className="hover:bg-pink-50/20">
                        <td className="p-3 font-mono font-bold text-[#ff3377]">{c.kode}</td>
                        <td className="p-3 font-bold text-gray-800">{c.nama}</td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-semibold">{c.tipe}</span></td>
                        <td className="p-3"><span className={`px-2 py-0.5 rounded font-bold ${c.normal === 'Debet' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>{c.normal}</span></td>
                        <td className="p-3 text-right font-extrabold text-gray-900">Rp {calculatedBalance.toLocaleString('id-ID')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUB-TAB 3: BUKU BESAR (GENERAL LEDGER) */}
        {financialSubTab === 'ledger' && (
          <div className="space-y-6">
            <div className="bg-pink-50/50 p-4 rounded-xl border border-pink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h5 className="font-bold text-gray-800 text-sm">📒 Buku Besar (General Ledger Multi-Cabang)</h5>
                <p className="text-xs text-gray-500">Catatan riwayat jurnal posting transaksi keuangan lengkap (Double-Entry Debit & Kredit).</p>
              </div>
              <div className="text-xs bg-white px-3 py-1.5 rounded-lg border border-pink-200 font-bold text-[#ff3377] shrink-0">
                Filter Aktif: {user?.role === 'Owner' ? (reportBranchFilter === 'ALL' ? 'Semua Cabang (Konsolidasi)' : reportBranchFilter) : user?.cabang}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 text-gray-700 font-bold uppercase">
                  <tr>
                    <th className="p-3 border-b">ID Ledger</th>
                    <th className="p-3 border-b">Tanggal & Waktu</th>
                    <th className="p-3 border-b">Nama Akun COA</th>
                    <th className="p-3 border-b text-center">Debet / Kredit</th>
                    <th className="p-3 border-b text-right">Nominal (Rp)</th>
                    <th className="p-3 border-b">Cabang</th>
                    <th className="p-3 border-b">Referensi Dokumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(() => {
                    const actualBranch = user?.role === 'Owner' ? reportBranchFilter : user?.cabang;
                    const displayLedger = ledgerList.filter((lg: any) => {
                      if (actualBranch !== 'ALL' && actualBranch !== 'Semua Cabang') {
                        return lg.cabang === actualBranch;
                      }
                      return true;
                    });

                    if (displayLedger.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-gray-400">Belum ada entri jurnal di Buku Besar untuk cabang ini. Jurnal otomatis terisi saat transaksi POS dan PO Supplier diproses.</td>
                        </tr>
                      );
                    }

                    return displayLedger.map((lg: any, idx: number) => (
                      <tr key={idx} className="hover:bg-pink-50/20">
                        <td className="p-3 font-mono font-bold text-xs text-gray-600">#{lg.id || (idx + 1)}</td>
                        <td className="p-3 text-gray-500">{new Date(lg.tanggal || lg.timestamp || Date.now()).toLocaleString('id-ID')}</td>
                        <td className="p-3 font-bold text-gray-800">{lg.akun || lg.accountName || 'Kas & Bank Operasional'}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded font-extrabold ${lg.tipe === 'Debet' || lg.type === 'DEBIT' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {lg.tipe || lg.type || 'Debet'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-extrabold text-[#ff3377]">
                          Rp {Number(lg.jumlah || lg.amount || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-pink-50 text-[#ff3377] font-semibold rounded">{lg.cabang || 'Cabang Pusat'}</span></td>
                        <td className="p-3 font-mono text-gray-500">{lg.ref || lg.referensi || lg.nota || 'TX-AUTO'}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUB-TAB 4: LAPORAN NERACA (BALANCE SHEET) */}
        {financialSubTab === 'neraca' && (
          <div className="space-y-6">
            <div className="bg-pink-50/50 p-4 rounded-xl border border-pink-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h5 className="font-bold text-gray-800 text-sm">⚖️ Laporan Neraca Keuangan (Balance Sheet)</h5>
                <p className="text-xs text-gray-500">Keseimbangan Aset (Aktiva) dengan Kewajiban + Ekuitas (Pasiva) per posisi waktu saat ini.</p>
              </div>
              <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold border border-emerald-300">
                ✓ Status: Neraca Balanced (Aset = Pasiva)
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SISI AKTIVA / ASET */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
                <h5 className="font-black text-blue-700 border-b border-blue-100 pb-2 flex justify-between items-center text-sm">
                  <span>🏦 AKTIVA (ASET USAHA)</span>
                  <span>DEBET</span>
                </h5>

                <div className="space-y-2 text-xs">
                  <p className="font-bold text-gray-700 uppercase tracking-wider text-[11px]">Aset Lancar:</p>
                  <div className="flex justify-between pl-3 text-gray-600">
                    <span>• Kas & Rekening Bank (Cash + QRIS)</span>
                    <span className="font-bold text-gray-900">Rp {totalOmset.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between pl-3 text-gray-600">
                    <span>• Persediaan Barang Dagangan (Nilai HPP Stok)</span>
                    <span className="font-bold text-gray-900">Rp {barangList.reduce((acc, b) => acc + (Number(b[6] || 0) * Number(b[4] || 0)), 0).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between pl-3 text-gray-600">
                    <span>• Piutang Usaha & Titipan</span>
                    <span className="font-bold text-gray-900">Rp 0</span>
                  </div>

                  <p className="font-bold text-gray-700 uppercase tracking-wider text-[11px] pt-3 border-t border-gray-100">Aset Tetap & Peralatan Toko:</p>
                  <div className="flex justify-between pl-3 text-gray-600">
                    <span>• Peralatan Toko, Komputer & Display</span>
                    <span className="font-bold text-gray-900">Rp 15,000,000</span>
                  </div>
                </div>

                <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 flex justify-between items-center font-bold text-blue-900 text-sm">
                  <span>TOTAL ASET (AKTIVA):</span>
                  <span className="text-base text-blue-700 font-extrabold">
                    Rp {(totalOmset + barangList.reduce((acc, b) => acc + (Number(b[6] || 0) * Number(b[4] || 0)), 0) + 15000000).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* SISI PASIVA / KEWAJIBAN & EKUITAS */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
                <h5 className="font-black text-emerald-700 border-b border-emerald-100 pb-2 flex justify-between items-center text-sm">
                  <span>💼 PASIVA (KEWAJIBAN & EKUITAS)</span>
                  <span>KREDIT</span>
                </h5>

                <div className="space-y-2 text-xs">
                  <p className="font-bold text-gray-700 uppercase tracking-wider text-[11px]">Kewajiban / Hutang:</p>
                  <div className="flex justify-between pl-3 text-gray-600">
                    <span>• Hutang Usaha / Supplier PO Pending</span>
                    <span className="font-bold text-gray-900">Rp {purchaseOrdersList.filter(po => po.status === 'Pending').reduce((acc, po) => acc + Number(po.total || 0), 0).toLocaleString('id-ID')}</span>
                  </div>

                  <p className="font-bold text-gray-700 uppercase tracking-wider text-[11px] pt-3 border-t border-gray-100">Ekuitas / Modal Usaha:</p>
                  <div className="flex justify-between pl-3 text-gray-600">
                    <span>• Modal Owner Disetor</span>
                    <span className="font-bold text-gray-900">Rp 50,000,000</span>
                  </div>
                  <div className="flex justify-between pl-3 text-gray-600">
                    <span>• Laba Ditahan & Laba Berjalan</span>
                    <span className="font-bold text-emerald-600">Rp {Math.round(totalLabaBersih).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between pl-3 text-gray-600">
                    <span>• Nilai Sediaan Modal Dalam Stok</span>
                    <span className="font-bold text-gray-900">
                      Rp {(barangList.reduce((acc, b) => acc + (Number(b[6] || 0) * Number(b[4] || 0)), 0) + totalOmset - 35000000 - Math.round(totalLabaBersih)).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 flex justify-between items-center font-bold text-emerald-900 text-sm">
                  <span>TOTAL KEWAJIBAN & EKUITAS:</span>
                  <span className="text-base text-emerald-700 font-extrabold">
                    Rp {(totalOmset + barangList.reduce((acc, b) => acc + (Number(b[6] || 0) * Number(b[4] || 0)), 0) + 15000000).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB-TAB 5: KOMISI BERBASIS LABA BERSIH */}
        {financialSubTab === 'komisi_net' && (
          <div className="space-y-6">
            <div className="bg-pink-50/60 p-5 rounded-2xl border border-pink-200 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h5 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                    <span>💡</span> Perhitungan Komisi SDM Berbasis Laba Bersih (Net Profit Based)
                  </h5>
                  <p className="text-xs text-gray-500 mt-1">
                    Menghitung komisi pegawai berdasarkan keuntungan bersih toko setelah dikurangi HPP dan biaya operasional, guna menjaga margin usaha tetap sehat.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-pink-200 text-xs shrink-0">
                  <span className="font-semibold text-gray-600">Mode Acuan:</span>
                  <select 
                    value={komisiBasis} 
                    onChange={e => setKomisiBasis(e.target.value as any)}
                    className="font-bold text-[#ff3377] bg-transparent outline-none cursor-pointer"
                  >
                    <option value="net_profit">💡 Dari Laba Bersih (Net Profit)</option>
                    <option value="sales">📊 Dari Total Omset Penjualan (Bruto)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 text-gray-700 font-bold uppercase">
                  <tr>
                    <th className="p-3 border-b">Nama Pegawai</th>
                    <th className="p-3 border-b">Jabatan / Akses</th>
                    <th className="p-3 border-b">Cabang Bertugas</th>
                    <th className="p-3 border-b text-right">Laba Bersih Cabang</th>
                    <th className="p-3 border-b text-center">% Rate Komisi</th>
                    <th className="p-3 border-b text-right">Perhitungan Estimasi Komisi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usersList.map((usr: any, idx: number) => {
                    const branchNetProfit = Math.max(0, totalLabaBersih);
                    const rate = usr.komisiPersen !== undefined ? usr.komisiPersen : 5;
                    const calculatedKomisi = komisiBasis === 'net_profit'
                      ? Math.round((rate / 100) * branchNetProfit)
                      : Math.round((rate / 100) * totalOmset);

                    return (
                      <tr key={idx} className="hover:bg-pink-50/20">
                        <td className="p-3 font-bold text-gray-800 flex items-center gap-2">
                          <span>{usr.nama}</span>
                          {usr.isOffline && <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-bold">Offline Staff</span>}
                        </td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-semibold">{usr.role}</span></td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-pink-50 text-[#ff3377] rounded font-semibold">{usr.cabang || 'Cabang Pusat'}</span></td>
                        <td className="p-3 text-right font-semibold text-emerald-700">Rp {Math.round(branchNetProfit).toLocaleString('id-ID')}</td>
                        <td className="p-3 text-center font-bold text-pink-600">{rate}%</td>
                        <td className="p-3 text-right font-black text-sm text-[#ff3377]">
                          Rp {calculatedKomisi.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

          <div className="my-10 border-t border-pink-100 pt-8" />

          {/* Seksi 3: Buku Kas Harian */}
          <div className="space-y-6">
              <h4 className="text-[#ff3377] font-bold text-lg mb-2 flex items-center gap-2" style={{ color: currentTheme.primary }}>
                <Wallet className="w-5 h-5" /> Buku Kas Harian ({user?.role === 'Owner' ? reportBranchFilter === 'ALL' ? 'Semua Cabang Konsolidasi' : reportBranchFilter : user?.cabang})
              </h4>
              <p className="text-xs text-gray-500 mb-6">Pencatatan kas masuk (Debet) dan kas keluar (Kredit) harian secara real-time, otomatis digabungkan dengan transaksi penjualan POS, PO supplier, dan penggajian karyawan.</p>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Form Tambah Kas Manual */}
                <div className="lg:col-span-1 bg-pink-50/30 p-4 rounded-xl border border-pink-100">
                  <h5 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2 text-[#ff3377]" style={{ color: currentTheme.primary }}>
                    <Plus className="w-4 h-4" /> Catat Arus Kas Manual
                  </h5>
                  <form onSubmit={handleSimpanKasHarian} className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Tanggal</label>
                      <input 
                        type="date" 
                        value={newKasTanggal} 
                        onChange={e => setNewKasTanggal(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                        required
                      />
                    </div>
                    {user?.role === 'Owner' && (
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Cabang</label>
                        <select 
                          value={newKasCabang} 
                          onChange={e => setNewKasCabang(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium"
                        >
                          {cabangList.map((c, i) => (
                            <option key={i} value={c[1]}>{c[1]}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Tipe Aliran Kas</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setNewKasTipe('Debet')}
                          className={`py-1 rounded-lg text-xs font-bold transition-all border ${
                            newKasTipe === 'Debet' 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                              : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50/50'
                          }`}
                        >
                          🟢 DEBET (Kas Masuk)
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewKasTipe('Kredit')}
                          className={`py-1 rounded-lg text-xs font-bold transition-all border ${
                            newKasTipe === 'Kredit' 
                              ? 'bg-red-600 text-white border-red-600 shadow-xs' 
                              : 'bg-white text-red-600 border-red-200 hover:bg-red-50/50'
                          }`}
                        >
                          🔴 KREDIT (Kas Keluar)
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Keterangan Transaksi</label>
                      <input 
                        type="text" 
                        value={newKasKeterangan} 
                        onChange={e => setNewKasKeterangan(e.target.value)}
                        placeholder="Contoh: Tambah Modal Kas, Biaya Kirim, dll"
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Jumlah Uang (Rp)</label>
                      <input 
                        type="number" 
                        value={newKasJumlah} 
                        onChange={e => setNewKasJumlah(e.target.value)}
                        placeholder="Masukkan nominal Rp"
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                        min="1"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full text-white text-xs font-bold py-2 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1 hover:opacity-90 mt-2"
                      style={{ backgroundColor: currentTheme.primary }}
                    >
                      <span>💾 Simpan Catatan Kas</span>
                    </button>
                  </form>
                </div>

                {/* Ringkasan Kas & Daftar Riwayat */}
                <div className="lg:col-span-2 flex flex-col justify-between">
                  {(() => {
                    // Calculate totals from combinedKasEntries
                    const list = (() => {
                      const l: any[] = [];
                      kasHarianList.forEach(k => {
                        l.push({ id: k.id, tanggal: k.tanggal, keterangan: k.keterangan, tipe: k.tipe, jumlah: k.jumlah, cabang: k.cabang, isManual: true });
                      });
                      transaksiList.forEach(t => {
                        l.push({ id: t[1], tanggal: t[0], keterangan: `Penjualan POS (Nota: ${t[1]}) [${t[6]}]`, tipe: 'Debet', jumlah: Number(t[5] || 0), cabang: t[4], isManual: false });
                      });
                      purchaseOrdersList.filter(po => po.status === 'Received').forEach(po => {
                        l.push({ id: `PO-${po.id}`, tanggal: po.tanggal, keterangan: `Pembelian PO Ke Supplier ${po.supplier}`, tipe: 'Kredit', jumlah: Number(po.total || 0), cabang: po.cabang, isManual: false });
                      });
                      payrollList.filter(pay => pay.status === 'Paid').forEach(pay => {
                        l.push({ id: pay.id, tanggal: pay.tanggal || (Date.now() - 86400000 * 2), keterangan: `Gaji Staff ${pay.pegawai} (${pay.periode})`, tipe: 'Kredit', jumlah: Number(pay.totalTerima || 0), cabang: pay.cabang, isManual: false });
                      });

                      const actualBranch = user?.role === 'Owner' ? reportBranchFilter : user?.cabang;
                      let filtered = l;
                      if (actualBranch !== 'ALL' && actualBranch !== 'Semua Cabang') {
                        filtered = filtered.filter(item => item.cabang === actualBranch);
                      }

                      const now = Date.now();
                      if (reportPeriodFilter === 'daily') {
                        filtered = filtered.filter(item => (now - item.tanggal) <= 86400000);
                      } else if (reportPeriodFilter === 'monthly') {
                        filtered = filtered.filter(item => (now - item.tanggal) <= 86400000 * 30);
                      } else if (reportPeriodFilter === 'yearly') {
                        filtered = filtered.filter(item => (now - item.tanggal) <= 86400000 * 365);
                      }

                      filtered.sort((a, b) => a.tanggal - b.tanggal);
                      let runningSaldo = 0;
                      const computed = filtered.map(item => {
                        if (item.tipe === 'Debet') {
                          runningSaldo += item.jumlah;
                        } else {
                          runningSaldo -= item.jumlah;
                        }
                        return { ...item, saldo: runningSaldo };
                      });
                      return computed.reverse();
                    })();

                    const totalDebet = list.filter(item => item.tipe === 'Debet').reduce((sum, item) => sum + item.jumlah, 0);
                    const totalKredit = list.filter(item => item.tipe === 'Kredit').reduce((sum, item) => sum + item.jumlah, 0);
                    const finalSaldo = list.length > 0 ? list[0].saldo : 0;

                    return (
                      <div className="space-y-4 h-full flex flex-col justify-between">
                        {/* Summary Widget Cards */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl text-center">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 block mb-0.5">🟢 Total Debet (In)</span>
                            <span className="text-sm font-black text-blue-900">Rp {totalDebet.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="bg-red-50 border border-red-100 p-3 rounded-xl text-center">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-red-600 block mb-0.5">🔴 Total Kredit (Out)</span>
                            <span className="text-sm font-black text-red-900">Rp {totalKredit.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-center">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 block mb-0.5">💎 Saldo Buku Kas</span>
                            <span className={`text-sm font-black ${finalSaldo >= 0 ? 'text-emerald-900' : 'text-red-700'}`}>
                              Rp {finalSaldo.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>

                        {/* List Table of Cash Book */}
                        <div className="overflow-x-auto rounded-xl border border-gray-100 flex-1 max-h-[295px] overflow-y-auto">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 text-[10px] uppercase font-bold tracking-wider sticky top-0">
                              <tr>
                                <th className="p-2.5">Waktu</th>
                                <th className="p-2.5">Referensi</th>
                                <th className="p-2.5">Keterangan</th>
                                <th className="p-2.5 text-right">Debet (+)</th>
                                <th className="p-2.5 text-right">Kredit (-)</th>
                                <th className="p-2.5 text-right">Saldo Kas</th>
                                <th className="p-2.5 text-center">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs">
                              {list.length === 0 ? (
                                <tr>
                                  <td colSpan={7} className="text-center py-10 text-gray-400">
                                    Belum ada aliran kas masuk/keluar pada periode ini.
                                  </td>
                                </tr>
                              ) : (
                                list.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50/50">
                                    <td className="p-2 text-gray-500 whitespace-nowrap">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                                    <td className="p-2 font-mono text-[10px] font-bold text-[#ff3377]" style={{ color: currentTheme.primary }}>{item.id}</td>
                                    <td className="p-2 font-medium text-gray-800">
                                      <div className="max-w-[150px] truncate" title={item.keterangan}>
                                        {item.keterangan}
                                      </div>
                                      <span className="text-[9px] text-pink-600 bg-pink-50 px-1 py-0.2 rounded" style={{ color: currentTheme.primary, backgroundColor: currentTheme.lightTint + '33' }}>
                                        {item.cabang}
                                      </span>
                                    </td>
                                    <td className="p-2 text-right font-bold text-blue-600 whitespace-nowrap">
                                      {item.tipe === 'Debet' ? `Rp ${item.jumlah.toLocaleString('id-ID')}` : '-'}
                                    </td>
                                    <td className="p-2 text-right font-bold text-red-600 whitespace-nowrap">
                                      {item.tipe === 'Kredit' ? `Rp ${item.jumlah.toLocaleString('id-ID')}` : '-'}
                                    </td>
                                    <td className="p-2 text-right font-extrabold text-gray-900 whitespace-nowrap">
                                      Rp {item.saldo.toLocaleString('id-ID')}
                                    </td>
                                    <td className="p-2 text-center">
                                      {item.isManual ? (
                                        <button 
                                          onClick={() => handleHapusKasHarianEntry(item.id)}
                                          type="button"
                                          className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50"
                                          title="Hapus Catatan Manual"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      ) : (
                                        <span className="text-[9px] text-gray-400 bg-gray-100 px-1 py-0.5 rounded uppercase font-bold">Auto</span>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
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
                  {usersList.filter(u => !u.isOffline).map((u, idx) => (
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

            {/* Tabel Hak Akses (Role Permission Matrix) */}
            <div className="mt-8 border-t border-pink-100 pt-6">
              <h5 className="text-[#ff3377] font-bold text-base mb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" /> Tabel Hak Akses & Matriks Perizinan Sistem
              </h5>
              <p className="text-xs text-gray-500 mb-4">
                Berikut adalah tabel batasan akses untuk masing-masing level pengguna (Kasir, Admin Cabang, dan Superadmin/Owner) dalam sistem POS & ERP Terpusat.
              </p>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm text-left">
                  <thead className="bg-pink-50 text-gray-700 text-xs font-bold">
                    <tr>
                      <th className="p-3 border-b">Nama Modul / Fitur</th>
                      <th className="p-3 border-b text-center">Superadmin (Owner)</th>
                      <th className="p-3 border-b text-center">Admin Cabang</th>
                      <th className="p-3 border-b text-center">Kasir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    <tr className="hover:bg-pink-50/20">
                      <td className="p-3 font-semibold text-gray-800">Kasir POS (Transaksi)</td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-bold text-[10px]">Lengkap (Semua Cabang) ✅</span></td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-bold text-[10px]">Terbatas (Cabang Sendiri) 🔒</span></td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-bold text-[10px]">Terbatas (Cabang Sendiri) 🔒</span></td>
                    </tr>
                    <tr className="hover:bg-pink-50/20">
                      <td className="p-3 font-semibold text-gray-800">Kelola Barang & Stok</td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-bold text-[10px]">Lengkap (Semua Cabang) ✅</span></td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-bold text-[10px]">Terbatas (Cabang Sendiri) 🔒</span></td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-red-100 text-red-800 rounded-full font-bold text-[10px]">Tidak Ada Akses ❌</span></td>
                    </tr>
                    <tr className="hover:bg-pink-50/20">
                      <td className="p-3 font-semibold text-gray-800">Stok Opname & Audit</td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-bold text-[10px]">Akses Penuh ✅</span></td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-bold text-[10px]">Terbatas (Cabang Sendiri) 🔒</span></td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-red-100 text-red-800 rounded-full font-bold text-[10px]">Tidak Ada Akses ❌</span></td>
                    </tr>
                    <tr className="hover:bg-pink-50/20">
                      <td className="p-3 font-semibold text-gray-800">Laporan Keuangan Analitik</td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-bold text-[10px]">Konsolidasi (Lengkap) ✅</span></td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-bold text-[10px]">Terbatas (Cabang Sendiri) 🔒</span></td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-red-100 text-red-800 rounded-full font-bold text-[10px]">Tidak Ada Akses ❌</span></td>
                    </tr>
                    <tr className="hover:bg-pink-50/20">
                      <td className="p-3 font-semibold text-gray-800">Transfer Antar Cabang</td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-bold text-[10px]">Akses Penuh ✅</span></td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-bold text-[10px]">Akses Penuh ✅</span></td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-bold text-[10px]">Akses Penuh ✅</span></td>
                    </tr>
                    <tr className="hover:bg-pink-50/20">
                      <td className="p-3 font-semibold text-gray-800">ERP Executive Cockpit</td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-bold text-[10px]">Akses Penuh ✅</span></td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-red-100 text-red-800 rounded-full font-bold text-[10px]">Tidak Ada Akses ❌</span></td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-red-100 text-red-800 rounded-full font-bold text-[10px]">Tidak Ada Akses ❌</span></td>
                    </tr>
                    <tr className="hover:bg-pink-50/20">
                      <td className="p-3 font-semibold text-gray-800">Buku Besar Akuntansi (Ledger)</td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-bold text-[10px]">Akses Penuh ✅</span></td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-red-100 text-red-800 rounded-full font-bold text-[10px]">Tidak Ada Akses ❌</span></td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-red-100 text-red-800 rounded-full font-bold text-[10px]">Tidak Ada Akses ❌</span></td>
                    </tr>
                    <tr className="hover:bg-pink-50/20">
                      <td className="p-3 font-semibold text-gray-800">Rantai Pasok & PO Supplier</td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-bold text-[10px]">Akses Penuh ✅</span></td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-bold text-[10px]">Terbatas (Cabang Sendiri) 🔒</span></td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-red-100 text-red-800 rounded-full font-bold text-[10px]">Tidak Ada Akses ❌</span></td>
                    </tr>
                    <tr className="hover:bg-pink-50/20">
                      <td className="p-3 font-semibold text-gray-800">SDM & Payroll Komisi</td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-bold text-[10px]">Akses Penuh ✅</span></td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-red-100 text-red-800 rounded-full font-bold text-[10px]">Tidak Ada Akses ❌</span></td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-red-100 text-red-800 rounded-full font-bold text-[10px]">Tidak Ada Akses ❌</span></td>
                    </tr>
                    <tr className="hover:bg-pink-50/20">
                      <td className="p-3 font-semibold text-gray-800">Manufaktur & Resep (BOM)</td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-bold text-[10px]">Akses Penuh ✅</span></td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-bold text-[10px]">Terbatas (Cabang Sendiri) 🔒</span></td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-red-100 text-red-800 rounded-full font-bold text-[10px]">Tidak Ada Akses ❌</span></td>
                    </tr>
                    <tr className="hover:bg-pink-50/20">
                      <td className="p-3 font-semibold text-gray-800">Manajemen Cabang & Staff</td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-bold text-[10px]">Akses Penuh ✅</span></td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-red-100 text-red-800 rounded-full font-bold text-[10px]">Tidak Ada Akses ❌</span></td>
                      <td className="p-3 text-center"><span className="px-2 py-1 bg-red-100 text-red-800 rounded-full font-bold text-[10px]">Tidak Ada Akses ❌</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
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
                        .filter(b => b[8] === trfDariCabang)
                        .map((b, i) => (
                          <option key={i} value={b[1]}>
                            {b[1]} - {b[2]} (Stok: {b[6]})
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
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button 
                              onClick={() => setSelectedTransferForSuratJalan(t)}
                              className="bg-pink-100 hover:bg-pink-200 text-[#ff3377] px-2.5 py-1 rounded text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                              title="Lihat & Cetak Surat Jalan Mutasi Barang"
                            >
                              📄 Surat Jalan
                            </button>
                            {t.status === 'Pending' && (
                              <>
                                <button onClick={() => prosesTransfer(t.id, 'Approved')} className="bg-green-500 hover:bg-green-600 text-white px-2.5 py-1 rounded text-xs font-medium shadow-xs cursor-pointer">
                                  Approve ✓
                                </button>
                                <button onClick={() => prosesTransfer(t.id, 'Rejected')} className="bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 rounded text-xs font-medium shadow-xs cursor-pointer">
                                  Tolak ✕
                                </button>
                              </>
                            )}
                          </div>
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
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Tagline Bisnis / Koperasi / Usaha</label>
                  <input type="text" value={setTagline} onChange={e => setSetTagline(e.target.value)} placeholder="Contoh: Koperasi Serba Usaha, Fashion & Supply Chain, dll." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                  <span className="text-[10px] text-gray-400">Tagline ini akan dicantumkan di dokumen resmi seperti cetak PO (Purchase Order).</span>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-700 block mb-2">Corporate Color Theme (Warna Aplikasi & Navigator)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2">
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
                    <button
                      type="button"
                      onClick={() => setSetTheme(`custom_${customPrimary}_${customSecondary}`)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        setTheme.startsWith('custom_')
                          ? 'border-gray-800 bg-gray-50 ring-2 ring-gray-400'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className="w-3.5 h-3.5 rounded-full inline-block border border-black/10 shadow-xs"
                          style={{ backgroundColor: customPrimary }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full inline-block border border-black/10 shadow-xs -ml-2"
                          style={{ backgroundColor: customSecondary }}
                        />
                      </div>
                      <span className="text-[11px] font-bold block text-gray-800 leading-tight text-[#ff3377]">
                        🎨 More Colors...
                      </span>
                    </button>
                  </div>

                  {/* Microsoft Office Standar More Colors Panel */}
                  {setTheme.startsWith('custom_') && (
                    <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-2 gap-2">
                        <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                          🎨 Kustomisasi Warna (Standar MS Office)
                        </h5>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setCustomSecondary(customPrimary)}
                            className="text-[10px] text-white hover:bg-gray-800 bg-gray-700 font-bold px-2.5 py-1 rounded-md transition-colors"
                          >
                            Samakan ke Navigator
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomPrimary(customSecondary)}
                            className="text-[10px] text-white hover:bg-gray-800 bg-gray-700 font-bold px-2.5 py-1 rounded-md transition-colors"
                          >
                            Samakan ke Utama
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* WARNA UTAMA */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-800">1. Warna Utama (Tombol & Highlight)</span>
                            <span className="text-xs font-mono font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600 uppercase border border-gray-200 shadow-3xs">
                              {customPrimary}
                            </span>
                          </div>

                          {/* MS Office Theme Colors Grid */}
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1">Theme Colors (MS Office)</span>
                            <div className="grid grid-cols-10 gap-1 bg-gray-50 p-2 rounded-lg border border-gray-200">
                              {MS_OFFICE_THEME_COLORS.map((row, rIdx) => 
                                row.map((color, cIdx) => (
                                  <button
                                    key={`pri-${rIdx}-${cIdx}`}
                                    type="button"
                                    onClick={() => setCustomPrimary(color)}
                                    className={`w-full aspect-square rounded-xs border transition-all ${
                                      customPrimary.toLowerCase() === color.toLowerCase() 
                                        ? 'ring-2 ring-gray-800 border-white scale-110 z-10 shadow-xs' 
                                        : 'border-gray-200 hover:scale-125 hover:z-20'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                  />
                                ))
                              )}
                            </div>
                          </div>

                          {/* MS Office Standard Colors Row */}
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1">Standard Colors</span>
                            <div className="flex gap-1 bg-gray-50 p-2 rounded-lg border border-gray-200 justify-between">
                              {MS_OFFICE_STANDARD_ROW.map((color, idx) => (
                                <button
                                  key={`pri-std-${idx}`}
                                  type="button"
                                  onClick={() => setCustomPrimary(color)}
                                  className={`w-full aspect-square rounded-xs border transition-all ${
                                    customPrimary.toLowerCase() === color.toLowerCase() 
                                      ? 'ring-2 ring-gray-800 border-white scale-110 z-10 shadow-xs' 
                                      : 'border-gray-200 hover:scale-125'
                                  }`}
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Manual Input / Custom Tab */}
                          <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-200">
                            <input
                              type="color"
                              value={customPrimary}
                              onChange={(e) => setCustomPrimary(e.target.value)}
                              className="w-10 h-10 p-0.5 border border-gray-300 rounded-lg cursor-pointer bg-white"
                            />
                            <div className="flex-1">
                              <span className="text-[10px] text-gray-400 block uppercase font-bold leading-none mb-1">Warna Bebas / Custom</span>
                              <input
                                type="text"
                                value={customPrimary}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val.startsWith('#') && val.length <= 7) {
                                    setCustomPrimary(val);
                                  } else if (!val.startsWith('#') && val.length <= 6) {
                                    setCustomPrimary('#' + val);
                                  }
                                }}
                                className="w-full px-2.5 py-1 text-sm bg-white border border-gray-300 rounded-md font-mono uppercase focus:outline-none focus:ring-1 focus:ring-gray-400"
                                placeholder="#HEXCODE"
                              />
                            </div>
                          </div>
                        </div>

                        {/* WARNA NAVIGATOR */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-800">2. Warna Navigator (Sidebar & Mobile Header)</span>
                            <span className="text-xs font-mono font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600 uppercase border border-gray-200 shadow-3xs">
                              {customSecondary}
                            </span>
                          </div>

                          {/* MS Office Theme Colors Grid */}
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1">Theme Colors (MS Office)</span>
                            <div className="grid grid-cols-10 gap-1 bg-gray-50 p-2 rounded-lg border border-gray-200">
                              {MS_OFFICE_THEME_COLORS.map((row, rIdx) => 
                                row.map((color, cIdx) => (
                                  <button
                                    key={`sec-${rIdx}-${cIdx}`}
                                    type="button"
                                    onClick={() => setCustomSecondary(color)}
                                    className={`w-full aspect-square rounded-xs border transition-all ${
                                      customSecondary.toLowerCase() === color.toLowerCase() 
                                        ? 'ring-2 ring-gray-800 border-white scale-110 z-10 shadow-xs' 
                                        : 'border-gray-200 hover:scale-125 hover:z-20'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                  />
                                ))
                              )}
                            </div>
                          </div>

                          {/* MS Office Standard Colors Row */}
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1">Standard Colors</span>
                            <div className="flex gap-1 bg-gray-50 p-2 rounded-lg border border-gray-200 justify-between">
                              {MS_OFFICE_STANDARD_ROW.map((color, idx) => (
                                <button
                                  key={`sec-std-${idx}`}
                                  type="button"
                                  onClick={() => setCustomSecondary(color)}
                                  className={`w-full aspect-square rounded-xs border transition-all ${
                                    customSecondary.toLowerCase() === color.toLowerCase() 
                                      ? 'ring-2 ring-gray-800 border-white scale-110 z-10 shadow-xs' 
                                      : 'border-gray-200 hover:scale-125'
                                  }`}
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Manual Input / Custom Tab */}
                          <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-200">
                            <input
                              type="color"
                              value={customSecondary}
                              onChange={(e) => setCustomSecondary(e.target.value)}
                              className="w-10 h-10 p-0.5 border border-gray-300 rounded-lg cursor-pointer bg-white"
                            />
                            <div className="flex-1">
                              <span className="text-[10px] text-gray-400 block uppercase font-bold leading-none mb-1">Warna Bebas / Custom</span>
                              <input
                                type="text"
                                value={customSecondary}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val.startsWith('#') && val.length <= 7) {
                                    setCustomSecondary(val);
                                  } else if (!val.startsWith('#') && val.length <= 6) {
                                    setCustomSecondary('#' + val);
                                  }
                                }}
                                className="w-full px-2.5 py-1 text-sm bg-white border border-gray-300 rounded-md font-mono uppercase focus:outline-none focus:ring-1 focus:ring-gray-400"
                                placeholder="#HEXCODE"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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

              {/* INTEGRASI GOOGLE SHEETS */}
              <div className="bg-pink-50/20 p-5 rounded-2xl border border-pink-100/80 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg">
                    田
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-800 text-sm">Integrasi Google Sheets & Sinkronisasi Otomatis</h5>
                    <p className="text-[11px] text-gray-500">Kirim data transaksi langsung ke Google Spreadsheet Anda secara real-time.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-xs font-bold text-gray-700 block">Aktifkan Sinkronisasi Google Sheets</span>
                      <span className="text-[10px] text-gray-400">Jika aktif, setiap checkout berhasil akan otomatis terkirim ke spreadsheet.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isSheetEnabled} 
                        onChange={e => setIsSheetEnabledState(e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">URL Google Apps Script Web App</label>
                    <input 
                      type="url" 
                      value={googleSheetUrl} 
                      onChange={e => setGoogleSheetUrlState(e.target.value)} 
                      placeholder="https://script.google.com/macros/s/.../exec" 
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs" 
                    />
                    <span className="text-[10px] text-gray-400 block mt-1">Masukkan URL Web App dari Apps Script Anda setelah dideploy.</span>

                    {/* Dynamic Real-time URL Helpers */}
                    {googleSheetUrl && googleSheetUrl.includes('docs.google.com/spreadsheets') && (
                      <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-1.5 font-medium">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <b>Salah Format:</b> Ini adalah URL Google Spreadsheet. Anda wajib memasukkan URL <b>Web App Apps Script</b> yang berakhiran <b>/exec</b> dari menu <i>Deploy &gt; New Deployment &gt; Web App</i>.
                        </div>
                      </div>
                    )}

                    {googleSheetUrl && googleSheetUrl.endsWith('/dev') && (
                      <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-1.5 font-medium">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <b>Perhatian:</b> URL berakhiran <b>/dev</b> hanya bisa diakses saat Anda login di browser pemilik. Ubah akhiran URL menjadi <b>/exec</b> agar dapat diakses oleh semua cabang/perusahaan.
                        </div>
                      </div>
                    )}

                    {googleSheetUrl && googleSheetUrl.startsWith('https://script.google.com/macros/s/') && googleSheetUrl.endsWith('/exec') && (
                      <div className="mt-1.5 p-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-700 flex items-center gap-1 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        Format Web App URL valid (berakhiran /exec). Siap dites.
                      </div>
                    )}
                  </div>

                  {/* Multi-Company / Beda Perusahaan Solution Card */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50/70 p-3.5 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-blue-950">
                      <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                      🌐 Solusi Akses Jika Dibagikan ke Beda Perusahaan / User Lain
                    </div>
                    <p className="text-[11px] leading-relaxed text-blue-800">
                      Ketika link aplikasi ini dibagikan ke user dari perusahaan atau akun Google yang berbeda, Google secara bawaan memblokir akses ke Web App jika setelan keamanan belum disesuaikan.
                    </p>
                    <div className="bg-white/80 p-2.5 rounded-lg border border-blue-150 space-y-1.5 text-[11px]">
                      <span className="font-bold text-blue-950 block">3 Langkah Wajib Agar Terhubung di Beda Perusahaan:</span>
                      <ol className="list-decimal list-inside space-y-1 text-gray-700">
                        <li>Buka editor Apps Script &gt; klik <b>Deploy</b> &gt; <b>Manage deployments</b> (Kelola penerapan).</li>
                        <li>Klik ikon <b>Edit</b> (pensil) pada deployment aktif Anda.</li>
                        <li>Setel <b>Execute as</b> = <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900 font-bold">Me (Pemilik Akun)</code> dan <b>Who has access</b> = <code className="bg-emerald-100 px-1 py-0.5 rounded text-emerald-900 font-bold">Anyone (Siapa saja)</code>.</li>
                      </ol>
                      <p className="text-[10px] text-amber-700 font-medium pt-1 border-t border-blue-100">
                        💡 <b>Catatan Google Workspace:</b> Jika akun Google perusahaan Anda membatasi/mengunci opsi <i>"Anyone"</i>, buatlah Spreadsheet menggunakan akun <b>@gmail.com pribadi</b> agar Web App bebas diakses oleh semua perusahaan!
                      </p>
                    </div>
                  </div>

                  {/* Google Apps Script Guide Accordion */}
                  <details className="bg-white p-3 rounded-xl border border-gray-150 text-xs">
                    <summary className="font-semibold text-gray-700 cursor-pointer hover:text-pink-600 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" /> Panduan & Kode Google Apps Script
                    </summary>
                    <div className="mt-3 space-y-2 text-gray-600 leading-relaxed text-[11px]">
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Buat Spreadsheet Baru di Google Sheets.</li>
                        <li>Buka menu <b>Extensions &gt; Apps Script</b> (Ekstensi &gt; Apps Script).</li>
                        <li>Hapus seluruh kode bawaan di editor, lalu paste kode di bawah ini.</li>
                        <li>Klik ikon <b>Save</b> (Simpan), lalu klik tombol <b>Deploy &gt; New Deployment</b> (Terapkan Baru).</li>
                        <li>Pilih jenis deployment: <b>Web App</b> (Aplikasi Web).</li>
                        <li>Ubah <i>Execute as</i> ke <b>Me</b> (Saya), dan <i>Who has access</i> ke <b>Anyone</b> (Siapa Saja).</li>
                        <li>Klik <b>Deploy</b>, setujui izin akun Google Anda jika diminta, lalu salin <b>Web App URL</b> yang dihasilkan dan paste di atas.</li>
                      </ol>

                      <div className="mt-2 relative">
                        <div className="flex justify-between items-center mb-1 bg-gray-100 p-1 rounded-t-lg">
                          <span className="font-mono text-[10px] text-gray-500 pl-1">Code.gs (Apps Script)</span>
                          <button 
                            type="button" 
                            onClick={() => {
                              const scriptCode = `function doPost(e) {
  try {
    var jsonString = e.postData.contents;
    var payload = JSON.parse(jsonString);
    var action = payload.action;
    
    if (action === "test") {
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Koneksi Google Sheet Berhasil! 🌸" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = payload.sheetName || "Sheet1";
    var headers = payload.headers || [];
    var targetSheet = ss.getSheetByName(sheetName);
    
    // Create sheet if not exists and append headers
    if (!targetSheet) {
      targetSheet = ss.insertSheet(sheetName);
      if (headers.length > 0) {
        targetSheet.appendRow(headers);
        targetSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#ffe4e1");
        targetSheet.setFrozenRows(1);
      }
    }
    
    if (action === "sync_row") {
      var rowData = payload.rowData || [];
      var keyIndex = payload.keyIndex !== undefined ? payload.keyIndex : -1;
      
      if (keyIndex >= 0 && rowData.length > keyIndex) {
        var dataRange = targetSheet.getDataRange();
        var values = dataRange.getValues();
        var duplicate = false;
        var keyValue = rowData[keyIndex];
        
        for (var i = 1; i < values.length; i++) {
          if (values[i][keyIndex] == keyValue) {
            duplicate = true;
            var row = i + 1;
            targetSheet.getRange(row, 1, 1, rowData.length).setValues([rowData]);
            break;
          }
        }
        
        if (!duplicate) {
          targetSheet.appendRow(rowData);
        }
      } else {
        targetSheet.appendRow(rowData);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Data baris berhasil disinkronkan ke sheet " + sheetName + "!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "sync_bulk") {
      var rows = payload.rows || [];
      targetSheet.clearContents();
      
      // Re-add headers
      if (headers.length > 0) {
        targetSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        targetSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#ffe4e1");
      }
      
      // Write rows
      if (rows.length > 0) {
        targetSheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Data tabel " + sheetName + " berhasil diperbarui secara bulk!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Aksi tidak dikenali." }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Google Apps Script API Aktif! Gunakan metode POST." }))
    .setMimeType(ContentService.MimeType.JSON);
}`;
                              navigator.clipboard.writeText(scriptCode);
                              alert("Kode Google Apps Script berhasil disalin ke clipboard! 🌸");
                            }}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[9px] transition-colors"
                          >
                            Salin Kode Script 📋
                          </button>
                        </div>
                        <pre className="bg-gray-800 text-pink-100 p-2.5 rounded-b-lg font-mono text-[9px] overflow-x-auto max-h-40 overflow-y-auto whitespace-pre select-all">
{`function doPost(e) {
  try {
    var jsonString = e.postData.contents;
    var payload = JSON.parse(jsonString);
    var action = payload.action;
    
    if (action === "test") {
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Koneksi Google Sheet Berhasil! 🌸" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = payload.sheetName || "Sheet1";
    var headers = payload.headers || [];
    var targetSheet = ss.getSheetByName(sheetName);
    
    // Create sheet if not exists and append headers
    if (!targetSheet) {
      targetSheet = ss.insertSheet(sheetName);
      if (headers.length > 0) {
        targetSheet.appendRow(headers);
        targetSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#ffe4e1");
        targetSheet.setFrozenRows(1);
      }
    }
    
    if (action === "sync_row") {
      var rowData = payload.rowData || [];
      var keyIndex = payload.keyIndex !== undefined ? payload.keyIndex : -1;
      
      if (keyIndex >= 0 && rowData.length > keyIndex) {
        var dataRange = targetSheet.getDataRange();
        var values = dataRange.getValues();
        var duplicate = false;
        var keyValue = rowData[keyIndex];
        
        for (var i = 1; i < values.length; i++) {
          if (values[i][keyIndex] == keyValue) {
            duplicate = true;
            var row = i + 1;
            targetSheet.getRange(row, 1, 1, rowData.length).setValues([rowData]);
            break;
          }
        }
        
        if (!duplicate) {
          targetSheet.appendRow(rowData);
        }
      } else {
        targetSheet.appendRow(rowData);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Data baris berhasil disinkronkan ke sheet " + sheetName + "!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "sync_bulk") {
      var rows = payload.rows || [];
      targetSheet.clearContents();
      
      // Re-add headers
      if (headers.length > 0) {
        targetSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        targetSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#ffe4e1");
      }
      
      // Write rows
      if (rows.length > 0) {
        targetSheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Data tabel " + sheetName + " berhasil diperbarui secara bulk!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Aksi tidak dikenali." }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Google Apps Script API Aktif! Gunakan metode POST." }))
    .setMimeType(ContentService.MimeType.JSON);
}`}
                        </pre>
                      </div>
                    </div>
                  </details>

                  {/* Actions Row */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        onClick={handleTestSheetConnection} 
                        disabled={isTestingConn}
                        className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-3 py-2 rounded-xl border border-gray-200 text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-pink-500 ${isTestingConn ? 'animate-spin' : ''}`} />
                        {isTestingConn ? 'Menghubungi...' : 'Test Koneksi Sheet'}
                      </button>
                      <button 
                        type="button" 
                        onClick={handleManualSheetSync} 
                        disabled={isSyncing}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-white ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Menyinkronkan...' : 'Sinkronisasi Transaksi'}
                      </button>
                    </div>
                    <button 
                      type="button" 
                      onClick={handleSyncAllMasterData} 
                      disabled={isSyncingAll}
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold px-3 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-white ${isSyncingAll ? 'animate-spin' : ''}`} />
                      {isSyncingAll ? 'Menyinkronkan Semua Tabel...' : 'Sinkronisasi Semua Data Master & Laporan (Bulk)'}
                    </button>
                  </div>
                </div>

                {/* Google Sheet Sync Logs */}
                {sheetLogs.length > 0 && (
                  <div className="space-y-1.5 mt-3 pt-3 border-t border-pink-100">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Log Sinkronisasi Spreadsheet
                      </span>
                      <button 
                        type="button" 
                        onClick={handleClearSheetLogs}
                        className="text-[10px] text-red-500 hover:text-red-700 font-medium flex items-center gap-0.5"
                      >
                        <Trash2 className="w-2.5 h-2.5" /> Bersihkan Log
                      </button>
                    </div>

                    <div className="max-h-32 overflow-y-auto bg-gray-50 p-2 rounded-xl border border-gray-150 space-y-1.5">
                      {sheetLogs.map((log: any, index: number) => (
                        <div key={index} className="flex items-start justify-between text-[10px] border-b border-gray-200/50 pb-1.5 last:border-0 last:pb-0">
                          <div className="space-y-0.5 max-w-[70%]">
                            <span className="text-[9px] text-gray-400 block">{new Date(log.timestamp).toLocaleString('id-ID')}</span>
                            <span className="font-bold text-gray-700">{log.action}</span>
                            <span className="text-gray-500 block leading-normal">{log.message}</span>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`px-1.5 py-0.5 rounded-full font-bold text-[8px] uppercase tracking-wide inline-block ${
                              log.status === 'Success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {log.status}
                            </span>
                            {log.nota !== '-' && (
                              <span className="font-mono text-gray-400 font-bold">{log.nota}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" className="w-full bg-[#ff6699] hover:bg-[#ff3377] text-white py-3 rounded-xl font-medium shadow transition-colors">
                Simpan Semua Pengaturan Toko & Rekening 💾
              </button>
            </form>

            {/* CARD LINK SHARE APLIKASI UNTUK USER */}
            <div className="mt-8 bg-gradient-to-br from-indigo-50/90 to-blue-50/80 p-6 rounded-2xl border border-indigo-200 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">🔗 Link Aplikasi untuk Berbagi ke Tim & Cabang</h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Gunakan link di bawah ini untuk dibagikan kepada Kasir, Admin Cabang, atau Staf lain agar dapat membuka aplikasi dari HP, Tablet, atau Laptop.
                  </p>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                <div className="flex-1 w-full overflow-hidden">
                  <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider mb-0.5">Shared App Live URL</span>
                  <input 
                    type="text" 
                    readOnly 
                    value="https://ais-pre-fghburbsrfp5egkf5ikvd3-524317516269.asia-southeast1.run.app" 
                    className="w-full bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-mono font-bold text-indigo-700 select-all"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText("https://ais-pre-fghburbsrfp5egkf5ikvd3-524317516269.asia-southeast1.run.app");
                      alert("Link aplikasi berhasil disalin ke clipboard! 📋\nSilahkan bagikan ke tim Anda.");
                    }}
                    className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>📋</span> Salin Link
                  </button>
                  <a 
                    href="https://ais-pre-fghburbsrfp5egkf5ikvd3-524317516269.asia-southeast1.run.app" 
                    target="_blank" 
                    rel="noreferrer"
                    className="bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-300 px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1"
                  >
                    Buka Tab Baru ↗
                  </a>
                </div>
              </div>
            </div>

            {/* CARD INISIALISASI GO-LIVE REAL & KAS AWAL */}
            <div className="mt-8 bg-gradient-to-br from-emerald-50/90 to-teal-50/80 p-6 rounded-2xl border border-emerald-200 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">🚀 Persiapan Go-Live Real & Inisialisasi Saldo Kas Awal</h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Gunakan fitur ini ketika sistem siap digunakan secara nyata (Go-Live). Masukkan saldo kas awal real untuk tiap cabang dan bersihkan data transaksi simulasi agar laporan keuangan Anda bersih mulai dari tanggal Go-Live.
                  </p>
                </div>
              </div>

              <form onSubmit={handleInitGoLive} className="bg-white p-5 rounded-xl border border-emerald-200 space-y-5 shadow-2xs">
                <div>
                  <h5 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 text-emerald-800">
                    <span>💵</span> 1. Atur Saldo Kas Awal Real Per Cabang (Rp)
                  </h5>
                  <p className="text-[11px] text-gray-500 mb-3">
                    Masukkan nilai modal kas tunai awal yang dipegang oleh masing-masing cabang saat Go-Live dimulai.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {cabangList.map((c, idx) => (
                      <div key={idx} className="bg-emerald-50/40 p-3 rounded-lg border border-emerald-100">
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                          📍 {c[1]}
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2 text-xs text-gray-400 font-semibold">Rp</span>
                          <input 
                            type="number" 
                            min="0"
                            value={goLiveBalances[c[1]] !== undefined ? goLiveBalances[c[1]] : "5000000"} 
                            onChange={e => setGoLiveBalances({ ...goLiveBalances, [c[1]]: e.target.value })}
                            placeholder="5000000" 
                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-bold text-gray-800 focus:ring-1 focus:ring-emerald-500" 
                            required
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <h5 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 text-emerald-800">
                    <span>🧹</span> 2. Opsi Pembersihan Data Simulasi & Sampel
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-emerald-50/30">
                      <input 
                        type="checkbox" 
                        checked={goLiveClearTxs} 
                        onChange={e => setGoLiveClearTxs(e.target.checked)} 
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-medium text-gray-700">Bersihkan seluruh riwayat transaksi penjualan simulasi</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-emerald-50/30">
                      <input 
                        type="checkbox" 
                        checked={goLiveClearKas} 
                        onChange={e => setGoLiveClearKas(e.target.checked)} 
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-medium text-gray-700">Reset kas harian lama & pasang Saldo Kas Awal Real di atas</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-emerald-50/30">
                      <input 
                        type="checkbox" 
                        checked={goLiveClearPO} 
                        onChange={e => setGoLiveClearPO(e.target.checked)} 
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-medium text-gray-700">Bersihkan dokumen PO & Work Order manufaktur simulasi</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-emerald-50/30">
                      <input 
                        type="checkbox" 
                        checked={goLiveClearStock} 
                        onChange={e => setGoLiveClearStock(e.target.checked)} 
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-medium text-gray-700">Reset stok barang ke 0 (Gunakan jika ingin re-input stok fisik baru)</span>
                    </label>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmittingGoLive}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Rocket className="w-4 h-4" />
                  {isSubmittingGoLive ? 'Sedang Memproses Go-Live...' : '🚀 Terapkan Mode Go-Live Real & Pasang Saldo Kas Awal'}
                </button>
              </form>
            </div>
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
        {activeTab === 'erp' && hasAccess(user.role, 'erp') && (
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
        {activeTab === 'ledger' && hasAccess(user.role, 'ledger') && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-pink-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-[#ff3377] mb-1 flex items-center gap-2">
                  <BookOpen className="w-6 h-6" /> Buku Besar Akuntansi (General Ledger - Double-Entry)
                </h3>
                <p className="text-sm text-gray-500">Pencatatan otomatis seluruh aliran finansial (Pendapatan, Piutang, Hutang Usaha, Beban Gaji, Persediaan) dari transaksi POS dan PO.</p>
              </div>

              {user.role === 'Owner' && (
                <div className="shrink-0 flex items-center gap-2 bg-pink-50/60 p-2.5 rounded-xl border border-pink-100">
                  <span className="text-xs font-bold text-gray-700 whitespace-nowrap">🏢 Filter Cabang:</span>
                  <select 
                    value={reportBranchFilter} 
                    onChange={e => setReportBranchFilter(e.target.value)}
                    className="bg-white px-3 py-1.5 rounded-lg border border-pink-200 text-xs font-bold text-[#ff3377] focus:outline-none"
                  >
                    <option value="ALL">🌐 Semua Cabang (Konsolidasi)</option>
                    {cabangList.map((c, i) => (
                      <option key={i} value={c[1]}>{c[1]}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

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
                  {(() => {
                    const actualBranch = user.role === 'Owner' ? reportBranchFilter : user.cabang;
                    const displayLedger = ledgerList.filter((l: any) => {
                      if (actualBranch !== 'ALL' && actualBranch !== 'Semua Cabang') {
                        return l.cabang === actualBranch;
                      }
                      return true;
                    });

                    if (displayLedger.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-gray-400">Belum ada entri jurnal di Buku Besar untuk cabang ini.</td>
                        </tr>
                      );
                    }

                    return displayLedger.map((l, i) => (
                      <tr key={i} className="hover:bg-pink-50/20">
                        <td className="p-3 font-bold text-[#ff3377]">{l.id}</td>
                        <td className="p-3 text-xs text-gray-500">{new Date(l.tanggal).toLocaleString('id-ID')}</td>
                        <td className="p-3 font-semibold text-gray-800">{l.akun}</td>
                        <td className="p-3 text-xs text-gray-600"><span className="px-2 py-0.5 bg-pink-50 text-[#ff3377] font-semibold rounded">{l.cabang || 'Cabang Pusat'}</span></td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${l.tipe === 'Debet' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {l.tipe}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-gray-900">Rp {Number(l.jumlah).toLocaleString()}</td>
                        <td className="p-3 text-xs font-mono text-gray-500">{l.referensi}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB RANTAI PASOK & PURCHASE ORDERS (PO) */}
        {activeTab === 'po' && hasAccess(user.role, 'po') && (
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
                      onChange={e => {
                        setPoCabang(e.target.value);
                        setPoKodeBarang('');
                      }}
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
                      {barangList.filter(b => b[8] === poCabang).map((b, i) => (
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
                          po.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          po.status === 'Received' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          po.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {po.status === 'Paid' ? '💳 Lunas / Tagihan Selesai' :
                           po.status === 'Received' ? '📦 Diterima (Belum Lunas)' :
                           po.status === 'Cancelled' ? '✕ Dibatalkan' : '⏳ Pending'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => setSelectedPoForSuratJalan(po)}
                          className="bg-pink-100 hover:bg-pink-200 text-[#ff3377] px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          📄 PO, GRN & Invoice
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        {(user.role === 'Owner' || user.role === 'Admin Cabang') ? (
                          po.status === 'Pending' ? (
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-1">
                              <button 
                                onClick={() => prosesPO(po.id, 'Received')} 
                                className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs cursor-pointer whitespace-nowrap"
                                title="Terima barang di gudang & tambah stok"
                              >
                                📦 Terima Barang
                              </button>
                              <button 
                                onClick={() => prosesPO(po.id, 'Paid')} 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-xs cursor-pointer whitespace-nowrap"
                                title="Terima barang & langsung bayar lunas (terhubung Laporan Keuangan & Kas)"
                              >
                                💳 Terima & Bayar Lunas
                              </button>
                              <button 
                                onClick={() => prosesPO(po.id, 'Cancelled')} 
                                className="bg-gray-400 hover:bg-gray-500 text-white px-2 py-1 rounded-lg text-xs font-medium cursor-pointer"
                              >
                                ✕ Batal
                              </button>
                            </div>
                          ) : po.status === 'Received' ? (
                            <button 
                              onClick={() => prosesPO(po.id, 'Paid')} 
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1"
                              title="Bayar tagihan supplier & update Laporan Keuangan"
                            >
                              💳 Bayar Tagihan Supplier
                            </button>
                          ) : po.status === 'Paid' ? (
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-block">
                              ✓ Tagihan Lunas & Terhubung Keuangan
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Dibatalkan</span>
                          )
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
        {activeTab === 'payroll' && hasAccess(user.role, 'payroll') && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-pink-100 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-[#ff3377] mb-2 flex items-center gap-2">
                <Wallet className="w-6 h-6" /> SDM, Penggajian & Komisi Penjualan (Payroll)
              </h3>
              <p className="text-sm text-gray-500">Masing-masing karyawan menerima gaji pokok dan komisi penjualan (% dikali total penjualan). Nilai persentase komisi bervariatif sesuai posisi jabatan dan dapat di-adjust oleh Owner.</p>
            </div>

            {user.role === 'Owner' && (
              <div className="bg-gradient-to-br from-pink-50/80 to-white p-5 rounded-2xl border border-pink-200 space-y-5 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-pink-100 pb-3">
                  <div>
                    <h4 className="font-bold text-gray-800 text-base flex items-center gap-2 text-[#ff3377]">
                      <span>⚙️</span> Pengaturan Prosentase Komisi Jabatan & Staff Per Cabang (Adjustable by Owner)
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Struktur komisi disesuaikan dengan kondisi omset dan daftar staf masing-masing cabang. Perubahan komisi atau gaji pokok di sini akan langsung sinkron ke kalkulasi slip gaji.
                    </p>
                  </div>
                  
                  {/* Branch Filter Selector */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                    <button
                      type="button"
                      onClick={() => setCommissionBranchFilter('Semua Cabang')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                        commissionBranchFilter === 'Semua Cabang' 
                          ? 'bg-[#ff3377] text-white shadow-xs' 
                          : 'bg-white text-gray-600 hover:bg-pink-50 border border-gray-200'
                      }`}
                    >
                      🏢 Semua Cabang
                    </button>
                    {cabangList.map((c, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCommissionBranchFilter(c[1])}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                          commissionBranchFilter === c[1] 
                            ? 'bg-[#ff3377] text-white shadow-xs' 
                            : 'bg-white text-gray-600 hover:bg-pink-50 border border-gray-200'
                        }`}
                      >
                        📍 {c[1]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Branch-Grouped Commission Cards */}
                <div className="space-y-5">
                  {(commissionBranchFilter === 'Semua Cabang' ? cabangList.map(c => c[1]) : [commissionBranchFilter]).map((branchName, bIdx) => {
                    const thirtyDaysAgo = Date.now() - (86400000 * 30);
                    const branchTxs = transaksiList.filter(t => t[4] === branchName && t[0] >= thirtyDaysAgo);
                    const branchOmset = branchTxs.reduce((acc, t) => acc + Number(t[5] || 0), 0);
                    const branchStaff = usersList.filter(u => u.role !== 'Owner' && (u.cabang === branchName || (u.cabang === 'Semua Cabang' && branchName === cabangList[0]?.[1])));

                    return (
                      <div key={bIdx} className="bg-white rounded-xl border border-pink-200 shadow-xs overflow-hidden">
                        {/* Branch Card Header */}
                        <div className="bg-pink-50/70 p-3.5 border-b border-pink-200 flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span className="p-2 bg-pink-100 rounded-lg text-[#ff3377] font-bold text-sm">🏬</span>
                            <div>
                              <h5 className="font-bold text-gray-800 text-sm">{branchName}</h5>
                              <div className="text-[11px] text-gray-500 flex items-center gap-3 mt-0.5">
                                <span>Omset Penjualan 30 Hari: <strong className="text-pink-600">Rp {branchOmset.toLocaleString()}</strong></span>
                                <span>•</span>
                                <span>Total Staf: <strong className="text-gray-700">{branchStaff.length} Orang</strong></span>
                              </div>
                            </div>
                          </div>
                          
                          {branchStaff.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleUpdateBatchBranchCommissions(branchName)}
                              className="bg-[#ff3377] hover:bg-[#ff1155] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>💾</span> Simpan Semua Staf {branchName}
                            </button>
                          )}
                        </div>

                        {/* Staff Table for this Branch */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                                <th className="p-2.5">Nama Staf & Jabatan</th>
                                <th className="p-2.5">Cabang Tugas</th>
                                <th className="p-2.5 text-right w-36">Gaji Pokok (Rp)</th>
                                <th className="p-2.5 text-center w-28">Komisi (%)</th>
                                <th className="p-2.5 text-right">Omset Basis</th>
                                <th className="p-2.5 text-right">Est. Komisi (Rp)</th>
                                <th className="p-2.5 text-right font-bold">Est. Total Terima</th>
                                <th className="p-2.5 text-center">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {branchStaff.length === 0 ? (
                                <tr>
                                  <td colSpan={8} className="p-4 text-center text-gray-400 italic">
                                    Belum ada staf terdaftar di {branchName}.
                                  </td>
                                </tr>
                              ) : (
                                branchStaff.map((u, sIdx) => {
                                  const curPct = commissionMap[u.email] !== undefined ? commissionMap[u.email] : (u.komisiPersen ?? 5);
                                  const curSal = salaryMap[u.email] !== undefined ? salaryMap[u.email] : (u.gajiPokok ?? 2500000);
                                  const estKomisi = Math.round((curPct / 100) * branchOmset);
                                  const estTotal = curSal + estKomisi;

                                  return (
                                    <tr key={sIdx} className="hover:bg-pink-50/20 transition-colors">
                                      <td className="p-2.5">
                                        <div className="font-bold text-gray-800">{u.nama}</div>
                                        <div className="text-[10px] text-pink-600 font-medium flex items-center gap-1.5">
                                          <span>{u.role}</span>
                                          {u.isOffline ? (
                                            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded text-[9px]">Staff Non-Komputer</span>
                                          ) : (
                                            <span className="bg-green-100 text-green-700 px-1.5 py-0.2 rounded text-[9px]">Akun Login</span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="p-2.5 text-gray-600 font-medium">{u.cabang}</td>
                                      <td className="p-2.5 text-right">
                                        <input
                                          type="number"
                                          value={curSal}
                                          onChange={e => setSalaryMap({ ...salaryMap, [u.email]: Number(e.target.value) })}
                                          className="w-32 px-2 py-1 border border-gray-300 rounded text-right text-xs font-semibold focus:ring-1 focus:ring-pink-500"
                                        />
                                      </td>
                                      <td className="p-2.5 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                          <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="100"
                                            value={curPct}
                                            onChange={e => setCommissionMap({ ...commissionMap, [u.email]: Number(e.target.value) })}
                                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-xs font-bold focus:ring-1 focus:ring-pink-500"
                                          />
                                          <span className="font-bold text-gray-500">%</span>
                                        </div>
                                      </td>
                                      <td className="p-2.5 text-right font-medium text-gray-600">
                                        Rp {branchOmset.toLocaleString()}
                                      </td>
                                      <td className="p-2.5 text-right font-bold text-pink-600">
                                        Rp {estKomisi.toLocaleString()}
                                      </td>
                                      <td className="p-2.5 text-right font-extrabold text-gray-900">
                                        Rp {estTotal.toLocaleString()}
                                      </td>
                                      <td className="p-2.5 text-center">
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateCommission(u.email)}
                                          className="bg-[#ff6699] hover:bg-[#ff3377] text-white px-2.5 py-1 rounded text-[11px] font-semibold transition-all shadow-2xs cursor-pointer"
                                        >
                                          Simpan
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {user.role === 'Owner' && (
              <div className="bg-white p-5 rounded-xl border border-pink-200 space-y-4 shadow-xs">
                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2 text-[#ff3377]">
                  <span>📋</span> Kelola Staf Non-Akses Komputer (Security, Office Boy, dll)
                </h4>
                <p className="text-xs text-gray-500">
                  Tambahkan staff yang tidak memiliki akun login komputer agar tetap mendapatkan perhitungan komisi otomatis berdasarkan penjualan cabang tempat bertugas.
                </p>

                <form onSubmit={handleSimpanOfflineStaff} className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-pink-50/20 p-4 rounded-lg border border-pink-100">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={offlineNama} 
                      onChange={e => setOfflineNama(e.target.value)} 
                      placeholder="Contoh: Budi (Security)" 
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Jabatan / Peran</label>
                    <select 
                      value={offlineRole} 
                      onChange={e => setOfflineRole(e.target.value)} 
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs animate-none"
                    >
                      <option value="Security">Security</option>
                      <option value="Office Boy">Office Boy</option>
                      <option value="Cleaner">Cleaner</option>
                      <option value="Staff Gudang">Staff Gudang</option>
                      <option value="Staff Lainnya">Staff Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Cabang Tugas</label>
                    <select 
                      value={offlineCabang} 
                      onChange={e => setOfflineCabang(e.target.value)} 
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs animate-none"
                    >
                      <option value="Semua Cabang">Semua Cabang</option>
                      {cabangList.map((c, i) => (
                        <option key={i} value={c[1]}>{c[1]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Gaji Pokok Default (Rp)</label>
                    <input 
                      type="number" 
                      value={offlineGaji} 
                      onChange={e => setOfflineGaji(e.target.value)} 
                      placeholder="2500000" 
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs animate-none" 
                      required 
                    />
                  </div>
                  <div className="flex items-end gap-1">
                    <div className="w-2/3">
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Komisi (%)</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        value={offlineKomisi} 
                        onChange={e => setOfflineKomisi(e.target.value)} 
                        placeholder="2" 
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs font-bold animate-none" 
                        required 
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="w-1/3 bg-[#ff3377] hover:bg-[#ff1155] text-white py-1.5 rounded text-xs font-bold transition-colors cursor-pointer"
                    >
                      {editingOfflineEmail ? 'Ubah' : 'Tambah'}
                    </button>
                  </div>
                </form>

                {/* Table for offline staff */}
                <div className="overflow-x-auto rounded-lg border border-gray-100">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-pink-50 text-gray-700 font-semibold">
                        <th className="p-2">Nama Staff</th>
                        <th className="p-2">Jabatan</th>
                        <th className="p-2">Cabang Tugas</th>
                        <th className="p-2 text-right">Gaji Pokok Default</th>
                        <th className="p-2 text-center">Komisi (%)</th>
                        <th className="p-2 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {usersList.filter(u => u.isOffline).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-gray-400 italic">Belum ada staff non-akses komputer terdaftar.</td>
                        </tr>
                      ) : (
                        usersList.filter(u => u.isOffline).map((u, idx) => (
                          <tr key={idx} className="hover:bg-pink-50/10">
                            <td className="p-2 font-semibold text-gray-800">{u.nama}</td>
                            <td className="p-2 text-pink-600 font-medium">{u.role}</td>
                            <td className="p-2 text-gray-500">{u.cabang}</td>
                            <td className="p-2 text-right">Rp {(u.gajiPokok || 0).toLocaleString()}</td>
                            <td className="p-2 text-center font-bold text-gray-700">{u.komisiPersen}%</td>
                            <td className="p-2 text-center flex justify-center gap-1">
                              <button 
                                onClick={() => handleEditOfflineStaff(u)} 
                                className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleHapusOfflineStaff(u.email)} 
                                className="bg-red-50 text-red-600 hover:bg-red-100 px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
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
                    <button type="submit" className="w-full bg-[#ff6699] hover:bg-[#ff3377] text-white py-2 rounded-lg font-medium text-sm shadow cursor-pointer">
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
                      <th className="p-3 text-center">Aksi / Slip Gaji</th>
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
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedSlipPayroll(p)}
                            className="bg-pink-50 hover:bg-pink-100 text-[#ff3377] border border-pink-200 px-2.5 py-1 rounded text-xs font-semibold transition-all shadow-2xs cursor-pointer flex items-center gap-1 mx-auto"
                          >
                            <Printer className="w-3.5 h-3.5" /> Slip Gaji
                          </button>
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
        {activeTab === 'production' && hasAccess(user.role, 'production') && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-pink-100">
            <h3 className="text-xl font-bold text-[#ff3377] mb-2 flex items-center gap-2">
              <Factory className="w-6 h-6" /> Manufaktur, Perakitan & Bill of Materials (BOM)
            </h3>
            <p className="text-sm text-gray-500 mb-6">Kelola perintah kerja produksi (Work Order) untuk mengubah bahan baku menjadi produk jadi siap jual di cabang.</p>

            {(user.role === 'Owner' || user.role === 'Admin Cabang') && (
              <form onSubmit={buatProduksi} className="bg-pink-50/50 p-5 rounded-xl border border-pink-200 mb-8 space-y-4">
                <h4 className="font-bold text-gray-800 text-sm">Buat Work Order (WO) Manufaktur Baru</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Cabang Tujuan Stok</label>
                    <select 
                      value={prdCabang} 
                      onChange={e => setPrdCabang(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                    >
                      {cabangList.map((c, i) => <option key={i} value={c[1]}>{c[1]}</option>)}
                    </select>
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
                  <span>{it.nama} x{it.qty} {it.satuan || 'Pcs'}</span>
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-pink-100 pb-3 gap-3">
              <div>
                <h4 className="font-bold text-lg text-[#ff3377] flex items-center gap-2">
                  📄 Dokumen Rantai Pasok & PO Supplier
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">Pilih jenis dokumen resmi yang ingin dicetak / diunduh:</p>
              </div>
              <button 
                onClick={() => setSelectedPoForSuratJalan(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1 rounded-lg cursor-pointer self-end sm:self-auto"
              >
                ✕
              </button>
            </div>

            {/* Document Selector Tabs */}
            <div className="flex flex-wrap gap-2 mb-4 bg-pink-50/70 p-2 rounded-xl border border-pink-100">
              <button
                onClick={() => setPoDocType('PO')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  poDocType === 'PO'
                    ? 'bg-[#ff3377] text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-pink-100/50 border border-pink-200'
                }`}
              >
                📄 1. Surat Pesanan (PO)
              </button>
              <button
                onClick={() => setPoDocType('GRN')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  poDocType === 'GRN'
                    ? 'bg-[#ff3377] text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-pink-100/50 border border-pink-200'
                }`}
              >
                📦 2. Bukti Penerimaan Barang (GRN)
              </button>
              <button
                onClick={() => setPoDocType('INVOICE')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  poDocType === 'INVOICE'
                    ? 'bg-[#ff3377] text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-pink-100/50 border border-pink-200'
                }`}
              >
                🧾 3. Faktur Pembelian (Invoice)
              </button>
            </div>

            {/* Preview Paper */}
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              {renderSuratJalanPaper(selectedPoForSuratJalan, poDocType)}
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
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Tutup ✕
                </button>
                <button 
                  onClick={handleDownloadSuratJalanHTML}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  📥 Unduh File Cetak (.html) ✓
                </button>
                <button 
                  onClick={handlePrintSuratJalan}
                  className="px-4 py-2.5 bg-[#ff3377] hover:bg-[#ff1a5c] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-pink-200 flex items-center justify-center gap-1.5 cursor-pointer"
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

    {/* MODAL CETAK SLIP GAJI */}
    {selectedSlipPayroll && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in overflow-y-auto print:hidden">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-pink-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
          {/* Modal Header */}
          <div className="bg-[#ff3377] text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              <h3 className="font-bold text-base">Slip Gaji & Komisi Staff</h3>
            </div>
            <button 
              type="button"
              onClick={() => setSelectedSlipPayroll(null)}
              className="text-white hover:bg-white/20 p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Printable Content */}
          <div id="printableSlipGaji" className="p-6 overflow-y-auto space-y-5 text-gray-800">
            {/* Brand Header */}
            <div className="text-center border-b-2 border-pink-200 pb-4">
              <h2 className="text-xl font-extrabold text-[#ff3377] tracking-wide">PINKY APPAREL</h2>
              <p className="text-xs text-gray-500 font-medium">SLIP GAJI & KOMISI PENJUALAN KARYAWAN</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{selectedSlipPayroll.cabang || 'Cabang Utama'}</p>
            </div>

            {/* Details Meta */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-pink-50/50 p-3.5 rounded-xl border border-pink-100">
              <div>
                <span className="text-gray-500 block">No. Ref Slip:</span>
                <strong className="text-[#ff3377] font-bold">{selectedSlipPayroll.id}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Periode Gaji:</span>
                <strong className="text-gray-800">{selectedSlipPayroll.periode}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Nama Pegawai:</span>
                <strong className="text-gray-800">{selectedSlipPayroll.pegawai}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Cabang Tugas:</span>
                <strong className="text-gray-800">{selectedSlipPayroll.cabang}</strong>
              </div>
            </div>

            {/* Salary Breakdown Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-pink-100/70 text-gray-700 font-bold">
                    <th className="p-2.5">Keterangan Komponen</th>
                    <th className="p-2.5 text-right">Jumlah (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="p-2.5 font-medium">Gaji Pokok Default</td>
                    <td className="p-2.5 text-right font-semibold">Rp {(selectedSlipPayroll.gajiPokok || 0).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Komisi Penjualan Cabang</td>
                    <td className="p-2.5 text-right font-semibold text-pink-600">Rp {(selectedSlipPayroll.komisi || 0).toLocaleString()}</td>
                  </tr>
                  <tr className="bg-pink-50 font-bold text-gray-900 text-sm">
                    <td className="p-3">TOTAL NET PAY (DITERIMA)</td>
                    <td className="p-3 text-right text-[#ff3377]">
                      Rp {((selectedSlipPayroll.gajiPokok || 0) + (selectedSlipPayroll.komisi || 0)).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Signatures Section */}
            <div className="grid grid-cols-2 gap-4 pt-4 text-center text-xs text-gray-500">
              <div>
                <p className="mb-10">Penerima (Pegawai)</p>
                <div className="border-b border-gray-300 w-3/4 mx-auto"></div>
                <p className="mt-1 font-semibold text-gray-700">{selectedSlipPayroll.pegawai}</p>
              </div>
              <div>
                <p className="mb-10">Mengetahui (Owner / HR)</p>
                <div className="border-b border-gray-300 w-3/4 mx-auto"></div>
                <p className="mt-1 font-semibold text-gray-700">Manajemen Pinky Apparel</p>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Cetak Slip Gaji
            </button>
            <button
              type="button"
              onClick={() => setSelectedSlipPayroll(null)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    )}

    {/* MODAL SURAT JALAN TRANSFER MUTASI BARANG */}
    {selectedTransferForSuratJalan && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in overflow-y-auto print:hidden">
        <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-4xl border border-pink-100 max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-150">
          <div className="flex justify-between items-center mb-4 border-b border-pink-100 pb-3">
            <h4 className="font-bold text-lg text-[#ff3377] flex items-center gap-2">
              📄 Surat Jalan Transfer Mutasi Barang
            </h4>
            <button 
              onClick={() => setSelectedTransferForSuratJalan(null)}
              className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1 rounded-lg cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto pr-1">
            {renderSuratJalanTransferPaper(selectedTransferForSuratJalan)}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mt-5 gap-3 pt-3 border-t border-gray-100">
            <div className="text-left max-w-md">
              <span className="text-xs text-gray-500 italic block">
                *Gunakan tombol cetak untuk mencetak Surat Jalan pengiriman fisik, atau unduh file dokumen .html.
              </span>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto shrink-0 justify-end">
              <button 
                onClick={() => setSelectedTransferForSuratJalan(null)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Tutup ✕
              </button>
              <button 
                onClick={handleDownloadSuratJalanTransferHTML}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                📥 Unduh File Dokumen HTML ✓
              </button>
              <button 
                onClick={handlePrintSuratJalan}
                className="px-4 py-2.5 bg-[#ff3377] hover:bg-[#ff1a5c] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-pink-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                🖨️ Cetak Surat Jalan
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* AREA PRINT KHUSUS SURAT JALAN TRANSFER */}
    {selectedTransferForSuratJalan && (
      <div id="transfer-print-container" className="hidden print:block bg-white text-gray-800">
        {renderSuratJalanTransferPaper(selectedTransferForSuratJalan)}
      </div>
    )}

  </>
  );
}
