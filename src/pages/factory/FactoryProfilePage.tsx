import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';

export const FactoryProfilePage: React.FC = () => {
  const { role, factoryProfile, updateFactoryProfileInfo, parties, logout, addToast } = useApp();
  const isVendor = role === 'vendor' || (role as string) === 'ven';
  const [tab, setTab] = useState<'org' | 'pay' | 'notif' | 'sec'>('org');

  const vendorParty = parties.find(
    (p) => p.code === 'abc' || (p.name && p.name.includes('ABC'))
  );

  // Org form state
  const [orgName, setOrgName] = useState<string>(
    isVendor
      ? vendorParty?.name || 'ABC Knit Composite'
      : factoryProfile.name || 'রহমান নিটিং ইন্ডাস্ট্রিজ'
  );
  const [area, setArea] = useState<string>(
    isVendor
      ? vendorParty?.addr || 'আশুলিয়া, সাভার, ঢাকা'
      : factoryProfile.area || 'কড্ডা, কাশিমপুর রোড, গাজীপুর'
  );
  const [phone, setPhone] = useState<string>(
    isVendor
      ? vendorParty?.phone || '01913000000'
      : '01711000000'
  );
  const [bin, setBin] = useState<string>(isVendor ? '002984123-0102' : '001234567-0101');
  const [totalMc, setTotalMc] = useState<number>(isVendor ? 0 : factoryProfile.totalMachines || 24);

  // Bank & Pay form state
  const [bankName, setBankName] = useState<string>(
    isVendor ? 'ব্র্যাক ব্যাংক লিঃ' : 'ইসলামী ব্যাংক বাংলাদেশ লিঃ'
  );
  const [branch, setBranch] = useState<string>(isVendor ? 'আশুলিয়া শাখা' : 'গাজীপুর চৌরাস্তা শাখা');
  const [accNo, setAccNo] = useState<string>(isVendor ? '1501200000001' : '20501234567890100');
  const [routing, setRouting] = useState<string>(isVendor ? '060261891' : '125271890');
  const [bkashMerchant, setBkashMerchant] = useState<string>(isVendor ? '01913-998877' : '01711-234567');

  // Security form state
  const [oldPw, setOldPw] = useState<string>('');
  const [newPw, setNewPw] = useState<string>('');

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateFactoryProfileInfo({
      name: orgName,
      area,
      totalMachines: totalMc,
    });
    addToast({
      type: 'success',
      title: 'প্রোফাইল আপডেট হয়েছে',
      message: 'প্রতিষ্ঠানের তথ্য সফলভাবে সংরক্ষিত হয়েছে।',
    });
  };

  const handleSavePay = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({
      type: 'success',
      title: 'পেমেন্ট সেটিংস সংরক্ষিত',
      message: 'ব্যাংক ও মার্চেন্ট অ্যাকাউন্টের বিবরণ আপডেট হয়েছে।',
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPw || newPw.length < 6) {
      addToast({
        type: 'error',
        title: 'ভুল ইনপুট',
        message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।',
      });
      return;
    }
    setOldPw('');
    setNewPw('');
    addToast({
      type: 'success',
      title: 'পাসওয়ার্ড সফলভাবে পরিবর্তিত',
      message: 'পরবর্তী লগইনে নতুন পাসওয়ার্ড ব্যবহার করুন।',
    });
  };

  return (
    <div style={{ maxWidth: '100%', width: '100%' }}>
      {/* Header */}
      <div className="head">
        <div>
          <h2>প্রোফাইল ও সেটিংস</h2>
          <p>
            {isVendor ? 'ভেন্ডর' : 'ফ্যাক্টরি'} · {orgName}। ভুল থাকলে বা কিছু বদলালে এখান থেকেই ঠিক করুন।
          </p>
        </div>
        <button type="button" className="btn sm" onClick={logout}>
          লগআউট
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button
          className={tab === 'org' ? 'on' : ''}
          onClick={() => setTab('org')}
        >
          প্রতিষ্ঠান
        </button>
        <button
          className={tab === 'pay' ? 'on' : ''}
          onClick={() => setTab('pay')}
        >
          টাকা-পয়সা ও ব্যাংক
        </button>
        <button
          className={tab === 'notif' ? 'on' : ''}
          onClick={() => setTab('notif')}
        >
          নোটিফিকেশন
        </button>
        <button
          className={tab === 'sec' ? 'on' : ''}
          onClick={() => setTab('sec')}
        >
          নিরাপত্তা ও পাসওয়ার্ড
        </button>
      </div>

      {/* Tab 1: Organization Settings */}
      {tab === 'org' && (
        <form className="card" onSubmit={handleSaveOrg} style={{ maxWidth: 680 }}>
          <h3>প্রতিষ্ঠানের পরিচিতি</h3>
          <p className="small muted">
            চালান, বিল ও জব কার্ডে এই নাম ও ঠিকানা প্রিন্ট হবে।
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
            <label className="f">
              প্রতিষ্ঠানের নাম *
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </label>

            <label className="f">
              কারখানার ঠিকানা *
              <input
                type="text"
                required
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label className="f">
                অফিসিয়াল ফোন নম্বর
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>

              <label className="f">
                BIN / TIN নম্বর
                <input
                  type="text"
                  value={bin}
                  onChange={(e) => setBin(e.target.value)}
                />
              </label>
            </div>

            {!isVendor && (
              <label className="f" style={{ maxWidth: 280 }}>
                মোট সার্কুলার মেশিন সংখ্যা
                <input
                  type="number"
                  value={totalMc}
                  onChange={(e) => setTotalMc(Number(e.target.value))}
                />
              </label>
            )}

            <div style={{ marginTop: 8 }}>
              <button type="submit" className="btn pri">
                সেভ করুন
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Bank & Payment Settings */}
      {tab === 'pay' && (
        <form className="card" onSubmit={handleSavePay} style={{ maxWidth: 680 }}>
          <h3>টাকা নেওয়ার ব্যাংক ও মোবাইল ব্যাংকিং হিসাব</h3>
          <p className="small muted">
            ভেন্ডররা যখন বিলের টাকা পরিশোধ করবে, তখন তারা এই ব্যাংক বিবরণ দেখতে পাবে।
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label className="f">
                ব্যাংকের নাম
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </label>

              <label className="f">
                শাখা
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label className="f">
                অ্যাকাউন্ট নম্বর
                <input
                  type="text"
                  value={accNo}
                  onChange={(e) => setAccNo(e.target.value)}
                />
              </label>

              <label className="f">
                রাউটিং নম্বর
                <input
                  type="text"
                  value={routing}
                  onChange={(e) => setRouting(e.target.value)}
                />
              </label>
            </div>

            <label className="f" style={{ maxWidth: 320 }}>
              বিকাশ / নগদ মার্চেন্ট নম্বর
              <input
                type="text"
                value={bkashMerchant}
                onChange={(e) => setBkashMerchant(e.target.value)}
              />
            </label>

            <div style={{ marginTop: 8 }}>
              <button type="submit" className="btn pri">
                পেমেন্ট তথ্য সেভ করুন
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 3: Notification Preferences */}
      {tab === 'notif' && (
        <div className="card" style={{ maxWidth: 680 }}>
          <h3>বিজ্ঞপ্তি ও নোটিফিকেশন অগ্রাধিকার</h3>
          <p className="small muted">
            কোন খবর কোথায় পেতে চান, টিক দিয়ে বেছে নিন:
          </p>

          <div className="tw" style={{ marginTop: 14 }}>
            <table>
              <thead>
                <tr>
                  <th>ঘটনা / অ্যালার্ট</th>
                  <th style={{ textAlign: 'center' }}>ইন-অ্যাপ</th>
                  <th style={{ textAlign: 'center' }}>WhatsApp</th>
                  <th style={{ textAlign: 'center' }}>SMS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>নতুন অর্ডার এন্ট্রি ও বরাদ্দ</td>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" defaultChecked />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" defaultChecked />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" />
                  </td>
                </tr>
                <tr>
                  <td>ফ্লোরে QC দ্বিমত বা কাপড়ের হোল/তেল সমস্যা</td>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" defaultChecked />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" defaultChecked />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" defaultChecked />
                  </td>
                </tr>
                <tr>
                  <td>ডেলিভারি চালানে ভেন্ডরের ডিজিটাল সাইন সম্পন্ন</td>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" defaultChecked />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" defaultChecked />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" />
                  </td>
                </tr>
                <tr>
                  <td>বিলের পেমেন্ট জমা ও RV তৈরি</td>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" defaultChecked />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" defaultChecked />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" defaultChecked />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              className="btn pri"
              onClick={() =>
                addToast({
                  type: 'success',
                  title: 'নোটিফিকেশন সংরক্ষিত',
                  message: 'আপনার অ্যালার্ট প্রেফারেন্স আপডেট করা হয়েছে।',
                })
              }
            >
              সংরক্ষণ করুন
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Security */}
      {tab === 'sec' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680 }}>
          <form className="card" onSubmit={handleChangePassword}>
            <h3>পাসওয়ার্ড পরিবর্তন</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <label className="f">
                বর্তমান পাসওয়ার্ড
                <input
                  type="password"
                  required
                  value={oldPw}
                  onChange={(e) => setOldPw(e.target.value)}
                />
              </label>

              <label className="f">
                নতুন পাসওয়ার্ড
                <input
                  type="password"
                  required
                  placeholder="কমপক্ষে ৬ অক্ষর"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                />
              </label>

              <div>
                <button type="submit" className="btn pri">
                  পাসওয়ার্ড আপডেট করুন
                </button>
              </div>
            </div>
          </form>

          <div className="card">
            <h3>লগইন থাকা ডিভাইস</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 10,
                  borderRadius: 8,
                  background: 'var(--surface2)',
                }}
              >
                <div>
                  <b>Windows PC · Chrome Browser</b>
                  <div className="small muted">গাজীপুর · সক্রিয় এখন</div>
                </div>
                <span className="pill p-ok">এই ডিভাইস</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 10,
                  borderRadius: 8,
                  background: 'var(--surface2)',
                }}
              >
                <div>
                  <b>Android Phone · নিটখাতা অ্যাপ</b>
                  <div className="small muted">ঢাকা · গতকাল রাত ১০:১২</div>
                </div>
                <button
                  type="button"
                  className="btn sm"
                  onClick={() =>
                    addToast({
                      type: 'info',
                      title: 'ডিভাইস লগআউট',
                      message: 'Android Phone থেকে সেশন সমাপ্ত করা হয়েছে।',
                    })
                  }
                >
                  লগআউট
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

