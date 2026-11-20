import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';

export const KK_ICONS: Record<string, string> = {
  dash: '<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>',
  ord: '<path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/>',
  prod: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  qc: '<path d="M9 12l2 2 4-4"/><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/>',
  acc: '<path d="M3 7h18v12H3z"/><path d="M3 11h18M7 15h3"/>',
  att: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><path d="M16 11l2 2 3-4"/>',
  usr: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"/>',
  wa: '<path d="M4 20l1.5-4A8 8 0 1 1 9 19z"/><path d="M9 9c0 3 3 6 6 6"/>',
  pty2: '<path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  pty: '<path d="M3 21V8l6-4 6 4v13"/><path d="M15 12h6v9"/><path d="M7 12h4M7 16h4"/>',
  bill: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  led: '<path d="M4 5c3-1 5-1 8 1 3-2 5-2 8-1v14c-3-1-5-1-8 1-3-2-5-2-8-1z"/><path d="M12 6v14"/>',
  plan: '<path d="M5 4h14v16H5z"/><path d="M9 4v16"/><path d="M12 9h4M12 13h4"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
  job: '<path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h3"/><path d="M14 15h1v1h-1z"/>',
  truck: '<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
  yarn: '<circle cx="12" cy="12" r="8"/><path d="M6 8c4 1 8 5 9 11M9 4.5c3 2 6 6 7 12M4.5 13c3-.5 7 1 10 6"/>',
  box: '<path d="M3 7l9-4 9 4-9 4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
};

export const NAV_FAC: ([ 'grp', string ] | [ string, string, string, string ])[] = [
  ['grp', 'প্রতিদিনের কাজ'],
  ['dash', 'ড্যাশবোর্ড', 'dash', '/dashboard'],
  ['orders', 'অর্ডার', 'ord', '/dashboard/orders'],
  ['jobcard', 'জব কার্ড', 'job', '/dashboard/jobcard'],
  ['entry', 'প্রোডাকশন এন্ট্রি', 'prod', '/dashboard/entry'],
  ['fmsg', 'মেসেজ', 'chat', '/dashboard/fmsg'],
  ['freem', 'খালি মেশিন', 'search', '/dashboard/freem'],
  ['qc', 'QC ও কাপড়ের সমস্যা', 'qc', '/dashboard/qc'],

  ['grp', 'কাপড়, সুতা ও স্টোর'],
  ['fready', 'রেডি কাপড়', 'box', '/dashboard/fready'],
  ['challan', 'ডেলিভারি চালান', 'truck', '/dashboard/challan'],
  ['yarn', 'সুতা ট্র্যাকার', 'yarn', '/dashboard/yarn'],
  ['store', 'স্টোর ও পার্টস', 'box', '/dashboard/store'],

  ['grp', 'বিল ও হিসাব'],
  ['party', 'পার্টি তালিকা', 'pty', '/dashboard/party'],
  ['bill', 'বিল ও ভাউচার', 'bill', '/dashboard/bill'],
  ['ledger', 'পার্টি লেজার', 'led', '/dashboard/ledger'],
  ['acc', 'খরচ, ব্যাংক ও LC', 'acc', '/dashboard/acc'],
  ['att', 'হাজিরা ও বেতন', 'att', '/dashboard/att'],

  ['grp', 'সেটিংস'],
  ['profile', 'প্রোফাইল ও সেটিংস', 'usr', '/dashboard/profile'],
  ['users', 'ইউজার ও পারমিশন', 'usr', '/dashboard/users'],
  ['wa', 'WhatsApp রিপোর্ট', 'wa', '/dashboard/wa'],

  ['grp', 'আয় করুন'],
  ['pdash', 'পার্টনার প্রোগ্রাম', 'pty2', '/dashboard/pdash'],
];

export const NAV_VEN: ([ 'grp', string ] | [ string, string, string, string ])[] = [
  ['grp', 'ABC Knit Composite'],
  ['vorders', 'আমার অর্ডার', 'ord', '/dashboard/vorders'],
  ['vreport', 'দৈনিক রিপোর্ট', 'wa', '/dashboard/vreport'],
  ['jobcard', 'জব কার্ড', 'job', '/dashboard/jobcard'],
  ['qc', 'QC ও কাপড়ের সমস্যা', 'qc', '/dashboard/qc'],
  ['fmsg', 'মেসেজ', 'chat', '/dashboard/fmsg'],

  ['grp', 'কাপড় ও সুতা'],
  ['fready', 'রেডি কাপড়', 'box', '/dashboard/fready'],
  ['challan', 'ডেলিভারি চালান', 'truck', '/dashboard/challan'],
  ['yarn', 'সুতা ব্যালেন্স', 'yarn', '/dashboard/yarn'],

  ['grp', 'বিল ও হিসাব'],
  ['bill', 'বিল ও পেমেন্ট', 'bill', '/dashboard/bill'],
  ['ledger', 'আমার হিসাব (লেজার)', 'led', '/dashboard/ledger'],

  ['grp', 'সেটিংস'],
  ['profile', 'প্রোফাইল ও সেটিংস', 'usr', '/dashboard/profile'],
];

