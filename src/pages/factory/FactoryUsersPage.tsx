import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { bnNum } from '@/utils/formatters';

export const FactoryUsersPage: React.FC = () => {
  const { users, addUser, toggleUserStatus, addToast, t, language } = useApp();
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form state
  const [name, setName] = useState<string>('');
  const [roleTitle, setRoleTitle] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [org, setOrg] = useState<string>('রহমান নিটিং ইন্ডাস্ট্রিজ');
  const [canMsg, setCanMsg] = useState<boolean>(true);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    await addUser({
      name,
      designation: roleTitle || 'স্টাফ',
      phone,
      email: `${phone}@knitkhata.com`,
      role: (org.includes('রহমান') ? 'owner' : 'vendor') as any,
      shift: 'সাধারণ',
      status: 'Active',
      organization_name: org,
      is_active: true,
      can_message: canMsg,
      is_vendor_rep: !org.includes('রহমান'),
    });
    setName('');
    setRoleTitle('');
    setPhone('');
    setShowAddModal(false);
  };

  const handleToggle = (id: string, currentStatus: boolean, userName: string) => {
    toggleUserStatus(id);
    addToast({
      type: currentStatus ? 'info' : 'success',
      title: 'ইউজার স্ট্যাটাস পরিবর্তন',
      message: `${userName} এর অ্যাকাউন্ট ${currentStatus ? 'নিষ্ক্রিয়' : 'সক্রিয়'} করা হয়েছে।`,
    });
  };

  return (
    <div style={{ maxWidth: '100%', width: '100%' }}>
      {/* Header */}
      <div className="head">
        <div>
          <h2>{t('ইউজার ও পারমিশন')}</h2>
          <p>
            {t('ফ্যাক্টরি আর ভেন্ডরের কারা নিটখাতা দেখতে ও লিখতে পারবে। নতুন ইউজার যোগ করতে ফোন নম্বর লিখুন, SMS-এ ওটিপি যাবে।')}
          </p>
        </div>
        <button
          type="button"
          className="btn pri"
          onClick={() => setShowAddModal(true)}
        >
          + {t('নতুন ইউজার যোগ করুন')}
        </button>
      </div>

      {/* 3 KPIs */}
      <div className="kpis">
        <div className="kpi">
          <span>{t('মোট ইউজার')}</span>
          <b>{bnNum(users.length)} {language === 'en' ? 'users' : 'জন'}</b>
          <i>{t('ফ্যাক্টরি ও ভেন্ডর মিলে')}</i>
        </div>
        <div className="kpi">
          <span>{t('সক্রিয় ইউজার')}</span>
          <b style={{ color: 'var(--ok)' }}>
            {bnNum(users.filter((u) => u.is_active).length)} {language === 'en' ? 'active' : 'জন'}
          </b>
          <i>{t('লগইন অনুমতিপ্রাপ্ত')}</i>
        </div>
        <div className="kpi">
          <span>{t('মেসেজের অনুমতি')}</span>
          <b>{bnNum(users.filter((u) => u.can_message).length)} {language === 'en' ? 'permitted' : 'জন'}</b>
          <i>{t('সরাসরি চ্যাটে যুক্ত')}</i>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>{t('নাম ও পদবী')}</th>
                <th>{t('প্রতিষ্ঠান')}</th>
                <th>{t('মোবাইল নম্বর')}</th>
                <th style={{ textAlign: 'center' }}>{t('মেসেজের অনুমতি')}</th>
                <th style={{ textAlign: 'center' }}>{t('অবস্থা')}</th>
                <th>{t('শেষ লগইন')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <b>{u.name}</b>
                    <div className="small muted">{u.designation || (language === 'en' ? 'Staff' : 'স্টাফ')}</div>
                  </td>
                  <td>{u.organization_name || (language === 'en' ? 'Rahman Knitting Industries' : 'রহমান নিটিং ইন্ডাস্ট্রিজ')}</td>
                  <td className="mono small">{u.phone}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      className={`pill ${
                        u.can_message ? 'p-ok' : 'p-warn'
                      }`}
                    >
                      {u.can_message ? t('অনুমতি আছে') : t('অনুমতি নেই')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className={`btn sm ${u.is_active ? 'pri' : ''}`}
                      onClick={() => handleToggle(u.id, Boolean(u.is_active), u.name)}
                    >
                      {u.is_active ? t('সক্রিয়') : t('নিষ্ক্রিয়')}
                    </button>
                  </td>
                  <td className="small muted">{u.last_login_label || (language === 'en' ? 'Today 10:15' : 'আজ ১০:১৫')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
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
            onSubmit={handleCreateUser}
          >
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>{t('নতুন ইউজার যোগ করুন')}</h3>
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
                {t('নাম')} *
                <input
                  type="text"
                  required
                  placeholder={language === 'en' ? 'e.g. Tanvir Ahmed' : 'যেমন: তানভীর আহমেদ'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

              <label className="f">
                {t('পদবী')} *
                <input
                  type="text"
                  required
                  placeholder={language === 'en' ? 'e.g. Floor Supervisor' : 'যেমন: হিসাবরক্ষক / ফ্লোর সুপারভাইজার'}
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                />
              </label>

              <label className="f">
                {t('মোবাইল নম্বর')} *
                <input
                  type="text"
                  required
                  placeholder="01711000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>

              <label className="f">
                {t('প্রতিষ্ঠান')}
                <select value={org} onChange={(e) => setOrg(e.target.value)}>
                  <option value="রহমান নিটিং ইন্ডাস্ট্রিজ">{language === 'en' ? 'Rahman Knitting Industries (Factory)' : 'রহমান নিটিং ইন্ডাস্ট্রিজ (ফ্যাক্টরি)'}</option>
                  <option value="ABC Knit Composite">{language === 'en' ? 'ABC Knit Composite (Vendor)' : 'ABC Knit Composite (ভেন্ডর)'}</option>
                  <option value="XYZ Fashion Ltd">{language === 'en' ? 'XYZ Fashion Ltd (Vendor)' : 'XYZ Fashion Ltd (ভেন্ডর)'}</option>
                </select>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={canMsg}
                  onChange={(e) => setCanMsg(e.target.checked)}
                />
                <span>{language === 'en' ? 'Allow messaging with vendors and factory team' : 'ভেন্ডর ও টিমের সাথে মেসেজ আদান-প্রদানের অনুমতি দিন'}</span>
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
                {t('সেভ করুন')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
