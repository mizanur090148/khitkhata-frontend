import React, { useState, useMemo, useEffect } from 'react';
import { Loader2, Layers, Clock, Users, AlertTriangle, CheckCircle2, Search } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { SearchableSelect } from '@/components/common/SearchableSelect';

export const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
export const toBn = (n: number | string | undefined | null): string => {
  if (n === undefined || n === null || n === '') return '০';
  return String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
};

export const QC_ACT = [
  'রিনিট হবে',
  'রিজেক্ট — বাদ যাবে',
  'ছাড় দিয়ে নেওয়া হবে (ডিসকাউন্ট)',
  'সার্টিং করে ভালো অংশ নেওয়া হবে',
];

export const getQcAct = (lang?: string) => [
  lang === 'en' ? 'Will Re-knit' : 'রিনিট হবে',
  lang === 'en' ? 'Reject — Will Scrap' : 'রিজেক্ট — বাদ যাবে',
  lang === 'en' ? 'Accept with Discount' : 'ছাড় দিয়ে নেওয়া হবে (ডিসকাউন্ট)',
  lang === 'en' ? 'Sort & Keep Good Parts' : 'সার্টিং করে ভালো অংশ নেওয়া হবে',
];

export const ISSUES = [
  { val: '', label: 'কোনো ফল্ট নেই' },
  { val: 'Hole', label: 'Hole (হোল)' },
  { val: 'Needle Mark', label: 'Needle Mark (নিডল দাগ)' },
  { val: 'Needle Broken', label: 'Needle Broken (নিডল ভাঙা)' },
  { val: 'Oil Spot', label: 'Oil Spot (তেলের দাগ)' },
  { val: 'Ink Spot', label: 'Ink Spot (কালির দাগ)' },
  { val: 'Star Mark', label: 'Star Mark (স্টার মার্ক)' },
  { val: 'Lycra Out', label: 'Lycra Out (লাইক্রা আউট)' },
  { val: 'Patta (Barre)', label: 'Patta / Barre (শেড লাইন)' },
  { val: 'Missing Yarn', label: 'Missing Yarn (সুতা মিস)' },
  { val: 'Shade Up', label: 'Shade Up (শেড আপ)' },
  { val: 'Yarn Fault', label: 'Yarn Fault (সুতার ফল্ট)' },
  { val: 'Y/D Design', label: 'Y/D Design (ডিজাইন ত্রুটি)' },
  { val: 'Foreign Fiber', label: 'Foreign Fiber (অন্যান্য আঁশ)' },
  { val: 'Slab Yarn', label: 'Slab Yarn (স্ল্যাব সুতা)' },
  { val: 'Thick Thin', label: 'Thick Thin (মোটা-পাতলা)' },
  { val: 'Sinker Mark', label: 'Sinker Mark (সিঙ্কার দাগ)' },
  { val: 'other', label: 'অন্যান্য ফল্ট' },
];

export interface QcSignInfo {
  v: 'ok' | 'bad' | null;
  by: string;
  at: string;
  note?: string;
}

export interface QcItem {
  id: string;
  o?: string;
  order_no?: string;
  d: string;
  roll: string;
  m: string;
  pl: number;
  kg: number;
  issue: string;
  src: 'fac' | 'ven' | 'floor';
  fac: QcSignInfo;
  ven: QcSignInfo;
  act?: string;
}

export function qcState(q: QcItem, lang = 'bn') {
  const f = q.fac?.v;
  const v = q.ven?.v;
  if (f && v && f === v) {
    return f === 'ok'
      ? { k: 'agree', s: 'ok', t: (lang === 'en' ? 'Both sides agreed · Fabric OK' : 'উভয় পক্ষ একমত · কাপড় ঠিক আছে') }
      : { k: 'agree', s: 'bad', t: (lang === 'en' ? 'Both sides agreed · Fabric Bad' + (q.act ? ' — ' + q.act : '') : 'উভয় পক্ষ একমত · কাপড় খারাপ' + (q.act ? ' — ' + q.act : '')) };
  }
  if (f && v) return { k: 'dispute', s: 'bad', t: (lang === 'en' ? 'Dispute · Joint inspection needed' : 'দ্বিমত · যৌথ পরিদর্শন দরকার') };
  if (!f && !v) return { k: 'pend', s: 'warn', t: (lang === 'en' ? 'Pending both sides review' : 'দুই পক্ষেরই মতামত বাকি') };
  return { k: 'pend', s: 'warn', t: lang === 'en' ? (f ? 'Pending Vendor QC review' : 'Pending Factory QC review') : (f ? 'ভেন্ডর QC-র মতামত বাকি' : 'ফ্যাক্টরি QC-র মতামত বাকি') };
}