export const FactoryLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, setRole, currentUser, users, factoryProfile, logout } = useApp();

  // Redirect unauthenticated guests to login
  React.useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true });
    }
  }, [currentUser, navigate]);

  const isVendor = role === 'vendor' || (role as string) === 'ven';
  const currentNav = isVendor ? NAV_VEN : NAV_FAC;

  // Extract active path segment (e.g. /dashboard/orders -> 'orders')
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentSegment = pathParts[1] || (isVendor ? 'vorders' : 'dash');

  if (!currentUser) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Top Header exact from KnitKhata.html */}
      <header className="top">
        <div className="brand">
          <div className="logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--surface)" strokeWidth="2">
              <path d="M4 8c4 0 4 8 8 8s4-8 8-8" />
              <path d="M4 14c4 0 4 6 8 6s4-6 8-6" opacity=".6" />
              <path d="M4 3c4 0 4 7 8 7s4-7 8-7" opacity=".35" />
            </svg>
          </div>
          <div>
            <b>নিটখাতা</b>
            <small>
              {isVendor
                ? `ABC Knit Composite (ভেন্ডর ভিউ) · ফ্যাক্টরি: ${factoryProfile?.name || 'রহমান নিটিং ইন্ডাস্ট্রিজ'}`
                : (currentUser?.organization_name || factoryProfile?.name || 'রহমান নিটিং ইন্ডাস্ট্রিজ')}
            </small>
          </div>
        </div>

        <span className="proto" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
          লাইভ সিঙ্ক
        </span>

        <div className="roleswitch" role="group" aria-label="কার চোখে দেখবেন">
          <button
            id="r-fac"
            className={!isVendor ? 'on' : ''}
            onClick={() => {
              setRole('owner');
              navigate('/dashboard');
            }}
          >
            ফ্যাক্টরি ভিউ
          </button>
          <button
            id="r-ven"
            className={isVendor ? 'on' : ''}
            onClick={() => {
              setRole('vendor');
              navigate('/dashboard/vorders');
            }}
          >
            ভেন্ডর ভিউ (ABC)
          </button>
        </div>

        <button
          type="button"
          className="top-user"
          id="topUser"
          onClick={() => {
            navigate('/dashboard/profile');
            window.scrollTo(0, 0);
          }}
          aria-label="প্রোফাইল ও সেটিংস"
        >
          <span className="av">
            {isVendor ? 'ক' : (currentUser?.name || users[0]?.name || 'আরিফ')[0]}
          </span>
          <span>
            <b id="tuN">
              {isVendor ? 'মো. কামরুল হাসান' : (currentUser?.name || users[0]?.name || 'আরিফ হোসেন')}
            </b>
            <small id="tuR">
              {isVendor ? 'মার্চেন্ডাইজার (ABC)' : (currentUser?.designation || 'মালিক')}
            </small>
          </span>
        </button>

        <button
          type="button"
          className="btn sm"
          id="topOut"
          onClick={logout}
        >
          লগআউট
        </button>
      </header>

      {/* App Shell with Left Rail & Working Canvas */}
      <div className="shell">
        <nav className="rail" id="rail">
          {currentNav.map((item, idx) => {
            if (item[0] === 'grp') {
              return (
                <div key={`grp-${idx}`} className="grp">
                  {item[1]}
                </div>
              );
            }
            const [id, label, iconKey, path] = item as [string, string, string, string];

            // Active when current path matches or when in subpage like /dashboard/orders/:id or /dashboard/detail
            const active =
              currentSegment === id ||
              (id === 'dash' && (location.pathname === '/dashboard' || location.pathname === '/dashboard/')) ||
              (id === 'orders' && (currentSegment === 'orders' || currentSegment === 'detail' || currentSegment === 'neworder')) ||
              (id === 'bill' && currentSegment === 'billdoc') ||
              (id === 'freem' && currentSegment === 'subcontract');

            const badge = id === 'fmsg' ? 2 : id === 'freem' ? 1 : null;

            return (
              <button
                key={id}
                data-v={id}
                className={active ? 'on' : ''}
                onClick={() => {
                  navigate(path);
                  window.scrollTo(0, 0);
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  dangerouslySetInnerHTML={{ __html: KK_ICONS[iconKey] || '' }}
                />
                {label}
                {badge !== null && (
                  <span className="ch-un" style={{ marginLeft: 'auto' }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Working Canvas for child page route */}
        <main id="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

