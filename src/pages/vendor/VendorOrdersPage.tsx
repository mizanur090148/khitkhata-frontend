import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { bnNum } from '@/utils/formatters';

export const VendorOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { orders, fetchOrders, factoryProfile, t, language } = useApp();
  const [filter, setFilter] = useState<'all' | 'run' | 'done'>('all');

  useEffect(() => {
    fetchOrders?.();
  }, []);

  // Vendor orders (ABC Knit Composite or matched)
  const vendorOrders = orders.filter(
    (o) =>
      o.party_code === 'abc' ||
      o.party === 'abc' ||
      o.v === 'abc' ||
      (o.party && o.party.includes('ABC'))
  );

  const filteredOrders = vendorOrders.filter((o) => {
    if (filter === 'run') return o.status === 'run' || o.status === 'Running';
    if (filter === 'done') return o.status === 'done' || o.status === 'Completed';
    return true;
  });

  const totalKg = vendorOrders.reduce((a, o) => a + (o.qty || 0), 0);
  const doneKg = vendorOrders.reduce((a, o) => a + (o.done || 0), 0);
  const remainingKg = Math.max(0, totalKg - doneKg);

  return (
    <div style={{ maxWidth: '100%', width: '100%' }}>
      {/* Vendor Portal Top Banner matching KnitKhata.html */}
      <div className="vbanner" style={{ marginBottom: 16 }}>
        {language === 'en' ? 'You are logged in as ' : 'আপনি '}<b>{language === 'en' ? 'Md. Kamrul Hasan' : 'মো. কামরুল হাসান'}</b>{language === 'en' ? ' — ' : ' হিসেবে লগইন করেছেন — '}<b>ABC Knit Composite</b>। {language === 'en' ? 'Showing only orders running at ' : 'এখানে শুধু '}<b>{factoryProfile?.name || (language === 'en' ? 'Rahman Knitting Industries' : 'রহমান নিটিং ইন্ডাস্ট্রিজ')}</b>{language === 'en' ? '.' : '-এ চলা আপনাদের অর্ডারগুলো দেখা যাচ্ছে।'}
      </div>

      {/* Header */}
      <div className="head">
        <div>
          <h2>{t('আমার অর্ডার')}</h2>
          <p>{t('ফ্যাক্টরির ফ্লোরে কতটুকু বোনা হলো, কতটুকু ডেলিভারি হলো লাইভ ট্র্যাকিং')}</p>
        </div>
      </div>

      {/* 3 KPIs */}
      <div className="kpis">
        <div className="kpi">
          <span>{t('মোট অর্ডার')}</span>
          <b>{bnNum(vendorOrders.length)} {language === 'en' ? 'orders' : 'টি'}</b>
          <i>{t('মোট')} {bnNum(totalKg)} kg</i>
        </div>
        <div className="kpi">
          <span>{t('এখন পর্যন্ত বোনা হয়েছে')}</span>
          <b style={{ color: 'var(--ok)' }}>{bnNum(doneKg)} kg</b>
          <i>{bnNum(Math.round((doneKg / (totalKg || 1)) * 100))}% {t('সম্পন্ন')}</i>
        </div>
        <div className="kpi">
          <span>{t('বোনা বাকি')}</span>
          <b>{bnNum(remainingKg)} kg</b>
          <i>{t('চলমান শিফটে উৎপাদিত হচ্ছে')}</i>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="row" style={{ gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          className={`btn sm ${filter === 'all' ? 'pri' : ''}`}
          onClick={() => setFilter('all')}
        >
          {t('সব অর্ডার')} ({bnNum(vendorOrders.length)})
        </button>
        <button
          type="button"
          className={`btn sm ${filter === 'run' ? 'pri' : ''}`}
          onClick={() => setFilter('run')}
        >
          {t('চলমান')} ({bnNum(vendorOrders.filter((o) => o.status === 'run' || o.status === 'Running').length)})
        </button>
        <button
          type="button"
          className={`btn sm ${filter === 'done' ? 'pri' : ''}`}
          onClick={() => setFilter('done')}
        >
          {t('সম্পন্ন')} ({bnNum(vendorOrders.filter((o) => o.status === 'done' || o.status === 'Completed').length)})
        </button>
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>{t('অর্ডার নং')}</th>
                <th>{t('বায়ার')}</th>
                <th>{t('ফেব্রিক')}</th>
                <th>{t('মেশিন বরাদ্দ')}</th>
                <th className="n">{t('অর্ডার kg')}</th>
                <th className="n">{t('বোনা হয়েছে kg')}</th>
                <th style={{ minWidth: 140 }}>{t('অগ্রগতি')}</th>
                <th>{t('অবস্থা')}</th>
                <th style={{ textAlign: 'right' }}>{t('অ্যাকশন')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      textAlign: 'center',
                      padding: '36px 16px',
                      color: 'var(--muted)',
                    }}
                  >
                    {language === 'en' ? 'No orders found.' : 'কোনো অর্ডার পাওয়া যায়নি।'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                const progress = Math.min(
                  100,
                  Math.round(((o.done || 0) / (o.qty || 1)) * 100)
                );
                return (
                  <tr
                    key={o.id}
                    className="click"
                    onClick={() => navigate(`/dashboard/orders/${o.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="mono" style={{ fontWeight: 600 }}>
                      {o.id}
                    </td>
                    <td>{o.buyer || '—'}</td>
                    <td>
                      <div>{o.fabric}</div>
                      <span className="mono small muted">{o.gsm} GSM · {o.dia}</span>
                    </td>
                    <td className="mono small">
                      {Array.isArray(o.machines) && o.machines.length > 0
                        ? o.machines.join(', ')
                        : '—'}
                    </td>
                    <td className="n">{bnNum(o.qty)}</td>
                    <td className="n" style={{ fontWeight: 600 }}>
                      {bnNum(o.done)}
                    </td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            height: 6,
                            background: 'var(--surface2)',
                            borderRadius: 3,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${progress}%`,
                              height: '100%',
                              background:
                                progress >= 100 ? 'var(--ok)' : 'var(--accent)',
                            }}
                          />
                        </div>
                        <span className="mono small">{progress}%</span>
                      </div>
                    </td>
                    <td>
                      {o.status === 'run' || o.status === 'Running' ? (
                        <span className="pill p-acc">{t('চলছে')}</span>
                      ) : o.status === 'done' || o.status === 'Completed' ? (
                        <span className="pill p-ok">{t('সম্পন্ন')}</span>
                      ) : (
                        <span className="pill p-yarn">{t('অপেক্ষায়')}</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/jobcard/${o.id}`);
                        }}
                      >
                        {t('জব কার্ড')}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="small muted" style={{ marginTop: 12 }}>
        {language === 'en' ? 'Rates, operator names, and other vendor info are not visible in vendor view.' : 'রেট, অপারেটরের নাম, অন্য ভেন্ডরের তথ্য — এগুলো ভেন্ডর দেখতে পান না।'}
      </p>
    </div>
  );
};
