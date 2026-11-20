import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppScreenMode,
  AppUserItem,
  AttendanceItem,
  BillItem,
  ChallanItem,
  ExpenseItem,
  FactoryProfileInfo,
  FreeMachineOfferItem,
  JobPostItem,
  LedgerVoucherItem,
  MachineItem,
  MarketingSubPage,
  MarketplaceSubcontractPost,
  MessageThreadItem,
  OperatorItem,
  PartnerState,
  PartyItem,
  ProductionLogItem,
  QcLogItem,
  RollTagItem,
  ServiceDetailItem,
  StoreIssueItem,
  StoreStockItem,
  SubcontractOrderItem,
  SupplierAdItem,
  SupplierCatalogItem,
  SupplierItem,
  SupplierRfqItem,
  UserRoleKey,
  VendorFactoryDirectoryItem,
  YarnStockItem,
} from '@/types/domain.types';
import {
  INITIAL_FACTORY_PROFILE,
  INITIAL_PARTNER_STATE,
} from '@/data/initialSeedState';
import { apiClient } from '@/api/client';
import { ToastMessage } from '@/components/common/Toast';

export interface DashboardData {
  factory?: {
    id: number;
    code: string;
    name: string;
    area: string;
    total_machines: number;
    plan_code?: string;
    ontime_delivery_pct?: number;
    qc_reject_pct?: number;
  };
  kpis: {
    today_production_kg: number;
    today_production_machines_count?: number;
    running_orders_count: number;
    running_orders_total_kg: number;
    running_orders_knit_kg: number;
    running_orders_deliv_kg: number;
    total_machines: number;
    running_machines_count: number;
    idle_machines_count: number;
    free_machines_count: number;
    down_machines_count: number;
    broadcast_free_count: number;
    receivable_bills_amount: number;
    receivable_parties_count?: number;
    today_expense_amount: number;
    today_expense_count?: number;
    open_qc_issues_count: number;
  };
  machines: Array<{
    id: string;
    code: string;
    brand: string;
    type: string;
    dia: string;
    gg: string;
    spec_label: string;
    status: 'Running' | 'Idle' | 'Free' | 'Maint';
    raw_status?: string;
    order_no?: string;
    running_order?: string;
    operator: string;
    fabric: string;
    today_kg: number;
    target_kg: number;
    broadcast_free: boolean;
    daily_capacity_kg: number;
  }>;
  alerts: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    action_label?: string;
    action_view?: string;
  }>;
  running_orders: Array<{
    id: string;
    po: string;
    party: string;
    party_code: string;
    buyer: string;
    fabric: string;
    gsm: string | number;
    dia: string;
    color: string;
    order_kg: number;
    knit_kg: number;
    deliv_kg: number;
    progress_pct: number;
    machines: string[];
    eta: string;
    status: string;
    status_bn: string;
    rate_tk: number;
  }>;
  marketplace_rfqs?: Array<{
    id: number;
    title: string;
    buyer: string;
    fabric: string;
    qty_kg: number;
    target_rate: string;
    location: string;
    delivery_date: string;
  }>;
  sync_time?: string;
  date_label?: string;
}

interface AppContextType {
  // Navigation
  screen: AppScreenMode;
  setScreen: (screen: AppScreenMode) => void;
  marketingPage: MarketingSubPage;
  setMarketingPage: (page: MarketingSubPage) => void;
  factoryView: string;
  setFactoryView: (view: string) => void;
  vendorView: string;
  setVendorView: (view: string) => void;
  supplierView: string;
  setSupplierView: (view: string) => void;
  role: UserRoleKey;
  setRole: (role: UserRoleKey) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Selected Entities
  selectedOrderId: string;
  setSelectedOrderId: (id: string) => void;
  selectedThreadId: string;
  setSelectedThreadId: (id: string) => void;
  selectedVendorFactoryId: string;
  setSelectedVendorFactoryId: (id: string) => void;

