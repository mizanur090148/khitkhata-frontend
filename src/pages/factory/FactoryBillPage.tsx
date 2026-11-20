import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { bnNum, inWords } from '@/utils/formatters';
import { SearchableSelect } from '@/components/common/SearchableSelect';

export const FactoryBillPage: React.FC = () => {
  const {
    role,
    orders,
    parties,
    factoryBills,
    factoryProfile,
    fetchBills,
    fetchOrders,
    createKkBill,
    recordKkBillPayment,
  } = useApp();

  const isVendor = role === 'vendor' || (role as string) === 'ven';
  const [curBill, setCurBill] = useState<string | null>(null);

  // Sync fresh bills & orders on mount
  React.useEffect(() => {
    fetchBills?.();
    fetchOrders?.();
  }, []);

  // New bill state
  const [newBillParty, setNewBillParty] = useState<string>('abc');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<string>('ব্যাংক ট্রান্সফার — ব্যাংক A');

  // Helpers
  const billAmt = (b: any) =>
    (b.lines || []).reduce((a: number, l: any) => a + (l.kg * l.rate), 0);
  const billRecv = (b: any) =>
    (b.recv || []).reduce((a: number, r: any) => a + (r.amt || 0), 0);

  const getParty = (key: string) => {
    return parties.find((p) => p.code === key || p.id === key) || {
      name: key === 'abc' ? 'ABC Knit Composite' : key === 'xyz' ? 'XYZ Fashion Ltd' : key,
      addr: 'প্লট ১২, রোড ৪, কোনাবাড়ী, গাজীপুর',
      contact: 'মো. কামরুল হাসান (সিনিয়র মার্চেন্ডাইজার)',
    };
  };

  const getPartyName = (key: string) => {
    return getParty(key).name;
  };

  // Find unbilled orders
  // An order is unbilled if status is 'done' or delivered > 0 and it doesn't appear in any bill
  const billedOrderIds = new Set(
    factoryBills.flatMap((b) => (b.lines || []).map((l) => l.o))
  );

  const getUnbilledOrders = (partyKey?: string) => {
    return orders.filter((o) => {
      if (billedOrderIds.has(o.id)) return false;
      const belongs = !partyKey || o.party_code === partyKey || o.party === partyKey || (partyKey === 'abc' && o.v === 'abc');
      const isReady = o.status === 'done' || o.status === 'Completed' || (Number(o.delivered || 0) > 0) || Number(o.done || 0) > 0;
      return belongs && isReady;
    });
  };

  const unbilledAll = getUnbilledOrders();
  const unbilledCandidates = getUnbilledOrders(newBillParty);

  // Initial candidate selection
  React.useEffect(() => {
    setSelectedOrderIds(unbilledCandidates.map((o) => o.id));
  }, [newBillParty, unbilledCandidates.length]);

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrderIds.length === 0) return;
    await createKkBill(newBillParty, selectedOrderIds);
    setSelectedOrderIds([]);
  };

  const selectedOrdersTotal = unbilledCandidates
    .filter((o) => selectedOrderIds.includes(o.id))
    .reduce((a, o) => a + Number(o.delivered || o.done || 0) * Number(o.rateTk || 30), 0);

  // Total due and monthly stats
  const filteredBills = isVendor
    ? factoryBills.filter((b) => b.v === 'abc')
    : factoryBills;

  const totalDue = filteredBills.reduce(
    (a, b) => a + billAmt(b) - billRecv(b),
    0
  );

  const currentMonthBills = filteredBills.filter(
    (b) => b.date >= '2026-10-01'
  );
  const currentMonthTotal = currentMonthBills.reduce(
    (a, b) => a + billAmt(b),
    0
  );

  // If viewing a single bill pad (billDoc)
  if (curBill) {
    const b = factoryBills.find((x) => x.no === curBill) || factoryBills[0];
    const v = getParty(b.v);
    const amt = billAmt(b);
    const rec = billRecv(b);
    const remaining = Math.max(0, amt - rec);

    const handlePayment = async (e: React.FormEvent) => {
      e.preventDefault();
      const amount = payAmount > 0 ? payAmount : remaining;
      if (amount <= 0) return;
      await recordKkBillPayment(b.no, amount, payMode);
      setPayAmount(0);
    };

    return (
      <div style={{ maxWidth: '100%', width: '100%' }}>
        {/* Top Action Bar */}
        <div className="head" style={{ marginBottom: 16 }}>
          <div className="row" style={{ gap: 12 }}>
            <button
              className="btn sm"
              type="button"
              onClick={() => setCurBill(null)}
            >
              ← সব বিল
            </button>
            <h2 style={{ margin: 0 }}>বিল · {b.no}</h2>
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

        {/* Printable Paper Pad (.paper.pad) */}
        <div className="paper pad" id="billDoc">
          <div className="bhdr">
            <div className="blogo">
              <b>রহমান নিটিং ইন্ডাস্ট্রিজ</b>
              <div className="small muted">
                কড্ডা, কাশিমপুর রোড, গাজীপুর · ফোন: 01711-000000 · BIN: 001234567-0101
                <br />
                সার্কুলার নিটিং
              </div>
            </div>
            <div className="doc">
              <b>BILL / বিল</b>
              No: {b.no}
              <br />
              Date: {b.date}
              <br />
              Voucher: {b.jv}
            </div>
          </div>

          <div className="bto">
            <div>
              <span className="pm small">To / প্রাপক</span>
              <div>
                <b>{v.name}</b>
              </div>
              <div className="small">{v.addr}</div>
              <div className="small">Attn: {v.contact}</div>
            </div>
            <div className="small" style={{ textAlign: 'right' }}>
              <span className="pm">Subject</span>
              <div>Knitting charge bill</div>
            </div>
          </div>

          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>SL</th>
                  <th>Order No</th>
                  <th>Challan No</th>
                  <th>Fabric</th>
                  <th>GSM / Dia</th>
                  <th className="n">Qty (kg)</th>
                  <th className="n">Rate (৳/kg)</th>
                  <th className="n">Amount (৳)</th>
                </tr>
              </thead>
              <tbody>
                {b.lines.map((l: any, i: number) => {
                  const o = orders.find((x) => x.id === l.o) || {
                    challans: ['DC-0872'],
                    fabric: l.fab || 'Single Jersey',
                    gsm: '160',
                    dia: '30/24',
                  };
                  return (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td className="mono">{l.o}</td>
                      <td className="mono small">
                        {Array.isArray(o.challans) ? o.challans.join(', ') : 'DC-0872'}
                      </td>
                      <td>{o.fabric}</td>
                      <td className="mono small">{o.gsm} / {o.dia}</td>
                      <td className="n">{bnNum(l.kg)}</td>
                      <td className="n">{l.rate.toFixed(2)}</td>
                      <td className="n">{bnNum(l.kg * l.rate)}</td>
                    </tr>
                  );
                })}
                <tr className="tot">
                  <td colSpan={5}>Total</td>
                  <td className="n">
                    {bnNum(b.lines.reduce((a: number, l: any) => a + l.kg, 0))}
                  </td>
                  <td></td>
                  <td className="n">৳ {bnNum(amt)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="words" style={{ margin: '14px 0' }}>
            <span className="pm">In words:</span> <b>{inWords(amt)}</b>
          </div>

          <p className="small pm" style={{ marginTop: 10 }}>
            Yarn received against above order(s) has been fully consumed; yarn
            balance and process loss statement attached.
          </p>

          <div className="sig" style={{ marginTop: 36 }}>
            <div>Prepared by</div>
            <div>Checked by</div>
            <div>Authorized Signature</div>
            <div>
              Received by
              <br />
              <span className="pm">({v.name})</span>
            </div>
          </div>
        </div>

        {/* Bottom Vouchers Row (.vch) */}
        <div className="vch" style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {/* Left: Journal Voucher (JV) */}
          <div className="card" id="jvDoc">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>জার্নাল ভাউচার · {b.jv}</h3>
              <span className="pill p-ok">অটো জেনারেটেড</span>
            </div>
            <div className="tw" style={{ marginTop: 12 }}>
              <table>
                <thead>
                  <tr>
                    <th>হিসাবের খাত</th>
                    <th className="n">ডেবিট ৳</th>
                    <th className="n">ক্রেডিট ৳</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{v.name} (পাওনা)</td>
                    <td className="n">৳ {bnNum(amt)}</td>
                    <td className="n">—</td>
                  </tr>
                  <tr>
                    <td>নিটিং চার্জ আয়</td>
                    <td className="n">—</td>
                    <td className="n">৳ {bnNum(amt)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="small muted" style={{ marginTop: 10 }}>
              বিল নং {b.no} এর বিপরীতে নিজে থেকেই তৈরি।
            </p>
          </div>

          {/* Right: Payment Receipt (RV) */}
          <div className="card">
            <h3>পেমেন্ট গ্রহণ (RV)</h3>
            {b.recv && b.recv.length > 0 ? (
              <div className="tw" style={{ marginTop: 10 }}>
                <table>
                  <thead>
                    <tr>
                      <th>তারিখ</th>
                      <th>ভাউচার</th>
                      <th>মাধ্যম</th>
                      <th className="n">৳</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.recv.map((r: any, idx: number) => (
                      <tr key={idx}>
                        <td className="mono small">{r.d}</td>
                        <td className="mono">{r.rv}</td>
                        <td className="small">{r.mode}</td>
                        <td className="n">৳ {bnNum(r.amt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="small muted">এখনো কোনো টাকা পাওয়া যায়নি।</p>
            )}

            <p style={{ margin: '14px 0 10px', fontSize: '1.05rem' }}>
              বাকি:{' '}
              <b
                className="mono"
                style={{ color: remaining > 0 ? 'var(--bad)' : 'var(--ok)' }}
              >
                ৳ {bnNum(remaining)}
              </b>
            </p>

            {!isVendor && remaining > 0 && (
              <form onSubmit={handlePayment} style={{ marginTop: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <label className="f">
                    টাকা
                    <input
                      type="number"
                      placeholder={String(remaining)}
                      defaultValue={remaining}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                    />
                  </label>
                  <label className="f">
                    মাধ্যম
                    <select
                      value={payMode}
                      onChange={(e) => setPayMode(e.target.value)}
                    >
                      <option>ব্যাংক ট্রান্সফার — ব্যাংক A</option>
                      <option>চেক — ব্যাংক A</option>
                      <option>নগদ</option>
                      <option>বিকাশ / নগদ (মার্চেন্ট)</option>
                    </select>
                  </label>
                </div>
                <button className="btn pri" type="submit" style={{ marginTop: 10 }}>
                  টাকা পেয়েছি
                </button>
              </form>
            )}

            {isVendor && (
              <p className="small muted" style={{ marginTop: 8 }}>
                পেমেন্ট দিলে ফ্যাক্টরি &quot;টাকা পেয়েছি&quot; চাপলেই এখানে উঠে যাবে।
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Bill List View (billView / vBillView)
  return (
    <div style={{ maxWidth: '100%', width: '100%' }}>
      {isVendor && (
        <div className="vbanner" style={{ marginBottom: 16 }}>
          <b>{factoryProfile?.name || 'রহমান নিটিং ইন্ডাস্ট্রিজ'}</b> আপনাকে যত বিল দিয়েছে, কত পরিশোধ করেছেন আর কত বাকি। বিলে ক্লিক করলে পুরো বিল আর ভাউচার খুলবে, PDF নামাতে পারবেন।
        </div>
      )}

      {/* Header */}
      <div className="head">
        <div>
          <h2>{isVendor ? 'বিল ও পেমেন্ট' : 'বিল ও ভাউচার'}</h2>
          <p>
            কাজ শেষ → ডেলিভারি চালান → বিল → ভাউচার। প্রতিটা ভেন্ডরকে আলাদা বিল।
          </p>
        </div>
      </div>

      {/* 3 KPI Cards */}
      <div className="kpis">
        <div className="kpi">
          <span>বিল করা বাকি</span>
          <b>{bnNum(unbilledAll.length)}টি অর্ডার</b>
          <i>
            {bnNum(unbilledAll.reduce((a, o) => a + Number(o.delivered || o.done || 0), 0))} kg
            ডেলিভারি হয়ে গেছে
          </i>
        </div>
        <div className="kpi">
          <span>{isVendor ? 'আপনার মোট বাকি' : 'ভেন্ডরদের কাছে মোট পাওনা'}</span>
          <b>৳ {bnNum(totalDue)}</b>
          <i>
            {filteredBills.filter((b) => billAmt(b) > billRecv(b)).length}টি বিল
            খোলা
          </i>
        </div>
        <div className="kpi">
          <span>চলতি মাসে বিল</span>
          <b>৳ {bnNum(currentMonthTotal)}</b>
          <i>{bnNum(currentMonthBills.length)}টি বিল</i>
        </div>
      </div>

      {/* New Bill Form & Explanation Card (Only for Factory role) */}
      {!isVendor && (
        <div className="grid g2" style={{ marginBottom: 20 }}>
          <form className="card" id="nb" onSubmit={handleCreateBill}>
            <h3>নতুন বিল তৈরি করুন</h3>
            <label className="f" style={{ maxWidth: 360, marginTop: 8 }}>
              পার্টি
              <SearchableSelect
                id="nbp"
                value={newBillParty}
                onChange={(val) => setNewBillParty(val)}
                options={[
                  {
                    value: 'abc',
                    label: `ABC Knit Composite ${getUnbilledOrders('abc').length > 0 ? `(${getUnbilledOrders('abc').length}টি বাকি)` : ''}`.trim(),
                  },
                  {
                    value: 'xyz',
                    label: `XYZ Fashion Ltd ${getUnbilledOrders('xyz').length > 0 ? `(${getUnbilledOrders('xyz').length}টি বাকি)` : ''}`.trim(),
                  },
                  ...parties
                    .filter((p) => p.code !== 'abc' && p.code !== 'xyz')
                    .map((p) => {
                      const code = p.code || String(p.id || p.name);
                      return {
                        value: code,
                        label: `${p.name} ${getUnbilledOrders(code).length > 0 ? `(${getUnbilledOrders(code).length}টি বাকি)` : ''}`.trim(),
                      };
                    }),
                ]}
                searchPlaceholder="পার্টি খুঁজুন..."
              />
            </label>

            {unbilledCandidates.length > 0 ? (
              <>
                <div className="tw" style={{ marginTop: 12 }}>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: 36 }}></th>
                        <th>অর্ডার</th>
                        <th>কমপ্লিট</th>
                        <th>চালান</th>
                        <th className="n">ডেলিভারি kg</th>
                        <th className="n">রেট ৳</th>
                        <th className="n">টাকা</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unbilledCandidates.map((o) => {
                        const deliv = Number(o.delivered || o.done || 0);
                        const rate = Number(o.rateTk || 30);
                        const isChecked = selectedOrderIds.includes(o.id);
                        return (
                          <tr key={o.id}>
                            <td>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelectOrder(o.id)}
                                aria-label={o.id}
                              />
                            </td>
                            <td className="mono">
                              {o.id}
                              <div className="small muted">
                                {o.fabric} {o.gsm}
                              </div>
                            </td>
                            <td className="mono small">
                              {o.completeDate || '02 Oct'}
                            </td>
                            <td className="mono small">
                              {Array.isArray(o.challans) && o.challans.length
                                ? o.challans.join(', ')
                                : 'DC-0872'}
                            </td>
                            <td className="n">{bnNum(deliv)}</td>
                            <td className="n">৳{rate}</td>
                            <td className="n">৳{bnNum(deliv * rate)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div
                  className="row"
                  style={{
                    marginTop: 14,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>
                    মোট নির্বাচিত:{' '}
                    <b className="mono" id="nbt" style={{ fontSize: '1.15rem' }}>
                      ৳ {bnNum(selectedOrdersTotal)}
                    </b>
                  </span>
                  <button
                    className="btn pri"
                    type="submit"
                    disabled={selectedOrderIds.length === 0}
                  >
                    বিল ও ভাউচার তৈরি করুন
                  </button>
                </div>
              </>
            ) : (
              <p className="small muted" style={{ marginTop: 12 }}>
                এই পার্টির কোনো কমপ্লিট অর্ডার বিল করার বাকি নেই। চলমান অর্ডার
                শেষ হলে এখানে নিজে থেকেই আসবে।
              </p>
            )}
          </form>

          {/* Explanatory Card */}
          <div className="card">
            <h3>কীভাবে কাজ করে</h3>
            <div className="prose small" style={{ lineHeight: 1.6 }}>
              <p>
                অর্ডার কমপ্লিট হলে আর ডেলিভারি চালান হয়ে গেলে, সেই অর্ডার এখানে
                &quot;বিল করা বাকি&quot; তালিকায় চলে আসে। ডেলিভারির kg আর
                অর্ডারের রেট থেকে টাকা নিজে থেকেই হিসাব হয়।
              </p>
              <p>
                বিল সেভ করলে সাথে সাথে একটা জার্নাল ভাউচার (JV) তৈরি হয়: পার্টির
                নামে ডেবিট, নিটিং আয়ে ক্রেডিট। ভেন্ডর টাকা দিলে রিসিভ ভাউচার
                (RV) হয়, আর পার্টি লেজারে বাকি টাকা কমে যায়।
              </p>
              <p>একাধিক অর্ডার একসাথে এক বিলেও দেওয়া যাবে, আবার আলাদা আলাদাও।</p>
            </div>
          </div>
        </div>
      )}

      {/* All Bills Table */}
      <div className="card">
        <h3>সব বিল</h3>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>বিল নং</th>
                <th>তারিখ</th>
                <th>পার্টি</th>
                <th>অর্ডার</th>
                <th className="n">kg</th>
                <th className="n">বিল ৳</th>
                <th className="n">পেয়েছি ৳</th>
                <th>ভাউচার</th>
                <th>অবস্থা</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      textAlign: 'center',
                      padding: '36px 16px',
                      color: 'var(--muted)',
                    }}
                  >
                    কোনো বিল পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => {
                const amt = billAmt(b);
                const rec = billRecv(b);
                const totalKg = (b.lines || []).reduce(
                  (a: number, l: any) => a + l.kg,
                  0
                );
                const isPaid = rec >= amt;
                const isPart = rec > 0 && rec < amt;

                return (
                  <tr
                    key={b.no}
                    className="click"
                    onClick={() => setCurBill(b.no)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="mono" style={{ fontWeight: 600 }}>
                      {b.no}
                    </td>
                    <td className="mono small">{b.date}</td>
                    <td>{getPartyName(b.v)}</td>
                    <td className="mono small">
                      {b.lines.map((l: any) => l.o).join(', ')}
                    </td>
                    <td className="n">{bnNum(totalKg)}</td>
                    <td className="n" style={{ fontWeight: 600 }}>
                      ৳ {bnNum(amt)}
                    </td>
                    <td className="n">৳ {bnNum(rec)}</td>
                    <td className="mono small">{b.jv}</td>
                    <td>
                      {isPaid ? (
                        <span className="pill p-ok">পরিশোধ</span>
                      ) : isPart ? (
                        <span className="pill p-warn">আংশিক</span>
                      ) : (
                        <span className="pill p-bad">বাকি</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
