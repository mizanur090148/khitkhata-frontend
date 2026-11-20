import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { bnNum } from '@/utils/formatters';

export const FactoryLedgerPage: React.FC = () => {
  const navigate = useNavigate();
  const { role, orders, parties, factoryBills, factoryProfile, fetchBills, fetchOrders } = useApp();

  const isVendor = role === 'vendor' || (role as string) === 'ven';
  const [curParty, setCurParty] = useState<string>('abc');
  const [tab, setTab] = useState<'ord' | 'tx'>('ord');

  useEffect(() => {
    fetchBills?.();
    fetchOrders?.();
  }, []);

  const activePartyKey = isVendor ? 'abc' : curParty;

  // Party details
  const partyObj = parties.find((p) => p.code === activePartyKey) || {
    name: activePartyKey === 'abc' ? 'ABC Knit Composite' : activePartyKey === 'xyz' ? 'XYZ Fashion Ltd' : activePartyKey,
    open: 0,
  };

  const openBalance = Number(partyObj.open || 0);

  // Orders for current party
  const partyOrders = orders.filter((o) => {
    return (
      o.party_code === activePartyKey ||
      o.party === activePartyKey ||
      (activePartyKey === 'abc' && o.v === 'abc') ||
      (activePartyKey === 'xyz' && (o.party?.includes('XYZ') || o.party_code === 'xyz'))
    );
  });

  // Bills for current party
  const partyBills = factoryBills.filter(
    (b) => b.v === activePartyKey || (activePartyKey === 'abc' && b.v === 'abc')
  );

  const billAmt = (b: any) =>
    (b.lines || []).reduce((a: number, l: any) => a + l.kg * l.rate, 0);
  const billRecv = (b: any) =>
    (b.recv || []).reduce((a: number, r: any) => a + (r.amt || 0), 0);

  const totalBilled = partyBills.reduce((a, b) => a + billAmt(b), 0);
  const totalReceived = partyBills.reduce((a, b) => a + billRecv(b), 0);
  const closingBalance = openBalance + totalBilled - totalReceived;

  // Map orders for Order Tab
  const orderRows = partyOrders.map((o) => {
    // Find bill covering this order
    const b = factoryBills.find((x) =>
      (x.lines || []).some((l: any) => l.o === o.id)
    );
    let bAmt = 0;
    let rec = 0;
    if (b) {
      const l = b.lines.find((x: any) => x.o === o.id);
      bAmt = (l?.kg || 0) * (l?.rate || 0);
      const bTot = billAmt(b);
      const bRec = billRecv(b);
      rec = bTot > 0 ? Math.round((bAmt / bTot) * bRec) : 0;
    }

    const yarnRecv = (o.yarnIn || []).reduce((a: number, y: any) => a + (y.kg || 0), 0);
    const orderVal = (o.qty || 0) * (o.rateTk || 30);
    const delivKg = o.delivered || o.done || 0;

    return {
      o,
      b,
      bAmt,
      rec,
      yarnRecv,
      orderVal,
      delivKg,
    };
  });

  // Calculate totals
  const totalYarn = orderRows.reduce((a, r) => a + r.yarnRecv, 0);
  const totalOrderQty = orderRows.reduce((a, r) => a + (r.o.qty || 0), 0);
  const totalOrderVal = orderRows.reduce((a, r) => a + r.orderVal, 0);
  const totalDelivKg = orderRows.reduce((a, r) => a + r.delivKg, 0);
  const totalBAmt = orderRows.reduce((a, r) => a + r.bAmt, 0);
  const totalBRec = orderRows.reduce((a, r) => a + r.rec, 0);
  const totalBDue = totalBAmt - totalBRec;

  // Build debit/credit transactions for Transaction Tab
  interface LedgerTx {
    date: string;
    desc: string;
    voucher: string;
    dr: number;
    cr: number;
  }

  const txList: LedgerTx[] = [];

  partyBills.forEach((b) => {
    const amt = billAmt(b);
    txList.push({
      date: b.date,
      desc: `বিল ${b.no} (${b.lines.map((l: any) => l.o).join(', ')})`,
      voucher: b.jv,
      dr: amt,
      cr: 0,
    });

    (b.recv || []).forEach((r: any) => {
      txList.push({
        date: r.d,
        desc: `টাকা গ্রহণ — ${b.no} · ${r.mode}`,
        voucher: r.rv,
        dr: 0,
        cr: r.amt,
      });
    });
  });

  // Sort by date
  txList.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : b.dr - a.dr));

  // Compute running balance
  let runningBal = openBalance;
  const txWithBalance = txList.map((tx) => {
    runningBal += tx.dr - tx.cr;
    return {
      ...tx,
      bal: runningBal,
    };
  });

  return (
    <div style={{ maxWidth: '100%', width: '100%' }}>
      {isVendor && (
        <div className="vbanner" style={{ marginBottom: 16 }}>
          <b>{factoryProfile?.name || 'রহমান নিটিং ইন্ডাস্ট্রিজ'}</b>-এর খাতায় আপনার হিসাব — কোন অর্ডার, কত সুতা পাঠিয়েছেন, কবে
          শেষ, কত বিল, কত দিয়েছেন আর কত বাকি। ফ্যাক্টরি যা দেখে, আপনিও ঠিক তাই
          দেখছেন।
        </div>
      )}

      {/* Header */}
      <div className="head">
        <div>
          <h2>{isVendor ? 'আমার হিসাব (লেজার)' : 'পার্টি লেজার'}</h2>
          <p>
            {isVendor
              ? `${factoryProfile?.name || 'রহমান নিটিং ইন্ডাস্ট্রিজ'}-এর সাথে আপনার পুরো লেনদেনের খাতা`
              : 'প্রতিটা ভেন্ডরের আলাদা খাতা — কোন অর্ডার, কত সুতা, কবে শেষ, কত বিল, কত পেলাম'}
          </p>
        </div>
        <div className="row no-pdf" style={{ gap: 8 }}>
          <button
            className="btn sm"
            type="button"
            onClick={() => window.print()}
          >
            প্রিন্ট করুন
          </button>
          <button
            className="btn pri sm"
            type="button"
            onClick={() => window.print()}
          >
            PDF নামান
          </button>
        </div>
      </div>

      {/* Party Selector Chips (Factory view only) */}
      {!isVendor && (
        <div
          className="row"
          style={{ gap: 8, flexWrap: 'wrap', marginBottom: 16 }}
        >
          <button
            type="button"
            className={`btn sm ${activePartyKey === 'abc' ? 'pri' : ''}`}
            onClick={() => setCurParty('abc')}
          >
            ABC Knit Composite
          </button>
          <button
            type="button"
            className={`btn sm ${activePartyKey === 'xyz' ? 'pri' : ''}`}
            onClick={() => setCurParty('xyz')}
          >
            XYZ Fashion Ltd
          </button>
          {parties
            .filter((p) => p.code !== 'abc' && p.code !== 'xyz')
            .map((p) => (
              <button
                key={p.code}
                type="button"
                className={`btn sm ${activePartyKey === p.code ? 'pri' : ''}`}
                onClick={() => setCurParty(p.code || '')}
              >
                {p.name}
              </button>
            ))}
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="kpis">
        <div className="kpi">
          <span>প্রারম্ভিক জের</span>
          <b>৳ {bnNum(openBalance)} Dr</b>
          <i>পুরোনো বাকি</i>
        </div>
        <div className="kpi">
          <span>মোট বিল</span>
          <b>৳ {bnNum(totalBilled)}</b>
          <i>{bnNum(partyBills.length)}টি বিল</i>
        </div>
        <div className="kpi">
          <span>মোট পেয়েছি</span>
          <b>৳ {bnNum(totalReceived)}</b>
          <i>
            {bnNum(partyBills.reduce((a, b) => a + (b.recv?.length || 0), 0))}টি
            ভাউচার
          </i>
        </div>
        <div className="kpi">
          <span>বর্তমান বাকি</span>
          <b style={{ color: 'var(--bad)' }}>৳ {bnNum(closingBalance)} Dr</b>
          <i>সমাপনী জের</i>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button
          className={tab === 'ord' ? 'on' : ''}
          onClick={() => setTab('ord')}
        >
          অর্ডার ধরে হিসাব
        </button>
        <button
          className={tab === 'tx' ? 'on' : ''}
          onClick={() => setTab('tx')}
        >
          ডেবিট / ক্রেডিট লেজার
        </button>
      </div>

      {/* Tab 1: Order-wise Ledger */}
      {tab === 'ord' && (
        <div className="card">
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>তারিখ</th>
                  <th>অর্ডার নং</th>
                  <th>ফেব্রিক</th>
                  <th className="n">সুতা পেয়েছি kg</th>
                  <th className="n">অর্ডার kg</th>
                  <th className="n">রেট</th>
                  <th className="n">অর্ডার ভ্যালু ৳</th>
                  <th>কমপ্লিট</th>
                  <th className="n">ডেলিভারি kg</th>
                  <th>বিল নং</th>
                  <th>বিল জমা</th>
                  <th className="n">বিল ৳</th>
                  <th className="n">পেয়েছি ৳</th>
                  <th className="n">বাকি ৳</th>
                </tr>
              </thead>
              <tbody>
                {orderRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={14}
                      style={{
                        textAlign: 'center',
                        padding: '36px 16px',
                        color: 'var(--muted)',
                      }}
                    >
                      কোনো অর্ডার রেকর্ড পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  orderRows.map((r) => {
                    const o = r.o;
                    const pct = Math.round(
                      ((o.done || 0) / (o.qty || 1)) * 100
                    );
                    return (
                      <tr
                        key={o.id}
                        className="click"
                        onClick={() => navigate(`/dashboard/orders/${o.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="mono small">
                          {o.orderDate ? o.orderDate.slice(5) : '—'}
                        </td>
                        <td className="mono" style={{ fontWeight: 600 }}>
                          {o.id}
                        </td>
                        <td>
                          {o.fabric} {o.gsm}
                        </td>
                        <td className="n">
                          {r.yarnRecv > 0 ? bnNum(r.yarnRecv) : '—'}
                        </td>
                        <td className="n">{bnNum(o.qty)}</td>
                        <td className="n">৳{o.rateTk || 30}</td>
                        <td className="n">৳ {bnNum(r.orderVal)}</td>
                        <td>
                          {o.completeDate ? (
                            <span className="mono small">{o.completeDate}</span>
                          ) : o.status === 'wait' ? (
                            <span className="pill p-yarn">সুতার অপেক্ষায়</span>
                          ) : (
                            <span className="pill p-acc">চলছে {pct}%</span>
                          )}
                        </td>
                        <td className="n">
                          {r.delivKg > 0 ? bnNum(r.delivKg) : '—'}
                        </td>
                        <td className="mono small">
                          {r.b ? (
                            r.b.no
                          ) : o.status === 'done' ? (
                            <span className="pill p-bad">বিল বাকি</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="mono small">{r.b ? r.b.date : '—'}</td>
                        <td className="n">
                          {r.bAmt > 0 ? `৳ ${bnNum(r.bAmt)}` : '—'}
                        </td>
                        <td className="n">
                          {r.rec > 0 ? `৳ ${bnNum(r.rec)}` : '—'}
                        </td>
                        <td
                          className="n"
                          style={{
                            fontWeight: r.bAmt - r.rec > 0 ? 600 : 400,
                            color:
                              r.bAmt - r.rec > 0 ? 'var(--bad)' : 'inherit',
                          }}
                        >
                          {r.bAmt > 0 ? `৳ ${bnNum(r.bAmt - r.rec)}` : '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
                <tr className="totrow" style={{ fontWeight: 700, background: 'var(--surface2)' }}>
                  <td colSpan={3}>মোট</td>
                  <td className="n">{bnNum(totalYarn)}</td>
                  <td className="n">{bnNum(totalOrderQty)}</td>
                  <td></td>
                  <td className="n">৳ {bnNum(totalOrderVal)}</td>
                  <td></td>
                  <td className="n">{bnNum(totalDelivKg)}</td>
                  <td></td>
                  <td></td>
                  <td className="n">৳ {bnNum(totalBAmt)}</td>
                  <td className="n">৳ {bnNum(totalBRec)}</td>
                  <td className="n" style={{ color: 'var(--bad)' }}>
                    ৳ {bnNum(totalBDue)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Debit / Credit Ledger */}
      {tab === 'tx' && (
        <div className="card">
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>তারিখ</th>
                  <th>বিবরণ</th>
                  <th>ভাউচার</th>
                  <th className="n">ডেবিট ৳</th>
                  <th className="n">ক্রেডিট ৳</th>
                  <th className="n">ব্যালেন্স ৳</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="mono small">—</td>
                  <td style={{ fontWeight: 600 }}>
                    প্রারম্ভিক জের (পুরোনো বাকি)
                  </td>
                  <td></td>
                  <td className="n">—</td>
                  <td className="n">—</td>
                  <td className="n" style={{ fontWeight: 600 }}>
                    ৳ {bnNum(openBalance)} Dr
                  </td>
                </tr>
                {txWithBalance.map((tx, idx) => (
                  <tr key={idx}>
                    <td className="mono small">{tx.date}</td>
                    <td>{tx.desc}</td>
                    <td className="mono small">{tx.voucher}</td>
                    <td className="n">
                      {tx.dr > 0 ? `৳ ${bnNum(tx.dr)}` : '—'}
                    </td>
                    <td className="n">
                      {tx.cr > 0 ? `৳ ${bnNum(tx.cr)}` : '—'}
                    </td>
                    <td className="n" style={{ fontWeight: 600 }}>
                      ৳ {bnNum(tx.bal)} Dr
                    </td>
                  </tr>
                ))}
                <tr className="totrow" style={{ fontWeight: 700, background: 'var(--surface2)' }}>
                  <td colSpan={3}>মোট / সমাপনী জের</td>
                  <td className="n">৳ {bnNum(totalBilled)}</td>
                  <td className="n">৳ {bnNum(totalReceived)}</td>
                  <td className="n" style={{ color: 'var(--bad)' }}>
                    ৳ {bnNum(closingBalance)} Dr
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
