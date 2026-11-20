import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { bnNum, pct } from '@/utils/formatters';
import { apiClient } from '@/api/client';
import { SubcontractOrderItem } from '@/types/domain.types';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  Plus,
  Trash2,
  Building2,
  Layers,
  Loader2,
  Calendar,
  X,
} from 'lucide-react';

export const FactoryOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { orders: globalOrders, parties, setSelectedOrderId, deleteOrder, clearAllOrders, fetchOrders } = useApp();

  // Server-side filter and pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(15);
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [partyFilter, setPartyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  // Server data states
  const [paginatedOrders, setPaginatedOrders] = useState<SubcontractOrderItem[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 15,
    total: 0,
    last_page: 1,
    from: 0,
    to: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Debounce search input by 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1); // Reset to page 1 on new search
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch paginated orders from server
  const loadOrders = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.get('portal/orders', {
        params: {
          page: currentPage,
          per_page: perPage,
          search: debouncedSearch.trim() || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          party_code: partyFilter !== 'all' ? partyFilter : undefined,
          sort_by: sortBy,
          sort_dir: sortDir,
          paginate: 1,
        },
      });

      if (res && res.success && res.data) {
        if (res.data.items && Array.isArray(res.data.items)) {
          setPaginatedOrders(res.data.items);
          setPagination(res.data.pagination || {
            current_page: currentPage,
            per_page: perPage,
            total: res.data.items.length,
            last_page: 1,
            from: 1,
            to: res.data.items.length,
          });
        } else if (Array.isArray(res.data)) {
          setPaginatedOrders(res.data);
          setPagination({
            current_page: 1,
            per_page: res.data.length,
            total: res.data.length,
            last_page: 1,
            from: res.data.length > 0 ? 1 : 0,
            to: res.data.length,
          });
        }
      }
    } catch (err: any) {
      console.warn('Failed to load server-side orders, falling back to local state:', err);
      setErrorMsg('সার্ভার থেকে ডাটা লোড করতে সমস্যা হয়েছে। লোকাল ডাটা দেখানো হচ্ছে।');
      // Fallback to local filtering
      const filtered = globalOrders.filter((o) => {
        if (statusFilter !== 'all') {
          const st = (o.status || '').toLowerCase();
          if (statusFilter === 'running' && st !== 'running' && st !== 'run') return false;
          if (statusFilter === 'pending' && st !== 'pending' && st !== 'wait') return false;
          if (statusFilter === 'completed' && st !== 'completed' && st !== 'done' && st !== 'delivered') return false;
        }
        if (partyFilter !== 'all' && (o as any).party_code !== partyFilter && o.party !== partyFilter) {
          return false;
        }
        if (debouncedSearch.trim()) {
          const q = debouncedSearch.toLowerCase();
          const matchNo = (o.id || o.po || '').toLowerCase().includes(q);
          const matchBuyer = (o.buyer || '').toLowerCase().includes(q);
          const matchParty = (o.party || '').toLowerCase().includes(q);
          const matchFabric = (o.fabric || o.style || '').toLowerCase().includes(q);
          if (!matchNo && !matchBuyer && !matchParty && !matchFabric) return false;
        }
        return true;
      });

      const start = (currentPage - 1) * perPage;
      const end = start + perPage;
      setPaginatedOrders(filtered.slice(start, end));
      setPagination({
        current_page: currentPage,
        per_page: perPage,
        total: filtered.length,
        last_page: Math.max(1, Math.ceil(filtered.length / perPage)),
        from: filtered.length > 0 ? start + 1 : 0,
        to: Math.min(end, filtered.length),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [currentPage, perPage, debouncedSearch, statusFilter, partyFilter, sortBy, sortDir]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setStatusFilter('all');
    setPartyFilter('all');
    setSortBy('id');
    setSortDir('desc');
    setCurrentPage(1);
  };

  // Vendor summary stats across global orders
  const vendorSummary = useMemo(() => {
    const vendorMap = new Map<string, { count: number; qty: number; done: number }>();
    globalOrders.forEach((o) => {
      const vName = o.party || o.buyer || 'ABC Knit Composite';
      const lineQ = (o.lines || []).reduce((acc, l) => acc + (l.orderKg || (l as any).qty || 0), 0);
      const q = lineQ > 0 ? lineQ : Number(o.qty || 0);
      const lineD = (o.lines || []).reduce((acc, l) => acc + (l.knitKg || (l as any).done || 0), 0);
      const d = lineD > 0 ? lineD : Number(o.done || 0);
      const cur = vendorMap.get(vName) || { count: 0, qty: 0, done: 0 };
      vendorMap.set(vName, { count: cur.count + 1, qty: cur.qty + q, done: cur.done + d });
    });
    return Array.from(vendorMap.entries());
  }, [globalOrders]);

  // Page numbers for pagination bar
  const pageNumbers = useMemo(() => {
    const totalPages = pagination.last_page || 1;
    const current = pagination.current_page || 1;
    const delta = 2;
    const range: number[] = [];

    for (let i = Math.max(2, current - delta); i <= Math.min(totalPages - 1, current + delta); i++) {
      range.push(i);
    }

    if (current - delta > 2) {
      range.unshift(-1); // ellipsis
    }
    if (current + delta < totalPages - 1) {
      range.push(-2); // ellipsis
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  }, [pagination.last_page, pagination.current_page]);

  return (
    <>
      {/* Header with Title and Quick Action Buttons */}
      <div className="head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2>অর্ডার তালিকা</h2>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--primary, #0284c7)',
                background: 'var(--brand-surface, #e0f2fe)',
                padding: '2px 8px',
                borderRadius: 12,
              }}
            >
              মোট {bnNum(pagination.total)}টি অর্ডার
            </span>
          </div>
          <p>সার্ভার-সাইড পেজিনেশন ও ফিল্টারিং সহ সমস্ত নিটিং অর্ডার</p>
        </div>

        <div className="row" style={{ alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="btn sm"
            onClick={loadOrders}
            title="রিফ্রেশ করুন"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <RotateCcw size={13} className={isLoading ? 'animate-spin' : ''} />
            রিফ্রেশ
          </button>

          {pagination.total > 0 && (
            <button
              className="btn sm"
              style={{ color: 'var(--err)', borderColor: 'var(--err)' }}
              onClick={() => {
                if (window.confirm('আপনি কি নিশ্চিত যে সব অর্ডার মুছে ফেলতে চান?')) {
                  clearAllOrders();
                  loadOrders();
                }
              }}
            >
              সব অর্ডার মুছুন
            </button>
          )}

          <button className="btn" onClick={() => navigate('/dashboard/party')}>
            + নতুন পার্টি
          </button>
          <button className="btn pri" onClick={() => navigate('/dashboard/neworder')}>
            + New Order Entry
          </button>
        </div>
      </div>

      {/* Vendor Summary KPI Cards */}
      {vendorSummary.length > 0 && (
        <div className="kpis">
          {vendorSummary.map(([vName, stats]) => (
            <div className="kpi" key={vName}>
              <span>{vName}</span>
              <b>
                {bnNum(stats.done.toLocaleString('en-IN'))} / {bnNum(stats.qty.toLocaleString('en-IN'))}
              </b>
              <i>kg · {bnNum(stats.count)}টি অর্ডার</i>
            </div>
          ))}
        </div>
      )}

      {/* Search, Filter & Server Controls Toolbar */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          marginBottom: 16,
          background: 'var(--surface)',
          borderRadius: 12,
          border: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            alignItems: 'center',
          }}
        >
          {/* 1. Server-side Search Input */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                position: 'absolute',
                left: 10,
                color: 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              <Search size={15} />
            </div>
            <input
              type="text"
              placeholder="অর্ডার নং, বায়ার, ফেব্রিক বা কালার..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 30px 8px 32px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="মুছে ফেলুন"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* 2. Order Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>অবস্থা:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              <option value="all">সকল অবস্থা</option>
              <option value="running">চলমান (Running)</option>
              <option value="pending">সুতার অপেক্ষায় (Wait/Pending)</option>
              <option value="completed">সম্পন্ন / ডেলিভারি (Completed)</option>
            </select>
          </div>

          {/* 3. Party Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>পার্টি:</span>
            <SearchableSelect
              value={partyFilter}
              onChange={(val) => {
                setPartyFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'সকল বায়ার / ভেন্ডর' },
                ...parties
                  .filter((p) => (p.type || '').toLowerCase() !== 'sup')
                  .map((p) => ({
                    value: p.code || p.name,
                    label: p.name,
                  })),
              ]}
              searchPlaceholder="পার্টি খুঁজুন..."
              style={{ minWidth: 190 }}
            />
          </div>

          {/* 4. Per Page & Reset Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>প্রতি পেজে:</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                <option value={10}>১০টি</option>
                <option value={15}>১৫টি</option>
                <option value={25}>২৫টি</option>
                <option value={50}>৫০টি</option>
                <option value={100}>১০০টি</option>
              </select>
            </div>

            {(searchInput || statusFilter !== 'all' || partyFilter !== 'all') && (
              <button
                type="button"
                className="btn sm"
                onClick={handleResetFilters}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.8rem',
                  padding: '7px 12px',
                }}
                title="ফিল্টার রিসেট করুন"
              >
                <RotateCcw size={12} />
                রিসেট
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMsg && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 14,
            fontSize: '0.85rem',
            color: '#ef4444',
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Order List Table with Loading State */}
      <div className="tw" style={{ position: 'relative', minHeight: 220 }}>
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              borderRadius: 8,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--surface, #ffffff)',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary, #0284c7)',
              }}
            >
              <Loader2 size={24} className="animate-spin" />
            </div>
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th>অর্ডার নং</th>
              <th>ভেন্ডর</th>
              <th>ফেব্রিক</th>
              <th className="n">অর্ডার (kg)</th>
              <th className="n">হয়েছে (kg)</th>
              <th>অগ্রগতি</th>
              <th className="n">মেশিন</th>
              <th>সম্ভাব্য শেষ</th>
              <th>অবস্থা</th>
              <th style={{ width: 44, textAlign: 'center' }}></th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <Layers size={32} style={{ opacity: 0.4 }} />
                    <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>কোনো অর্ডার পাওয়া যায়নি</div>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>
                      {searchInput || statusFilter !== 'all' || partyFilter !== 'all'
                        ? 'আপনার অনুসন্ধান বা ফিল্টারের সাথে মিলে এমন কোনো অর্ডার নেই।'
                        : 'এখনো কোনো অর্ডার তৈরি হয়নি। উপরে "+ New Order Entry" বাটনে ক্লিক করে নতুন অর্ডার যুক্ত করুন।'}
                    </p>
                    {(searchInput || statusFilter !== 'all' || partyFilter !== 'all') && (
                      <button type="button" className="btn sm pri" onClick={handleResetFilters} style={{ marginTop: 4 }}>
                        ফিল্টার রিসেট করুন
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedOrders.map((o) => {
                const lineTotalKg = (o.lines || []).reduce((acc, l) => acc + (l.orderKg || (l as any).qty || 0), 0);
                const totalKg = lineTotalKg > 0 ? lineTotalKg : Number(o.qty || 0);
                const lineKnitKg = (o.lines || []).reduce((acc, l) => acc + (l.knitKg || (l as any).done || 0), 0);
                const knitKg = lineKnitKg > 0 ? lineKnitKg : Number(o.done || 0);
                const progressPct = pct(knitKg, totalKg);
                const machineList =
                  Array.isArray(o.machines) && o.machines.length > 0
                    ? o.machines
                    : Array.from(new Set((o.lines || []).map((l) => l.machine).filter(Boolean)));
                const isDone = o.status === 'Completed' || (o.status as string) === 'done' || (o.status as string) === 'delivered';
                const isWait = o.status === 'Pending' || (o.status as string) === 'wait';

                return (
                  <tr
                    key={o.id}
                    className="click"
                    onClick={() => {
                      setSelectedOrderId(o.id);
                      navigate(`/dashboard/orders/${o.id}`);
                      window.scrollTo(0, 0);
                    }}
                  >
                    <td className="mono">{o.id}</td>
                    <td>{o.party || o.buyer || 'ABC Knit Composite'}</td>
                    <td>
                      {o.fabric || o.lines[0]?.fabric || o.style || 'Single Jersey'}
                      {o.gsm || o.lines[0]?.gsm ? ` ${o.gsm || o.lines[0]?.gsm} GSM` : ''}
                    </td>
                    <td className="n">{bnNum(totalKg.toLocaleString('en-IN'))}</td>
                    <td className="n">{bnNum(knitKg.toLocaleString('en-IN'))}</td>
                    <td>
                      <div className="row" style={{ flexWrap: 'nowrap', alignItems: 'center', gap: 8 }}>
                        <div className="bar" style={{ width: 90 }}>
                          <i style={{ width: `${progressPct}%` }}></i>
                        </div>
                        <span className="mono small">{bnNum(progressPct)}%</span>
                      </div>
                    </td>
                    <td className="n">{machineList.length ? bnNum(machineList.length) : '—'}</td>
                    <td className="mono small">{isDone ? '—' : isWait ? 'সুতা এলে' : o.delivDate || '১৫ অক্টো'}</td>
                    <td>
                      {isDone ? (
                        <span className="pill p-ok">ডেলিভারি সম্পন্ন</span>
                      ) : isWait ? (
                        <span className="pill p-yarn">সুতার অপেক্ষায়</span>
                      ) : (
                        <span className="pill p-acc">চলছে</span>
                      )}
                    </td>
                    <td
                      style={{ textAlign: 'center' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`আপনি কি ${o.id} অর্ডারটি মুছে ফেলতে চান?`)) {
                          deleteOrder(o.id).then(() => loadOrders());
                        }
                      }}
                    >
                      <button
                        className="btn icon sm"
                        title="মুছুন"
                        style={{
                          color: 'var(--err)',
                          padding: '2px 6px',
                          fontSize: 13,
                          minWidth: 26,
                          height: 26,
                          lineHeight: 1,
                        }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Server-Side Pagination Bar */}
      {pagination.total > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginTop: 14,
            padding: '12px 16px',
            background: 'var(--surface)',
            borderRadius: 10,
            border: '1px solid var(--border)',
          }}
        >
          {/* Pagination summary info */}
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            মোট <b>{bnNum(pagination.total)}</b>টি অর্ডারের মধ্যে{' '}
            <b>
              {bnNum(pagination.from)}-{bnNum(pagination.to)}
            </b>{' '}
            দেখানো হচ্ছে (পেজ <b>{bnNum(pagination.current_page)}</b> / <b>{bnNum(pagination.last_page)}</b>)
          </div>

          {/* Navigation Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* First Page Button */}
            <button
              type="button"
              className="btn sm"
              disabled={pagination.current_page <= 1 || isLoading}
              onClick={() => setCurrentPage(1)}
              title="প্রথম পেজ"
              style={{ padding: '6px 8px', display: 'flex', alignItems: 'center' }}
            >
              <ChevronsLeft size={15} />
            </button>

            {/* Previous Page Button */}
            <button
              type="button"
              className="btn sm"
              disabled={pagination.current_page <= 1 || isLoading}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              title="পূর্ববর্তী পেজ"
              style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <ChevronLeft size={15} />
              <span>আগের</span>
            </button>

            {/* Page Number Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {pageNumbers.map((p, idx) => {
                if (p < 0) {
                  return (
                    <span key={`ellipsis-${idx}`} style={{ padding: '0 4px', color: 'var(--muted)', fontSize: 13 }}>
                      ...
                    </span>
                  );
                }
                const isActive = p === pagination.current_page;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    disabled={isLoading}
                    style={{
                      minWidth: 32,
                      height: 32,
                      borderRadius: 6,
                      fontSize: '0.85rem',
                      fontWeight: isActive ? 700 : 500,
                      border: isActive ? '1px solid var(--primary, #0284c7)' : '1px solid var(--border)',
                      background: isActive ? 'var(--primary, #0284c7)' : 'transparent',
                      color: isActive ? '#ffffff' : 'var(--text)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {bnNum(p)}
                  </button>
                );
              })}
            </div>

            {/* Next Page Button */}
            <button
              type="button"
              className="btn sm"
              disabled={pagination.current_page >= pagination.last_page || isLoading}
              onClick={() => setCurrentPage((prev) => Math.min(pagination.last_page, prev + 1))}
              title="পরবর্তী পেজ"
              style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <span>পরের</span>
              <ChevronRight size={15} />
            </button>

            {/* Last Page Button */}
            <button
              type="button"
              className="btn sm"
              disabled={pagination.current_page >= pagination.last_page || isLoading}
              onClick={() => setCurrentPage(pagination.last_page)}
              title="শেষ পেজ"
              style={{ padding: '6px 8px', display: 'flex', alignItems: 'center' }}
            >
              <ChevronsRight size={15} />
            </button>
          </div>
        </div>
      )}

      <p className="small muted" style={{ marginTop: 10 }}>
        যেকোনো অর্ডারে ক্লিক করলে বিস্তারিত — সুতা, লট, মেশিন, দৈনিক প্রোডাকশন, QC — সব দেখা যাবে।
      </p>
    </>
  );
};
