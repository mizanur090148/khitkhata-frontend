import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { bnNum } from '@/utils/formatters';

export const FactoryAccountsPage: React.FC = () => {
  const { expenses, addExpense, t, language, tkSymbol } = useApp();
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
      createdBy: language === 'en' ? 'Manager' : 'ম্যানেজার',
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
          <h2>{t('খরচ, ব্যাংক ও LC')}</h2>
          <p>
            {t('এক্সেলের আলাদা আলাদা শিটের জায়গায় এক জায়গায় সব। ভেন্ডরের বিল আর পার্টি লেজার আলাদা মেনুতে।')}
          </p>
        </div>
        <button
          className="btn pri"
          type="button"
          onClick={() => setShowAddModal(true)}
        >
          {t('+ নতুন খরচ এন্ট্রি')}
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button
          className={tab === 'exp' ? 'on' : ''}
          onClick={() => setTab('exp')}
        >
          {t('দৈনিক খরচ')}
        </button>
        <button
          className={tab === 'util' ? 'on' : ''}
          onClick={() => setTab('util')}
        >
          {t('ইউটিলিটি বিল')}
        </button>
        <button
          className={tab === 'bank' ? 'on' : ''}
          onClick={() => setTab('bank')}
        >
          {t('ব্যাংক হিসাব')}
        </button>
        <button
          className={tab === 'lc' ? 'on' : ''}
          onClick={() => setTab('lc')}
        >
          {t('LC ও আমদানি')}
        </button>
      </div>

      {/* Tab 1: Daily Expenses */}
      {tab === 'exp' && (
        <>
          <div className="kpis" style={{ marginBottom: 16 }}>
            <div className="kpi">
              <span>{t('মোট খরচ এন্ট্রি')}</span>
              <b>{bnNum(expenses.length)} {language === 'en' ? 'entries' : 'টি'}</b>
              <i>{t('চলতি মাস')}</i>
            </div>
            <div className="kpi">
              <span>{t('মোট খরচ')}</span>
              <b>{tkSymbol} {bnNum(totalExpense)}</b>
              <i>{t('ক্যাশ ও ব্যাংক মিলিয়ে')}</i>
            </div>
            <div className="kpi">
              <span>{t('আজকের খরচ')}</span>
              <b>{tkSymbol} {bnNum(3500)}</b>
              <i>{t('ট্রান্সপোর্ট ও অন্যান্য')}</i>
            </div>
          </div>

          <div className="card">
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th>{t('তারিখ')}</th>
                    <th>{t('খাত')}</th>
                    <th>{t('বিবরণ')}</th>
                    <th>{t('মাধ্যম')}</th>
                    <th>{t('ভাউচার')}</th>
                    <th className="n">{language === 'en' ? `Amount (${tkSymbol})` : 'টাকা ৳'}</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id}>
                      <td className="mono small">{e.date}</td>
                      <td>
                        <span className="pill p-acc">
                          {e.category === 'electricity'
                            ? t('বিদ্যুৎ')
                            : e.category === 'maintenance'
                            ? t('রক্ষণাবেক্ষণ')
                            : e.category === 'needle_oil'
                            ? t('নিডল ও অয়েল')
                            : e.category === 'snacks'
                            ? t('আপ্যায়ন')
                            : e.category === 'transport'
                            ? t('পরিবহন')
                            : e.category}
                        </span>
                      </td>
                      <td>{e.title}</td>
                      <td className="small">{e.method}</td>
                      <td className="mono small">{e.ref}</td>
                      <td className="n" style={{ fontWeight: 600 }}>
                        {tkSymbol} {bnNum(e.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="totrow" style={{ fontWeight: 700, background: 'var(--surface2)' }}>
                    <td colSpan={5}>{t('সর্বমোট')}</td>
                    <td className="n">{tkSymbol} {bnNum(totalExpense)}</td>
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
                  <th>{t('মাস')}</th>
                  <th className="n">{language === 'en' ? `Gas Bill (${tkSymbol})` : 'গ্যাস বিল ৳'}</th>
                  <th className="n">{language === 'en' ? `Electricity Bill (${tkSymbol})` : 'বিদ্যুৎ বিল ৳'}</th>
                  <th className="n">{language === 'en' ? `Diesel (${tkSymbol})` : 'ডিজেল (জেনারেটর) ৳'}</th>
                  <th className="n">{language === 'en' ? `Total (${tkSymbol})` : 'মোট ৳'}</th>
                  <th>{t('অবস্থা')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="mono">{language === 'en' ? 'September 2026' : 'সেপ্টেম্বর ২০২৬'}</td>
                  <td className="n">{bnNum(240000)}</td>
                  <td className="n">{bnNum(118500)}</td>
                  <td className="n">{bnNum(85000)}</td>
                  <td className="n" style={{ fontWeight: 600 }}>
                    {bnNum(443500)}
                  </td>
                  <td>
                    <span className="pill p-ok">{t('পরিশোধ')}</span>
                  </td>
                </tr>
                <tr>
                  <td className="mono">{language === 'en' ? 'August 2026' : 'আগস্ট ২০২৬'}</td>
                  <td className="n">{bnNum(255000)}</td>
                  <td className="n">{bnNum(112000)}</td>
                  <td className="n">{bnNum(92000)}</td>
                  <td className="n" style={{ fontWeight: 600 }}>
                    {bnNum(459000)}
                  </td>
                  <td>
                    <span className="pill p-ok">{t('পরিশোধ')}</span>
                  </td>
                </tr>
                <tr>
                  <td className="mono">{language === 'en' ? 'July 2026' : 'জুলাই ২০২৬'}</td>
                  <td className="n">{bnNum(220000)}</td>
                  <td className="n">{bnNum(98000)}</td>
                  <td className="n">{bnNum(76000)}</td>
                  <td className="n" style={{ fontWeight: 600 }}>
                    {bnNum(394000)}
                  </td>
                  <td>
                    <span className="pill p-ok">{t('পরিশোধ')}</span>
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
                  <th>{t('তারিখ')}</th>
                  <th>{t('অ্যাকাউন্ট')}</th>
                  <th>{t('বিবরণ')}</th>
                  <th className="n">{language === 'en' ? `Deposit (${tkSymbol})` : 'জমা ৳'}</th>
                  <th className="n">{language === 'en' ? `Expense (${tkSymbol})` : 'খরচ ৳'}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="mono small">03 Oct</td>
                  <td>{language === 'en' ? 'Bank A (Current)' : 'ব্যাংক A (চলতি)'}</td>
                  <td>{language === 'en' ? 'Payment RV-0931 from ABC Knit' : 'ABC Knit থেকে RV-0931 পেমেন্ট'}</td>
                  <td className="n" style={{ color: 'var(--ok)' }}>
                    {bnNum(70000)}
                  </td>
                  <td className="n">—</td>
                </tr>
                <tr>
                  <td className="mono small">02 Oct</td>
                  <td>{language === 'en' ? 'Bank A (Current)' : 'ব্যাংক A (চলতি)'}</td>
                  <td>{language === 'en' ? 'Staff Salary for September' : 'সেপ্টেম্বর মাসের কর্মী বেতন'}</td>
                  <td className="n">—</td>
                  <td className="n" style={{ color: 'var(--bad)' }}>
                    {bnNum(1140000)}
                  </td>
                </tr>
                <tr>
                  <td className="mono small">01 Oct</td>
                  <td>{language === 'en' ? 'Bank B (LC)' : 'ব্যাংক B (LC)'}</td>
                  <td>{language === 'en' ? 'LC Margin — Needles & Spare Parts' : 'LC মার্জিন — নিডল ও স্পেয়ার পার্টস'}</td>
                  <td className="n">—</td>
                  <td className="n" style={{ color: 'var(--bad)' }}>
                    {bnNum(210000)}
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
                  <th>{t('LC নং')}</th>
                  <th>{t('পণ্য')}</th>
                  <th>{t('সাপ্লায়ার')}</th>
                  <th className="n">{t('মূল্য (USD)')}</th>
                  <th>{t('মার্জিন')}</th>
                  <th>{t('শিপমেন্ট')}</th>
                  <th>{t('অবস্থা')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="mono">LC-26-0417</td>
                  <td>{language === 'en' ? 'Circular Knitting Machine Spare Parts' : 'সার্কুলার নিটিং মেশিন স্পেয়ার পার্টস'}</td>
                  <td>{language === 'en' ? '(Supplier, China)' : '(সাপ্লায়ার, চীন)'}</td>
                  <td className="n">$18,400</td>
                  <td>20%</td>
                  <td>20 Oct</td>
                  <td>
                    <span className="pill p-acc">{t('খোলা হয়েছে')}</span>
                  </td>
                </tr>
                <tr>
                  <td className="mono">LC-26-0302</td>
                  <td>{language === 'en' ? 'Vota Needles & Sinkers' : 'ভোটা নিডল ও সিংকার'}</td>
                  <td>{language === 'en' ? '(Supplier, Germany)' : '(সাপ্লায়ার, জার্মানি)'}</td>
                  <td className="n">$7,250</td>
                  <td>25%</td>
                  <td>{t('পৌঁছেছে')}</td>
                  <td>
                    <span className="pill p-warn">{t('ডকুমেন্ট বাকি')}</span>
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
              <h3 style={{ margin: 0 }}>{t('নতুন খরচ এন্ট্রি')}</h3>
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
                {t('খাত')}
                <select value={cat} onChange={(e) => setCat(e.target.value)}>
                  <option value="maintenance">{language === 'en' ? 'Machine Maintenance' : 'মেশিন রক্ষণাবেক্ষণ'}</option>
                  <option value="needle_oil">{language === 'en' ? 'Needles & Knitting Oil' : 'নিডল ও নিটিং অয়েল'}</option>
                  <option value="electricity">{language === 'en' ? 'Electricity & Utility' : 'বিদ্যুৎ ও ইউটিলিটি'}</option>
                  <option value="transport">{language === 'en' ? 'Transport & Delivery' : 'পরিবহন ও চালান'}</option>
                  <option value="snacks">{language === 'en' ? 'Snacks & Floor Refreshments' : 'নাস্তা ও ফ্লোর আপ্যায়ন'}</option>
                  <option value="other">{language === 'en' ? 'Other Office Expenses' : 'অন্যান্য অফিস খরচ'}</option>
                </select>
              </label>

              <label className="f">
                {language === 'en' ? 'Expense Description *' : 'খরচের বিবরণ *'}
                <input
                  type="text"
                  required
                  placeholder={language === 'en' ? 'e.g. M-03 cam oil & parts purchase' : 'যেমন: M-03 ক্যাম অয়েল ও পার্টস ক্রয়'}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label className="f">
                  {language === 'en' ? `Amount (${tkSymbol}) *` : 'টাকা ৳ *'}
                  <input
                    type="number"
                    required
                    placeholder={language === 'en' ? 'e.g. 2500' : 'যেমন: ২৫০০'}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </label>
                <label className="f">
                  {language === 'en' ? 'Payment Method' : 'পেমেন্ট মাধ্যম'}
                  <select
                    value={method}
                    onChange={(e) =>
                      setMethod(e.target.value as 'cash' | 'bank' | 'bkash')
                    }
                  >
                    <option value="cash">{t('নগদ (Cash)')}</option>
                    <option value="bank">{t('ব্যাংক (Bank)')}</option>
                    <option value="bkash">bKash</option>
                  </select>
                </label>
              </div>

              <label className="f">
                {language === 'en' ? 'Notes / Remarks (Optional)' : 'মন্তব্য (ঐচ্ছিক)'}
                <textarea
                  rows={2}
                  placeholder={language === 'en' ? 'Additional voucher or reference notes...' : 'অতিরিক্ত কোনো রেফারেন্স বা ভাউচার নোট...'}
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
                {t('বাতিল')}
              </button>
              <button type="submit" className="btn pri">
                {language === 'en' ? 'Save' : 'সংরক্ষণ করুন'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

