export type AppScreenMode = 'site' | 'auth' | 'factory' | 'vendor' | 'supplier';

export type MarketingSubPage = 'home' | 'jobs' | 'services' | 'suppliers' | 'adbuilder';

export type UserRoleKey =
  | 'owner'
  | 'manager'
  | 'prod'
  | 'qc'
  | 'store'
  | 'acc'
  | 'vendor'
  | 'supplier';

export interface RoleDefinition {
  key: UserRoleKey;
  bn: string;
  en: string;
  desc: string;
  color: string;
  views: string[] | 'all';
}

export interface OrderLineItem {
  id: number;
  fabric: string;
  dia: string;
  gsm: number;
  yarn: string;
  brand: string;
  lot: string;
  stitch: string;
  orderKg: number;
  rate: number;
  processLoss: number;
  yarnRcv: number;
  knitKg: number;
  qcPass: number;
  rejectKg: number;
  delivKg: number;
  machine: string;
  rolls: number;
}

export interface SubcontractOrderItem {
  id: string;
  po: string;
  party: string;
  party_id?: number | string;
  party_code?: string;
  partyPhone: string;
  buyer: string;
  style: string;
  season: string;
  color: string;
  orderDate: string;
  delivDate: string;
  status: 'Running' | 'Completed' | 'Pending' | 'Draft' | 'Hold' | 'run' | 'done' | 'wait' | string;
  payStatus: 'Paid' | 'Part' | 'Due';
  paidAmt: number;
  advanceAmt: number;
  discountAmt: number;
  deductAmt: number;
  notes: string;
  factoryId?: string;
  factoryName?: string;
  lines: OrderLineItem[];

  // Dynamic API & Prototype fields
  v?: string;
  fabric?: string;
  gsm?: string | number;
  finishGsm?: string | number;
  stitch?: string;
  greyDia?: string;
  dia?: string;
  yarn?: string;
  qty?: number;
  done?: number;
  machines?: string[];
  rate?: number;
  rateTk?: number;
  start?: string;
  deliveryDue?: string;
  completeDate?: string;
  delivered?: number;
  challans?: string[];
  yarnIn?: any[];
  qc?: any[];
}

export interface YarnStockItem {
  id: string;
  orderId: string;
  lineIdx: number;
  date: string;
  party: string;
  count: string;
  brand: string;
  lot: string;
  bags: number;
  rcvKg: number;
  usedKg: number;
  retKg: number;
  wastageKg: number;
  Factory?: string;
}

export interface MachineItem {
  id: string;
  brand: string;
  type: 'Single Jersey' | 'Rib / Interlock' | 'Fleece / Terry';
  dia: string;
  gg: string;
  feeders: number;
  rpm: number;
  status: 'Running' | 'Idle' | 'Maint' | 'Free';
  orderId: string;
  fabric: string;
  operator: string;
  todayKg: number;
  targetKg: number;
  availFrom: string;
  rateQuote: number;
  note: string;
}

export interface OperatorItem {
  id: number;
  factory_id?: number | null;
  employee_type?: string;
  id_no?: string;
  name: string;
  mobile?: string;
  address?: string;
  designation?: string;
  shift?: string;
  machine_assigned?: string;
  daily_wage?: number;
  status?: string;
}

export type EmployeeItem = OperatorItem;

export interface ProductionLogItem {
  id: string | number;
  user_id?: number | null;
  employee_id?: number | null;
  date: string;
  shift: 'A (সকাল)' | 'B (বিকাল)' | 'C (রাত)' | string;
  machine: string;
  operator: string;
  orderId: string;
  lineIdx: number;
  rolls: number;
  kg: number;
  rejectKg: number;
  rpm: number;
  eff: number;
  note: string;
}

export type ProductionItem = ProductionLogItem;

export interface RollTagItem {
  rollId: string;
  orderId: string;
  lineIdx: number;
  machine: string;
  operator: string;
  shift: string;
  date: string;
  fabric: string;
  dia: string;
  gsm: number;
  lot: string;
  kg: number;
  status: 'Knitted' | 'QC Pass' | 'Hold' | 'Delivered';
}

export interface QcDefectItem {
  name: string;
  pts: number;
}

