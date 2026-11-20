import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { KnittedKCanvas } from '@/components/common/KnittedKCanvas';
import {
  Truck,
  LayoutDashboard,
  FileText,
  Package,
  Megaphone,
  LogOut,
  Plus,
  Send,
  CheckCircle2,
  Phone,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { bnNum } from '@/utils/formatters';

export const SupplierPortal: React.FC = () => {
  const {
    supplierView,
    setSupplierView,
    setScreen,
    rfqs,
    catalog,
    ads,
    openCallModal,
    addToast,
  } = useApp();

  const [selectedRfq, setSelectedRfq] = useState<any>(null);
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteLead, setQuoteLead] = useState('২৪ ঘণ্টায় মিল ডেলিভারি');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 270,
          background: '#0b192c',
          color: '#e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #1e293b',
          position: 'sticky',
          top: 0,
          height: '100vh',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '20px 18px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e8f1f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck size={22} color="#2364aa" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff' }}>স্কয়ার ইয়ার্ন হাউস</div>
            <div style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600 }}>সাপ্লায়ার ড্যাশবোর্ড</div>
          </div>
        </div>

        <div style={{ flex: 1, padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { id: 'sdash', label: 'সাপ্লায়ার ড্যাশবোর্ড', icon: LayoutDashboard },
            { id: 'srfq', label: 'ইনকামিং RFQ কোটেশন', icon: FileText, badge: rfqs.length },
            { id: 'sprod', label: 'প্রোডাক্ট ক্যাটালগ ও মূল্য', icon: Package },
            { id: 'sads', label: 'স্পন্সর ব্যানার অ্যাডস', icon: Megaphone },
          ].map((it) => {
            const Icon = it.icon;
            const active = supplierView === it.id;
            return (
              <button
                key={it.id}
                onClick={() => setSupplierView(it.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: active ? '#2364aa' : 'transparent',
                  color: active ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon size={16} />
                  <span>{it.label}</span>
                </div>
                {it.badge && (
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: '#38bdf8', color: '#0f172a', fontWeight: 700 }}>
                    {it.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ padding: 14, borderTop: '1px solid #1e293b' }}>
          <button
            onClick={() => setScreen('site')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}
          >
            <LogOut size={16} />
            <span>মূল সাইটে ফিরুন</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>সাপ্লায়ার হাব ও B2B দরপত্র</h2>
          <button onClick={() => setScreen('factory')} className="btn btn-primary btn-sm">
            ফ্যাক্টরি ড্যাশবোর্ড দেখুন
          </button>
        </header>

        <main style={{ padding: 24, flex: 1 }}>
          {supplierView === 'sdash' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                <div className="card" style={{ borderLeft: '4px solid #2364aa' }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>ইনকামিং ফ্যাক্টরি RFQ</div>
                  <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>{rfqs.length} টি</div>
                </div>
                <div className="card" style={{ borderLeft: '4px solid #0d6e4f' }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>সফল ডিল ও অর্ডার</div>
                  <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>১৪২ টি</div>
                </div>
                <div className="card" style={{ borderLeft: '4px solid #b8860b' }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>ক্যাটালগ আইটেম ভিউ</div>
                  <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>১,৩২৮</div>
                </div>
                <div className="card" style={{ borderLeft: '4px solid #c85a14' }}>
                  <div style={{ fontSize: 12, color: '#64748b' }}>সক্রিয় ব্যানার অ্যাডস</div>
                  <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>{ads.length} টি</div>
                </div>
              </div>

              {/* Inward RFQs */}
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800 }}>ফ্যাক্টরি থেকে আসা জরুরি সুতা ও পার্টস RFQ</h3>
                    <p style={{ fontSize: 12, color: '#64748b' }}>সরাসরি দর দিন এবং অর্ডার কনফার্ম করুন</p>
                  </div>
                </div>

                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>RFQ কোড</th>
                        <th>ফ্যাক্টরি ও লোকেশন</th>
                        <th>চাহিদা আইটেম</th>
                        <th>পরিমাণ</th>
                        <th>টার্গেট রেট</th>
                        <th>কবে প্রয়োজন?</th>
                        <th>স্ট্যাটাস</th>
                        <th>অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rfqs.map((r) => (
                        <tr key={r.id}>
                          <td><strong>{r.id}</strong></td>
                          <td><strong>{r.fromFactory}</strong><div style={{ fontSize: 11, color: '#64748b' }}>{r.loc}</div></td>
                          <td>{r.item}</td>
                          <td><strong>{r.qty}</strong></td>
                          <td><span style={{ color: '#0d6e4f', fontWeight: 700 }}>{r.targetRate}</span></td>
                          <td>{r.needBy}</td>
                          <td><span className="badge badge-green">{r.status}</span></td>
                          <td>
                            <button
                              onClick={() => {
                                const rate = prompt(`টার্গেট রেট: ${r.targetRate}। আপনার কোটেশন রেট লিখুন:`, r.targetRate);
                                if (rate) {
                                  addToast({
                                    type: 'success',
                                    title: 'কোটেশন পাঠানো হয়েছে!',
                                    message: `${r.fromFactory} এর কাছে আপনার দরপত্র পৌঁছানো হয়েছে।`,
                                  });
                                }
                              }}
                              className="btn btn-primary btn-sm"
                            >
                              দর দিন (Quote)
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Product Catalog Management */}
          {supplierView === 'sprod' && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800 }}>প্রোডাক্ট ও সুতার ক্যাটালগ</h3>
                  <p style={{ fontSize: 13, color: '#64748b' }}>১৫০+ নিটিং মিলের কাছে প্রদর্শিত আইটেমসমূহ</p>
                </div>
              </div>

              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>আইডি</th>
                      <th>প্রোডাক্টের নাম</th>
                      <th>ক্যাটাগরি</th>
                      <th>ব্র্যান্ড</th>
                      <th>মূল্য (টাকা)</th>
                      <th>MOQ</th>
                      <th>স্টক অবস্থা</th>
                      <th>ভিউ সংখ্যা</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catalog.map((c) => (
                      <tr key={c.id}>
                        <td><strong>{c.id}</strong></td>
                        <td><strong>{c.name}</strong></td>
                        <td><span className="badge badge-blue">{c.cat}</span></td>
                        <td>{c.brand}</td>
                        <td><strong style={{ color: '#0d6e4f' }}>৳ {c.price} / {c.unit}</strong></td>
                        <td>{c.moq}</td>
                        <td><span className="badge badge-green">{c.stock}</span></td>
                        <td>{c.hits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Fallback */}
          {!['sdash', 'sprod'].includes(supplierView) && (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <Truck size={48} color="#2364aa" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 20, fontWeight: 800 }}>সাপ্লায়ার মডিউল: {supplierView}</h3>
              <p style={{ fontSize: 14, color: '#64748b', marginTop: 8 }}>ডাটাবেজে যুক্ত আছে।</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export const SupplierPortalPage = SupplierPortal;


