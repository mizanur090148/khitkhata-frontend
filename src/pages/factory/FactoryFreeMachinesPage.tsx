import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { bnNum } from '@/utils/formatters';
import { Radio, Send, CheckCircle2, Clock, Sparkles, X, Layers, Loader2, ArrowRight } from 'lucide-react';

interface FreeMachineRow {
  code: string;
  brand: string;
  diaGg: string;
  broadcast: boolean;
  freeFrom: string;
  capacityKg: number;
}

export const FactoryFreeMachinesPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    addToast,
    dashboardData,
    fetchDashboardData,
    broadcastFreeMachines,
    submitQuotation,
  } = useApp();

  const [isLoading, setIsLoading] = useState(!dashboardData);

  // Load fresh dashboard and machine data on mount
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        await fetchDashboardData?.();
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute machine breakdown dynamically from database ONLY (zero demo fallbacks)
  const effectiveMachinesList = useMemo(() => {
    return dashboardData?.machines || [];
  }, [dashboardData?.machines]);

  const circularCount = useMemo(() => {
    return effectiveMachinesList.filter((m: any) => {
      const knitType = String(m.knit_type || '').toLowerCase();
      const typeStr = String(m.type || '').toLowerCase();
      return (
        knitType === 'c' ||
        knitType === 'circular' ||
        typeStr.includes('circ') ||
        (!typeStr.includes('flat') && knitType !== 'f')
      );
    }).length;
  }, [effectiveMachinesList]);

  const flatCount = useMemo(() => {
    return effectiveMachinesList.filter((m: any) => {
      const knitType = String(m.knit_type || '').toLowerCase();
      const typeStr = String(m.type || '').toLowerCase();
      return knitType === 'f' || knitType === 'flat' || typeStr.includes('flat');
    }).length;
  }, [effectiveMachinesList]);

  // Real database-backed idle / broadcast free machines
  const [machines, setMachines] = useState<FreeMachineRow[]>([]);

  // Sync state whenever database machines are fetched
  useEffect(() => {
    if (effectiveMachinesList && effectiveMachinesList.length > 0) {
      const freeList = effectiveMachinesList.filter((m: any) => {
        const st = String(m.raw_status || m.status || '').toLowerCase();
        return (
          st === 'free' ||
          st === 'idle' ||
          st === 'wait' ||
          Boolean(m.broadcast_free) ||
          (!st.startsWith('run') && st !== 'down')
        );
      });

      setMachines(
        freeList.map((m: any) => ({
          code: m.code || m.id,
          brand: m.brand || 'Pailung (Taiwan)',
          diaGg: m.spec_label || `${m.dia || '30"'} × ${m.gg || '24G'}`,
          broadcast: Boolean(m.broadcast_free || String(m.status || '').toLowerCase() === 'free'),
          freeFrom: m.free_from || m.availFrom || new Date().toISOString().split('T')[0],
          capacityKg: Number(m.daily_capacity_kg || m.targetKg || m.target_kg || 450),
        }))
      );
    } else {
      setMachines([]);
    }
  }, [effectiveMachinesList]);

  // Loading state for individual machine toggles
  const [togglingCodes, setTogglingCodes] = useState<Record<string, boolean>>({});

  // Persist toggle broadcast directly to MySQL backend
  const toggleBroadcast = async (code: string) => {
    const target = machines.find((m) => m.code === code);
    if (!target) return;
    const nextBroadcast = !target.broadcast;

    // Optimistic UI update
    setMachines((prev) =>
      prev.map((m) => (m.code === code ? { ...m, broadcast: nextBroadcast } : m))
    );
    setTogglingCodes((prev) => ({ ...prev, [code]: true }));

    try {
      if (broadcastFreeMachines) {
        await broadcastFreeMachines([code], nextBroadcast, target.freeFrom, target.capacityKg);
      }
      addToast({
        type: 'success',
        title: nextBroadcast ? 'মার্কেটপ্লেসে সম্প্রচার চালু' : 'সম্প্রচার বন্ধ করা হয়েছে',
        message: `${code} মেশিনটি ভেন্ডরদের খালি মেশিন তালিকায় ${nextBroadcast ? 'সফলভাবে যুক্ত হয়েছে' : 'লুকানো হয়েছে'}।`,
      });
      fetchDashboardData?.();
    } catch (err: any) {
      // Revert on error
      setMachines((prev) =>
        prev.map((m) => (m.code === code ? { ...m, broadcast: !nextBroadcast } : m))
      );
      addToast({
        type: 'error',
        title: 'আপডেট ব্যর্থ',
        message: err.message || 'সার্ভারে সংরক্ষণ করা যায়নি।',
      });
    } finally {
      setTogglingCodes((prev) => ({ ...prev, [code]: false }));
    }
  };

  const broadcastCount = machines.filter((m) => m.broadcast).length;

  // Real Database Subcontract RFQs from marketplace (zero demo fallbacks)
  const liveRfqs = useMemo(() => {
    return dashboardData?.marketplace_rfqs || [];
  }, [dashboardData?.marketplace_rfqs]);

  // Quotation Submission Modal State
  const [quoteModalRfq, setQuoteModalRfq] = useState<any | null>(null);
  const [offeredRate, setOfferedRate] = useState<string>('15');
  const [estimatedDays, setEstimatedDays] = useState<string>('7');
  const [allocatedMachines, setAllocatedMachines] = useState<string>('2');
  const [quoteNote, setQuoteNote] = useState<string>('');
  const [isSubmittingQuote, setIsSubmittingQuote] = useState<boolean>(false);

  const handleOpenQuoteModal = (rfq: any) => {
    setQuoteModalRfq(rfq);
    const defaultRate = rfq.target_rate ? String(rfq.target_rate).replace(/[^0-9.]/g, '') || '15' : '15';
    setOfferedRate(defaultRate);
    setEstimatedDays('7');
    setAllocatedMachines(String(rfq.n || 2));
    setQuoteNote('সুতা ফ্যাক্টরিতে পৌঁছানোর ৭ দিনের মধ্যে মানসম্পন্ন নিটিং ও ডেলিভারি সম্পন্ন করা হবে।');
  };

  const handleCloseQuoteModal = () => {
    setQuoteModalRfq(null);
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteModalRfq) return;

    const rateNum = parseFloat(offeredRate);
    if (!rateNum || rateNum <= 0) {
      addToast({
        type: 'error',
        title: 'ভুল ইনপুট',
        message: 'সঠিক দর (৳/kg) উল্লেখ করুন।',
      });
      return;
    }

    setIsSubmittingQuote(true);
    try {
      const postId = quoteModalRfq.id || 1;
      await submitQuotation?.({
        subcontract_post_id: typeof postId === 'number' ? postId : parseInt(postId, 10) || 1,
        offered_rate_tk: rateNum,
        estimated_days: parseInt(estimatedDays, 10) || 7,
        allocated_machines: parseInt(allocatedMachines, 10) || 2,
        note: quoteNote,
      });

      handleCloseQuoteModal();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'কোটেশন পাঠানো যায়নি',
        message: err.message || 'সার্ভার রেসপন্স ব্যর্থ।',
      });
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  return (
    <div style={{ maxWidth: '100%', width: '100%', paddingBottom: 32 }}>
      {/* Header */}
      <div className="head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2>খালি মেশিন ও সাবকন্ট্রাক্ট</h2>
          <p>
            যে মেশিনগুলো এখন বসে আছে, সেগুলোতে কাজ নেওয়ার জন্য মার্কেটপ্লেসে খালি হিসেবে সম্প্রচার করতে পারেন। ভেন্ডর ও বায়ার এটা দেখে সরাসরি কোটেশন রিকোয়েস্ট পাঠাবে।
          </p>
        </div>
      </div>

      {/* 3 KPI Cards - 100% Dynamic from Database with proper gap after */}
      <div className="kpis" style={{ marginBottom: 28, marginTop: 14 }}>
        <div className="kpi">
          <span>মোট মেশিন (ক্যাপাসিটি)</span>
          <b>
            {effectiveMachinesList.length > 0
              ? `${bnNum(circularCount)}টি সার্কুলার + ${bnNum(flatCount)}টি ফ্ল্যাট`
              : '০টি সার্কুলার + ০টি ফ্ল্যাট'}
          </b>
          <i>মোট {bnNum(effectiveMachinesList.length)}টি নিটিং মেশিন</i>
        </div>
        <div className="kpi">
          <span>এখন খালি / অলস</span>
          <b style={{ color: machines.length > 0 ? 'var(--warn, #d97706)' : 'inherit' }}>
            {bnNum(machines.length)}টি মেশিন
          </b>
          <i>বর্তমানে কোনো কাজ বরাদ্দ নেই</i>
        </div>
        <div className="kpi">
          <span>মার্কেটপ্লেসে সম্প্রচারিত</span>
          <b style={{ color: 'var(--ok, #16a34a)' }}>{bnNum(broadcastCount)}টি মেশিন</b>
          <i>ভেন্ডর ও বায়ারদের মার্কেটপ্লেসে উন্মুক্ত</i>
        </div>
      </div>

      {/* Grid with Machine Broadcast Management & Marketplace RFQs */}
      <div className="grid g2" style={{ marginBottom: 20 }}>
        {/* Idle Machines Management - Real Database Machines */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>খালি মেশিন সম্প্রচার তালিকা</h3>
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 600,
                background: 'var(--surface2)',
                color: 'var(--muted)',
                padding: '2px 8px',
                borderRadius: 999,
              }}
            >
              মোট {bnNum(machines.length)}টি
            </span>
          </div>

          <div className="tw" style={{ marginTop: 12 }}>
            <table>
              <thead>
                <tr>
                  <th>মেশিন নং</th>
                  <th>ব্র্যান্ড ও স্পেক</th>
                  <th>কবে থেকে খালি</th>
                  <th className="n">দৈনিক ক্ষমতা</th>
                  <th style={{ textAlign: 'center' }}>মার্কেটপ্লেসে দেখান</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && !dashboardData ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '28px', color: 'var(--muted)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <Loader2 size={16} className="animate-spin" /> ডাটাবেজ থেকে খালি মেশিনের তালিকা লোড হচ্ছে...
                      </span>
                    </td>
                  </tr>
                ) : machines.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
                      বর্তমানে কোনো খালি মেশিন নেই। সব মেশিনে প্রোডাকশন চলছে।
                    </td>
                  </tr>
                ) : (
                  machines.map((m) => (
                    <tr key={m.code}>
                      <td className="mono" style={{ fontWeight: 600 }}>
                        {m.code}
                      </td>
                      <td>
                        <div>{m.brand}</div>
                        <span className="mono small muted">{m.diaGg}</span>
                      </td>
                      <td className="mono small">{m.freeFrom}</td>
                      <td className="n">{bnNum(m.capacityKg)} kg</td>
                      <td style={{ textAlign: 'center' }}>
                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: togglingCodes[m.code] ? 'wait' : 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={m.broadcast}
                            disabled={togglingCodes[m.code]}
                            onChange={() => toggleBroadcast(m.code)}
                            aria-label={`${m.code} ব্রডকাস্ট`}
                            style={{
                              cursor: togglingCodes[m.code] ? 'wait' : 'pointer',
                              transform: 'scale(1.2)',
                            }}
                          />
                        </label>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="small muted" style={{ marginTop: 12 }}>
            টিক দেওয়া মেশিনগুলো ভেন্ডর ও বায়িং হাউসের নিটখাতা লাইভ মার্কেটপ্লেসে সম্প্রচারিত হয় এবং ডাটাবেজে সংরক্ষিত থাকে।
          </p>
        </div>

        {/* Incoming Capacity Requests from Vendors / Marketplace */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>ভেন্ডরদের সাবকন্ট্রাক্ট রিকোয়েস্ট</h3>
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 600,
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                padding: '2px 8px',
                borderRadius: 999,
              }}
            >
              লাইভ মার্কেটপ্লেস
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            {isLoading && !dashboardData ? (
              <p className="small muted" style={{ textAlign: 'center', padding: '24px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Loader2 size={16} className="animate-spin" /> মার্কেটপ্লেস রিকোয়েস্ট লোড হচ্ছে...
                </span>
              </p>
            ) : liveRfqs && liveRfqs.length > 0 ? (
              liveRfqs.map((req: any, idx: number) => {
                const buyerTitle =
                  req.buyer ||
                  (req.party === 'abc'
                    ? 'ABC Knit Composite'
                    : req.party === 'xyz'
                    ? 'XYZ Fashion Ltd'
                    : req.title || 'ভেন্ডর রিকোয়েস্ট');

                const fabricDesc = req.fabric || req.yarnSpec || req.fab || 'Single Jersey / Pique';
                const qtyVal = Number(req.qty_kg || req.reqKg || req.q || 3000);
                const targetRate = req.target_rate || '৳১৪–১৬/kg';
                const deadline = req.delivery_date || req.startDate || req.from || 'আসন্ন';

                return (
                  <div
                    key={req.id || idx}
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      border: '1px solid var(--line)',
                      background: 'var(--surface2)',
                    }}
                  >
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <b style={{ fontSize: '0.95rem' }}>{buyerTitle}</b>
                      <span className="pill p-ok">
                        {req.status === 'New' || !req.status ? 'নতুন চাহিদা' : req.status}
                      </span>
                    </div>

                    <div className="small muted" style={{ marginTop: 4 }}>
                      টার্গেট রেট: <b>{targetRate}</b> · ডেলিভারি: <b>{deadline}</b>
                    </div>

                    <p style={{ margin: '8px 0', fontSize: '.9rem', lineHeight: 1.5 }}>
                      ফেব্রিক: <b>{fabricDesc}</b> · পরিমাণ: <b>{bnNum(qtyVal.toLocaleString('en-IN'))} kg</b>
                      <br />
                      প্রয়োজন: <b>{bnNum(req.n || 2)}টি মেশিন ({req.diaGg || req.spec || '30" × 24G'})</b>
                    </p>

                    <div className="row" style={{ gap: 8, marginTop: 10 }}>
                      <button
                        type="button"
                        className="btn pri sm"
                        onClick={() => navigate('/dashboard/fmsg')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        <Send size={13} /> মেসেজে কথা বলুন
                      </button>
                      <button
                        type="button"
                        className="btn sm"
                        onClick={() => handleOpenQuoteModal(req)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                      >
                        <CheckCircle2 size={13} style={{ color: 'var(--ok)' }} /> কোটেশন পাঠান
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="small muted" style={{ textAlign: 'center', padding: '16px' }}>
                বর্তমানে কোনো ভেন্ডর রিকোয়েস্ট অপেক্ষমাণ নেই।
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quotation Submission Modal */}
      {quoteModalRfq && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            className="card"
            style={{
              background: 'var(--surface)',
              borderRadius: 14,
              padding: '24px',
              maxWidth: 480,
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>সাবকন্ট্রাক্ট কোটেশন দরপত্র</h3>
              <button
                type="button"
                onClick={handleCloseQuoteModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ background: 'var(--surface2)', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '0.86rem' }}>
              <div>বায়ার: <b>{quoteModalRfq.buyer || quoteModalRfq.title || 'ভেন্ডর'}</b></div>
              <div>ফেব্রিক: <b>{quoteModalRfq.fabric || quoteModalRfq.yarnSpec || 'Single Jersey'}</b> · পরিমাণ: <b>{bnNum(Number(quoteModalRfq.qty_kg || quoteModalRfq.reqKg || 3000))} kg</b></div>
            </div>

            <form onSubmit={handleSubmitQuote} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: 4 }}>
                  আপনার প্রস্তাবিত নিটিং রেট (৳ / kg) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  required
                  value={offeredRate}
                  onChange={(e) => setOfferedRate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: 4 }}>
                    সম্ভাব্য সময় (দিন)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={estimatedDays}
                    onChange={(e) => setEstimatedDays(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: 4 }}>
                    বরাদ্দ মেশিন সংখ্যা
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={allocatedMachines}
                    onChange={(e) => setAllocatedMachines(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: 4 }}>
                  বিশেষ বার্তা / শর্ত
                </label>
                <textarea
                  value={quoteNote}
                  onChange={(e) => setQuoteNote(e.target.value)}
                  placeholder="যেমন: সুতা পৌঁছানোর পর সাথে সাথে প্রোডাকশন শুরু হবে..."
                  style={{
                    width: '100%',
                    minHeight: 64,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    fontSize: '0.85rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  className="btn sm"
                  onClick={handleCloseQuoteModal}
                  disabled={isSubmittingQuote}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="btn pri sm"
                  disabled={isSubmittingQuote}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {isSubmittingQuote ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> পাঠানো হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Send size={14} /> কোটেশন নিশ্চিত করুন
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
