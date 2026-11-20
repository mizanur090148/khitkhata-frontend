import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { bnNum } from '@/utils/formatters';

export const FactoryAccountsPage: React.FC = () => {
  const { expenses, addExpense } = useApp();
  const [tab, setTab] = useState<'exp' | 'util' | 'bank' | 'lc'>('exp');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New expense form state
  const [cat, setCat] = useState<string>('maintenance');
  const [title, setTitle] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<'cash' | 'bank' | 'bkash'>('cash');
  const [notes, setNotes] = useState<string>('');

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;
    await addExpense({
      category: cat,
      title,
      amount: Number(amount),
      method,
      ref: `EX-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().slice(0, 10),
      createdBy: 'ম্যানেজার',
      notes,
    });
    setTitle('');
    setAmount('');
    setNotes('');
    setShowAddModal(false);
  };

  const totalExpense = expenses.reduce((a, b) => a + Number(b.amount || 0), 0);

  return (
    <div style={{ maxWidth: '100%', width: '100%' }}>
      {/* Header */}
      <div className="head">
        <div>
          <h2>খরচ, ব্যাংক ও LC</h2>
          <p>
            এক্সেলের আলাদা আলাদা শিটের জায়গায় এক জায়গায় সব। ভেন্ডরের বিল আর
            পার্টি লেজার আলাদা মেনুতে।
          </p>
        </div>
        <button
          className="btn pri"
          type="button"
          onClick={() => setShowAddModal(true)}
        >
          + নতুন খরচ এন্ট্রি
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button
          className={tab === 'exp' ? 'on' : ''}
          onClick={() => setTab('exp')}
        >
          দৈনিক খরচ
        </button>
        <button
          className={tab === 'util' ? 'on' : ''}
          onClick={() => setTab('util')}
        >
          ইউটিলিটি বিল
        </button>
        <button
          className={tab === 'bank' ? 'on' : ''}
          onClick={() => setTab('bank')}
        >
          ব্যাংক হিসাব
        </button>
        <button
          className={tab === 'lc' ? 'on' : ''}
          onClick={() => setTab('lc')}
        >
          LC ও আমদানি
        </button>
      </div>

      {/* Tab 1: Daily Expenses */}
      {tab === 'exp' && (
        <>
          <div className="kpis" style={{ marginBottom: 16 }}>
            <div className="kpi">
              <span>মোট খরচ এন্ট্রি</span>
              <b>{bnNum(expenses.length)}টি</b>
              <i>চলতি মাস</i>
            </div>
            <div className="kpi">
              <span>মোট খরচ</span>
              <b>৳ {bnNum(totalExpense)}</b>
              <i>ক্যাশ ও ব্যাংক মিলিয়ে</i>
            </div>
            <div className="kpi">
              <span>আজকের খরচ</span>
              <b>৳ ৩,৫০০</b>
              <i>ট্রান্সপোর্ট ও অন্যান্য</i>
            </div>
          </div>

          <div className="card">
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th>তারিখ</th>
                    <th>খাত</th>
                    <th>বিবরণ</th>
                    <th>মাধ্যম</th>
                    <th>ভাউচার</th>
                    <th className="n">টাকা ৳</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id}>
                      <td className="mono small">{e.date}</td>
                      <td>
                        <span className="pill p-acc">
                          {e.category === 'electricity'
                            ? 'বিদ্যুৎ'
                            : e.category === 'maintenance'
                            ? 'রক্ষণাবেক্ষণ'
                            : e.category === 'needle_oil'
                            ? 'নিডল ও অয়েল'
                            : e.category === 'snacks'
                            ? 'আপ্যায়ন'
                            : e.category === 'transport'
                            ? 'পরিবহন'
                            : e.category}
                        </span>
                      </td>
                      <td>{e.title}</td>
                      <td className="small">{e.method}</td>
                      <td className="mono small">{e.ref}</td>
                      <td className="n" style={{ fontWeight: 600 }}>
                        ৳ {bnNum(e.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="totrow" style={{ fontWeight: 700, background: 'var(--surface2)' }}>
                    <td colSpan={5}>সর্বমোট</td>
                    <td className="n">৳ {bnNum(totalExpense)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Tab 2: Utility Bills */}
      {tab === 'util' && (
        <div className="card">
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>মাস</th>
                  <th className="n">গ্যাস বিল ৳</th>
                  <th className="n">বিদ্যুৎ বিল ৳</th>
                  <th className="n">ডিজেল (জেনারেটর) ৳</th>
                  <th className="n">মোট ৳</th>
                  <th>অবস্থা</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="mono">সেপ্টেম্বর ২০২৬</td>
                  <td className="n">২,৪০,০০০</td>
                  <td className="n">১,১৮,৫০০</td>
                  <td className="n">৮৫,০০০</td>
                  <td className="n" style={{ fontWeight: 600 }}>
                    ৪,৪৩,৫০০
                  </td>
                  <td>
                    <span className="pill p-ok">পরিশোধ</span>
                  </td>
                </tr>
                <tr>
                  <td className="mono">আগস্ট ২০২৬</td>
                  <td className="n">২,৫৫,০০০</td>
                  <td className="n">১,১২,০০০</td>
                  <td className="n">৯২,০০০</td>
                  <td className="n" style={{ fontWeight: 600 }}>
                    ৪,৫৯,০০০
                  </td>
                  <td>
                    <span className="pill p-ok">পরিশোধ</span>
                  </td>
                </tr>
                <tr>
                  <td className="mono">জুলাই ২০২৬</td>
                  <td className="n">২,২০,০০০</td>
                  <td className="n">৯৮,০০০</td>
                  <td className="n">৭৬,০০০</td>
                  <td className="n" style={{ fontWeight: 600 }}>
                    ৩,৯৪,০০০
                  </td>
                  <td>
                    <span className="pill p-ok">পরিশোধ</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Bank Accounts */}
      {tab === 'bank' && (
        <div className="card">
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>তারিখ</th>
                  <th>অ্যাকাউন্ট</th>
                  <th>বিবরণ</th>
                  <th className="n">জমা ৳</th>
                  <th className="n">খরচ ৳</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="mono small">03 Oct</td>
                  <td>ব্যাংক A (চলতি)</td>
                  <td>ABC Knit থেকে RV-0931 পেমেন্ট</td>
                  <td className="n" style={{ color: 'var(--ok)' }}>
                    ৭০,০০০
                  </td>
                  <td className="n">—</td>
                </tr>
                <tr>
                  <td className="mono small">02 Oct</td>
                  <td>ব্যাংক A (চলতি)</td>
                  <td>সেপ্টেম্বর মাসের কর্মী বেতন</td>
                  <td className="n">—</td>
                  <td className="n" style={{ color: 'var(--bad)' }}>
                    ১১,৪০,০০০
                  </td>
                </tr>
                <tr>
                  <td className="mono small">01 Oct</td>
                  <td>ব্যাংক B (LC)</td>
                  <td>LC মার্জিন — নিডল ও স্পেয়ার পার্টস</td>
                  <td className="n">—</td>
                  <td className="n" style={{ color: 'var(--bad)' }}>
                    ২,১০,০০০
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: LC & Imports */}
      {tab === 'lc' && (
        <div className="card">
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>LC নং</th>
                  <th>পণ্য</th>
                  <th>সাপ্লায়ার</th>
                  <th className="n">মূল্য (USD)</th>
                  <th>মার্জিন</th>
                  <th>শিপমেন্ট</th>
                  <th>অবস্থা</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="mono">LC-26-0417</td>
                  <td>সার্কুলার নিটিং মেশিন স্পেয়ার পার্টস</td>
                  <td>(সাপ্লায়ার, চীন)</td>
                  <td className="n">$18,400</td>
                  <td>20%</td>
                  <td>20 Oct</td>
                  <td>
                    <span className="pill p-acc">খোলা হয়েছে</span>
                  </td>
                </tr>
                <tr>
                  <td className="mono">LC-26-0302</td>
                  <td>ভোটা নিডল ও সিংকার</td>
                  <td>(সাপ্লায়ার, জার্মানি)</td>
                  <td className="n">$7,250</td>
                  <td>25%</td>
                  <td>পৌঁছেছে</td>
                  <td>
                    <span className="pill p-warn">ডকুমেন্ট বাকি</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Expense Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.6)',
            zIndex: 999,
            display: 'grid',
            placeItems: 'center',
            padding: 16,
          }}
        >
          <form
            className="card"
            style={{ width: '100%', maxWidth: 440, background: 'var(--surface)' }}
            onSubmit={handleAddExpense}
          >
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>নতুন খরচ এন্ট্রি</h3>
              <button
                type="button"
                className="btn sm"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
              <label className="f">
                খাত
                <select value={cat} onChange={(e) => setCat(e.target.value)}>
                  <option value="maintenance">মেশিন রক্ষণাবেক্ষণ</option>
                  <option value="needle_oil">নিডল ও নিটিং অয়েল</option>
                  <option value="electricity">বিদ্যুৎ ও ইউটিলিটি</option>
                  <option value="transport">পরিবহন ও চালান</option>
                  <option value="snacks">নাস্তা ও ফ্লোর আপ্যায়ন</option>
                  <option value="other">অন্যান্য অফিস খরচ</option>
                </select>
              </label>

              <label className="f">
                খরচের বিবরণ *
                <input
                  type="text"
                  required
                  placeholder="যেমন: M-03 ক্যাম অয়েল ও পার্টস ক্রয়"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label className="f">
                  টাকা ৳ *
                  <input
                    type="number"
                    required
                    placeholder="যেমন: ২৫০০"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </label>
                <label className="f">
                  পেমেন্ট মাধ্যম
                  <select
                    value={method}
                    onChange={(e) =>
                      setMethod(e.target.value as 'cash' | 'bank' | 'bkash')
                    }
                  >
                    <option value="cash">নগদ (Cash)</option>
                    <option value="bank">ব্যাংক (Bank)</option>
                    <option value="bkash">বিকাশ (bKash)</option>
                  </select>
                </label>
              </div>

              <label className="f">
                মন্তব্য (ঐচ্ছিক)
                <textarea
                  rows={2}
                  placeholder="অতিরিক্ত কোনো রেফারেন্স বা ভাউচার নোট..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
            </div>

            <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                className="btn"
                onClick={() => setShowAddModal(false)}
              >
                বাতিল
              </button>
              <button type="submit" className="btn pri">
                সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

