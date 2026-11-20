import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { SearchableOperatorSelect } from '@/components';
import { SearchableSelect } from '@/components/common/SearchableSelect';

// 16 FAULTS matching KnitKhata.html
export const FAULTS = [
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
] as const;

export const SHIFTS: [string, string][] = [
  ['A', 'A (দিন)'],
  ['B', 'B (রাত)'],
  ['C', 'C'],
];

export const ISSUES: [string, string][] = [
  ['', 'না'],
  ...FAULTS.map((f) => [f, f] as [string, string]),
  ['other', 'অন্যান্য'],
];

export const ISS_PH: Record<string, string> = {
  Hole: 'যেমন: ৩টা হোল, রোল নং ১২',
  'Needle Mark': 'যেমন: ২টা রোলে নিডল দাগ, নিডল বদলানো হয়েছে',
  'Needle Broken': 'যেমন: ২টা নিডল ভাঙা, বদলানো হয়েছে',
  'Patta (Barre)': 'যেমন: রোল ৮ থেকে পাট্টা দেখা যাচ্ছে, লট মিক্স সন্দেহ',
  'Oil Spot': 'যেমন: ৪টা অয়েল স্পট, রোল নং ৫',
  'Lycra Out': 'যেমন: ১টা রোলে লাইক্রা আউট, ৩ মিটার',
  'Missing Yarn': 'যেমন: একটা ফিডারে সুতা ছিঁড়ে ছিল',
  'Thick Thin': 'যেমন: সুতায় থিক-থিন ফল্ট বেশি',
  other: 'সমস্যার বিবরণ লিখুন',
};

// Bengali numeral converter
function bnNum(n: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(n).replace(/\d/g, (d) => bnDigits[parseInt(d, 10)]);
}

function parseBnFloat(val: any): number {
  if (val == null || val === '') return 0;
  const cleaned = String(val).replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function parseBnInt(val: any): number {
  if (val == null || val === '') return 0;
  const cleaned = String(val).replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
  const n = parseInt(cleaned, 10);
  return isNaN(n) ? 0 : n;
}

function pad3(n: number): string {
  return String(n).padStart(3, '0');
}

export interface OrderLineNormalized {
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

export function normalizeOrderLines(o: any): OrderLineNormalized[] {
  if (!o) return [];
  if (!o.lines || !o.lines.length) {
    return [
      {
        place: 'Body',
        fab: o.fabric || 'Single Jersey',
        color: o.color || '—',
        qty: Number(o.qty || o.total_qty_kg || o.totalKg || 0),
        done: Number(o.done || o.done_kg || 0),
        dia: o.dia || o.dia_gauge || '30" × 24G',
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
      dia: l.dia || l.dia_gauge || o.dia || o.dia_gauge || '30" × 24G',
      kt: (l.kt || l.knit_type || 'c') as 'c' | 'f',
      yd: Boolean(l.yd || l.is_yarn_dyed),
      unit: l.unit || 'kg',
      machines: machinesList,
      yarns: Array.isArray(l.yarns) ? l.yarns : [],
    };
  });
}

// Inline QR code component (SVG)
const QrCodeSvg: React.FC<{ value: string; size?: number }> = ({ value, size = 64 }) => {
  const hash = value.split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 1000000007, 0);
  const matrixSize = 21;
  const cells: boolean[][] = [];

  for (let r = 0; r < matrixSize; r++) {
    cells[r] = [];
    for (let c = 0; c < matrixSize; c++) {
      const isCorner1 = r < 7 && c < 7;
      const isCorner2 = r < 7 && c >= matrixSize - 7;
      const isCorner3 = r >= matrixSize - 7 && c < 7;

      if (isCorner1 || isCorner2 || isCorner3) {
        const borderR = isCorner3 ? r - (matrixSize - 7) : r;
        const borderC = isCorner2 ? c - (matrixSize - 7) : c;
        const isOuter = borderR === 0 || borderR === 6 || borderC === 0 || borderC === 6;
        const isInner = borderR >= 2 && borderR <= 4 && borderC >= 2 && borderC <= 4;
        cells[r][c] = isOuter || isInner;
      } else {
        const seed = (hash + r * 37 + c * 17) % 100;
        cells[r][c] = seed > 48;
      }
    }
  }

  const cellSize = size / matrixSize;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="qr" style={{ flexShrink: 0, background: '#ffffff', borderRadius: 4, padding: 2 }}>
      {cells.map((row, r) =>
        row.map((active, c) =>
          active ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill="currentColor"
            />
          ) : null
        )
      )}
    </svg>
  );
};

interface FaultItem {
  fault: string;
  count: number;
}

interface RollEntryState {
  jc: string;
  weight: string;
  operator: string;
  faults: FaultItem[];
}

interface MachineRowState {
  key: string;
  machine: string;
  // Circular
  rollsCount: string;
  totalKg: string;
  operator: string;
  sameOperator: boolean;
  rolls: RollEntryState[];
  // Flat
  flatPieces: string;
  flatBundles: string;
  flatOperator: string;
  flatIssue: string;
  flatIssueDesc: string;
}

interface YarnEntryState {
  count: string;
  brand: string;
  lot: string;
}

interface LineFormState {
  placementIndex: number;
  machines: MachineRowState[];
  yarns: YarnEntryState[];
  yarnSrc: string;
}