export interface QcLogItem {
  id: string;
  date: string;
  rollId: string;
  orderId: string;
  fabric: string;
  dia: string;
  reqGsm: number;
  actGsm: number;
  reqDia: number;
  actDia: number;
  weightKg: number;
  lengthYds: number;
  defects: QcDefectItem[];
  totalPts: number;
  ptsPer100: number;
  grade: 'A (Pass)' | 'B (Minor)' | 'Reject (Hold)';
  status: 'Pass' | 'Minor' | 'Reject';
  inspector: string;
}

export interface ChallanItem {
  no: string;
  date: string;
  orderId: string;
  party: string;
  lineIdx: number;
  fabric: string;
  dia: string;
  rolls: number;
  grossKg: number;
  netKg: number;
  vehicle: string;
  driver: string;
  driverPhone: string;
  gatePass: string;
  status: 'Delivered' | 'In Transit';
  factoryId?: string;
}

export interface BillItem {
  no: string;
  date: string;
  dueDate: string;
  orderId: string;
  party: string;
  grossAmt: number;
  discount: number;
  deduct: number;
  advance: number;
  paidAmt: number;
  status: 'Paid' | 'Part' | 'Due';
  factoryId?: string;
}

export interface PartyItem {
  id: string | number;
  code?: string;
  name: string;
  type: 'ven' | 'sup' | 'Buying House' | 'Composite' | 'Direct Export' | 'Local Trader' | string;
  contact?: string;
  contact_person?: string;
  phone?: string;
  address?: string;
  addr?: string;
  email?: string;
  bin?: string;
  bin_tin?: string;
  rate?: number;
  default_rate_tk?: number;
  terms?: string;
  payment_terms?: string;
  open?: number;
  opening_balance?: number;
  added?: string;
  added_date?: string;
  on?: boolean;
  is_active?: boolean;
  orders_count?: number;
  due?: number;
  // Legacy optional properties
  rate1J?: number;
  rateRib?: number;
  rateFleece?: number;
  creditLimit?: number;
  openingDue?: number;
  totalKnittedKg?: number;
  totalBilled?: number;
  totalPaid?: number;
  balanceDue?: number;
}

export interface StoreStockItem {
  id: string;
  cat: 'Needle' | 'Sinker' | 'Oil' | 'Spare';
  name: string;
  spec: string;
  unit: string;
  stock: number;
  minStock: number;
  unitPrice: number;
  lastIssued: string;
  machine: string;
}

export interface StoreIssueItem {
  id: string;
  date: string;
  itemId: string;
  itemName: string;
  qty: number;
  unit: string;
  machine: string;
  operator: string;
  reason: string;
  cost: number;
}

export interface LedgerVoucherItem {
  id: string;
  date: string;
  party: string;
  type: 'Receipt' | 'Bill' | 'Expense' | 'Deduction';
  method: string;
  ref: string;
  narration: string;
  debit: number;
  credit: number;
}

export interface ExpenseItem {
  id: string | number;
  category: string;
  title: string;
  amount: number;
  method: 'cash' | 'bank' | 'bkash' | string;
  ref?: string;
  date: string;
  createdBy: string;
  notes?: string;
}

export interface AttendanceItem {
  id: string;
  name: string;
  role: string;
  shift: string;
  machine: string;
  presentDays: number;
  otHours: number;
  prodBonusKg: number;
  dailyWage: number;
  todayStatus: 'Present' | 'Late' | 'Leave' | 'Absent';
}

export interface AppUserItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRoleKey | string;
  shift: string;
  status: 'Active' | 'Pending' | 'Disabled';
  lastSeen: string;
  designation?: string;
  organization_name?: string;
  is_active?: boolean;
  can_message?: boolean;
  is_vendor_rep?: boolean;
  last_login_label?: string;
}

export interface ChatMessageItem {
  from: 'factory' | 'vendor';
  sender: string;
  time: string;
  text: string;
  tag?: string;
}

export interface MessageThreadItem {
  id: string;
  party: string;
  contact: string;
  phone: string;
  orderId: string;
  unread: number;
  online: boolean;
  messages: ChatMessageItem[];
  factoryId?: string;
}

