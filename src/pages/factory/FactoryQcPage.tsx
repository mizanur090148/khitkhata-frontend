import React, { useState, useMemo, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
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

export function qcState(q: QcItem) {
  const f = q.fac?.v;
  const v = q.ven?.v;
  if (f && v && f === v) {
    return f === 'ok'
      ? { k: 'agree', s: 'ok', t: 'উভয় পক্ষ একমত · কাপড় ঠিক আছে' }
      : { k: 'agree', s: 'bad', t: 'উভয় পক্ষ একমত · কাপড় খারাপ' + (q.act ? ' — ' + q.act : '') };
  }
  if (f && v) return { k: 'dispute', s: 'bad', t: 'দ্বিমত · যৌথ পরিদর্শন দরকার' };
  if (!f && !v) return { k: 'pend', s: 'warn', t: 'দুই পক্ষেরই মতামত বাকি' };
  return { k: 'pend', s: 'warn', t: f ? 'ভেন্ডর QC-র মতামত বাকি' : 'ফ্যাক্টরি QC-র মতামত বাকি' };
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
  } = useApp();

  const isVendorRole = (role as string) === 'vendor' || (role as string) === 'ven';
  const mySide: 'fac' | 'ven' = isVendorRole ? 'ven' : 'fac';

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [qcFilter, setQcFilter] = useState<'all' | 'mine' | 'theirs' | 'disp' | 'agree'>('all');
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
      setIsLoading(true);
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
  const disp = useMemo(() => allQcItems.filter(({ q }) => qcState(q).k === 'dispute'), [allQcItems]);
  const agr = useMemo(() => allQcItems.filter(({ q }) => qcState(q).k === 'agree'), [allQcItems]);
  const passCount = useMemo(() => agr.filter(({ q }) => q.fac?.v === 'ok' && q.ven?.v === 'ok').length, [agr]);

  // Filtered List
  const filteredList = useMemo(() => {
    switch (qcFilter) {
      case 'mine':
        return myPend;
      case 'theirs':
        return theirPend;
      case 'disp':
        return disp;
      case 'agree':
        return agr;
      default:
        return allQcItems;
    }
  }, [qcFilter, myPend, theirPend, disp, agr, allQcItems]);

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
    if (v === 'ok') return <span className="pill p-ok">কাপড় ঠিক আছে</span>;
    if (v === 'bad') return <span className="pill p-bad">কাপড় খারাপ</span>;
    return <span className="pill p-idle">মতামত বাকি</span>;
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
                ✓ ঠিক আছে
              </button>
              <button
                type="button"
                className="btn sm qbad"
                onClick={() => handleStartSign(q.id, 'bad', sideKey)}
              >
                ✗ খারাপ
              </button>
            </div>
            {s.v && <p className="small muted" style={{ margin: '4px 0 0' }}>আবার দেখে মত বদলাতে পারেন</p>}
          </>
        )}

        {/* Inline signature form */}
        {signing && (
          <div className="qs-form" style={{ marginTop: 8 }}>
            <div className="small">আপনার মত: {renderPill(qcSignTarget.v)}</div>
            <label className="no-f" style={{ marginTop: 6 }}>
              <span>মন্তব্য {qcSignTarget.v === 'bad' && <b className="req">*</b>}</span>
              <input
                type="text"
                value={signNote}
                onChange={(e) => setSignNote(e.target.value)}
                placeholder={qcSignTarget.v === 'bad' ? 'কী সমস্যা দেখলেন — যেমন: ৩ জায়গায় হোল' : 'ঐচ্ছিক মন্তব্য'}
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
                {submittingSign ? 'সংরক্ষণ হচ্ছে...' : 'সাইন করে জমা দিন'}
              </button>
              <button
                type="button"
                className="btn sm"
                onClick={() => setQcSignTarget(null)}
                disabled={submittingSign}
              >
                বাতিল
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
          আপনি <b>{currentUser?.name || 'ভেন্ডর QC'}</b> হিসেবে দেখছেন। রহমান নিটিং-এ আপনাদের কাপড়ের সব QC রেকর্ড এখানে। ফ্যাক্টরি যা লেখে আপনিও তা-ই দেখেন।
        </div>
      )}

      {/* Header */}
      <div className="head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>QC ও কাপড়ের সমস্যা</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)' }}>
            প্রতিটা রোলে ফ্যাক্টরি QC আর ভেন্ডর QC দুজনেই মত দেবেন ও সাইন করবেন। দুজন একমত হলে তবেই রেকর্ড চূড়ান্ত।
          </p>
        </div>
        <button
          className="btn pri"
          type="button"
          onClick={() => {
            setQcFormOpen(!qcFormOpen);
            setFormError('');
          }}
        >
          {qcFormOpen ? '✕ বন্ধ করুন' : '+ QC এন্ট্রি / সমস্যা জানান'}
        </button>
      </div>

      {/* KPIs exact from live database */}
      <div className="kpis" style={{ marginTop: 16 }}>
        {!isVendorRole && (
          <div className="kpi">
            <span>মোট পরিদর্শন</span>
            <b>{toBn(allQcItems.length)} রোল</b>
            <i>উভয় পক্ষের পাস {toBn(passCount)}</i>
          </div>
        )}
        <div className="kpi">
          <span>আপনার সাইন বাকি</span>
          <b>{toBn(myPend.length)}</b>
        </div>
        <div className="kpi">
          <span>{mySide === 'fac' ? 'ভেন্ডরের' : 'ফ্যাক্টরির'} সাইন বাকি</span>
          <b>{toBn(theirPend.length)}</b>
        </div>
        <div
          className="kpi"
          style={disp.length ? { borderColor: 'var(--bad)' } : undefined}
        >
          <span>দ্বিমত</span>
          <b style={disp.length ? { color: 'var(--bad)' } : undefined}>{toBn(disp.length)}</b>
        </div>
        <div className="kpi">
          <span>উভয় পক্ষ একমত</span>
          <b>{toBn(agr.length)}</b>
        </div>
      </div>

      {/* New QC Entry Expandable Form */}
      {qcFormOpen && (
        <form className="card" onSubmit={handleCreateQc} style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>নতুন QC এন্ট্রি</h3>
          <div className="no-grid g3">
            {!isVendorRole && (
              <label className="no-f">
                <span>ভেন্ডর</span>
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
                  searchPlaceholder="ভেন্ডর খুঁজুন..."
                />
              </label>
            )}

            <label className="no-f">
              <span>অর্ডার নং</span>
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
                searchPlaceholder="অর্ডার খুঁজুন..."
              />
            </label>

            <label className="no-f">
              <span>অংশ (Placement)</span>
              <SearchableSelect
                value={String(newPlIndex)}
                onChange={(val) => setNewPlIndex(Number(val))}
                options={activeLines.map((l: any, i: number) => ({
                  value: String(i),
                  label: `${l.place || 'Body'} · ${l.fab || l.fabric || 'Single Jersey'}`,
                }))}
                searchPlaceholder="অংশ খুঁজুন..."
              />
            </label>

            <label className="no-f">
              <span>
                রোল নং <b className="req">*</b>
              </span>
              <input
                type="text"
                value={newRollNo}
                onChange={(e) => setNewRollNo(e.target.value)}
                placeholder="যেমন: M-03/007"
                required
              />
            </label>

            <label className="no-f">
              <span>মেশিন</span>
              <SearchableSelect
                value={newMachine}
                onChange={(val) => setNewMachine(val)}
                options={availableMachineOptions}
                searchPlaceholder="মেশিন খুঁজুন..."
              />
            </label>

            <label className="no-f">
              <span>ওজন (kg)</span>
              <input
                type="text"
                inputMode="decimal"
                value={newWeightKg}
                onChange={(e) => setNewWeightKg(e.target.value)}
                placeholder="যেমন: 22"
              />
            </label>

            <label className="no-f">
              <span>ফল্ট / সমস্যা</span>
              <SearchableSelect
                value={newIssue}
                onChange={(val) => setNewIssue(val)}
                options={ISSUES.map((iss) => ({
                  value: iss.val,
                  label: iss.label,
                }))}
                searchPlaceholder="ফল্ট খুঁজুন..."
              />
            </label>

            <label className="no-f">
              <span>আপনার মত</span>
              <select
                value={newVerdict}
                onChange={(e) => setNewVerdict(e.target.value as 'bad' | 'ok')}
              >
                <option value="bad">✗ কাপড় খারাপ</option>
                <option value="ok">✓ কাপড় ঠিক আছে</option>
              </select>
            </label>

            <label className="no-f">
              <span>বিবরণ / মন্তব্য</span>
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="যেমন: ৩ জায়গায় হোল, রোলের শুরুতে"
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
              {isSubmittingForm ? 'জমা হচ্ছে...' : 'সাইন করে জমা দিন'}
            </button>
            <span className="small muted">
              জমা দিলেই {mySide === 'fac' ? 'ভেন্ডর' : 'ফ্যাক্টরি'} এটা দেখতে পাবে এবং তাদের মত দিতে বলা হবে।
            </span>
          </div>
        </form>
      )}

      {/* Filter Chips */}
      <div className="chips" style={{ margin: '16px 0 12px' }}>
        <button
          type="button"
          className={qcFilter === 'all' ? 'on' : ''}
          onClick={() => setQcFilter('all')}
        >
          সব ({toBn(allQcItems.length)})
        </button>
        <button
          type="button"
          className={qcFilter === 'mine' ? 'on' : ''}
          onClick={() => setQcFilter('mine')}
        >
          আমার সাইন বাকি ({toBn(myPend.length)})
        </button>
        <button
          type="button"
          className={qcFilter === 'theirs' ? 'on' : ''}
          onClick={() => setQcFilter('theirs')}
        >
          {mySide === 'fac' ? 'ভেন্ডরের সাইন বাকি' : 'ফ্যাক্টরির সাইন বাকি'} ({toBn(theirPend.length)})
        </button>
        <button
          type="button"
          className={qcFilter === 'disp' ? 'on' : ''}
          onClick={() => setQcFilter('disp')}
        >
          দ্বিমত ({toBn(disp.length)})
        </button>
        <button
          type="button"
          className={qcFilter === 'agree' ? 'on' : ''}
          onClick={() => setQcFilter('agree')}
        >
          একমত ({toBn(agr.length)})
        </button>
      </div>

      {/* Loading Spinner or QC Cards List */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 260 }}>
          <div
            style={{
              width: 44,
              height: 44,
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
            <Loader2 size={24} className="animate-spin" />
          </div>
        </div>
      ) : (
        <div className="qc-list">
          {filteredList.length === 0 ? (
            <div className="card muted" style={{ padding: 24, textAlign: 'center' }}>
              এই তালিকায় কোনো QC রেকর্ড পাওয়া যায়নি।
            </div>
          ) : (
            filteredList.map(({ q, o }) => {
              const st = qcState(q);
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
                      রোল <b className="mono">{q.roll}</b>
                    </span>
                    <span>মেশিন {q.m}</span>
                    <span>{toBn(q.kg)} kg</span>
                    <span>
                      জানিয়েছে:{' '}
                      {q.src === 'ven'
                        ? 'ভেন্ডর QC'
                        : q.src === 'floor'
                        ? 'প্রোডাকশন ফ্লোর'
                        : 'ফ্যাক্টরি QC'}
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
                      দুই পক্ষের মত মেলেনি। দুই পক্ষের QC একসাথে রোলটা দেখে যেকোনো এক পক্ষ মত বদলালেই বিষয়টা মিটে যাবে। ততক্ষণ এই রোল ডেলিভারি ও বিলে আটকে থাকবে।
                    </div>
                  )}

                  {/* Factory Action Dropdown (When agreed bad) */}
                  {st.k === 'agree' && st.s === 'bad' && (
                    <>
                      {!isVendorRole ? (
                        <div className="qc-act" style={{ marginTop: 8 }}>
                          <label className="no-f">
                            <span>এখন কী হবে?</span>
                            <select
                              value={q.act || ''}
                              onChange={(e) => handleActionChange(q.id, e.target.value)}
                            >
                              <option value="">বাছুন</option>
                              {QC_ACT.map((a) => (
                                <option key={a} value={a}>
                                  {a}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      ) : q.act ? (
                        <div className="qc-act small" style={{ marginTop: 6, color: 'var(--muted)' }}>
                          ফ্যাক্টরির সিদ্ধান্ত: <b>{q.act}</b>
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
