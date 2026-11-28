import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { bnNum, pct } from '@/utils/formatters';

export const FactoryOrderDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { orders, yarns, qcLogs, prodLogs, selectedOrderId, deleteOrder, role, t, language, tkSymbol } = useApp();
  const isVendor = role === 'vendor' || (role as string) === 'ven';

  const activeOrder =
    orders.find((o) => o.id === id) ||
    orders.find((o) => o.id === selectedOrderId) ||
    orders[0];

  if (!activeOrder) {
    return (
      <div className="card">
        <p>{language === 'en' ? 'No order found.' : 'কোনো অর্ডার পাওয়া যায়নি।'}</p>
        <button className="btn sm" onClick={() => navigate('/dashboard/orders')}>
          ← {language === 'en' ? 'Back to Orders List' : 'অর্ডারের তালিকায় ফিরুন'}
        </button>
      </div>
    );
  }

  const o = activeOrder;
  const lineSumKg = (o.lines || []).reduce((acc, l) => acc + (l.orderKg || (l as any).qty || 0), 0);
  const totalKg = lineSumKg > 0 ? lineSumKg : Number(o.qty || 12000);
  const lineKnitKg = (o.lines || []).reduce((acc, l) => acc + (l.knitKg || (l as any).done || 0), 0);
  const knitKg = lineKnitKg > 0 ? lineKnitKg : Number(o.done || 7420);
  const progressPct = pct(knitKg, totalKg);
  const isDone = o.status === 'Completed' || (o.status as string) === 'done';
  const isWait = o.status === 'Pending' || (o.status as string) === 'wait';
  const isRun = !isDone && !isWait;
  const primaryLine = o.lines[0] || ({} as any);
  const assignedMachines = Array.isArray(o.machines) && o.machines.length > 0
    ? o.machines
    : Array.from(new Set((o.lines || []).map((l) => l.machine).filter(Boolean)));
  const ratePerKg = primaryLine.rate || o.rateTk || 14;
  const orderYarns = yarns.filter((y) => y.orderId === o.id);
  const orderQc = qcLogs.filter((q) => q.orderId === o.id);
  const orderLogs = prodLogs.filter((p: any) => p.orderId === o.id || p.order_no === o.id || p.o === o.id);
  const dynamicYarnIn = (o.yarnIn || []).reduce((acc: number, y: any) => acc + (y.kg || 0), 0);
  const totalYarnRcv =
    dynamicYarnIn > 0
      ? dynamicYarnIn
      : (o.lines || []).reduce((acc, l) => acc + (l.yarnRcv || 0), 0) ||
        orderYarns.reduce((acc, y) => acc + y.rcvKg, 0) ||
        knitKg;
  const lossPct = 2;
  const allowedKg = Math.round(totalYarnRcv * (1 - lossPct / 100));
  const yarnBalance = Math.max(0, totalYarnRcv - Math.round(knitKg / (1 - lossPct / 100)));

  const displayYarns =
    o.yarnIn && o.yarnIn.length > 0
      ? o.yarnIn.map((y: any, idx: number) => ({
          count: y.count || primaryLine.yarn || '30/1 Combed',
          spinner: y.spin || y.spinner || primaryLine.brand || '—',
          lot: y.lot || `LOT-${idx + 1}`,
          bags: y.bags || 0,
          kg: y.kg || 0,
        }))
      : orderYarns.length > 0
      ? orderYarns.map((y) => ({
          count: y.count,
          spinner: y.brand || '—',
          lot: y.lot,
          bags: y.bags,
          kg: y.rcvKg,
        }))
      : [];

  const displayQc =
    o.qc && o.qc.length > 0
      ? o.qc.map((q: any) => ({
          date: q.d || q.date,
          roll: q.roll || '—',
          machine: q.m || q.machine || '—',
          defect: q.issue || q.defect || '—',
          kg: q.kg || 0,
          status: q.fac?.v === 'ok' ? 'ok' : q.fac?.v === 'bad' ? 'bad' : 'warn',
          res: q.act || q.action_taken || 'QC রেকর্ড',
        }))
      : orderQc.length > 0
      ? orderQc.map((q) => ({
          date: q.date,
          roll: q.rollId,
          machine: q.dia || '—',
          defect: q.defects?.[0]?.name || '—',
          kg: q.weightKg,
          status: q.status === 'Pass' ? 'ok' : q.status === 'Reject' ? 'bad' : 'warn',
          res: q.inspector,
        }))
      : [];

  const displayLogs = orderLogs;

  return (
    <>
      <div className="head">
        <div>
          <button
            className="btn sm"
            onClick={() => {
              navigate(isVendor ? '/dashboard/vorders' : '/dashboard/orders');
              window.scrollTo(0, 0);
            }}
          >
            ← {t('সব অর্ডার')}
          </button>
          <h2 style={{ marginTop: 8 }}>
            {o.id} · {primaryLine.fabric || o.style || 'Single Jersey'}
            {primaryLine.gsm ? ` ${primaryLine.gsm} GSM` : ''}
          </h2>
          <p>
            {o.party || o.buyer || 'ABC Knit Composite'} · {language === 'en' ? 'Started ' : 'শুরু '}{o.orderDate || (language === 'en' ? '01 May 2026' : '০১ মে ২০২৬')}
          </p>
        </div>
        <div className="row" style={{ alignItems: 'center', gap: 8 }}>
          <button
            className="btn sm"
            onClick={() => {
              navigate(`/dashboard/jobcard/${o.id}`);
              window.scrollTo(0, 0);
            }}
          >
            {t('জব কার্ড')}
          </button>
          <button
            className="btn sm"
            style={{ color: 'var(--err)', borderColor: 'var(--err)' }}
            onClick={() => {
              if (window.confirm(language === 'en' ? `Do you want to delete order ${o.id}?` : `আপনি কি এই অর্ডারটি (${o.id}) মুছে ফেলতে চান?`)) {
                deleteOrder(o.id);
                navigate('/dashboard/orders');
              }
            }}
          >
            {language === 'en' ? 'Delete Order' : 'অর্ডার মুছুন'}
          </button>
          {isDone ? (
            <span className="pill p-ok">{t('ডেলিভারি সম্পন্ন')}</span>
          ) : isWait ? (
            <span className="pill p-yarn">{t('সুতার অপেক্ষায়')}</span>
          ) : (
            <span className="pill p-acc">{t('চলছে')}</span>
          )}
        </div>
      </div>

      {/* Facts card matching KnitKhata.html */}
      <div className="card">
        <div className="facts">
          <div>
            <span>{t('ফেব্রিক')}</span>
            <b>{primaryLine.fabric || o.style || 'Single Jersey'}</b>
          </div>
          {o.buyer && (
            <div>
              <span>{t('বায়ার')}</span>
              <b>{o.buyer}</b>
            </div>
          )}
          <div>
            <span>GSM</span>
            <b className="mono">{primaryLine.gsm || '160'}</b>
          </div>
          <div>
            <span>Stitch Length</span>
            <b className="mono">{primaryLine.stitch || '2.65 mm'}</b>
          </div>
          <div>
            <span>Dia × Gauge</span>
            <b className="mono">{primaryLine.dia || '30" × 24G'}</b>
          </div>
          <div>
            <span>{t('কালার')}</span>
            <b>{o.color || 'Grey (RFD)'}</b>
          </div>
          <div>
            <span>{t('সুতা')}</span>
            <b>{primaryLine.yarn || '30/1 Combed Cotton'}</b>
          </div>
          <div>
            <span>{language === 'en' ? 'Knitting Rate' : 'নিটিং চার্জ'}</span>
            <b className="mono">{tkSymbol}{ratePerKg}/kg</b>
          </div>
          <div>
            <span>{language === 'en' ? 'Order Date' : 'অর্ডারের তারিখ'}</span>
            <b className="mono">{o.orderDate || (language === 'en' ? '01 May 2026' : '০১ মে ২০২৬')}</b>
          </div>
          <div>
            <span>{language === 'en' ? 'Delivery Date' : 'ডেলিভারির তারিখ'}</span>
            <b className="mono">{o.delivDate || (language === 'en' ? '18 May 2026' : '১৮ মে ২০২৬')}</b>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <b>{t('অগ্রগতি')}</b>
            <span className="mono">
              {bnNum(knitKg.toLocaleString('en-IN'))} / {bnNum(totalKg.toLocaleString('en-IN'))} kg ·{' '}
              {bnNum(progressPct)}%
            </span>
          </div>
          <div className="bar big" style={{ marginTop: 6 }}>
            <i style={{ width: `${progressPct}%` }}></i>
          </div>
        </div>
      </div>

      {/* ETA Calculation card matching KnitKhata.html */}
      {isRun && (
        <div className="card">
          <h3>{language === 'en' ? 'Completion Estimate (Calculation)' : 'কবে শেষ হবে? (হিসাব)'}</h3>
          <div className="eta">
            <label className="f">
              {t('মোট মেশিন')}
              <input type="number" min="1" defaultValue={assignedMachines.length || 4} />
            </label>
            <label className="f">
              {language === 'en' ? 'Per Machine/Day (kg)' : 'প্রতি মেশিন/দিন (kg)'}
              <input type="number" min="1" defaultValue={350} />
            </label>
            <div className="out">
              <span className="small muted">{language === 'en' ? 'Remaining' : 'বাকি'}</span>
              <b>{bnNum(Math.max(0, totalKg - knitKg).toLocaleString('en-IN'))} kg</b>
            </div>
            <div className="out">
              <span className="small muted">{language === 'en' ? 'Daily Total' : 'দৈনিক মোট'}</span>
              <b>{bnNum(((assignedMachines.length || 4) * 350).toLocaleString('en-IN'))} kg</b>
            </div>
            <div className="out">
              <span className="small muted">{language === 'en' ? 'Est. Finish' : 'সম্ভাব্য শেষ'}</span>
              <b>{o.delivDate || (language === 'en' ? '18 May 2026' : '১৮ মে ২০২৬')}</b>
            </div>
          </div>
        </div>
      )}

      {/* Fabric item lines matching KnitKhata.html */}
      {o.lines && o.lines.length > 0 && (
        <div className="card">
          <h3>{language === 'en' ? 'Parts & Fabric Breakdown' : 'অংশ ও ফেব্রিক অনুযায়ী ভাগ'}</h3>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Placement</th>
                  <th>Fabrication</th>
                  <th>Color</th>
                  <th className="n">Qty (kg)</th>
                  <th>{t('সুতা')} (Count · Brand · Lot)</th>
                  <th>GSM</th>
                  <th>Dia × Gauge</th>
                  <th>{t('মেশিন')}</th>
                </tr>
              </thead>
              <tbody>
                {o.lines.map((l, i) => (
                  <tr key={l.id || i}>
                    <td>
                      <span className="ln-no" style={{ width: 22, height: 22, fontSize: '0.75rem' }}>
                        {bnNum(i + 1)}
                      </span>
                    </td>
                    <td>
                      <b>{i === 0 ? 'Body' : i === 1 ? 'Collar' : 'Cuff'}</b>
                    </td>
                    <td>{l.fabric}</td>
                    <td>{o.color || 'Grey'}</td>
                    <td className="n">{bnNum((l.orderKg || 0).toLocaleString('en-IN'))}</td>
                    <td className="ycell">
                      {l.yarn || '30/1 Combed'} · {l.brand || 'Square'} ·{' '}
                      <span className="mono">{l.lot || 'LOT-SQ-412'}</span>
                    </td>
                    <td className="mono">{l.gsm || '—'}</td>
                    <td className="mono">{l.dia}</td>
                    <td className="mono small">{l.machine || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2-column Grid: Yarn Inward & QC */}
      <div className="grid g2">
        <div className="card">
          <h3>{language === 'en' ? 'Yarn Inward' : 'সুতা গ্রহণ (Yarn Receive)'}</h3>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>{t('কাউন্ট')}</th>
                  <th>{t('ব্র্যান্ড')}</th>
                  <th>{t('লট')}</th>
                  <th className="n">{language === 'en' ? 'Bags' : 'ব্যাগ'}</th>
                  <th className="n">kg</th>
                </tr>
              </thead>
              <tbody>
                {displayYarns.length > 0 ? (
                  displayYarns.map((y: any, i: number) => (
                    <tr key={i}>
                      <td>{y.count}</td>
                      <td>{y.spinner || 'Square'}</td>
                      <td className="mono">{y.lot}</td>
                      <td className="n">{bnNum(y.bags || 0)}</td>
                      <td className="n">{bnNum((y.kg || 0).toLocaleString('en-IN'))}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '16px', color: 'var(--muted)' }}>
                      {language === 'en' ? 'No yarn inward records for this order yet.' : 'এই অর্ডারে এখনো কোনো সুতা ইনওয়ার্ড এন্ট্রি করা হয়নি।'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="facts" style={{ marginTop: 12 }}>
            <div>
              <span>{t('প্রাপ্ত সুতা')}</span>
              <b className="mono">{bnNum(totalYarnRcv.toLocaleString('en-IN'))} kg</b>
            </div>
            <div>
              <span>{t('অনুমোদিত প্রসেস লস')} ({lossPct}%)</span>
              <b className="mono">{bnNum(allowedKg.toLocaleString('en-IN'))} kg</b>
            </div>
            <div>
              <span>{t('ব্যালেন্স')}</span>
              <b className="mono">{bnNum(yarnBalance.toLocaleString('en-IN'))} kg</b>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>{t('QC ও কাপড়ের সমস্যা')}</h3>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>{t('তারিখ')}</th>
                  <th>{t('রোল')}</th>
                  <th>{t('মেশিন')}</th>
                  <th>{language === 'en' ? 'Issue' : 'সমস্যা'}</th>
                  <th className="n">kg</th>
                  <th>{t('অবস্থা')}</th>
                </tr>
              </thead>
              <tbody>
                {displayQc.length > 0 ? (
                  displayQc.map((q: any, i: number) => (
                    <tr key={i}>
                      <td>{q.date}</td>
                      <td className="mono">{q.roll}</td>
                      <td className="mono">{q.machine}</td>
                      <td>{q.defect}</td>
                      <td className="n">{bnNum(q.kg)}</td>
                      <td>
                        <span
                          className={`pill ${
                            q.status === 'bad'
                              ? 'p-warn'
                              : q.status === 'ok'
                              ? 'p-ok'
                              : 'p-yarn'
                          }`}
                        >
                          {q.status === 'ok'
                            ? t('পাস')
                            : q.status === 'bad'
                            ? t('বাতিল')
                            : (language === 'en' ? 'Pending' : 'তদন্তাধীন')}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '16px', color: 'var(--muted)' }}>
                      {language === 'en' ? 'No defects or QC rejections found. All rolls defect-free.' : 'কোনো ত্রুটি বা QC রিজেকশন পাওয়া যায়নি। সব রোল নিখুঁত।'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Production Log */}
      <div className="card">
        <h3>{language === 'en' ? 'Daily Production Log' : 'দৈনিক প্রোডাকশন লগ'}</h3>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>{t('তারিখ')}</th>
                <th>{t('শিফট')}</th>
                <th>{t('মেশিন')}</th>
                <th className="n">kg</th>
                <th className="n">{t('রোল')}</th>
                <th>{t('অপারেটর')}</th>
              </tr>
            </thead>
            <tbody>
              {displayLogs.length > 0 ? (
                displayLogs.map((p: any, i: number) => (
                  <tr key={i}>
                    <td>{p.date || p.d}</td>
                    <td>{p.shift || p.sh}</td>
                    <td className="mono">{p.machine || p.m}</td>
                    <td className="n">{bnNum((p.kg || p.knitKg || 0).toLocaleString('en-IN'))}</td>
                    <td className="n">{bnNum(p.rolls || 0)}</td>
                    <td>{p.operator || p.op || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '16px', color: 'var(--muted)' }}>
                    {language === 'en' ? 'No production logs found for this order.' : 'এই অর্ডারে কোনো প্রোডাকশন লগ এন্ট্রি পাওয়া যায়নি।'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vendor access */}
      <div className="card">
        <h3>{language === 'en' ? 'Vendor Access' : 'ভেন্ডর অ্যাক্সেস'}</h3>
        <p className="small muted" style={{ marginTop: -4 }}>
          {language === 'en' ? 'Those from ' + (o.party || 'ABC Knit Composite') + ' who can view this order' : (o.party || 'ABC Knit Composite') + '-এর যারা এই অর্ডার দেখতে পারেন'}
        </p>
        <div
          className="row"
          style={{ justifyContent: 'space-between', padding: '6px 0', alignItems: 'center' }}
        >
          <div>
            <b>{language === 'en' ? 'Md. Kamrul Hasan' : 'মো. কামরুল হাসান'}</b> <span className="small muted">· Knitting Merchandiser</span>
          </div>
          <span className="pill p-ok">{t('সক্রিয়')}</span>
        </div>
        <div className="row" style={{ marginTop: 8, gap: 8 }}>
          <button className="btn sm" onClick={() => navigate('/dashboard/users')}>
            {language === 'en' ? 'Change Permissions' : 'পারমিশন বদলান'}
          </button>
          <button className="btn sm" onClick={() => navigate('/dashboard/wa')}>
            {language === 'en' ? 'WhatsApp Settings' : 'WhatsApp রিপোর্ট সেটিং'}
          </button>
        </div>
      </div>
    </>
  );
};

