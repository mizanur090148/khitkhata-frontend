import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { bnNum } from '@/utils/formatters';
import { PartyItem } from '@/types/domain.types';

// Convert number to localized digits
function bn(num: number | string | undefined | null): string {
  if (num === undefined || num === null || isNaN(Number(num))) return '০';
  return bnNum(num);
}

// Localized date formatter
function fd(dateStr?: string, language?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    if (language === 'en') {
      return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    const months = [
      'জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'
    ];
    const day = bnNum(d.getDate());
    const m = months[d.getMonth()];
    const yr = bnNum(d.getFullYear());
    return `${day} ${m} ${yr}`;
  } catch {
    return dateStr;
  }
}

export const FactoryPartyPage: React.FC = () => {
  const navigate = useNavigate();
  const { parties, orders, bills, createParty, togglePartyStatus, addToast, t, language, tkSymbol } = useApp();

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ven' | 'sup'>('all');

  // Form states matching KnitKhata #npf
  const [name, setName] = useState('');
  const [type, setType] = useState<'ven' | 'sup'>('ven');
  const [addr, setAddr] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bin, setBin] = useState('');
  const [rate, setRate] = useState('');
  const [terms, setTerms] = useState('বিলের ৩০ দিনের মধ্যে');
  const [open, setOpen] = useState('0');

  const [formMsg, setFormMsg] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate party dues and order counts
  const partyStats = useMemo(() => {
    return parties.map((p) => {
      const codeOrId = (p.code || p.id || '').toString();
      const pName = (p.name || '').trim().toLowerCase();

      // Orders for this party
      const pOrders = orders.filter((o) => {
        const orderParty = (o.party || '').trim().toLowerCase();
        const orderCode = (o as any).party_code || (o as any).v;
        return (
          orderCode === codeOrId ||
          orderParty === pName ||
          (p.code && orderCode === p.code)
        );
      });

      // Bills for this party
      const pBills = (bills || []).filter((b: any) => {
        const bParty = (b.party || b.v || '').toString().toLowerCase();
        return bParty === codeOrId.toLowerCase() || bParty === pName;
      });

      const totalBilled = pBills.reduce((acc: number, b: any) => {
        const lines = b.lines || [];
        return acc + lines.reduce((la: number, l: any) => la + (Number(l.kg || 0) * Number(l.rate || 0)), 0);
      }, 0);

      const totalReceived = pBills.reduce((acc: number, b: any) => {
        const recv = b.recv || [];
        return acc + recv.reduce((ra: number, r: any) => ra + Number(r.amt || 0), 0);
      }, 0);

      const openingBal = Number(p.open ?? p.opening_balance ?? p.openingDue ?? 0);
      const calculatedDue = openingBal + (totalBilled - totalReceived);
      const finalDue = p.due !== undefined ? Number(p.due) : calculatedDue;
      const orderCount = p.orders_count !== undefined ? Number(p.orders_count) : pOrders.length;

      const isVendor = p.type === 'ven' || p.type === 'Composite' || p.type === 'Buying House';
      const isActive = p.on !== undefined ? Boolean(p.on) : p.is_active !== undefined ? Boolean(p.is_active) : true;

      return {
        ...p,
        computedIsVendor: isVendor,
        computedIsActive: isActive,
        computedOrderCount: orderCount,
        computedDue: finalDue,
      };
    });
  }, [parties, orders, bills]);

  // KPIs
  const vendorCount = partyStats.filter((p) => p.computedIsVendor).length;
  const supplierCount = partyStats.filter((p) => !p.computedIsVendor).length;

  const currentYearMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-11"
  const newThisMonthCount = partyStats.filter((p) => {
    const added = (p.added || p.added_date || '').slice(0, 7);
    return added >= currentYearMonth || added >= '2026-10';
  }).length;

  // Filtered party list
  const filteredParties = useMemo(() => {
    return partyStats.filter((p) => {
      if (filterType === 'ven' && !p.computedIsVendor) return false;
      if (filterType === 'sup' && p.computedIsVendor) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const pName = (p.name || '').toLowerCase();
        const pPhone = (p.phone || '').toLowerCase();
        const pContact = (p.contact || p.contact_person || '').toLowerCase();
        const pAddr = (p.addr || p.address || '').toLowerCase();
        return pName.includes(q) || pPhone.includes(q) || pContact.includes(q) || pAddr.includes(q);
      }
      return true;
    });
  }, [partyStats, filterType, searchTerm]);

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormMsg({ text: 'পার্টির নাম দিন।', type: 'error' });
      return;
    }

    const isDuplicate = parties.some(
      (p) => (p.name || '').trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      setFormMsg({ text: `"${trimmedName}" নামে আগেই একটা পার্টি আছে।`, type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      await createParty({
        name: trimmedName,
        type,
        addr: addr.trim() || '—',
        contact: contact.trim() || '—',
        phone: phone.trim() || '—',
        email: email.trim(),
        bin: bin.trim(),
        rate: rate ? parseFloat(rate) : 0,
        terms,
        open: open ? parseFloat(open) : 0,
      });

      setFormMsg({ text: `${trimmedName} যোগ হলো · লেজার খোলা হয়েছে`, type: 'success' });
      // Reset form
      setName('');
      setAddr('');
      setContact('');
      setPhone('');
      setEmail('');
      setBin('');
      setRate('');
      setTerms('বিলের ৩০ দিনের মধ্যে');
      setOpen('0');
    } catch (err: any) {
      setFormMsg({ text: err.message || 'পার্টি সেভ করতে সমস্যা হয়েছে।', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active switch
  const handleToggle = async (p: any) => {
    try {
      await togglePartyStatus(p.code || p.id);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'স্ট্যাটাস এরর',
        message: err.message || 'স্ট্যাটাস পরিবর্তন করা সম্ভব হয়নি।',
      });
    }
  };

  return (
    <div className="party-page-container" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 40 }}>
      {/* HEADER MATCHING KnitKhata.html */}
      <div className="head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2>{t('পার্টি তালিকা')}</h2>
          <p>{t('যেসব কম্পোজিট/ভেন্ডর কাজ দেয়, আর যাদের কাছ থেকে মাল কেনেন — সবার একটাই তালিকা')}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            className="btn pri"
            onClick={() => {
              const el = document.getElementById('np-name');
              el?.focus();
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {t('+ নতুন পার্টি যোগ')}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => navigate('/dashboard/neworder')}
          >
            + New Order Entry
          </button>
        </div>
      </div>

      {/* KPIS MATCHING KnitKhata.html */}
      <div className="kpis">
        <div className="kpi">
          <span>{t('ভেন্ডর (কাজ দেয়)')}</span>
          <b>{bnNum(vendorCount)}</b>
        </div>
        <div className="kpi">
          <span>{t('সাপ্লায়ার')}</span>
          <b>{bnNum(supplierCount)}</b>
        </div>
        <div className="kpi">
          <span>{t('এ মাসে নতুন যোগ')}</span>
          <b>{bnNum(newThisMonthCount)}</b>
        </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 6,
          marginBottom: 4,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            className={`btn sm ${filterType === 'all' ? 'pri' : ''}`}
            onClick={() => setFilterType('all')}
          >
            {t('সব')} ({bnNum(partyStats.length)})
          </button>
          <button
            type="button"
            className={`btn sm ${filterType === 'ven' ? 'pri' : ''}`}
            onClick={() => setFilterType('ven')}
          >
            {t('ভেন্ডর')} ({bnNum(vendorCount)})
          </button>
          <button
            type="button"
            className={`btn sm ${filterType === 'sup' ? 'pri' : ''}`}
            onClick={() => setFilterType('sup')}
          >
            {t('সাপ্লায়ার')} ({bnNum(supplierCount)})
          </button>
        </div>

        <div style={{ minWidth: 260, maxWidth: 360, flex: '1 1 auto' }}>
          <input
            type="search"
            placeholder={t('পার্টির নাম, ফোন বা ঠিকানা দিয়ে খুঁজুন...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 12px',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--ink)',
            }}
          />
        </div>
      </div>

      {/* TABLE CARD MATCHING KnitKhata.html */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="tw" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>{t('পার্টি')}</th>
                <th>{t('ধরন')}</th>
                <th>{t('যোগাযোগ')}</th>
                <th>{t('মোবাইল')}</th>
                <th className="n">{language === 'en' ? `Default Rate ${tkSymbol}/kg` : 'ডিফল্ট রেট ৳/kg'}</th>
                <th>{t('পেমেন্টের শর্ত')}</th>
                <th className="n">{t('অর্ডার')}</th>
                <th className="n">{language === 'en' ? `Due ${tkSymbol}` : 'বাকি ৳'}</th>
                <th>{t('যোগ হয়েছে')}</th>
                <th style={{ textAlign: 'center' }}>{t('সক্রিয়')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredParties.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--muted)' }}>
                    {language === 'en'
                      ? 'No parties found. Fill in the form below to add a new party.'
                      : 'কোনো পার্টি পাওয়া যায়নি। নিচে ফর্ম পূরণ করে নতুন পার্টি যোগ করুন।'}
                  </td>
                </tr>
              ) : (
                filteredParties.map((p) => {
                  const isVen = p.computedIsVendor;
                  const partyCode = p.code || p.id;
                  const rowClass = isVen ? 'click' : '';

                  return (
                    <tr
                      key={partyCode}
                      className={rowClass}
                      onClick={() => {
                        if (isVen) {
                          navigate(`/dashboard/ledger?party=${partyCode}`);
                        }
                      }}
                      title={isVen ? (language === 'en' ? 'Click to view vendor ledger' : 'ভেন্ডরের লেজার দেখতে ক্লিক করুন') : undefined}
                      style={{ cursor: isVen ? 'pointer' : 'default' }}
                    >
                      <td>
                        <b style={{ color: isVen ? 'var(--primary)' : 'inherit' }}>{p.name}</b>
                        <div className="small muted">{p.addr || p.address || '—'}</div>
                      </td>
                      <td>
                        {isVen ? (
                          <span className="pill p-acc">{t('ভেন্ডর')}</span>
                        ) : (
                          <span className="pill p-yarn">{t('সাপ্লায়ার')}</span>
                        )}
                      </td>
                      <td className="small">{p.contact || p.contact_person || '—'}</td>
                      <td className="mono small">{p.phone || '—'}</td>
                      <td className="n">
                        {p.rate || p.default_rate_tk ? `${tkSymbol} ${bnNum(p.rate || p.default_rate_tk)}` : '—'}
                      </td>
                      <td className="small">{t(p.terms || p.payment_terms || '—')}</td>
                      <td className="n">{bnNum(p.computedOrderCount)}</td>
                      <td className="n" style={{ fontWeight: p.computedDue > 0 ? 700 : 400, color: p.computedDue > 0 ? 'var(--bad, #b91c1c)' : 'inherit' }}>
                        {tkSymbol} {bnNum(p.computedDue)}
                      </td>
                      <td className="mono small">{fd(p.added || p.added_date, language)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className={`switch ${p.computedIsActive ? 'on' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggle(p);
                          }}
                          aria-label={`${p.name} ${p.computedIsActive ? t('সক্রিয়') : t('নিষ্ক্রিয়')}`}
                          title={p.computedIsActive ? (language === 'en' ? 'Active (Click to disable)' : 'সক্রিয় (বন্ধ করতে ক্লিক করুন)') : (language === 'en' ? 'Disabled (Click to enable)' : 'বন্ধ (সক্রিয় করতে ক্লিক করুন)')}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <p className="small muted" style={{ marginTop: 12 }}>
          {language === 'en'
            ? 'Click on any vendor row to open their ledger. Disabled parties retain all historical records, they are simply hidden from new order or billing pickers.'
            : 'ভেন্ডরের সারিতে ক্লিক করলে তার লেজার খুলবে। বন্ধ করা পার্টির পুরোনো হিসাব থেকে যায়, শুধু নতুন অর্ডার বা বিলে তার নাম আসে না।'}
        </p>
      </div>

      {/* GRID 2 COLS MATCHING KnitKhata.html */}
      <div className="grid g2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* CREATE PARTY FORM (#npf) */}
        <form className="card" id="npf" onSubmit={handleSubmit}>
          <h3 style={{ marginBottom: 16 }}>{t('নতুন পার্টি যোগ করুন')}</h3>

          <div className="form" style={{ display: 'grid', gap: 12 }}>
            <label className="f" style={{ display: 'block' }}>
              <span style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
                {t('পার্টির নাম')} <b style={{ color: 'var(--bad, #e11d48)' }}>*</b>
              </span>
              <input
                id="np-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === 'en' ? 'e.g. DEF Knit Composite' : 'যেমন: DEF Knit Composite'}
                required
                style={{ width: '100%' }}
              />
            </label>

            <label className="f" style={{ display: 'block' }}>
              <span style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>{t('ধরন')}</span>
              <select
                id="np-type"
                value={type}
                onChange={(e) => setType(e.target.value as 'ven' | 'sup')}
                style={{ width: '100%' }}
              >
                <option value="ven">{language === 'en' ? 'Vendor — Assigns work (Income)' : 'ভেন্ডর — কাজ দেয় (আয়)'}</option>
                <option value="sup">{language === 'en' ? 'Supplier — Raw materials (Expense)' : 'সাপ্লায়ার — মাল কিনি (খরচ)'}</option>
              </select>
            </label>

            <label className="f" style={{ display: 'block' }}>
              <span style={{ display: 'block', marginBottom: 4 }}>{t('ঠিকানা')}</span>
              <input
                id="np-addr"
                type="text"
                value={addr}
                onChange={(e) => setAddr(e.target.value)}
                placeholder={language === 'en' ? 'Factory address' : 'ফ্যাক্টরির ঠিকানা'}
                style={{ width: '100%' }}
              />
            </label>

            <label className="f" style={{ display: 'block' }}>
              <span style={{ display: 'block', marginBottom: 4 }}>{t('যোগাযোগের ব্যক্তি')}</span>
              <input
                id="np-contact"
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={language === 'en' ? 'Name and designation' : 'নাম ও পদবি'}
                style={{ width: '100%' }}
              />
            </label>

            <label className="f" style={{ display: 'block' }}>
              <span style={{ display: 'block', marginBottom: 4 }}>{t('মোবাইল নম্বর')}</span>
              <input
                id="np-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+8801…"
                style={{ width: '100%' }}
              />
            </label>

            <label className="f" style={{ display: 'block' }}>
              <span style={{ display: 'block', marginBottom: 4 }}>{t('ইমেইল')}</span>
              <input
                id="np-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={language === 'en' ? 'Optional' : 'ঐচ্ছিক'}
                style={{ width: '100%' }}
              />
            </label>

            <label className="f" style={{ display: 'block' }}>
              <span style={{ display: 'block', marginBottom: 4 }}>BIN / TIN</span>
              <input
                id="np-bin"
                type="text"
                value={bin}
                onChange={(e) => setBin(e.target.value)}
                placeholder={language === 'en' ? 'Optional — printed on bill' : 'ঐচ্ছিক — বিলে ছাপা হবে'}
                style={{ width: '100%' }}
              />
            </label>

            <label className="f" style={{ display: 'block' }}>
              <span style={{ display: 'block', marginBottom: 4 }}>{language === 'en' ? 'Default Knitting Rate (${tkSymbol}/kg)' : 'ডিফল্ট নিটিং রেট (৳/kg)'}</span>
              <input
                id="np-rate"
                type="number"
                step="0.5"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder={language === 'en' ? 'e.g. 14' : 'যেমন: 14'}
                style={{ width: '100%' }}
              />
            </label>

            <label className="f" style={{ display: 'block' }}>
              <span style={{ display: 'block', marginBottom: 4 }}>{t('পেমেন্টের শর্ত')}</span>
              <select
                id="np-terms"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="বিলের ৩০ দিনের মধ্যে">{t('বিলের ৩০ দিনের মধ্যে')}</option>
                <option value="বিলের ৪৫ দিনের মধ্যে">{t('বিলের ৪৫ দিনের মধ্যে')}</option>
                <option value="বিলের ৬০ দিনের মধ্যে">{language === 'en' ? 'Within 60 days of billing' : 'বিলের ৬০ দিনের মধ্যে'}</option>
                <option value="নগদ">{t('নগদ')}</option>
              </select>
            </label>

            <label className="f" style={{ display: 'block' }}>
              <span style={{ display: 'block', marginBottom: 4 }}>{language === 'en' ? 'Opening Balance / Due (${tkSymbol})' : 'পুরোনো বাকি / প্রারম্ভিক জের (৳)'}</span>
              <input
                id="np-open"
                type="number"
                step="any"
                value={open}
                onChange={(e) => setOpen(e.target.value)}
                placeholder="0"
                style={{ width: '100%' }}
              />
            </label>
          </div>

          {formMsg && (
            <div
              className={`formmsg ${formMsg.type === 'error' ? 'err' : 'ok'}`}
              style={{
                marginTop: 14,
                padding: '10px 14px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                background: formMsg.type === 'error' ? 'rgba(225, 29, 72, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                color: formMsg.type === 'error' ? 'var(--bad, #b91c1c)' : 'var(--ok, #059669)',
                border: `1px solid ${formMsg.type === 'error' ? 'rgba(225, 29, 72, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              }}
            >
              {formMsg.text}
            </div>
          )}

          <div className="row" style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn pri" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (language === 'en' ? 'Saving party...' : 'পার্টি সেভ হচ্ছে...') : (language === 'en' ? 'Save Party' : 'পার্টি সেভ করুন')}
            </button>
            <span className="small muted" style={{ fontSize: 12 }}>
              {language === 'en'
                ? 'Upon saving, this name immediately appears in orders, bills, ledgers, and permissions.'
                : 'সেভ করলেই অর্ডার, বিল, লেজার আর ইউজার পারমিশনে এই নাম চলে আসবে।'}
            </span>
          </div>
        </form>

        {/* INFORMATIONAL CARD MATCHING KnitKhata.html */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>{language === 'en' ? 'How Party Management Works' : 'নতুন পার্টি এলে কী হয়'}</h3>
          <div className="prose small" style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text)' }}>
            <p style={{ marginBottom: 12 }}>
              {language === 'en'
                ? 'When a new client or supplier is onboarded, save their profile here once. They will automatically be available in order creation and automatic ledgers.'
                : 'ধরুন এই সপ্তাহে DEF Knit Composite থেকে প্রথম কাজ এলো। এখানে নাম, ঠিকানা, যোগাযোগ আর রেট দিয়ে একবার সেভ করবেন। এরপর থেকে নতুন অর্ডার খোলার সময় তালিকায় তার নাম পাবেন, আর তার আলাদা লেজার নিজে থেকেই খুলে যাবে।'}
            </p>
            <p style={{ marginBottom: 12 }}>
              {language === 'en'
                ? 'In a hurry? Create a party on-the-fly directly from the New Order form by clicking "+ New Buyer".'
                : 'তাড়াহুড়োয় থাকলে নতুন অর্ডারের ফর্ম থেকেই "+ নতুন পার্টি" চেপে এখানে আসা যায়। শুধু নামটা দিলেই চলবে, বাকি তথ্য পরে ঠিক করা যাবে।'}
            </p>
            <p style={{ marginBottom: 12 }}>
              {language === 'en'
                ? 'If a party has previous balances, enter it under "Opening Balance" to initialize their ledger accurately.'
                : 'আগে থেকে কোনো পার্টির কাছে টাকা বাকি থাকলে "পুরোনো বাকি" ঘরে লিখে দিন। লেজার সেখান থেকেই শুরু হবে।'}
            </p>
            <p style={{ marginBottom: 0 }}>
              {language === 'en'
                ? 'Duplicate party names are automatically prevented to maintain clean bookkeeping.'
                : 'একই নামে দুবার পার্টি খোলা যাবে না, সফটওয়্যার আটকে দেবে।'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

