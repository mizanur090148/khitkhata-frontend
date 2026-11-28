import React, { useState } from 'react';
import { Building2, CreditCard, Bell, ShieldCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export const FactoryProfilePage: React.FC = () => {
  const { role, factoryProfile, updateFactoryProfileInfo, parties, logout, addToast, t, language } = useApp();
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
      title: language === 'en' ? 'Profile Updated' : 'প্রোফাইল আপডেট হয়েছে',
      message: language === 'en' ? 'Organization details saved successfully.' : 'প্রতিষ্ঠানের তথ্য সফলভাবে সংরক্ষিত হয়েছে।',
    });
  };

  const handleSavePay = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({
      type: 'success',
      title: language === 'en' ? 'Payment Settings Saved' : 'পেমেন্ট সেটিংস সংরক্ষিত',
      message: language === 'en' ? 'Bank and merchant account details updated.' : 'ব্যাংক ও মার্চেন্ট অ্যাকাউন্টের বিবরণ আপডেট হয়েছে।',
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPw || newPw.length < 6) {
      addToast({
        type: 'error',
        title: language === 'en' ? 'Invalid Input' : 'ভুল ইনপুট',
        message: language === 'en' ? 'Password must be at least 6 characters long.' : 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।',
      });
      return;
    }
    setOldPw('');
    setNewPw('');
    addToast({
      type: 'success',
      title: language === 'en' ? 'Password Changed' : 'পাসওয়ার্ড সফলভাবে পরিবর্তিত',
      message: language === 'en' ? 'Please use your new password on next login.' : 'পরবর্তী লগইনে নতুন পাসওয়ার্ড ব্যবহার করুন।',
    });
  };

  const tabList = [
    {
      id: 'org' as const,
      icon: Building2,
      label: language === 'en' ? 'Organization' : 'প্রতিষ্ঠান',
      desc: language === 'en' ? 'Name, address & machines' : 'নাম, কারখানা ও মেশিন সংখ্যা',
    },
    {
      id: 'pay' as const,
      icon: CreditCard,
      label: language === 'en' ? 'Bank & Accounts' : 'টাকা-পয়সা ও ব্যাংক',
      desc: language === 'en' ? 'Bank details & bKash' : 'ব্যাংক হিসাব ও মার্চেন্ট নম্বর',
    },
    {
      id: 'notif' as const,
      icon: Bell,
      label: language === 'en' ? 'Notifications' : 'নোটিফিকেশন',
      desc: language === 'en' ? 'WhatsApp, SMS & alerts' : 'অ্যালার্ট, হোয়াটসঅ্যাপ ও এসএমএস',
    },
    {
      id: 'sec' as const,
      icon: ShieldCheck,
      label: language === 'en' ? 'Security' : 'নিরাপত্তা ও পাসওয়ার্ড',
      desc: language === 'en' ? 'Password & active devices' : 'পাসওয়ার্ড ও সক্রিয় ডিভাইস',
    },
  ];

  return (
    <div style={{ maxWidth: '100%', width: '100%' }}>
      {/* Header */}
      <div className="head" style={{ marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>{t('প্রোফাইল ও সেটিংস')}</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)' }}>
            {isVendor ? (language === 'en' ? 'Vendor' : 'ভেন্ডর') : (language === 'en' ? 'Factory' : 'ফ্যাক্টরি')} · <b>{orgName}</b>। {language === 'en' ? 'Update or configure your official profile and preferences here.' : 'ভুল থাকলে বা কিছু বদলালে এখান থেকেই ঠিক করুন।'}
          </p>
        </div>
      </div>

      {/* Main 2-column Profile Layout using .pf & .pf-tabs */}
      <div className="pf">
        {/* Left Sidebar Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Identity Card */}
          <div
            className="card"
            style={{
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                background: 'var(--grad, linear-gradient(135deg, #2563EB 0%, #4F46E5 100%))',
                color: '#ffffff',
                display: 'grid',
                placeItems: 'center',
                fontSize: '1.35rem',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {orgName.trim().charAt(0) || 'K'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <b style={{ display: 'block', fontSize: '0.94rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {orgName}
              </b>
              <span className="pill p-ok" style={{ marginTop: 4, display: 'inline-block', fontSize: '0.72rem' }}>
                {isVendor ? (language === 'en' ? 'Vendor Portal' : 'ভেন্ডর পোর্টাল') : (language === 'en' ? 'Knitting Factory' : 'নিটিং ফ্যাক্টরি')}
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="pf-tabs" role="tablist">
            {tabList.map((tItem) => {
              const Icon = tItem.icon;
              const isActive = tab === tItem.id;
              return (
                <button
                  key={tItem.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={isActive ? 'on' : ''}
                  onClick={() => setTab(tItem.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: isActive ? '1px solid var(--accent, #2563eb)' : '1px solid var(--line, transparent)',
                    background: isActive ? 'var(--accent-soft, #e7edff)' : 'var(--surface, #ffffff)',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      display: 'grid',
                      placeItems: 'center',
                      background: isActive ? 'var(--accent, #2563eb)' : 'var(--surface2, #f1f5f9)',
                      color: isActive ? '#ffffff' : 'var(--muted, #64748b)',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={17} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', minWidth: 0 }}>
                    <span
                      style={{
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '0.9rem',
                        color: isActive ? 'var(--accent, #2563eb)' : 'var(--ink, #1e293b)',
                      }}
                    >
                      {tItem.label}
                    </span>
                    <small
                      style={{
                        fontSize: '0.73rem',
                        color: 'var(--muted, #64748b)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginTop: 2,
                      }}
                    >
                      {tItem.desc}
                    </small>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Main Content Area */}
        <div className="pf-body" style={{ minWidth: 0 }}>
          {/* Tab 1: Organization Settings */}
          {tab === 'org' && (
            <form className="card" onSubmit={handleSaveOrg} style={{ margin: 0 }}>
              <h3 style={{ margin: 0 }}>{language === 'en' ? 'Organization Profile' : t('প্রতিষ্ঠানের পরিচিতি')}</h3>
              <p className="small muted" style={{ margin: '4px 0 0' }}>
                {language === 'en' ? 'This official name and address appears on delivery challans, bills, and job cards.' : t('চালান, বিল ও জব কার্ডে এই নাম ও ঠিকানা প্রিন্ট হবে।')}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
                <label className="f">
                  {language === 'en' ? 'Organization / Factory Name *' : t('প্রতিষ্ঠানের নাম *')}
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </label>

                <label className="f">
                  {language === 'en' ? 'Factory / Office Address *' : t('কারখানার ঠিকানা *')}
                  <input
                    type="text"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                  />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  <label className="f">
                    {language === 'en' ? 'Official Phone Number' : t('অফিসিয়াল ফোন নম্বর')}
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </label>

                  <label className="f">
                    {language === 'en' ? 'BIN / TIN Number' : t('BIN / TIN নম্বর')}
                    <input
                      type="text"
                      value={bin}
                      onChange={(e) => setBin(e.target.value)}
                    />
                  </label>
                </div>

                {!isVendor && (
                  <label className="f" style={{ maxWidth: 280 }}>
                    {language === 'en' ? 'Total Circular Knitting Machines' : t('মোট সার্কুলার মেশিন সংখ্যা')}
                    <input
                      type="number"
                      value={totalMc}
                      onChange={(e) => setTotalMc(Number(e.target.value))}
                    />
                  </label>
                )}

                <div style={{ marginTop: 8 }}>
                  <button type="submit" className="btn pri">
                    {language === 'en' ? 'Save Changes' : t('সেভ করুন')}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Tab 2: Bank & Payment Settings */}
          {tab === 'pay' && (
            <form className="card" onSubmit={handleSavePay} style={{ margin: 0 }}>
              <h3 style={{ margin: 0 }}>{language === 'en' ? 'Bank & Mobile Banking Accounts' : t('টাকা নেওয়ার ব্যাংক ও মোবাইল ব্যাংকিং হিসাব')}</h3>
              <p className="small muted" style={{ margin: '4px 0 0' }}>
                {language === 'en' ? 'Vendors will view these official account details when paying bills.' : t('ভেন্ডররা যখন বিলের টাকা পরিশোধ করবে, তখন তারা এই ব্যাংক বিবরণ দেখতে পাবে।')}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  <label className="f">
                    {language === 'en' ? 'Bank Name' : t('ব্যাংকের নাম')}
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                    />
                  </label>

                  <label className="f">
                    {language === 'en' ? 'Branch Name' : t(' শাখা')}
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                    />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  <label className="f">
                    {language === 'en' ? 'Account Number' : t('অ্যাকাউন্ট নম্বর')}
                    <input
                      type="text"
                      value={accNo}
                      onChange={(e) => setAccNo(e.target.value)}
                    />
                  </label>

                  <label className="f">
                    {language === 'en' ? 'Routing Number' : t('রাউটিং নম্বর')}
                    <input
                      type="text"
                      value={routing}
                      onChange={(e) => setRouting(e.target.value)}
                    />
                  </label>
                </div>

                <label className="f" style={{ maxWidth: 320 }}>
                  {language === 'en' ? 'bKash / Nagad Merchant Number' : t('বিকাশ / নগদ মার্চেন্ট নম্বর')}
                  <input
                    type="text"
                    value={bkashMerchant}
                    onChange={(e) => setBkashMerchant(e.target.value)}
                  />
                </label>

                <div style={{ marginTop: 8 }}>
                  <button type="submit" className="btn pri">
                    {language === 'en' ? 'Save Payment Details' : t('পেমেন্ট তথ্য সেভ করুন')}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Tab 3: Notification Preferences */}
          {tab === 'notif' && (
            <div className="card" style={{ margin: 0 }}>
              <h3 style={{ margin: 0 }}>{language === 'en' ? 'Notification & Alert Preferences' : t('বিজ্ঞপ্তি ও নোটিফিকেশন অগ্রাধিকার')}</h3>
              <p className="small muted" style={{ margin: '4px 0 0' }}>
                {language === 'en' ? 'Select which channels receive notifications for factory events:' : t('কোন খবর কোথায় পেতে চান, টিক দিয়ে বেছে নিন:')}
              </p>

              <div className="tw" style={{ marginTop: 16 }}>
                <table>
                  <thead>
                    <tr>
                      <th>{language === 'en' ? 'Event / Alert' : t('ঘটনা / অ্যালার্ট')}</th>
                      <th style={{ textAlign: 'center' }}>{language === 'en' ? 'In-App' : t('ইন-অ্যাপ')}</th>
                      <th style={{ textAlign: 'center' }}>WhatsApp</th>
                      <th style={{ textAlign: 'center' }}>SMS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{language === 'en' ? 'New order entry & allocation' : t('নতুন অর্ডার এন্ট্রি ও বরাদ্দ')}</td>
                      <td style={{ textAlign: 'center' }}><input type="checkbox" defaultChecked /></td>
                      <td style={{ textAlign: 'center' }}><input type="checkbox" defaultChecked /></td>
                      <td style={{ textAlign: 'center' }}><input type="checkbox" /></td>
                    </tr>
                    <tr>
                      <td>{language === 'en' ? 'Floor QC dispute or fabric defect/hole alert' : t('ফ্লোরে QC দ্বিমত বা কাপড়ের হোল/তেল সমস্যা')}</td>
                      <td style={{ textAlign: 'center' }}><input type="checkbox" defaultChecked /></td>
                      <td style={{ textAlign: 'center' }}><input type="checkbox" defaultChecked /></td>
                      <td style={{ textAlign: 'center' }}><input type="checkbox" defaultChecked /></td>
                    </tr>
                    <tr>
                      <td>{language === 'en' ? 'Vendor digital signature on delivery challan' : t('ডেলিভারি চালানে ভেন্ডরের ডিজিটাল সাইন সম্পন্ন')}</td>
                      <td style={{ textAlign: 'center' }}><input type="checkbox" defaultChecked /></td>
                      <td style={{ textAlign: 'center' }}><input type="checkbox" defaultChecked /></td>
                      <td style={{ textAlign: 'center' }}><input type="checkbox" /></td>
                    </tr>
                    <tr>
                      <td>{language === 'en' ? 'Bill payment received & RV generation' : t('বিলের পেমেন্ট জমা ও RV তৈরি')}</td>
                      <td style={{ textAlign: 'center' }}><input type="checkbox" defaultChecked /></td>
                      <td style={{ textAlign: 'center' }}><input type="checkbox" defaultChecked /></td>
                      <td style={{ textAlign: 'center' }}><input type="checkbox" defaultChecked /></td>
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
                      title: language === 'en' ? 'Preferences Saved' : 'নোটিফিকেশন সংরক্ষিত',
                      message: language === 'en' ? 'Your alert preferences have been successfully updated.' : 'আপনার অ্যালার্ট প্রেফারেন্স আপডেট করা হয়েছে।',
                    })
                  }
                >
                  {language === 'en' ? 'Save Preferences' : t('সংরক্ষণ করুন')}
                </button>
              </div>
            </div>
          )}

          {/* Tab 4: Security */}
          {tab === 'sec' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <form className="card" onSubmit={handleChangePassword} style={{ margin: 0 }}>
                <h3 style={{ margin: 0 }}>{language === 'en' ? 'Change Password' : t('পাসওয়ার্ড পরিবর্তন')}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                  <label className="f">
                    {language === 'en' ? 'Current Password' : t('বর্তমান পাসওয়ার্ড')}
                    <input
                      type="password"
                      required
                      value={oldPw}
                      onChange={(e) => setOldPw(e.target.value)}
                    />
                  </label>

                  <label className="f">
                    {language === 'en' ? 'New Password' : t('নতুন পাসওয়ার্ড')}
                    <input
                      type="password"
                      required
                      placeholder={language === 'en' ? 'At least 6 characters' : 'কমপক্ষে ৬ অক্ষর'}
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                    />
                  </label>

                  <div>
                    <button type="submit" className="btn pri">
                      {language === 'en' ? 'Update Password' : t('পাসওয়ার্ড আপডেট করুন')}
                    </button>
                  </div>
                </div>
              </form>

              <div className="card" style={{ margin: 0 }}>
                <h3 style={{ margin: 0 }}>{language === 'en' ? 'Logged In Devices' : t('লগইন থাকা ডিভাইস')}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: 'var(--surface2)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <div>
                      <b>Windows PC · Chrome Browser</b>
                      <div className="small muted" style={{ marginTop: 2 }}>
                        {language === 'en' ? 'Gazipur · Active now' : t('গাজীপুর · সক্রিয় এখন')}
                      </div>
                    </div>
                    <span className="pill p-ok">{language === 'en' ? 'This Device' : t('এই ডিভাইস')}</span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: 'var(--surface2)',
                      border: '1px solid var(--line)',
                    }}
                  >
                    <div>
                      <b>Android Phone · {language === 'en' ? 'KnitKhata App' : t('নিটখাতা')}</b>
                      <div className="small muted" style={{ marginTop: 2 }}>
                        {language === 'en' ? 'Dhaka · Yesterday 10:12 PM' : t('ঢাকা · গতকাল রাত ১০:১২')}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn sm"
                      onClick={() =>
                        addToast({
                          type: 'info',
                          title: language === 'en' ? 'Device Logged Out' : 'ডিভাইস লগআউট',
                          message: language === 'en' ? 'Session on Android Phone has been terminated.' : 'Android Phone থেকে সেশন সমাপ্ত করা হয়েছে।',
                        })
                      }
                    >
                      {language === 'en' ? 'Terminate' : t('লগআউট')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

