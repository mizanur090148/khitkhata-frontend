import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, ChevronDown } from 'lucide-react';
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
  const { role, setRole, currentUser, users, factoryProfile, logout, language, setLanguage, t } = useApp();

  const GRP_KEY_MAP: Record<string, string> = {
    'প্রতিদিনের কাজ': 'nav.grp.daily',
    'কাপড়, সুতা ও স্টোর': 'nav.grp.fabric_store',
    'বিল ও হিসাব': 'nav.grp.billing',
    'সেটিংস': 'nav.grp.settings',
    'আয় করুন': 'nav.grp.earn',
    'কাপড় ও সুতা': 'nav.grp.fabric_yarn',
  };

  const NAV_ITEM_KEY_MAP: Record<string, string> = {
    dash: 'nav.dash',
    orders: 'nav.orders',
    jobcard: 'nav.jobcard',
    entry: 'nav.entry',
    fmsg: 'nav.fmsg',
    freem: 'nav.freem',
    qc: 'nav.qc',
    fready: 'nav.fready',
    challan: 'nav.challan',
    yarn: 'nav.yarn',
    store: 'nav.store',
    party: 'nav.party',
    bill: 'nav.bill',
    ledger: 'nav.ledger',
    acc: 'nav.acc',
    att: 'nav.att',
    profile: 'nav.profile',
    users: 'nav.users',
    wa: 'nav.wa',
    pdash: 'nav.pdash',
    vorders: 'nav.vorders',
    vreport: 'nav.vreport',
  };

  // Redirect unauthenticated guests to login
  React.useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true });
    }
  }, [currentUser, navigate]);

  const isVendor = role === 'vendor' || (role as string) === 'ven';
  const currentNav = isVendor ? NAV_VEN : NAV_FAC;

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown on outside click or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserMenuOpen]);

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
            <b>{t('app.title')}</b>
            <small>
              {isVendor
                ? `ABC Knit Composite (${t('app.vendor_label')}) · ${t('app.factory_label')}: ${factoryProfile?.name || 'রহমান নিটিং ইন্ডাস্ট্রিজ'}`
                : (currentUser?.organization_name || factoryProfile?.name || 'রহমান নিটিং ইন্ডাস্ট্রিজ')}
            </small>
          </div>
        </div>

        <span className="proto" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
          {t('app.sync')}
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
            {t('app.factory_view')}
          </button>
          <button
            id="r-ven"
            className={isVendor ? 'on' : ''}
            onClick={() => {
              setRole('vendor');
              navigate('/dashboard/vorders');
            }}
          >
            {t('app.vendor_view')}
          </button>
        </div>

        {/* Multi-language Switcher (Bangla & English) */}
        <div className="roleswitch" role="group" aria-label="ভাষা পরিবর্তন / Switch Language" style={{ marginLeft: 4 }}>
          <button
            id="lang-bn"
            type="button"
            className={language === 'bn' ? 'on' : ''}
            onClick={() => setLanguage('bn')}
            title="বাংলায় দেখুন"
            style={{ padding: '5px 10px', fontWeight: language === 'bn' ? 700 : 500 }}
          >
            BN
          </button>
          <button
            id="lang-en"
            type="button"
            className={language === 'en' ? 'on' : ''}
            onClick={() => setLanguage('en')}
            title="Switch to English"
            style={{ padding: '5px 10px', fontWeight: language === 'en' ? 700 : 500 }}
          >
            EN
          </button>
        </div>

        {/* User Profile & Logout Dropdown Menu */}
        <div ref={userMenuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="top-user"
            id="topUser"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            aria-expanded={isUserMenuOpen}
            aria-haspopup="true"
            aria-label={language === 'en' ? 'User menu' : 'ইউজার মেনু'}
            style={{
              cursor: 'pointer',
              userSelect: 'none',
              borderColor: isUserMenuOpen ? 'var(--accent, #0ea5e9)' : undefined,
              background: isUserMenuOpen ? 'var(--surface2, #f1f5f9)' : undefined,
              boxShadow: isUserMenuOpen ? '0 0 0 2px rgba(14, 165, 233, 0.15)' : undefined,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              paddingRight: 10,
              transition: 'all 0.15s ease',
            }}
          >
            <span className="av">
              {isVendor ? (language === 'en' ? 'K' : 'ক') : (currentUser?.name || users[0]?.name || (language === 'en' ? 'A' : 'আ'))[0]}
            </span>
            <span>
              <b id="tuN">
                {isVendor ? (language === 'en' ? 'Md. Kamrul Hasan' : 'মো. কামরুল হাসান') : (currentUser?.name || users[0]?.name || (language === 'en' ? 'Arif Hossain' : 'আরিফ হোসেন'))}
              </b>
              <small id="tuR">
                {isVendor ? t('app.merchandiser') : (currentUser?.designation === 'মালিক' ? t('app.owner') : (currentUser?.designation || t('app.owner')))}
              </small>
            </span>
            <ChevronDown
              size={15}
              style={{
                marginLeft: 2,
                color: 'var(--muted, #64748b)',
                transition: 'transform 0.2s ease',
                transform: isUserMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>

          {/* Dropdown Menu Popup */}
          {isUserMenuOpen && (
            <div
              className="user-dropdown-menu"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                minWidth: 220,
                background: 'var(--surface, #ffffff)',
                border: '1px solid var(--line, #e2e8f0)',
                borderRadius: 12,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
                padding: '6px',
                zIndex: 1050,
              }}
            >
              {/* Header inside popup */}
              <div
                style={{
                  padding: '8px 12px 10px',
                  borderBottom: '1px solid var(--line, #e2e8f0)',
                  marginBottom: 4,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--ink, #1e293b)' }}>
                  {isVendor ? (language === 'en' ? 'Md. Kamrul Hasan' : 'মো. কামরুল হাসান') : (currentUser?.name || users[0]?.name || (language === 'en' ? 'Arif Hossain' : 'আরিফ হোসেন'))}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--muted, #64748b)', marginTop: 2 }}>
                  {isVendor
                    ? (language === 'en' ? 'Vendor Merchandiser' : 'ভেন্ডর মার্চেন্ডাইজার')
                    : (currentUser?.designation === 'মালিক' ? t('app.owner') : (currentUser?.designation || t('app.owner')))}
                </div>
              </div>

              {/* Menu items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button
                  type="button"
                  id="menuProfileBtn"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/dashboard/profile');
                    window.scrollTo(0, 0);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: '0.86rem',
                    fontWeight: 500,
                    color: 'var(--ink, #1e293b)',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--surface2, #f1f5f9)';
                    e.currentTarget.style.color = 'var(--accent, #0ea5e9)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--ink, #1e293b)';
                  }}
                >
                  <User size={16} />
                  <span>{language === 'en' ? 'Profile' : 'প্রোফাইল'}</span>
                </button>

                <button
                  type="button"
                  id="menuLogoutBtn"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: '0.86rem',
                    fontWeight: 500,
                    color: 'var(--bad, #ef4444)',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <LogOut size={16} />
                  <span>{language === 'en' ? 'Logout' : 'লগআউট'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* App Shell with Left Rail & Working Canvas */}
      <div className="shell">
        <nav className="rail" id="rail">
          {currentNav.map((item, idx) => {
            if (item[0] === 'grp') {
              const grpText = GRP_KEY_MAP[item[1]] ? t(GRP_KEY_MAP[item[1]]) : item[1];
              return (
                <div key={`grp-${idx}`} className="grp">
                  {grpText}
                </div>
              );
            }
            const [id, label, iconKey, path] = item as [string, string, string, string];

            // Localized navigation item label
            let localizedLabel = label;
            if (isVendor) {
              if (id === 'bill') localizedLabel = t('nav.bill_pay');
              else if (id === 'ledger') localizedLabel = t('nav.my_ledger');
              else if (id === 'yarn') localizedLabel = t('nav.yarn_bal');
              else if (NAV_ITEM_KEY_MAP[id]) localizedLabel = t(NAV_ITEM_KEY_MAP[id]);
            } else if (NAV_ITEM_KEY_MAP[id]) {
              localizedLabel = t(NAV_ITEM_KEY_MAP[id]);
            }

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
                {localizedLabel}
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

