import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { bnNum } from '@/utils/formatters';

interface ReferralRecord {
  date: string;
  name: string;
  type: string;
  plan: string;
  commission: number;
  status: 'paid' | 'pending';
}

const INITIAL_REFERRALS: ReferralRecord[] = [
  { date: '০২ অক্টো', name: 'মেঘনা টেক্সটাইল লিমিটেড', type: 'ফ্যাক্টরি (১৬ মেশিন)', plan: 'স্ট্যান্ডার্ড', commission: 4800, status: 'paid' },
  { date: '২৮ সেপ্টে', name: 'তুরাগ নিটিং মিলস', type: 'ফ্যাক্টরি (২৪ মেশিন)', plan: 'প্রো', commission: 7200, status: 'paid' },
  { date: '২০ সেপ্টে', name: 'পদ্মা ফ্যাশনস', type: 'ভেন্ডর', plan: 'ভেন্ডর পোর্টাল', commission: 2500, status: 'paid' },
  { date: '১৫ সেপ্টে', name: 'সুরমা অ্যাপারেলস', type: 'ফ্যাক্টরি (১২ মেশিন)', plan: 'স্ট্যান্ডার্ড', commission: 4000, status: 'pending' },
];

export const FactoryPartnerPage: React.FC = () => {
  const { addToast, partner, requestPartnerPayout } = useApp();
  const [payoutAmt, setPayoutAmt] = useState<string>('');
  const [payoutMethod, setPayoutMethod] = useState<string>('bkash');
  const [accountNo, setAccountNo] = useState<string>('01711000000');
  const [referrals] = useState<ReferralRecord[]>(INITIAL_REFERRALS);

  const refCode = partner.partnerCode || 'KNIT-FAC-881';
  const refLink = `https://knitkhata.com/join?ref=${refCode}`;

  const copyRefLink = () => {
    navigator.clipboard?.writeText(refLink);
    addToast({
      type: 'success',
      title: 'লিংক কপি হয়েছে',
      message: `${refLink} আপনার ক্লিপবোর্ডে কপি করা হয়েছে।`,
    });
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(payoutAmt);
    if (!amt || amt <= 0) return;
    await requestPartnerPayout(amt, payoutMethod, accountNo);
    setPayoutAmt('');
  };

  return (
    <div style={{ maxWidth: '100%', width: '100%' }}>
      {/* Header */}
      <div className="head">
        <div>
          <h2>পার্টনার প্রোগ্রাম</h2>
          <p>
            অন্য কোনো নিটিং ফ্যাক্টরি বা ভেন্ডরকে নিটখাতা রেফার করুন। তারা
            সাবস্ক্রিপশন নিলে তাদের প্রথম ৩ মাসের সাবস্ক্রিপশন ফির ২০% আপনি
            কমিশন পাবেন।
          </p>
        </div>
      </div>

      {/* 4 KPIs */}
      <div className="kpis">
        <div className="kpi">
          <span>মোট রেফারেল</span>
          <b>{bnNum(partner.totalReferrals || 12)}টি প্রতিষ্ঠান</b>
          <i>আপনার লিংকে যুক্ত</i>
        </div>
        <div className="kpi">
          <span>সক্রিয় পেইড ফ্যাক্টরি</span>
          <b>{bnNum(partner.activeFactoriesCount || 8)}টি</b>
          <i>মাসিক সাবস্ক্রিপশন চলছে</i>
        </div>
        <div className="kpi">
          <span>মোট অর্জিত কমিশন</span>
          <b>৳ {bnNum(partner.totalCommissionTk || 42500)}</b>
          <i>জীবনকাল মোট</i>
        </div>
        <div className="kpi">
          <span>উত্তোলনযোগ্য ব্যালেন্স</span>
          <b style={{ color: 'var(--ok)' }}>
            ৳ {bnNum(partner.balanceCommissionTk || 18500)}
          </b>
          <i>সরাসরি বিকাশ / ব্যাংকে</i>
        </div>
      </div>

      {/* Referral Link & Code Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3>আপনার ইউনিক রেফারেল লিংক</h3>
        <p className="small muted">
          এই লিংকটি ফেসবুক, হোয়াটসঅ্যাপ বা ফ্যাক্টরি মালিকদের সাথে শেয়ার করুন:
        </p>
        <div
          className="row"
          style={{
            marginTop: 10,
            gap: 10,
            padding: 12,
            background: 'var(--surface2)',
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <span className="mono" style={{ flex: 1, fontWeight: 600 }}>
            {refLink}
          </span>
          <button type="button" className="btn pri sm" onClick={copyRefLink}>
            কপি করুন
          </button>
        </div>
      </div>

      <div className="grid g2" style={{ marginBottom: 20 }}>
        {/* Payout Request Form */}
        <form className="card" onSubmit={handlePayoutSubmit}>
          <h3>কমিশন তোলার অনুরোধ</h3>
          <p className="small muted">
            সর্বনিম্ন উত্তোলন ৫০০ টাকা। প্রতি সপ্তাহের রবিবার পেমেন্ট প্রসেস হয়।
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            <label className="f">
              টাকার পরিমাণ ৳
              <input
                type="number"
                required
                placeholder="যেমন: ৫০০০"
                value={payoutAmt}
                onChange={(e) => setPayoutAmt(e.target.value)}
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label className="f">
                পেমেন্ট মাধ্যম
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                >
                  <option value="bkash">বিকাশ (Personal)</option>
                  <option value="nagad">নগদ (Personal)</option>
                  <option value="bank">ব্যাংক একাউন্ট</option>
                </select>
              </label>

              <label className="f">
                অ্যাকাউন্ট / মোবাইল নম্বর
                <input
                  type="text"
                  required
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                />
              </label>
            </div>

            <button type="submit" className="btn pri" style={{ marginTop: 8 }}>
              টাকা তোলার অনুরোধ পাঠান
            </button>
          </div>
        </form>

        {/* Referrals List Table */}
        <div className="card">
          <h3>রেফারেল হিস্ট্রি</h3>
          <div className="tw" style={{ marginTop: 12 }}>
            <table>
              <thead>
                <tr>
                  <th>তারিখ</th>
                  <th>প্রতিষ্ঠান</th>
                  <th>প্ল্যান</th>
                  <th className="n">কমিশন ৳</th>
                  <th>অবস্থা</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r, i) => (
                  <tr key={i}>
                    <td className="mono small">{r.date}</td>
                    <td>
                      <b>{r.name}</b>
                      <div className="small muted">{r.type}</div>
                    </td>
                    <td>{r.plan}</td>
                    <td className="n">৳ {bnNum(r.commission)}</td>
                    <td>
                      {r.status === 'paid' ? (
                        <span className="pill p-ok">পরিশোধিত</span>
                      ) : (
                        <span className="pill p-yarn">প্রসেসিং</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

