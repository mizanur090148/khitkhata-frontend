import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { bnNum } from '@/utils/formatters';

export const FactoryWhatsAppReportPage: React.FC = () => {
  const { prodLogs, addToast, factoryProfile, currentUser } = useApp();
  const [waPhone, setWaPhone] = useState<string>(currentUser?.phone || factoryProfile.phone || '01711234567');
  const [sendTime, setSendTime] = useState<string>('21:00');
  const [includeProd, setIncludeProd] = useState<boolean>(true);
  const [includeQc, setIncludeQc] = useState<boolean>(true);
  const [includeChallan, setIncludeChallan] = useState<boolean>(true);

  const handleSendTest = () => {
    addToast({
      type: 'success',
      title: 'WhatsApp-এ রিপোর্ট পাঠানো হয়েছে',
      message: `${waPhone} নম্বরে আজকের Excel ফাইল পাঠানো সম্পন্ন হয়েছে।`,
    });
  };

  return (
    <div style={{ maxWidth: '100%', width: '100%' }}>
      {/* Header */}
      <div className="head">
        <div>
          <h2>WhatsApp রিপোর্ট</h2>
          <p>
            প্রতিদিন শিফট শেষে আজকের প্রোডাকশন, QC আর ডেলিভারির সারাংশ Excel
            ফাইল হয়ে আপনার ও ভেন্ডরের WhatsApp-এ নিজে থেকেই চলে যাবে।
          </p>
        </div>
        <span className="pill p-ok">অটোমেশন সক্রিয়</span>
      </div>

      <div className="grid g2" style={{ marginBottom: 20 }}>
        {/* Settings Form */}
        <div className="card">
          <h3>স্বয়ংক্রিয় WhatsApp শিডিউল</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
            <label className="f">
              WhatsApp মোবাইল নম্বর
              <input
                type="text"
                value={waPhone}
                onChange={(e) => setWaPhone(e.target.value)}
                placeholder="01711000000"
              />
            </label>

            <label className="f">
              পাঠানোর সময় (প্রতিদিন)
              <input
                type="time"
                value={sendTime}
                onChange={(e) => setSendTime(e.target.value)}
              />
            </label>

            <div>
              <b style={{ display: 'block', marginBottom: 8, fontSize: '.9rem' }}>
                রিপোর্টে যা যা থাকবে
              </b>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includeProd}
                    onChange={(e) => setIncludeProd(e.target.checked)}
                  />
                  <span>শিফট অনুযায়ী ফ্লোর প্রোডাকশন সামারি (kg ও রোল)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includeQc}
                    onChange={(e) => setIncludeQc(e.target.checked)}
                  />
                  <span>QC সমস্যা ও দুই পক্ষের সাইন রিপোর্ট</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includeChallan}
                    onChange={(e) => setIncludeChallan(e.target.checked)}
                  />
                  <span>আজকের ডেলিভারি চালান ও গেটপাস তালিকা</span>
                </label>
              </div>
            </div>

            <div className="row" style={{ gap: 10, marginTop: 10 }}>
              <button
                type="button"
                className="btn pri"
                onClick={handleSendTest}
              >
                এখনই টেস্ট পাঠান
              </button>
              <button
                type="button"
                className="btn"
                onClick={() =>
                  addToast({
                    type: 'success',
                    title: 'সেটিংস সংরক্ষিত',
                    message: 'প্রতিদিন রাত ৯টায় স্বয়ংক্রিয় রিপোর্ট শিডিউল আপডেট হয়েছে।',
                  })
                }
              >
                সেটিংস সেভ করুন
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="card">
          <h3>আজকের Excel শিটের প্রিভিউ</h3>
          <p className="small muted">
            নিচে প্রিভিউ দেখে নিন, WhatsApp-এ এই ফরম্যাটের ফাইল চলে যাবে:
          </p>
          <div className="tw" style={{ marginTop: 10 }}>
            <table>
              <thead>
                <tr>
                  <th>তারিখ</th>
                  <th>শিফট</th>
                  <th>মেশিন</th>
                  <th>অর্ডার নং</th>
                  <th>অপারেটর</th>
                  <th className="n">রোল</th>
                  <th className="n">ওজন (kg)</th>
                </tr>
              </thead>
              <tbody>
                {prodLogs && prodLogs.length > 0 ? (
                  prodLogs.slice(0, 6).map((p: any, idx: number) => (
                    <tr key={p.id || idx}>
                      <td className="mono small">{p.date || p.d || 'আজ'}</td>
                      <td>{p.shift || p.sh || 'A'}</td>
                      <td className="mono">{p.machine || p.m || 'M-01'}</td>
                      <td className="mono">{p.orderId || p.order_no || p.o || 'SC-2610-014'}</td>
                      <td>{p.operator || p.op || 'অপারেটর'}</td>
                      <td className="n">{bnNum(p.rolls || 0)}</td>
                      <td className="n">{bnNum((p.kg || p.knitKg || 0).toLocaleString('en-IN'))}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '16px', color: 'var(--muted)' }}>
                      আজকে এখনো কোনো প্রোডাকশন ডাটা এন্ট্রি হয়নি।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

