import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { bnNum } from '@/utils/formatters';
import { QrCodeSvg } from '@/components/common/QrCodeSvg';
import { SearchableSelect } from '@/components/common/SearchableSelect';

// The exact 16 faults from KnitKhata.html
const FAULTS = [
  'Hole',
  'Needle Mark',
  'Needle Broken',
  'Oil Spot',
  'Ink Spot',
  'Star Mark',
  'Lycra Out',
  'Patta (Barre)',
  'Missing Yarn',
  'Shade Up',
  'Yarn Fault',
  'Y/D Design',
  'Foreign Fiber',
  'Slab Yarn',
  'Thick Thin',
  'Sinker Mark',
];

interface OrderLineNormalized {
  place: string;
  fab: string;
  color: string;
  qty: number;
  done: number;
  dia: string;
  kt: 'c' | 'f';
  yd: boolean;
  unit: string;
  machines: string[];
  yarns: Array<{ count?: string; brand?: string; lot?: string; pct?: string }>;
}

function normalizeOrderLines(o: any): OrderLineNormalized[] {
  if (!o) return [];
  if (!o.lines || !o.lines.length) {
    return [
      {
        place: 'Body',
        fab: o.fabric || 'Single Jersey',
        color: o.color || '—',
        qty: Number(o.qty || o.totalKg || 0),
        done: Number(o.done || 0),
        dia: o.dia || '30" × 24G',
        kt: 'c',
        yd: false,
        unit: 'kg',
        machines: Array.isArray(o.machines) && o.machines.length ? o.machines : ['M-01'],
        yarns: [],
      },
    ];
  }

  return o.lines.map((l: any, i: number) => {
    let machinesList: string[] = [];
    if (Array.isArray(l.machines)) {
      machinesList = l.machines;
    } else if (typeof l.machine === 'string') {
      machinesList = l.machine.split(',').map((m: string) => m.trim()).filter(Boolean);
    }
    if (!machinesList.length) machinesList = ['M-01'];

    return {
      place: l.place || l.placement || (i === 0 ? 'Body' : `অংশ ${i + 1}`),
      fab: l.fab || l.fabrication || l.fabric || 'Single Jersey',
      color: l.color || o.color || '—',
      qty: Number(l.qty || l.orderKg || 0),
      done: Number(l.done || l.knitKg || 0),
      dia: l.dia || l.dia_gauge || o.dia || '30" × 24G',
      kt: (l.kt || l.knit_type || 'c') as 'c' | 'f',
      yd: Boolean(l.yd || l.is_yarn_dyed),
      unit: l.unit || 'kg',
      machines: machinesList,
      yarns: Array.isArray(l.yarns) ? l.yarns : [],
    };
  });
}

