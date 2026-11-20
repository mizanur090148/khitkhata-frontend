import React, { useState, useEffect, useId, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { bnNum } from '@/utils/formatters';
import { SubcontractOrderItem, OrderLineItem } from '@/types/domain.types';
import {
  UserPlus,
  Building2,
  Phone,
  User,
  MapPin,
  Calendar,
  X,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

// Exact constants from KnitKhata.html
const PLACES = [
  'Body',
  'Sleeve',
  'Neck Rib',
  'Collar',
  'Cuff',
  'Bottom Rib / Waistband',
  'Placket',
  'BNT (Back Neck Tape)',
  'Piping / Binding',
  'Tipping',
  'Hood',
  'Hood Lining',
  'Pocket',
  'Pocket Lining',
  'Yoke',
  'Side Panel',
  'Contrast Panel',
  'Gusset',
  'Lining',
  'Others',
];

const PQUICK = [
  'Body',
  'Sleeve',
  'Neck Rib',
  'Collar',
  'Cuff',
  'Bottom Rib / Waistband',
  'BNT (Back Neck Tape)',
  'Piping / Binding',
  'Tipping',
  'Hood',
];

const FABS = [
  'Flat Knit Collar',
  'Flat Knit Cuff',
  'Tipping Collar',
  'Flat Knit Placket',
  'Single Jersey',
  'Single Jersey Lycra',
  '1×1 Rib',
  '1×1 Rib Lycra',
  '1×1 Rib Lycra (Half Feeder)',
  '1×1 Rib (Double Ply)',
  'Irregular Rib',
  '2×1 Rib',
  '2×2 Rib',
  'Fleece (2-Thread)',
  'Fleece (3-Thread)',
  'Pique',
  'Pique Lycra',
  'Lacoste',
  'Lacoste Lycra',
  'Interlock',
  'Terry',
  'French Terry',
  'Waffle',
];

const YROLES = [
  'বডি সুতা',
  'লাইক্রা (Spandex)',
  'Face',
  'Binder / Tie',
  'Loop (Back)',
  'Ply ১',
  'Ply ২',
];

const COLORS = [
  'Grey (RFD)',
  'White',
  'Black',
  'Navy Blue',
  'Heather Grey',
  'Red',
  'Royal Blue',
  'Olive',
];

function fabHint(p: string): string {
  p = (p || '').toLowerCase();
  if (/rib|collar|cuff|waist|placket/.test(p)) return '1×1 Rib Lycra';
  if (/bnt|tape|piping|binding|tipping/.test(p)) return 'Single Jersey';
  if (/hood/.test(p)) return 'Fleece (3-Thread)';
  return 'Single Jersey';
}

function isLy(c: string): boolean {
  return /spandex|lycra|elastane|\b\d+\s*d\b/i.test(String(c || ''));
}

const ROLE_PCT: Record<string, number> = {
  Face: 45,
  'Binder / Tie': 10,
  'Loop (Back)': 45,
  'Ply ১': 50,
  'Ply ২': 50,
  'লাইক্রা (Spandex)': 5,
};

interface YarnItemState {
  role: string;
  count: string;
  brand: string;
  lot: string;
  col: string;
  pct: string;
}

interface OrderLineState {
  uid: number;
  kt: 'c' | 'f';
  yd: boolean;
  fsize: string;
  pcw: string;
  fdes: string;
  place: string;
  fab: string;
  color: string;
  qty: string;
  yarns: YarnItemState[];
  ggsm: string;
  fgsm: string;
  sl: string;
  gdia: string;
  mdia: string;
  mg: string;
  machines: string[];
}

function yPct(y: YarnItemState, ys: YarnItemState[]): number {
  if (y.pct !== '' && y.pct != null && !isNaN(Number(y.pct))) return Number(y.pct);
  if (ROLE_PCT[y.role] != null && ys.length > 1 && !(y.role === 'Face' && ys.length === 2)) {
    return ROLE_PCT[y.role];
  }
  if (isLy(y.count) || y.role === 'লাইক্রা (Spandex)') return 5;
  const typed = ys
    .filter((x) => x !== y && x.pct !== '' && x.pct != null && !isNaN(Number(x.pct)))
    .reduce((a, x) => a + Number(x.pct), 0);
  const ly =
    ys.filter(
      (x) =>
        x !== y &&
        (x.pct === '' || x.pct == null) &&
        (isLy(x.count) || x.role === 'লাইক্রা (Spandex)')
    ).length * 5;
  const rest =
    ys.filter(
      (x) =>
        (x.pct === '' || x.pct == null) &&
        !(isLy(x.count) || x.role === 'লাইক্রা (Spandex)')
    ).length || 1;
  return Math.max(0, Math.round(((100 - typed - ly) / rest) * 10) / 10);
}

function yarnTemplate(fab: string): string[] {
  const f = (fab || '').toLowerCase();
  if (f.includes('3-thread')) return ['Face', 'Binder / Tie', 'Loop (Back)'];
  if (f.includes('2-thread') || f.includes('terry')) return ['Face', 'Loop (Back)'];
  if (f.includes('double ply')) return ['Ply ১', 'Ply ২'];
  if (f.includes('lycra') || f.includes('spandex')) return ['বডি সুতা', 'লাইক্রা (Spandex)'];
  return ['বডি সুতা'];
}

const newYarn = (role = ''): YarnItemState => ({
  role,
  count: '',
  brand: '',
  lot: '',
  col: '',
  pct: '',
});

let noSeqCounter = 100;

const createBlankLine = (uid: number, place = 'Body'): OrderLineState => ({
  uid,
  kt: 'c',
  yd: false,
  fsize: '',
  pcw: '',
  fdes: '',
  place,
  fab: '',
  color: '',
  qty: '',
  yarns: [newYarn('বডি সুতা')],
  ggsm: '',
  fgsm: '',
  sl: '',
  gdia: '',
  mdia: '',
  mg: '',
  machines: [],
});

export const FactoryNewOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders, parties, machines, createOrder, createParty, addToast, setSelectedOrderId, fetchParties } = useApp();

  // Basic Form States - initially empty for fresh new entry
  const [pubDate, setPubDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [yrecDate, setYrecDate] = useState<string>('');
  const [delDate, setDelDate] = useState<string>('');
  const [vendorId, setVendorId] = useState<number | string | null>(null);
  const [vendorName, setVendorName] = useState<string>('');
  const [orderNo, setOrderNo] = useState<string>('');
  const [buyerName, setBuyerName] = useState<string>('');
  const [totalQty, setTotalQty] = useState<string>('');

  // Vendor searchable dropdown state
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);
  const vendorDropdownRef = useRef<HTMLDivElement>(null);

  // Modal state for creating new party / buyer directly from new order page
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [modalPartyName, setModalPartyName] = useState('');
  const [modalPartyContact, setModalPartyContact] = useState('');
  const [modalPartyPhone, setModalPartyPhone] = useState('');
  const [modalPartyAddress, setModalPartyAddress] = useState('');
  const [modalPartyRate, setModalPartyRate] = useState('');
  const [modalPartyOpening, setModalPartyOpening] = useState('0');
  const [modalPartyTerms, setModalPartyTerms] = useState('বিলের ৩০ দিনের মধ্যে');
  const [modalPartyEmail, setModalPartyEmail] = useState('');
  const [modalPartyBin, setModalPartyBin] = useState('');
  const [modalPartyError, setModalPartyError] = useState<string | null>(null);
  const [modalPartySubmitting, setModalPartySubmitting] = useState(false);

  const handleOpenAddPartyModal = () => {
    // If the user already typed a non-empty name into the vendor input, prefill it
    if (vendorName.trim() && !vendorId) {
      setModalPartyName(vendorName.trim());
    } else {
      setModalPartyName('');
    }
    setModalPartyError(null);
    setVendorDropdownOpen(false);
    setShowAddPartyModal(true);
  };

  const handleCreatePartySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalPartyError(null);

    const trimmedName = modalPartyName.trim();
    if (!trimmedName) {
      setModalPartyError('পার্টি বা বায়ারের নাম আবশ্যক।');
      return;
    }

    const isDuplicate = parties.some(
      (p) => (p.name || '').trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      setModalPartyError(`"${trimmedName}" নামে আগেই একটা পার্টি তালিকায় বিদ্যমান।`);
      return;
    }

    setModalPartySubmitting(true);
    try {
      const createdParty = await createParty({
        name: trimmedName,
        type: 'ven', // Buyer / Vendor party
        contact: modalPartyContact.trim() || '—',
        phone: modalPartyPhone.trim() || '—',
        addr: modalPartyAddress.trim() || '—',
        rate: modalPartyRate ? parseFloat(modalPartyRate) : 0,
        open: modalPartyOpening ? parseFloat(modalPartyOpening) : 0,
        terms: modalPartyTerms.trim() || 'বিলের ৩০ দিনের মধ্যে',
        email: modalPartyEmail.trim(),
        bin: modalPartyBin.trim(),
      });

      // Immediately select the newly created party in the vendor dropdown without page reload
      setVendorName(createdParty.name);
      setVendorId(createdParty.id ?? null);
      setVendorDropdownOpen(false);

      // Close modal and reset fields
      setShowAddPartyModal(false);
      setModalPartyName('');
      setModalPartyContact('');
      setModalPartyPhone('');
      setModalPartyAddress('');
      setModalPartyRate('');
      setModalPartyOpening('0');
      setModalPartyTerms('বিলের ৩০ দিনের মধ্যে');
      setModalPartyEmail('');
      setModalPartyBin('');
      setModalPartyError(null);

      addToast({
        type: 'success',
        title: 'বায়ার / পার্টি যোগ হয়েছে',
        message: `"${createdParty.name}" তৈরি হয়েছে এবং সফলভাবে ভেন্ডর হিসেবে সিলেক্ট করা হয়েছে।`,
      });
    } catch (err: any) {
      setModalPartyError(err.message || 'পার্টি তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setModalPartySubmitting(false);
    }
  };

  // Filter parties from database where type is 'ven' (or buyer)
  const vendorParties = useMemo(() => {
    return parties.filter((p) => {
      const t = (p.type || (p as any).party_type || '').toLowerCase();
      return t === 'ven' || t === 'buyer' || (t !== 'sup' && t !== 'supplier');
    });
  }, [parties]);

  // Search filtered vendors
  const filteredVendors = useMemo(() => {
    const q = (vendorName || '').trim().toLowerCase();
    if (!q) return vendorParties;
    return vendorParties.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.code || '').toLowerCase().includes(q) ||
        (p.phone || '').toLowerCase().includes(q) ||
        (p.addr || p.address || '').toLowerCase().includes(q)
    );
  }, [vendorParties, vendorName]);

  // Click outside listener to close vendor dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target as Node)) {
        setVendorDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Refresh parties from MySQL on mount
  useEffect(() => {
    fetchParties?.();
  }, []);

  // Lines State - starts with one clean empty line
  const [noLines, setNoLines] = useState<OrderLineState[]>([createBlankLine(1, 'Body')]);
  const [noActive, setNoActive] = useState<number>(1);
  const [formMsg, setFormMsg] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Reset form completely whenever visiting the new order page
  const resetForm = () => {
    setPubDate(new Date().toISOString().split('T')[0]);
    setYrecDate('');
    setDelDate('');
    setVendorId(null);
    setVendorName('');
    setOrderNo('');
    setBuyerName('');
    setTotalQty('');
    setNoLines([createBlankLine(1, 'Body')]);
    setNoActive(1);
    setFormMsg('');
  };

  useEffect(() => {
    resetForm();
  }, [location.key]);

  // Line Name helper
  const lname = (l: OrderLineState, i: number) =>
    [l.place, l.fab].filter(Boolean).join(' · ') || `লাইন ${i + 1}`;
  const unitOf = (l: OrderLineState) => (l && (l.kt === 'f' || (l as any).unit === 'pcs') ? 'পিস' : 'kg');

  // Totals Calculation matching noTotals() in KnitKhata.html
  const totalNum = parseFloat(totalQty) || 0;
  const sumNum = noLines.filter((l) => l.kt !== 'f').reduce((a, l) => a + (parseFloat(l.qty) || 0), 0);
  const restNum = totalNum - sumNum;

  // Allocation status class
  let allocSt = '';
  let allocCls = '';
  if (!totalNum) {
    allocSt = 'মোট অর্ডার কোয়ান্টিটি লিখুন, তারপর ফেব্রিক অনুযায়ী ভাগ করুন।';
    allocCls = 'idle';
  } else if (restNum < 0) {
    allocSt = `মোট অর্ডারের চেয়ে ${bnNum(-restNum)} kg বেশি দেওয়া হয়েছে। কোনো লাইনের কোয়ান্টিটি কমান।`;
    allocCls = 'over';
  } else if (restNum > 0) {
    allocSt = `আরও ${bnNum(restNum)} kg ভাগ করা বাকি।`;
    allocCls = 'left';
  } else {
    allocSt = 'পুরো অর্ডার ভাগ করা হয়েছে।';
    allocCls = 'ok';
  }

  // Active line object
  const activeLineObj = noLines.find((l) => l.uid === noActive) || noLines[0];

  // Allocation bar segments
  const allocSegs = noLines.map((l, i) => {
    const q = l.kt === 'f' ? 0 : parseFloat(l.qty) || 0;
    const w = totalNum ? Math.min(100, (q / Math.max(totalNum, sumNum)) * 100) : 0;
    return {
      w,
      color: `var(--l${(i % 5) + 1})`,
      title: `${lname(l, i)}: ${bnNum(q)} kg`,
    };
  });

  // Machine ownership map
  const mcOwner: Record<string, number> = {};
  noLines.forEach((l, i) => {
    l.machines.forEach((m) => {
      mcOwner[m] = i;
    });
  });

  // Unique Buyers list for datalist
  const buyerList = Array.from(new Set(orders.map((o) => o.buyer).filter(Boolean)));

  // Ysum text helper
  const ysumText = (l: OrderLineState) => {
    const t = Math.round(l.yarns.reduce((a, y) => a + yPct(y, l.yarns), 0) * 10) / 10;
    return t === 100 ? (
      <>
        সুতার মোট ভাগ: ১০০% ✓{' '}
        <span className="muted">(লাইক্রা সাধারণত ৫%, খালি রাখলে এটাই ধরা হয়)</span>
      </>
    ) : (
      <span style={{ color: 'var(--bad)' }}>সুতার মোট ভাগ {t}% · ১০০% হওয়া দরকার</span>
    );
  };

  // Add Line Handler matching addln
  const handleAddLine = () => {
    noSeqCounter += 1;
    const nextUid = noSeqCounter;
    const newL: OrderLineState = {
      uid: nextUid,
      kt: 'c',
      yd: false,
      fsize: '',
      pcw: '',
      fdes: '',
      place: '',
      fab: '',
      color: '',
      qty: restNum > 0 ? String(restNum) : '',
      yarns: [newYarn('বডি সুতা')],
      ggsm: '',
      fgsm: '',
      sl: '',
      gdia: '',
      mdia: '',
      mg: '',
      machines: [],
    };
    setNoLines([...noLines, newL]);
    setNoActive(nextUid);
  };

  // Delete line
  const handleDeleteLine = (uid: number) => {
    if (noLines.length <= 1) return;
    const next = noLines.filter((l) => l.uid !== uid);
    setNoLines(next);
    if (noActive === uid) setNoActive(next[0].uid);
  };

  // Toggle machine for active line
  const handleToggleMachine = (mId: string) => {
    if (!activeLineObj) return;
    setNoLines((prev) =>
      prev.map((l) => {
        if (l.uid === activeLineObj.uid) {
          const has = l.machines.includes(mId);
          return {
            ...l,
            machines: has ? l.machines.filter((x) => x !== mId) : [...l.machines, mId],
          };
        } else {
          // Remove from other line if assigned
          return {
            ...l,
            machines: l.machines.filter((x) => x !== mId),
          };
        }
      })
    );
  };

  // Submit Handler exact validation logic from KnitKhata.html
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg('');

    // Validation
    const anyC = noLines.some((l) => l.kt !== 'f');
    const need: string[] = [];

    if (!vendorName.trim()) need.push('Vendor Name');
    if (!orderNo.trim()) need.push('Order No');
    if (!buyerName.trim()) need.push('Buyer Name');
    if (anyC && !(parseFloat(totalQty) > 0)) need.push('Total Order Qty');

    noLines.forEach((l, i) => {
      if (!l.place.trim()) need.push(`লাইন ${i + 1}-এর Placement`);
      if (!l.fab.trim()) need.push(`লাইন ${i + 1}-এর Fabrication`);
      if (!(parseFloat(l.qty) > 0)) need.push(`লাইন ${i + 1}-এর Qty`);
      if (l.kt !== 'f' && !l.mdia.trim()) need.push(`লাইন ${i + 1}-এর Machine Dia`);
      if (!l.mg.trim()) need.push(`লাইন ${i + 1}-এর Machine Gauge`);
    });

    if (need.length > 0) {
      setFormMsg(`${need.join(', ')} লিখুন।`);
      return;
    }

    if (anyC && !(totalNum > 0)) {
      setFormMsg('Total Order Qty তে সঠিক সংখ্যা লিখুন (kg)।');
      return;
    }

    if (restNum < 0) {
      setFormMsg(
        `মোট অর্ডার ${bnNum(totalNum)} kg, কিন্তু ফেব্রিকগুলোতে ${bnNum(sumNum)} kg দেওয়া হয়েছে — ${bnNum(-restNum)} kg বেশি। ঠিক করে আবার সেভ করুন।`
      );
      return;
    }

    setSubmitting(true);
    try {
      const primaryLine = noLines[0];
      const mappedLines: OrderLineItem[] = noLines.map((l, idx) => ({
        id: idx + 1,
        fabric: l.fab,
        dia: l.kt === 'f' ? l.fsize || 'Flat' : `${l.mdia}" × ${l.mg}G`,
        gsm: parseInt(l.fgsm || l.ggsm) || 160,
        yarn: l.yarns.map((y) => y.count).filter(Boolean).join(' + ') || '30/1 Combed',
        brand: l.yarns[0]?.brand || 'Square Textiles',
        lot: l.yarns[0]?.lot || 'SQ-88410',
        stitch: l.sl || '2.65 mm',
        orderKg: parseFloat(l.qty) || 0,
        rate: 24.0,
        processLoss: 2.0,
        yarnRcv: 0,
        knitKg: 0,
        qcPass: 0,
        rejectKg: 0,
        delivKg: 0,
        machine: l.machines.join(', ') || 'M-01',
        rolls: 0,
      }));

      const newOrderPayload: Omit<SubcontractOrderItem, 'id'> & { id?: string } = {
        id: orderNo.trim() || undefined,
        po: orderNo.trim() || `SC-2610-02${orders.length + 1}`,
        party: vendorName.trim(),
        party_id: vendorId || undefined,
        partyPhone: '01711-000111',
        buyer: buyerName.trim(),
        style: primaryLine.fab || 'Single Jersey',
        season: 'Autumn 2026',
        color: primaryLine.color || 'Navy Blue',
        orderDate: pubDate || new Date().toISOString().split('T')[0],
        delivDate: delDate || '2026-11-15',
        status: 'Running',
        payStatus: 'Due',
        paidAmt: 0,
        advanceAmt: 0,
        discountAmt: 0,
        deductAmt: 0,
        notes: `Published: ${pubDate}, Yarn Rec: ${yrecDate}`,
        lines: mappedLines,
      };

      const createdId = await createOrder(newOrderPayload);

      addToast({
        type: 'success',
        title: 'অর্ডার সেভ হয়েছে!',
        message: `${createdId} সেভ হয়েছে · ড্যাশবোর্ডে যোগ হলো`,
      });

      resetForm();
      setSelectedOrderId(createdId);
      navigate(`/dashboard/orders/${createdId}`);
      window.scrollTo(0, 0);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'ডাটাবেজে সেভ হয়নি!',
        message: err?.message || 'অর্ডার সেভ করতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* 1. Header exact from KnitKhata.html */}
      <div className="head">
        <div>
          <button
            type="button"
            className="btn sm"
            onClick={() => {
              navigate('/dashboard/orders');
              window.scrollTo(0, 0);
            }}
          >
            ← অর্ডার
          </button>
          <h2 style={{ marginTop: 8 }}>New Order Entry</h2>
          <p>
            একটা অর্ডারে বডি, রিব, কলার, টিপিং-এর মতো একাধিক অংশ থাকলে প্রতিটা আলাদা লাইনে লিখুন।
            আগে Placement, তারপর ফেব্রিক আর সুতা। লাল তারকা দেওয়া ঘরগুলো লাগবেই।
          </p>
        </div>
      </div>

      {/* Datalists from KnitKhata.html */}
      <datalist id="dl-place">
        {PLACES.map((x) => (
          <option key={x} value={x} />
        ))}
      </datalist>
      <datalist id="dl-fab">
        {FABS.map((x) => (
          <option key={x} value={x} />
        ))}
      </datalist>
      <datalist id="dl-yrole">
        {YROLES.map((x) => (
          <option key={x} value={x} />
        ))}
      </datalist>
      <datalist id="dl-col">
        {COLORS.map((x) => (
          <option key={x} value={x} />
        ))}
      </datalist>
      <datalist id="no-vlist">
        {vendorParties.map((p) => (
          <option key={p.id || p.code} value={p.name} />
        ))}
      </datalist>
      <datalist id="no-blist">
        {buyerList.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>

      {/* Main Form full width matching orders page */}
      <form id="nof" className="no-wrap" style={{ maxWidth: '100%', width: '100%' }} onSubmit={handleSubmit} noValidate>
        {/* CARD 1: DATES */}
        <div className="card">
          <h3>
            <span className="stp">১</span>তারিখ
          </h3>
          <div className="no-dates">
            <label className="no-f" htmlFor="no-pub">
              <span>Order Published Date</span>
              <input
                id="no-pub"
                type="date"
                value={pubDate}
                onChange={(e) => setPubDate(e.target.value)}
              />
            </label>
            <label className="no-f" htmlFor="no-yrec">
              <span>Yarn Received Date</span>
              <input
                id="no-yrec"
                type="date"
                value={yrecDate}
                onChange={(e) => setYrecDate(e.target.value)}
              />
            </label>
            <label className="no-f" htmlFor="no-del">
              <span>Fabrics Delivery Date</span>
              <input
                id="no-del"
                type="date"
                value={delDate}
                onChange={(e) => setDelDate(e.target.value)}
              />
            </label>
          </div>
        </div>

        {/* CARD 2: ORDER INFORMATION */}
        <div className="card">
          <h3>
            <span className="stp">২</span>অর্ডারের তথ্য
          </h3>
          <div className="no-grid">
            <div className="no-f" ref={vendorDropdownRef} style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label htmlFor="no-vendor" style={{ margin: 0, fontWeight: 600, cursor: 'pointer' }}>
                  Vendor Name <b className="req">*</b>
                </label>
                <button
                  type="button"
                  className="addp"
                  onClick={handleOpenAddPartyModal}
                  title="নতুন বায়ার / পার্টি তৈরি করুন"
                  style={{
                    fontSize: 12,
                    padding: '3px 10px',
                    borderRadius: 6,
                    background: 'var(--brand-surface, #e0f2fe)',
                    color: 'var(--primary, #0284c7)',
                    border: '1px solid rgba(2, 132, 199, 0.25)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <UserPlus size={13} />
                  + নতুন বায়ার
                </button>
              </div>

              {/* Searchable input box */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="no-vendor"
                  type="text"
                  placeholder="ভেন্ডরের নাম লিখুন বা সিলেক্ট করুন..."
                  autoComplete="off"
                  value={vendorName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setVendorName(val);
                    setVendorDropdownOpen(true);
                    const matched = vendorParties.find((p) => (p.name || '').toLowerCase() === val.trim().toLowerCase());
                    setVendorId(matched ? (matched.id ?? null) : null);
                  }}
                  onFocus={() => setVendorDropdownOpen(true)}
                  style={{
                    width: '100%',
                    paddingRight: vendorName ? 54 : 32,
                  }}
                />

                {/* Clear (x) and toggle chevron buttons */}
                <div style={{ position: 'absolute', right: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {vendorName && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setVendorName('');
                        setVendorId(null);
                        setVendorDropdownOpen(true);
                      }}
                      style={{
                        background: 'transparent',
                        border: 0,
                        cursor: 'pointer',
                        color: 'var(--muted)',
                        fontSize: 16,
                        padding: '0 4px',
                        lineHeight: 1,
                      }}
                      title="মুছে ফেলুন"
                    >
                      ×
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setVendorDropdownOpen((prev) => !prev)}
                    style={{
                      background: 'transparent',
                      border: 0,
                      cursor: 'pointer',
                      color: 'var(--muted)',
                      fontSize: 10,
                      padding: '2px 4px',
                      transform: vendorDropdownOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.15s ease',
                    }}
                    tabIndex={-1}
                    aria-label="টগল ভেন্ডর তালিকা"
                  >
                    ▼
                  </button>
                </div>
              </div>

              {/* Searchable Dropdown Menu with type 'ven' parties */}
              {vendorDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 4,
                    background: 'var(--surface, #ffffff)',
                    border: '1px solid var(--border, #e2e8f0)',
                    borderRadius: 6,
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    zIndex: 150,
                    maxHeight: 280,
                    overflowY: 'auto',
                  }}
                >
                  <div
                    style={{
                      padding: '6px 12px',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--muted)',
                      borderBottom: '1px solid var(--border)',
                      background: 'var(--background, #f8fafc)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>ভেন্ডর তালিকা (parties table · type: ven)</span>
                    <span style={{ fontSize: 10, background: 'var(--brand-surface, #e0f2fe)', color: 'var(--primary, #0284c7)', padding: '1px 6px', borderRadius: 4 }}>
                      {filteredVendors.length}টি ভেন্ডর
                    </span>
                  </div>

                  {filteredVendors.length === 0 ? (
                    <div style={{ padding: '16px 12px', textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
                      <div style={{ marginBottom: 8 }}>"{vendorName}" নামে কোনো ভেন্ডর পাওয়া যায়নি</div>
                      <button
                        type="button"
                        onClick={handleOpenAddPartyModal}
                        className="btn small pri"
                        style={{
                          fontSize: 12,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 14px',
                          borderRadius: 8,
                          fontWeight: 600,
                        }}
                      >
                        <UserPlus size={14} /> + নতুন বায়ার হিসেবে যোগ করুন
                      </button>
                    </div>
                  ) : (
                    filteredVendors.map((p) => {
                      const isSelected = (p.name || '').toLowerCase() === vendorName.trim().toLowerCase();
                      const rate = p.rate || p.default_rate_tk;
                      return (
                        <div
                          key={p.id || p.code}
                          onClick={() => {
                            setVendorName(p.name);
                            setVendorId(p.id ?? null);
                            setVendorDropdownOpen(false);
                          }}
                          style={{
                            padding: '9px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--border)',
                            background: isSelected ? 'rgba(2, 132, 199, 0.08)' : 'transparent',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'var(--hover, #f1f5f9)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: isSelected ? 'var(--primary)' : 'inherit' }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                              {[p.contact || p.contact_person, p.phone, p.addr || p.address].filter(Boolean).filter((x) => x !== '—').join(' · ') || 'ঠিকানা নেই'}
                            </div>
                          </div>
                          {rate ? (
                            <span
                              style={{
                                fontSize: 11,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: 'rgba(16, 185, 129, 0.1)',
                                color: 'var(--ok, #059669)',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              ৳ {rate}/kg
                            </span>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <label className="no-f" htmlFor="no-id">
              <span>
                Order No <b className="req">*</b>
              </span>
              <input
                id="no-id"
                type="text"
                placeholder="যেমন: SC-2610-020"
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
              />
            </label>

            <label className="no-f" htmlFor="no-buyer">
              <span>
                Buyer Name <b className="req">*</b>
              </span>
              <input
                id="no-buyer"
                type="text"
                placeholder="যেমন: বায়ারের নাম"
                list="no-blist"
                autoComplete="off"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
              />
            </label>

            <label className="no-f" htmlFor="no-qty">
              <span>
                Total Order Qty (kg) <b className="req">*</b>
              </span>
              <input
                id="no-qty"
                type="text"
                inputMode="decimal"
                placeholder="যেমন: 5000"
                value={totalQty}
                onChange={(e) => setTotalQty(e.target.value)}
              />
            </label>
          </div>
        </div>

        {/* CARD 3: ALLOCATION BAR (PART BY PART KG SPLIT) */}
        <div className={`card alloc ${allocCls}`} id="alloc">
          <div className="al-top">
            <b>
              <span className="stp">৩</span>অংশ অনুযায়ী ভাগ
            </b>
            <span className="mono">
              {bnNum(sumNum)} / {totalNum ? bnNum(totalNum) : '—'} kg
            </span>
          </div>

          <div className="al-bar">
            {allocSegs.map((seg, idx) => (
              <i
                key={idx}
                style={{ width: `${seg.w}%`, background: seg.color }}
                title={seg.title}
              />
            ))}
          </div>

          <div className="al-legend">
            {noLines.map((l, i) => (
              <span key={l.uid} style={{ ['--c' as any]: `var(--l${(i % 5) + 1})` }}>
                {lname(l, i)}:{' '}
                <b className="mono">
                  {bnNum(parseFloat(l.qty) || 0)} {unitOf(l)}
                </b>
                {l.kt === 'f' && (
                  <small className="muted"> (ফ্ল্যাট, kg-র হিসাবে নেই)</small>
                )}
              </span>
            ))}
          </div>

          <div className="al-st" role="status">
            {allocSt}
          </div>
        </div>

        {/* LINES LIST */}
        <div id="lines" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {noLines.map((l, i) => {
            const lc = `var(--l${(i % 5) + 1})`;
            const tmpl = yarnTemplate(l.fab);

            return (
              <div
                key={l.uid}
                className="ln"
                style={{ ['--lc' as any]: lc }}
                data-line={l.uid}
                onClick={() => setNoActive(l.uid)}
              >
                {/* Line Top Header */}
                <div className="ln-h">
                  <span className="ln-no">{i + 1}</span>
                  <b className="ln-t" id={`lt${l.uid}`}>
                    {[l.place, l.fab, l.color].filter(Boolean).join(' · ') || 'নতুন অংশ'}
                  </b>
                  <span className="ln-q" id={`lq${l.uid}`}>
                    {l.qty ? `${bnNum(parseFloat(l.qty) || 0)} ${unitOf(l)}` : ''}
                  </span>
                  {noLines.length > 1 && (
                    <button
                      type="button"
                      className="ln-x"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLine(l.uid);
                      }}
                      aria-label="এই অংশ বাদ দিন"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Knitting Type & Fabric Type Segments */}
                <div className="ktr">
                  <div className="seg" role="group" aria-label="নিটিংয়ের ধরন">
                    <span>নিটিং</span>
                    <button
                      type="button"
                      className={l.kt !== 'f' ? 'on' : ''}
                      onClick={() => {
                        setNoLines((prev) =>
                          prev.map((item) =>
                            item.uid === l.uid ? { ...item, kt: 'c' } : item
                          )
                        );
                      }}
                    >
                      সার্কুলার
                    </button>
                    <button
                      type="button"
                      className={l.kt === 'f' ? 'on' : ''}
                      onClick={() => {
                        setNoLines((prev) =>
                          prev.map((item) =>
                            item.uid === l.uid
                              ? { ...item, kt: 'f', place: item.place || 'Collar' }
                              : item
                          )
                        );
                      }}
                    >
                      ফ্ল্যাট (কলার-কাফ)
                    </button>
                  </div>

                  <div className="seg" role="group" aria-label="কাপড়ের ধরন">
                    <span>কাপড়</span>
                    <button
                      type="button"
                      className={!l.yd ? 'on' : ''}
                      onClick={() => {
                        setNoLines((prev) =>
                          prev.map((item) =>
                            item.uid === l.uid ? { ...item, yd: false } : item
                          )
                        );
                      }}
                    >
                      গ্রে
                    </button>
                    <button
                      type="button"
                      className={l.yd ? 'on' : ''}
                      onClick={() => {
                        setNoLines((prev) =>
                          prev.map((item) =>
                            item.uid === l.uid ? { ...item, yd: true } : item
                          )
                        );
                      }}
                    >
                      ইয়ার্ন ডাইড (Y/D)
                    </button>
                  </div>
                </div>

                {/* Placement with Quick Chips */}
                <div className="plc">
                  <label className="no-f" htmlFor={`l${l.uid}-place`}>
                    <span>
                      Placement (কোন অংশ) <b className="req">*</b>
                    </span>
                    <input
                      id={`l${l.uid}-place`}
                      type="text"
                      placeholder="যেমন: Body, Neck Rib, Cuff"
                      list="dl-place"
                      autoComplete="off"
                      value={l.place}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNoLines((prev) =>
                          prev.map((item) =>
                            item.uid === l.uid ? { ...item, place: val } : item
                          )
                        );
                      }}
                    />
                  </label>

                  <div className="pq" role="group" aria-label="সাধারণ অংশ">
                    {PQUICK.map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`pqb ${l.place === p ? 'on' : ''}`}
                        onClick={() => {
                          setNoLines((prev) =>
                            prev.map((item) =>
                              item.uid === l.uid ? { ...item, place: p } : item
                            )
                          );
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fabrication, Color, Qty Grid */}
                <div className="no-grid g3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px 16px' }}>
                  <label className="no-f" htmlFor={`l${l.uid}-fab`}>
                    <span>
                      Fabrication <b className="req">*</b>
                    </span>
                    <input
                      id={`l${l.uid}-fab`}
                      type="text"
                      list="dl-fab"
                      autoComplete="off"
                      placeholder={`যেমন: ${l.kt === 'f'
                          ? /cuff|কাফ/i.test(l.place)
                            ? 'Flat Knit Cuff'
                            : 'Flat Knit Collar'
                          : fabHint(l.place)
                        }`}
                      value={l.fab}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNoLines((prev) =>
                          prev.map((item) => {
                            if (item.uid !== l.uid) return item;
                            const empty = item.yarns.every((y) => !y.count && !y.brand && !y.lot);
                            const t = yarnTemplate(val);
                            return {
                              ...item,
                              fab: val,
                              yarns: empty ? t.map((r) => newYarn(r)) : item.yarns,
                            };
                          })
                        );
                      }}
                    />
                  </label>

                  <label className="no-f" htmlFor={`l${l.uid}-color`}>
                    <span>{l.yd ? 'Color / Stripe' : 'Color'}</span>
                    <input
                      id={`l${l.uid}-color`}
                      type="text"
                      list="dl-col"
                      autoComplete="off"
                      placeholder={l.yd ? 'যেমন: Navy + White স্ট্রাইপ' : 'যেমন: Navy Blue'}
                      value={l.color}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNoLines((prev) =>
                          prev.map((item) =>
                            item.uid === l.uid ? { ...item, color: val } : item
                          )
                        );
                      }}
                    />
                  </label>

                  <label className="no-f" htmlFor={`l${l.uid}-qty`}>
                    <span>
                      {l.kt === 'f' ? 'Qty (পিস)' : 'Qty (kg)'} <b className="req">*</b>
                    </span>
                    <input
                      id={`l${l.uid}-qty`}
                      type="text"
                      inputMode="decimal"
                      placeholder={l.kt === 'f' ? 'যেমন: 12000' : 'যেমন: 2000'}
                      value={l.qty}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNoLines((prev) =>
                          prev.map((item) =>
                            item.uid === l.uid ? { ...item, qty: val } : item
                          )
                        );
                      }}
                    />
                  </label>
                </div>

                {/* Yarns Section */}
                <div className="ln-sub">
                  সুতা <span className="ycnt">{l.yarns.length}টি</span>
                </div>

                {l.fab && l.yarns.length < tmpl.length && (
                  <div className="yhint" style={{ fontSize: '0.84rem', color: 'var(--muted)', background: 'var(--surface2)', padding: '6px 10px', borderRadius: 6, margin: '4px 0' }}>
                    {l.fab}-এ সাধারণত {tmpl.length}টা সুতা লাগে।{' '}
                    <button
                      type="button"
                      className="linkb"
                      style={{ background: 'none', border: 0, color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                      onClick={() => {
                        setNoLines((prev) =>
                          prev.map((item) => {
                            if (item.uid !== l.uid) return item;
                            const nextY = [...item.yarns];
                            tmpl.forEach((r, j) => {
                              if (!nextY[j]) nextY.push(newYarn(r));
                              else if (!nextY[j].role) nextY[j].role = r;
                            });
                            return { ...item, yarns: nextY };
                          })
                        );
                      }}
                    >
                      সুতার ঘরগুলো যোগ করুন
                    </button>
                  </div>
                )}

                <div className="yarns">
                  {l.yarns.map((y, j) => (
                    <div key={j} className={`yrow ${l.yd ? 'ydr' : ''}`}>
                      <span className="yno">{j + 1}</span>

                      <label className="no-f" htmlFor={`y${l.uid}-${j}-count`}>
                        <span>Yarn Count</span>
                        <input
                          id={`y${l.uid}-${j}-count`}
                          type="text"
                          placeholder={
                            /lycra|spandex/i.test(y.role)
                              ? 'যেমন: 20D Spandex'
                              : 'যেমন: 30/1 Combed Cotton'
                          }
                          value={y.count}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNoLines((prev) =>
                              prev.map((item) => {
                                if (item.uid !== l.uid) return item;
                                const nextY = [...item.yarns];
                                nextY[j] = { ...nextY[j], count: val };
                                return { ...item, yarns: nextY };
                              })
                            );
                          }}
                        />
                      </label>

                      <label className="no-f" htmlFor={`y${l.uid}-${j}-brand`}>
                        <span>Yarn Brand</span>
                        <input
                          id={`y${l.uid}-${j}-brand`}
                          type="text"
                          placeholder="যেমন: মিলের নাম"
                          value={y.brand}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNoLines((prev) =>
                              prev.map((item) => {
                                if (item.uid !== l.uid) return item;
                                const nextY = [...item.yarns];
                                nextY[j] = { ...nextY[j], brand: val };
                                return { ...item, yarns: nextY };
                              })
                            );
                          }}
                        />
                      </label>

                      <label className="no-f" htmlFor={`y${l.uid}-${j}-lot`}>
                        <span>Yarn Lot</span>
                        <input
                          id={`y${l.uid}-${j}-lot`}
                          type="text"
                          placeholder="যেমন: SQ-88415"
                          value={y.lot}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNoLines((prev) =>
                              prev.map((item) => {
                                if (item.uid !== l.uid) return item;
                                const nextY = [...item.yarns];
                                nextY[j] = { ...nextY[j], lot: val };
                                return { ...item, yarns: nextY };
                              })
                            );
                          }}
                        />
                      </label>

                      {l.yd && (
                        <label className="no-f" htmlFor={`y${l.uid}-${j}-col`}>
                          <span>সুতার রং</span>
                          <input
                            id={`y${l.uid}-${j}-col`}
                            type="text"
                            placeholder="যেমন: Navy"
                            value={y.col}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNoLines((prev) =>
                                prev.map((item) => {
                                  if (item.uid !== l.uid) return item;
                                  const nextY = [...item.yarns];
                                  nextY[j] = { ...nextY[j], col: val };
                                  return { ...item, yarns: nextY };
                                })
                              );
                            }}
                          />
                        </label>
                      )}

                      <label className="no-f ypct" htmlFor={`y${l.uid}-${j}-pct`}>
                        <span>কাপড়ে %</span>
                        <input
                          id={`y${l.uid}-${j}-pct`}
                          type="text"
                          inputMode="decimal"
                          placeholder={String(
                            yPct(
                              { ...y, pct: '' },
                              l.yarns.map((x) => (x === y ? { ...x, pct: '' } : x))
                            )
                          )}
                          value={y.pct}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNoLines((prev) =>
                              prev.map((item) => {
                                if (item.uid !== l.uid) return item;
                                const nextY = [...item.yarns];
                                nextY[j] = { ...nextY[j], pct: val };
                                return { ...item, yarns: nextY };
                              })
                            );
                          }}
                        />
                      </label>

                      {l.yarns.length > 1 ? (
                        <button
                          type="button"
                          className="ln-x yx"
                          onClick={() => {
                            setNoLines((prev) =>
                              prev.map((item) => {
                                if (item.uid !== l.uid) return item;
                                return {
                                  ...item,
                                  yarns: item.yarns.filter((_, idx) => idx !== j),
                                };
                              })
                            );
                          }}
                          aria-label="এই সুতা বাদ দিন"
                        >
                          ✕
                        </button>
                      ) : (
                        <span></span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="ysum" id={`ys${l.uid}`}>
                  {ysumText(l)}
                </div>

                <button
                  type="button"
                  className="addy"
                  style={{
                    alignSelf: 'flex-start',
                    background: 'none',
                    border: '1px dashed var(--line)',
                    padding: '5px 12px',
                    borderRadius: 6,
                    fontSize: '0.82rem',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    marginTop: 6,
                  }}
                  onClick={() => {
                    const t = yarnTemplate(l.fab);
                    setNoLines((prev) =>
                      prev.map((item) => {
                        if (item.uid !== l.uid) return item;
                        return {
                          ...item,
                          yarns: [...item.yarns, newYarn(t[item.yarns.length] || '')],
                        };
                      })
                    );
                  }}
                >
                  + আরেকটা সুতা যোগ করুন
                </button>

                {/* Technical Specifications */}
                <div className="ln-sub">স্পেসিফিকেশন</div>

                {l.kt === 'f' ? (
                  <div className="no-grid g3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px 16px' }}>
                    <label className="no-f" htmlFor={`l${l.uid}-fsize`}>
                      <span>সাইজ (সেমি)</span>
                      <input
                        id={`l${l.uid}-fsize`}
                        type="text"
                        placeholder="যেমন: 38 × 8 cm"
                        value={l.fsize}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNoLines((prev) =>
                            prev.map((item) =>
                              item.uid === l.uid ? { ...item, fsize: val } : item
                            )
                          );
                        }}
                      />
                    </label>

                    <label className="no-f" htmlFor={`l${l.uid}-pcw`}>
                      <span>প্রতি পিসের ওজন (গ্রাম)</span>
                      <input
                        id={`l${l.uid}-pcw`}
                        type="text"
                        inputMode="decimal"
                        placeholder="যেমন: 18"
                        value={l.pcw}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNoLines((prev) =>
                            prev.map((item) =>
                              item.uid === l.uid ? { ...item, pcw: val } : item
                            )
                          );
                        }}
                      />
                    </label>

                    <label className="no-f" htmlFor={`l${l.uid}-mg`}>
                      <span>
                        Machine Gauge <b className="req">*</b>
                      </span>
                      <input
                        id={`l${l.uid}-mg`}
                        type="text"
                        inputMode="decimal"
                        placeholder="যেমন: 14"
                        value={l.mg}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNoLines((prev) =>
                            prev.map((item) =>
                              item.uid === l.uid ? { ...item, mg: val } : item
                            )
                          );
                        }}
                      />
                    </label>

                    <label className="no-f" htmlFor={`l${l.uid}-fdes`} style={{ gridColumn: 'span 3' }}>
                      <span>ডিজাইন / টিপিং</span>
                      <input
                        id={`l${l.uid}-fdes`}
                        type="text"
                        placeholder="যেমন: ২টা সাদা স্ট্রাইপ, ৩ মিমি"
                        value={l.fdes}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNoLines((prev) =>
                            prev.map((item) =>
                              item.uid === l.uid ? { ...item, fdes: val } : item
                            )
                          );
                        }}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="no-grid g3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px 16px' }}>
                    <label className="no-f" htmlFor={`l${l.uid}-ggsm`}>
                      <span>Grey GSM</span>
                      <input
                        id={`l${l.uid}-ggsm`}
                        type="text"
                        inputMode="decimal"
                        placeholder="যেমন: 150"
                        value={l.ggsm}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNoLines((prev) =>
                            prev.map((item) =>
                              item.uid === l.uid ? { ...item, ggsm: val } : item
                            )
                          );
                        }}
                      />
                    </label>

                    <label className="no-f" htmlFor={`l${l.uid}-fgsm`}>
                      <span>Finish GSM</span>
                      <input
                        id={`l${l.uid}-fgsm`}
                        type="text"
                        inputMode="decimal"
                        placeholder="যেমন: 160"
                        value={l.fgsm}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNoLines((prev) =>
                            prev.map((item) =>
                              item.uid === l.uid ? { ...item, fgsm: val } : item
                            )
                          );
                        }}
                      />
                    </label>

                    <label className="no-f" htmlFor={`l${l.uid}-sl`}>
                      <span>Stitch Length</span>
                      <input
                        id={`l${l.uid}-sl`}
                        type="text"
                        placeholder="যেমন: 2.85 mm"
                        value={l.sl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNoLines((prev) =>
                            prev.map((item) =>
                              item.uid === l.uid ? { ...item, sl: val } : item
                            )
                          );
                        }}
                      />
                    </label>

                    <label className="no-f" htmlFor={`l${l.uid}-gdia`}>
                      <span>Grey Dia</span>
                      <input
                        id={`l${l.uid}-gdia`}
                        type="text"
                        placeholder="যেমন: 68"
                        value={l.gdia}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNoLines((prev) =>
                            prev.map((item) =>
                              item.uid === l.uid ? { ...item, gdia: val } : item
                            )
                          );
                        }}
                      />
                    </label>

                    <label className="no-f" htmlFor={`l${l.uid}-mdia`}>
                      <span>
                        Machine Dia <b className="req">*</b>
                      </span>
                      <input
                        id={`l${l.uid}-mdia`}
                        type="text"
                        inputMode="decimal"
                        placeholder="যেমন: 30"
                        value={l.mdia}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNoLines((prev) =>
                            prev.map((item) =>
                              item.uid === l.uid ? { ...item, mdia: val } : item
                            )
                          );
                        }}
                      />
                    </label>

                    <label className="no-f" htmlFor={`l${l.uid}-mg`}>
                      <span>
                        Machine Gauge <b className="req">*</b>
                      </span>
                      <input
                        id={`l${l.uid}-mg`}
                        type="text"
                        inputMode="decimal"
                        placeholder="যেমন: 24"
                        value={l.mg}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNoLines((prev) =>
                            prev.map((item) =>
                              item.uid === l.uid ? { ...item, mg: val } : item
                            )
                          );
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CARD 4: ASSIGN TO M/C NO (EXACT MATCHING KNITKHATA.HTML) */}
        <div className="card">
          <h3>
            <span className="stp">৪</span>Assign to M/C No
          </h3>
          <p className="small muted" style={{ margin: '-4px 0 8px' }}>
            যে অংশটা বাছা আছে, মেশিনে চাপ দিলে সেটা ওই অংশে যাবে। অংশ বদলাতে নিচের রঙিন বাটনে চাপুন।
          </p>

          <div className="lnpick" id="lnpick">
            {noLines.map((l, i) => (
              <button
                key={l.uid}
                type="button"
                className={`lp ${l.uid === noActive ? 'on' : ''}`}
                style={{ ['--c' as any]: `var(--l${(i % 5) + 1})` }}
                onClick={() => setNoActive(l.uid)}
              >
                <span>{i + 1}</span>
                {lname(l, i)}
              </button>
            ))}
          </div>

          <div className="mcpick" id="mcpick">
            {machines.map((m) => {
              const o = mcOwner[m.id];
              const isBusy = m.status === 'Running' && o === undefined;
              const isDown = m.status === 'Maint';

              return (
                <button
                  key={m.id}
                  type="button"
                  className={`mcb ${isBusy ? 'busy' : ''} ${isDown ? 'down' : ''} ${o !== undefined ? 'own' : ''
                    }`}
                  style={o !== undefined ? ({ ['--c' as any]: `var(--l${(o % 5) + 1})` } as any) : undefined}
                  disabled={isBusy || isDown}
                  title={
                    isBusy
                      ? 'অন্য অর্ডারে চলছে'
                      : isDown
                        ? 'ব্রেকডাউন'
                        : o !== undefined
                          ? noLines[o].fab || `লাইন ${o + 1}`
                          : 'খালি'
                  }
                  onClick={() => handleToggleMachine(m.id)}
                >
                  {m.id}
                  {o !== undefined && <sup>{o + 1}</sup>}
                </button>
              );
            })}
          </div>

          <div className="small muted" id="mcsum" style={{ marginTop: 10 }}>
            {noLines.filter((l) => l.machines.length > 0).length > 0 ? (
              noLines
                .filter((l) => l.machines.length > 0)
                .map((l, i) => (
                  <div key={l.uid}>
                    <b>{lname(l, i)}:</b> {l.machines.join(', ')}
                  </div>
                ))
            ) : (
              'কোনো মেশিন বাছাই হয়নি'
            )}
          </div>
        </div>

        {/* Add Another Line Button */}
        <button
          type="button"
          className="btn addln"
          id="addln"
          onClick={handleAddLine}
        >
          + আরেকটা অংশ যোগ করুন
        </button>

        {/* Validation Message */}
        {formMsg && (
          <div className="no-msg" id="no-msg">
            {formMsg}
          </div>
        )}

        {/* Submit Button */}
        <button
          className="btn pri no-save"
          type="submit"
          disabled={submitting}
        >
          {submitting ? 'সংরক্ষণ হচ্ছে...' : 'অর্ডার সেভ করুন'}
        </button>
      </form>

      {/* ========================================================
          BEAUTIFIED BUYER / PARTY REGISTRATION MODAL
      ======================================================== */}
      {showAddPartyModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddPartyModal(false)}
          style={{
            zIndex: 1200,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 580,
              background: 'var(--surface, #ffffff)',
              borderRadius: 20,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px var(--border, #e2e8f0)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '92vh',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient & branding */}
            <div
              style={{
                padding: '20px 24px 18px',
                borderBottom: '1px solid var(--border, #e2e8f0)',
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
                    flexShrink: 0,
                  }}
                >
                  <UserPlus size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text, #0f172a)', letterSpacing: '-0.01em' }}>
                      নতুন বায়ার / পার্টি নিবন্ধন
                    </h3>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: 'var(--primary, #0284c7)',
                        background: 'var(--brand-surface, #e0f2fe)',
                        padding: '2px 8px',
                        borderRadius: 9999,
                        letterSpacing: '0.02em',
                      }}
                    >
                      ইনস্ট্যান্ট লিংক
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddPartyModal(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(0, 0, 0, 0.05)',
                  color: 'var(--muted, #64748b)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.color = 'var(--muted, #64748b)';
                }}
                aria-label="বন্ধ করুন"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleCreatePartySubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
              <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {modalPartyError && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: 10,
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      color: '#b91c1c',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                    }}
                  >
                    <AlertCircle size={18} style={{ flexShrink: 0, color: '#ef4444' }} />
                    <span>{modalPartyError}</span>
                  </div>
                )}

                {/* Field: Party Name */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--text, #1e293b)',
                      marginBottom: 6,
                    }}
                  >
                    বায়ার / প্রতিষ্ঠানের নাম <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div style={{ position: 'absolute', left: 12, color: 'var(--muted, #94a3b8)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                      <Building2 size={16} />
                    </div>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="যেমন: ABC Knit Composite Ltd বা মেসার্স রহিম টেক্সটাইল"
                      value={modalPartyName}
                      onChange={(e) => setModalPartyName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 38px',
                        borderRadius: 10,
                        border: '1.5px solid var(--border, #cbd5e1)',
                        background: 'var(--surface, #ffffff)',
                        color: 'var(--text, #0f172a)',
                        fontSize: '0.92rem',
                        outline: 'none',
                        transition: 'all 0.15s ease',
                        boxSizing: 'border-box',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary, #0284c7)';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border, #cbd5e1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* 2-Column: Phone & Contact Person */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: 'var(--text, #1e293b)',
                        marginBottom: 6,
                      }}
                    >
                      মোবাইল নম্বর
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <div style={{ position: 'absolute', left: 12, color: 'var(--muted, #94a3b8)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                        <Phone size={16} />
                      </div>
                      <input
                        type="text"
                        placeholder="যেমন: 01711-000111"
                        value={modalPartyPhone}
                        onChange={(e) => setModalPartyPhone(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 38px',
                          borderRadius: 10,
                          border: '1.5px solid var(--border, #cbd5e1)',
                          background: 'var(--surface, #ffffff)',
                          color: 'var(--text, #0f172a)',
                          fontSize: '0.92rem',
                          outline: 'none',
                          transition: 'all 0.15s ease',
                          boxSizing: 'border-box',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary, #0284c7)';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.15)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border, #cbd5e1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: 'var(--text, #1e293b)',
                        marginBottom: 6,
                      }}
                    >
                      যোগাযোগকারী কর্মকর্তা
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <div style={{ position: 'absolute', left: 12, color: 'var(--muted, #94a3b8)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                        <User size={16} />
                      </div>
                      <input
                        type="text"
                        placeholder="যেমন: মো. কামরুল হাসান (মার্চেন্ডাইজার)"
                        value={modalPartyContact}
                        onChange={(e) => setModalPartyContact(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 38px',
                          borderRadius: 10,
                          border: '1.5px solid var(--border, #cbd5e1)',
                          background: 'var(--surface, #ffffff)',
                          color: 'var(--text, #0f172a)',
                          fontSize: '0.92rem',
                          outline: 'none',
                          transition: 'all 0.15s ease',
                          boxSizing: 'border-box',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary, #0284c7)';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.15)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border, #cbd5e1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Field: Office / Factory Address */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--text, #1e293b)',
                      marginBottom: 6,
                    }}
                  >
                    কারখানা বা অফিসের ঠিকানা
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div style={{ position: 'absolute', left: 12, color: 'var(--muted, #94a3b8)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                      <MapPin size={16} />
                    </div>
                    <input
                      type="text"
                      placeholder="যেমন: জামগড়া, আশুলিয়া, সাভার, ঢাকা"
                      value={modalPartyAddress}
                      onChange={(e) => setModalPartyAddress(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 38px',
                        borderRadius: 10,
                        border: '1.5px solid var(--border, #cbd5e1)',
                        background: 'var(--surface, #ffffff)',
                        color: 'var(--text, #0f172a)',
                        fontSize: '0.92rem',
                        outline: 'none',
                        transition: 'all 0.15s ease',
                        boxSizing: 'border-box',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary, #0284c7)';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(2, 132, 199, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border, #cbd5e1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* Section 2: Commercial Terms Container */}
                <div
                  style={{
                    background: 'var(--background, #f8fafc)',
                    border: '1px solid var(--border, #e2e8f0)',
                    borderRadius: 14,
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    বাণিজ্যিক শর্ত ও রেট
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 1.1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text, #1e293b)', marginBottom: 5 }}>
                        ডিফল্ট রেট (৳/কেজি)
                      </label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <span style={{ position: 'absolute', left: 10, color: 'var(--muted, #94a3b8)', fontWeight: 600, fontSize: 14, pointerEvents: 'none' }}>
                          ৳
                        </span>
                        <input
                          type="number"
                          step="0.5"
                          placeholder="২৪.৫০"
                          value={modalPartyRate}
                          onChange={(e) => setModalPartyRate(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px 8px 26px',
                            borderRadius: 8,
                            border: '1px solid var(--border, #cbd5e1)',
                            background: 'var(--surface, #ffffff)',
                            color: 'var(--text, #0f172a)',
                            fontSize: '0.88rem',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text, #1e293b)', marginBottom: 5 }}>
                        পেমেন্ট শর্ত
                      </label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <div style={{ position: 'absolute', left: 10, color: 'var(--muted, #94a3b8)', pointerEvents: 'none' }}>
                          <Calendar size={14} />
                        </div>
                        <select
                          value={modalPartyTerms}
                          onChange={(e) => setModalPartyTerms(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 10px 8px 30px',
                            borderRadius: 8,
                            border: '1px solid var(--border, #cbd5e1)',
                            background: 'var(--surface, #ffffff)',
                            color: 'var(--text, #0f172a)',
                            fontSize: '0.88rem',
                            outline: 'none',
                            boxSizing: 'border-box',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="বিলের ৩০ দিনের মধ্যে">বিলের ৩০ দিনের মধ্যে</option>
                          <option value="বিলের ১৫ দিনের মধ্যে">বিলের ১৫ দিনের মধ্যে</option>
                          <option value="বিলের ৪৫ দিনের মধ্যে">বিলের ৪৫ দিনের মধ্যে</option>
                          <option value="নগদ / ক্যাশ">নগদ / ক্যাশ</option>
                          <option value="সাপ্তাহিক">সাপ্তাহিক</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text, #1e293b)', marginBottom: 5 }}>
                        পূর্বের বকেয়া (৳)
                      </label>
                      <input
                        type="number"
                        step="1"
                        placeholder="০"
                        value={modalPartyOpening}
                        onChange={(e) => setModalPartyOpening(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: 8,
                          border: '1px solid var(--border, #cbd5e1)',
                          background: 'var(--surface, #ffffff)',
                          color: 'var(--text, #0f172a)',
                          fontSize: '0.88rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div
                style={{
                  padding: '14px 24px',
                  background: 'var(--background, #f8fafc)',
                  borderTop: '1px solid var(--border, #e2e8f0)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--muted, #64748b)' }}>
                  <Sparkles size={14} style={{ color: 'var(--primary, #0284c7)' }} />
                  <span>কোনো পেজ রিলোড ছাড়াই সেভ হবে</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowAddPartyModal(false)}
                    disabled={modalPartySubmitting}
                    style={{
                      padding: '9px 18px',
                      borderRadius: 10,
                      border: '1px solid var(--border, #cbd5e1)',
                      background: 'transparent',
                      color: 'var(--text, #334155)',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    বাতিল
                  </button>

                  <button
                    type="submit"
                    disabled={modalPartySubmitting}
                    style={{
                      padding: '9px 22px',
                      borderRadius: 10,
                      border: 'none',
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: modalPartySubmitting ? 'not-allowed' : 'pointer',
                      opacity: modalPartySubmitting ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {modalPartySubmitting ? (
                      <>
                        <span
                          style={{
                            width: 14,
                            height: 14,
                            border: '2px solid rgba(255,255,255,0.4)',
                            borderTopColor: '#ffffff',
                            borderRadius: '50%',
                            display: 'inline-block',
                            animation: 'spin 0.6s linear infinite',
                          }}
                        />
                        <span>সংরক্ষণ হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        <span>বায়ার সংরক্ষণ করুন</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
