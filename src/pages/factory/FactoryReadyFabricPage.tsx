import React, { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { qcState, QcItem } from './FactoryQcPage';

export const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
export const toBn = (n: number | string | undefined | null): string => {
  if (n === undefined || n === null || n === '') return '০';
  return String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
};

export const qU = (v: number | string, u: string): string => `${toBn(v)} ${u}`;

export const sumU = (rs: any[], k: string): string => {
  const kg = rs.filter((r) => r.u === 'kg').reduce((a, r) => a + (Number(r[k]) || 0), 0);
  const pc = rs.filter((r) => r.u !== 'kg').reduce((a, r) => a + (Number(r[k]) || 0), 0);
  const parts = [
    kg || !pc ? `${toBn(kg)} kg` : '',
    pc ? `${toBn(pc)} পিস` : '',
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' / ') : '—';
};

export interface ReadyFabricRow {
  o: any;
  l: any;
  v: string;
  party: string;
  oid: string;
  place: string;
  fab: string;
  badge: React.ReactNode;
  u: string;
  qty: number;
  done: number;
  dl: number;
  rd: number;
  run: number;
  held: number;
  type: 'grey' | 'yd' | 'flat';
  st: [string, string];
}

function qcStatusFor(
  dq: QcItem[],
  pq: QcItem[],
  rd: number,
  u: string
): { st: [string, string]; held: number } {
  const dk = dq.reduce((a, q) => a + (Number(q.kg) || 0), 0);
  const pk = pq.reduce((a, q) => a + (Number(q.kg) || 0), 0);
  const totalHeld = dk + pk;

  const st: [string, string] = dq.length > 0
    ? ['p-bad', `QC দ্বিমত · ${dk > 0 ? qU(dk, u) : `${toBn(dq.length)}টা রোল`} আটকে`]
    : pq.length > 0
    ? ['p-warn', `QC বাকি · ${pk > 0 ? qU(pk, u) : `${toBn(pq.length)}টা রোল`} দেখা বাকি`]
    : rd > 0
    ? ['p-ok', `QC পাস · ${qU(rd, u)} নেওয়ার জন্য রেডি`]
    : ['p-idle', 'রেডি স্টক নেই'];

  return { st, held: totalHeld };
}

export const FactoryReadyFabricPage: React.FC = () => {
  const {
    orders,
    role,
    rolls,
    factoryProfile,
    qcInspections,
    fetchOrders,
    fetchRolls,
    fetchQcInspections,
  } = useApp();

  const isVendorRole = (role as string) === 'vendor' || (role as string) === 'ven';

  const [isLoading, setIsLoading] = useState(true);
  const [fabricTypeFilter, setFabricTypeFilter] = useState<'all' | 'grey' | 'yd' | 'flat'>('all');

  // Load fresh orders, rolls and QC inspections from database on mount
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchOrders?.(),
          fetchRolls?.(),
          fetchQcInspections?.(),
        ]);
      } catch (err) {
        console.warn('Error loading ready fabric data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute all ready rows from open orders directly from MySQL database
  const allRows: ReadyFabricRow[] = useMemo(() => {
    return orders
      .filter((o: any) => {
        const isNotDone = o.status !== 'done' && o.status !== 'Completed';
        if (!isNotDone) return false;
        if (isVendorRole) {
          return (
            o.party_code === 'abc' ||
            o.v === 'abc' ||
            o.party === 'abc' ||
            (o.party && o.party.includes('ABC'))
          );
        }
        return true;
      })
      .flatMap((o: any) => {
        const lines: any[] = o.lines && o.lines.length > 0
          ? o.lines
          : [
              {
                place: 'Body',
                fab: o.fabric || 'Single Jersey',
                qty: o.qty || 0,
                done: o.done || 0,
                dl: o.delivered || 0,
                kt: 'c',
                yd: false,
                machines: o.machines || [],
              },
            ];

        const partyCode = o.party_code || o.v || 'abc';
        const partyName = o.party || o.party_name || partyCode;
        const orderNo = o.id || o.order_no;

        // Build combined QC inspections for this order from order embedded QCs and live qcInspections
        const qcsMap = new Map<string, QcItem>();

        (o.qc || []).forEach((rawQ: any) => {
          const id = rawQ.id || rawQ.qc_no;
          if (!id) return;
          qcsMap.set(id, {
            id,
            o: orderNo,
            order_no: orderNo,
            d: rawQ.d || rawQ.date_label || '',
            roll: rawQ.roll || rawQ.roll_no || '—',
            m: rawQ.m || rawQ.machine_code || '—',
            pl: Number(rawQ.pl ?? rawQ.placement_index ?? 0),
            kg: Number(rawQ.kg ?? rawQ.weight_kg ?? 0),
            issue: rawQ.issue || rawQ.issue_description || 'কোনো ফল্ট নেই',
            src: rawQ.src || rawQ.source || 'fac',
            fac: rawQ.fac || { v: null, by: '', at: '', note: '' },
            ven: rawQ.ven || { v: null, by: '', at: '', note: '' },
            act: rawQ.act || rawQ.action_taken || '',
          });
        });

        (qcInspections || []).forEach((rawQ: any) => {
          const rawOrderNo = rawQ.o || rawQ.order_no;
          if (rawOrderNo === orderNo) {
            const id = rawQ.id || rawQ.qc_no;
            if (!id) return;
            qcsMap.set(id, {
              id,
              o: orderNo,
              order_no: orderNo,
              d: rawQ.d || rawQ.date_label || '',
              roll: rawQ.roll || rawQ.roll_no || '—',
              m: rawQ.m || rawQ.machine_code || '—',
              pl: Number(rawQ.pl ?? rawQ.placement_index ?? 0),
              kg: Number(rawQ.kg ?? rawQ.weight_kg ?? 0),
              issue: rawQ.issue || rawQ.issue_description || 'কোনো ফল্ট নেই',
              src: rawQ.src || rawQ.source || 'fac',
              fac: rawQ.fac || { v: null, by: '', at: '', note: '' },
              ven: rawQ.ven || { v: null, by: '', at: '', note: '' },
              act: rawQ.act || rawQ.action_taken || '',
            });
          }
        });

        const qcs = Array.from(qcsMap.values());

        return lines.map((l: any, i: number) => {
          const isFlat = l.kt === 'f' || l.unit === 'pcs' || (l.place && l.place.toLowerCase().includes('collar'));
          const isYd = Boolean(l.yd || (l.fab && (l.fab.toLowerCase().includes('y/d') || l.fab.toLowerCase().includes('yarn dyed'))));
          const u = isFlat ? 'পিস' : 'kg';

          // Knitted done and target qty
          const qty = Math.round(Number(l.qty || l.orderKg || 0));
          const done = Math.round(Number(l.done || l.knitKg || 0));

          // Delivered quantity
          const lineRolls = (rolls || []).filter(
            (r: any) =>
              (r.o === orderNo || r.order_no === orderNo) &&
              Number(r.pl ?? r.placement_index ?? 0) === i
          );
          const rollsDeliveredKg = lineRolls
            .filter((r: any) => r.ch || r.challan_no)
            .reduce((a: number, r: any) => a + (Number(r.kg || r.weight_kg) || 0), 0);
          const explicitDelivered = Number(l.dl || l.delivered_qty || l.delivKg || 0);
          const dl = Math.min(done, Math.max(explicitDelivered, Math.round(rollsDeliveredKg)));

          // Ready stock & remaining in machines
          const rd = Math.max(0, done - dl);
          const run = Math.max(0, qty - done);

          // QC status and held quantity
          const lineQcs = qcs.filter((q) => (q.pl || 0) === i);
          const disputeQcs = lineQcs.filter((q) => qcState(q).k === 'dispute');
          const pendingQcs = lineQcs.filter((q) => qcState(q).k === 'pend');
          const { st, held } = qcStatusFor(disputeQcs, pendingQcs, rd, u);

          const badge = (
            <>
              {isFlat ? <span className="kb kb-f" style={{ marginRight: 4 }}>ফ্ল্যাট নিট</span> : null}
              {isYd ? <span className="kb kb-y" style={{ marginRight: 4 }}>Y/D</span> : <span className="kb" style={{ marginRight: 4 }}>গ্রে</span>}
            </>
          );

          const type: 'grey' | 'yd' | 'flat' = isFlat ? 'flat' : isYd ? 'yd' : 'grey';

          return {
            o,
            l,
            v: partyCode,
            party: partyName,
            oid: orderNo,
            place: l.place || 'Body',
            fab: l.fab || l.fabric || 'Single Jersey',
            badge,
            u,
            qty,
            done,
            dl,
            rd,
            run,
            held,
            type,
            st,
          };
        });
      });
  }, [orders, rolls, qcInspections, isVendorRole]);

  // Filtered rows by fabric type
  const filteredRows = useMemo(() => {
    if (fabricTypeFilter === 'all') return allRows;
    return allRows.filter((r) => r.type === fabricTypeFilter);
  }, [allRows, fabricTypeFilter]);

  // KPI calculations
  const sumByType = (t: 'grey' | 'yd' | 'flat', k: 'rd' | 'run' = 'rd') => {
    return allRows.filter((r) => r.type === t).reduce((a, r) => a + (r[k] || 0), 0);
  };

  const heldRows = useMemo(() => allRows.filter((r) => r.held > 0), [allRows]);

  // Distinct parties for party summary table
  const partyList = useMemo(() => {
    const pMap = new Map<string, string>();
    filteredRows.forEach((r) => {
      if (!pMap.has(r.v)) pMap.set(r.v, r.party);
    });
    return Array.from(pMap.entries()).map(([code, name]) => ({ code, name }));
  }, [filteredRows]);

  // Distinct order IDs for detailed table
  const orderIds = useMemo(() => {
    const ids: string[] = [];
    filteredRows.forEach((r) => {
      if (!ids.includes(r.oid)) ids.push(r.oid);
    });
    return ids;
  }, [filteredRows]);

  // Party summary helper cell
  const renderPartyCell = (v: string, type: 'grey' | 'yd' | 'flat', u: string) => {
    const val = filteredRows
      .filter((r) => r.v === v && r.type === type)
      .reduce((a, r) => a + r.rd, 0);
    return <td className="n">{val > 0 ? `${toBn(val)} ${u}` : '—'}</td>;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="no-wrap" style={{ maxWidth: '100%', width: '100%', padding: '0 8px' }}>
      {/* Top Banner if Vendor */}
      {isVendorRole && (
        <div className="vbanner" style={{ marginBottom: 16 }}>
          <b>{factoryProfile?.name || 'ফ্যাক্টরি'}</b>-এ আপনার প্রতিটা অর্ডারের মোট পরিমাণ, কত তৈরি হয়েছে, কত পেয়েছেন, কত রেডি পড়ে আছে আর কত এখনো মেশিনে চলছে।
        </div>
      )}

      {/* Header */}
      <div className="head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 2 }}>
        <div>
          <h2 style={{ margin: 0 }}>রেডি কাপড়</h2>
          <p style={{ margin: '2px 0 0', color: 'var(--muted)' }}>
            অর্ডার ধরে মোট পরিমাণ, তৈরি, ডেলিভারি, রেডি স্টক আর বাকি। গ্রে আর Y/D kg-তে, ফ্ল্যাট নিট (কলার-কাফ) পিসে।
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button type="button" className="btn sm" onClick={handlePrint}>
            🖨️ প্রিন্ট / PDF
          </button>
        </div>
      </div>

      {/* KPIs exact from live database with minimized compact gaps */}
      <div className="kpis" style={{ marginTop: 8, marginBottom: 10 }}>
        <div className="kpi">
          <span>গ্রে কাপড় রেডি</span>
          <b>{toBn(sumByType('grey', 'rd'))} kg</b>
          <i>বাকি {toBn(sumByType('grey', 'run'))} kg মেশিনে</i>
        </div>
        <div className="kpi" style={{ borderColor: 'var(--yarn)' }}>
          <span>ইয়ার্ন ডাইড (Y/D) রেডি</span>
          <b style={{ color: 'var(--yarn)' }}>{toBn(sumByType('yd', 'rd'))} kg</b>
          <i>বাকি {toBn(sumByType('yd', 'run'))} kg মেশিনে</i>
        </div>
        <div className="kpi" style={{ borderColor: 'var(--accent)' }}>
          <span>ফ্ল্যাট নিট (কলার-কাফ) রেডি</span>
          <b style={{ color: 'var(--accent)' }}>{toBn(sumByType('flat', 'rd'))} পিস</b>
          <i>বাকি {toBn(sumByType('flat', 'run'))} পিস মেশিনে</i>
        </div>
        <div className="kpi" style={{ borderColor: 'var(--bad)' }}>
          <span>QC-তে আটকে</span>
          <b style={{ color: 'var(--bad)' }}>{sumU(heldRows, 'held')}</b>
          <i>দ্বিমত বা দেখা বাকি</i>
        </div>
      </div>

      {/* Fabric Type Filter Chips with compact margin */}
      <div className="chips no-pdf" style={{ margin: '0 0 10px' }}>
        <button
          type="button"
          className={fabricTypeFilter === 'all' ? 'on' : ''}
          onClick={() => setFabricTypeFilter('all')}
        >
          সব ({toBn(allRows.length)})
        </button>
        <button
          type="button"
          className={fabricTypeFilter === 'grey' ? 'on' : ''}
          onClick={() => setFabricTypeFilter('grey')}
        >
          গ্রে ({toBn(allRows.filter((r) => r.type === 'grey').length)})
        </button>
        <button
          type="button"
          className={fabricTypeFilter === 'yd' ? 'on' : ''}
          onClick={() => setFabricTypeFilter('yd')}
        >
          ইয়ার্ন ডাইড ({toBn(allRows.filter((r) => r.type === 'yd').length)})
        </button>
        <button
          type="button"
          className={fabricTypeFilter === 'flat' ? 'on' : ''}
          onClick={() => setFabricTypeFilter('flat')}
        >
          ফ্ল্যাট নিট ({toBn(allRows.filter((r) => r.type === 'flat').length)})
        </button>
      </div>

      {/* Loading Spinner or Tables */}
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
        <>
          {/* Party / Vendor Breakdown Card (only for factory role) */}
          {!isVendorRole && (
            <div className="card" style={{ marginTop: 0 }}>
              <h3 style={{ marginTop: 0 }}>পার্টি (ভেন্ডর) অনুযায়ী সারাংশ</h3>
              <div className="tw" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>পার্টি</th>
                      <th className="n">মোট অর্ডার</th>
                      <th className="n">গ্রে রেডি</th>
                      <th className="n">Y/D রেডি</th>
                      <th className="n">ফ্ল্যাট রেডি</th>
                      <th className="n">QC-তে আটকে</th>
                      <th className="n">বাকি (মেশিনে)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partyList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 16 }}>
                          কোনো পার্টির রেকর্ড পাওয়া যায়নি।
                        </td>
                      </tr>
                    ) : (
                      partyList.map((p) => {
                        const partyRows = filteredRows.filter((r) => r.v === p.code);
                        const partyHeld = partyRows.some((r) => r.held > 0);

                        return (
                          <tr key={p.code}>
                            <td>
                              <b>{p.name}</b>
                            </td>
                            <td className="n">{sumU(partyRows, 'qty')}</td>
                            {renderPartyCell(p.code, 'grey', 'kg')}
                            {renderPartyCell(p.code, 'yd', 'kg')}
                            {renderPartyCell(p.code, 'flat', 'পিস')}
                            <td
                              className="n"
                              style={partyHeld ? { color: 'var(--bad)', fontWeight: 600 } : undefined}
                            >
                              {partyHeld ? sumU(partyRows.filter((r) => r.held > 0), 'held') : '—'}
                            </td>
                            <td className="n">{sumU(partyRows, 'run')}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Order & Line Breakdown Detailed Table Card */}
          <div className="card" style={{ marginTop: isVendorRole ? 0 : 14 }}>
            <h3 style={{ marginTop: 0 }}>অর্ডার ও অংশ অনুযায়ী বিস্তারিত রেডি স্টক</h3>
            <div className="tw" style={{ overflowX: 'auto' }}>
              <table className="rt" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {!isVendorRole && <th style={{ textAlign: 'left' }}>পার্টি</th>}
                    <th style={{ textAlign: 'left' }}>অর্ডার</th>
                    <th style={{ textAlign: 'left' }}>অংশ ও ধরন</th>
                    <th className="n">অর্ডার পরিমাণ</th>
                    <th className="n">তৈরি হয়েছে</th>
                    <th className="n">ডেলিভারি গেছে</th>
                    <th className="n">রেডি স্টক</th>
                    <th className="n">বাকি (মেশিনে চলছে)</th>
                    <th style={{ textAlign: 'left' }}>QC অবস্থা</th>
                  </tr>
                </thead>
                <tbody>
                  {orderIds.length === 0 ? (
                    <tr>
                      <td colSpan={!isVendorRole ? 9 : 8} className="muted" style={{ textAlign: 'center', padding: 20 }}>
                        এই ফিল্টারে কোনো কাপড় পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    orderIds.map((id) => {
                      const rowsForOrder = filteredRows.filter((r) => r.oid === id);

                      return (
                        <React.Fragment key={id}>
                          {rowsForOrder.map((r, k) => (
                            <tr key={`${id}-${k}`}>
                              {!isVendorRole && <td>{k === 0 ? r.party : ''}</td>}
                              <td className="mono">{k === 0 ? r.oid : ''}</td>
                              <td>
                                <b>{r.place}</b> {r.badge}
                                <div className="small muted">{r.fab}</div>
                              </td>
                              <td className="n">{qU(r.qty, r.u)}</td>
                              <td className="n">{qU(r.done, r.u)}</td>
                              <td className="n">{qU(r.dl, r.u)}</td>
                              <td className="n">
                                <b style={r.rd > 0 ? { color: 'var(--ok)' } : undefined}>{qU(r.rd, r.u)}</b>
                              </td>
                              <td className="n">{qU(r.run, r.u)}</td>
                              <td>
                                <span className={`pill ${r.st[0]}`}>{r.st[1]}</span>
                              </td>
                            </tr>
                          ))}

                          {/* Order Subtotal Row */}
                          <tr className="rt-sub">
                            {!isVendorRole && <td></td>}
                            <td colSpan={2}>
                              মোট · <span className="mono">{id}</span>
                            </td>
                            <td className="n">{sumU(rowsForOrder, 'qty')}</td>
                            <td className="n">{sumU(rowsForOrder, 'done')}</td>
                            <td className="n">{sumU(rowsForOrder, 'dl')}</td>
                            <td className="n">
                              <b>{sumU(rowsForOrder, 'rd')}</b>
                            </td>
                            <td className="n">{sumU(rowsForOrder, 'run')}</td>
                            <td>
                              {rowsForOrder.some((r) => r.held > 0) && (
                                <span className="small" style={{ color: 'var(--bad)', fontWeight: 600 }}>
                                  QC-তে আটকে {sumU(rowsForOrder.filter((r) => r.held > 0), 'held')}
                                </span>
                              )}
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FactoryReadyFabricPage;