function parseNum(val: any): number {
  if (val == null || val === '') return 0;
  const cleaned = String(val).replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

export const FactoryJobCardPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: paramOrderId } = useParams<{ id?: string }>();
  const {
    role,
    orders,
    parties,
    rolls,
    prodLogs,
    factoryProfile,
    fetchRolls,
    saveJobCardGrid,
    fetchOrders,
    addToast,
  } = useApp();

  const isVendor = role === 'vendor' || (role as string) === 'ven';

  // Load fresh orders and rolls on mount
  useEffect(() => {
    fetchOrders?.();
    fetchRolls?.();
  }, []);

  // Filter orders with machines assigned (isolated to vendor when in vendor view)
  const validOrders = useMemo(() => {
    const list = orders.filter((o) => {
      if (isVendor) {
        const isBelongsToVendor =
          o.party_code === 'abc' ||
          o.party === 'abc' ||
          o.v === 'abc' ||
          (o.party && o.party.includes('ABC'));
        if (!isBelongsToVendor) return false;
      }
      const isNotDone = (o.status as string) !== 'done' && o.status !== 'Completed';
      const lines = normalizeOrderLines(o);
      const hasMachines = lines.some((l) => (l.machines || []).length > 0);
      return isNotDone && hasMachines;
    });
    return list.length > 0 ? list : orders;
  }, [orders, isVendor]);

  // Selected Order State
  const [selectedOrderId, setSelectedOrderId] = useState<string>(() => {
    if (paramOrderId && orders.some((o) => o.id === paramOrderId)) return paramOrderId;
    return validOrders[0]?.id || orders[0]?.id || '';
  });

  // Keep selectedOrderId in sync with route params or list
  useEffect(() => {
    if (paramOrderId && orders.some((o) => o.id === paramOrderId)) {
      setSelectedOrderId(paramOrderId);
    } else if (!validOrders.some((o) => o.id === selectedOrderId) && validOrders[0]) {
      setSelectedOrderId(validOrders[0].id);
    }
  }, [paramOrderId, validOrders, orders]);

  const activeOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || validOrders[0] || orders[0];
  }, [orders, validOrders, selectedOrderId]);

  // Normalized order lines
  const lines = useMemo(() => normalizeOrderLines(activeOrder), [activeOrder]);

  // Flattened machines with line index
  const ms = useMemo(() => {
    return lines.flatMap((l, i) => (l.machines || []).map((m) => ({ m, i })));
  }, [lines]);

  // Selected Machine State
  const [selectedMachine, setSelectedMachine] = useState<string>('');

  useEffect(() => {
    if (!ms.some((x) => x.m === selectedMachine) && ms[0]) {
      setSelectedMachine(ms[0].m);
    }
  }, [ms, selectedMachine]);

  const curMachine = useMemo(() => {
    return ms.find((x) => x.m === selectedMachine) || ms[0] || { m: 'M-01', i: 0 };
  }, [ms, selectedMachine]);

  // Fetch rolls whenever active order or machine changes
  useEffect(() => {
    if (activeOrder?.id && curMachine?.m) {
      fetchRolls?.(activeOrder.id, curMachine.m);
    }
  }, [activeOrder?.id, curMachine?.m]);

  const curLine = lines[curMachine.i] || lines[0] || {
    place: 'Body',
    fab: 'Single Jersey',
    color: '—',
    qty: 0,
    done: 0,
    dia: '30" × 24G',
    kt: 'c',
    yd: false,
    unit: 'kg',
    machines: ['M-01'],
    yarns: [],
  };

  // UI States
  const [stickerOn, setStickerOn] = useState<boolean>(true);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Machine Rolls from Database
  const machineDbRolls = useMemo(() => {
    if (!activeOrder?.id || !curMachine.m) return [];
    return rolls.filter(
      (r: any) =>
        (r.o === activeOrder.id || r.order_no === activeOrder.id) &&
        (r.m === curMachine.m || r.machine_code === curMachine.m)
    );
  }, [rolls, activeOrder, curMachine]);

  // Grid State for Job Card
  const [cols, setCols] = useState<number>(() => Math.max(machineDbRolls.length, 10));
  const [rollNums, setRollNums] = useState<string[]>([]);
  const [weights, setWeights] = useState<(string | number)[]>([]);
  const [operators, setOperators] = useState<string[]>([]);
  const [faultMap, setFaultMap] = useState<Record<string, (string | number)[]>>({});
  const [remarks, setRemarks] = useState<string>('');

  // Sync Grid with Database rolls when active order/machine changes
  useEffect(() => {
    const count = Math.max(machineDbRolls.length, 10);
    setCols(count);

    const rArr: string[] = [];
    const wArr: (string | number)[] = [];
    const opArr: string[] = [];
    const fObj: Record<string, (string | number)[]> = {};
    FAULTS.forEach((f) => (fObj[f] = []));

    for (let i = 0; i < count; i++) {
      const dbR: any = machineDbRolls[i];
      rArr[i] = dbR?.jc || dbR?.jc_seq || String(i + 1).padStart(3, '0');
      wArr[i] = dbR ? (dbR.kg ?? dbR.weight_kg ?? '') : '';
      opArr[i] = dbR ? (dbR.op ?? dbR.operator_name ?? '') : '';

      FAULTS.forEach((f) => {
        const fVal = dbR?.f ? dbR.f[f] : undefined;
        fObj[f][i] = fVal != null && fVal !== 0 ? fVal : '';
      });
    }

    setRollNums(rArr);
    setWeights(wArr);
    setOperators(opArr);
    setFaultMap(fObj);
    setEditMode(false);
  }, [machineDbRolls, activeOrder?.id, curMachine.m]);

  // Vendor display name
  const vendorName = useMemo(() => {
    if (!activeOrder) return '—';
    const found = parties.find(
      (p) =>
        p.code === activeOrder.party_code ||
        p.code === (activeOrder as any).v ||
        p.id === activeOrder.party_id ||
        p.name === activeOrder.party
    );
    return found?.name || activeOrder.party || (activeOrder as any).v || '—';
  }, [activeOrder, parties]);

  // Production Log details (operator, shift, date)
  const lastProdLog = useMemo(() => {
    if (!activeOrder?.id || !curMachine.m) return null;
    return prodLogs.find(
      (p: any) =>
        (p.o === activeOrder.id || p.order_no === activeOrder.id) &&
        (p.m === curMachine.m || p.machine_code === curMachine.m)
    );
  }, [prodLogs, activeOrder, curMachine]);

  // Calculations matching KnitKhata.html
  const usedCols = useMemo(() => {
    return Array.from({ length: cols }, (_, i) => i).filter(
      (i) => Boolean(rollNums[i]) || parseNum(weights[i]) > 0
    );
  }, [cols, rollNums, weights]);

  const inQty = Math.round(curLine.qty / (curLine.machines.length || 1));
  const outQty = usedCols.reduce((acc, i) => acc + parseNum(weights[i]), 0);

  const rollTotalFaults = (i: number): number => {
    return FAULTS.reduce((acc, f) => acc + parseNum(faultMap[f]?.[i]), 0);
  };

  const notOkCount = usedCols.filter((i) => rollTotalFaults(i) > 0).length;
  const slIndex = ms.findIndex((x) => x.m === curMachine.m) + 1;

  // Add more columns (+5)
  const handleAddMoreCols = () => {
    const newCount = cols + 5;
    setCols(newCount);
    setRollNums((prev) => {
      const arr = [...prev];
      for (let i = prev.length; i < newCount; i++) {
        arr.push(String(i + 1).padStart(3, '0'));
      }
      return arr;
    });
  };

  // Toggle edit and save
  const handleToggleEdit = async () => {
    if (editMode) {
      // Save grid changes to MySQL Database
      setIsSaving(true);
      try {
        const payloadRolls: any[] = [];
        for (let i = 0; i < cols; i++) {
          const wt = parseNum(weights[i]);
          const rollNo = rollNums[i];
          const faults: Record<string, number> = {};
          FAULTS.forEach((f) => {
            const cnt = parseNum(faultMap[f]?.[i]);
            if (cnt > 0) faults[f] = cnt;
          });

          if (wt > 0 || rollNo) {
            payloadRolls.push({
              seq: rollNo || String(i + 1).padStart(3, '0'),
              wt,
              op: operators[i] || (lastProdLog as any)?.operator_name || (lastProdLog as any)?.op || (lastProdLog as any)?.operator || '—',
              lot: (machineDbRolls[0] as any)?.lot || (machineDbRolls[0] as any)?.yarn_lot || (curLine.yarns && curLine.yarns[0]?.lot) || '—',
              shift: (lastProdLog as any)?.shift || (lastProdLog as any)?.sh || 'A',
              faults,
            });
          }
        }

        await saveJobCardGrid({
          order_no: activeOrder.id,
          machine_code: curMachine.m,
          placement_index: curMachine.i,
          rolls: payloadRolls,
          remarks,
        });

        setEditMode(false);
      } catch (err: any) {
        addToast({
          type: 'error',
          title: 'সেভ ব্যর্থ',
          message: err.message || 'জব কার্ড ডাটাবেজে সংরক্ষণ করা যায়নি।',
        });
      } finally {
        setIsSaving(false);
      }
    } else {
      setEditMode(true);
    }
  };

  // Print helper for Job Card document
  const handlePrintJobCard = () => {
    const jcEl = document.querySelector('.jc');
    if (!jcEl) {
      window.print();
      return;
    }
    const printArea = document.getElementById('printArea');
    if (printArea) {
      printArea.innerHTML = jcEl.outerHTML;
      document.body.classList.add('printing');
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing');
        printArea.innerHTML = '';
      }, 600);
    } else {
      window.print();
    }
  };

  // Print helper for Roll Stickers
  const handlePrintStickers = () => {
    const stkGridEl = document.querySelector('#jcStk .stk-grid');
    if (!stkGridEl) return;
    const printArea = document.getElementById('printArea');
    if (printArea) {
      printArea.innerHTML = `
        <div style="padding: 16px;">
          <h3 style="margin-bottom: 12px;">রোল স্টিকার · ${activeOrder.id} (${curMachine.m})</h3>
          ${stkGridEl.outerHTML}
        </div>
      `;
      document.body.classList.add('printing');
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing');
        printArea.innerHTML = '';
      }, 600);
    } else {
      window.print();
    }
  };

  if (!activeOrder) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)', marginBottom: 16 }}>কোনো অর্ডার পাওয়া যায়নি।</p>
        <button className="btn pri" onClick={() => navigate('/dashboard/neworder')}>
          + New Order Entry
        </button>
      </div>
    );
  }

  return (
    <div className="jobcard-page" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 40 }}>
      {/* 1. HEADER MATCHING KnitKhata.html */}
      <div className="head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2>জব কার্ড</h2>
          <p>
            মেশিন অ্যাসাইন হলেই প্রতিটা মেশিনের জব কার্ড তৈরি হয়। রোল নামলে নিচের QC ঘরে উঠে যায়, {isVendor ? 'আর আপনি এখানেই দেখেন কোন রোলে কী সমস্যা।' : 'আর ভেন্ডরও সাথে সাথে দেখে কোন রোলে কী সমস্যা।'}
          </p>
        </div>
        {!isVendor && (
          <div className="st-sw" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>QR রোল স্টিকার (ঐচ্ছিক)</span>
            <button
              className={`switch ${stickerOn ? 'on' : ''}`}
              type="button"
              id="stkSw"
              onClick={() => {
                setStickerOn(!stickerOn);
                addToast({
                  type: 'info',
                  message: !stickerOn ? 'QR স্টিকার চালু হলো' : 'QR স্টিকার বন্ধ · রোল নম্বর হাতে লিখে চলবে',
                });
              }}
              aria-pressed={stickerOn}
              aria-label="QR রোল স্টিকার চালু বা বন্ধ"
            />
            <span className="small muted" style={{ fontSize: 12 }}>
              {stickerOn ? 'চালু' : 'বন্ধ, হাতে লিখে চলবে'}
            </span>
          </div>
        )}
      </div>

      {/* 2. ORDER SELECTOR & MACHINE CHIPS IN SAME ROW */}
      <div className="row" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, margin: '8px 0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>অর্ডার:</span>
          <SearchableSelect
            id="jcO"
            value={selectedOrderId}
            onChange={(val) => {
              setSelectedOrderId(val);
              setSelectedMachine('');
              setEditMode(false);
            }}
            options={validOrders.map((o) => ({
              value: o.id,
              label: `${o.id} ${o.party ? `· ${o.party}` : ''} ${o.buyer ? `(${o.buyer})` : ''}`.trim(),
            }))}
            searchPlaceholder="অর্ডার বা ভেন্ডর খুঁজুন..."
            style={{ width: 280 }}
          />
        </div>

        {/* 3. MACHINE CHIPS MATCHING KnitKhata.html in SAME ROW */}
        <div className="chips" id="jcM" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: 0, position: 'static' }}>
          {ms.map((x, idx) => {
            const isSelected = x.m === curMachine.m;
            const partLine = lines[x.i];
            const colorVar = `var(--l${(x.i % 5) + 1})`;

            return (
              <button
                key={`${x.m}-${idx}`}
                type="button"
                className={isSelected ? 'on' : ''}
                data-m={x.m}
                onClick={() => {
                  setSelectedMachine(x.m);
                  setEditMode(false);
                }}
                style={{
                  '--c': colorVar,
                  position: 'static',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  padding: '6px 14px',
                  borderRadius: 999,
                  fontSize: '0.88rem',
                  fontWeight: isSelected ? 600 : 500,
                } as React.CSSProperties}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: colorVar, display: 'inline-block' }} />
                {x.m} · {partLine?.place || 'Body'}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. THE JOB CARD PAPER SHEET (.jc) MATCHING KnitKhata.html */}
      <div className="jc">
        {/* Job Card Header (.jc-h) */}
        <div className="jc-h">
          <div>
            <b>{factoryProfile?.name || 'রহমান নিটিং ইন্ডাস্ট্রিজ'}</b>
            <span>{factoryProfile?.address || 'কোনাবাড়ি, গাজীপুর'}</span>
            <em>জব কার্ড</em>
          </div>
          <div className="jc-r">
            <div className="row no-pdf jc-tools">
              <button className="btn sm no-pdf prn-btn" type="button" onClick={handlePrintJobCard}>
                🖨️ প্রিন্ট
              </button>
            </div>
            <QrCodeSvg value={`${activeOrder.id}-${curMachine.m}`} size={78} />
          </div>
        </div>

        {/* Facts Grid (.jc-g) matching KnitKhata.html */}
        <div className="jc-g">
          <div>
            <span>SL / লট নং</span>
            <b className="mono">
              {slIndex} / ({ms.length})
            </b>
          </div>
          <div>
            <span>ভেন্ডর</span>
            <b>{vendorName}</b>
          </div>
          <div>
            <span>অর্ডার নং</span>
            <b className="mono">{activeOrder.id}</b>
          </div>
          <div>
            <span>অংশ</span>
            <b>
              {curLine.place} · {curLine.fab}{' '}
              {curLine.kt === 'f' ? (
                <span className="kb kb-f" style={{ marginLeft: 4 }}>ফ্ল্যাট নিট</span>
              ) : null}
              {curLine.yd ? (
                <span className="kb kb-y" style={{ marginLeft: 4 }}>Y/D</span>
              ) : (
                <span className="kb" style={{ marginLeft: 4 }}>গ্রে</span>
              )}
            </b>
          </div>
          <div>
            <span>বায়ার</span>
            <b>{activeOrder.buyer || '—'}</b>
          </div>
          <div>
            <span>মেশিন</span>
            <b className="mono">
              {curMachine.m} · {curLine.dia || (activeOrder as any).dia || '30" × 24G'}
            </b>
          </div>
          <div>
            <span>তারিখ</span>
            <b className="mono">
              {(() => {
                const rawDate =
                  (lastProdLog as any)?.date_label ||
                  (lastProdLog as any)?.d ||
                  (lastProdLog as any)?.date ||
                  (machineDbRolls[0] as any)?.date_label ||
                  (machineDbRolls[0] as any)?.d ||
                  activeOrder.orderDate;
                if (!rawDate) return '—';
                const s = String(rawDate);
                return s.includes('202') ? s : `${s} 2026`;
              })()}
            </b>
          </div>
          <div>
            <span>শিফট</span>
            <b>{lastProdLog ? (lastProdLog as any).shift || (lastProdLog as any).sh : (machineDbRolls[0] as any)?.shift || 'A'}</b>
          </div>
          <div>
            <span>অপারেটর</span>
            <b>
              {(lastProdLog &&
                ((lastProdLog as any).operator_name ||
                  (lastProdLog as any).op ||
                  (lastProdLog as any).operator)) ||
                (machineDbRolls[0] as any)?.operator_name ||
                (machineDbRolls[0] as any)?.op ||
                operators.find((op) => Boolean(op)) ||
                '—'}
            </b>
          </div>
          <div>
            <span>সুতা লট</span>
            <b className="mono">
              {(machineDbRolls[0] as any)?.lot ||
                (machineDbRolls[0] as any)?.yarn_lot ||
                (curLine.yarns && curLine.yarns[0]?.lot) ||
                '—'}
            </b>
          </div>
          <div>
            <span>ইন কোয়ান্টিটি</span>
            <b className="mono">
              {bnNum(inQty)} {curLine.unit === 'pcs' || curLine.kt === 'f' ? 'পিস' : 'kg'}
            </b>
          </div>
          <div>
            <span>আউট কোয়ান্টিটি</span>
            <b className="mono">
              {bnNum(Math.round(outQty))} kg · {usedCols.length} রোল
            </b>
          </div>
          <div>
            <span>সমস্যাযুক্ত রোল (Not OK)</span>
            <b className="mono" style={{ color: notOkCount > 0 ? 'var(--bad, #b91c1c)' : 'inherit' }}>
              {notOkCount}
            </b>
          </div>
          <div>
            <span>বাকি (WIP)</span>
            <b className="mono">{bnNum(Math.max(0, inQty - Math.round(outQty)))} kg</b>
          </div>
        </div>

        {/* QC Heading (.jc-qh) matching KnitKhata.html */}
        <div className="jc-qh" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <b>রোল অনুযায়ী QC</b>
          <span className="row no-pdf">
            <button
              className="btn sm"
              id="jcEdit"
              type="button"
              onClick={handleToggleEdit}
              disabled={isSaving}
              style={{
                background: editMode ? 'var(--ok, #10b981)' : 'var(--surface)',
                color: editMode ? '#ffffff' : 'inherit',
                border: '1px solid var(--border)',
                fontWeight: 600,
              }}
            >
              {isSaving ? 'সেভ হচ্ছে...' : editMode ? 'সেভ করুন' : 'ফল্ট লিখুন'}
            </button>
          </span>
        </div>

        {/* Table (.tw > table.jc-t) matching KnitKhata.html */}
        <div className="tw" style={{ overflowX: 'auto' }}>
          <table className="jc-t" style={{ width: '100%', minWidth: 640 }}>
            <tbody>
              {/* Roll Numbers */}
              <tr className="jc-roll">
                <td style={{ fontWeight: 600 }}>রোল নং</td>
                {Array.from({ length: cols }, (_, i) => (
                  <td key={`r-${i}`} className="n mono">
                    {editMode ? (
                      <input
                        className="jc-in"
                        value={rollNums[i] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRollNums((prev) => {
                            const arr = [...prev];
                            arr[i] = val;
                            return arr;
                          });
                        }}
                        style={{ width: '100%', minWidth: 42, textAlign: 'center', padding: '2px 4px', fontSize: 12 }}
                      />
                    ) : (
                      rollNums[i] || ''
                    )}
                  </td>
                ))}
              </tr>

              {/* Weight Row */}
              <tr>
                <td style={{ fontWeight: 600 }}>ওজন (kg)</td>
                {Array.from({ length: cols }, (_, i) => (
                  <td key={`w-${i}`} className="n mono">
                    {editMode ? (
                      <input
                        className="jc-in"
                        type="number"
                        step="0.1"
                        value={weights[i] ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWeights((prev) => {
                            const arr = [...prev];
                            arr[i] = val;
                            return arr;
                          });
                        }}
                        style={{ width: '100%', minWidth: 42, textAlign: 'center', padding: '2px 4px', fontSize: 12 }}
                      />
                    ) : (
                      weights[i] || ''
                    )}
                  </td>
                ))}
              </tr>

              {/* All 16 Fault Rows matching KnitKhata.html */}
              {FAULTS.map((fault) => (
                <tr key={fault}>
                  <td>{fault}</td>
                  {Array.from({ length: cols }, (_, i) => {
                    const cnt = parseNum(faultMap[fault]?.[i]);
                    return editMode ? (
                      <td key={`${fault}-${i}`} className="n">
                        <input
                          className="jc-in"
                          type="number"
                          min="0"
                          value={faultMap[fault]?.[i] ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFaultMap((prev) => {
                              const fArr = [...(prev[fault] || [])];
                              fArr[i] = val;
                              return { ...prev, [fault]: fArr };
                            });
                          }}
                          style={{ width: '100%', minWidth: 38, textAlign: 'center', padding: '2px 4px', fontSize: 12 }}
                        />
                      </td>
                    ) : (
                      <td key={`${fault}-${i}`} className={`n ${cnt > 0 ? 'jc-bad' : ''}`}>
                        {cnt > 0 ? cnt : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Total Faults Row (.jc-tot) */}
              <tr className="jc-tot" style={{ fontWeight: 700, borderTop: '2px solid var(--paper-ink)' }}>
                <td>মোট ফল্ট</td>
                {Array.from({ length: cols }, (_, i) => {
                  const tot = rollTotalFaults(i);
                  const hasRoll = Boolean(rollNums[i]) || parseNum(weights[i]) > 0;
                  return (
                    <td key={`tot-${i}`} className={`n ${tot > 0 ? 'jc-bad' : ''}`}>
                      {hasRoll ? tot : ''}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Remarks Box (.jc-remb) */}
        <div className="jc-remb" style={{ marginTop: 12 }}>
          <b>মন্তব্য</b>
          {editMode ? (
            <textarea
              className="jc-ta"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="যেমন: রোল ৭-এ হোল, নিডল বদলানো হয়েছে"
              style={{ width: '100%', minHeight: 60, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--paper-line)', marginTop: 4, fontFamily: 'inherit' }}
            />
          ) : (
            <div className="jc-remt" style={{ minHeight: 24, color: remarks ? 'inherit' : 'var(--muted)', marginTop: 4 }}>
              {remarks || 'কোনো মন্তব্য নেই'}
            </div>
          )}
        </div>

        {/* Bottom helper row */}
        <div className="row no-pdf" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
          <span className="small muted" style={{ fontSize: 12 }}>
            প্রোডাকশন এন্ট্রিতে রোল লিখলে এখানে নিজে থেকে উঠে যায়। চাইলে কাগজের ব্যাচ কার্ডের মতো হাতেও লেখা যায়। "ফল্ট লিখুন" চাপলে ঘরগুলো লেখা যায়।
          </span>
          <button className="btn sm" id="jcMore" type="button" onClick={handleAddMoreCols}>
            + আরও ৫টা রোল যোগ করুন
          </button>
        </div>
      </div>

      {/* 5. STICKER SECTION (#jcStk) MATCHING KnitKhata.html */}
      {stickerOn && machineDbRolls.length > 0 && (
        <div className="card" id="jcStk" style={{ marginTop: 8 }}>
          <div className="row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>এই মেশিনের রোল স্টিকার</h3>
            <button className="btn sm no-pdf" type="button" onClick={handlePrintStickers}>
              🖨️ স্টিকার প্রিন্ট
            </button>
          </div>
          <p className="small muted" style={{ margin: '-4px 0 12px', fontSize: 12 }}>
            স্টিকার ব্যবহার ঐচ্ছিক। আসল অ্যাপে এখান থেকে প্রিন্ট হবে।
          </p>
          <div className="stk-grid">
            {machineDbRolls.slice(-4).map((r: any, idx: number) => {
              const rollCode = r.no || r.roll_no || `${curMachine.m}/${r.jc || r.jc_seq || '001'}`;
              return (
                <div key={r.id || idx} className="stk">
                  <QrCodeSvg value={rollCode} size={64} />
                  <div className="stk-t" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <b className="mono" style={{ fontSize: 14 }}>{rollCode}</b>
                    <span style={{ fontSize: 12 }}>{activeOrder.id} · {vendorName}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{curLine.place} · {curLine.fab}</span>
                    <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>
                      {r.kg || r.weight_kg} kg · {r.lot || r.yarn_lot || (curLine.yarns && curLine.yarns[0]?.lot) || '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
