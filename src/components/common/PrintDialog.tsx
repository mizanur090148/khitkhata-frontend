import React from 'react';
import { Printer, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface PrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  documentType: 'challan' | 'bill' | 'jobcard' | 'qcreport' | 'rolltag';
  data: any;
}

export const PrintDialog: React.FC<PrintDialogProps> = ({
  isOpen,
  onClose,
  title,
  documentType,
  data,
}) => {
  const { factoryProfile } = useApp();

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 780, maxHeight: '90vh' }}
      >
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handlePrint} className="btn btn-primary btn-sm">
              <Printer size={16} />
              <span>প্রিন্ট করুন</span>
            </button>
            <button onClick={onClose} className="btn btn-secondary btn-sm">
              <X size={16} />
              <span>বন্ধ করুন</span>
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div
          id="printable-area"
          style={{
            background: '#ffffff',
            padding: 30,
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            color: '#0f172a',
            fontFamily: 'Hind Siliguri, sans-serif',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: 16, marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0d6e4f' }}>{factoryProfile?.name || 'রহমান নিটিং ইন্ডাস্ট্রিজ'}</h1>
              <p style={{ fontSize: 13, color: '#475569' }}>{factoryProfile?.address || factoryProfile?.area || 'কোনাবাড়ি, গাজীপুর'}{factoryProfile?.phone ? ` · ফোন: ${factoryProfile.phone}` : ''}</p>
              <p style={{ fontSize: 12, color: '#64748b' }}>{factoryProfile?.email ? `ই-মেইল: ${factoryProfile.email} · ` : ''}BIN: {factoryProfile?.bin || '001234567-0101'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 16, fontWeight: 800, textTransform: 'uppercase', color: '#0f172a' }}>
                {documentType === 'challan' && 'ডেলিভারি চালান (Gate Pass)'}
                {documentType === 'bill' && 'সাব-কন্ট্রাক্ট নিটিং বিল (Tax Invoice)'}
                {documentType === 'jobcard' && (data.rows ? 'সুতা ব্যালেন্স বিবরণী' : 'ফ্যাক্টরি প্রোডাকশন জব কার্ড')}
                {documentType === 'qcreport' && '৪-পয়েন্ট ফ্যাব্রিক QC সার্টিফিকেট'}
                {documentType === 'rolltag' && 'বারকোড রোল ট্যাগ (Roll Label)'}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#c85a14', marginTop: 4 }}>
                নং: {data.no || data.id || data.rollId || 'N/A'}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>তারিখ: {data.date || new Date().toLocaleDateString('bn-BD')}</div>
            </div>
          </div>

          {/* Details Rendering Based on Document Type */}
          <div style={{ marginBottom: 20, fontSize: 14, lineHeight: 1.6 }}>
            {documentType === 'challan' && (
              <div>
                <table style={{ width: '100%', marginBottom: 16, borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '6px 0', width: '50%' }}><strong>প্রাপক / বায়ার:</strong> {data.party}</td>
                      <td style={{ padding: '6px 0', width: '50%' }}><strong>ওয়ার্ক অর্ডার নং:</strong> {data.orderId}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 0' }}><strong>গাড়ি নম্বর:</strong> {data.vehicle}</td>
                      <td style={{ padding: '6px 0' }}><strong>ড্রাইভার:</strong> {data.driver} ({data.driverPhone})</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 0' }}><strong>গেট পাস রেফারেন্স:</strong> {data.gatePass}</td>
                      <td style={{ padding: '6px 0' }}><strong>অবস্থা:</strong> {data.status}</td>
                    </tr>
                  </tbody>
                </table>

                {Array.isArray(data.rollItems) && data.rollItems.length > 0 ? (
                  <table className="data-table" style={{ width: '100%', border: '1px solid #cbd5e1' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9' }}>
                        <th>#</th>
                        <th>রোল নম্বর</th>
                        <th>মেশিন</th>
                        <th>সুতা লট</th>
                        <th style={{ textAlign: 'right' }}>ওজন (কেজি)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rollItems.map((r: any, idx: number) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td style={{ fontFamily: 'monospace' }}>{(r as any).no || r.rollId || (r as any).roll_no}</td>
                          <td>{r.machine || (r as any).m || '—'}</td>
                          <td>{r.lot || (r as any).yarn_lot || '—'}</td>
                          <td style={{ textAlign: 'right' }}>{(Number(r.kg) || Number((r as any).weight_kg) || 0).toFixed(1)}</td>
                        </tr>
                      ))}
                      <tr style={{ fontWeight: 'bold', background: '#f8fafc' }}>
                        <td colSpan={4}>মোট {data.rolls || data.rollItems.length} রোল</td>
                        <td style={{ textAlign: 'right' }}>{data.netKg || data.grossKg} কেজি</td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <table className="data-table" style={{ width: '100%', border: '1px solid #cbd5e1' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9' }}>
                        <th>আইটেম ও কাপড়ের বিবরণ</th>
                        <th>ডায়া ও গেজ</th>
                        <th>রোল সংখ্যা</th>
                        <th>গ্রস ওজন (কেজি)</th>
                        <th>নেট ওজন (কেজি)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{data.fabric}</td>
                        <td>{data.dia}</td>
                        <td>{data.rolls} টি</td>
                        <td>{data.grossKg} কেজি</td>
                        <td><strong>{data.netKg} কেজি</strong></td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {documentType === 'bill' && (
              <div>
                <table style={{ width: '100%', marginBottom: 16, borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '6px 0', width: '50%' }}><strong>বিল প্রাপক:</strong> {data.party}</td>
                      <td style={{ padding: '6px 0', width: '50%' }}><strong>অর্ডার রেফারেন্স:</strong> {data.orderId}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 0' }}><strong>বিল ইস্যুর তারিখ:</strong> {data.date}</td>
                      <td style={{ padding: '6px 0' }}><strong>পরিশোধের শেষ তারিখ:</strong> {data.dueDate}</td>
                    </tr>
                  </tbody>
                </table>

                <table className="data-table" style={{ width: '100%', border: '1px solid #cbd5e1', marginBottom: 16 }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th>বিবরণ</th>
                      <th>মোট বিল (টাকা)</th>
                      <th>ছাড় (টাকা)</th>
                      <th>অগ্রিম সমন্বয়</th>
                      <th>পরিশোধিত</th>
                      <th>অবশিষ্ট বকেয়া</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>নিটিং সাব-কন্ট্রাক্ট চার্জ ({data.orderId})</td>
                      <td>৳ {data.grossAmt?.toLocaleString('en-IN')}</td>
                      <td>৳ {data.discount?.toLocaleString('en-IN') || 0}</td>
                      <td>৳ {data.advance?.toLocaleString('en-IN') || 0}</td>
                      <td>৳ {data.paidAmt?.toLocaleString('en-IN') || 0}</td>
                      <td><strong>৳ {(data.grossAmt - (data.discount || 0) - (data.paidAmt || 0))?.toLocaleString('en-IN')}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {(documentType === 'jobcard' || (data.rows && Array.isArray(data.rows))) && (
              <div>
                <h4 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                  সুতা ব্যালেন্স ও খরচ বিবরণী
                </h4>
                <table className="data-table" style={{ width: '100%', border: '1px solid #cbd5e1', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th>#</th>
                      <th>অর্ডার</th>
                      <th>কাউন্ট</th>
                      <th>স্পিনার</th>
                      <th>লট</th>
                      <th style={{ textAlign: 'right' }}>এসেছে (কেজি)</th>
                      <th style={{ textAlign: 'right' }}>নিট (কেজি)</th>
                      <th style={{ textAlign: 'right' }}>খরচ (কেজি)</th>
                      <th style={{ textAlign: 'right' }}>ফেরত (কেজি)</th>
                      <th style={{ textAlign: 'right' }}>স্টক ব্যালেন্স</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((r: any, idx: number) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td style={{ fontFamily: 'monospace' }}>{r.o?.id || r.o || '—'}</td>
                        <td>{r.count}</td>
                        <td>{r.brand}</td>
                        <td style={{ fontFamily: 'monospace' }}>{r.lot}</td>
                        <td style={{ textAlign: 'right' }}>{r.recv?.toLocaleString('en-IN')}</td>
                        <td style={{ textAlign: 'right' }}>{r.knit?.toLocaleString('en-IN')}</td>
                        <td style={{ textAlign: 'right' }}>{r.used?.toLocaleString('en-IN')}</td>
                        <td style={{ textAlign: 'right' }}>{r.ret ? r.ret?.toLocaleString('en-IN') : '—'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: r.bal < 0 ? '#dc2626' : 'inherit' }}>
                          {r.bal?.toLocaleString('en-IN')} kg
                        </td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 800, background: '#f8fafc' }}>
                      <td colSpan={5}>মোট ({data.rows.length} লট)</td>
                      <td style={{ textAlign: 'right' }}>
                        {data.rows.reduce((a: number, r: any) => a + (Number(r.recv) || 0), 0)?.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {data.rows.reduce((a: number, r: any) => a + (Number(r.knit) || 0), 0)?.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {data.rows.reduce((a: number, r: any) => a + (Number(r.used) || 0), 0)?.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {data.rows.reduce((a: number, r: any) => a + (Number(r.ret) || 0), 0)?.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {data.rows.reduce((a: number, r: any) => a + (Number(r.bal) || 0), 0)?.toLocaleString('en-IN')} kg
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Signatures */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, paddingTop: 30, borderTop: '1px dashed #cbd5e1', fontSize: 13 }}>
            <div style={{ textAlign: 'center', width: 140 }}>
              <div style={{ borderTop: '1px solid #0f172a', paddingTop: 6 }}>প্রস্তুতকারী / স্টোর</div>
            </div>
            <div style={{ textAlign: 'center', width: 140 }}>
              <div style={{ borderTop: '1px solid #0f172a', paddingTop: 6 }}>ফ্যাক্টরি ইনচার্জ</div>
            </div>
            <div style={{ textAlign: 'center', width: 140 }}>
              <div style={{ borderTop: '1px solid #0f172a', paddingTop: 6 }}>গ্রহণকারী স্বাক্ষর ও সিল</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

