import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';

interface ChatMessage {
  s: 'fac' | 'ven' | 'sys';
  n?: string;
  txt?: string;
  t: string;
  voice?: boolean;
  voiceSec?: number;
  img?: string;
  file?: { name: string; size: string };
}

interface ThreadItem {
  id: string;
  v: string; // party code
  vName: string;
  o: string; // order no
  title: string;
  unread: number;
  msgs: ChatMessage[];
}

export const FactoryMessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const { role, openCallModal, users, threads: appThreads, parties, orders, fetchOrders } = useApp();

  const isVendor = role === 'vendor' || (role as string) === 'ven';
  const meSide = isVendor ? 'ven' : 'fac';

  React.useEffect(() => {
    fetchOrders?.();
  }, []);

  const [threads, setThreads] = useState<ThreadItem[]>(() => {
    if (appThreads && appThreads.length > 0) {
      return appThreads.map((t: any) => ({
        id: t.id,
        v: t.v,
        vName: parties.find((p) => p.code === t.v)?.name || (t.v === 'abc' ? 'ABC Knit Composite' : t.v === 'xyz' ? 'XYZ Fashion Ltd' : t.v),
        o: t.o || t.orderId || 'ORD-26-0891',
        title: t.title,
        unread: t.unread || 0,
        msgs: (t.msgs || []).map((m: any) => ({
          s: m.s || (m.from === 'factory' ? 'fac' : m.from === 'vendor' ? 'ven' : 'sys'),
          n: m.n || m.sender,
          txt: m.txt || m.text,
          t: m.t || m.time || 'আজ',
        })),
      }));
    }
    return (orders || []).map((o) => {
      const pCode = o.party_code || o.v || (o.party?.includes('ABC') ? 'abc' : 'xyz');
      const pName = parties.find((p) => p.code === pCode)?.name || o.party || (pCode === 'abc' ? 'ABC Knit Composite' : 'পার্টি');
      const fabDesc = `${o.fabric || 'Single Jersey'}${o.gsm ? ` · ${o.gsm} GSM` : ''}`;
      return {
        id: `th-${o.id}`,
        v: pCode,
        vName: pName,
        o: o.id,
        title: fabDesc,
        unread: 0,
        msgs: [
          {
            s: 'sys' as const,
            txt: `অর্ডার ${o.id} (${fabDesc}) এর মেসেজ থ্রেড চালু হলো`,
            t: 'আজ',
          },
        ],
      };
    });
  });

  React.useEffect(() => {
    if (appThreads && appThreads.length > 0) {
      setThreads(
        appThreads.map((t: any) => ({
          id: t.id,
          v: t.v,
          vName: parties.find((p) => p.code === t.v)?.name || (t.v === 'abc' ? 'ABC Knit Composite' : t.v === 'xyz' ? 'XYZ Fashion Ltd' : t.v),
          o: t.o || t.orderId || 'ORD-26-0891',
          title: t.title,
          unread: t.unread || 0,
          msgs: (t.msgs || []).map((m: any) => ({
            s: m.s || (m.from === 'factory' ? 'fac' : m.from === 'vendor' ? 'ven' : 'sys'),
            n: m.n || m.sender,
            txt: m.txt || m.text,
            t: m.t || m.time || 'আজ',
          })),
        }))
      );
    } else if (orders && orders.length > 0) {
      setThreads(
        orders.map((o) => {
          const pCode = o.party_code || o.v || (o.party?.includes('ABC') ? 'abc' : 'xyz');
          const pName = parties.find((p) => p.code === pCode)?.name || o.party || (pCode === 'abc' ? 'ABC Knit Composite' : 'পার্টি');
          const fabDesc = `${o.fabric || 'Single Jersey'}${o.gsm ? ` · ${o.gsm} GSM` : ''}`;
          return {
            id: `th-${o.id}`,
            v: pCode,
            vName: pName,
            o: o.id,
            title: fabDesc,
            unread: 0,
            msgs: [
              {
                s: 'sys' as const,
                txt: `অর্ডার ${o.id} (${fabDesc}) এর মেসেজ থ্রেড চালু হলো`,
                t: 'আজ',
              },
            ],
          };
        })
      );
    }
  }, [appThreads, orders, parties]);

  const visibleThreads = isVendor
    ? threads.filter(
        (t) =>
          t.v === 'abc' ||
          t.vName.includes('ABC') ||
          (orders.find((o) => o.id === t.o)?.party_code === 'abc')
      )
    : threads;

  const [activeThreadId, setActiveThreadId] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [currentUserIdx, setCurrentUserIdx] = useState<number>(0);

  const activeThread =
    visibleThreads.find((t) => t.id === activeThreadId) || visibleThreads[0];

  const facStaff = users.filter((u) => !u.is_vendor_rep);
  const activeStaff = facStaff[currentUserIdx] || {
    name: 'আরিফ হোসেন',
    designation: 'মালিক',
  };

  const quickReplies = isVendor
    ? [
        'দেরি কেন?',
        'আজ কত kg হলো?',
        'QC রিপোর্ট পাঠান',
        'চালান কবে বের হবে?',
        'সুতা পাঠিয়েছি লট চেক করুন',
      ]
    : [
        'সুতা পৌঁছেছে?',
        'ল্যাবের অনুমোদন বাকি',
        'আজ ৮ রোল নামবে',
        'QC সাইন বাকি',
        'ডেলিভারি চালান রেডি',
      ];

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const newMsg: ChatMessage = {
      s: meSide,
      n: isVendor
        ? 'মো. কামরুল হাসান (ভেন্ডর)'
        : `${activeStaff.name} (${activeStaff.designation || 'ম্যানেজার'})`,
      txt: text,
      t: 'এখন',
    };

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== activeThreadId) return t;
        return {
          ...t,
          msgs: [...t.msgs, newMsg],
        };
      })
    );

    if (!textToSend) {
      setInputText('');
    }
  };

  const handleSendVoiceNote = () => {
    const newMsg: ChatMessage = {
      s: meSide,
      n: isVendor
        ? 'মো. কামরুল হাসান'
        : `${activeStaff.name} (${activeStaff.designation || 'ম্যানেজার'})`,
      voice: true,
      voiceSec: 14,
      t: 'এখন',
    };

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== activeThreadId) return t;
        return {
          ...t,
          msgs: [...t.msgs, newMsg],
        };
      })
    );
  };

  return (
    <div style={{ maxWidth: '100%', width: '100%' }}>
      {isVendor && (
        <div className="vbanner" style={{ marginBottom: 16 }}>
          ভেন্ডর হিসেবে আপনি শুধু নিজের অর্ডারের আলোচনা দেখেন।
        </div>
      )}

      {/* Header */}
      <div className="head">
        <div>
          <h2>নিটখাতা মেসেজ</h2>
          <p>
            প্রতিটা অর্ডারের আলাদা আলোচনা।{' '}
            {isVendor
              ? 'ফ্যাক্টরি আর দুই পক্ষের QC একই জায়গায়, WhatsApp-এ হারায় না।'
              : 'ভেন্ডরের মার্চেন্ডাইজার আর দুই পক্ষের QC একই জায়গায়, WhatsApp-এ হারায় না।'}
          </p>
        </div>
        <span className="pill p-ok">সরাসরি সংযোগ</span>
      </div>

      {/* Main Chat Interface */}
      {visibleThreads.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            color: 'var(--muted)',
          }}
        >
          <h3 style={{ fontSize: '1.15rem', marginBottom: 8 }}>কোনো মেসেজ থ্রেড নেই</h3>
          <p>
            {isVendor
              ? 'আপনার কোনো অর্ডারের আলোচনা শুরু হলে এখানে দেখা যাবে।'
              : 'নতুন অর্ডার তৈরি হলে সংশ্লিষ্ট পার্টির সাথে আলোচনা থ্রেড এখানে স্বয়ংক্রিয়ভাবে যুক্ত হবে।'}
          </p>
        </div>
      ) : (
        <div
          className="chat has-team"
          style={{
            display: 'grid',
            gridTemplateColumns: isVendor ? '280px 1fr' : '240px 180px 1fr',
            gap: 16,
            background: 'var(--surface)',
            borderRadius: 12,
            border: '1px solid var(--line)',
            minHeight: '620px',
            overflow: 'hidden',
          }}
        >
          {/* Col 1: Threads List */}
          <div
            className="ch-list"
            style={{
              borderRight: '1px solid var(--line)',
              padding: 10,
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                fontSize: '.75rem',
                color: 'var(--muted)',
                padding: '6px 8px',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
              }}
            >
              অর্ডার সংক্রান্ত থ্রেড
            </div>
            {visibleThreads.map((t) => {
              const last = t.msgs[t.msgs.length - 1];
              const isSelected = activeThread && t.id === activeThread.id;
              return (
                <button
                  key={t.id}
                  className={`ch-th ${isSelected ? 'on' : ''}`}
                  type="button"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    display: 'flex',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: 0,
                    background: isSelected ? 'var(--accent-soft)' : 'transparent',
                    cursor: 'pointer',
                    marginBottom: 4,
                  }}
                  onClick={() => setActiveThreadId(t.id)}
                >
                  <div
                    className="ch-av"
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 8,
                      background: isSelected ? 'var(--accent)' : 'var(--surface2)',
                      color: isSelected ? '#fff' : 'inherit',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 700,
                    }}
                  >
                    {t.vName.slice(0, 1)}
                  </div>
                  <div className="ch-tx" style={{ flex: 1, minWidth: 0 }}>
                    <b
                      style={{
                        display: 'block',
                        fontSize: '.9rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {isVendor ? 'রহমান নিটিং' : t.vName}
                    </b>
                    <span
                      className="mono small"
                      style={{
                        display: 'block',
                        color: 'var(--muted)',
                        fontSize: '.76rem',
                      }}
                    >
                      {t.o}
                    </span>
                    <small
                      style={{
                        display: 'block',
                        color: 'var(--muted)',
                        fontSize: '.76rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {last?.txt || (last?.voice ? 'ভয়েস মেসেজ' : 'মেসেজ')}
                    </small>
                  </div>
                  {t.unread > 0 && (
                    <span className="ch-un" style={{ marginLeft: 'auto' }}>
                      {t.unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

        {/* Col 2: Factory Team Selector (Only for Factory View) */}
        {!isVendor && (
          <div
            className="ch-team"
            style={{
              borderRight: '1px solid var(--line)',
              padding: 10,
              overflowY: 'auto',
              background: 'var(--surface2)',
            }}
          >
            <div style={{ paddingBottom: 8, borderBottom: '1px solid var(--line)', marginBottom: 8 }}>
              <b style={{ display: 'block', fontSize: '.84rem' }}>কে লিখছেন</b>
              <small style={{ color: 'var(--muted)' }}>রহমান নিটিং-এর টিম</small>
            </div>
            {facStaff.map((u, idx) => {
              const isOn = idx === currentUserIdx;
              return (
                <label
                  key={u.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 6px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: isOn ? 'var(--surface)' : 'transparent',
                    marginBottom: 4,
                  }}
                >
                  <input
                    type="radio"
                    name="fmSender"
                    checked={isOn}
                    onChange={() => setCurrentUserIdx(idx)}
                  />
                  <span style={{ fontSize: '.84rem' }}>
                    <b style={{ display: 'block' }}>{u.name}</b>
                    <small style={{ color: 'var(--muted)', display: 'block' }}>
                      {u.designation || 'স্টাফ'}
                    </small>
                  </span>
                </label>
              );
            })}
            <p
              className="small muted"
              style={{ fontSize: '.72rem', marginTop: 12, lineHeight: 1.4 }}
            >
              যিনি নির্বাচিত হবেন, ভেন্ডর দেখবে তাঁর নাম ও পদবী।
            </p>
          </div>
        )}

        {/* Col 3: Chat Box & Composer */}
        <div
          className="ch-main"
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: '620px',
          }}
        >
          {/* Chat Top Bar */}
          <div
            className="ch-top"
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <b style={{ fontSize: '1.05rem' }}>
                {isVendor ? 'রহমান নিটিং ইন্ডাস্ট্রিজ' : activeThread.vName}
              </b>
              <div className="small muted">
                <span className="mono">{activeThread.o}</span> ·{' '}
                {activeThread.title} ·{' '}
                <button
                  type="button"
                  className="lnk"
                  style={{ background: 'none', border: 0, color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => navigate(`/dashboard/orders/${activeThread.o}`)}
                >
                  অর্ডার দেখুন
                </button>
              </div>
            </div>

            {/* Audio & Video Call Buttons */}
            <div className="row" style={{ gap: 8 }}>
              <button
                type="button"
                className="btn sm"
                onClick={() =>
                  openCallModal({
                    title: 'অডিও কল',
                    subtitle: `${activeThread.vName} · ${activeThread.o}`,
                    phone: '01711-234567',
                    whatsapp: '01711-234567',
                    name: isVendor ? 'আরিফ হোসেন (মালিক)' : 'মো. কামরুল হাসান (ভেন্ডর)',
                  })
                }
              >
                📞 কল
              </button>
              <button
                type="button"
                className="btn sm pri"
                onClick={() =>
                  openCallModal({
                    title: 'ভিডিও কল · লাইভ ফ্লোর বা স্যাম্পল যাচাই',
                    subtitle: `${activeThread.vName} · ${activeThread.o}`,
                    phone: '01711-234567',
                    whatsapp: '01711-234567',
                    name: isVendor ? 'আরিফ হোসেন (মালিক)' : 'মো. কামরুল হাসান (ভেন্ডর)',
                  })
                }
              >
                📹 ভিডিও
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div
            className="ch-body"
            id="fchBody"
            style={{
              flex: 1,
              padding: 16,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              background: 'var(--bg)',
            }}
          >
            {activeThread.msgs.map((m, idx) => {
              if (m.s === 'sys') {
                return (
                  <div
                    key={idx}
                    className="bub sys"
                    style={{
                      alignSelf: 'center',
                      background: 'var(--surface2)',
                      padding: '4px 14px',
                      borderRadius: 999,
                      fontSize: '.78rem',
                      color: 'var(--muted)',
                    }}
                  >
                    {m.txt} · {m.t}
                  </div>
                );
              }

              const isMe = m.s === meSide;
              return (
                <div
                  key={idx}
                  className={`bub ${isMe ? 'me' : ''}`}
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '75%',
                    background: isMe ? 'var(--grad)' : 'var(--surface)',
                    color: isMe ? '#fff' : 'var(--ink)',
                    padding: '10px 14px',
                    borderRadius: 12,
                    boxShadow: 'var(--shadow)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '.75rem',
                      opacity: 0.85,
                      marginBottom: 4,
                      fontWeight: 600,
                    }}
                  >
                    {m.n}
                  </div>

                  {m.txt && <div style={{ fontSize: '.92rem' }}>{m.txt}</div>}

                  {m.voice && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span>▶️</span>
                      <div
                        style={{
                          height: 4,
                          width: 100,
                          background: isMe ? 'rgba(255,255,255,0.4)' : 'var(--line)',
                          borderRadius: 2,
                        }}
                      />
                      <span style={{ fontSize: '.78rem' }}>0:14</span>
                    </div>
                  )}

                  <span
                    style={{
                      display: 'block',
                      textAlign: 'right',
                      fontSize: '.7rem',
                      marginTop: 4,
                      opacity: 0.75,
                    }}
                  >
                    {m.t}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quick Replies Bar */}
          <div
            className="ch-quick"
            style={{
              padding: '6px 12px',
              borderTop: '1px solid var(--line)',
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              background: 'var(--surface)',
            }}
          >
            {quickReplies.map((q, i) => (
              <button
                key={i}
                type="button"
                className="btn sm"
                style={{ whiteSpace: 'nowrap', fontSize: '.78rem' }}
                onClick={() => handleSendMessage(q)}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Current Sender Identity Indicator */}
          {!isVendor && (
            <div
              style={{
                padding: '4px 16px',
                fontSize: '.76rem',
                color: 'var(--muted)',
                background: 'var(--surface2)',
                borderTop: '1px solid var(--line)',
              }}
            >
              আপনি লিখছেন: <b>{activeStaff.name}</b> · {activeStaff.designation || 'মালিক'}
              <span className="muted"> — ভেন্ডর দেখবে &quot;রহমান নিটিং / {activeStaff.name}&quot;</span>
            </div>
          )}

          {/* Chat Composer Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              padding: 12,
              borderTop: '1px solid var(--line)',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              background: 'var(--surface)',
            }}
          >
            <button
              type="button"
              className="btn sm"
              title="ভয়েস রেকর্ড পাঠান"
              onClick={handleSendVoiceNote}
            >
              🎙️
            </button>
            <input
              type="text"
              placeholder="মেসেজ লিখুন..."
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)' }}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button type="submit" className="btn pri sm">
              পাঠান
            </button>
          </form>
        </div>
      </div>
      )}
    </div>
  );
};