  // Auth & Session
  currentUser: {
    id: number | string;
    name: string;
    phone: string;
    email?: string;
    role: string;
    designation?: string;
    organization_name?: string;
    factory_id?: number | string | null;
    token?: string;
  } | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<any>>;
  loginUser: (identifier: string, pass: string, roleKey: string) => Promise<{ success: boolean; message?: string }>;
  registerUser: (data: any) => Promise<{ success: boolean; message?: string; user?: any }>;
  resetPasswordUser: (identifier: string, code: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;

  // Domain State
  factoryProfile: FactoryProfileInfo;
  vendorFactories: VendorFactoryDirectoryItem[];
  orders: SubcontractOrderItem[];
  yarns: YarnStockItem[];
  machines: MachineItem[];
  operators: OperatorItem[];
  setOperators: React.Dispatch<React.SetStateAction<OperatorItem[]>>;
  prodLogs: ProductionLogItem[];
  rolls: RollTagItem[];
  qcLogs: QcLogItem[];
  challans: ChallanItem[];
  bills: BillItem[];
  parties: PartyItem[];
  storeItems: StoreStockItem[];
  storeIssues: StoreIssueItem[];
  vouchers: LedgerVoucherItem[];
  attendance: AttendanceItem[];
  users: AppUserItem[];
  threads: MessageThreadItem[];
  freeOffers: FreeMachineOfferItem[];
  jobs: JobPostItem[];
  services: ServiceDetailItem[];
  suppliers: SupplierItem[];
  rfqs: SupplierRfqItem[];
  catalog: SupplierCatalogItem[];
  ads: SupplierAdItem[];
  marketplacePosts: MarketplaceSubcontractPost[];
  partner: PartnerState;

  // Dialogs & Modals
  toasts: ToastMessage[];
  addToast: (msg: { type: 'success' | 'error' | 'info'; title?: string; message: string }) => void;
  dismissToast: (id: string) => void;
  callModal: {
    isOpen: boolean;
    title: string;
    subtitle?: string;
    phone: string;
    whatsapp?: string;
    name?: string;
  };
  openCallModal: (data: { title: string; subtitle?: string; phone: string; whatsapp?: string; name?: string }) => void;
  closeCallModal: () => void;
  printModal: {
    isOpen: boolean;
    title: string;
    documentType: 'challan' | 'bill' | 'jobcard' | 'qcreport' | 'rolltag';
    data: any;
  };
  openPrintModal: (documentType: 'challan' | 'bill' | 'jobcard' | 'qcreport' | 'rolltag', title: string, data: any) => void;
  closePrintModal: () => void;

  // Dashboard Live API
  dashboardData: DashboardData | null;
  isDashboardSyncing: boolean;
  fetchDashboardData: () => Promise<void>;
  quickProductionEntry: (entry: {
    machine_code: string;
    shift: string;
    operator_name: string;
    order_no?: string;
    net_kg: number;
    rolls_count: number;
    reject_kg?: number;
    rpm?: number;
    notes?: string;
  }) => Promise<void>;
  broadcastFreeMachines: (
    machineCodes: string[],
    isBroadcast: boolean,
    freeFrom?: string,
    dailyCapacity?: number,
    note?: string
  ) => Promise<void>;
  submitQuotation: (data: {
    subcontract_post_id: number;
    offered_rate_tk: number;
    estimated_days?: number;
    allocated_machines?: number;
    note?: string;
  }) => Promise<boolean>;

  // Mutations
  addProductionEntry: (entry: Omit<ProductionLogItem, 'id'>) => Promise<void>;
  updateRollStatus: (rollId: string, status: RollTagItem['status'], qcData?: Partial<QcLogItem>) => Promise<void>;
  createChallan: (challan: Omit<ChallanItem, 'no'>) => Promise<void>;
  receiveYarnInward: (yarn: Omit<YarnStockItem, 'id'>) => Promise<void>;
  createOrder: (order: Omit<SubcontractOrderItem, 'id'> & { id?: string }) => Promise<string>;
  deleteOrder: (id: string) => Promise<void>;
  clearAllOrders: () => Promise<void>;
  sendChatMessage: (threadId: string, text: string, senderRole?: 'factory' | 'vendor') => Promise<void>;
  applyForJob: (jobId: string, applicant: { name: string; phone: string; exp: string; note: string }) => Promise<void>;
  postRfq: (rfq: Omit<SupplierRfqItem, 'id' | 'time' | 'status'>) => Promise<void>;
  toggleMachineStatus: (machineId: string, newStatus: MachineItem['status']) => Promise<void>;
  recordBillPayment: (billNo: string, amount: number) => Promise<void>;
  issueStoreItem: (issue: Omit<StoreIssueItem, 'id'>) => Promise<void>;
  expenses: ExpenseItem[];
  addExpense: (expense: Omit<ExpenseItem, 'id'>) => Promise<void>;
  punchAttendance: (workerName: string, status: AttendanceItem['todayStatus'], otHours?: number, shift?: string) => Promise<void>;
  addUser: (user: Omit<AppUserItem, 'id' | 'lastSeen'>) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
  requestPartnerPayout: (amount: number, method: string, account: string) => Promise<boolean>;
  updateFactoryProfileInfo: (info: Partial<FactoryProfileInfo>) => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchRolls: (orderNo?: string, machine?: string) => Promise<RollTagItem[]>;
  saveJobCardGrid: (payload: {
    order_no: string;
    machine_code: string;
    placement_index?: number;
    rolls: any[];
    remarks?: string;
  }) => Promise<void>;
  saveShiftProduction: (payload: {
    order_no: string;
    date?: string;
    date_label?: string;
    shift: string;
    rows: any[];
  }) => Promise<{ new_rolls: any[]; logs: any[]; done_kg: number }>;
  fetchParties: () => Promise<void>;
  fetchOperators: () => Promise<void>;
  createParty: (partyData: {
    name: string;
    type: 'ven' | 'sup';
    addr?: string;
    contact?: string;
    phone?: string;
    email?: string;
    bin?: string;
    rate?: number;
    terms?: string;
    open?: number;
  }) => Promise<PartyItem>;
  togglePartyStatus: (idOrCode: string | number) => Promise<void>;
  deleteParty: (idOrCode: string | number) => Promise<void>;
  qcInspections: any[];
  fetchQcInspections: () => Promise<any[]>;
  storeQcInspection: (payload: {
    order_no: string;
    placement_index: number;
    roll_no: string;
    machine_code?: string;
    weight_kg?: number;
    issue: string;
    verdict: 'ok' | 'bad';
    note?: string;
    side: 'fac' | 'ven';
    signed_by: string;
  }) => Promise<any>;
  signQcInspection: (
    qcNo: string,
    payload: {
      side: 'fac' | 'ven';
      verdict: 'ok' | 'bad';
      signed_by: string;
      note?: string;
      action_taken?: string;
    }
  ) => Promise<any>;
  updateQcAction: (qcNo: string, action_taken: string) => Promise<any>;
  deliveryChallans: any[];
  fetchChallans: () => Promise<any[]>;
  createDeliveryChallan: (payload: {
    party_code: string;
    order_no: string;
    rolls: string[];
    vehicle_no: string;
    driver_name?: string;
    signed_by?: string;
  }) => Promise<any>;
  signChallan: (challanNo: string, receivedRolls: number, signedBy?: string) => Promise<any>;
  storeInventory: any[];
  storeLogs: any[];
  fetchStoreData: () => Promise<void>;
  recordStoreMovement: (payload: {
    item_code: string;
    type: 'in' | 'out' | 'rfq';
    qty?: number;
    price?: number;
    machine_code?: string;
    issued_by?: string;
  }) => Promise<any>;
  addStoreItem: (payload: {
    name: string;
    category: string;
    unit: string;
    stock_qty: number;
    min_qty: number;
    unit_price: number;
    item_code?: string;
  }) => Promise<any>;
  addYarnInward: (payload: {
    order_no: string;
    count: string;
    spinner?: string;
    lot?: string;
    bags?: number;
    kg: number;
  }) => Promise<any>;
  requestYarnReturn: (payload: {
    order_no: string;
    lot: string;
    kg: number;
    note?: string;
  }) => Promise<any>;
  createYarnReturnChallan: (payload: {
    order_no: string;
    lot: string;
    kg: number;
    date_label?: string;
  }) => Promise<any>;
  factoryBills: KKBill[];
  fetchBills: () => Promise<KKBill[]>;
  createKkBill: (partyCode: string, orderIds: string[]) => Promise<any>;
  recordKkBillPayment: (billNo: string, amount: number, mode?: string, ref?: string) => Promise<any>;
}

export interface KKBillLine {
  o: string;
  fab?: string;
  kg: number;
  rate: number;
}

export interface KKBillPayment {
  d: string;
  amt: number;
  rv: string;
  mode: string;
  pend?: boolean;
}

export interface KKBill {
  no: string;
  f: string;
  date: string;
  v: string;
  lines: KKBillLine[];
  jv: string;
  recv: KKBillPayment[];
}

export const INITIAL_KK_BILLS: KKBill[] = [
  {
    no: 'BL-2610-001',
    f: 'f1',
    date: '2026-10-01',
    v: 'abc',
    lines: [{ o: 'ORD-26-0891', kg: 4200, rate: 30 }],
    jv: 'JV-0928',
    recv: [{ d: '2026-10-02', amt: 70000, rv: 'RV-0931', mode: 'ব্যাংক ট্রান্সফার — ব্যাংক A' }],
  },
  {
    no: 'BL-2609-018',
    f: 'f1',
    date: '2026-09-28',
    v: 'xyz',
    lines: [{ o: 'ORD-26-0885', kg: 6000, rate: 32 }],
    jv: 'JV-0915',
    recv: [{ d: '2026-09-30', amt: 192000, rv: 'RV-0918', mode: 'চেক — ব্যাংক B' }],
  },
  {
    no: 'BL-2609-012',
    f: 'f1',
    date: '2026-09-18',
    v: 'abc',
    lines: [{ o: 'ORD-26-0870', kg: 3800, rate: 29 }],
    jv: 'JV-0902',
    recv: [{ d: '2026-09-22', amt: 110200, rv: 'RV-0906', mode: 'ব্যাংক ট্রান্সফার — ব্যাংক A' }],
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation & Screen States
  const [screen, setScreenState] = useState<AppScreenMode>('site');
  const [marketingPage, setMarketingPage] = useState<MarketingSubPage>('home');
  const [factoryView, setFactoryView] = useState<string>('dash');
  const [vendorView, setVendorView] = useState<string>('dash');
  const [supplierView, setSupplierView] = useState<string>('sdash');
  const [role, setRole] = useState<UserRoleKey>('owner');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const setScreen = (scr: AppScreenMode) => {
    setScreenState(scr);
    if (scr === 'site') {
      if (location.pathname !== '/' && location.pathname !== '/home') {
        navigate('/home');
      }
    } else if (scr === 'auth') {
      if (!['/login', '/register', '/auth'].includes(location.pathname)) {
        navigate('/login');
      }
    } else {
      if (location.pathname !== '/dashboard') {
        navigate('/dashboard');
      }
    }
  };

  // Sync route changes (URL direct load, browser back/forward buttons) to state
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) {
      if (role === 'vendor') setScreenState('vendor');
      else if (role === 'supplier') setScreenState('supplier');
      else setScreenState('factory');
    } else if (path.startsWith('/login') || path.startsWith('/auth') || path.startsWith('/register')) {
      setScreenState('auth');
    } else if (path === '/' || path.startsWith('/home')) {
      setScreenState('site');
    }
  }, [location.pathname, role]);

  // Auth User Session
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem('silposetu_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return null;
  });

  const logout = () => {
    apiClient.setToken(null);
    localStorage.removeItem('silposetu_user');
    setCurrentUser(null);
    setScreen('auth');
    navigate('/login');
    addToast({
      type: 'info',
      title: 'লগআউট',
      message: 'সিস্টেম থেকে সফলভাবে লগআউট করা হয়েছে।',
    });
  };

  const loginUser = async (identifier: string, pass: string, roleKey: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await apiClient.post('/auth/login', {
        identifier: identifier.trim(),
        phone: identifier.trim(),
        email: identifier.trim(),
        password: pass.trim(),
        role: roleKey,
      });

      if (res && res.success && res.data) {
        const u = res.data.user;
        const token = res.data.token;
        if (token) {
          apiClient.setToken(token);
        }
        const userObj = {
          id: u.id,
          name: u.name,
          phone: u.phone,
          email: u.email,
          role: u.role || roleKey,
          designation: u.designation,
          organization_name: u.organization_name,
          factory_id: u.factory_id,
          vendor_id: u.vendor_id,
          supplier_id: u.supplier_id,
          partner_code: u.partner_code,
          token,
        };
        setCurrentUser(userObj);
        localStorage.setItem('silposetu_user', JSON.stringify(userObj));
        return { success: true, message: res.message || 'সফলভাবে সাইন ইন হয়েছে' };
      }
      throw new Error(res?.message || 'লগইন ব্যর্থ হয়েছে। সঠিক তথ্য দিন।');
    } catch (err: any) {
      console.error('[Login API error]', err.message);
      throw new Error(err.message || 'মোবাইল নম্বর/ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।');
    }
  };

  const resetPasswordUser = async (identifier: string, code: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await apiClient.post('/auth/reset-password', {
        identifier: identifier.trim(),
        code: code.trim(),
        password: pass.trim(),
      });

      if (res && res.success && res.data) {
        const u = res.data.user;
        const token = res.data.token;
        if (token) {
          apiClient.setToken(token);
        }
        const userObj = {
          id: u.id,
          name: u.name,
          phone: u.phone,
          email: u.email,
          role: u.role,
          designation: u.designation,
          organization_name: u.organization_name,
          factory_id: u.factory_id,
          token,
        };
        setCurrentUser(userObj);
        localStorage.setItem('silposetu_user', JSON.stringify(userObj));
        return { success: true, message: res.message || 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।' };
      }
      throw new Error(res?.message || 'পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে।');
    } catch (err: any) {
      console.error('[Reset Password API error]', err.message);
      throw new Error(err.message || 'পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে।');
    }
  };

  const registerUser = async (data: any): Promise<{ success: boolean; message?: string; user?: any }> => {
    try {
      const res = await apiClient.post('/auth/register', data);
      if (res && res.success && res.data) {
        const u = res.data.user;
        const token = res.data.token;
        if (token) {
          apiClient.setToken(token);
        }
        const userObj = {
          id: u.id,
          name: u.name,
          phone: u.phone,
          email: u.email,
          role: u.role || data.role,
          designation: u.designation,
          organization_name: u.organization_name,
          factory_id: u.factory_id,
          token,
        };
        setCurrentUser(userObj);
        localStorage.setItem('silposetu_user', JSON.stringify(userObj));
        return { success: true, message: res.message, user: userObj };
      }
      throw new Error(res?.message || 'অ্যাকাউন্ট খুলতে ত্রুটি হয়েছে।');
    } catch (err: any) {
      console.error('[Register API error]', err.message);
      throw new Error(err.message || 'অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে।');
    }
  };



  // Selected Items
  const [selectedOrderId, setSelectedOrderId] = useState<string>('KK-2601');
  const [selectedThreadId, setSelectedThreadId] = useState<string>('TH-01');
  const [selectedVendorFactoryId, setSelectedVendorFactoryId] = useState<string>('FAC-1');

  // Core Domain State (100% Dynamic - Zero Mock Seed Defaults)
  const [factoryProfile, setFactoryProfile] = useState<FactoryProfileInfo>(INITIAL_FACTORY_PROFILE);
  const [vendorFactories, setVendorFactories] = useState<VendorFactoryDirectoryItem[]>([]);
  const [orders, setOrders] = useState<SubcontractOrderItem[]>([]);
  const [yarns, setYarns] = useState<YarnStockItem[]>([]);
  const [machines, setMachines] = useState<MachineItem[]>([]);
  const [operators, setOperators] = useState<OperatorItem[]>([]);
  const [prodLogs, setProdLogs] = useState<ProductionLogItem[]>([]);
  const [rolls, setRolls] = useState<RollTagItem[]>([]);
  const [qcLogs, setQcLogs] = useState<QcLogItem[]>([]);
  const [challans, setChallans] = useState<ChallanItem[]>([]);
  const [deliveryChallans, setDeliveryChallans] = useState<any[]>([]);
  const [qcInspections, setQcInspections] = useState<any[]>([]);
  const [storeInventory, setStoreInventory] = useState<any[]>([]);
  const [storeLogs, setStoreLogs] = useState<any[]>([]);
  const [factoryBills, setFactoryBills] = useState<KKBill[]>([]);
  const [bills, setBills] = useState<BillItem[]>([]);
  const [parties, setParties] = useState<PartyItem[]>([]);
  const [storeItems, setStoreItems] = useState<StoreStockItem[]>([]);
  const [storeIssues, setStoreIssues] = useState<StoreIssueItem[]>([]);
  const [vouchers, setVouchers] = useState<LedgerVoucherItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [users, setUsers] = useState<AppUserItem[]>([]);
  const [threads, setThreads] = useState<MessageThreadItem[]>([]);
  const [freeOffers, setFreeOffers] = useState<FreeMachineOfferItem[]>([]);
  const [jobs, setJobs] = useState<JobPostItem[]>([]);
  const [services] = useState<ServiceDetailItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [rfqs, setRfqs] = useState<SupplierRfqItem[]>([]);
  const [catalog, setCatalog] = useState<SupplierCatalogItem[]>([]);
  const [ads, setAds] = useState<SupplierAdItem[]>([]);
  const [marketplacePosts, setMarketplacePosts] = useState<MarketplaceSubcontractPost[]>([]);
  const [partner, setPartner] = useState<PartnerState>(INITIAL_PARTNER_STATE);

  // Dialog States
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [callModal, setCallModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    phone: string;
    whatsapp?: string;
    name?: string;
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    phone: '',
    whatsapp: '',
    name: '',
  });
  const [printModal, setPrintModal] = useState<{
    isOpen: boolean;
    title: string;
    documentType: 'challan' | 'bill' | 'jobcard' | 'qcreport' | 'rolltag';
    data: any;
  }>({
    isOpen: false,
    title: '',
    documentType: 'challan',
    data: null,
  });

  // Dashboard State
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isDashboardSyncing, setIsDashboardSyncing] = useState(false);

  const fetchDashboardData = async () => {
    setIsDashboardSyncing(true);
    try {
      const res = await apiClient.get('portal/dashboard');
      if (res && res.success && res.data) {
        setDashboardData(res.data);
        if (Array.isArray(res.data.machines)) {
          setMachines(res.data.machines);
        }
      }
    } catch (err: any) {
      console.warn('Dashboard sync fallback to offline state:', err.message);
    } finally {
      setIsDashboardSyncing(false);
    }
  };

  const quickProductionEntry = async (entry: {
    machine_code: string;
    shift: string;
    operator_name: string;
    order_no?: string;
    net_kg: number;
    rolls_count: number;
    reject_kg?: number;
    rpm?: number;
    notes?: string;
  }) => {
    try {
      const res = await apiClient.post('portal/dashboard/quick-production', entry);
      addToast({
        type: 'success',
        title: 'শিফট এন্ট্রি সফল',
        message: res.message || `${entry.machine_code} এ ${entry.net_kg} kg প্রোডাকশন এন্ট্রি হয়েছে।`,
      });
      await fetchDashboardData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'এন্ট্রি ব্যর্থ',
        message: err.message || 'শিফট এন্ট্রি সংরক্ষণ করা সম্ভব হয়নি।',
      });
    }
  };

  const broadcastFreeMachines = async (
    machineCodes: string[],
    isBroadcast: boolean,
    freeFrom?: string,
    dailyCapacity?: number,
    note?: string
  ) => {
    try {
      const res = await apiClient.post('portal/dashboard/broadcast-free', {
        machine_codes: machineCodes,
        is_broadcast: isBroadcast,
        free_from: freeFrom,
        daily_capacity_kg: dailyCapacity,
        note,
      });
      addToast({
        type: 'success',
        title: 'ফ্রি মেশিন ব্রডকাস্ট',
        message: res.message || `${machineCodes.length}টি মেশিন সফলভাবে ব্রডকাস্ট করা হয়েছে।`,
      });
      await fetchDashboardData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'ব্রডকাস্ট ত্রুটি',
        message: err.message || 'ব্রডকাস্ট সংরক্ষণ করা সম্ভব হয়নি।',
      });
    }
  };

  const submitQuotation = async (data: {
    subcontract_post_id: number;
    offered_rate_tk: number;
    estimated_days?: number;
    allocated_machines?: number;
    note?: string;
  }) => {
    try {
      const res = await apiClient.post('portal/dashboard/submit-quotation', data);
      addToast({
        type: 'success',
        title: 'কোটেশন প্রেরিত হয়েছে',
        message: res.message || 'বায়ার সাব-কন্ট্রাক্ট দরপত্র সফলভাবে পাঠানো হয়েছে।',
      });
      await fetchDashboardData();
      return true;
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'কোটেশন ত্রুটি',
        message: err.message || 'দরপত্র পাঠানো সম্ভব হয়নি।',
      });
      return false;
    }
  };

  // Toggle Theme
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Toast Helpers
  const addToast = (msg: { type: 'success' | 'error' | 'info'; title?: string; message: string }) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { ...msg, id }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Call Modal Helpers
  const openCallModal = (data: { title: string; subtitle?: string; phone: string; whatsapp?: string; name?: string }) => {
    setCallModal({ isOpen: true, ...data });
  };
  const closeCallModal = () => {
    setCallModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Print Modal Helpers
  const openPrintModal = (documentType: 'challan' | 'bill' | 'jobcard' | 'qcreport' | 'rolltag', title: string, data: any) => {
    setPrintModal({ isOpen: true, documentType, title, data });
  };
  const closePrintModal = () => {
    setPrintModal((prev) => ({ ...prev, isOpen: false, data: null }));
  };

  // On Mount: Sync with Backend API Bootstrap
  useEffect(() => {
    try {
      localStorage.removeItem('silposetu_orders');
    } catch {}

    if (currentUser?.token) {
      apiClient.setToken(currentUser.token);
      apiClient
        .get('auth/me')
        .then((res) => {
          if (res?.data?.user) {
            const u = res.data.user;
            setCurrentUser((prev: any) => {
              const updated = {
                ...prev,
                name: u.name,
                phone: u.phone,
                email: u.email,
                role: u.role || prev?.role,
                designation: u.designation,
                organization_name: u.organization_name,
                factory_id: u.factory_id,
              };
              localStorage.setItem('silposetu_user', JSON.stringify(updated));
              return updated;
            });
          }
        })
        .catch(() => {
          // Keep existing local user on network failure
        });
    }

    apiClient
      .get('bootstrap')
      .then((res) => {
        if (res && res.data) {
          const d = res.data;
          if (d.factory) setFactoryProfile(d.factory);
          if (Array.isArray(d.orders)) setOrders(d.orders);
          if (Array.isArray(d.machines)) setMachines(d.machines);
          if (Array.isArray(d.yarns)) setYarns(d.yarns);
          if (Array.isArray(d.qcLogs)) setQcLogs(d.qcLogs);
          if (Array.isArray(d.operators)) setOperators(d.operators);
          if (Array.isArray(d.parties)) setParties(d.parties);
          if (Array.isArray(d.rolls)) setRolls(d.rolls);
          if (Array.isArray(d.prodLog)) setProdLogs(d.prodLog);
          if (Array.isArray(d.challans)) setDeliveryChallans(d.challans);
          if (Array.isArray(d.bills)) setFactoryBills(d.bills);
          if (Array.isArray(d.store)) setStoreInventory(d.store);
          if (Array.isArray(d.issueLog)) setStoreLogs(d.issueLog);
          if (Array.isArray(d.jobs) && d.jobs.length) setJobs(d.jobs);
          if (Array.isArray(d.suppliers) && d.suppliers.length) setSuppliers(d.suppliers);
          if (Array.isArray(d.rfqs) && d.rfqs.length) setRfqs(d.rfqs);
          if (Array.isArray(d.supplierRfqs) && (!d.rfqs || !d.rfqs.length)) setRfqs(d.supplierRfqs);
          if (Array.isArray(d.subcontract_posts) && d.subcontract_posts.length) setMarketplacePosts(d.subcontract_posts);
          else if (Array.isArray(d.subcontractPosts) && d.subcontractPosts.length) setMarketplacePosts(d.subcontractPosts);
          if (Array.isArray(d.freeOffers) && d.freeOffers.length) setFreeOffers(d.freeOffers);
          if (Array.isArray(d.attendance) && d.attendance.length) setAttendance(d.attendance);
          if (Array.isArray(d.users) && d.users.length) setUsers(d.users);
          if (Array.isArray(d.threads) && d.threads.length) setThreads(d.threads);
          if (Array.isArray(d.vouchers) && d.vouchers.length) setVouchers(d.vouchers);
          if (d.expenses && d.expenses.length) {
            setExpenses(d.expenses.map((e: any) => ({
              id: e.id,
              category: e.cat,
              title: e.title,
              amount: e.amt,
              method: e.method,
              ref: e.ref,
              date: e.date,
              createdBy: e.by,
              notes: e.notes,
            })));
          }
          if (d.partner) {
            setPartner((prev) => ({
              ...prev,
              partnerCode: d.partner.code,
              totalReferrals: d.partner.total_referrals,
              activeFactoriesCount: d.partner.active_factories,
              totalCommissionTk: d.partner.commission_earned,
              withdrawnCommissionTk: d.partner.withdrawn,
              balanceCommissionTk: d.partner.balance,
              payoutMethod: d.partner.payout_method,
              payoutNumber: d.partner.payout_number,
            }));
          }
        }
      })
      .catch((err) => {
        console.info('API Bootstrap offline/local fallback active:', err.message);
      });
    fetchOrders();
    fetchParties();
    fetchOperators();
    fetchQcInspections();
    fetchChallans();
    fetchStoreData();
    fetchDashboardData();
  }, []);

  // Mutation Handlers
  const addProductionEntry = async (entry: Omit<ProductionLogItem, 'id'>) => {
    const newId = `PR-${Date.now().toString().slice(-4)}`;
    const fullItem: ProductionLogItem = { ...entry, id: newId };
    setProdLogs((prev) => [fullItem, ...prev]);

    // Also update order line knitted kg
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== entry.orderId) return o;
        const updatedLines = o.lines.map((ln, idx) => {
          if (idx !== entry.lineIdx) return ln;
          return {
            ...ln,
            knitKg: ln.knitKg + entry.kg,
            rolls: ln.rolls + entry.rolls,
          };
        });
        return { ...o, lines: updatedLines };
      })
    );

    // Also create roll tags
    const newRoll: RollTagItem = {
      rollId: `RL-${entry.orderId.replace(/[^0-9]/g, '')}-${Date.now().toString().slice(-3)}`,
      orderId: entry.orderId,
      lineIdx: entry.lineIdx,
      machine: entry.machine,
      operator: entry.operator,
      shift: entry.shift,
      date: entry.date,
      fabric: 'Grey Fabric',
      dia: 'Standard',
      gsm: 180,
      lot: 'LOT-PR',
      kg: Number((entry.kg / Math.max(1, entry.rolls)).toFixed(1)),
      status: 'Knitted',
    };
    setRolls((prev) => [newRoll, ...prev]);

    addToast({
      type: 'success',
      title: 'প্রোডাকশন সেভ হয়েছে',
      message: `${entry.machine} মেশিনে ${entry.kg} কেজি এন্ট্রি সফল।`,
    });

    try {
      await apiClient.post('portal/production', fullItem);
    } catch {
      // Handled locally
    }
  };

  const updateRollStatus = async (rollId: string, status: RollTagItem['status'], qcData?: Partial<QcLogItem>) => {
    setRolls((prev) =>
      prev.map((r) => (r.rollId === rollId ? { ...r, status } : r))
    );

    if (qcData) {
      const newQc: QcLogItem = {
        id: `QC-${Date.now().toString().slice(-4)}`,
        date: new Date().toLocaleDateString('bn-BD'),
        rollId,
        orderId: qcData.orderId || 'KK-2601',
        fabric: qcData.fabric || 'Single Jersey',
        dia: qcData.dia || '30" × 24G',
        reqGsm: qcData.reqGsm || 160,
        actGsm: qcData.actGsm || 160,
        reqDia: qcData.reqDia || 30,
        actDia: qcData.actDia || 30,
        weightKg: qcData.weightKg || 24,
        lengthYds: qcData.lengthYds || 70,
        defects: qcData.defects || [],
        totalPts: qcData.totalPts || 0,
        ptsPer100: qcData.ptsPer100 || 0,
        grade: status === 'QC Pass' ? 'A (Pass)' : status === 'Hold' ? 'B (Minor)' : 'Reject (Hold)',
        status: status === 'QC Pass' ? 'Pass' : status === 'Hold' ? 'Minor' : 'Reject',
        inspector: qcData.inspector || 'QC Inspector',
      };
      setQcLogs((prev) => [newQc, ...prev]);
    }

    addToast({
      type: 'success',
      title: 'রোল স্ট্যাটাস আপডেট',
      message: `${rollId} রোলটি ${status} করা হয়েছে।`,
    });
  };

  const createChallan = async (challan: Omit<ChallanItem, 'no'>) => {
    const no = `CH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const fullChallan: ChallanItem = { ...challan, no };
    setChallans((prev) => [fullChallan, ...prev]);

    // Update order delivered kg
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== challan.orderId) return o;
        const updatedLines = o.lines.map((l, idx) =>
          idx === challan.lineIdx ? { ...l, delivKg: l.delivKg + challan.netKg } : l
        );
        return { ...o, lines: updatedLines };
      })
    );

    addToast({
      type: 'success',
      title: 'চালান প্রস্তুত',
      message: `চালান ${no} তৈরি হয়েছে।`,
    });

    try {
      await apiClient.post('portal/challans', fullChallan);
    } catch {
      // Local state active
    }
  };

  const receiveYarnInward = async (yarn: Omit<YarnStockItem, 'id'>) => {
    const id = `YR-${Math.floor(500 + Math.random() * 500)}`;
    const fullYarn: YarnStockItem = { ...yarn, id };
    setYarns((prev) => [fullYarn, ...prev]);

    // Update order line yarn received
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== yarn.orderId) return o;
        const updated = o.lines.map((l, idx) =>
          idx === yarn.lineIdx ? { ...l, yarnRcv: l.yarnRcv + yarn.rcvKg } : l
        );
        return { ...o, lines: updated };
      })
    );

    addToast({
      type: 'success',
      title: 'সুতা রিসিভ সম্পন্ন',
      message: `${yarn.party} থেকে ${yarn.rcvKg} কেজি (${yarn.count}) রিসিভ এন্ট্রি হয়েছে।`,
    });

    try {
      await apiClient.post('portal/yarn/receive', fullYarn);
    } catch {
      // Handled
    }
  };

  const createOrder = async (order: Omit<SubcontractOrderItem, 'id'> & { id?: string }): Promise<string> => {
    const id = order.id?.trim() || order.po?.trim() || `SC-2610-02${orders.length + 1}`;
    const fullOrder: SubcontractOrderItem = { ...order, id };
    const totalKg = (order as any).totalKg || fullOrder.lines.reduce((acc, l) => acc + (l.orderKg || 0), 0) || 0;

    const backendPayload = {
      id: fullOrder.id,
      party_id: fullOrder.party_id || undefined,
      vendor_name: fullOrder.party,
      buyer: fullOrder.buyer,
      qty: totalKg,
      order_date: fullOrder.orderDate,
      yarn_received_date: fullOrder.orderDate,
      delivery_due: fullOrder.delivDate,
      lines: fullOrder.lines.map((l) => ({
        place: (l as any).place || 'Body',
        fab: l.fabric || 'Single Jersey',
        fabric: l.fabric || 'Single Jersey',
        color: fullOrder.color || 'Raw',
        dia: l.dia || '30" × 24G',
        gsm: l.gsm || 160,
        ggsm: l.gsm || 160,
        fgsm: l.gsm || 160,
        sl: l.stitch || '2.65 mm',
        rate: l.rate || 14,
        qty: l.orderKg || 0,
        order_kg: l.orderKg || 0,
        machines: l.machine ? l.machine.split(',').map((m) => m.trim()).filter(Boolean) : ['M-01'],
        yarns: [{ count: l.yarn || '30/1 Combed', brand: l.brand || 'Square', lot: l.lot || 'LOT-1', bags: 0, rcv_kg: l.yarnRcv || 0 }],
      })),
    };

    // Save directly to backend MySQL database first
    const res = await apiClient.post('portal/orders', backendPayload);
    if (!res || res.success === false) {
      throw new Error(res?.message || 'ডাটাবেজে অর্ডার সেভ করতে সমস্যা হয়েছে।');
    }

    // After MySQL confirms insert, update local state
    setOrders((prev) => [fullOrder, ...prev]);

    addToast({
      type: 'success',
      title: 'নতুন অর্ডার ক্রিয়েট হয়েছে',
      message: `অর্ডার ${id} (${order.party}) ডাটাবেজে সফলভাবে যুক্ত হয়েছে।`,
    });

    return id;
  };

  const deleteOrder = async (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    addToast({
      type: 'info',
      title: 'অর্ডার মুছে ফেলা হয়েছে',
      message: `অর্ডার ${id} তালিকা থেকে মুছে ফেলা হয়েছে।`,
    });
    try {
      await apiClient.delete(`portal/orders/${id}`);
    } catch {
      // Handled
    }
  };

  const clearAllOrders = async () => {
    setOrders([]);
    try {
      localStorage.removeItem('silposetu_orders');
    } catch {}
    addToast({
      type: 'info',
      title: 'সব অর্ডার মুছে ফেলা হয়েছে',
      message: 'সব অর্ডার তালিকা থেকে মুছে ফেলা হয়েছে।',
    });
    try {
      await apiClient.delete('portal/orders');
    } catch {
      // Handled
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await apiClient.get('portal/orders');
      if (res && res.data) {
        if (Array.isArray(res.data)) {
          setOrders(res.data);
        } else if (res.data.items && Array.isArray(res.data.items)) {
          setOrders(res.data.items);
        }
      }
    } catch (err: any) {
      console.info('Fetch orders fallback:', err.message);
    }
  };

  const fetchRolls = async (orderNo?: string, machine?: string): Promise<RollTagItem[]> => {
    try {
      const params: any = {};
      if (orderNo) params.order_no = orderNo;
      if (machine) params.machine_code = machine;
      const res = await apiClient.get('portal/rolls', { params });
      if (res && res.data && Array.isArray(res.data)) {
        setRolls((prev) => {
          if (!orderNo && !machine) return res.data;
          const otherRolls = prev.filter(
            (r: any) => !(orderNo && r.o === orderNo && (!machine || r.m === machine))
          );
          return [...otherRolls, ...res.data];
        });
        return res.data;
      }
    } catch (err: any) {
      console.info('Fetch rolls fallback:', err.message);
    }
    return rolls;
  };

  const saveJobCardGrid = async (payload: {
    order_no: string;
    machine_code: string;
    placement_index?: number;
    rolls: any[];
    remarks?: string;
  }) => {
    const res = await apiClient.post('portal/jobcard/save', payload);
    if (!res || res.success === false) {
      throw new Error(res?.message || 'জব কার্ড সেভ করতে সমস্যা হয়েছে।');
    }
    if (res.data && Array.isArray(res.data)) {
      setRolls((prev) => {
        const otherRolls = prev.filter(
          (r: any) => !(r.o === payload.order_no && r.m === payload.machine_code)
        );
        return [...otherRolls, ...res.data];
      });
    }
    addToast({
      type: 'success',
      title: 'জব কার্ড সংরক্ষিত',
      message: res.message || 'জব কার্ড সেভ হয়েছে · ভেন্ডরও দেখতে পাচ্ছে',
    });
  };

  const saveShiftProduction = async (payload: {
    order_no: string;
    date?: string;
    date_label?: string;
    shift: string;
    rows: any[];
  }) => {
    const res = await apiClient.post('portal/production/shift', payload);
    if (!res || res.success === false) {
      throw new Error(res?.message || 'প্রোডাকশন সেভ করতে সমস্যা হয়েছে।');
    }
    const data = res.data || {};
    if (data.new_rolls && Array.isArray(data.new_rolls)) {
      setRolls((prev) => [...prev, ...data.new_rolls]);
    }
    if (data.logs && Array.isArray(data.logs)) {
      setProdLogs(data.logs);
    }
    fetchOrders();

    addToast({
      type: 'success',
      title: 'প্রোডাকশন সংরক্ষিত',
      message: res.message || `${payload.order_no} · শিফট প্রোডাকশন ডাটাবেজে সেভ হয়েছে`,
    });

    return data;
  };

  const fetchParties = async () => {
    try {
      const res = await apiClient.get('portal/parties');
      if (res && res.data) {
        setParties(res.data);
      }
    } catch (err: any) {
      console.info('Parties fetch fallback to local/bootstrap:', err.message);
    }
  };

  const fetchOperators = async () => {
    try {
      const res = await apiClient.get('portal/operators');
      if (res && res.data && Array.isArray(res.data)) {
        setOperators(res.data);
      }
    } catch (err: any) {
      console.info('Operators fetch fallback to bootstrap/initial:', err.message);
    }
  };

  const createParty = async (partyData: {
    name: string;
    type: 'ven' | 'sup';
    addr?: string;
    contact?: string;
    phone?: string;
    email?: string;
    bin?: string;
    rate?: number;
    terms?: string;
    open?: number;
  }): Promise<PartyItem> => {
    const res = await apiClient.post('portal/parties', partyData);
    if (!res || res.success === false) {
      throw new Error(res?.message || 'ডাটাবেজে পার্টি সেভ করতে সমস্যা হয়েছে।');
    }
    const newParty: PartyItem = res.data;
    setParties((prev) => [newParty, ...prev]);
    addToast({
      type: 'success',
      title: 'নতুন পার্টি যোগ হয়েছে',
      message: res.message || `${newParty.name} যোগ হলো · লেজার খোলা হয়েছে`,
    });
    return newParty;
  };

  const togglePartyStatus = async (idOrCode: string | number) => {
    try {
      const res = await apiClient.post(`portal/parties/${idOrCode}/toggle`);
      const updatedOn = res?.data?.is_active ?? true;
      setParties((prev) =>
        prev.map((p) => {
          if (p.id === idOrCode || p.code === idOrCode) {
            return { ...p, is_active: updatedOn, on: updatedOn };
          }
          return p;
        })
      );
      addToast({
        type: 'info',
        title: 'পার্টি স্ট্যাটাস',
        message: res?.message || 'স্ট্যাটাস আপডেট হয়েছে',
      });
    } catch (err: any) {
      // Local fallback toggle
      setParties((prev) =>
        prev.map((p) => {
          if (p.id === idOrCode || p.code === idOrCode) {
            const next = !Boolean(p.is_active ?? p.on);
            return { ...p, is_active: next, on: next };
          }
          return p;
        })
      );
      addToast({
        type: 'info',
        title: 'পার্টি স্ট্যাটাস',
        message: 'স্ট্যাটাস পরিবর্তন করা হয়েছে',
      });
    }
  };

  const deleteParty = async (idOrCode: string | number) => {
    try {
      const res = await apiClient.delete(`portal/parties/${idOrCode}`);
      setParties((prev) => prev.filter((p) => p.id !== idOrCode && p.code !== idOrCode));
      addToast({
        type: 'info',
        title: 'পার্টি মুছে ফেলা হয়েছে',
        message: res?.message || 'পার্টি সফলভাবে মুছে ফেলা হয়েছে',
      });
    } catch (err: any) {
      setParties((prev) => prev.filter((p) => p.id !== idOrCode && p.code !== idOrCode));
      addToast({
        type: 'info',
        title: 'পার্টি মুছে ফেলা হয়েছে',
        message: 'পার্টি তালিকা থেকে মুছে ফেলা হয়েছে',
      });
    }
  };

  const fetchQcInspections = async (): Promise<any[]> => {
    try {
      const res = await apiClient.get('portal/qc');
      if (res && res.data && Array.isArray(res.data)) {
        setQcInspections(res.data);
        return res.data;
      }
    } catch (err: any) {
      console.warn('Fetch QC fallback:', err.message);
    }
    return [];
  };

  const storeQcInspection = async (payload: {
    order_no: string;
    placement_index: number;
    roll_no: string;
    machine_code?: string;
    weight_kg?: number;
    issue: string;
    verdict: 'ok' | 'bad';
    note?: string;
    side: 'fac' | 'ven';
    signed_by: string;
  }): Promise<any> => {
    const res = await apiClient.post('portal/qc', payload);
    await Promise.all([fetchOrders(), fetchQcInspections()]);
    addToast({
      type: 'success',
      title: 'QC এন্ট্রি সম্পন্ন',
      message: res?.message || 'QC এন্ট্রি সফলভাবে সংরক্ষণ করা হয়েছে',
    });
    return res?.data;
  };

  const signQcInspection = async (
    qcNo: string,
    payload: {
      side: 'fac' | 'ven';
      verdict: 'ok' | 'bad';
      signed_by: string;
      note?: string;
      action_taken?: string;
    }
  ): Promise<any> => {
    const res = await apiClient.post(`portal/qc/${qcNo}/sign`, payload);
    await Promise.all([fetchOrders(), fetchQcInspections()]);
    addToast({
      type: 'success',
      title: 'QC সাইন সম্পন্ন',
      message: res?.message || 'QC সাইন সংরক্ষিত হয়েছে',
    });
    return res?.data;
  };

  const updateQcAction = async (qcNo: string, action_taken: string): Promise<any> => {
    const res = await apiClient.post(`portal/qc/${qcNo}/action`, { action_taken });
    await Promise.all([fetchOrders(), fetchQcInspections()]);
    addToast({
      type: 'info',
      title: 'সিদ্ধান্ত সংরক্ষিত',
      message: 'ফ্যাক্টরির সিদ্ধান্ত সেভ হয়েছে · ভেন্ডরও দেখতে পাবে',
    });
    return res?.data;
  };

  const fetchChallans = async (): Promise<any[]> => {
    try {
      const res = await apiClient.get('portal/challans');
      if (res && res.data) {
        setDeliveryChallans(res.data);
        return res.data;
      }
    } catch (err: any) {
      console.warn('Challans fetch fallback:', err.message);
    }
    return deliveryChallans;
  };

  const createDeliveryChallan = async (payload: {
    party_code: string;
    order_no: string;
    rolls: string[];
    vehicle_no: string;
    driver_name?: string;
    signed_by?: string;
  }): Promise<any> => {
    try {
      const res = await apiClient.post('portal/challans', payload);
      await fetchChallans();
      await fetchRolls();
      await fetchOrders();
      addToast({
        type: 'success',
        title: 'চালান প্রস্তুত',
        message: res?.message || 'ডেলিভারি চালান সফলভাবে তৈরি হয়েছে',
      });
      return res?.data;
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'চালান তৈরিতে ত্রুটি',
        message: err.message || 'চালান তৈরি করা সম্ভব হয়নি',
      });
      throw err;
    }
  };

  const signChallan = async (challanNo: string, receivedRolls: number, signedBy?: string): Promise<any> => {
    try {
      const res = await apiClient.post(`portal/challans/${challanNo}/sign`, {
        received_rolls: receivedRolls,
        signed_by: signedBy || (currentUser?.name ? `${currentUser.name} (ভেন্ডর)` : 'ভেন্ডর প্রতিনিধি'),
      });
      await fetchChallans();
      addToast({
        type: 'success',
        title: 'চালান রিসিভ সাইন সম্পন্ন',
        message: res?.message || 'চালান সাইন সংরক্ষিত হয়েছে',
      });
      return res?.data;
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'সাইন ব্যর্থ',
        message: err.message || 'চালান সাইন সংরক্ষণ করা যায়নি',
      });
      throw err;
    }
  };

  const fetchStoreData = async (): Promise<void> => {
    try {
      const res = await apiClient.get('portal/store');
      if (res && res.data) {
        if (Array.isArray(res.data.items)) setStoreInventory(res.data.items);
        if (Array.isArray(res.data.logs)) setStoreLogs(res.data.logs);
      }
    } catch (err: any) {
      console.warn('Store data fetch error:', err.message);
    }
  };

  const recordStoreMovement = async (payload: {
    item_code: string;
    type: 'in' | 'out' | 'rfq';
    qty?: number;
    price?: number;
    machine_code?: string;
    issued_by?: string;
  }): Promise<any> => {
    try {
      const res = await apiClient.post('portal/store/movement', payload);
      await fetchStoreData();
      addToast({
        type: 'success',
        title: 'স্টোর আপডেট',
        message: res?.message || 'স্টোর স্টক ও মুভমেন্ট সংরক্ষিত হয়েছে',
      });
      return res?.data;
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'স্টোর মুভমেন্ট ত্রুটি',
        message: err.message || 'স্টোর আপডেট করা সম্ভব হয়নি',
      });
      throw err;
    }
  };

  const addStoreItem = async (payload: {
    name: string;
    category: string;
    unit: string;
    stock_qty: number;
    min_qty: number;
    unit_price: number;
    item_code?: string;
  }): Promise<any> => {
    try {
      const res = await apiClient.post('portal/store/item', payload);
      await fetchStoreData();
      addToast({
        type: 'success',
        title: 'নতুন আইটেম যোগ',
        message: res?.message || `${payload.name} সফলভাবে যোগ হয়েছে`,
      });
      return res?.data;
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'আইটেম যোগ ব্যর্থ',
        message: err.message || 'নতুন আইটেম তৈরি করা সম্ভব হয়নি',
      });
      throw err;
    }
  };

  const addYarnInward = async (payload: {
    order_no: string;
    count: string;
    spinner?: string;
    lot?: string;
    bags?: number;
    kg: number;
  }): Promise<any> => {
    try {
      const res = await apiClient.post('portal/yarn/receive', payload);
      await fetchOrders();
      addToast({
        type: 'success',
        title: 'সুতা গ্রহণ সম্পন্ন',
        message: res?.message || `${payload.order_no}-এ ${payload.kg} kg সুতা যোগ হয়েছে`,
      });
      return res?.data;
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'সুতা গ্রহণ ব্যর্থ',
        message: err.message || 'সুতা রিসিভ এন্ট্রি সংরক্ষণ করা সম্ভব হয়নি',
      });
      throw err;
    }
  };

  const requestYarnReturn = async (payload: {
    order_no: string;
    lot: string;
    kg: number;
    note?: string;
  }): Promise<any> => {
    try {
      const res = await apiClient.post('portal/yarn/request-return', payload);
      await fetchOrders();
      addToast({
        type: 'info',
        title: 'সুতা ফেরত রিকোয়েস্ট',
        message: res?.message || `${payload.lot}-এর ${payload.kg} kg ফেরত চাওয়া হলো · ফ্যাক্টরি ফেরত চালান তৈরি করবে`,
      });
      return res?.data;
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'রিকোয়েস্ট ব্যর্থ',
        message: err.message || 'সুতা ফেরত রিকোয়েস্ট পাঠানো যায়নি',
      });
      throw err;
    }
  };

  const createYarnReturnChallan = async (payload: {
    order_no: string;
    lot: string;
    kg: number;
    date_label?: string;
  }): Promise<any> => {
    try {
      const res = await apiClient.post('portal/yarn/return-challan', payload);
      await fetchOrders();
      addToast({
        type: 'success',
        title: 'সুতা ফেরত চালান প্রস্তুত',
        message: res?.message || `${payload.lot}-এর ${payload.kg} kg ফেরত চালান তৈরি · ভেন্ডর বুঝে নিয়ে সাইন দেবে`,
      });
      return res?.data;
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'চালান তৈরিতে ত্রুটি',
        message: err.message || 'সুতা ফেরত চালান তৈরি করা যায়নি',
      });
      throw err;
    }
  };

  const sendChatMessage = async (threadId: string, text: string, senderRole: 'factory' | 'vendor' = 'factory') => {
    const newMsg = {
      from: senderRole,
      sender: senderRole === 'factory' ? 'আল-মদিনা নিটিং' : 'বায়ার প্রতিনিধি',
      time: 'এইমাত্র',
      text,
    };

    setThreads((prev) =>
      prev.map((th) => (th.id === threadId ? { ...th, messages: [...th.messages, newMsg] } : th))
    );

    try {
      await apiClient.post(`portal/threads/${threadId}/messages`, newMsg);
    } catch {
      // Handled
    }
  };

  const applyForJob = async (jobId: string, applicant: { name: string; phone: string; exp: string; note: string }) => {
    addToast({
      type: 'success',
      title: 'আবেদন গৃহীত হয়েছে!',
      message: `${applicant.name}, আপনার সিভি সংশ্লিষ্ট ফ্যাক্টরিতে পাঠানো হয়েছে।`,
    });
    try {
      await apiClient.post(`public/jobs/${jobId}/apply`, applicant);
    } catch {
      // Handled
    }
  };

  const postRfq = async (rfq: Omit<SupplierRfqItem, 'id' | 'time' | 'status'>) => {
    const newId = `RFQ-${Math.floor(400 + Math.random() * 500)}`;
    const fullRfq: SupplierRfqItem = {
      ...rfq,
      id: newId,
      status: 'New',
      time: 'এইমাত্র',
    };
    setRfqs((prev) => [fullRfq, ...prev]);

    addToast({
      type: 'success',
      title: 'RFQ পোস্ট সম্পন্ন',
      message: 'আপনার কোটেশন রিকোয়েস্ট যাচাইকৃত সাপ্লায়ারদের কাছে পাঠানো হয়েছে।',
    });

    try {
      await apiClient.post('public/rfq', fullRfq);
    } catch {
      // Handled
    }
  };

  const toggleMachineStatus = async (machineId: string, newStatus: MachineItem['status']) => {
    setMachines((prev) =>
      prev.map((m) => (m.id === machineId ? { ...m, status: newStatus } : m))
    );

    addToast({
      type: 'info',
      title: 'মেশিন স্ট্যাটাস পরিবর্তন',
      message: `${machineId} এখন ${newStatus}`,
    });

    try {
      const statusMap: Record<string, string> = {
        Running: 'run',
        Idle: 'idle',
        Free: 'free',
        Maint: 'down',
      };
      await apiClient.post('portal/dashboard/toggle-machine', {
        machine_code: machineId,
        status: statusMap[newStatus] || 'idle',
      });
      await fetchDashboardData();
    } catch {
      // Local state preserved
    }
  };

  const fetchBills = async (): Promise<KKBill[]> => {
    try {
      const res = await apiClient.get('portal/bills');
      if (res && res.data && Array.isArray(res.data)) {
        setFactoryBills(res.data);
        return res.data;
      }
    } catch (err: any) {
      console.info('Bills fetch fallback to local:', err?.message);
    }
    return factoryBills;
  };

  const createKkBill = async (partyCode: string, orderIds: string[]) => {
    try {
      const res = await apiClient.post('portal/bills', {
        party_code: partyCode,
        order_ids: orderIds,
      });
      if (res && res.data) {
        const newBill: KKBill = {
          no: res.data.bill_no,
          f: res.data.factory_code || 'f1',
          date: res.data.bill_date || '2026-10-03',
          v: res.data.party_code || partyCode,
          lines: res.data.lines_json || [],
          jv: res.data.jv_no || 'JV-0935',
          recv: res.data.payments_json || [],
        };
        setFactoryBills((prev) => [newBill, ...prev]);
        addToast({
          type: 'success',
          title: 'বিল ও ভাউচার তৈরি হয়েছে',
          message: `${newBill.no} তৈরি হলো · জার্নাল ভাউচার ${newBill.jv}`,
        });
        return newBill;
      }
    } catch {
      // Local fallback
      const billSeq = factoryBills.length + 1;
      const jvSeq = factoryBills.length + 928;
      const billNo = `BL-2610-${String(billSeq).padStart(3, '0')}`;
      const jvNo = `JV-${String(jvSeq).padStart(4, '0')}`;
      const candidateOrders = orders.filter((o) => orderIds.includes(o.id));
      const lines: KKBillLine[] = candidateOrders.map((o) => ({
        o: o.id,
        fab: `${o.fabric} ${o.gsm}`,
        kg: o.delivered || o.done || 0,
        rate: o.rateTk || 30,
      }));
      const newBill: KKBill = {
        no: billNo,
        f: 'f1',
        date: '2026-10-03',
        v: partyCode,
        lines,
        jv: jvNo,
        recv: [],
      };
      setFactoryBills((prev) => [newBill, ...prev]);
      addToast({
        type: 'success',
        title: 'বিল তৈরি হয়েছে',
        message: `${billNo} তৈরি হলো · ভাউচার ${jvNo}`,
      });
      return newBill;
    }
  };

  const recordKkBillPayment = async (
    billNo: string,
    amount: number,
    mode: string = 'ব্যাংক ট্রান্সফার — ব্যাংক A',
    ref?: string
  ) => {
    const rvNo = ref || `RV-${String(931 + Math.floor(Math.random() * 50)).padStart(4, '0')}`;
    setFactoryBills((prev) =>
      prev.map((b) => {
        if (b.no !== billNo) return b;
        const recv = b.recv || [];
        return {
          ...b,
          recv: [...recv, { d: '2026-10-03', amt: amount, rv: rvNo, mode }],
        };
      })
    );
    addToast({
      type: 'success',
      title: 'টাকা জমা হয়েছে',
      message: `${rvNo} তৈরি হলো · লেজার আপডেট`,
    });

    try {
      await apiClient.post(`portal/bills/${billNo}/pay`, {
        amount,
        mode,
        ref: rvNo,
      });
    } catch {
      // Handled
    }
  };

  const recordBillPayment = async (billNo: string, amount: number) => {
    setBills((prev) =>
      prev.map((b) => {
        if (b.no !== billNo) return b;
        const newPaid = b.paidAmt + amount;
        const isFull = newPaid >= b.grossAmt - b.discount;
        return {
          ...b,
          paidAmt: newPaid,
          status: isFull ? 'Paid' : 'Part',
        };
      })
    );

    addToast({
      type: 'success',
      title: 'পেমেন্ট জমা হয়েছে',
      message: `বিল ${billNo} বাবদ ৳ ${amount.toLocaleString('en-IN')} জমা রেকর্ড করা হয়েছে।`,
    });

    try {
      await apiClient.post(`portal/bills/${billNo}/pay`, { amount });
    } catch {
      // Handled
    }
  };

  const issueStoreItem = async (issue: Omit<StoreIssueItem, 'id'>) => {
    const newId = `IS-${Math.floor(700 + Math.random() * 300)}`;
    const fullIssue: StoreIssueItem = { ...issue, id: newId };
    setStoreIssues((prev) => [fullIssue, ...prev]);

    // Decrease item stock
    setStoreItems((prev) =>
      prev.map((it) => (it.id === issue.itemId ? { ...it, stock: Math.max(0, it.stock - issue.qty) } : it))
    );

    addToast({
      type: 'success',
      title: 'স্টোর মাল ইস্যু সম্পন্ন',
      message: `${issue.itemName} (${issue.qty} ${issue.unit}) ${issue.machine} এ ইস্যু হয়েছে।`,
    });

    try {
      await apiClient.post('portal/store/movement', fullIssue);
    } catch {
      // Handled
    }
  };

  const addExpense = async (expense: Omit<ExpenseItem, 'id'>) => {
    const newId = Date.now();
    const full: ExpenseItem = { ...expense, id: newId };
    setExpenses((prev) => [full, ...prev]);

    const newVoucher: LedgerVoucherItem = {
      id: `JV-${Math.floor(1000 + Math.random() * 9000)}`,
      date: expense.date,
      party: 'ফ্যাক্টরি খরচ খাতা',
      type: 'Expense',
      method: expense.method.toUpperCase(),
      ref: expense.ref || `EX-${newId}`,
      narration: expense.title,
      debit: expense.amount,
      credit: 0,
    };
    setVouchers((prev) => [newVoucher, ...prev]);

    addToast({
      type: 'success',
      title: 'খরচ রেকর্ড হয়েছে',
      message: `${expense.title} (৳${expense.amount.toLocaleString('en-IN')}) খরচ এন্ট্রি সংরক্ষিত।`,
    });

    try {
      await apiClient.post('portal/accounts/expenses', {
        category: expense.category,
        title: expense.title,
        amount_tk: expense.amount,
        payment_method: expense.method,
        reference_no: expense.ref,
        expense_date: expense.date,
        created_by: expense.createdBy,
        notes: expense.notes,
      });
    } catch {
      // Local fallback
    }
  };

  const punchAttendance = async (
    workerName: string,
    status: AttendanceItem['todayStatus'],
    otHours?: number,
    shift?: string
  ) => {
    setAttendance((prev) =>
      prev.map((a) =>
        a.name === workerName
          ? {
              ...a,
              todayStatus: status,
              otHours: otHours !== undefined ? a.otHours + otHours : a.otHours,
              presentDays: status === 'Present' ? a.presentDays + 1 : a.presentDays,
            }
          : a
      )
    );

    addToast({
      type: 'success',
      title: 'হাজিরা সম্পন্ন',
      message: `${workerName} এর আজকের হাজিরা: ${status} চিহ্নিত করা হয়েছে।`,
    });

    try {
      await apiClient.post('portal/attendance/punch', {
        worker_name: workerName,
        role_type: 'operator',
        shift: shift || 'A',
        status: status.toLowerCase(),
        overtime_hours: otHours || 0,
      });
    } catch {
      // Local fallback
    }
  };

  const addUser = async (user: Omit<AppUserItem, 'id' | 'lastSeen'>) => {
    const newId = `USR-${Date.now().toString().slice(-4)}`;
    const full: AppUserItem = { ...user, id: newId, lastSeen: 'নতুন যোগকৃত' };
    setUsers((prev) => [...prev, full]);

    addToast({
      type: 'success',
      title: 'টিম মেম্বার যুক্ত হয়েছে',
      message: `${user.name} কে ${user.role} রোলে যুক্ত করা হয়েছে।`,
    });

    try {
      await apiClient.post('portal/users', {
        name: user.name,
        phone: user.phone,
        designation: user.role === 'owner' ? 'মালিক' : user.role === 'manager' ? 'ম্যানেজার' : 'অপারেটর',
        role: 'fac',
      });
    } catch {
      // Local fallback
    }
  };

  const toggleUserStatus = async (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === 'Active' ? 'Disabled' : 'Active' }
          : u
      )
    );

    try {
      await apiClient.post(`portal/users/${userId}/toggle`, {});
    } catch {
      // Handled
    }
  };

  const requestPartnerPayout = async (amount: number, method: string, account: string) => {
    if (amount > partner.balanceCommissionTk) {
      addToast({
        type: 'error',
        title: 'ব্যালেন্স অপ্রতুল',
        message: `উত্তোলনযোগ্য ব্যালেন্স মাত্র ৳${partner.balanceCommissionTk.toLocaleString('en-IN')}`,
      });
      return false;
    }

    setPartner((prev) => ({
      ...prev,
      withdrawnCommissionTk: prev.withdrawnCommissionTk + amount,
      balanceCommissionTk: prev.balanceCommissionTk - amount,
      payoutMethod: method,
      payoutNumber: account,
    }));

    addToast({
      type: 'success',
      title: 'উত্তোলন অনুরোধ গৃহীত',
      message: `৳${amount.toLocaleString('en-IN')} উত্তোলনের অনুরোধ ${method.toUpperCase()} (${account}) নম্বরে পাঠানো হয়েছে।`,
    });

    try {
      await apiClient.post('portal/partner/payout', {
        amount_tk: amount,
        payout_method: method,
        account_number: account,
      });
      return true;
    } catch (err: any) {
      addToast({ type: 'error', title: 'উত্তোলন ত্রুটি', message: err.message || 'অনুরোধ ব্যর্থ হয়েছে।' });
      return false;
    }
  };

  const updateFactoryProfileInfo = async (info: Partial<FactoryProfileInfo>) => {
    setFactoryProfile((prev) => ({ ...prev, ...info }));
    addToast({ type: 'success', title: 'প্রোফাইল আপডেট', message: 'ফ্যাক্টরি তথ্য ও সেটিংস সফলভাবে সংরক্ষিত হয়েছে।' });
    try {
      await apiClient.post('portal/profile', {
        name: info.name,
        area: info.loc,
        address: info.address,
        phone: info.phone,
        total_machines: info.machinesCount,
      });
    } catch {
      // Handled
    }
  };

  return (
    <AppContext.Provider
      value={{
        screen,
        setScreen,
        marketingPage,
        setMarketingPage,
        factoryView,
        setFactoryView,
        vendorView,
        setVendorView,
        supplierView,
        setSupplierView,
        role,
        setRole,
        theme,
        toggleTheme,
        selectedOrderId,
        setSelectedOrderId,
        selectedThreadId,
        setSelectedThreadId,
        selectedVendorFactoryId,
        setSelectedVendorFactoryId,
        factoryProfile,
        vendorFactories,
        orders,
        yarns,
        machines,
        operators,
        setOperators,
        prodLogs,
        rolls,
        qcLogs,
        challans,
        bills,
        parties,
        storeItems,
        storeIssues,
        vouchers,
        attendance,
        users,
        threads,
        freeOffers,
        jobs,
        services,
        suppliers,
        rfqs,
        catalog,
        ads,
        marketplacePosts,
        dashboardData,
        isDashboardSyncing,
        fetchDashboardData,
        quickProductionEntry,
        broadcastFreeMachines,
        submitQuotation,
        partner,
        toasts,
        currentUser,
        setCurrentUser,
        loginUser,
        registerUser,
        resetPasswordUser,
        logout,
        addToast,
        dismissToast,
        callModal,
        openCallModal,
        closeCallModal,
        printModal,
        openPrintModal,
        closePrintModal,
        addProductionEntry,
        updateRollStatus,
        createChallan,
        receiveYarnInward,
        createOrder,
        deleteOrder,
        clearAllOrders,
        sendChatMessage,
        applyForJob,
        postRfq,
        toggleMachineStatus,
        recordBillPayment,
        issueStoreItem,
        expenses,
        addExpense,
        punchAttendance,
        addUser,
        toggleUserStatus,
        requestPartnerPayout,
        updateFactoryProfileInfo,
        fetchOrders,
        fetchRolls,
        saveJobCardGrid,
        saveShiftProduction,
        fetchParties,
        fetchOperators,
        createParty,
        togglePartyStatus,
        deleteParty,
        qcInspections,
        fetchQcInspections,
        storeQcInspection,
        signQcInspection,
        updateQcAction,
        deliveryChallans,
        fetchChallans,
        createDeliveryChallan,
        signChallan,
        storeInventory,
        storeLogs,
        fetchStoreData,
        recordStoreMovement,
        addStoreItem,
        addYarnInward,
        requestYarnReturn,
        createYarnReturnChallan,
        factoryBills,
        fetchBills,
        createKkBill,
        recordKkBillPayment,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
};