export const FactoryQcPage: React.FC = () => {
  const {
    orders,
    qcInspections,
    fetchQcInspections,
    fetchOrders,
    machines,
    role,
    currentUser,
    storeQcInspection,
    signQcInspection,
    updateQcAction,
    addToast,
    t,
    language,
  } = useApp();

  const isVendorRole = (role as string) === 'vendor' || (role as string) === 'ven';
  const mySide: 'fac' | 'ven' = isVendorRole ? 'ven' : 'fac';

  // Loading state (instant if orders already in memory)
  const [isLoading, setIsLoading] = useState(orders.length === 0);

  // Filter state
  const [qcFilter, setQcFilter] = useState<'all' | 'mine' | 'theirs' | 'disp' | 'agree'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [qcFormOpen, setQcFormOpen] = useState(false);
  const [qcSignTarget, setQcSignTarget] = useState<{ id: string; v: 'ok' | 'bad'; side: 'fac' | 'ven' } | null>(null);
  const [signNote, setSignNote] = useState('');
  const [signConfirmed, setSignConfirmed] = useState(false);
  const [submittingSign, setSubmittingSign] = useState(false);

  // New QC Entry Form state
  const [newVendor, setNewVendor] = useState('');
  const [newOrderNo, setNewOrderNo] = useState('');
  const [newPlIndex, setNewPlIndex] = useState(0);
  const [newRollNo, setNewRollNo] = useState('');
  const [newMachine, setNewMachine] = useState('—');
  const [newWeightKg, setNewWeightKg] = useState('22');
  const [newIssue, setNewIssue] = useState('');
  const [newVerdict, setNewVerdict] = useState<'bad' | 'ok'>('bad');
  const [newNote, setNewNote] = useState('');
  const [newFormConfirmed, setNewFormConfirmed] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Fetch fresh data from Laravel MySQL database on mount
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      if (orders.length === 0) {
        setIsLoading(true);
      }
      try {
        await Promise.all([fetchOrders(), fetchQcInspections()]);
      } catch (err) {
        console.warn('Error loading QC page data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Collect and merge all QC records (order-embedded and live database inspections)
  const allQcItems = useMemo(() => {
    const map = new Map<string, { q: QcItem; o: any }>();

    // 1. First add from orders.qc
    const relevantOrders = isVendorRole
      ? orders.filter(
          (o: any) =>
            o.party_code === 'abc' ||
            o.v === 'abc' ||
            o.party === 'abc' ||
            (o.party && o.party.includes('ABC'))
        )
      : orders;

    relevantOrders.forEach((o: any) => {
      const qcs: any[] = o.qc || [];
      qcs.forEach((rawQ) => {
        const id = rawQ.id || rawQ.qc_no;
        if (!id) return;
        const item: QcItem = {
          id,
          o: o.id || o.order_no,
          order_no: o.id || o.order_no,
          d: rawQ.d || rawQ.date_label || '03 Oct',
          roll: rawQ.roll || rawQ.roll_no || '—',
          m: rawQ.m || rawQ.machine_code || '—',
          pl: Number(rawQ.pl ?? rawQ.placement_index ?? 0),
          kg: Number(rawQ.kg ?? rawQ.weight_kg ?? 20),
          issue: rawQ.issue || rawQ.issue_description || 'কোনো ফল্ট নেই',
          src: rawQ.src || rawQ.source || 'fac',
          fac: rawQ.fac || { v: null, by: '', at: '', note: '' },
          ven: rawQ.ven || { v: null, by: '', at: '', note: '' },
          act: rawQ.act || rawQ.action_taken || '',
        };
        map.set(id, { q: item, o });
      });
    });

    // 2. Overlay / add direct database inspections from qcInspections (ensures 100% live state from MySQL)
    (qcInspections || []).forEach((rawQ: any) => {
      const id = rawQ.id || rawQ.qc_no;
      if (!id) return;
      const orderNo = rawQ.o || rawQ.order_no;
      const matchedOrder = orders.find((ord: any) => ord.id === orderNo || ord.order_no === orderNo);

      // If vendor role, filter out if it does not belong to vendor
      if (isVendorRole) {
        const partyName = matchedOrder?.party || (matchedOrder as any)?.party_name || (matchedOrder as any)?.party_code || '';
        const isVenMatch =
          partyName.includes('ABC') ||
          (matchedOrder as any)?.party_code === 'abc' ||
          (matchedOrder as any)?.v === 'abc' ||
          (rawQ.ven?.by && rawQ.ven.by.includes('ABC'));
        if (!isVenMatch) return;
      }

      const o = matchedOrder || {
        id: orderNo,
        order_no: orderNo,
        party: 'ABC Fabrics',
        lines: [{ place: rawQ.placement_name || 'Body', fab: 'Single Jersey' }],
      };

      const item: QcItem = {
        id,
        o: orderNo,
        order_no: orderNo,
        d: rawQ.d || rawQ.date_label || '03 Oct',
        roll: rawQ.roll || rawQ.roll_no || '—',
        m: rawQ.m || rawQ.machine_code || '—',
        pl: Number(rawQ.pl ?? rawQ.placement_index ?? 0),
        kg: Number(rawQ.kg ?? rawQ.weight_kg ?? 20),
        issue: rawQ.issue || rawQ.issue_description || 'কোনো ফল্ট নেই',
        src: rawQ.src || rawQ.source || 'fac',
        fac: rawQ.fac || { v: null, by: '', at: '', note: '' },
        ven: rawQ.ven || { v: null, by: '', at: '', note: '' },
        act: rawQ.act || rawQ.action_taken || '',
      };

      map.set(id, { q: item, o });
    });

    // Sort newest inspections first (e.g. descending by QC number)
    return Array.from(map.values()).sort((a, b) => b.q.id.localeCompare(a.q.id));
  }, [orders, qcInspections, isVendorRole]);

  // KPIs
  const myPend = useMemo(() => allQcItems.filter(({ q }) => !q[mySide]?.v), [allQcItems, mySide]);
  const theirSide: 'fac' | 'ven' = mySide === 'fac' ? 'ven' : 'fac';
  const theirPend = useMemo(
    () => allQcItems.filter(({ q }) => q[mySide]?.v && !q[theirSide]?.v),
    [allQcItems, mySide, theirSide]
  );
  const disp = useMemo(() => allQcItems.filter(({ q }) => qcState(q, language).k === 'dispute'), [allQcItems, language]);
  const agr = useMemo(() => allQcItems.filter(({ q }) => qcState(q, language).k === 'agree'), [allQcItems, language]);
  const passCount = useMemo(() => agr.filter(({ q }) => q.fac?.v === 'ok' && q.ven?.v === 'ok').length, [agr]);

  // Filtered List (with tab filter + live search)
  const filteredList = useMemo(() => {
    let list: { q: QcItem; o: any }[] = [];
    switch (qcFilter) {
      case 'mine':
        list = myPend;
        break;
      case 'theirs':
        list = theirPend;
        break;
      case 'disp':
        list = disp;
        break;
      case 'agree':
        list = agr;
        break;
      default:
        list = allQcItems;
        break;
    }
    if (searchQuery.trim()) {
      const s = searchQuery.toLowerCase().trim();
      list = list.filter(({ q, o }) => {
        const orderNo = String(q.o || o.id || o.order_no || '').toLowerCase();
        const roll = String(q.roll || '').toLowerCase();
        const issue = String(q.issue || '').toLowerCase();
        const party = String(o.party || o.party_name || o.party_code || '').toLowerCase();
        const machine = String(q.m || '').toLowerCase();
        const qcId = String(q.id || '').toLowerCase();
        return (
          orderNo.includes(s) ||
          roll.includes(s) ||
          issue.includes(s) ||
          party.includes(s) ||
          machine.includes(s) ||
          qcId.includes(s)
        );
      });
    }
    return list;
  }, [qcFilter, myPend, theirPend, disp, agr, allQcItems, searchQuery]);

  // Selectable vendors & orders for new QC
  const selectableOrders = useMemo(
    () => orders.filter((o: any) => o.status !== 'done' && o.status !== 'Completed'),
    [orders]
  );
  const uniqueVendors = useMemo(() => {
    const vMap = new Map<string, string>();
    selectableOrders.forEach((o: any) => {
      const code = o.party_code || o.v || o.party || 'ven-1';
      const name = o.party || o.party_name || code;
      if (!vMap.has(code)) vMap.set(code, name);
    });
    return Array.from(vMap.entries()).map(([code, name]) => ({ code, name }));
  }, [selectableOrders]);

  // Sync default new form dropdowns
  const activeVendorCode = newVendor || (uniqueVendors[0]?.code ?? '');
  const ordersForSelectedVendor = useMemo(() => {
    return selectableOrders.filter((o: any) => {
      if (!activeVendorCode) return true;
      const c = o.party_code || o.v || o.party;
      return c === activeVendorCode;
    });
  }, [selectableOrders, activeVendorCode]);

  const activeSelectedOrder = useMemo(() => {
    if (newOrderNo) {
      const found = ordersForSelectedVendor.find((o: any) => o.id === newOrderNo || o.order_no === newOrderNo);
      if (found) return found;
    }
    return ordersForSelectedVendor[0] || selectableOrders[0] || null;
  }, [ordersForSelectedVendor, selectableOrders, newOrderNo]);

  const activeLines = useMemo(() => {
    if (!activeSelectedOrder) return [];
    const lines = (activeSelectedOrder as any).lines || [];
    if (lines.length > 0) return lines;
    return [
      {
        place: 'Body',
        fab: (activeSelectedOrder as any).fabric || 'Single Jersey',
        machines: (activeSelectedOrder as any).machines || [],
      },
    ];
  }, [activeSelectedOrder]);

  const currentLine = activeLines[newPlIndex] || activeLines[0];

  // Dynamically populated machines
  const availableMachineOptions = useMemo(() => {
    const opts: Array<{ value: string; label: string }> = [{ value: '—', label: '—' }];
    const assigned = ((currentLine as any)?.machines || (activeSelectedOrder as any)?.machines || []) as string[];
    assigned.forEach((m) => {
      if (m && !opts.some((o) => o.value === m)) {
        opts.push({ value: m, label: `${m} (অর্ডারে নির্ধারিত)` });
      }
    });
    (machines || []).forEach((m: any) => {
      const code = m.code || m.name || m.id;
      if (code && !opts.some((o) => o.value === code)) {
        opts.push({ value: code, label: code });
      }
    });
    return opts;
  }, [currentLine, activeSelectedOrder, machines]);

  // Start quick signing
  const handleStartSign = (id: string, verdict: 'ok' | 'bad', side: 'fac' | 'ven') => {
    setQcSignTarget({ id, v: verdict, side });
    setSignNote('');
    setSignConfirmed(false);
  };

  // Submit sign
  const handleConfirmSign = async () => {
    if (!qcSignTarget) return;
    if (qcSignTarget.v === 'bad' && !signNote.trim()) {
      addToast({
        type: 'info',
        title: 'মন্তব্য আবশ্যক',
        message: 'কী সমস্যা দেখলেন তা মন্তব্য ঘরে লিখুন',
      });
      return;
    }
    if (!signConfirmed) {
      addToast({
        type: 'info',
        title: 'স্বীকৃতি প্রয়োজন',
        message: 'সাইন করার আগে চেকবক্সে টিক দিন',
      });
      return;
    }

    const signerName =
      qcSignTarget.side === 'fac'
        ? currentUser?.name || 'রুবেল মিয়া (ফ্যাক্টরি QC)'
        : `${currentUser?.name || 'মো. কামরুল হাসান'} (ভেন্ডর QC)`;

    setSubmittingSign(true);
    try {
      await signQcInspection(qcSignTarget.id, {
        side: qcSignTarget.side,
        verdict: qcSignTarget.v,
        signed_by: signerName,
        note: signNote.trim(),
      });
      setQcSignTarget(null);
      setSignNote('');
      setSignConfirmed(false);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'সাইন ব্যর্থ',
        message: err.message || 'সাইন সংরক্ষণে ব্যর্থ হয়েছে',
      });
    } finally {
      setSubmittingSign(false);
    }
  };

  // Submit new QC Entry
  const handleCreateQc = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!activeSelectedOrder) {
      setFormError('অনুগ্রহ করে একটি অর্ডার নির্বাচন করুন');
      return;
    }
    if (!newRollNo.trim()) {
      setFormError('রোল নম্বর প্রদান করা আবশ্যক (যেমন: M-03/007)');
      return;
    }
    if (newVerdict === 'bad' && !newIssue && !newNote.trim()) {
      setFormError('কাপড় খারাপ চিহ্নিত করলে ফল্ট নির্বাচন করুন অথবা বিবরণ লিখুন');
      return;
    }
    if (!newFormConfirmed) {
      setFormError('কাপড় নিজে দেখার সত্যতা স্বীকার করে টিক দিন');
      return;
    }

    const orderNo = (activeSelectedOrder as any).id || (activeSelectedOrder as any).order_no;
    const signerName =
      mySide === 'fac'
        ? currentUser?.name || 'রুবেল মিয়া (ফ্যাক্টরি QC)'
        : `${currentUser?.name || 'মো. কামরুল হাসান'} (ভেন্ডর QC)`;

    setIsSubmittingForm(true);
    try {
      await storeQcInspection({
        order_no: orderNo,
        placement_index: newPlIndex,
        roll_no: newRollNo.trim(),
        machine_code: newMachine === '—' ? undefined : newMachine,
        weight_kg: Number(newWeightKg) || 22,
        issue: newIssue ? (newNote ? `${newIssue} — ${newNote}` : newIssue) : (newNote || 'কোনো ফল্ট নেই'),
        verdict: newVerdict,
        note: newNote.trim(),
        side: mySide,
        signed_by: signerName,
      });

      setQcFormOpen(false);
      setNewRollNo('');
      setNewNote('');
      setNewIssue('');
      setNewFormConfirmed(false);
      setFormError('');
    } catch (err: any) {
      setFormError(err.message || 'QC এন্ট্রি সংরক্ষণ করতে সমস্যা হয়েছে');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Handle action decision change
  const handleActionChange = async (qcNo: string, val: string) => {
    try {
      await updateQcAction(qcNo, val);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'সিদ্ধান্ত সংরক্ষণ ব্যর্থ',
        message: err.message || 'সিদ্ধান্ত সংরক্ষণে সমস্যা হয়েছে',
      });
    }
  };

  // Helper render for sign pill
  const renderPill = (v: 'ok' | 'bad' | null | undefined) => {
    if (v === 'ok') return <span className="pill p-ok">{language === 'en' ? 'Fabric OK' : 'কাপড় ঠিক আছে'}</span>;
    if (v === 'bad') return <span className="pill p-bad">{language === 'en' ? 'Fabric Bad' : 'কাপড় খারাপ'}</span>;
    return <span className="pill p-idle">{language === 'en' ? 'Pending Review' : 'মতামত বাকি'}</span>;
  };

  // Helper render for individual side (Factory or Vendor)
  const renderSideBox = (q: QcItem, o: any, sideKey: 'fac' | 'ven') => {
    const s = q[sideKey] || { v: null, by: '', at: '', note: '' };
    const isMine = sideKey === mySide;
    const partyName = o.party || o.party_name || o.party_code || 'ABC';
    const title = sideKey === 'fac' ? 'ফ্যাক্টরি QC' : `ভেন্ডর QC · ${partyName}`;
    const signing = qcSignTarget && qcSignTarget.id === q.id && qcSignTarget.side === sideKey;
    const st = qcState(q);

    return (
      <div className={`qs ${s.v ? 'qs-' + s.v : ''} ${isMine ? 'qs-me' : ''}`} key={sideKey}>
        <div className="qs-h">
          <b>{title}</b>
          {isMine && <span className="small muted">(আপনি)</span>}
        </div>

        {s.v ? (
          <>
            <div>{renderPill(s.v)}</div>
            {s.note && <p className="qs-n">"{s.note}"</p>}
            <div className="qs-sig">
              ✍ {s.by} <span>{s.at}</span>
            </div>
          </>
        ) : (
          <div>{renderPill(null)}</div>
        )}

        {/* Quick action buttons if pending or dispute */}
        {isMine && !signing && (!s.v || st.k === 'dispute') && (
          <>
            <div className="qs-b" style={{ marginTop: 6 }}>
              <button
                type="button"
                className="btn sm qok"
                onClick={() => handleStartSign(q.id, 'ok', sideKey)}
              >
                {language === 'en' ? '✓ OK' : '✓ ঠিক আছে'}
              </button>
              <button
                type="button"
                className="btn sm qbad"
                onClick={() => handleStartSign(q.id, 'bad', sideKey)}
              >
                {language === 'en' ? '✗ Bad' : '✗ খারাপ'}
              </button>
            </div>
            {s.v && <p className="small muted" style={{ margin: '4px 0 0' }}>{language === 'en' ? 'You can re-inspect and change opinion' : 'আবার দেখে মত বদলাতে পারেন'}</p>}
          </>
        )}

        {/* Inline signature form */}
        {signing && (
          <div className="qs-form" style={{ marginTop: 8 }}>
            <div className="small">{language === 'en' ? 'Your opinion: ' : 'আপনার মত: '}{renderPill(qcSignTarget.v)}</div>
            <label className="no-f" style={{ marginTop: 6 }}>
              <span>{language === 'en' ? 'Remarks' : 'মন্তব্য'} {qcSignTarget.v === 'bad' && <b className="req">*</b>}</span>
              <input
                type="text"
                value={signNote}
                onChange={(e) => setSignNote(e.target.value)}
                placeholder={qcSignTarget.v === 'bad' ? (language === 'en' ? 'What issues did you see — e.g., 3 holes' : 'কী সমস্যা দেখলেন — যেমন: ৩ জায়গায় হোল') : (language === 'en' ? 'Optional remarks' : 'ঐচ্ছিক মন্তব্য')}
                style={{ width: '100%' }}
                autoFocus
              />
            </label>
            <label className="qs-ck" style={{ marginTop: 6 }}>
              <input
                type="checkbox"
                checked={signConfirmed}
                onChange={(e) => setSignConfirmed(e.target.checked)}
              />
              <span>
                আমি <b>{currentUser?.name || (sideKey === 'fac' ? 'রুবেল মিয়া (ফ্যাক্টরি QC)' : 'ভেন্ডর QC')}</b> কাপড়টা নিজে দেখেছি, এটা আমার মতামত
              </span>
            </label>
            <div className="row" style={{ marginTop: 8, gap: 6 }}>
              <button
                type="button"
                className="btn pri sm"
                onClick={handleConfirmSign}
                disabled={submittingSign}
              >
                {submittingSign ? (language === 'en' ? 'Saving...' : 'সংরক্ষণ হচ্ছে...') : (language === 'en' ? 'Sign & Submit' : 'সাইন করে জমা দিন')}
              </button>
              <button
                type="button"
                className="btn sm"
                onClick={() => setQcSignTarget(null)}
                disabled={submittingSign}
              >
                {language === 'en' ? 'Cancel' : 'বাতিল'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="no-wrap" style={{ maxWidth: '100%', width: '100%', padding: '0 8px' }}>
      {/* Top Banner if Vendor Role */}
      {isVendorRole && (
        <div className="vbanner" style={{ marginBottom: 16 }}>
          {language === 'en'
            ? <>Viewing as <b>{currentUser?.name || 'Vendor QC'}</b>. All QC records for your fabric appear here live.</>
            : <>আপনি <b>{currentUser?.name || 'ভেন্ডর QC'}</b> হিসেবে দেখছেন। রহমান নিটিং-এ আপনাদের কাপড়ের সব QC রেকর্ড এখানে। ফ্যাক্টরি যা লেখে আপনিও তা-ই দেখেন।</>}
        </div>
      )}

      {/* Compact Header */}
      <div className="head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>{t('QC ও কাপড়ের সমস্যা')}</h2>
          <p style={{ margin: '2px 0 0', color: 'var(--muted)', fontSize: '0.84rem' }}>
            {language === 'en' ? 'Both factory QC and vendor QC inspect and sign each roll. The record is finalized once both agree.' : 'প্রতিটা রোলে ফ্যাক্টরি QC আর ভেন্ডর QC দুজনেই মত দেবেন ও সাইন করবেন। দুজন একমত হলে তবেই রেকর্ড চূড়ান্ত।'}
          </p>
        </div>
        <button
          className="btn pri"
          type="button"
          onClick={() => {
            setQcFormOpen(!qcFormOpen);
            setFormError('');
          }}
          style={{ whiteSpace: 'nowrap' }}
        >
          {qcFormOpen ? (language === 'en' ? '✕ Close Form' : '✕ বন্ধ করুন') : (language === 'en' ? '+ QC Entry / Report Defect' : '+ QC এন্ট্রি / সমস্যা জানান')}
        </button>
      </div>

      {/* Interactive Unified KPI Filter Cards (Replaces duplicate chips & loose spacing) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
          marginBottom: 10,
        }}
      >
        {/* Tab 1: All Inspected */}
        {!isVendorRole && (
          <button
            type="button"
            onClick={() => setQcFilter('all')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              textAlign: 'left',
              padding: '10px 14px',
              borderRadius: 10,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              border: qcFilter === 'all' ? '2px solid var(--accent, #2563eb)' : '1px solid var(--line)',
              background: qcFilter === 'all' ? 'var(--accent-soft, #e7edff)' : 'var(--surface, #ffffff)',
              boxShadow: qcFilter === 'all' ? '0 4px 12px rgba(37, 99, 235, 0.12)' : 'var(--shadow, none)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: qcFilter === 'all' ? 'var(--accent)' : 'var(--muted)' }}>
                {language === 'en' ? 'All Inspected' : 'মোট পরিদর্শন'}
              </span>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  display: 'grid',
                  placeItems: 'center',
                  background: qcFilter === 'all' ? 'var(--accent)' : 'var(--surface2)',
                  color: qcFilter === 'all' ? '#ffffff' : 'var(--muted)',
                }}
              >
                <Layers size={13} />
              </div>
            </div>
            <b style={{ fontFamily: 'var(--f-mono)', fontSize: '1.4rem', fontWeight: 700, margin: '4px 0 1px', color: 'var(--ink)' }}>
              {toBn(allQcItems.length)} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--muted)' }}>{language === 'en' ? 'rolls' : 'রোল'}</span>
            </b>
            <i style={{ fontStyle: 'normal', fontSize: '0.74rem', color: 'var(--muted)' }}>
              {language === 'en' ? 'Mutually passed: ' : 'উভয় পক্ষের পাস: '}<b>{toBn(passCount)}</b>
            </i>
          </button>
        )}

        {/* Tab 2: Your Sign Pending */}
        <button
          type="button"
          onClick={() => setQcFilter('mine')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            textAlign: 'left',
            padding: '10px 14px',
            borderRadius: 10,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            border: qcFilter === 'mine' ? '2px solid var(--accent, #2563eb)' : '1px solid var(--line)',
            background: qcFilter === 'mine' ? 'var(--accent-soft, #e7edff)' : 'var(--surface, #ffffff)',
            boxShadow: qcFilter === 'mine' ? '0 4px 12px rgba(37, 99, 235, 0.12)' : 'var(--shadow, none)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: qcFilter === 'mine' ? 'var(--accent)' : 'var(--muted)' }}>
              {language === 'en' ? 'Your Sign Pending' : 'আপনার সাইন বাকি'}
            </span>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                display: 'grid',
                placeItems: 'center',
                background: qcFilter === 'mine' ? 'var(--accent)' : 'var(--surface2)',
                color: qcFilter === 'mine' ? '#ffffff' : 'var(--muted)',
              }}
            >
              <Clock size={13} />
            </div>
          </div>
          <b style={{ fontFamily: 'var(--f-mono)', fontSize: '1.4rem', fontWeight: 700, margin: '4px 0 1px', color: myPend.length > 0 ? 'var(--accent)' : 'var(--ink)' }}>
            {toBn(myPend.length)}
          </b>
          <i style={{ fontStyle: 'normal', fontSize: '0.74rem', color: myPend.length > 0 ? 'var(--warn)' : 'var(--muted)', fontWeight: myPend.length > 0 ? 600 : 400 }}>
            {myPend.length > 0 ? (language === 'en' ? '● Action required' : '● মত দেওয়া বাকি') : (language === 'en' ? 'All cleared' : 'সব সাইন সম্পন্ন')}
          </i>
        </button>

        {/* Tab 3: Partner Sign Pending */}
        <button
          type="button"
          onClick={() => setQcFilter('theirs')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            textAlign: 'left',
            padding: '10px 14px',
            borderRadius: 10,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            border: qcFilter === 'theirs' ? '2px solid var(--accent, #2563eb)' : '1px solid var(--line)',
            background: qcFilter === 'theirs' ? 'var(--accent-soft, #e7edff)' : 'var(--surface, #ffffff)',
            boxShadow: qcFilter === 'theirs' ? '0 4px 12px rgba(37, 99, 235, 0.12)' : 'var(--shadow, none)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: qcFilter === 'theirs' ? 'var(--accent)' : 'var(--muted)' }}>
              {language === 'en' ? (mySide === 'fac' ? 'Vendor Pending' : 'Factory Pending') : `${mySide === 'fac' ? 'ভেন্ডরের' : 'ফ্যাক্টরির'} সাইন বাকি`}
            </span>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                display: 'grid',
                placeItems: 'center',
                background: qcFilter === 'theirs' ? 'var(--accent)' : 'var(--surface2)',
                color: qcFilter === 'theirs' ? '#ffffff' : 'var(--muted)',
              }}
            >
              <Users size={13} />
            </div>
          </div>
          <b style={{ fontFamily: 'var(--f-mono)', fontSize: '1.4rem', fontWeight: 700, margin: '4px 0 1px', color: 'var(--ink)' }}>
            {toBn(theirPend.length)}
          </b>
          <i style={{ fontStyle: 'normal', fontSize: '0.74rem', color: 'var(--muted)' }}>
            {language === 'en' ? 'Awaiting inspection' : 'অপর পক্ষের অপেক্ষায়'}
          </i>
        </button>

        {/* Tab 4: Dispute */}
        <button
          type="button"
          onClick={() => setQcFilter('disp')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            textAlign: 'left',
            padding: '10px 14px',
            borderRadius: 10,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            border: qcFilter === 'disp' ? '2px solid var(--bad, #dc2626)' : disp.length ? '1px solid var(--bad-soft, #fca5a5)' : '1px solid var(--line)',
            background: qcFilter === 'disp' ? 'var(--bad-soft, #fee2e2)' : 'var(--surface, #ffffff)',
            boxShadow: qcFilter === 'disp' ? '0 4px 12px rgba(220, 38, 38, 0.12)' : 'var(--shadow, none)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: qcFilter === 'disp' ? 'var(--bad)' : 'var(--muted)' }}>
              {language === 'en' ? 'Disputes' : 'দ্বিমত রেকর্ড'}
            </span>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                display: 'grid',
                placeItems: 'center',
                background: qcFilter === 'disp' ? 'var(--bad)' : 'var(--surface2)',
                color: qcFilter === 'disp' ? '#ffffff' : disp.length ? 'var(--bad)' : 'var(--muted)',
              }}
            >
              <AlertTriangle size={13} />
            </div>
          </div>
          <b style={{ fontFamily: 'var(--f-mono)', fontSize: '1.4rem', fontWeight: 700, margin: '4px 0 1px', color: disp.length ? 'var(--bad)' : 'var(--ink)' }}>
            {toBn(disp.length)}
          </b>
          <i style={{ fontStyle: 'normal', fontSize: '0.74rem', color: disp.length ? 'var(--bad)' : 'var(--muted)', fontWeight: disp.length ? 600 : 400 }}>
            {disp.length > 0 ? (language === 'en' ? '● Joint review needed' : '● যৌথ পরিদর্শন দরকার') : (language === 'en' ? 'No dispute' : 'কোনো দ্বিমত নেই')}
          </i>
        </button>

        {/* Tab 5: Both Agreed */}
        <button
          type="button"
          onClick={() => setQcFilter('agree')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            textAlign: 'left',
            padding: '10px 14px',
            borderRadius: 10,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            border: qcFilter === 'agree' ? '2px solid var(--ok, #16a34a)' : '1px solid var(--line)',
            background: qcFilter === 'agree' ? 'var(--ok-soft, #dcfce7)' : 'var(--surface, #ffffff)',
            boxShadow: qcFilter === 'agree' ? '0 4px 12px rgba(22, 163, 74, 0.12)' : 'var(--shadow, none)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: qcFilter === 'agree' ? 'var(--ok)' : 'var(--muted)' }}>
              {language === 'en' ? 'Both Agreed' : 'উভয় পক্ষ একমত'}
            </span>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                display: 'grid',
                placeItems: 'center',
                background: qcFilter === 'agree' ? 'var(--ok)' : 'var(--surface2)',
                color: qcFilter === 'agree' ? '#ffffff' : 'var(--muted)',
              }}
            >
              <CheckCircle2 size={13} />
            </div>
          </div>
          <b style={{ fontFamily: 'var(--f-mono)', fontSize: '1.4rem', fontWeight: 700, margin: '4px 0 1px', color: 'var(--ok)' }}>
            {toBn(agr.length)}
          </b>
          <i style={{ fontStyle: 'normal', fontSize: '0.74rem', color: 'var(--muted)' }}>
            {language === 'en' ? 'Mutually signed' : 'উভয়ের সাইন সম্পন্ন'}
          </i>
        </button>
      </div>

      {/* New QC Entry Expandable Form */}
      {qcFormOpen && (
        <form className="card" onSubmit={handleCreateQc} style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>{language === 'en' ? 'New QC Entry' : 'নতুন QC এন্ট্রি'}</h3>
          <div className="no-grid g3">
            {!isVendorRole && (
              <label className="no-f">
                <span>{language === 'en' ? 'Vendor' : 'ভেন্ডর'}</span>
                <SearchableSelect
                  value={activeVendorCode}
                  onChange={(val) => {
                    setNewVendor(val);
                    setNewOrderNo('');
                    setNewPlIndex(0);
                  }}
                  options={uniqueVendors.map((v) => ({
                    value: v.code,
                    label: v.name,
                  }))}
                  searchPlaceholder={language === 'en' ? 'Search vendor...' : 'ভেন্ডর খুঁজুন...'}
                />
              </label>
            )}

            <label className="no-f">
              <span>{language === 'en' ? 'Order No.' : 'অর্ডার নং'}</span>
              <SearchableSelect
                value={activeSelectedOrder ? ((activeSelectedOrder as any).id || (activeSelectedOrder as any).order_no) : ''}
                onChange={(val) => {
                  setNewOrderNo(val);
                  setNewPlIndex(0);
                }}
                options={ordersForSelectedVendor.map((o: any) => {
                  const id = o.id || o.order_no;
                  return {
                    value: id,
                    label: `${id}${o.buyer ? ` · ${o.buyer}` : ''}`,
                  };
                })}
                searchPlaceholder={language === 'en' ? 'Search order...' : 'অর্ডার খুঁজুন...'}
              />
            </label>

            <label className="no-f">
              <span>{language === 'en' ? 'Part (Placement)' : 'অংশ (Placement)'}</span>
              <SearchableSelect
                value={String(newPlIndex)}
                onChange={(val) => setNewPlIndex(Number(val))}
                options={activeLines.map((l: any, i: number) => ({
                  value: String(i),
                  label: `${l.place || 'Body'} · ${l.fab || l.fabric || 'Single Jersey'}`,
                }))}
                searchPlaceholder={language === 'en' ? 'Search part...' : 'অংশ খুঁজুন...'}
              />
            </label>

            <label className="no-f">
              <span>
                {language === 'en' ? 'Roll No.' : 'রোল নং'} <b className="req">*</b>
              </span>
              <input
                type="text"
                value={newRollNo}
                onChange={(e) => setNewRollNo(e.target.value)}
                placeholder={language === 'en' ? 'e.g. M-03/007' : 'যেমন: M-03/007'}
                required
              />
            </label>

            <label className="no-f">
              <span>{language === 'en' ? 'Machine' : 'মেশিন'}</span>
              <SearchableSelect
                value={newMachine}
                onChange={(val) => setNewMachine(val)}
                options={availableMachineOptions}
                searchPlaceholder={language === 'en' ? 'Search machine...' : 'মেশিন খুঁজুন...'}
              />
            </label>

            <label className="no-f">
              <span>{language === 'en' ? 'Weight (kg)' : 'ওজন (kg)'}</span>
              <input
                type="text"
                inputMode="decimal"
                value={newWeightKg}
                onChange={(e) => setNewWeightKg(e.target.value)}
                placeholder={language === 'en' ? 'e.g. 22' : 'যেমন: 22'}
              />
            </label>

            <label className="no-f">
              <span>{language === 'en' ? 'Fault / Issue' : 'ফল্ট / সমস্যা'}</span>
              <SearchableSelect
                value={newIssue}
                onChange={(val) => setNewIssue(val)}
                options={ISSUES.map((iss) => ({
                  value: iss.val,
                  label: iss.label,
                }))}
                searchPlaceholder={language === 'en' ? 'Search fault...' : 'ফল্ট খুঁজুন...'}
              />
            </label>

            <label className="no-f">
              <span>{language === 'en' ? 'Your Opinion' : 'আপনার মত'}</span>
              <select
                value={newVerdict}
                onChange={(e) => setNewVerdict(e.target.value as 'bad' | 'ok')}
              >
                <option value="bad">{language === 'en' ? '✗ Fabric Bad' : '✗ কাপড় খারাপ'}</option>
                <option value="ok">{language === 'en' ? '✓ Fabric OK' : '✓ কাপড় ঠিক আছে'}</option>
              </select>
            </label>

            <label className="no-f">
              <span>{language === 'en' ? 'Details / Remarks' : 'বিবরণ / মন্তব্য'}</span>
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder={language === 'en' ? 'e.g. 3 holes, at start of roll' : 'যেমন: ৩ জায়গায় হোল, রোলের শুরুতে'}
              />
            </label>
          </div>

          <label className="qs-ck" style={{ marginTop: 14 }}>
            <input
              type="checkbox"
              checked={newFormConfirmed}
              onChange={(e) => setNewFormConfirmed(e.target.checked)}
            />
            <span>
              আমি <b>{currentUser?.name || (mySide === 'fac' ? 'রুবেল মিয়া (ফ্যাক্টরি QC)' : 'ভেন্ডর QC')}</b> কাপড়টা নিজে দেখেছি, এটা আমার মতামত
            </span>
          </label>

          {formError && (
            <div className="no-msg" style={{ marginTop: 10, color: 'var(--bad)', display: 'block' }}>
              {formError}
            </div>
          )}

          <div className="row" style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn pri" type="submit" disabled={isSubmittingForm}>
              {isSubmittingForm ? (language === 'en' ? 'Submitting...' : 'জমা হচ্ছে...') : (language === 'en' ? 'Sign & Submit' : 'সাইন করে জমা দিন')}
            </button>
            <span className="small muted">
              জমা দিলেই {mySide === 'fac' ? 'ভেন্ডর' : 'ফ্যাক্টরি'} এটা দেখতে পাবে এবং তাদের মত দিতে বলা হবে।
            </span>
          </div>
        </form>
      )}

      {/* Active Filter & Live Search Toolbar (Zero wasted space) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 4,
          padding: '0 2px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', color: 'var(--muted)' }}>
          <span>
            {language === 'en' ? 'Showing records: ' : 'প্রদর্শিত রেকর্ড: '}
            <b style={{ color: 'var(--ink)' }}>{toBn(filteredList.length)}</b> {language === 'en' ? 'rolls' : 'টি'}
          </span>
          {qcFilter !== 'all' && (
            <span
              style={{
                fontSize: '0.74rem',
                padding: '1px 8px',
                borderRadius: 999,
                background: qcFilter === 'disp' ? 'var(--bad-soft)' : 'var(--accent-soft)',
                color: qcFilter === 'disp' ? 'var(--bad)' : 'var(--accent)',
                fontWeight: 600,
              }}
            >
              {qcFilter === 'mine'
                ? (language === 'en' ? 'Filter: My Sign Pending' : 'ফিল্টার: আমার সাইন বাকি')
                : qcFilter === 'theirs'
                ? (language === 'en' ? 'Filter: Partner Sign Pending' : 'ফিল্টার: অপর পক্ষের সাইন বাকি')
                : qcFilter === 'disp'
                ? (language === 'en' ? 'Filter: Disputed Rolls' : 'ফিল্টার: দ্বিমত রোল')
                : (language === 'en' ? 'Filter: Agreed Rolls' : 'ফিল্টার: একমত রোল')}
            </span>
          )}
        </div>

        {/* Live Search Input */}
        <div style={{ position: 'relative', width: 240, maxWidth: '100%' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'en' ? 'Search roll, order...' : 'রোল নং, অর্ডার খুঁজুন...'}
            style={{
              width: '100%',
              padding: '5px 10px 5px 30px',
              fontSize: '0.82rem',
              borderRadius: 6,
              border: '1px solid var(--line)',
              background: 'var(--surface)',
              color: 'var(--ink)',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                padding: 2,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Loading Spinner or QC Cards List */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 180 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'var(--surface, #ffffff)',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary, #0284c7)',
            }}
          >
            <Loader2 size={20} className="animate-spin" />
          </div>
        </div>
      ) : (
        <div className="qc-list" style={{ marginTop: 0 }}>
          {filteredList.length === 0 ? (
            <div className="card muted" style={{ padding: 24, textAlign: 'center' }}>
              {language === 'en' ? 'No QC records found in this list.' : 'এই তালিকায় কোনো QC রেকর্ড পাওয়া যায়নি।'}
            </div>
          ) : (
            filteredList.map(({ q, o }) => {
              const st = qcState(q, language);
              const line = (o.lines || [])[q.pl || 0];
              const partyName = o.party || o.party_name || o.party_code || 'ABC';

              return (
                <div className={`qc-c qc-${st.k}`} id={q.id} key={q.id}>
                  {/* Top: QC ID + Date & Status Pill */}
                  <div className="qc-top">
                    <span className="mono small muted">
                      {q.id} · {q.d}
                    </span>
                    <span className={`pill p-${st.s}`}>{st.t}</span>
                  </div>

                  {/* Issue title */}
                  <div className="qc-t">
                    <b>{q.issue}</b>
                  </div>

                  {/* Tag info items */}
                  <div
                    className="pe-info"
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px 14px',
                      fontSize: '.84rem',
                      color: 'var(--muted)',
                    }}
                  >
                    <span>
                      {!isVendorRole && <>{partyName} · </>}
                      <b className="mono">{o.id || o.order_no}</b>
                    </span>
                    <span>{line ? `${line.place || 'Body'} · ${line.fab || line.fabric || 'Single Jersey'}` : '—'}</span>
                    <span>
                      {language === 'en' ? 'Roll' : 'রোল'} <b className="mono">{q.roll}</b>
                    </span>
                    <span>{language === 'en' ? `Machine ${q.m}` : `মেশিন ${q.m}`}</span>
                    <span>{toBn(q.kg)} kg</span>
                    <span>
                      {language === 'en' ? 'Reported by: ' : 'জানিয়েছে: '}
                      {q.src === 'ven'
                        ? (language === 'en' ? 'Vendor QC' : 'ভেন্ডর QC')
                        : q.src === 'floor'
                        ? (language === 'en' ? 'Production Floor' : 'প্রোডাকশন ফ্লোর')
                        : (language === 'en' ? 'Factory QC' : 'ফ্যাক্টরি QC')}
                    </span>
                  </div>

                  {/* Dual Signature Section */}
                  <div className="qs-wrap">
                    {renderSideBox(q, o, 'fac')}
                    {renderSideBox(q, o, 'ven')}
                  </div>

                  {/* Dispute Note */}
                  {st.k === 'dispute' && (
                    <div className="qc-note">
                      {language === 'en'
                        ? 'Dispute: Both parties disagreed. A joint re-inspection where one side changes their opinion will resolve this. Meanwhile, this roll will remain on hold from delivery and billing.'
                        : 'দুই পক্ষের মত মেলেনি। দুই পক্ষের QC একসাথে রোলটা দেখে যেকোনো এক পক্ষ মত বদলালেই বিষয়টা মিটে যাবে। ততক্ষণ এই রোল ডেলিভারি ও বিলে আটকে থাকবে।'}
                    </div>
                  )}

                  {/* Factory Action Dropdown (When agreed bad) */}
                  {st.k === 'agree' && st.s === 'bad' && (
                    <>
                      {!isVendorRole ? (
                        <div className="qc-act" style={{ marginTop: 8 }}>
                          <label className="no-f">
                            <span>{language === 'en' ? 'What Next?' : 'এখন কী হবে?'}</span>
                            <select
                              value={q.act || ''}
                              onChange={(e) => handleActionChange(q.id, e.target.value)}
                            >
                              <option value="">{language === 'en' ? 'Select' : 'বাছুন'}</option>
                              {getQcAct(language).map((a) => (
                                <option key={a} value={a}>
                                  {a}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      ) : q.act ? (
                        <div className="qc-act small" style={{ marginTop: 6, color: 'var(--muted)' }}>
                          {language === 'en' ? 'Factory Decision:' : 'ফ্যাক্টরির সিদ্ধান্ত:'} <b>{q.act}</b>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default FactoryQcPage;