export const FactoryProductionEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    orders,
    parties,
    prodLogs,
    operators,
    fetchOperators,
    machines: domainMachines,
    fetchOrders,
    saveShiftProduction,
    addToast,
  } = useApp();

  // Load orders and operators on mount
  useEffect(() => {
    fetchOrders?.();
    fetchOperators?.();
  }, []);

  // Filter open (running / draft / pending) orders
  const openOrders = useMemo(() => {
    const list = orders.filter((o) => (o.status as string) !== 'done' && o.status !== 'Completed');
    return list.length > 0 ? list : orders;
  }, [orders]);

  // Unique vendors from open orders
  const vendorKeys = useMemo(() => {
    const set = new Set<string>();
    openOrders.forEach((o) => {
      const vKey = o.party_code || (o as any).v || (o.party_id ? String(o.party_id) : o.party);
      if (vKey) set.add(vKey);
    });
    return Array.from(set);
  }, [openOrders]);

  // Step 1: Selection State
  const [selectedVendorKey, setSelectedVendorKey] = useState<string>(() => vendorKeys[0] || '');

  // Keep vendor key valid
  useEffect(() => {
    if (!vendorKeys.includes(selectedVendorKey) && vendorKeys[0]) {
      setSelectedVendorKey(vendorKeys[0]);
    }
  }, [vendorKeys, selectedVendorKey]);

  // Orders under selected vendor
  const vendorOrders = useMemo(() => {
    return openOrders.filter((o) => {
      const vKey = o.party_code || (o as any).v || (o.party_id ? String(o.party_id) : o.party);
      return vKey === selectedVendorKey;
    });
  }, [openOrders, selectedVendorKey]);

  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  useEffect(() => {
    if (!vendorOrders.some((o) => o.id === selectedOrderId)) {
      setSelectedOrderId(vendorOrders[0]?.id || '');
    }
  }, [vendorOrders, selectedOrderId]);

  // Form Date and Shift
  const [entryDate, setEntryDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [entryShift, setEntryShift] = useState<string>('A');
  const [showStickersOnSave, setShowStickersOnSave] = useState<boolean>(true);
  const [newRolls, setNewRolls] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Active Order
  const activeOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || vendorOrders[0] || openOrders[0];
  }, [orders, vendorOrders, openOrders, selectedOrderId]);

  // Normalized lines of active order
  const normalizedLines = useMemo(() => normalizeOrderLines(activeOrder), [activeOrder]);

  // Available free/working machine codes
  const availableMachines = useMemo(() => {
    const mCodes = domainMachines.map((m: any) => m.code || m.id).filter(Boolean);
    if (!mCodes.length) {
      return Array.from({ length: 12 }, (_, i) => `M-${String(i + 1).padStart(2, '0')}`);
    }
    return mCodes;
  }, [domainMachines]);

  // Operator suggestion list from production logs
  const operatorSuggestions = useMemo(() => {
    const ops = new Set<string>();
    prodLogs.forEach((p: any) => {
      const name = p.op || p.operator_name || p.operator;
      if (name && name !== '—') ops.add(name);
    });
    return Array.from(ops);
  }, [prodLogs]);

  // Filter operators by selected shift (Shift A -> only Shift A operators, etc.)
  const shiftOperators = useMemo(() => {
    const curShift = String(entryShift || '').trim().toUpperCase();
    const filtered = operators.filter((op) => {
      if (op.status === 'inactive') return false;
      const opShift = String(op.shift || '').trim().toUpperCase();
      return opShift === curShift;
    });
    return filtered.length > 0 ? filtered : operators.filter((op) => op.status !== 'inactive');
  }, [operators, entryShift]);

  // Find last or assigned operator for machine matching active shift
  const getLastOperator = (machineCode: string, shift: string = entryShift): string => {
    const curShift = String(shift || '').trim().toUpperCase();
    // 1. Operator assigned to this machine from operators table in this shift
    const assigned = operators.find(
      (op) =>
        op.machine_assigned === machineCode &&
        op.status !== 'inactive' &&
        String(op.shift || '').trim().toUpperCase() === curShift
    );
    if (assigned) return assigned.name;

    // 2. Operators matching current shift
    const shiftOps = operators.filter(
      (op) =>
        op.status !== 'inactive' &&
        String(op.shift || '').trim().toUpperCase() === curShift
    );

    // 3. Last logged operator on this machine if in this shift
    const p = prodLogs.find(
      (x: any) =>
        (x.m === machineCode || x.machine_code === machineCode) &&
        (x.sh === shift || !x.sh) &&
        (x.op || x.operator_name)
    );
    const logOp = (p as any)?.op || (p as any)?.operator_name || '';
    if (logOp && shiftOps.some((o) => o.name === logOp)) return logOp;

    return shiftOps[0]?.name || operators[0]?.name || logOp || '';
  };

  // Find next roll number for (order, machine)
  const getNextRollSeq = (orderId: string, machineCode: string): number => {
    let maxNum = 0;
    prodLogs.forEach((p: any) => {
      if ((p.o === orderId || p.order_no === orderId) && (p.m === machineCode || p.machine_code === machineCode)) {
        const seq = parseInt(p.jc || p.jc_seq || '0', 10);
        if (!isNaN(seq) && seq > maxNum) maxNum = seq;
      }
    });
    return maxNum + 1;
  };

  // Line Forms State
  const [lineForms, setLineForms] = useState<LineFormState[]>([]);

  // Initialize line forms when active order changes
  useEffect(() => {
    if (!activeOrder) {
      setLineForms([]);
      return;
    }

    const forms: LineFormState[] = normalizedLines.map((line, idx: number) => {
      const assignedMs = line.machines.length > 0 ? line.machines : ['M-01'];

      // Find last yarns used for this line from logs
      const prevLog = prodLogs.find(
        (x: any) => (x.o === activeOrder.id || x.order_no === activeOrder.id) && ((x.pl ?? 0) === idx)
      );

      let yarnsList: YarnEntryState[] = [];
      let yarnSrcText = 'অর্ডার থেকে';

      if (prevLog && (prevLog as any).yarns && (prevLog as any).yarns.length) {
        yarnSrcText = `আগের এন্ট্রি থেকে · ${(prevLog as any).d || (prevLog as any).date_label}, শিফট ${(prevLog as any).sh || (prevLog as any).shift}`;
        yarnsList = (prevLog as any).yarns.map((y: any) => ({
          count: y.count === '—' ? '' : y.count || '',
          brand: y.brand === '—' ? '' : y.brand || '',
          lot: y.lot === 'অপেক্ষমাণ' || y.lot === '—' ? '' : y.lot || '',
        }));
      } else if (line.yarns && line.yarns.length) {
        yarnsList = line.yarns.map((y: any) => ({
          count: y.count === '—' ? '' : y.count || '',
          brand: y.brand === '—' ? '' : y.brand || '',
          lot: y.lot === 'অপেক্ষমাণ' || y.lot === '—' ? '' : y.lot || '',
        }));
      } else {
        yarnsList = [{ count: '', brand: '', lot: '' }];
      }

      const initialMachines: MachineRowState[] = assignedMs.map((mCode: string, mIdx: number) => ({
        key: `${idx}-${mIdx}-${Date.now()}`,
        machine: mCode,
        rollsCount: '',
        totalKg: '',
        operator: getLastOperator(mCode),
        sameOperator: true,
        rolls: [],
        flatPieces: '',
        flatBundles: '',
        flatOperator: getLastOperator(mCode),
        flatIssue: '',
        flatIssueDesc: '',
      }));

      return {
        placementIndex: idx,
        machines: initialMachines,
        yarns: yarnsList,
        yarnSrc: yarnSrcText,
      };
    });

    setLineForms(forms);
    setNewRolls([]);
    setErrorMessage('');
  }, [activeOrder?.id, normalizedLines]);

  // Synchronize machine operator selection when entryShift changes
  useEffect(() => {
    if (!shiftOperators.length) return;
    setLineForms((prev) =>
      prev.map((line) => ({
        ...line,
        machines: line.machines.map((mRow) => {
          const isOpInShift = shiftOperators.some((o) => o.name === mRow.operator);
          const nextOp = isOpInShift
            ? mRow.operator
            : (getLastOperator(mRow.machine, entryShift) || shiftOperators[0]?.name || '');

          const isFlatOpInShift = shiftOperators.some((o) => o.name === mRow.flatOperator);
          const nextFlatOp = isFlatOpInShift
            ? mRow.flatOperator
            : (getLastOperator(mRow.machine, entryShift) || shiftOperators[0]?.name || '');

          return {
            ...mRow,
            operator: nextOp,
            flatOperator: nextFlatOp,
            rolls: mRow.rolls.map((r) => {
              if (mRow.sameOperator) {
                return { ...r, operator: nextOp };
              }
              const isRollOpInShift = shiftOperators.some((o) => o.name === r.operator);
              return {
                ...r,
                operator: isRollOpInShift ? r.operator : nextOp,
              };
            }),
          };
        }),
      }))
    );
  }, [entryShift, shiftOperators]);

  // Update roll count and sync roll rows
  const handleRollsCountChange = (
    lineIdx: number,
    machineIdx: number,
    countVal: string
  ) => {
    setLineForms((prev) => {
      const next = [...prev];
      const line = { ...next[lineIdx] };
      const machines = [...line.machines];
      const mRow = { ...machines[machineIdx] };

      mRow.rollsCount = countVal;
      const count = Math.min(80, Math.max(0, parseBnInt(countVal)));

      const nextStartSeq = getNextRollSeq(activeOrder?.id || '', mRow.machine);
      const currentRolls = [...mRow.rolls];

      if (currentRolls.length < count) {
        for (let i = currentRolls.length; i < count; i++) {
          currentRolls.push({
            jc: pad3(nextStartSeq + i),
            weight: '',
            operator: mRow.operator || '',
            faults: [],
          });
        }
      } else if (currentRolls.length > count) {
        currentRolls.length = count;
      }

      mRow.rolls = currentRolls;
      machines[machineIdx] = mRow;
      line.machines = machines;
      next[lineIdx] = line;
      return next;
    });
  };

  // Update total kg
  const handleTotalKgChange = (lineIdx: number, machineIdx: number, kgVal: string) => {
    setLineForms((prev) => {
      const next = [...prev];
      const line = { ...next[lineIdx] };
      const machines = [...line.machines];
      machines[machineIdx] = { ...machines[machineIdx], totalKg: kgVal };
      line.machines = machines;
      next[lineIdx] = line;
      return next;
    });
  };

  // Update machine operator
  const handleMachineOperatorChange = (
    lineIdx: number,
    machineIdx: number,
    opVal: string
  ) => {
    setLineForms((prev) => {
      const next = [...prev];
      const line = { ...next[lineIdx] };
      const machines = [...line.machines];
      const mRow = { ...machines[machineIdx] };
      mRow.operator = opVal;
      if (mRow.sameOperator) {
        mRow.rolls = mRow.rolls.map((r) => ({ ...r, operator: opVal }));
      }
      machines[machineIdx] = mRow;
      line.machines = machines;
      next[lineIdx] = line;
      return next;
    });
  };

  // Toggle same operator checkbox
  const handleToggleSameOperator = (lineIdx: number, machineIdx: number) => {
    setLineForms((prev) => {
      const next = [...prev];
      const line = { ...next[lineIdx] };
      const machines = [...line.machines];
      const mRow = { ...machines[machineIdx] };
      const nextSame = !mRow.sameOperator;
      mRow.sameOperator = nextSame;
      if (nextSame) {
        mRow.rolls = mRow.rolls.map((r) => ({ ...r, operator: mRow.operator }));
      }
      machines[machineIdx] = mRow;
      line.machines = machines;
      next[lineIdx] = line;
      return next;
    });
  };

  // Update specific roll row field
  const handleRollFieldChange = (
    lineIdx: number,
    machineIdx: number,
    rollIdx: number,
    field: 'jc' | 'weight' | 'operator',
    value: string
  ) => {
    setLineForms((prev) => {
      const next = [...prev];
      const line = { ...next[lineIdx] };
      const machines = [...line.machines];
      const mRow = { ...machines[machineIdx] };
      const rolls = [...mRow.rolls];
      rolls[rollIdx] = { ...rolls[rollIdx], [field]: value };
      mRow.rolls = rolls;
      machines[machineIdx] = mRow;
      line.machines = machines;
      next[lineIdx] = line;
      return next;
    });
  };

  // Add fault to roll
  const handleAddFault = (lineIdx: number, machineIdx: number, rollIdx: number) => {
    setLineForms((prev) => {
      const next = [...prev];
      const line = { ...next[lineIdx] };
      const machines = [...line.machines];
      const mRow = { ...machines[machineIdx] };
      const rolls = [...mRow.rolls];
      const roll = { ...rolls[rollIdx] };
      roll.faults = [...roll.faults, { fault: 'Hole', count: 1 }];
      rolls[rollIdx] = roll;
      mRow.rolls = rolls;
      machines[machineIdx] = mRow;
      line.machines = machines;
      next[lineIdx] = line;
      return next;
    });
  };

  // Update fault on roll
  const handleUpdateFault = (
    lineIdx: number,
    machineIdx: number,
    rollIdx: number,
    faultIdx: number,
    fault: string,
    count: number
  ) => {
    setLineForms((prev) => {
      const next = [...prev];
      const line = { ...next[lineIdx] };
      const machines = [...line.machines];
      const mRow = { ...machines[machineIdx] };
      const rolls = [...mRow.rolls];
      const roll = { ...rolls[rollIdx] };
      const faults = [...roll.faults];
      faults[faultIdx] = { fault, count };
      roll.faults = faults;
      rolls[rollIdx] = roll;
      mRow.rolls = rolls;
      machines[machineIdx] = mRow;
      line.machines = machines;
      next[lineIdx] = line;
      return next;
    });
  };

  // Add another machine to line
  const handleAddMachineToLine = (lineIdx: number) => {
    setLineForms((prev) => {
      const next = [...prev];
      const line = { ...next[lineIdx] };
      const machines = [...line.machines];
      const defaultOp = operators[0]?.name || '';
      machines.push({
        key: `${lineIdx}-${machines.length}-${Date.now()}`,
        machine: '',
        rollsCount: '',
        totalKg: '',
        operator: defaultOp,
        sameOperator: true,
        rolls: [],
        flatPieces: '',
        flatBundles: '',
        flatOperator: defaultOp,
        flatIssue: '',
        flatIssueDesc: '',
      });
      line.machines = machines;
      next[lineIdx] = line;
      return next;
    });
  };

  // Update flat knit fields
  const handleFlatFieldChange = (
    lineIdx: number,
    machineIdx: number,
    field: 'flatPieces' | 'flatBundles' | 'flatOperator' | 'flatIssue' | 'flatIssueDesc',
    val: string
  ) => {
    setLineForms((prev) => {
      const next = [...prev];
      const line = { ...next[lineIdx] };
      const machines = [...line.machines];
      machines[machineIdx] = { ...machines[machineIdx], [field]: val };
      line.machines = machines;
      next[lineIdx] = line;
      return next;
    });
  };

  // Update yarn fields
  const handleYarnChange = (
    lineIdx: number,
    yarnIdx: number,
    field: 'count' | 'brand' | 'lot',
    val: string
  ) => {
    setLineForms((prev) => {
      const next = [...prev];
      const line = { ...next[lineIdx] };
      const yarns = [...line.yarns];
      yarns[yarnIdx] = { ...yarns[yarnIdx], [field]: val };
      line.yarns = yarns;
      next[lineIdx] = line;
      return next;
    });
  };

  // Print roll stickers
  const handlePrintStickers = () => {
    window.print();
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!activeOrder) {
      setErrorMessage('অনুগ্রহ করে একটি অর্ডার নির্বাচন করুন।');
      return;
    }

    const payloadRows: any[] = [];
    const badFields: string[] = [];

    lineForms.forEach((lForm) => {
      const lineData = normalizedLines[lForm.placementIndex] || {
        place: 'Body',
        kt: 'c',
      };
      const isFlat = lineData.kt === 'f';

      // Yarn lot summary for line
      const yarnLotSummary = lForm.yarns
        .map((y) => y.lot.trim())
        .filter(Boolean)
        .join(' + ') || '—';

      lForm.machines.forEach((mRow) => {
        const mCode = mRow.machine.trim();
        const where = `${lineData.place || 'অংশ'} · ${mCode || 'মেশিন'}`;

        if (isFlat) {
          const pcs = parseBnFloat(mRow.flatPieces);
          if (pcs <= 0 && !mRow.flatPieces.trim()) {
            return; // Not filled, skip
          }
          if (pcs <= 0) {
            badFields.push(`${where}-এর পিস সংখ্যা লিখুন`);
          }
          if (!mCode) {
            badFields.push(`${lineData.place}-এর মেশিন নির্বাচন করুন`);
          }
          if (mRow.flatIssue && !mRow.flatIssueDesc.trim()) {
            badFields.push(`${where}-এর সমস্যার বিবরণ লিখুন`);
          }

          const flatOpName = mRow.flatOperator.trim();
          const flatOp = operators.find((o) => o.name === flatOpName);

          payloadRows.push({
            placement_index: lForm.placementIndex,
            machine_code: mCode || 'M-01',
            flat: true,
            qty_kg: pcs,
            rolls_count: parseBnInt(mRow.flatBundles) || 0,
            operator_name: flatOpName || '—',
            employee_id: flatOp?.id ?? null,
            yarn_lot: yarnLotSummary,
            issue: mRow.flatIssue,
            issue_desc: mRow.flatIssueDesc.trim(),
            rolls: [],
          });
        } else {
          // Circular knit
          const hasInput = Boolean(mRow.rollsCount.trim() || mRow.totalKg.trim() || mRow.rolls.length > 0);
          if (!hasInput) {
            return; // Empty machine row, skip
          }

          if (!mRow.rolls.length) {
            badFields.push(`${where}-এর কয়টা রোল নামল লিখুন`);
            return;
          }

          const rollSum = mRow.rolls.reduce((acc, r) => acc + parseBnFloat(r.weight), 0);
          const totalKg = parseBnFloat(mRow.totalKg);

          if (totalKg <= 0) {
            badFields.push(`${where}-এর মোট ওজন (kg) লিখুন`);
          }

          if (mRow.sameOperator && !mRow.operator.trim()) {
            badFields.push(`${where}-এর অপারেটরের নাম লিখুন`);
          }

          if (!mCode) {
            badFields.push(`${lineData.place}-এর মেশিন নির্বাচন করুন`);
          }

          // Check each roll weight
          mRow.rolls.forEach((r, rIdx) => {
            const w = parseBnFloat(r.weight);
            if (w <= 0) {
              badFields.push(`${where} · রোল ${r.jc || rIdx + 1}-এর ওজন লিখুন`);
            }
            if (!mRow.sameOperator && !r.operator.trim()) {
              badFields.push(`${where} · রোল ${r.jc || rIdx + 1}-এর অপারেটর লিখুন`);
            }
          });

          // Check weight sum match
          if (totalKg > 0 && Math.abs(totalKg - rollSum) >= 0.05 && mRow.rolls.every((r) => parseBnFloat(r.weight) > 0)) {
            const diff = +(totalKg - rollSum).toFixed(1);
            badFields.push(
              `${where}: রোলের ওজনের যোগফল (${rollSum.toFixed(1)} kg) মোট ওজনের (${totalKg} kg) সাথে মেলেনি (${diff > 0 ? `${diff} kg কম আছে` : `${-diff} kg বেশি`})`
            );
          }

          const rollsData = mRow.rolls.map((r) => {
            const faultsMap: Record<string, number> = {};
            r.faults.forEach((f) => {
              if (f.fault) {
                faultsMap[f.fault] = (faultsMap[f.fault] || 0) + (f.count || 1);
              }
            });

            const rollOpName = mRow.sameOperator ? mRow.operator.trim() : r.operator.trim();
            const rollOp = operators.find((o) => o.name === rollOpName);

            return {
              jc: r.jc || '001',
              kg: parseBnFloat(r.weight),
              op: rollOpName,
              employee_id: rollOp?.id ?? null,
              faults: faultsMap,
            };
          });

          const primaryOpName = mRow.sameOperator ? mRow.operator.trim() : mRow.rolls[0]?.operator || '—';
          const primaryOp = operators.find((o) => o.name === primaryOpName);

          payloadRows.push({
            placement_index: lForm.placementIndex,
            machine_code: mCode || 'M-01',
            flat: false,
            qty_kg: totalKg || rollSum,
            rolls_count: rollsData.length,
            operator_name: primaryOpName,
            employee_id: primaryOp?.id ?? null,
            yarn_lot: yarnLotSummary,
            rolls: rollsData,
          });
        }
      });
    });

    if (!payloadRows.length && !badFields.length) {
      setErrorMessage('অন্তত একটা মেশিনে কয়টা রোল নামল আর রোলের ওজন লিখুন।');
      return;
    }

    if (badFields.length > 0) {
      setErrorMessage(Array.from(new Set(badFields)).join(' · ') + ' — এগুলো ঠিক করুন।');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await saveShiftProduction({
        order_no: activeOrder.id,
        date: entryDate,
        date_label: new Date(entryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        shift: entryShift,
        rows: payloadRows,
      });

      if (res && res.new_rolls && res.new_rolls.length > 0) {
        if (showStickersOnSave) {
          setNewRolls(res.new_rolls);
        } else {
          setNewRolls([]);
        }
      }

      addToast({
        type: 'success',
        title: 'প্রোডাকশন সেভ হয়েছে',
        message: `${activeOrder.id} · ${payloadRows.length}টি মেশিনে প্রোডাকশন ডাটাবেজে সংরক্ষিত হয়েছে`,
      });

      // Reset roll inputs
      setLineForms((prev) =>
        prev.map((l) => ({
          ...l,
          machines: l.machines.map((m) => ({
            ...m,
            rollsCount: '',
            totalKg: '',
            rolls: [],
            flatPieces: '',
            flatBundles: '',
            flatIssue: '',
            flatIssueDesc: '',
          })),
        }))
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'প্রোডাকশন সেভ করতে সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find vendor name
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

  const activeTotalKg = Number((activeOrder as any)?.total_qty_kg || (activeOrder as any)?.qty || 0);
  const activeDoneKg = Number((activeOrder as any)?.done_kg || (activeOrder as any)?.done || 0);

  // Order summary metrics
  const orderDonePct = useMemo(() => {
    if (!activeTotalKg) return 0;
    return Math.min(100, Math.round((activeDoneKg / activeTotalKg) * 100));
  }, [activeTotalKg, activeDoneKg]);

  return (
    <div className="production-entry-page" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 40, width: '100%', maxWidth: '100%' }}>
      {/* 1. HEADER MATCHING KnitKhata.html */}
      <div className="head" style={{ width: '100%' }}>
        <div>
          <h2>প্রোডাকশন এন্ট্রি</h2>
          <p>ভেন্ডর আর অর্ডার বাছলেই সব অংশ, মেশিন আর সুতা নিজে থেকে চলে আসবে। শুধু প্রোডাকশন লিখুন।</p>
        </div>
      </div>

      {/* MAIN FORM */}
      {vendorKeys.length > 0 ? (
        <form id="pf" className="no-wrap" onSubmit={handleSubmit} noValidate style={{ maxWidth: '100%', width: '100%' }}>
          {/* STEP 1: কোন অর্ডার, কবে (.card) */}
          <div className="card">
            <h3>
              <span className="stp">১</span>কোন অর্ডার, কবে
            </h3>
            <div className="no-grid pe-top">
              <label className="no-f">
                <span>ভেন্ডর</span>
                <SearchableSelect
                  id="pV"
                  value={selectedVendorKey}
                  onChange={(val) => {
                    setSelectedVendorKey(val);
                    setSelectedOrderId('');
                  }}
                  options={vendorKeys.map((k) => {
                    const p = parties.find((party) => party.code === k || String(party.id) === k || party.name === k);
                    return {
                      value: k,
                      label: p?.name || k,
                    };
                  })}
                  searchPlaceholder="ভেন্ডর খুঁজুন..."
                />
              </label>

              <label className="no-f">
                <span>অর্ডার নং</span>
                <SearchableSelect
                  id="pO"
                  value={selectedOrderId}
                  onChange={(val) => setSelectedOrderId(val)}
                  options={vendorOrders.map((o) => ({
                    value: o.id,
                    label: `${o.id}${o.buyer ? ` · ${o.buyer}` : ''}`,
                  }))}
                  searchPlaceholder="অর্ডার খুঁজুন..."
                />
              </label>

              <label className="no-f">
                <span>তারিখ</span>
                <input
                  id="pDate"
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                />
              </label>

              <label className="no-f">
                <span>শিফট</span>
                <select
                  id="pSh"
                  value={entryShift}
                  onChange={(e) => setEntryShift(e.target.value)}
                >
                  {SHIFTS.map(([v, t]) => (
                    <option key={v} value={v}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {activeOrder && (
              <p className="small muted" style={{ margin: '12px 0 0', fontSize: 13 }}>
                {activeOrder.buyer ? `বায়ার: ${activeOrder.buyer} · ` : ''}মোট{' '}
                {bnNum(activeTotalKg)} kg · এখন পর্যন্ত{' '}
                {bnNum(Math.round(activeDoneKg))} kg ({orderDonePct}%) ·{' '}
                {normalizedLines.length}টি অংশ
              </p>
            )}
          </div>

          {/* STEP 2: অংশ অনুযায়ী প্রোডাকশন */}
          <h3 className="pe-h">
            <span className="stp">২</span>অংশ অনুযায়ী প্রোডাকশন
          </h3>

          {/* CARDS FOR EACH ORDER LINE */}
          {lineForms.map((lForm, lIdx) => {
            const lineData = normalizedLines[lIdx] || {
              place: 'Body',
              fab: 'Single Jersey',
              color: '—',
              qty: 1000,
              done: 0,
              dia: '30" × 24G',
              kt: 'c',
              yd: false,
              unit: 'kg',
              machines: ['M-01'],
              yarns: [],
            };

            const isFlat = lineData.kt === 'f';
            const doneKg = lineData.done || 0;
            const totalKg = lineData.qty || 1;
            const linePct = Math.min(100, Math.round((doneKg / totalKg) * 100));
            const colorVar = `var(--l${(lIdx % 5) + 1})`;

            return (
              <div
                key={lIdx}
                className="ln pe-ln"
                style={{ '--lc': colorVar } as React.CSSProperties}
                data-pl={lIdx}
              >
                {/* Line Header */}
                <div className="ln-h">
                  <span className="ln-no">{lIdx + 1}</span>
                  <b className="ln-t">
                    {[lineData.place, lineData.fab, lineData.color && lineData.color !== '—' ? lineData.color : '']
                      .filter(Boolean)
                      .join(' · ')}
                  </b>
                  <span className="ln-q">
                    {bnNum(doneKg)} / {bnNum(totalKg)} {lineData.unit || 'kg'}
                  </span>
                </div>

                {/* Badges */}
                <div className="pe-kb">
                  {isFlat ? (
                    <span className="kb kb-f">ফ্ল্যাট নিট</span>
                  ) : lineData.yd ? (
                    <span className="kb kb-y">Y/D</span>
                  ) : (
                    <span className="kb">গ্রে</span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="pe-bar">
                  <i style={{ width: `${linePct}%` }} />
                </div>

                {/* Line specs info */}
                <div className="pe-info">
                  <span>M/C {lineData.dia || '—'}</span>
                  <span>
                    মেশিন:{' '}
                    {lForm.machines.map((m) => m.machine).filter(Boolean).length
                      ? lForm.machines.map((m) => m.machine).filter(Boolean).join(', ')
                      : 'অ্যাসাইন হয়নি'}
                  </span>
                </div>

                {/* Machines Production */}
                <div className="ln-sub">এই শিফটের প্রোডাকশন</div>
                <div className="pe-ms">
                  {lForm.machines.map((mRow, mIdx) => {
                    const rollSum = !isFlat
                      ? mRow.rolls.reduce((a, r) => a + parseBnFloat(r.weight), 0)
                      : 0;

                    const diffKg = +(parseBnFloat(mRow.totalKg) - rollSum).toFixed(1);

                    return isFlat ? (
                      /* Flat Knit Machine Row */
                      <div key={mRow.key} className="pe-m" data-pl={lIdx} data-flat="1">
                        <div className="pe-mc">
                          <span>মেশিন</span>
                          {mRow.machine ? (
                            <b className="mono">{mRow.machine}</b>
                          ) : (
                            <SearchableSelect
                              value={mRow.machine}
                              onChange={(nextVal) => {
                                setLineForms((prev) => {
                                  const next = [...prev];
                                  next[lIdx].machines[mIdx].machine = nextVal;
                                  return next;
                                });
                              }}
                              options={[
                                { value: '', label: 'বাছুন' },
                                ...availableMachines.map((mc) => ({ value: mc, label: mc })),
                              ]}
                              placeholder="মেশিন বাছুন"
                              searchPlaceholder="মেশিন খুঁজুন..."
                              minWidth={110}
                            />
                          )}
                        </div>

                        <label className="no-f">
                          <span>প্রোডাকশন (পিস)</span>
                          <input
                            inputMode="decimal"
                            placeholder="যেমন: 1200"
                            value={mRow.flatPieces}
                            onChange={(e) => handleFlatFieldChange(lIdx, mIdx, 'flatPieces', e.target.value)}
                          />
                        </label>

                        <label className="no-f">
                          <span>বান্ডেল</span>
                          <input
                            inputMode="numeric"
                            placeholder="যেমন: 8"
                            value={mRow.flatBundles}
                            onChange={(e) => handleFlatFieldChange(lIdx, mIdx, 'flatBundles', e.target.value)}
                          />
                        </label>

                        <label className="no-f">
                          <span>অপারেটর <b className="req">*</b></span>
                          <SearchableOperatorSelect
                            value={mRow.flatOperator}
                            operators={shiftOperators}
                            shiftLabel={entryShift}
                            placeholder="-- অপারেটর বাছুন --"
                            onChange={(name) => handleFlatFieldChange(lIdx, mIdx, 'flatOperator', name)}
                          />
                        </label>

                        <label className="no-f">
                          <span>সমস্যা</span>
                          <select
                            value={mRow.flatIssue}
                            onChange={(e) => handleFlatFieldChange(lIdx, mIdx, 'flatIssue', e.target.value)}
                          >
                            {ISSUES.map(([v, t]) => (
                              <option key={v} value={v}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </label>

                        {mRow.flatIssue && (
                          <label className="no-f pe-issd">
                            <span>
                              সমস্যার বিবরণ <b className="req">*</b>
                            </span>
                            <input
                              type="text"
                              placeholder={ISS_PH[mRow.flatIssue] || 'বিবরণ লিখুন'}
                              value={mRow.flatIssueDesc}
                              onChange={(e) => handleFlatFieldChange(lIdx, mIdx, 'flatIssueDesc', e.target.value)}
                            />
                          </label>
                        )}
                      </div>
                    ) : (
                      /* Circular Knit Machine Row */
                      <div key={mRow.key} className="pe-m pe-v2" data-pl={lIdx}>
                        {/* Machine Header */}
                        <div className="pe-mh">
                          <div className="pe-mc">
                            <span>মেশিন</span>
                            {mRow.machine ? (
                              <b className="mono">{mRow.machine}</b>
                            ) : (
                              <SearchableSelect
                                className="pe-msel"
                                value={mRow.machine}
                                onChange={(nextVal) => {
                                  setLineForms((prev) => {
                                    const next = [...prev];
                                    next[lIdx].machines[mIdx].machine = nextVal;
                                    return next;
                                  });
                                }}
                                options={[
                                  { value: '', label: 'বাছুন' },
                                  ...availableMachines.map((mc) => ({ value: mc, label: mc })),
                                ]}
                                placeholder="মেশিন বাছুন"
                                searchPlaceholder="মেশিন খুঁজুন..."
                                minWidth={110}
                              />
                            )}
                          </div>
                          <span className="pe-sum mono">
                            {mRow.rolls.length > 0 ? `মোট ${rollSum.toFixed(1)} kg · ${mRow.rolls.length} রোল` : ''}
                          </span>
                        </div>

                        {/* Summary Inputs Row (.pe-bg) */}
                        <div className="pe-bg">
                          <label className="no-f">
                            <span>কয়টা রোল নামল</span>
                            <input
                              inputMode="numeric"
                              placeholder="যেমন: 5"
                              value={mRow.rollsCount}
                              onChange={(e) => handleRollsCountChange(lIdx, mIdx, e.target.value)}
                            />
                          </label>

                          <label className="no-f">
                            <span>মোট ওজন (kg)</span>
                            <input
                              inputMode="decimal"
                              placeholder="যেমন: 110"
                              value={mRow.totalKg}
                              onChange={(e) => handleTotalKgChange(lIdx, mIdx, e.target.value)}
                            />
                          </label>

                          <label className="no-f pe-op1">
                            <span>অপারেটর <b className="req">*</b></span>
                            <SearchableOperatorSelect
                              value={mRow.operator}
                              operators={shiftOperators}
                              shiftLabel={entryShift}
                              placeholder="-- অপারেটর বাছুন --"
                              onChange={(name) => handleMachineOperatorChange(lIdx, mIdx, name)}
                            />
                          </label>

                          <label className="pe-chk">
                            <input
                              type="checkbox"
                              checked={mRow.sameOperator}
                              onChange={() => handleToggleSameOperator(lIdx, mIdx)}
                            />
                            সব রোল একই অপারেটর
                          </label>
                        </div>

                        {/* Detailed Rolls Grid (.pe-rt) */}
                        {mRow.rolls.length > 0 && (
                          <div className={`pe-rt ${mRow.sameOperator ? 'same' : ''}`}>
                            <div className="pe-rh" aria-hidden="true">
                              <span>রোল নং</span>
                              <span>
                                ওজন (kg) <b className="req">*</b>
                              </span>
                              {!mRow.sameOperator && <span className="pe-oc">অপারেটর</span>}
                              <span>ফল্ট (না থাকলে খালি রাখুন)</span>
                            </div>

                            {/* Roll rows */}
                            <div className="pe-rl" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {mRow.rolls.map((r, rIdx) => {
                                const hasFaults = r.faults.length > 0;
                                return (
                                  <div
                                    key={rIdx}
                                    className={`pe-r ${hasFaults ? 'has-f' : ''}`}
                                  >
                                    {/* Roll Prefix + Number */}
                                    <div className="pe-no">
                                      <span className="pe-pre mono">
                                        {(mRow.machine || 'M-01') + '/'}
                                      </span>
                                      <input
                                        className="mono"
                                        value={r.jc}
                                        aria-label="রোল নং"
                                        onChange={(e) =>
                                          handleRollFieldChange(lIdx, mIdx, rIdx, 'jc', e.target.value)
                                        }
                                      />
                                    </div>

                                    {/* Weight input */}
                                    <input
                                      inputMode="decimal"
                                      placeholder="ওজন kg"
                                      aria-label="ওজন (kg)"
                                      value={r.weight}
                                      onChange={(e) =>
                                        handleRollFieldChange(lIdx, mIdx, rIdx, 'weight', e.target.value)
                                      }
                                    />

                                    {/* Operator dropdown (if not same) */}
                                    {!mRow.sameOperator && (
                                      <div className="pe-oc" style={{ minWidth: 120 }}>
                                        <SearchableOperatorSelect
                                          value={r.operator}
                                          operators={shiftOperators}
                                          shiftLabel={entryShift}
                                          compact
                                          placeholder="অপারেটর"
                                          ariaLabel="অপারেটর"
                                          onChange={(name) =>
                                            handleRollFieldChange(lIdx, mIdx, rIdx, 'operator', name)
                                          }
                                        />
                                      </div>
                                    )}

                                    {/* Faults Selector */}
                                    <div className="pe-rfs">
                                      {r.faults.map((fItem, fIdx) => (
                                        <div key={fIdx} className="pe-fp">
                                          <select
                                            value={fItem.fault}
                                            aria-label="ফল্ট"
                                            onChange={(e) =>
                                              handleUpdateFault(
                                                lIdx,
                                                mIdx,
                                                rIdx,
                                                fIdx,
                                                e.target.value,
                                                fItem.count
                                              )
                                            }
                                          >
                                            {FAULTS.map((f) => (
                                              <option key={f} value={f}>
                                                {f}
                                              </option>
                                            ))}
                                          </select>
                                          <input
                                            type="number"
                                            min="1"
                                            placeholder="কয়টা"
                                            aria-label="কয়টা ফল্ট"
                                            value={fItem.count || ''}
                                            onChange={(e) =>
                                              handleUpdateFault(
                                                lIdx,
                                                mIdx,
                                                rIdx,
                                                fIdx,
                                                fItem.fault,
                                                parseInt(e.target.value, 10) || 1
                                              )
                                            }
                                          />
                                        </div>
                                      ))}

                                      <button
                                        type="button"
                                        className="pe-lnk"
                                        onClick={() => handleAddFault(lIdx, mIdx, rIdx)}
                                      >
                                        + {r.faults.length ? 'আরেকটা ফল্ট' : 'ফল্ট যোগ করুন'}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Weight Validator Message (.pe-chkw) */}
                            <div
                              className={`pe-chkw ${
                                !parseBnFloat(mRow.totalKg)
                                  ? 'warn'
                                  : Math.abs(diffKg) < 0.05 &&
                                    mRow.rolls.every((r) => parseBnFloat(r.weight) > 0)
                                  ? 'ok'
                                  : 'bad'
                              }`}
                            >
                              {!parseBnFloat(mRow.totalKg)
                                ? `উপরে ${bnNum(mRow.rolls.length)} রোলের মোট ওজন লিখুন — রোলের ওজনের যোগফল এর সাথে মিলতে হবে`
                                : Math.abs(diffKg) < 0.05 &&
                                  mRow.rolls.every((r) => parseBnFloat(r.weight) > 0)
                                ? `✓ মিলেছে — ${bnNum(mRow.rolls.length)}টা রোলের যোগফল ${rollSum.toFixed(1)} kg = মোট ${mRow.totalKg} kg`
                                : `রোলের যোগফল ${rollSum.toFixed(1)} kg, মোট ${mRow.totalKg} kg — ${
                                    diffKg > 0 ? `${diffKg} kg কম আছে` : `${-diffKg} kg বেশি হয়ে গেছে`
                                  }${
                                    mRow.rolls.filter((r) => parseBnFloat(r.weight) <= 0).length > 0
                                      ? ` · ${bnNum(mRow.rolls.filter((r) => parseBnFloat(r.weight) <= 0).length)}টা রোলের ওজন বাকি`
                                      : ''
                                  }`}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* + Add Machine Button */}
                <button
                  type="button"
                  className="addy"
                  style={{ marginTop: 8 }}
                  onClick={() => handleAddMachineToLine(lIdx)}
                >
                  + অন্য মেশিন যোগ করুন
                </button>

                {/* Yarn Inputs */}
                <div className="ln-sub" style={{ marginTop: 14 }}>
                  ব্যবহৃত সুতা <span className="pe-src">{lForm.yarnSrc}</span>
                </div>
                <div className="yarns" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {lForm.yarns.map((yItem, yIdx) => (
                    <div key={yIdx} className="yrow pe-y" data-pl={lIdx} data-j={yIdx}>
                      <span className="yno">{yIdx + 1}</span>
                      <label className="no-f">
                        <span>Yarn Count</span>
                        <input
                          value={yItem.count}
                          placeholder="যেমন: 30/1 Combed"
                          onChange={(e) => handleYarnChange(lIdx, yIdx, 'count', e.target.value)}
                        />
                      </label>
                      <label className="no-f">
                        <span>Yarn Brand</span>
                        <input
                          value={yItem.brand}
                          placeholder="মিলের নাম"
                          onChange={(e) => handleYarnChange(lIdx, yIdx, 'brand', e.target.value)}
                        />
                      </label>
                      <label className="no-f">
                        <span>Yarn Lot</span>
                        <input
                          value={yItem.lot}
                          placeholder="যেমন: SQ-88415"
                          onChange={(e) => handleYarnChange(lIdx, yIdx, 'lot', e.target.value)}
                        />
                      </label>
                      <span />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Sticker Option Checkbox */}
          <label className="st-sw" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <input
              type="checkbox"
              id="pStk"
              checked={showStickersOnSave}
              onChange={(e) => setShowStickersOnSave(e.target.checked)}
              style={{ width: 17, height: 17 }}
            />
            সেভ করার পর রোলের QR স্টিকার দেখাও (ঐচ্ছিক)
          </label>

          {/* Validation Error Message Box */}
          {errorMessage && (
            <div className="no-msg" style={{ background: 'var(--bad-soft, #fee2e2)', color: 'var(--bad, #dc2626)', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500 }}>
              {errorMessage}
            </div>
          )}

          {/* Bottom Action Row */}
          <div className="row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginTop: 8 }}>
            <span className="small muted" style={{ fontSize: 12, lineHeight: 1.4 }}>
              যে মেশিনে প্রোডাকশন লিখবেন শুধু সেগুলোই সেভ হবে। সেভ করলে প্রতিটা রোল (নম্বর, ওজন, অপারেটর, ফল্ট) সেই মেশিনের জব কার্ডে উঠে যাবে, ফল্টওয়ালা রোল QC-তে যাবে, আর অর্ডারের অগ্রগতি ও ভেন্ডরের রিপোর্ট আপডেট হবে।
            </span>
            <button className="btn pri" type="submit" disabled={isSubmitting} style={{ minWidth: 160, padding: '9px 20px', whiteSpace: 'nowrap' }}>
              {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'প্রোডাকশন সেভ করুন'}
            </button>
          </div>
        </form>
      ) : (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <p className="muted">এখন কোনো চলমান অর্ডার নেই। আগে New Order Entry থেকে অর্ডার তৈরি করুন।</p>
          <button className="btn pri" onClick={() => navigate('/dashboard/neworder')} style={{ marginTop: 12 }}>
            + New Order Entry
          </button>
        </div>
      )}

      {/* NEWLY CREATED ROLLS STICKER SECTION (#newStk) */}
      {newRolls.length > 0 && (
        <div className="card" id="newStk" style={{ marginTop: 16 }}>
          <div className="row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>নতুন {bnNum(newRolls.length)}টা রোলের স্টিকার</h3>
            <div className="row" style={{ display: 'flex', gap: 8 }}>
              <button className="btn sm prn-btn no-pdf" type="button" onClick={handlePrintStickers}>
                🖨️ স্টিকার প্রিন্ট
              </button>
              <button className="btn sm" type="button" onClick={() => setNewRolls([])}>
                বন্ধ করুন
              </button>
            </div>
          </div>
          <p className="small muted" style={{ margin: '-4px 0 12px', fontSize: 12 }}>
            আসল অ্যাপে এখান থেকে স্টিকার প্রিন্টারে প্রিন্ট হবে। রোলে লাগালে QC আর চালানের সময় স্ক্যান করা যাবে।
          </p>
          <div className="stk-grid">
            {newRolls.map((r, idx) => {
              const rollCode = r.no || `${r.m}/${r.jc || '001'}`;
              return (
                <div key={idx} className="stk">
                  <QrCodeSvg value={rollCode} size={64} />
                  <div className="stk-t">
                    <b className="mono" style={{ fontSize: 14 }}>{rollCode}</b>
                    <span style={{ fontSize: 12 }}>{r.o} · {r.party || vendorName}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {r.place || 'Body'} · {r.fab || 'Single Jersey'}
                    </span>
                    <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>
                      {r.kg} kg · {r.lot || '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TODAY'S ENTRIES TABLE (.card) */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3>আজকের এন্ট্রি</h3>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>ভেন্ডর</th>
                <th>অর্ডার</th>
                <th>অংশ</th>
                <th>শিফট</th>
                <th>মেশিন</th>
                <th className="n">kg</th>
                <th className="n">রোল</th>
                <th>অপারেটর</th>
                <th>সুতার লট</th>
                <th>সমস্যা</th>
              </tr>
            </thead>
            <tbody>
              {prodLogs && prodLogs.length > 0 ? (
                prodLogs.slice(0, 15).map((p: any, idx: number) => {
                  const pOrder = orders.find((o) => o.id === (p.o || p.order_no));
                  const pLines = pOrder ? normalizeOrderLines(pOrder) : [];
                  const pLine = pLines[p.pl || p.placement_index || 0];
                  const pVendor = pOrder ? (pOrder.party || (pOrder as any).v || '—') : '—';
                  const pIssue = p.fault || p.fault_code || p.iss;

                  return (
                    <tr key={p.id || idx}>
                      <td>{pVendor}</td>
                      <td className="mono">{p.o || p.order_no}</td>
                      <td>{pLine?.place || 'Body'}</td>
                      <td>{p.sh || p.shift}</td>
                      <td className="mono">{p.m || p.machine_code}</td>
                      <td className="n">{p.kg || p.qty_kg}</td>
                      <td className="n">{p.rolls || p.rolls_count || 1}</td>
                      <td>{p.op || p.operator_name || '—'}</td>
                      <td className="mono small">{p.lot || p.yarn_lot || '—'}</td>
                      <td>
                        {pIssue ? (
                          <span className="pill p-warn" style={{ background: 'var(--warn-soft)', color: 'var(--warn)', padding: '2px 8px', borderRadius: 99, fontSize: 12 }}>
                            {pIssue}
                          </span>
                        ) : (
                          <span className="small muted">নেই</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="muted" style={{ textAlign: 'center', padding: 20 }}>
                    এই তারিখে এখনো কোনো এন্ট্রি নেই
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
