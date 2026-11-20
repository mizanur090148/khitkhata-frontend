import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import {
  ChevronRight,
  Radio,
  Sparkles,
  Send,
  Plus,
  RotateCcw,
  AlertTriangle,
  X,
  Phone,
} from 'lucide-react';
import { bnNum, fmtKg, fmtTk, pct } from '@/utils/formatters';
import { VendorOrdersPage } from '../vendor/VendorOrdersPage';
import { SearchableSelect } from '@/components/common/SearchableSelect';

export const FactoryDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    role,
    orders,
    machines,
    dashboardData,
    fetchDashboardData,
    isDashboardSyncing,
    setSelectedOrderId,
    quickProductionEntry,
    broadcastFreeMachines,
    submitQuotation,
    openCallModal,
    addToast,
    toggleMachineStatus,
  } = useApp();

  const isVendor = role === 'vendor' || (role as string) === 'ven';
  if (isVendor) {
    return <VendorOrdersPage />;
  }

  // 6. Dashboard Interactive Tasks & Modals
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [qeMachine, setQeMachine] = useState('M-01');
  const [qeShift, setQeShift] = useState('A');
  const [qeOperator, setQeOperator] = useState('মোঃ সোহেল রানা');
  const [qeOrderNo, setQeOrderNo] = useState('SC-2610-014');
  const [qeKg, setQeKg] = useState('180');
  const [qeRolls, setQeRolls] = useState('7');
  const [qeRejectKg, setQeRejectKg] = useState('1.5');
  const [qeRpm, setQeRpm] = useState('28');
  const [qeNotes, setQeNotes] = useState('');

  const [selectedMachineForAction, setSelectedMachineForAction] = useState<any>(null);

  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [selectedBroadcastMachines, setSelectedBroadcastMachines] = useState<string[]>(['M-01', 'M-02', 'M-05', 'M-06']);
  const [broadcastCapacity, setBroadcastCapacity] = useState('190');
  const [broadcastDate, setBroadcastDate] = useState('2026-10-05');
  const [broadcastNote, setBroadcastNote] = useState('সিঙ্গেল জার্সি ও রিব মেশিনের দ্রুত বুকিং স্লট ওপেন।');

  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [selectedRfq, setSelectedRfq] = useState<any>(null);
  const [rfqProposedRate, setRfqProposedRate] = useState('15.5');
  const [rfqCommitment, setRfqCommitment] = useState('২টি মেশিন বরাদ্দ');
  const [rfqNote, setRfqNote] = useState('আমাদের মায়ার অ্যান্ড সি সিঙ্গেল জার্সি মেশিনে সর্বোচ্চ কোয়ালিটি গ্যারান্টি দেওয়া হবে।');

  const go = (path: string, id?: string) => {
    if (id) {
      setSelectedOrderId(id);
      navigate(`/dashboard/${path}/${id}`);
    } else {
      navigate(`/dashboard/${path}`);
    }
    window.scrollTo(0, 0);
  };

  return (
    <>
      
            <>
              {/* Header section matching KnitKhata.html */}
              <div className="head">
                <div>
                  <h2>আজকের অবস্থা</h2>
                  <p>{dashboardData?.date_label || new Date().toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · শিফট A চলছে · লাইভ সিঙ্ক: MySQL ({dashboardData?.sync_time ? new Date(dashboardData.sync_time).toLocaleTimeString('bn-BD') : 'সক্রিয়'})</p>
                </div>
                <div className="row" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button className="btn" onClick={() => setIsQuickEntryOpen(true)}>+ প্রোডাকশন এন্ট্রি</button>
                  <button className="btn pri" onClick={() => go('orders')}>অর্ডার দেখুন</button>
                </div>
              </div>

              {/* Exact KPI cards connected to live database */}
              <div className="kpis">
                <div className="kpi" style={{ borderLeft: '4px solid var(--ok)', cursor: 'pointer' }} onClick={() => setIsQuickEntryOpen(true)}>
                  <span>আজকের মোট উৎপাদন</span>
                  <b>
                    {dashboardData?.kpis ? bnNum(Math.round(dashboardData.kpis.today_production_kg)) : '০'} <span style={{ fontSize: '0.85rem' }}>kg</span>
                  </b>
                  <i>{bnNum(dashboardData?.kpis?.today_production_machines_count || 0)}টি মেশিনের শিফট এন্ট্রি</i>
                </div>

                <div className="kpi" style={{ borderLeft: '4px solid var(--accent)', cursor: 'pointer' }} onClick={() => go('orders')}>
                  <span>সক্রিয় রানিং অর্ডার</span>
                  <b>
                    {dashboardData?.kpis ? bnNum(dashboardData.kpis.running_orders_count) : orders.filter((o) => o.status === 'Running').length} <span style={{ fontSize: '0.85rem' }}>টি PO</span>
                  </b>
                  <i>মোট অর্ডার: {dashboardData?.kpis ? bnNum(dashboardData.kpis.running_orders_total_kg) : '০'} kg</i>
                </div>

                <div className="kpi" style={{ borderLeft: '4px solid var(--yarn)', cursor: 'pointer' }} onClick={() => setIsBroadcastModalOpen(true)}>
                  <span>ফ্রি মেশিন (বুকিং ওপেন)</span>
                  <b>
                    {dashboardData?.kpis ? bnNum(dashboardData.kpis.free_machines_count) : '০'} <span style={{ fontSize: '0.85rem' }}>টি</span>
                  </b>
                  <i style={{ color: 'var(--accent)', fontWeight: 600 }}>📡 ব্রডকাস্ট করুন</i>
                </div>

                <div className="kpi" style={{ borderLeft: '4px solid var(--warn)', cursor: 'pointer' }} onClick={() => go('bill')}>
                  <span>বকেয়া বিল আদায়যোগ্য</span>
                  <b>৳ {dashboardData?.kpis ? (Math.round(dashboardData.kpis.receivable_bills_amount)).toLocaleString('en-IN') : '০'}</b>
                  <i>{bnNum(dashboardData?.kpis?.receivable_parties_count || 1)}টি পার্টির চালান বিল বাকি</i>
                </div>

                <div className="kpi" style={{ borderLeft: '4px solid var(--l4)', cursor: 'pointer' }} onClick={() => go('ledger')}>
                  <span>আজকের খরচ</span>
                  <b>৳ {dashboardData?.kpis ? (Math.round(dashboardData.kpis.today_expense_amount)).toLocaleString('en-IN') : '০'}</b>
                  <i>{bnNum(dashboardData?.kpis?.today_expense_count || 0)}টি ভাউচার এন্ট্রি</i>
                </div>
              </div>

              {/* 2-Column Grid for Machine Board & Alerts */}
              <div className="grid g2">
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ margin: 0 }}>মেশিন বোর্ড ({bnNum(dashboardData?.machines?.length || machines.length || 24)}টি মেশিন)</h3>
                    <button className="btn sm" onClick={() => setIsBroadcastModalOpen(true)}>ফ্রি মেশিন ব্রডকাস্ট</button>
                  </div>
                  <div className="machines">
                    {(dashboardData?.machines?.length ? dashboardData.machines : machines).map((mc: any) => {
                      const id = mc.code || mc.id;
                      const st = mc.status === 'Running' || mc.status === 'run' ? 'run'
                        : mc.status === 'Free' || mc.status === 'wait' ? 'wait'
                        : mc.status === 'Maint' || mc.status === 'down' ? 'down'
                        : 'idle';
                      const orderRef = mc.running_order || mc.current_order_no || mc.orderId || mc.order_no;
                      const label = st === 'run'
                        ? (orderRef ? String(orderRef).slice(-3) : 'চলছে')
                        : st === 'wait' ? 'রিজার্ভ'
                        : st === 'down' ? 'ব্রেকডাউন'
                        : 'খালি';

                      return (
                        <div
                          key={id}
                          className={`mc ${st}`}
                          title={`${id}: ${mc.status} - ${label} (ক্লিক করে স্ট্যাটাস পরিবর্তন করুন)`}
                          style={{ cursor: 'pointer', transition: 'transform 0.1s' }}
                          onClick={() => setSelectedMachineForAction(mc)}
                        >
                          <b>{id}</b>
                          {label}
                        </div>
                      );
                    })}
                  </div>
                  <div className="legend">
                    <span style={{ '--c': 'var(--accent)' } as any}>অর্ডারে চলছে</span>
                    <span style={{ '--c': 'var(--yarn)' } as any}>পরের অর্ডারের জন্য রিজার্ভ</span>
                    <span style={{ '--c': 'var(--bad)' } as any}>ব্রেকডাউন</span>
                    <span style={{ '--c': 'var(--idle)' } as any}>খালি / প্রস্তুত</span>
                  </div>
                </div>

                <div className="card">
                  <h3 style={{ margin: 0, marginBottom: 12 }}>নজর দেওয়া দরকার ({bnNum(dashboardData?.alerts?.length || 0)}টি বার্তা)</h3>
                  {(dashboardData?.alerts && dashboardData.alerts.length > 0 ? dashboardData.alerts : []).map((alt: any) => (
                    <div key={alt.id} className="alert" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <i className="dot" style={{ background: alt.type === 'bad' ? 'var(--bad)' : alt.type === 'yarn' ? 'var(--yarn)' : alt.type === 'warn' ? 'var(--warn)' : 'var(--accent)' }}></i>
                        <div>
                          <b>{alt.title}</b> — {alt.message}
                        </div>
                      </div>
                      {alt.action_view && (
                        <button
                          type="button"
                          className="btn sm"
                          onClick={() => go(alt.action_view)}
                          style={{ whiteSpace: 'nowrap', marginLeft: 12, fontSize: '0.78rem' }}
                        >
                          {alt.action_label || 'দেখুন'}
                        </button>
                      )}
                    </div>
                  ))}
                  {(!dashboardData?.alerts || dashboardData.alerts.length === 0) && (
                    <div style={{ padding: 16, textAlign: 'center', color: 'var(--muted)', fontSize: '0.9rem' }}>
                      সবকিছু স্বাভাবিক আছে, বর্তমানে কোনো জরুরি সতর্কতা নেই।
                    </div>
                  )}
                </div>
              </div>

              {/* Subcontract Opportunities from Buyers (Best of shilposetu-old) */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: 0 }}>বায়ার সাব-কন্ট্রাক্ট কাজের সুযোগ (মার্কেটপ্লেস RFQ)</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--muted)' }}>
                      সরাসরি বায়ার ও গার্মেন্টস থেকে আসা নিটিং অর্ডার — ফ্যাক্টরি রেটে কোটেশন দিন
                    </p>
                  </div>
                  <button className="btn sm" onClick={() => go('subcontract')}>
                    সব মার্কেটপ্লেস পোস্ট দেখুন
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                  {(dashboardData?.marketplace_rfqs && dashboardData.marketplace_rfqs.length > 0 ? dashboardData.marketplace_rfqs : []).map((rfq: any) => (
                    <div
                      key={rfq.id}
                      style={{
                        border: '1px solid var(--line)',
                        borderRadius: 10,
                        padding: 14,
                        background: 'var(--surface)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span className="pill p-acc">{rfq.buyer}</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{rfq.location}</span>
                        </div>
                        <h4 style={{ margin: '0 0 6px', fontSize: '0.95rem', fontWeight: 600 }}>{rfq.title}</h4>
                        <div style={{ fontSize: '0.82rem', color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div><strong>ফেব্রিক:</strong> {rfq.fabric}</div>
                          <div><strong>পরিমাণ:</strong> <span className="mono">{rfq.qty_kg > 0 ? bnNum(rfq.qty_kg) : '০'} kg</span></div>
                          <div><strong>টার্গেট রেট:</strong> {rfq.target_rate}</div>
                          <div><strong>ডেলিভারি:</strong> {rfq.delivery_date}</div>
                        </div>
                      </div>
                      <button
                        className="btn pri sm"
                        onClick={() => {
                          setSelectedRfq(rfq);
                          setIsRfqModalOpen(true);
                        }}
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        দরপত্র / কোটেশন জমা দিন
                      </button>
                    </div>
                  ))}
                  {(!dashboardData?.marketplace_rfqs || dashboardData.marketplace_rfqs.length === 0) && (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontSize: '0.9rem', gridColumn: '1 / -1' }}>
                      বর্তমানে কোনো নতুন মার্কেটপ্লেস RFQ পোস্ট নেই।
                    </div>
                  )}
                </div>
              </div>

              {/* Floor Machine Live Monitor Card */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <h3 style={{ margin: 0 }}>ফ্লোর মেশিন লাইভ মনিটর ({bnNum(Math.min(8, (dashboardData?.machines?.length || machines.length || 8)))}টি মেশিন)</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--muted)' }}>প্রতি মেশিনের অবস্থা, বর্তমান অর্ডার, ফ্যাব্রিক ও অপারেটর</p>
                  </div>
                  <button onClick={() => setIsBroadcastModalOpen(true)} className="btn sm">
                    ফ্রি মেশিন ব্রডকাস্ট দেখুন
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
                  {(dashboardData?.machines?.slice(0, 8) || machines.slice(0, 8)).map((m: any) => {
                    const isRun = m.status === 'Running';
                    const isFree = m.status === 'Free';
                    const isIdle = m.status === 'Idle';
                    const isMaint = m.status === 'Maint';

                    return (
                      <div
                        key={m.id || m.code}
                        style={{
                          border: '1px solid var(--line)',
                          borderRadius: 10,
                          padding: 12,
                          background: isRun ? 'var(--surface)' : isFree ? 'var(--yarn-soft)' : 'var(--surface2)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                          cursor: 'pointer',
                        }}
                        onClick={() => setSelectedMachineForAction(m)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)', fontFamily: 'var(--f-mono)' }}>{m.id || m.code}</span>
                          <span className={`pill ${isRun ? 'p-ok' : isFree ? 'p-warn' : isMaint ? 'p-bad' : 'p-acc'}`}>
                            {m.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)' }}>
                          {m.type} ({m.dia} × {m.gg})
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{m.brand}</div>

                        <div style={{ padding: '6px 8px', background: 'var(--surface2)', borderRadius: 6, fontSize: '0.78rem', color: 'var(--ink)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div><strong>ফ্যাব্রিক:</strong> {m.fabric}</div>
                          <div><strong>অপারেটর:</strong> {m.operator}</div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--muted)', marginTop: 'auto', paddingTop: 4 }}>
                          <span>আজকের: <strong className="mono" style={{ color: 'var(--ink)' }}>{bnNum(Math.round(m.today_kg ?? m.todayKg ?? 0))} kg</strong></span>
                          <span>টার্গেট: <span className="mono">{bnNum(Math.round(m.target_kg ?? m.targetKg ?? 190))} kg</span></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Running Subcontract Orders Table */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: 0 }}>চলমান সাব-কন্ট্রাক্ট অর্ডারসমূহ</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--muted)' }}>উৎপাদন ও ডেলিভারি অগ্রগতি</p>
                  </div>
                  <button onClick={() => go('neworder')} className="btn pri sm">
                    <Plus size={14} style={{ marginRight: 4 }} /> নতুন অর্ডার যোগ করুন
                  </button>
                </div>

                <div className="tw">
                  <table>
                    <thead>
                      <tr>
                        <th>অর্ডার নং</th>
                        <th>পার্টি / বায়ার</th>
                        <th>ফেব্রিক ও কালার</th>
                        <th className="n">অর্ডার (kg)</th>
                        <th className="n">বোনা (kg)</th>
                        <th className="n">ডেলিভারি</th>
                        <th>অগ্রগতি</th>
                        <th>অবস্থা</th>
                        <th>অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(dashboardData?.running_orders || orders).map((o: any) => {
                        const totalKg = o.order_kg ?? o.lines?.reduce((a: any, b: any) => a + b.orderKg, 0) ?? 10000;
                        const knitKg = o.knit_kg ?? o.lines?.reduce((a: any, b: any) => a + b.knitKg, 0) ?? 6000;
                        const delivKg = o.deliv_kg ?? o.lines?.reduce((a: any, b: any) => a + b.delivKg, 0) ?? 4000;
                        const prog = o.progress_pct ?? pct(knitKg, totalKg);

                        return (
                          <tr key={o.id}>
                            <td className="mono"><b>{o.id}</b><small style={{ display: 'block', color: 'var(--muted)' }}>{o.po}</small></td>
                            <td><b>{o.party}</b><small style={{ display: 'block', color: 'var(--muted)' }}>{o.buyer}</small></td>
                            <td>{o.fabric || o.style}<small style={{ display: 'block', color: 'var(--muted)' }}>{o.color}</small></td>
                            <td className="n mono">{fmtKg(totalKg)}</td>
                            <td className="n mono" style={{ color: 'var(--ok)', fontWeight: 600 }}>{fmtKg(knitKg)}</td>
                            <td className="n mono">{fmtKg(delivKg)}</td>
                            <td>
                              <div className="row" style={{ flexWrap: 'nowrap', alignItems: 'center', gap: 6 }}>
                                <div className="bar" style={{ width: 80 }}><i style={{ width: `${prog}%` }}></i></div>
                                <span className="mono small" style={{ fontSize: '0.78rem' }}>{prog}%</span>
                              </div>
                            </td>
                            <td>
                              <span className={`pill ${o.status === 'Running' || o.status === 'run' ? 'p-acc' : o.status === 'Completed' || o.status === 'done' ? 'p-ok' : 'p-warn'}`}>
                                {o.status === 'Running' || o.status === 'run' ? 'চলছে' : o.status === 'Completed' || o.status === 'done' ? 'সম্পন্ন' : 'অপেক্ষায়'}
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => {
                                  go('detail', o.id);
                                }}
                                className="btn sm"
                              >
                                বিস্তারিত <ChevronRight size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          
      {/* ================= MODAL 1: QUICK PRODUCTION ENTRY ================= */}
          {isQuickEntryOpen && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, maxWidth: 520, width: '92%', padding: 22, boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>+ দ্রুত শিফট প্রোডাকশন এন্ট্রি</h3>
                  <button type="button" className="btn sm" onClick={() => setIsQuickEntryOpen(false)} style={{ padding: '4px 8px' }}>
                    <X size={16} />
                  </button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await quickProductionEntry({
                      machine_code: qeMachine,
                      shift: qeShift,
                      operator_name: qeOperator,
                      order_no: qeOrderNo,
                      net_kg: parseFloat(qeKg) || 160,
                      rolls_count: parseInt(qeRolls) || 7,
                      reject_kg: parseFloat(qeRejectKg) || 0,
                      rpm: parseFloat(qeRpm) || 28,
                      notes: qeNotes,
                    });
                    setIsQuickEntryOpen(false);
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>মেশিন নির্বাচন</label>
                      <SearchableSelect
                        value={qeMachine}
                        onChange={(val) => setQeMachine(val)}
                        options={(dashboardData?.machines || machines).map((m: any) => {
                          const id = m.code || m.id;
                          return {
                            value: id,
                            label: `${id} (${m.spec_label || m.type})`,
                          };
                        })}
                        searchPlaceholder="মেশিন খুঁজুন..."
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>শিফট</label>
                      <select
                        className="select"
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)' }}
                        value={qeShift}
                        onChange={(e) => setQeShift(e.target.value)}
                      >
                        <option value="A">শিফট A (সকাল ৬:০০ – দুপুর ২:০০)</option>
                        <option value="B">শিফট B (দুপুর ২:০০ – রাত ১০:০০)</option>
                        <option value="C">শিফট C (রাত ১০:০০ – সকাল ৬:০০)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>অপারেটর নাম</label>
                      <input
                        type="text"
                        required
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)' }}
                        value={qeOperator}
                        onChange={(e) => setQeOperator(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>ওয়ার্ক অর্ডার নং</label>
                      <SearchableSelect
                        value={qeOrderNo}
                        onChange={(val) => setQeOrderNo(val)}
                        options={(dashboardData?.running_orders || orders).map((o: any) => ({
                          value: o.id,
                          label: `${o.id} (${o.party})`,
                        }))}
                        searchPlaceholder="অর্ডার খুঁজুন..."
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>নেট ওজন (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)' }}
                        value={qeKg}
                        onChange={(e) => setQeKg(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>রোল সংখ্যা</label>
                      <input
                        type="number"
                        required
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)' }}
                        value={qeRolls}
                        onChange={(e) => setQeRolls(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>বাতিল / রিজেক্ট (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)' }}
                        value={qeRejectKg}
                        onChange={(e) => setQeRejectKg(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                    <button type="button" className="btn" onClick={() => setIsQuickEntryOpen(false)}>বাতিল</button>
                    <button type="submit" className="btn pri">ডাটাবেজে সেভ করুন</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ================= MODAL 2: MACHINE LIVE ACTION & STATUS CHANGER ================= */}
          {selectedMachineForAction && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, maxWidth: 480, width: '92%', padding: 22, boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem' }}>মেশিন কন্ট্রোল: {selectedMachineForAction.code || selectedMachineForAction.id}</h3>
                    <small style={{ color: 'var(--muted)' }}>{selectedMachineForAction.spec_label || '30" × 24G'} · {selectedMachineForAction.brand}</small>
                  </div>
                  <button type="button" className="btn sm" onClick={() => setSelectedMachineForAction(null)} style={{ padding: '4px 8px' }}>
                    <X size={16} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ padding: 12, background: 'var(--surface2)', borderRadius: 8, fontSize: '0.85rem' }}>
                    <div><strong>বর্তমান অবস্থা:</strong> <span className="pill p-acc">{selectedMachineForAction.status}</span></div>
                    <div><strong>রানিং অর্ডার:</strong> {selectedMachineForAction.running_order || selectedMachineForAction.current_order_no || 'কোনো অর্ডার বরাদ্দ নেই'}</div>
                    <div><strong>দায়িত্বপ্রাপ্ত অপারেটর:</strong> {selectedMachineForAction.operator || 'মোঃ সোহেল রানা'}</div>
                    <div><strong>আজকের উৎপাদন:</strong> {selectedMachineForAction.today_kg ?? selectedMachineForAction.todayKg ?? 180} kg</div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 8 }}>
                      ১-ক্লিকে মেশিনের অবস্থা পরিবর্তন করুন:
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <button
                        type="button"
                        className="btn sm"
                        style={{ background: 'var(--ok-soft)', color: 'var(--ok)', borderColor: 'var(--ok)' }}
                        onClick={async () => {
                          await toggleMachineStatus(selectedMachineForAction.code || selectedMachineForAction.id, 'Running');
                          setSelectedMachineForAction(null);
                        }}
                      >
                        🟢 রানিং (Running)
                      </button>

                      <button
                        type="button"
                        className="btn sm"
                        style={{ background: 'var(--warn-soft)', color: 'var(--warn)', borderColor: 'var(--warn)' }}
                        onClick={async () => {
                          await toggleMachineStatus(selectedMachineForAction.code || selectedMachineForAction.id, 'Free');
                          setSelectedMachineForAction(null);
                        }}
                      >
                        📡 ফ্রি ব্রডকাস্ট (Free)
                      </button>

                      <button
                        type="button"
                        className="btn sm"
                        style={{ background: 'var(--surface2)', color: 'var(--ink)' }}
                        onClick={async () => {
                          await toggleMachineStatus(selectedMachineForAction.code || selectedMachineForAction.id, 'Idle');
                          setSelectedMachineForAction(null);
                        }}
                      >
                        ⚪ খালি (Idle)
                      </button>

                      <button
                        type="button"
                        className="btn sm"
                        style={{ background: 'var(--bad-soft)', color: 'var(--bad)', borderColor: 'var(--bad)' }}
                        onClick={async () => {
                          await toggleMachineStatus(selectedMachineForAction.code || selectedMachineForAction.id, 'Maint');
                          setSelectedMachineForAction(null);
                        }}
                      >
                        🔴 মেরামত (Breakdown)
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                    <button type="button" className="btn sm" onClick={() => setSelectedMachineForAction(null)}>বন্ধ করুন</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= MODAL 3: FREE MACHINE BROADCAST ================= */}
          {isBroadcastModalOpen && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, maxWidth: 540, width: '92%', padding: 22, boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem' }}>📡 ফ্রি মেশিন ব্রডকাস্ট (মার্কেটপ্লেস বুকিং)</h3>
                    <small style={{ color: 'var(--muted)' }}>বায়ার ও গার্মেন্টসের কাছে খালি মেশিনের রিয়েলটাইম নোটিফিকেশন পাঠান</small>
                  </div>
                  <button type="button" className="btn sm" onClick={() => setIsBroadcastModalOpen(false)} style={{ padding: '4px 8px' }}>
                    <X size={16} />
                  </button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await broadcastFreeMachines(
                      selectedBroadcastMachines,
                      true,
                      broadcastDate,
                      parseFloat(broadcastCapacity) || 190,
                      broadcastNote
                    );
                    setIsBroadcastModalOpen(false);
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 6 }}>
                      কোন কোন মেশিন ব্রডকাস্ট করতে চান? ({selectedBroadcastMachines.length}টি নির্বাচিত)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
                      {(dashboardData?.machines || machines).map((m: any) => {
                        const id = m.code || m.id;
                        const selected = selectedBroadcastMachines.includes(id);
                        return (
                          <button
                            type="button"
                            key={id}
                            className={`btn sm ${selected ? 'pri' : ''}`}
                            style={{ padding: '6px 4px', fontSize: '0.78rem', justifyContent: 'center' }}
                            onClick={() => {
                              if (selected) {
                                setSelectedBroadcastMachines((prev) => prev.filter((mCode) => mCode !== id));
                              } else {
                                setSelectedBroadcastMachines((prev) => [...prev, id]);
                              }
                            }}
                          >
                            {id}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>ফ্রি হওয়ার তারিখ</label>
                      <input
                        type="date"
                        required
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)' }}
                        value={broadcastDate}
                        onChange={(e) => setBroadcastDate(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>দৈনিক সক্ষমতা (kg/মেশিন)</label>
                      <input
                        type="number"
                        required
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)' }}
                        value={broadcastCapacity}
                        onChange={(e) => setBroadcastCapacity(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>বায়ারদের জন্য নোট</label>
                    <input
                      type="text"
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)' }}
                      value={broadcastNote}
                      onChange={(e) => setBroadcastNote(e.target.value)}
                      placeholder="যেমন: সিঙ্গেল জার্সি ও লাইক্রা রিব এর জন্য দ্রুত বুকিং ওপেন"
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                    <button type="button" className="btn" onClick={() => setIsBroadcastModalOpen(false)}>বাতিল</button>
                    <button type="submit" className="btn pri" disabled={selectedBroadcastMachines.length === 0}>
                      📡 বায়ারদের কাছে ব্রডকাস্ট পাঠান
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ================= MODAL 4: SUBCONTRACT RFQ QUOTATION (shilposetu-old feature) ================= */}
          {isRfqModalOpen && selectedRfq && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(3px)' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, maxWidth: 500, width: '92%', padding: 22, boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem' }}>কোটেশন জমা দিন (দরপত্র)</h3>
                    <small style={{ color: 'var(--muted)' }}>বায়ার: {selectedRfq.buyer} · ফেব্রিক: {selectedRfq.fabric}</small>
                  </div>
                  <button type="button" className="btn sm" onClick={() => setIsRfqModalOpen(false)} style={{ padding: '4px 8px' }}>
                    <X size={16} />
                  </button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await submitQuotation({
                      subcontract_post_id: selectedRfq.id,
                      offered_rate_tk: parseFloat(rfqProposedRate) || 15.0,
                      estimated_days: 7,
                      allocated_machines: 2,
                      note: `${rfqCommitment ? 'মেশিন: ' + rfqCommitment + '. ' : ''}${rfqNote || ''}`,
                    });
                    setIsRfqModalOpen(false);
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                  <div style={{ padding: 12, background: 'var(--surface2)', borderRadius: 8, fontSize: '0.85rem' }}>
                    <div><strong>চাহিদা:</strong> {selectedRfq.title}</div>
                    <div><strong>মোট পরিমাণ:</strong> {selectedRfq.qty_kg > 0 ? bnNum(selectedRfq.qty_kg) : '৫,০০০'} kg</div>
                    <div><strong>বায়ারের টার্গেট রেট:</strong> {selectedRfq.target_rate}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>আপনার প্রস্তাবিত রেট (৳/kg)</label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)' }}
                        value={rfqProposedRate}
                        onChange={(e) => setRfqProposedRate(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>মেশিন বরাদ্দ প্রতিশ্রুতি</label>
                      <input
                        type="text"
                        required
                        style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)' }}
                        value={rfqCommitment}
                        onChange={(e) => setRfqCommitment(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>বায়ারের জন্য বার্তা / বিশেষ সুবিধা</label>
                    <textarea
                      rows={2}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)' }}
                      value={rfqNote}
                      onChange={(e) => setRfqNote(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                    <button type="button" className="btn" onClick={() => setIsRfqModalOpen(false)}>বাতিল</button>
                    <button type="submit" className="btn pri">✉️ সরাসরি বায়ারকে কোটেশন পাঠান</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        
    </>
  );
};
