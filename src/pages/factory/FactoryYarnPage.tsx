import React, { useState, useMemo, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { bnNum } from '@/utils/formatters';
import { SearchableSelect } from '@/components/common/SearchableSelect';

interface YarnRowItem {
  o: any;
  v: string;
  k: string;
  count: string;
  brand: string;
  lot: string;
  bags: number;
  recv: number;
  used: number;
  ret: number;
  knit: number;
  bal: number;
  pct: string;
}

const SP: Record<string, [string, string]> = {
  ok: ['p-acc', 'চলছে'],
  done: ['p-idle', 'শেষ'],
  wait: ['p-yarn', 'সুতা আসেনি'],
  short: ['p-bad', 'সুতা কম'],
  left: ['p-warn', 'বাড়তি সুতা ফেরত দিন'],
};

export const FactoryYarnPage: React.FC = () => {
  const {
    role,
    currentUser,
    factoryProfile,
    orders,
    parties,
    fetchOrders,
    addYarnInward,
    requestYarnReturn,
    createYarnReturnChallan,
    addToast,
    openPrintModal,
  } = useApp();

  const isVendor = role === 'vendor' || (role as string) === 'ven';

  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters state
  const [ytV, setYtV] = useState<string>('all');
  const [ytC, setYtC] = useState<string>('all');
  const [ytSt, setYtSt] = useState<string>('all');
  const [ytQ, setYtQ] = useState<string>('');
  const [ytAdd, setYtAdd] = useState<boolean>(false);

  // New yarn form state
  const [yaO, setYaO] = useState<string>('');
  const [yaC, setYaC] = useState<string>('');
  const [yaB, setYaB] = useState<string>('');
  const [yaL, setYaL] = useState<string>('');
  const [yaG, setYaG] = useState<string>('');
  const [yaK, setYaK] = useState<string>('');

  // Initial data load
  useEffect(() => {
    let mounted = true;
    fetchOrders()
      .catch((err) => console.warn('Yarn page data load error:', err))
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const runningOrders = useMemo(() => {
    return orders.filter((o) => (o.status as string) !== 'done' && o.status !== 'Completed');
  }, [orders]);

  useEffect(() => {
    if (!yaO && runningOrders.length) {
      setYaO(runningOrders[0].id);
    }
  }, [runningOrders, yaO]);

  const vName = (code: string) => {
    if (!code) return '—';
    const p = parties.find((x) => x.code === code || String(x.id) === String(code) || x.name === code);
    if (p) return p.name;
    const ord = orders.find((o) => (o as any).party_code === code || (o as any).v === code || o.party === code);
    return ord?.party || code;
  };

  // Build yarn rows dynamically matching live database
  const allRows: YarnRowItem[] = useMemo(() => {
    const rows: YarnRowItem[] = [];

    orders.forEach((o: any) => {
      const partyCode = o.party_code || o.v || (parties.find((p) => p.name === o.party)?.code) || 'abc';
      const myPartyCode = (currentUser as any)?.party_code || (currentUser as any)?.party || 'abc';
      const myOrgName = currentUser?.organization_name;

      if (isVendor) {
        const matchParty =
          partyCode === myPartyCode ||
          (myOrgName && (o.party === myOrgName || vName(partyCode) === myOrgName)) ||
          partyCode === 'abc' ||
          (o.party && o.party.includes('ABC'));
        if (!matchParty) return;
      }

      const lines = o.lines || [];
      const need: Record<string, number> = {};
      const kn: Record<string, number> = {};
      const pc: Record<string, number[]> = {};

      // 1. Calculate needed yarn for each line
      lines.forEach((l: any) => {
        const isFlat = l.kt === 'f' || l.knit_type === 'f';
        const doneQty = Number(l.done || l.done_qty || l.knitKg || 0);
        const pcw = Number(l.pcw || l.piece_weight_gm || 0);
        const fabKg = isFlat ? (doneQty * pcw) / 1000 : doneQty;
        const yarnsList = Array.isArray(l.yarns) ? l.yarns : Array.isArray(l.yarns_json) ? l.yarns_json : [];

        yarnsList.forEach((y: any, idx: number, arr: any[]) => {
          let p = Number(y.pct);
          if (isNaN(p) || p <= 0) {
            p = arr.length === 1 ? 100 : Math.round(100 / arr.length);
          }
          const k = String(y.count || '').trim().toLowerCase();
          need[k] = (need[k] || 0) + (fabKg * p) / 100;
          kn[k] = (kn[k] || 0) + fabKg;
          if (!pc[k]) pc[k] = [];
          pc[k].push(p);
        });
      });

      // Persistent returns from database
      const orderReturns = Array.isArray(o.yarnReturns)
        ? o.yarnReturns
        : Array.isArray(o.yarn_returns_json)
        ? o.yarn_returns_json
        : [];

      // 2. Match with order yarnIn inward entries
      const yarnInList = Array.isArray(o.yarnIn) ? o.yarnIn : Array.isArray(o.yarn_in_json) ? o.yarn_in_json : [];
      const left: Record<string, number> = { ...need };
      const mine: YarnRowItem[] = [];

      yarnInList.forEach((y: any) => {
        const count = y.count || '—';
        const k = count.trim().toLowerCase();
        const lot = y.lot || '—';
        const brand = y.spinner || y.brand || '—';
        const bags = Number(y.bags || 0);
        const recv = Number(y.kg || 0);

        const n = left[k] || 0;
        const used = Math.min(recv, n);
        left[k] = Math.max(0, n - used);

        const ret = orderReturns
          .filter((r: any) => r.lot === lot)
          .reduce((a: number, r: any) => a + (Number(r.kg) || 0), 0);

        const uniquePcts = Array.from(new Set(pc[k] || []));
        const pctStr = uniquePcts.length ? uniquePcts.map((x) => `${x}%`).join(' / ') : '100%';

        const r: YarnRowItem = {
          o,
          v: partyCode,
          k,
          count,
          brand,
          lot,
          bags,
          recv,
          used,
          ret,
          knit: 0,
          bal: 0,
          pct: pctStr,
        };
        mine.push(r);
        rows.push(r);
      });

      // 3. If order has yarn requirements but NO yarn arrived at all (status: wait)
      if (yarnInList.length === 0 && Object.keys(need).length > 0) {
        Object.keys(need).forEach((k) => {
          const uniquePcts = Array.from(new Set(pc[k] || []));
          const pctStr = uniquePcts.length ? uniquePcts.map((x) => `${x}%`).join(' / ') : '100%';
          const r: YarnRowItem = {
            o,
            v: partyCode,
            k,
            count: k,
            brand: '—',
            lot: '—',
            bags: 0,
            recv: 0,
            used: 0,
            ret: 0,
            knit: 0,
            bal: 0,
            pct: pctStr,
          };
          mine.push(r);
          rows.push(r);
        });
      }

      // Assign remaining usage
      Object.keys(left).forEach((k) => {
        if (left[k] > 0.5) {
          const last = [...mine].reverse().find((r) => r.k === k);
          if (last) last.used += left[k];
        }
      });

      mine.forEach((r) => {
        r.knit = need[r.k] ? Math.round((r.used * (kn[r.k] || 0)) / need[r.k]) : 0;
        r.used = Math.round(r.used);
        r.bal = Math.round(r.recv - r.used - r.ret);
      });
    });

    return rows;
  }, [orders, parties, isVendor, currentUser]);

  // Status calculator
  const stOf = (r: YarnRowItem) => {
    if (r.recv === 0) return 'wait';
    if (r.bal < 0) return 'short';
    if (r.bal === 0) return 'done';
    const isDone = (r.o.status as string) === 'done' || r.o.status === 'Completed';
    if (isDone) return 'left';
    return 'ok';
  };

  // Distinct counts for filter
  const counts = useMemo(() => {
    return Array.from(new Set(allRows.map((r) => r.count).filter((c) => c && c !== '—')));
  }, [allRows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    const q = ytQ.trim().toLowerCase();
    return allRows.filter((r) => {
      const matchV = isVendor || ytV === 'all' || r.v === ytV;
      const matchC = ytC === 'all' || r.count === ytC;
      const matchSt = ytSt === 'all' || stOf(r) === ytSt;
      const matchQ =
        !q ||
        (r.o.id + ' ' + r.lot + ' ' + r.brand + ' ' + r.count).toLowerCase().includes(q);
      return matchV && matchC && matchSt && matchQ;
    });
  }, [allRows, isVendor, ytV, ytC, ytSt, ytQ]);

  // Totals
  const totalRecv = useMemo(() => filteredRows.reduce((a, r) => a + r.recv, 0), [filteredRows]);
  const totalUsed = useMemo(() => filteredRows.reduce((a, r) => a + r.used, 0), [filteredRows]);
  const totalRet = useMemo(() => filteredRows.reduce((a, r) => a + r.ret, 0), [filteredRows]);
  const totalBal = useMemo(() => filteredRows.reduce((a, r) => a + r.bal, 0), [filteredRows]);

  // Add yarn inward
  const handleAddYarn = async (e: React.FormEvent) => {
    e.preventDefault();
    const kg = parseFloat(yaK);
    if (!yaC.trim() || isNaN(kg) || kg <= 0) {
      addToast({ type: 'error', message: 'কাউন্ট আর ওজন লিখুন' });
      return;
    }
    try {
      await addYarnInward({
        order_no: yaO,
        count: yaC.trim(),
        spinner: yaB.trim() || '—',
        lot: yaL.trim() || '—',
        bags: parseInt(yaG, 10) || 0,
        kg,
      });
      setYtAdd(false);
      setYaC('');
      setYaB('');
      setYaL('');
      setYaG('');
      setYaK('');
    } catch {
      // Handled in context
    }
  };

  // Vendor request return
  const handleRequestReturn = async (r: YarnRowItem) => {
    try {
      await requestYarnReturn({
        order_no: r.o.id,
        lot: r.lot,
        kg: r.bal,
      });
    } catch {
      // Handled in context
    }
  };

  // Factory create return challan
  const handleReturnChallan = async (r: YarnRowItem) => {
    try {
      await createYarnReturnChallan({
        order_no: r.o.id,
        lot: r.lot,
        kg: r.bal,
      });
    } catch {
      // Handled in context
    }
  };

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
          {factoryProfile?.name || 'ফ্যাক্টরি'}-এ আপনার পাঠানো প্রতিটা লটের সুতা কতটা কাপড়ে গেছে আর কত এখনো ফ্যাক্টরিতে পড়ে আছে।
          অর্ডার শেষে বাড়তি সুতা থাকলে এখান থেকেই ফেরত চাইতে পারবেন।
        </div>
      )}

      {/* Header */}
      <div className="head">
        <div>
          <h2>{isVendor ? 'সুতা ব্যালেন্স' : 'সুতা ট্র্যাকার'}</h2>
          <p>
            সুতা এসেছে → কাপড় নিট হয়েছে → সুতার স্টক। কাপড়ে প্রতিটা সুতার ভাগ (%) অর্ডার এন্ট্রি থেকে নেওয়া,
            তাই লাইক্রা আর কটন আলাদা হিসাব হয়।
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button
            className="btn no-pdf prn-btn"
            type="button"
            onClick={() =>
              openPrintModal('jobcard', `সুতা ব্যালেন্স · ${factoryProfile?.name || 'ফ্যাক্টরি'}`, { rows: filteredRows })
            }
          >
            প্রিন্ট
          </button>
          {!isVendor && (
            <button
              className="btn pri"
              id="ytAddB"
              onClick={() => setYtAdd(!ytAdd)}
            >
              {ytAdd ? '✕ বন্ধ করুন' : '+ সুতা গ্রহণ'}
            </button>
          )}
        </div>
      </div>

      {/* Add Yarn Receive Form */}
      {ytAdd && !isVendor && (
        <form className="card" id="ytf" onSubmit={handleAddYarn} noValidate>
          <h3>সুতা গ্রহণ (Yarn Receive)</h3>
          <div className="no-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            <label className="no-f">
              <span>অর্ডার</span>
              <SearchableSelect
                value={yaO}
                onChange={(val) => setYaO(val)}
                options={runningOrders.map((o) => ({
                  value: o.id,
                  label: `${o.id} (${o.buyer || '—'})`,
                }))}
                searchPlaceholder="অর্ডার খুঁজুন..."
              />
            </label>

            <label className="no-f">
              <span>কাউন্ট</span>
              <input
                id="yaC"
                placeholder="যেমন: 30/1 Combed Cotton"
                value={yaC}
                onChange={(e) => setYaC(e.target.value)}
              />
            </label>

            <label className="no-f">
              <span>ব্র্যান্ড / স্পিনার</span>
              <input
                id="yaB"
                placeholder="মিলের নাম"
                value={yaB}
                onChange={(e) => setYaB(e.target.value)}
              />
            </label>

            <label className="no-f">
              <span>লট</span>
              <input
                id="yaL"
                placeholder="যেমন: SQ-88501"
                value={yaL}
                onChange={(e) => setYaL(e.target.value)}
              />
            </label>

            <label className="no-f">
              <span>ব্যাগ</span>
              <input
                id="yaG"
                inputMode="numeric"
                value={yaG}
                onChange={(e) => setYaG(e.target.value)}
              />
            </label>

            <label className="no-f">
              <span>ওজন (kg)</span>
              <input
                id="yaK"
                inputMode="decimal"
                value={yaK}
                onChange={(e) => setYaK(e.target.value)}
              />
            </label>
          </div>

          <div className="row" style={{ marginTop: 14, alignItems: 'center' }}>
            <button className="btn pri" type="submit">
              সেভ করুন
            </button>
            <span className="small muted">
              কাউন্ট অর্ডারের সুতার সাথে মিললে নিজে থেকে হিসাবে ঢুকবে। সেভ করলে ভেন্ডরও দেখবে।
            </span>
          </div>
        </form>
      )}

      {/* 4 KPIs */}
      <div className="kpis">
        <div className="kpi">
          <span>সুতা এসেছে</span>
          <b>{bnNum(totalRecv)} kg</b>
        </div>
        <div className="kpi">
          <span>সুতা খরচ (কাপড় নিট হয়ে)</span>
          <b>{bnNum(totalUsed)} kg</b>
        </div>
        <div className="kpi">
          <span>ফেরত দেওয়া</span>
          <b>{bnNum(totalRet)} kg</b>
        </div>
        <div className="kpi">
          <span>সুতার স্টক</span>
          <b style={{ color: totalBal < 0 ? 'var(--bad)' : 'inherit' }}>
            {bnNum(totalBal)} kg
          </b>
        </div>
      </div>

      {/* Filters Form */}
      <div className="no-grid" style={{ gridTemplateColumns: isVendor ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)', gap: 12, margin: '14px 0' }}>
        {!isVendor && (
          <label className="no-f">
            <span>ভেন্ডর</span>
            <SearchableSelect
              value={ytV}
              onChange={(val) => setYtV(val)}
              options={[
                { value: 'all', label: 'সব ভেন্ডর' },
                ...parties
                  .filter((p) => p.type === 'ven' || p.type === 'vendor' || (p as any).category === 'vendor')
                  .map((p) => ({
                    value: p.code || p.name || String(p.id),
                    label: p.name,
                  })),
              ]}
              searchPlaceholder="ভেন্ডর খুঁজুন..."
            />
          </label>
        )}

        <label className="no-f">
          <span>কাউন্ট</span>
          <select value={ytC} onChange={(e) => setYtC(e.target.value)}>
            <option value="all">সব কাউন্ট</option>
            {counts.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="no-f">
          <span>অবস্থা</span>
          <select value={ytSt} onChange={(e) => setYtSt(e.target.value)}>
            <option value="all">সব অবস্থা</option>
            <option value="ok">চলছে</option>
            <option value="done">শেষ</option>
            <option value="short">সুতা কম</option>
            <option value="left">বাড়তি সুতা</option>
            <option value="wait">সুতা আসেনি</option>
          </select>
        </label>

        <label className="no-f">
          <span>খুঁজুন</span>
          <input
            id="ytQ"
            value={ytQ}
            placeholder="অর্ডার, লট বা ব্র্যান্ড"
            onChange={(e) => setYtQ(e.target.value)}
          />
        </label>
      </div>

      {/* Table */}
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>ভেন্ডর</th>
              <th>অর্ডার</th>
              <th>কাউন্ট</th>
              <th>ব্র্যান্ড</th>
              <th>লট</th>
              <th className="n">কাপড়ে ভাগ</th>
              <th className="n">সুতা এসেছে</th>
              <th className="n">কাপড় নিট হয়েছে</th>
              <th className="n">সুতা খরচ</th>
              <th className="n">ফেরত</th>
              <th className="n">সুতার স্টক</th>
              <th>অবস্থা</th>
              <th className="no-pdf"></th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length ? (
              filteredRows.map((r, idx) => {
                const st = stOf(r);
                const s2 = SP[st] || ['p-idle', '—'];
                const isDone = (r.o.status as string) === 'done' || r.o.status === 'Completed';

                const orderRequests = r.o.yarnRequests || r.o.yarn_requests_json || {};
                const hasReq = !!(orderRequests[r.lot] && orderRequests[r.lot].status === 'pending');

                return (
                  <tr key={`${r.o.id}-${r.lot}-${idx}`}>
                    <td>{vName(r.v)}</td>
                    <td className="mono">{r.o.id}</td>
                    <td>{r.count}</td>
                    <td>{r.brand}</td>
                    <td className="mono">{r.lot}</td>
                    <td className="n">{r.pct}</td>
                    <td className="n">{bnNum(r.recv)} kg</td>
                    <td className="n">{bnNum(r.knit)} kg</td>
                    <td className="n">{bnNum(r.used)} kg</td>
                    <td className="n">{r.ret ? `${bnNum(r.ret)} kg` : '—'}</td>
                    <td className="n" style={{ color: r.bal < 0 ? 'var(--bad)' : 'inherit' }}>
                      <b>{bnNum(r.bal)} kg</b>
                    </td>
                    <td>
                      <span className={`pill ${s2[0]}`}>{s2[1]}</span>
                    </td>
                    <td className="no-pdf">
                      {r.bal > 0 && r.recv > 0 && isDone ? (
                        isVendor ? (
                          hasReq ? (
                            <span className="pill p-yarn">ফেরত চাওয়া হয়েছে</span>
                          ) : (
                            <button
                              className="btn sm"
                              onClick={() => handleRequestReturn(r)}
                            >
                              ফেরত চাই
                            </button>
                          )
                        ) : (
                          <button
                            className="btn sm"
                            onClick={() => handleReturnChallan(r)}
                          >
                            ফেরত চালান{hasReq ? ' · ভেন্ডর চেয়েছে' : ''}
                          </button>
                        )
                      ) : null}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={13} className="muted" style={{ textAlign: 'center', padding: '24px 0' }}>
                  এই ফিল্টারে কোনো সুতার রেকর্ড নেই
                </td>
              </tr>
            )}

            <tr>
              <td colSpan={6}>
                <b>মোট ({filteredRows.length} লট)</b>
              </td>
              <td className="n">
                <b>{bnNum(totalRecv)} kg</b>
              </td>
              <td></td>
              <td className="n">
                <b>{bnNum(totalUsed)} kg</b>
              </td>
              <td className="n">
                <b>{bnNum(totalRet)} kg</b>
              </td>
              <td className="n">
                <b>{bnNum(totalBal)} kg</b>
              </td>
              <td colSpan={2}></td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="small muted" style={{ marginTop: 12, lineHeight: 1.6 }}>
        হিসাবের নিয়ম: সুতা খরচ = কাপড় নিট হয়েছে × কাপড়ে ওই সুতার ভাগ। যেমন 1×1 Rib Lycra 100 kg নিট হলে 20D
        Spandex (৫%) খরচ 5 kg, 30/1 কটন (৯৫%) খরচ 95 kg। একই কাউন্টের কয়েকটা লট থাকলে আগে আসা লট আগে শেষ হয়।
        কলার-কাফের কাপড় পিস × প্রতি পিসের ওজন থেকে kg-তে হিসাব হয়। প্রসেস লস এখনো ধরা হয়নি।
      </p>
    </div>
  );
};

export default FactoryYarnPage;
