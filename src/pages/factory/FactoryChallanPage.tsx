import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Truck, Clock, CheckCircle2, AlertTriangle, Search, Eye } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { bnNum } from '@/utils/formatters';
import { SearchableSelect } from '@/components/common/SearchableSelect';

export const FactoryChallanPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    role,
    currentUser,
    factoryProfile,
    orders,
    parties,
    rolls,
    deliveryChallans,
    fetchChallans,
    fetchRolls,
    fetchOrders,
    createDeliveryChallan,
    signChallan,
    addToast,
    openPrintModal,
    t,
    language,
  } = useApp();

  const isVendor = role === 'vendor' || (role as string) === 'ven';

  // Loading state (instant if data already in memory)
  const [isLoading, setIsLoading] = useState<boolean>(deliveryChallans.length === 0);

  // Status and Search Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'transit' | 'received' | 'discrepancy'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // State
  const [chOpen, setChOpen] = useState<string | null>(null);
  const [chNew, setChNew] = useState<boolean>(false);
  const [chV, setChV] = useState<string>('');
  const [chO, setChO] = useState<string>('');
  const [chVeh, setChVeh] = useState<string>('');
  const [chDrv, setChDrv] = useState<string>('');
  const [chScan, setChScan] = useState<string>('');
  const [chSel, setChSel] = useState<Set<string>>(new Set());
  const [vendorGotCount, setVendorGotCount] = useState<string>('');

  // Initial load from live backend
  useEffect(() => {
    let mounted = true;
    if (deliveryChallans.length === 0) setIsLoading(true);
    Promise.all([fetchChallans(), fetchRolls(), fetchOrders()])
      .catch((err) => console.warn('Challan page data load error:', err))
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Format challan dates dynamically
  const getChallanDate = (c: any) => {
    if (c?.d && c.d !== '03 Oct') return c.d;
    if (c?.created_at) {
      try {
        const dt = new Date(c.created_at);
        if (!isNaN(dt.getTime())) {
          return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        }
      } catch {}
    }
    return c?.d || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const getChallanFullDate = (c: any) => {
    const dStr = getChallanDate(c);
    let year = new Date().getFullYear();
    if (c?.created_at) {
      try {
        const dt = new Date(c.created_at);
        if (!isNaN(dt.getTime())) year = dt.getFullYear();
      } catch {}
    }
    return `${dStr} ${year}`;
  };

  // Vendor party helper
  const vName = (code: string) => {
    if (!code) return '—';
    const p = parties.find(
      (x) => x.code === code || String(x.id) === String(code) || x.name === code
    );
    if (p) return p.name;
    const ord = orders.find(
      (o) => (o as any).party_code === code || (o as any).v === code || o.party === code
    );
    return ord?.party || code;
  };

  // Vendor codes dynamically from parties and active orders (no hardcoded fallbacks)
  const vendorCodes = useMemo(() => {
    const fromParties = parties
      .filter((p) => p.type === 'ven' || p.type === 'vendor' || (p as any).category === 'vendor')
      .map((p) => p.code || String(p.id));

    const activeOrders = orders.filter((o) => (o.status as string) !== 'done' && o.status !== 'Completed');
    const fromOrders = activeOrders
      .map((o) => (o as any).party_code || (o as any).v || o.party)
      .filter(Boolean);

    const merged = Array.from(new Set([...fromParties, ...fromOrders]));
    return merged;
  }, [parties, orders]);

  // Set default vendor
  useEffect(() => {
    if (!chV && vendorCodes.length) {
      setChV(vendorCodes[0]);
    }
  }, [vendorCodes, chV]);

  // Open orders for selected vendor
  const vendorOrders = useMemo(() => {
    return orders.filter((o) => {
      const isNotDone = (o.status as string) !== 'done' && o.status !== 'Completed';
      if (!isNotDone) return false;
      if (!chV) return true;
      return (
        (o as any).party_code === chV ||
        (o as any).v === chV ||
        o.party === chV ||
        (o as any).party_name === chV ||
        vName(chV) === o.party
      );
    });
  }, [orders, chV, parties]);

  useEffect(() => {
    if (vendorOrders.length && (!chO || !vendorOrders.some((o) => o.id === chO))) {
      setChO(vendorOrders[0].id);
      setChSel(new Set());
    } else if (!vendorOrders.length) {
      setChO('');
      setChSel(new Set());
    }
  }, [vendorOrders, chO]);

  // Available rolls for selected order (not already in a challan)
  const availableRolls = useMemo(() => {
    if (!chO) return [];
    return rolls.filter((r) => {
      const orderNo = (r as any).no ? (r as any).o : (r.orderId || (r as any).order_no);
      const isChallan = (r as any).ch || (r as any).challan_no;
      return (orderNo === chO || (r as any).o === chO) && !isChallan;
    });
  }, [rolls, chO]);

  // Disputed rolls check
  const isDisputedRoll = (rollNo: string) => {
    return orders.some((o) => {
      const qcList = (o as any).qc || [];
      return qcList.some(
        (q: any) =>
          (q.roll === rollNo || q.roll_no === rollNo) &&
          q.fac?.v &&
          q.ven?.v &&
          q.fac.v !== q.ven.v
      );
    });
  };

  // Calculate sum weight of selected rolls dynamically
  const selectedKg = useMemo(() => {
    return availableRolls
      .filter((r) => chSel.has((r as any).no || r.rollId || (r as any).roll_no))
      .reduce((sum, r) => sum + (Number(r.kg) || Number((r as any).weight_kg) || 0), 0);
  }, [availableRolls, chSel]);

  // Filter challans for vendor vs factory
  const listChallans = useMemo(() => {
    if (isVendor) {
      const myPartyCode = (currentUser as any)?.party_code || (currentUser as any)?.party || 'abc';
      const myOrgName = currentUser?.organization_name;
      return deliveryChallans.filter((c) => {
        if (c.v === myPartyCode || c.party_code === myPartyCode) return true;
        if (myOrgName && (c.party === myOrgName || vName(c.v || c.party_code) === myOrgName)) return true;
        if (currentUser?.name && c.ven?.by?.includes(currentUser.name)) return true;
        return c.v === 'abc' || c.party_code === 'abc' || (c.party && c.party.includes('ABC'));
      });
    }
    return deliveryChallans;
  }, [deliveryChallans, isVendor, currentUser, parties]);

  // Status helper with status key for filtering
  const chState = (c: any) => {
    if (!c.ven) {
      return {
        s: 'warn',
        k: 'transit' as const,
        t: language === 'en' ? 'In Transit · Pending Sign' : 'পথে · ভেন্ডরের সাইন বাকি',
      };
    }
    const rollsCount = Array.isArray(c.rolls) ? c.rolls.length : 0;
    const got = c.ven.got !== undefined ? c.ven.got : rollsCount;
    if (got < rollsCount) {
      return {
        s: 'bad',
        k: 'discrepancy' as const,
        t: language === 'en' ? `Discrepancy · ${rollsCount - got} roll(s) short` : `গরমিল · ${rollsCount - got}টা রোল কম`,
      };
    }
    return {
      s: 'ok',
      k: 'received' as const,
      t: language === 'en' ? 'Received by Vendor' : 'ভেন্ডর বুঝে পেয়েছে',
    };
  };

  // Total kg of a challan dynamically calculated
  const challanKg = (c: any) => {
    const rollNos = Array.isArray(c.rolls) ? c.rolls : [];
    if (!rollNos.length) return 0;
    const matched = rolls.filter((r) =>
      rollNos.includes((r as any).no || r.rollId || (r as any).roll_no)
    );
    if (matched.length) {
      return matched.reduce((a, r) => a + (Number(r.kg) || Number((r as any).weight_kg) || 0), 0);
    }
    if (c.kg || c.weight_kg || c.total_kg) {
      return Number(c.kg || c.weight_kg || c.total_kg) || 0;
    }
    return 0;
  };

  // Counts by status for interactive KPIs
  const transitChallans = useMemo(
    () => listChallans.filter((c) => chState(c).k === 'transit'),
    [listChallans, language]
  );
  const receivedChallans = useMemo(
    () => listChallans.filter((c) => chState(c).k === 'received'),
    [listChallans, language]
  );
  const discrepancyChallans = useMemo(
    () => listChallans.filter((c) => chState(c).k === 'discrepancy'),
    [listChallans, language]
  );
  const totalDispatchedKg = useMemo(
    () => listChallans.reduce((sum, c) => sum + challanKg(c), 0),
    [listChallans, rolls]
  );

  // Filtered and searched challans
  const filteredChallans = useMemo(() => {
    let list = listChallans;

    // Filter by status tab
    if (statusFilter === 'transit') {
      list = transitChallans;
    } else if (statusFilter === 'received') {
      list = receivedChallans;
    } else if (statusFilter === 'discrepancy') {
      list = discrepancyChallans;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((c) => {
        const no = String(c.no || c.challan_no || '').toLowerCase();
        const orderNo = String(c.o || c.order_no || '').toLowerCase();
        const vendor = vName(c.v || c.party_code).toLowerCase();
        const partyCode = String(c.v || c.party_code || '').toLowerCase();
        const vehicle = String(c.veh || c.vehicle_no || '').toLowerCase();
        const driver = String(c.drv || c.driver_name || '').toLowerCase();
        const date = String(getChallanDate(c)).toLowerCase();

        return (
          no.includes(q) ||
          orderNo.includes(q) ||
          vendor.includes(q) ||
          partyCode.includes(q) ||
          vehicle.includes(q) ||
          driver.includes(q) ||
          date.includes(q)
        );
      });
    }

    return list;
  }, [listChallans, statusFilter, transitChallans, receivedChallans, discrepancyChallans, searchQuery, parties, orders]);

  // Scan roll barcode handler
  const handleScanRoll = () => {
    let v = chScan.trim().toUpperCase();
    const mm = v.match(/^([MF])\s*-?\s*0*(\d{1,2})\s*[\/ -]?\s*0*(\d{1,3})$/);
    if (mm) {
      v = `${mm[1]}-${mm[2].padStart(2, '0')}/${mm[3].padStart(3, '0')}`;
    }
    const r = availableRolls.find((x) => ((x as any).no || x.rollId || (x as any).roll_no) === v);
    if (!r) {
      addToast({ type: 'error', message: `${v || 'রোল'} এই অর্ডারে পাঠানোর তালিকায় নেই` });
      return;
    }
    if (isDisputedRoll(v)) {
      addToast({ type: 'error', message: `${v}-এ QC দ্বিমত, পাঠানো যাবে না` });
      return;
    }
    setChSel((prev) => new Set([...prev, v]));
    setChScan('');
    addToast({ type: 'success', message: `${v} যোগ হয়েছে` });
  };

  // Submit new challan
  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chSel.size) {
      addToast({ type: 'error', message: 'অন্তত একটা রোল বাছুন' });
      return;
    }
    if (!chVeh.trim()) {
      addToast({ type: 'error', message: 'গাড়ির নম্বর লিখুন' });
      return;
    }

    try {
      const res = await createDeliveryChallan({
        party_code: chV,
        order_no: chO,
        rolls: Array.from(chSel),
        vehicle_no: chVeh.trim(),
        driver_name: chDrv.trim() || '—',
        signed_by: currentUser?.name || 'ফ্যাক্টরি ইনচার্জ',
      });
      setChNew(false);
      setChSel(new Set());
      setChVeh('');
      setChDrv('');
      if (res?.challan_no || res?.no) {
        setChOpen(res.challan_no || res.no);
      }
    } catch {
      // Handled in context
    }
  };

  // Vendor sign challan receipt
  const handleVendorSign = async (challanNo: string, maxRolls: number) => {
    const got = parseInt(vendorGotCount.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d))), 10);
    const validGot = isNaN(got) ? maxRolls : Math.min(maxRolls, got);

    try {
      const signerName = currentUser?.name
        ? `${currentUser.name} (ভেন্ডর)`
        : 'ভেন্ডর প্রতিনিধি';
      await signChallan(challanNo, validGot, signerName);
      setVendorGotCount('');
    } catch {
      // Handled in context
    }
  };

  // Currently open challan detail view
  const currentChallan = useMemo(() => {
    if (!chOpen) return null;
    return deliveryChallans.find((c) => c.no === chOpen || c.challan_no === chOpen);
  }, [chOpen, deliveryChallans]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 280 }}>
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
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      {isVendor && (
        <div className="vbanner">
          {language === 'en' ? 'Delivery challans from the factory arrive here. Count rolls upon unloading and provide digital signature.' : 'ফ্যাক্টরি যে কাপড় পাঠায়, তার চালান এখানে আসে। মাল নামানোর সময় গুনে সাইন দিন।'}
        </div>
      )}

      {/* ================= VIEW 1: SINGLE CHALLAN DETAIL (A4 PAD STYLE) ================= */}
      {currentChallan ? (
        (() => {
          const c = currentChallan;
          const st = chState(c);
          const rollNos = Array.isArray(c.rolls) ? c.rolls : [];
          const matchedRolls = rolls.filter((r) =>
            rollNos.includes((r as any).no || r.rollId || (r as any).roll_no)
          );
          const totalKg = matchedRolls.length
            ? matchedRolls.reduce((a, r) => a + (Number(r.kg) || Number((r as any).weight_kg) || 0), 0)
            : challanKg(c);
          const order = orders.find((o) => o.id === (c.o || c.order_no));

          return (
            <>
              <div className="head">
                <div>
                  <button className="btn sm" id="chBack" onClick={() => setChOpen(null)}>
                    ← {language === 'en' ? 'All Challans' : 'সব চালান'}
                  </button>
                  <h2 style={{ marginTop: 8 }}>{t('ডেলিভারি চালান')} {c.no || c.challan_no}</h2>
                  <p>
                    {vName(c.v || c.party_code)} · {c.o || c.order_no} · {getChallanDate(c)}
                  </p>
                </div>
                <div className="row">
                  <span className={`pill p-${st.s}`} style={{ fontSize: '.9rem' }}>
                    {st.t}
                  </span>
                  <button
                    className="btn no-pdf prn-btn"
                    type="button"
                    onClick={() =>
                      openPrintModal(
                        'challan',
                        `ডেলিভারি চালান ${c.no || c.challan_no}`,
                        {
                          no: c.no || c.challan_no,
                          date: getChallanDate(c),
                          party: vName(c.v || c.party_code),
                          orderId: c.o || c.order_no,
                          vehicle: c.veh || c.vehicle_no || '—',
                          driver: c.drv || c.driver_name || '—',
                          driverPhone: c.ph || c.driver_phone || '—',
                          gatePass: c.no || c.challan_no,
                          status: st.t,
                          fabric: order?.fabric || (order as any)?.fab || 'Single Jersey',
                          dia: order?.dia || '—',
                          rolls: rollNos.length,
                          grossKg: totalKg > 0 ? totalKg.toFixed(1) : '—',
                          netKg: totalKg > 0 ? totalKg.toFixed(1) : '—',
                          challan: c,
                          rollItems: matchedRolls.length
                            ? matchedRolls
                            : rollNos.map((rNo: string) => {
                                const foundRoll = rolls.find(
                                  (r) => ((r as any).no || r.rollId || (r as any).roll_no) === rNo
                                );
                                return {
                                  no: rNo,
                                  machine: foundRoll?.machine || (foundRoll as any)?.m || rNo.split('/')[0] || '—',
                                  lot: foundRoll?.lot || (foundRoll as any)?.yarn_lot || '—',
                                  kg: Number(foundRoll?.kg) || Number((foundRoll as any)?.weight_kg) || 0,
                                };
                              }),
                          order,
                        }
                      )
                    }
                  >
                    {language === 'en' ? 'Print' : 'প্রিন্ট'}
                  </button>
                  <button
                    className="btn no-pdf"
                    type="button"
                    onClick={() => {
                      addToast({ type: 'info', message: language === 'en' ? 'Preparing PDF...' : 'PDF প্রস্তুত করা হচ্ছে...' });
                      window.print();
                    }}
                  >
                    {language === 'en' ? 'Save PDF' : 'PDF সেভ'}
                  </button>
                </div>
              </div>

              {/* The Delivery Challan Pad */}
              <div className="dc">
                <div className="dc-h">
                  <div>
                    <b>{factoryProfile?.name || (language === 'en' ? 'Factory' : 'ফ্যাক্টরি')}</b>
                    <span>{factoryProfile?.address || factoryProfile?.area || (language === 'en' ? 'Konabari, Gazipur' : 'কোনাবাড়ি, গাজীপুর')}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <em>{t('ডেলিভারি চালান')}</em>
                    <b className="mono">{c.no || c.challan_no}</b>
                    <span>{getChallanFullDate(c)}</span>
                  </div>
                </div>

                <div className="jc-g">
                  <div>
                    <span>{language === 'en' ? 'Recipient' : 'প্রাপক'}</span>
                    <b>{vName(c.v || c.party_code)}</b>
                  </div>
                  <div>
                    <span>{language === 'en' ? 'Order / Buyer' : 'অর্ডার / বায়ার'}</span>
                    <b>
                      {c.o || c.order_no} · {order?.buyer || '—'}
                    </b>
                  </div>
                  <div>
                    <span>{language === 'en' ? 'Vehicle' : 'গাড়ি'}</span>
                    <b>{c.veh || c.vehicle_no || '—'}</b>
                  </div>
                  <div>
                    <span>{language === 'en' ? 'Driver' : 'ড্রাইভার'}</span>
                    <b>
                      {c.drv || c.driver_name || '—'} · {c.ph || c.driver_phone || '—'}
                    </b>
                  </div>
                </div>

                <div className="tw">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{language === 'en' ? 'Roll' : 'রোল'}</th>
                        <th>{language === 'en' ? 'Part' : 'অংশ'}</th>
                        <th>{language === 'en' ? 'Machine' : 'মেশিন'}</th>
                        <th>{language === 'en' ? 'Yarn Lot' : 'সুতা লট'}</th>
                        <th className="n">{language === 'en' ? 'Faults' : 'ফল্ট'}</th>
                        <th className="n">kg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchedRolls.length ? (
                        matchedRolls.map((r, i) => {
                          const rNo = (r as any).no || r.rollId || (r as any).roll_no;
                          const rM = r.machine || (r as any).m || (r as any).machine_code || '—';
                          const rLot = r.lot || (r as any).yarn_lot || '—';
                          const rKg = Number(r.kg) || Number((r as any).weight_kg) || 0;
                          const faults = (r as any).f || (r as any).faults_json || {};
                          const faultCount = Object.values(faults).reduce((a: any, b: any) => a + (Number(b) || 0), 0);
                          const lines = (order as any)?.lines || [];
                          const line = lines[r.lineIdx || (r as any).pl || (r as any).placement_index || 0];

                          return (
                            <tr key={rNo}>
                              <td>{i + 1}</td>
                              <td className="mono">{rNo}</td>
                              <td>{line?.place || line?.placement || 'Body'}</td>
                              <td className="mono">{rM}</td>
                              <td className="mono small">{rLot}</td>
                              <td className="n">{faultCount ? String(faultCount) : '—'}</td>
                              <td className="n">{rKg ? rKg.toFixed(1) : '—'}</td>
                            </tr>
                          );
                        })
                      ) : (
                        rollNos.map((rNo: string, i: number) => {
                          const foundRoll = rolls.find(
                            (r) => ((r as any).no || r.rollId || (r as any).roll_no) === rNo
                          );
                          const rM = foundRoll?.machine || (foundRoll as any)?.m || (foundRoll as any)?.machine_code || rNo.split('/')[0] || '—';
                          const rLot = foundRoll?.lot || (foundRoll as any)?.yarn_lot || (order as any)?.lines?.[0]?.yarns?.[0]?.lot || '—';
                          const rKg = Number(foundRoll?.kg) || Number((foundRoll as any)?.weight_kg) || 0;
                          const lines = (order as any)?.lines || [];
                          const line = lines[foundRoll?.lineIdx || (foundRoll as any)?.pl || (foundRoll as any)?.placement_index || 0];

                          return (
                            <tr key={rNo}>
                              <td>{i + 1}</td>
                              <td className="mono">{rNo}</td>
                              <td>{line?.place || line?.placement || 'Body'}</td>
                              <td className="mono">{rM}</td>
                              <td className="mono small">{rLot}</td>
                              <td className="n">—</td>
                              <td className="n">{rKg ? rKg.toFixed(1) : '—'}</td>
                            </tr>
                          );
                        })
                      )}
                      <tr>
                        <td colSpan={6}>
                          <b>{language === 'en' ? `Total ${bnNum(rollNos.length, language)} Rolls` : `মোট ${bnNum(rollNos.length, language)} রোল`}</b>
                        </td>
                        <td className="n">
                          <b>{totalKg > 0 ? bnNum(totalKg.toFixed(1), language) : '—'}</b>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="dc-sig">
                  <div className="dc-s ok">
                    <span>{language === 'en' ? 'Dispatched · Factory' : 'পাঠিয়েছে · ফ্যাক্টরি'}</span>
                    <b>✍ {c.fac?.by || (language === 'en' ? 'Factory Incharge' : 'ফ্যাক্টরি ইনচার্জ')}</b>
                    <small>{c.fac?.at || getChallanDate(c)}</small>
                  </div>
                  <div
                    className={`dc-s ${
                      c.ven ? (c.ven.got < rollNos.length ? 'bad' : 'ok') : ''
                    }`}
                  >
                    <span>{language === 'en' ? 'Received · Vendor' : 'বুঝে নিয়েছে · ভেন্ডর'}</span>
                    {c.ven ? (
                      <>
                        <b>✍ {c.ven.by || (language === 'en' ? 'Vendor Representative' : 'ভেন্ডর প্রতিনিধি')}</b>
                        <small>
                          {c.ven.at} · {language === 'en' ? `Received ${bnNum(c.ven.got, language)} / ${bnNum(rollNos.length, language)} rolls` : `পেয়েছে ${bnNum(c.ven.got, language)} / ${bnNum(rollNos.length, language)} রোল`}
                        </small>
                      </>
                    ) : isVendor ? (
                      <>
                        <label className="no-f" style={{ marginTop: 4 }}>
                          <span style={{ fontSize: '.78rem' }}>{language === 'en' ? 'Rolls Received' : 'কয়টা রোল পেলেন'}</span>
                          <input
                            id="chGot"
                            inputMode="numeric"
                            value={vendorGotCount || String(rollNos.length)}
                            onChange={(e) => setVendorGotCount(e.target.value)}
                            style={{ padding: '4px 8px', width: 90 }}
                          />
                        </label>
                        <button
                          className="btn pri sm"
                          id="chRecv"
                          style={{ marginTop: 6 }}
                          onClick={() => handleVendorSign(c.no || c.challan_no, rollNos.length)}
                        >
                          {language === 'en' ? 'Count verified, sign receipt' : 'গুনে বুঝে পেয়েছি, সাইন দিন'}
                        </button>
                      </>
                    ) : (
                      <>
                        <b className="muted">{language === 'en' ? 'Signature pending' : 'এখনো সাইন দেয়নি'}</b>
                        <small>{language === 'en' ? 'Vendor will sign via app during delivery' : 'মাল নামানোর সময় ভেন্ডর অ্যাপ থেকে সাইন দেবে'}</small>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          );
        })()
      ) : (
        /* ================= VIEW 2: CHALLAN LIST & NEW CHALLAN FORM ================= */
        <>
          <div className="head" style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 style={{ margin: 0 }}>{t('ডেলিভারি চালান')}</h2>
              <p style={{ margin: '3px 0 0', color: 'var(--muted)', fontSize: '0.84rem' }}>
                {isVendor
                  ? (language === 'en'
                      ? 'Delivery challans from the factory arrive here. Count rolls upon unloading and provide digital signature.'
                      : 'ফ্যাক্টরি যে কাপড় পাঠায়, তার চালান এখানে আসে। মাল নামানোর সময় গুনে সাইন দিন।')
                  : (language === 'en'
                      ? 'Create challans by selecting rolls or scanning. Challan closes upon vendor signature.'
                      : 'রোল বেছে বা স্ক্যান করে চালান বানান। ভেন্ডর মাল বুঝে পেয়ে সাইন দিলে চালান বন্ধ হয়।')}
              </p>
            </div>
            {!isVendor && (
              <button
                className="btn pri"
                id="chNewB"
                onClick={() => {
                  setChNew(!chNew);
                  setChSel(new Set());
                }}
                style={{ whiteSpace: 'nowrap' }}
              >
                {chNew ? (language === 'en' ? '✕ Close Form' : '✕ বন্ধ করুন') : (language === 'en' ? '+ New Delivery Challan' : '+ নতুন ডেলিভারি চালান')}
              </button>
            )}
          </div>

          {/* Interactive Status KPI Filter Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 10,
              margin: '10px 0 12px',
            }}
          >
            {/* Card 1: All Challans */}
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                textAlign: 'left',
                padding: '10px 14px',
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: statusFilter === 'all' ? '2px solid var(--accent, #2563eb)' : '1px solid var(--line)',
                background: statusFilter === 'all' ? 'var(--accent-soft, #e7edff)' : 'var(--surface, #ffffff)',
                boxShadow: statusFilter === 'all' ? '0 4px 12px rgba(37, 99, 235, 0.12)' : 'var(--shadow, none)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: statusFilter === 'all' ? 'var(--accent)' : 'var(--muted)' }}>
                  {language === 'en' ? 'All Challans' : 'সকল চালান'}
                </span>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    display: 'grid',
                    placeItems: 'center',
                    background: statusFilter === 'all' ? 'var(--accent)' : 'var(--surface2)',
                    color: statusFilter === 'all' ? '#ffffff' : 'var(--muted)',
                  }}
                >
                  <Truck size={14} />
                </div>
              </div>
              <b style={{ fontFamily: 'var(--f-mono)', fontSize: '1.4rem', fontWeight: 700, margin: '4px 0 1px', color: 'var(--ink)' }}>
                {bnNum(listChallans.length, language)} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--muted)' }}>{language === 'en' ? 'challans' : 'টি'}</span>
              </b>
              <i style={{ fontStyle: 'normal', fontSize: '0.74rem', color: 'var(--muted)' }}>
                {language === 'en' ? 'Dispatched: ' : 'মোট: '}<b>{bnNum(totalDispatchedKg.toFixed(1), language)} kg</b>
              </i>
            </button>

            {/* Card 2: In Transit / Pending Sign */}
            <button
              type="button"
              onClick={() => setStatusFilter('transit')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                textAlign: 'left',
                padding: '10px 14px',
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: statusFilter === 'transit' ? '2px solid var(--warn, #d97706)' : '1px solid var(--line)',
                background: statusFilter === 'transit' ? 'var(--warn-soft, #fef3c7)' : 'var(--surface, #ffffff)',
                boxShadow: statusFilter === 'transit' ? '0 4px 12px rgba(217, 119, 6, 0.15)' : 'var(--shadow, none)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: statusFilter === 'transit' ? 'var(--warn)' : 'var(--muted)' }}>
                  {language === 'en' ? 'In Transit' : 'পথে · সাইন বাকি'}
                </span>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    display: 'grid',
                    placeItems: 'center',
                    background: statusFilter === 'transit' ? 'var(--warn)' : 'var(--surface2)',
                    color: statusFilter === 'transit' ? '#ffffff' : 'var(--muted)',
                  }}
                >
                  <Clock size={14} />
                </div>
              </div>
              <b style={{ fontFamily: 'var(--f-mono)', fontSize: '1.4rem', fontWeight: 700, margin: '4px 0 1px', color: transitChallans.length ? 'var(--warn)' : 'var(--ink)' }}>
                {bnNum(transitChallans.length, language)}
              </b>
              <i style={{ fontStyle: 'normal', fontSize: '0.74rem', color: transitChallans.length ? 'var(--warn)' : 'var(--muted)', fontWeight: transitChallans.length ? 600 : 400 }}>
                {transitChallans.length > 0 ? (language === 'en' ? '● Awaiting vendor sign' : '● ভেন্ডরের সাইন বাকি') : (language === 'en' ? 'All received' : 'সব সাইন সম্পন্ন')}
              </i>
            </button>

            {/* Card 3: Received by Vendor */}
            <button
              type="button"
              onClick={() => setStatusFilter('received')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                textAlign: 'left',
                padding: '10px 14px',
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: statusFilter === 'received' ? '2px solid var(--ok, #16a34a)' : '1px solid var(--line)',
                background: statusFilter === 'received' ? 'var(--ok-soft, #dcfce7)' : 'var(--surface, #ffffff)',
                boxShadow: statusFilter === 'received' ? '0 4px 12px rgba(220, 163, 74, 0.12)' : 'var(--shadow, none)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: statusFilter === 'received' ? 'var(--ok)' : 'var(--muted)' }}>
                  {language === 'en' ? 'Received by Vendor' : 'ভেন্ডর বুঝে পেয়েছে'}
                </span>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    display: 'grid',
                    placeItems: 'center',
                    background: statusFilter === 'received' ? 'var(--ok)' : 'var(--surface2)',
                    color: statusFilter === 'received' ? '#ffffff' : 'var(--muted)',
                  }}
                >
                  <CheckCircle2 size={14} />
                </div>
              </div>
              <b style={{ fontFamily: 'var(--f-mono)', fontSize: '1.4rem', fontWeight: 700, margin: '4px 0 1px', color: 'var(--ok)' }}>
                {bnNum(receivedChallans.length, language)}
              </b>
              <i style={{ fontStyle: 'normal', fontSize: '0.74rem', color: 'var(--muted)' }}>
                {language === 'en' ? 'Delivery confirmed' : 'ডেলিভারি নিশ্চিত'}
              </i>
            </button>

            {/* Card 4: Discrepancy / Shortage */}
            <button
              type="button"
              onClick={() => setStatusFilter('discrepancy')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                textAlign: 'left',
                padding: '10px 14px',
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: statusFilter === 'discrepancy' ? '2px solid var(--bad, #dc2626)' : discrepancyChallans.length ? '1px solid var(--bad-soft, #fca5a5)' : '1px solid var(--line)',
                background: statusFilter === 'discrepancy' ? 'var(--bad-soft, #fee2e2)' : 'var(--surface, #ffffff)',
                boxShadow: statusFilter === 'discrepancy' ? '0 4px 12px rgba(220, 38, 38, 0.12)' : 'var(--shadow, none)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: statusFilter === 'discrepancy' ? 'var(--bad)' : 'var(--muted)' }}>
                  {language === 'en' ? 'Discrepancies' : 'গরমিল রেকর্ড'}
                </span>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    display: 'grid',
                    placeItems: 'center',
                    background: statusFilter === 'discrepancy' ? 'var(--bad)' : 'var(--surface2)',
                    color: statusFilter === 'discrepancy' ? '#ffffff' : discrepancyChallans.length ? 'var(--bad)' : 'var(--muted)',
                  }}
                >
                  <AlertTriangle size={14} />
                </div>
              </div>
              <b style={{ fontFamily: 'var(--f-mono)', fontSize: '1.4rem', fontWeight: 700, margin: '4px 0 1px', color: discrepancyChallans.length ? 'var(--bad)' : 'var(--ink)' }}>
                {bnNum(discrepancyChallans.length, language)}
              </b>
              <i style={{ fontStyle: 'normal', fontSize: '0.74rem', color: discrepancyChallans.length ? 'var(--bad)' : 'var(--muted)', fontWeight: discrepancyChallans.length ? 600 : 400 }}>
                {discrepancyChallans.length > 0 ? (language === 'en' ? '● Roll count mismatch' : '● রোল সংখ্যা কম এসেছে') : (language === 'en' ? 'No discrepancy' : 'কোনো গরমিল নেই')}
              </i>
            </button>
          </div>

          {/* New Challan Creation Form */}
          {chNew && !isVendor && (
            <form className="card" id="chf" onSubmit={handleCreateChallan} noValidate>
              <h3>{language === 'en' ? 'New Challan' : 'নতুন চালান'}</h3>
              <div className="no-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
                <label className="no-f">
                  <span>{t('ভেন্ডর')}</span>
                  <SearchableSelect
                    id="chV"
                    value={chV}
                    onChange={(val) => {
                      setChV(val);
                      setChSel(new Set());
                    }}
                    options={
                      vendorCodes.length
                        ? vendorCodes.map((k) => ({
                            value: k,
                            label: vName(k),
                          }))
                        : [{ value: '', label: language === 'en' ? 'No vendors found' : 'কোনো ভেন্ডর পাওয়া যায়নি' }]
                    }
                    searchPlaceholder={language === 'en' ? 'Search vendor...' : 'ভেন্ডর খুঁজুন...'}
                  />
                </label>

                <label className="no-f">
                  <span>{t('অর্ডার')}</span>
                  <SearchableSelect
                    id="chO"
                    value={chO}
                    onChange={(val) => {
                      setChO(val);
                      setChSel(new Set());
                    }}
                    options={
                      vendorOrders.length
                        ? vendorOrders.map((o) => ({
                            value: o.id,
                            label: `${o.id} · ${o.fabric || o.buyer || t('অর্ডার')}`,
                          }))
                        : [{ value: '', label: language === 'en' ? 'No open orders' : 'কোনো খোলা অর্ডার নেই' }]
                    }
                    searchPlaceholder={language === 'en' ? 'Search order...' : 'অর্ডার খুঁজুন...'}
                  />
                </label>

                <label className="no-f">
                  <span>{language === 'en' ? 'Vehicle No' : 'গাড়ির নম্বর'}</span>
                  <input
                    id="chVeh"
                    placeholder={language === 'en' ? 'Dhaka Metro N 14-2256' : 'ঢাকা মেট্রো ন ১৪-২২৫৬'}
                    value={chVeh}
                    onChange={(e) => setChVeh(e.target.value)}
                  />
                </label>

                <label className="no-f">
                  <span>{language === 'en' ? 'Driver Name' : 'ড্রাইভারের নাম'}</span>
                  <input
                    id="chDrv"
                    placeholder={language === 'en' ? 'Name & Phone' : 'নাম ও ফোন নম্বর'}
                    value={chDrv}
                    onChange={(e) => setChDrv(e.target.value)}
                  />
                </label>
              </div>

              {/* Barcode scanner / roll manual entry input */}
              <div className="row" style={{ margin: '14px 0', gap: 8 }}>
                <label className="no-f" style={{ flex: 1, minWidth: 200 }}>
                  <span>{language === 'en' ? 'Scan Roll QR or Enter Roll Number' : 'রোল স্ক্যান করুন বা নম্বর লিখুন'}</span>
                  <input
                    id="chScan"
                    placeholder={language === 'en' ? 'e.g. M-03/007' : 'যেমন: M-03/007'}
                    autoComplete="off"
                    value={chScan}
                    onChange={(e) => setChScan(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleScanRoll();
                      }
                    }}
                  />
                </label>
                <button
                  className="btn"
                  type="button"
                  id="chScanB"
                  style={{ alignSelf: 'end' }}
                  onClick={handleScanRoll}
                >
                  {language === 'en' ? 'Add' : 'যোগ করুন'}
                </button>
              </div>

              {/* Checkbox list of available rolls */}
              <div className="ch-rolls">
                {availableRolls.length ? (
                  availableRolls.map((r) => {
                    const rNo = (r as any).no || r.rollId || (r as any).roll_no;
                    const rKg = Number(r.kg) || Number((r as any).weight_kg) || 0;
                    const rM = r.machine || (r as any).m || (r as any).machine_code || '—';
                    const faults = (r as any).f || (r as any).faults_json || {};
                    const faultCount = Object.values(faults).reduce((a: any, b: any) => a + (Number(b) || 0), 0);
                    const dis = isDisputedRoll(rNo);

                    return (
                      <label key={rNo} className={`ch-r ${dis ? 'dis' : ''}`}>
                        <input
                          type="checkbox"
                          value={rNo}
                          checked={chSel.has(rNo)}
                          disabled={dis}
                          onChange={(e) => {
                            const next = new Set(chSel);
                            if (e.target.checked) next.add(rNo);
                            else next.delete(rNo);
                            setChSel(next);
                          }}
                        />
                        <span className="mono">{rNo}</span>
                        <small>
                          {rM} · {rKg ? `${rKg.toFixed(1)} kg` : ''}
                          {faultCount ? (language === 'en' ? ` · Faults ${faultCount}` : ` · ফল্ট ${faultCount}`) : ''}
                          {dis ? (language === 'en' ? ' · QC Dispute, cannot dispatch' : ' · QC দ্বিমত, পাঠানো যাবে না') : ''}
                        </small>
                      </label>
                    );
                  })
                ) : (
                  <p className="small muted">{language === 'en' ? 'No rolls ready to dispatch for this order.' : 'এই অর্ডারে পাঠানোর মতো কোনো রোল রেডি নেই।'}</p>
                )}
              </div>

              <div className="row" style={{ margin: '14px 0 0', justifyContent: 'space-between' }}>
                <span className="small" id="chSum" style={{ fontWeight: 600 }}>
                  {chSel.size} {language === 'en' ? 'rolls' : 'রোল'} · {selectedKg.toFixed(1)} kg
                </span>
                <button className="btn pri" type="submit">
                  {language === 'en' ? 'Create Challan & Sign' : 'চালান তৈরি করে সাইন দিন'}
                </button>
              </div>
            </form>
          )}

          {/* Live Search and Status Filter Toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
              margin: '0 0 10px',
              padding: '0 2px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', color: 'var(--muted)', flexWrap: 'wrap' }}>
              <span>
                {language === 'en' ? 'Showing challans: ' : 'প্রদর্শিত চালান: '}
                <b style={{ color: 'var(--ink)' }}>{bnNum(filteredChallans.length, language)}</b> {language === 'en' ? '' : 'টি'}
              </span>
              {statusFilter !== 'all' && (
                <span
                  style={{
                    fontSize: '0.74rem',
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: statusFilter === 'discrepancy' ? 'var(--bad-soft)' : statusFilter === 'transit' ? 'var(--warn-soft)' : 'var(--ok-soft)',
                    color: statusFilter === 'discrepancy' ? 'var(--bad)' : statusFilter === 'transit' ? 'var(--warn)' : 'var(--ok)',
                    fontWeight: 600,
                  }}
                >
                  {statusFilter === 'transit'
                    ? (language === 'en' ? 'Filter: In Transit' : 'ফিল্টার: পথে · সাইন বাকি')
                    : statusFilter === 'received'
                    ? (language === 'en' ? 'Filter: Received' : 'ফিল্টার: ভেন্ডর বুঝে পেয়েছে')
                    : (language === 'en' ? 'Filter: Discrepancy' : 'ফিল্টার: গরমিল')}
                </span>
              )}
              {(searchQuery || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  {language === 'en' ? 'Reset filters' : 'ফিল্টার রিসেট'}
                </button>
              )}
            </div>

            {/* Live Search Input */}
            <div style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'en' ? 'Search challan, order, vendor...' : 'চালান নং, অর্ডার, ভেন্ডর খুঁজুন...'}
                style={{
                  width: '100%',
                  padding: '6px 28px 6px 30px',
                  fontSize: '0.82rem',
                  borderRadius: 8,
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
                    right: 8,
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

          {/* Challans Table */}
          <div className="tw" style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--line)' }}>
            <table>
              <thead>
                <tr>
                  <th>{language === 'en' ? 'Challan' : 'চালান'}</th>
                  <th>{language === 'en' ? 'Date' : 'তারিখ'}</th>
                  {!isVendor && <th>{language === 'en' ? 'Vendor' : 'ভেন্ডর'}</th>}
                  <th>{language === 'en' ? 'Order' : 'অর্ডার'}</th>
                  <th className="n">{language === 'en' ? 'Rolls' : 'রোল'}</th>
                  <th className="n">kg</th>
                  <th>{language === 'en' ? 'Vehicle' : 'গাড়ি'}</th>
                  <th>{language === 'en' ? 'Status' : 'অবস্থা'}</th>
                  <th style={{ textAlign: 'center' }}>{language === 'en' ? 'Action' : 'অ্যাকশন'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredChallans.length ? (
                  filteredChallans.map((c) => {
                    const no = c.no || c.challan_no;
                    const st = chState(c);
                    const rollsCount = Array.isArray(c.rolls) ? c.rolls.length : 0;
                    const kg = challanKg(c);

                    return (
                      <tr
                        key={no}
                        className="click"
                        data-ch={no}
                        onClick={() => {
                          setChOpen(no);
                          window.scrollTo(0, 0);
                        }}
                      >
                        <td className="mono">
                          <b style={{ color: 'var(--accent)' }}>{no}</b>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{getChallanDate(c)}</td>
                        {!isVendor && <td><b>{vName(c.v || c.party_code)}</b></td>}
                        <td className="mono">{c.o || c.order_no}</td>
                        <td className="n"><b>{bnNum(rollsCount, language)}</b></td>
                        <td className="n">{kg > 0 ? bnNum(kg.toFixed(1), language) : '—'}</td>
                        <td className="small">{c.veh || c.vehicle_no || '—'}</td>
                        <td>
                          <span className={`pill p-${st.s}`}>{st.t}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn sm"
                            style={{
                              padding: '3px 8px',
                              fontSize: '0.78rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setChOpen(no);
                              window.scrollTo(0, 0);
                            }}
                          >
                            <Eye size={12} /> {language === 'en' ? 'View' : 'দেখুন'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={isVendor ? 8 : 9} className="muted" style={{ textAlign: 'center', padding: '36px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <Truck size={32} style={{ opacity: 0.3 }} />
                        <span style={{ fontSize: '0.9rem' }}>
                          {searchQuery || statusFilter !== 'all'
                            ? (language === 'en' ? 'No delivery challans match your search or filter.' : 'আপনার সার্চ বা ফিল্টারের সাথে কোনো চালান মেলেনি।')
                            : (language === 'en' ? 'No delivery challans created yet.' : 'এখনো কোনো ডেলিভারি চালান তৈরি হয়নি।')}
                        </span>
                        {(searchQuery || statusFilter !== 'all') && (
                          <button
                            type="button"
                            className="btn sm"
                            onClick={() => {
                              setSearchQuery('');
                              setStatusFilter('all');
                            }}
                            style={{ marginTop: 4 }}
                          >
                            {language === 'en' ? 'Clear search & filters' : 'ফিল্টার রিসেট করুন'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default FactoryChallanPage;
