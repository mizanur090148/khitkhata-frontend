import React, { useState, useMemo, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { bnNum } from '@/utils/formatters';
import { SearchableSelect } from '@/components/common/SearchableSelect';

interface StoreItemModel {
  id: string;
  name: string;
  cat: string;
  unit: string;
  stock: number;
  min: number;
  price: number;
  rfq?: boolean;
}

interface IssueLogModel {
  d: string;
  id: string;
  m: string;
  q: number;
  by: string;
}

export const FactoryStorePage: React.FC = () => {
  const {
    currentUser,
    storeInventory,
    storeLogs,
    fetchStoreData,
    recordStoreMovement,
    addStoreItem,
    machines,
    addToast,
    t,
    language,
    tkSymbol,
  } = useApp();

  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // State
  const [stCat, setStCat] = useState<string>('all');
  const [stForm, setStForm] = useState<{ t: 'in' | 'out'; id: string } | null>(null);
  const [stQ, setStQ] = useState<string>('');
  const [stP, setStP] = useState<string>('');
  const [stS, setStS] = useState<string>('');
  const [stM, setStM] = useState<string>('M-01');
  const [stB, setStB] = useState<string>('');
  const [rfqSet, setRfqSet] = useState<Set<string>>(new Set());

  // New Item Creation State
  const [showNewItem, setShowNewItem] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemCategory, setNewItemCategory] = useState<string>('নিডল ও সিংকার');
  const [newItemUnit, setNewItemUnit] = useState<string>('পিস');
  const [newItemStock, setNewItemStock] = useState<string>('');
  const [newItemMin, setNewItemMin] = useState<string>('');
  const [newItemPrice, setNewItemPrice] = useState<string>('');

  // Initial load from live backend
  useEffect(() => {
    let mounted = true;
    fetchStoreData()
      .catch((err) => console.warn('Store data fetch error:', err))
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Default issuer from logged in user
  useEffect(() => {
    if (!stB && currentUser?.name) {
      setStB(currentUser.name);
    }
  }, [currentUser, stB]);

  // Normalize store items directly from MySQL database (zero mock fallbacks)
  const items: StoreItemModel[] = useMemo(() => {
    return (storeInventory || []).map((x: any) => ({
      id: x.id || x.item_code,
      name: x.name,
      cat: x.cat || x.category || 'নিডল ও সিংকার',
      unit: x.unit || 'পিস',
      stock: Number(x.stock !== undefined ? x.stock : x.stock_qty || 0),
      min: Number(x.min !== undefined ? x.min : x.min_qty || 0),
      price: Number(x.price !== undefined ? x.price : x.unit_price || 0),
      rfq: Boolean(x.rfq || x.rfq_sent || rfqSet.has(x.id || x.item_code)),
    }));
  }, [storeInventory, rfqSet]);

  // Normalize issue logs directly from MySQL database
  const logs: IssueLogModel[] = useMemo(() => {
    return (storeLogs || []).map((l: any) => ({
      d: l.d || l.date_label || (l.created_at ? new Date(l.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'আজ'),
      id: l.id || l.item_code || '',
      m: l.m || l.machine_code || 'সব মেশিন',
      q: Number(l.q || l.qty || 1),
      by: l.by || l.issued_by || 'স্টোর ইনচার্জ',
    }));
  }, [storeLogs]);

  // Categories
  const categories = useMemo(() => {
    const list = Array.from(new Set(items.map((x) => x.cat).filter(Boolean)));
    return list.length ? list : ['নিডল ও সিংকার', 'নিটিং অয়েল', 'স্পেয়ার পার্টস', 'ইলেকট্রিক গুডস'];
  }, [items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    if (stCat === 'all') return items;
    return items.filter((x) => x.cat === stCat);
  }, [items, stCat]);

  // KPIs
  const lowStockItems = useMemo(() => items.filter((x) => x.stock < x.min), [items]);
  const totalStockVal = useMemo(() => items.reduce((a, x) => a + x.stock * x.price, 0), [items]);

  // Needles issued per machine
  const needlesPerMachine = useMemo(() => {
    const map: Record<string, number> = {};
    logs
      .filter((l) => {
        const item = items.find((x) => x.id === l.id);
        return item && item.cat === 'নিডল ও সিংকার';
      })
      .forEach((l) => {
        map[l.m] = (map[l.m] || 0) + l.q;
      });
    return map;
  }, [logs, items]);

  const totalNeedlesWeek = useMemo(() => {
    return Object.values(needlesPerMachine).reduce((a, b) => a + b, 0);
  }, [needlesPerMachine]);

  const maxNeedlesPerMachine = useMemo(() => {
    const vals = Object.values(needlesPerMachine);
    return vals.length ? Math.max(...vals) : 1;
  }, [needlesPerMachine]);

  // Dynamic machine list
  const machineList = useMemo(() => {
    if (machines && machines.length) {
      return machines.map((m) => m.id);
    }
    return [
      ...Array.from({ length: 24 }, (_, i) => `M-${String(i + 1).padStart(2, '0')}`),
      ...Array.from({ length: 6 }, (_, i) => `F-${String(i + 1).padStart(2, '0')}`),
    ];
  }, [machines]);

  // Handle Restock / Issue Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stForm) return;

    const q = parseInt(stQ.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d))), 10);
    if (isNaN(q) || q <= 0) {
      addToast({ type: 'error', message: 'সঠিক পরিমাণ লিখুন' });
      return;
    }

    const item = items.find((x) => x.id === stForm.id);
    if (!item) return;

    const issuer = stB.trim() || currentUser?.name || 'স্টোর ইনচার্জ';

    if (stForm.t === 'out') {
      if (q > item.stock) {
        addToast({ type: 'error', message: `স্টকে আছে মাত্র ${item.stock} ${item.unit}` });
        return;
      }
      try {
        await recordStoreMovement({
          item_code: item.id,
          type: 'out',
          qty: q,
          machine_code: stM,
          issued_by: issuer,
        });
        setStForm(null);
        setStQ('');
      } catch {
        // Handled in context
      }
    } else {
      const p = parseFloat(stP);
      try {
        await recordStoreMovement({
          item_code: item.id,
          type: 'in',
          qty: q,
          price: isNaN(p) ? undefined : p,
        });
        setStForm(null);
        setStQ('');
        setStP('');
        setStS('');
      } catch {
        // Handled in context
      }
    }
  };

  // Handle New Item Creation
  const handleCreateNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      addToast({ type: 'error', message: 'আইটেমের নাম লিখুন' });
      return;
    }
    const stock = parseInt(newItemStock, 10) || 0;
    const min = parseInt(newItemMin, 10) || 0;
    const price = parseFloat(newItemPrice) || 0;

    try {
      await addStoreItem({
        name: newItemName.trim(),
        category: newItemCategory.trim() || 'নিডল ও সিংকার',
        unit: newItemUnit.trim() || 'পিস',
        stock_qty: stock,
        min_qty: min,
        unit_price: price,
      });
      setShowNewItem(false);
      setNewItemName('');
      setNewItemStock('');
      setNewItemMin('');
      setNewItemPrice('');
    } catch {
      // Handled in context
    }
  };

  // RFQ Request
  const handleRfq = async (id: string) => {
    setRfqSet((prev) => new Set([...prev, id]));
    try {
      await recordStoreMovement({
        item_code: id,
        type: 'rfq',
      });
      addToast({
        type: 'success',
        message: 'কোটেশন অনুরোধ ৩ জন অনুমোদিত সাপ্লায়ারের কাছে গেছে · উত্তর মেসেজে আসবে',
      });
    } catch {
      // Handled in context
    }
  };

  const activeFormItem = stForm ? items.find((x) => x.id === stForm.id) : null;

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
      {/* Header */}
      <div className="head">
        <div>
          <h2>{t('স্টোর ও স্পেয়ার পার্টস')}</h2>
          <p>
            {t(
              'নিডল, সিংকার, অয়েল আর পার্টসের স্টক। কোন মেশিনে কী গেল তার হিসাব। স্টক কমলে এক চাপে সাপ্লায়ারদের কাছে কোটেশন চান।'
            )}
          </p>
        </div>
        <button
          className="btn pri"
          type="button"
          onClick={() => {
            setShowNewItem(!showNewItem);
            setStForm(null);
          }}
        >
          {showNewItem ? t('✕ বন্ধ করুন') : t('+ নতুন আইটেম')}
        </button>
      </div>

      {/* New Item Form */}
      {showNewItem && (
        <form className="card" onSubmit={handleCreateNewItem} noValidate style={{ margin: '14px 0' }}>
          <h3>{t('নতুন স্টোর আইটেম যোগ করুন')}</h3>
          <div className="no-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            <label className="no-f">
              <span>{t('আইটেমের নাম')}</span>
              <input
                placeholder={t('যেমন: নিডল Groz-Beckert 74.41')}
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
            </label>

            <label className="no-f">
              <span>{t('ক্যাটাগরি / ধরন')}</span>
              <select value={newItemCategory} onChange={(e) => setNewItemCategory(e.target.value)}>
                <option value="নিডল ও সিংকার">{t('নিডল ও সিংকার')}</option>
                <option value="নিটিং অয়েল">{t('নিটিং অয়েল')}</option>
                <option value="স্পেয়ার পার্টস">{t('স্পেয়ার পার্টস')}</option>
                <option value="ইলেকট্রিক গুডস">{t('ইলেকট্রিক গুডস')}</option>
              </select>
            </label>

            <label className="no-f">
              <span>{t('একক (Unit)')}</span>
              <select value={newItemUnit} onChange={(e) => setNewItemUnit(e.target.value)}>
                <option value="পিস">{t('পিস')}</option>
                <option value="সেট">{t('সেট')}</option>
                <option value="ক্যান">{t('ক্যান')}</option>
                <option value="লিটার">{t('লিটার')}</option>
                <option value="কেজি">{t('কেজি')}</option>
              </select>
            </label>

            <label className="no-f">
              <span>{t('প্রাথমিক স্টক')}</span>
              <input
                type="number"
                min="0"
                placeholder={t('যেমন: 500')}
                value={newItemStock}
                onChange={(e) => setNewItemStock(e.target.value)}
              />
            </label>

            <label className="no-f">
              <span>{t('ন্যূনতম স্টক (ওয়ার্নিং লেভেল)')}</span>
              <input
                type="number"
                min="0"
                placeholder={t('যেমন: 200')}
                value={newItemMin}
                onChange={(e) => setNewItemMin(e.target.value)}
              />
            </label>

            <label className="no-f">
              <span>{language === 'en' ? `Unit Price (${tkSymbol})` : 'একক মূল্য (৳)'}</span>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder={t('যেমন: 45')}
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
              />
            </label>
          </div>

          <div className="row" style={{ marginTop: 14, gap: 10 }}>
            <button className="btn pri" type="submit">
              {t('আইটেম সেভ করুন')}
            </button>
            <button className="btn" type="button" onClick={() => setShowNewItem(false)}>
              {t('বাতিল')}
            </button>
          </div>
        </form>
      )}

      {/* 4 KPIs */}
      <div className="kpis">
        <div className="kpi">
          <span>{t('মোট আইটেম')}</span>
          <b>{bnNum(items.length)}</b>
        </div>
        <div className="kpi" style={{ borderColor: lowStockItems.length ? 'var(--bad)' : 'inherit' }}>
          <span>{t('স্টক কম')}</span>
          <b style={{ color: lowStockItems.length ? 'var(--bad)' : 'inherit' }}>{bnNum(lowStockItems.length)}</b>
        </div>
        <div className="kpi">
          <span>{t('স্টকের দাম')}</span>
          <b>{tkSymbol} {bnNum(totalStockVal)}</b>
        </div>
        <div className="kpi">
          <span>{t('এ সপ্তাহে নিডল গেছে')}</span>
          <b>{bnNum(totalNeedlesWeek)} {language === 'en' ? 'Pcs' : 'পিস'}</b>
        </div>
      </div>

      {/* Issue / Restock Inline Form */}
      {stForm && activeFormItem && (
        <form className="card" id="stf" onSubmit={handleFormSubmit} noValidate style={{ margin: '14px 0' }}>
          <h3>
            {stForm.t === 'in' ? t('স্টকে যোগ') : t('মেশিনে দিন')} · {activeFormItem.name}
          </h3>
          <div className="no-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            <label className="no-f">
              <span>{t('পরিমাণ')} ({t(activeFormItem.unit)})</span>
              <input
                id="stQ"
                inputMode="numeric"
                value={stQ}
                onChange={(e) => setStQ(e.target.value)}
                placeholder={`${language === 'en' ? 'e.g.' : 'যেমন:'} ${stForm.t === 'out' ? '20' : '100'}`}
              />
            </label>

            {stForm.t === 'in' ? (
              <>
                <label className="no-f">
                  <span>{language === 'en' ? `Price (per unit, ${tkSymbol})` : 'দাম (প্রতি একক, ৳)'}</span>
                  <input
                    id="stP"
                    inputMode="decimal"
                    value={stP}
                    onChange={(e) => setStP(e.target.value)}
                    placeholder={String(activeFormItem.price)}
                  />
                </label>
                <label className="no-f">
                  <span>{t('সাপ্লায়ার')}</span>
                  <input
                    id="stS"
                    placeholder={t('যেমন: নিডল ও স্পেয়ার সাপ্লায়ার')}
                    value={stS}
                    onChange={(e) => setStS(e.target.value)}
                  />
                </label>
              </>
            ) : (
              <>
                <label className="no-f">
                  <span>{t('মেশিন')}</span>
                  <SearchableSelect
                    value={stM}
                    onChange={(val) => setStM(val)}
                    options={[
                      ...machineList.map((m) => ({ value: m, label: m })),
                      { value: 'সব মেশিন', label: t('সব মেশিন') },
                    ]}
                    searchPlaceholder={t('মেশিন খুঁজুন...')}
                  />
                </label>
                <label className="no-f">
                  <span>{t('কে নিল')}</span>
                  <input
                    value={stB}
                    placeholder={t('কর্মকর্তার নাম')}
                    onChange={(e) => setStB(e.target.value)}
                  />
                </label>
              </>
            )}
          </div>

          <div className="row" style={{ marginTop: 14 }}>
            <button className="btn pri" type="submit">
              {t('সেভ করুন')}
            </button>
            <button className="btn" type="button" onClick={() => setStForm(null)}>
              {t('বাতিল')}
            </button>
          </div>
        </form>
      )}

      {/* Category Chips */}
      <div className="chips" style={{ margin: '14px 0 10px' }}>
        <button
          className={stCat === 'all' ? 'on' : ''}
          onClick={() => setStCat('all')}
        >
          {t('সব')}
        </button>
        {categories.map((c) => (
          <button
            key={c}
            className={stCat === c ? 'on' : ''}
            onClick={() => setStCat(c)}
          >
            {t(c)}
          </button>
        ))}
      </div>

      {/* Inventory Table */}
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>{t('আইটেম')}</th>
              <th>{t('ধরন')}</th>
              <th className="n">{t('স্টক')}</th>
              <th className="n">{t('ন্যূনতম')}</th>
              <th className="n">{t('দাম')}</th>
              <th>{t('অবস্থা')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length ? (
              filteredItems.map((x) => {
                const isLow = x.stock < x.min;
                const hasRfq = x.rfq || rfqSet.has(x.id);

                return (
                  <tr key={x.id}>
                    <td>
                      <b>{x.name}</b>
                    </td>
                    <td className="small">{t(x.cat)}</td>
                    <td className="n" style={{ color: isLow ? 'var(--bad)' : 'inherit' }}>
                      <b>{bnNum(x.stock)}</b> {t(x.unit)}
                    </td>
                    <td className="n">{bnNum(x.min)}</td>
                    <td className="n">{tkSymbol}{bnNum(x.price)}</td>
                    <td>
                      {isLow ? (
                        <span className="pill p-bad">{t('কম')}</span>
                      ) : (
                        <span className="pill p-ok">{t('ঠিক আছে')}</span>
                      )}
                    </td>
                    <td>
                      <div className="row" style={{ flexWrap: 'nowrap', gap: 6 }}>
                        <button
                          className="btn sm"
                          onClick={() => {
                            setStForm({ t: 'out', id: x.id });
                            setStQ('');
                            setShowNewItem(false);
                          }}
                        >
                          {t('মেশিনে দিন')}
                        </button>
                        <button
                          className="btn sm"
                          onClick={() => {
                            setStForm({ t: 'in', id: x.id });
                            setStQ('');
                            setStP(String(x.price));
                            setShowNewItem(false);
                          }}
                        >
                          {t('স্টকে যোগ')}
                        </button>
                        {isLow &&
                          (hasRfq ? (
                            <span className="pill p-acc">{t('কোটেশন চাওয়া হয়েছে')}</span>
                          ) : (
                            <button
                              className="btn sm pri"
                              onClick={() => handleRfq(x.id)}
                            >
                              {t('কোটেশন চান')}
                            </button>
                          ))}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="muted" style={{ textAlign: 'center', padding: '24px 0' }}>
                  {t('এই ক্যাটাগরিতে কোনো স্টোর আইটেম পাওয়া যায়নি')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Grid: Recent Issue Logs & Needles per Machine */}
      <div className="grid g2" style={{ marginTop: 18 }}>
        <div className="card">
          <h3>{t('সাম্প্রতিক খরচ')}</h3>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>{t('তারিখ')}</th>
                  <th>{t('আইটেম')}</th>
                  <th>{t('মেশিন')}</th>
                  <th className="n">{t('পরিমাণ')}</th>
                  <th>{t('নিয়েছে')}</th>
                </tr>
              </thead>
              <tbody>
                {logs.length ? (
                  logs.slice(0, 8).map((l, idx) => {
                    const item = items.find((s) => s.id === l.id);
                    return (
                      <tr key={`${l.id}-${l.m}-${idx}`}>
                        <td>{l.d}</td>
                        <td className="small">{item?.name || l.id}</td>
                        <td className="mono">{l.m}</td>
                        <td className="n">
                          {bnNum(l.q)} {item ? t(item.unit) : (language === 'en' ? 'Pcs' : 'পিস')}
                        </td>
                        <td>{l.by}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="muted" style={{ textAlign: 'center', padding: '16px 0' }}>
                      {t('এখনো কোনো খরচের লগ নেই')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3>{t('মেশিন অনুযায়ী নিডল খরচ')}</h3>
          {Object.entries(needlesPerMachine).length ? (
            Object.entries(needlesPerMachine)
              .sort((a, b) => b[1] - a[1])
              .map(([m, q]) => (
                <div
                  key={m}
                  className="row"
                  style={{ flexWrap: 'nowrap', margin: '6px 0', alignItems: 'center' }}
                >
                  <span className="mono" style={{ width: 56 }}>
                    {m}
                  </span>
                  <div className="bar" style={{ flex: 1, minWidth: 80 }}>
                    <i style={{ width: `${(q / maxNeedlesPerMachine) * 100}%` }} />
                  </div>
                  <span className="mono small" style={{ width: 70, textAlign: 'right' }}>
                    {bnNum(q)} {language === 'en' ? 'Pcs' : 'পিস'}
                  </span>
                </div>
              ))
          ) : (
            <p className="small muted" style={{ textAlign: 'center', padding: '16px 0' }}>
              {t('এখনো কোনো মেশিনে নিডল ইস্যু করা হয়নি')}
            </p>
          )}
          <p className="small muted" style={{ marginTop: 12 }}>
            {t('কোনো মেশিনে বেশি নিডল ভাঙলে মেশিনটা মেকানিক দিয়ে দেখানো ভালো।')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FactoryStorePage;