export interface FreeMachineOfferItem {
  id: string;
  party: string;
  contact: string;
  phone: string;
  machineId: string;
  type: string;
  diaGg: string;
  reqKg: number;
  offerRate: number;
  startDate: string;
  yarnSpec: string;
  status: 'New' | 'Accepted' | 'Negotiating' | 'Declined';
  time: string;
}

export interface JobPostItem {
  id: string;
  title: string;
  factory: string;
  loc: 'নারায়ণগঞ্জ' | 'গাজীপুর' | 'সাভার-আশুলিয়া' | 'চট্টগ্রাম' | string;
  role: 'অপারেটর' | 'টেকনিশিয়ান' | 'QC / সুপারভাইজার' | 'হিসাব / স্টোর' | string;
  shift: string;
  exp: string;
  machines: string;
  salary: string;
  vacancies: number;
  urgent: boolean;
  food: string;
  posted: string;
  phone: string;
  desc: string;
}

export interface ServiceDetailItem {
  id: string;
  icon: string;
  tag: string;
  title: string;
  sub: string;
  price: string;
  turnaround: string;
  lead: string;
  phone: string;
  bullets: string[];
  deliverables: string[];
}

export interface SupplierItem {
  id: string;
  name: string;
  cat: 'Yarn' | 'Needle' | 'Oil' | 'Dyeing' | 'Accessories';
  catBn: string;
  loc: string;
  verified: boolean;
  rating: string;
  deals: number;
  leadTime: string;
  minOrder: string;
  phone: string;
  contact: string;
  brands: string;
  featured: string;
  products: {
    name: string;
    spec: string;
    price: string;
    stock: string;
  }[];
}

export interface SupplierRfqItem {
  id: string;
  fromFactory: string;
  loc: string;
  phone: string;
  item: string;
  qty: string;
  targetRate: string;
  needBy: string;
  status: 'New' | 'Quoted' | 'Won';
  time: string;
  quotedRate?: string;
}

export interface SupplierCatalogItem {
  id: string;
  name: string;
  cat: string;
  brand: string;
  price: number;
  unit: string;
  moq: string;
  stock: 'In Stock' | 'Limited' | 'Pre-Order';
  hits: number;
}

export interface SupplierAdItem {
  id: string;
  slot: string;
  title: string;
  budget: number;
  impressions: number;
  clicks: number;
  rfqs: number;
  status: 'Active' | 'Scheduled' | 'Paused';
}

export interface MarketplaceSubcontractPost {
  id: string;
  postCode: string;
  title: string;
  partyName: string;
  fabricType: string;
  dia: string;
  gg: string;
  gsm: number;
  yarnSpec: string;
  targetKg: number;
  targetRate: number;
  deliveryDeadline: string;
  location: string;
  status: 'Open' | 'Matched' | 'Awarded';
  matchScore: number;
  quotationsCount: number;
}

export interface PartnerState {
  enabled: boolean;
  categories: {
    yarn: boolean;
    needle: boolean;
    oil: boolean;
    machine: boolean;
    dyeing: boolean;
  };
  balance: number;
  balanceCommissionTk: number;
  totalEarned: number;
  withdrawnCommissionTk: number;
  impressions: number;
  clicks: number;
  rfqLeads: number;
  bkashNo: string;
  partnerCode?: string;
  totalReferrals?: number;
  activeFactoriesCount?: number;
  totalCommissionTk?: number;
  payoutMethod?: string;
  payoutNumber?: string;
  payouts: {
    id: string;
    date: string;
    period: string;
    method: string;
    acct: string;
    amt: number;
    status: string;
  }[];
}

export interface FactoryProfileInfo {
  id: string;
  code: string;
  name: string;
  owner: string;
  phone: string;
  email: string;
  address: string;
  loc: string;
  bin: string;
  plan: string;
  machinesCount: number;
  verified: boolean;
  rating: number;
  area?: string;
  totalMachines?: number;
}

export interface VendorFactoryDirectoryItem {
  id: string;
  name: string;
  short: string;
  loc: string;
  address: string;
  owner: string;
  phone: string;
  verified: boolean;
  rating: number;
  machinesTotal: number;
  runningM: number;
  freeM: number;
  avgRate1J: number;
  avgRateRib: number;
  avgRateFleece: number;
  onTimePct: number;
  defectPct: number;
  specialties: string[];
  certifications: string[];
}

