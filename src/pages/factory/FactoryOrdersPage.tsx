import React, { useEffect, useState, useMemo } from 'react';
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
  Package,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowUpDown,
  ArrowUpRight,
} from 'lucide-react';

export const FactoryOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { orders: globalOrders, parties, setSelectedOrderId, deleteOrder, clearAllOrders, t, language } = useApp();

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
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch paginated orders from server
  const loadOrders = async (isInitial = false) => {
    if (isInitial || paginatedOrders.length === 0) {
      setIsLoading(true);
    }
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
          setPagination(
            res.data.pagination || {
              current_page: currentPage,
              per_page: perPage,
              total: res.data.items.length,
              last_page: 1,
              from: 1,
              to: res.data.items.length,
            }
          );
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

  // High-level KPI computation across global orders
  const metrics = useMemo(() => {
    let totalTargetKg = 0;
    let totalDoneKg = 0;
    let runningCount = 0;
    let runningKg = 0;
    let runningDoneKg = 0;
    let pendingCount = 0;
    let pendingKg = 0;
    let completedCount = 0;
    let completedKg = 0;

    globalOrders.forEach((o) => {
      const lineQ = (o.lines || []).reduce((acc, l) => acc + (l.orderKg || (l as any).qty || 0), 0);
      const q = lineQ > 0 ? lineQ : Number(o.qty || 0);
      const lineD = (o.lines || []).reduce((acc, l) => acc + (l.knitKg || (l as any).done || 0), 0);
      const d = lineD > 0 ? lineD : Number(o.done || 0);

      totalTargetKg += q;
      totalDoneKg += d;

      const st = (o.status || '').toLowerCase();
      if (st === 'running' || st === 'run') {
        runningCount++;
        runningKg += q;
        runningDoneKg += d;
      } else if (st === 'pending' || st === 'wait') {
        pendingCount++;
        pendingKg += q;
      } else if (st === 'completed' || st === 'done' || st === 'delivered') {
        completedCount++;
        completedKg += q;
      } else {
        runningCount++;
        runningKg += q;
        runningDoneKg += d;
      }
    });

    return {
      totalOrders: globalOrders.length,
      totalTargetKg,
      totalDoneKg,
      runningCount,
      runningKg,
      runningDoneKg,
      pendingCount,
      pendingKg,
      completedCount,
      completedKg,
      overallPct: pct(totalDoneKg, totalTargetKg),
      runningPct: pct(runningDoneKg, runningKg),
    };
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
      range.unshift(-1);
    }
    if (current + delta < totalPages - 1) {
      range.push(-2);
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  }, [pagination.last_page, pagination.current_page]);

  const hasActiveFilters = Boolean(searchInput || partyFilter !== 'all' || sortBy !== 'id');

  const statusTabs = [
    { id: 'all', label: language === 'en' ? 'All Orders' : 'সকল অর্ডার', count: metrics.totalOrders },
    { id: 'running', label: language === 'en' ? 'Running Knitting' : 'চলমান নিটিং', count: metrics.runningCount, dotColor: 'var(--ok)' },
    { id: 'pending', label: language === 'en' ? 'Awaiting Yarn' : 'সুতার অপেক্ষায়', count: metrics.pendingCount, dotColor: 'var(--yarn)' },
    { id: 'completed', label: language === 'en' ? 'Completed / Delivered' : 'সম্পন্ন / ডেলিভারি', count: metrics.completedCount, dotColor: '#6366f1' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Page Header with Title & Primary Actions */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(47, 91, 234, 0.12)',
            }}
          >
            <Package size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--ink)',
                  letterSpacing: '-0.02em',
                }}
              >
                {t('অর্ডার তালিকা')}
              </h2>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--accent)',
                  background: 'var(--accent-soft)',
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontFamily: 'var(--f-mono)',
                }}
              >
                {t('মোট')} {bnNum(pagination.total || metrics.totalOrders)} {language === 'en' ? 'orders' : 'টি'}
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: 'var(--muted)' }}>
              {language === 'en' ? 'Tracking & history of all active & completed knitting orders' : 'ফ্যাক্টরির সমস্ত সক্রিয় ও সম্পন্ন নিটিং অর্ডারের ট্র্যাকিং ও বিস্তারিত হিস্ট্রি'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn sm"
            onClick={() => loadOrders(true)}
            title={language === 'en' ? 'Refresh data' : 'ডাটা রিফ্রেশ করুন'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: '0.84rem',
              padding: '7px 12px',
            }}
          >
            <RotateCcw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>{language === 'en' ? 'Refresh' : 'রিফ্রেশ'}</span>
          </button>

          <button
            type="button"
            className="btn sm"
            onClick={() => navigate('/dashboard/party')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: '0.84rem',
              padding: '7px 12px',
            }}
          >
            <Building2 size={14} style={{ color: 'var(--muted)' }} />
            <span>+ {t('নতুন পার্টি')}</span>
          </button>

          <button
            type="button"
            className="btn pri sm"
            onClick={() => navigate('/dashboard/neworder')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: '0.86rem',
              padding: '7px 14px',
            }}
          >
            <Plus size={15} />
            <span>{t('নতুন অর্ডার এন্ট্রি')}</span>
          </button>
        </div>
      </div>

      {/* 2. Compact Metric Highlights */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
        }}
      >
        {/* Metric 1 */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 10,
            padding: '12px 14px',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)' }}>{t('মোট অর্ডার ভলিউম')}</div>
            <div
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--ink)',
                fontFamily: 'var(--f-mono)',
                marginTop: 2,
              }}
            >
              {bnNum(metrics.totalTargetKg.toLocaleString('en-IN'))}{' '}
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--muted)' }}>kg</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>
              {bnNum(metrics.totalOrders)} {language === 'en' ? 'orders booked' : 'টি অর্ডার বুকিং'}
            </div>
          </div>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Package size={17} />
          </div>
        </div>

        {/* Metric 2 */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 10,
            padding: '12px 14px',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)' }}>{t('চলমান উৎপাদন')}</div>
            <div
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--ok)',
                fontFamily: 'var(--f-mono)',
                marginTop: 2,
              }}
            >
              {bnNum(metrics.runningDoneKg.toLocaleString('en-IN'))}{' '}
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--muted)' }}>kg</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ok)', fontWeight: 600, marginTop: 2 }}>
              {bnNum(metrics.runningPct)}% {t('সম্পন্ন')} ({bnNum(metrics.runningCount)} {language === 'en' ? 'running' : 'টি চলমান'})
            </div>
          </div>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'var(--ok-soft)',
              color: 'var(--ok)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <TrendingUp size={17} />
          </div>
        </div>

        {/* Metric 3 */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 10,
            padding: '12px 14px',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)' }}>{t('সুতার অপেক্ষায়')}</div>
            <div
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--yarn)',
                fontFamily: 'var(--f-mono)',
                marginTop: 2,
              }}
            >
              {bnNum(metrics.pendingKg.toLocaleString('en-IN'))}{' '}
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--muted)' }}>kg</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--yarn)', fontWeight: 600, marginTop: 2 }}>
              {bnNum(metrics.pendingCount)} {language === 'en' ? 'orders awaiting yarn' : 'টি অর্ডারে সুতা বাকি'}
            </div>
          </div>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'var(--yarn-soft)',
              color: 'var(--yarn)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Clock size={17} />
          </div>
        </div>

        {/* Metric 4 */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 10,
            padding: '12px 14px',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)' }}>{t('ডেলিভারি সম্পন্ন')}</div>
            <div
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#6366f1',
                fontFamily: 'var(--f-mono)',
                marginTop: 2,
              }}
            >
              {bnNum(metrics.completedKg.toLocaleString('en-IN'))}{' '}
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--muted)' }}>kg</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>
              {bnNum(metrics.completedCount)} {language === 'en' ? 'orders delivered' : 'টি অর্ডার ডেলিভারি সমাপ্ত'}
            </div>
          </div>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'rgba(99, 102, 241, 0.12)',
              color: '#6366f1',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={17} />
          </div>
        </div>
      </div>

      {/* 3. Unified Orders Card with Integrated Tabs, Search & Table */}
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 12,
          border: '1px solid var(--line)',
          boxShadow: 'var(--shadow)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Loading Overlay — only on cold initial load without existing data */}
        {isLoading && paginatedOrders.length === 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255, 255, 255, 0.65)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
            }}
          >
            <div
              style={{
                padding: '10px 18px',
                background: 'var(--surface)',
                borderRadius: 8,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                border: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--accent)',
                fontWeight: 600,
                fontSize: '0.88rem',
              }}
            >
              <Loader2 size={18} className="animate-spin" />
              <span>{language === 'en' ? 'Loading orders...' : 'ডাটা লোড হচ্ছে...'}</span>
            </div>
          </div>
        )}

        {/* Subtle top loading line during background fetch */}
        {isLoading && paginatedOrders.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: 'var(--grad, linear-gradient(90deg, #2563EB, #4F46E5))',
              zIndex: 25,
            }}
          />
        )}

        {/* Top Header Tabs Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            borderBottom: '1px solid var(--line)',
            padding: '0 12px',
            background: 'var(--surface)',
            overflowX: 'auto',
          }}
        >
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                  // Instant zero-lag filter from in-memory globalOrders
                  if (globalOrders.length > 0) {
                    const filtered = globalOrders.filter((o) => {
                      if (tab.id !== 'all') {
                        const st = (o.status || '').toLowerCase();
                        if (tab.id === 'running' && st !== 'running' && st !== 'run') return false;
                        if (tab.id === 'pending' && st !== 'pending' && st !== 'wait') return false;
                        if (tab.id === 'completed' && st !== 'completed' && st !== 'done' && st !== 'delivered') return false;
                      }
                      if (partyFilter !== 'all' && (o as any).party_code !== partyFilter && o.party !== partyFilter) return false;
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
                    setPaginatedOrders(filtered.slice(0, perPage));
                    setPagination({
                      current_page: 1,
                      per_page: perPage,
                      total: filtered.length,
                      last_page: Math.max(1, Math.ceil(filtered.length / perPage)),
                      from: filtered.length > 0 ? 1 : 0,
                      to: Math.min(perPage, filtered.length),
                    });
                  }
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: isActive ? 'var(--accent)' : 'var(--muted)',
                  borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  marginBottom: -1,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'color 0.15s ease, border-color 0.15s ease',
                }}
              >
                {tab.dotColor && (
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: tab.dotColor,
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                )}
                <span style={{ whiteSpace: 'nowrap' }}>{tab.label}</span>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: 999,
                    background: isActive ? 'var(--accent-soft)' : 'var(--surface2)',
                    color: isActive ? 'var(--accent)' : 'var(--muted)',
                    fontFamily: 'var(--f-mono)',
                    lineHeight: 1.4,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {bnNum(tab.count)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Filter Toolbar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '10px 14px',
            background: 'var(--surface)',
            borderBottom: '1px solid var(--line)',
          }}
        >
          {/* Left: Modern Search Bar */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              flex: '1 1 240px',
              maxWidth: 420,
            }}
          >
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
              placeholder={language === 'en' ? 'Search order no, buyer, fabric or color...' : 'অর্ডার নং, বায়ার, ফেব্রিক বা কালার খুঁজুন...'}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 30px 8px 32px',
                borderRadius: 8,
                border: '1px solid var(--line)',
                background: 'var(--surface2)',
                color: 'var(--ink)',
                fontSize: '0.86rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--line)')}
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

          {/* Right: Party filter + Sort + Per page + Reset */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Party Filter */}
            <div style={{ minWidth: 165 }}>
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
                searchPlaceholder="বায়ার খুঁজুন..."
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '7px 9px',
                borderRadius: 8,
                border: '1px solid var(--line)',
                background: 'var(--surface2)',
                color: 'var(--ink)',
                fontSize: '0.83rem',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="id">সর্বশেষ তৈরি</option>
              <option value="order_no">অর্ডার নম্বর</option>
              <option value="total_qty_kg">সর্বোচ্চ ভলিউম</option>
              <option value="done_kg">সর্বাধিক উৎপাদিত</option>
            </select>

            {/* Sort Direction Toggle Button */}
            <button
              type="button"
              className="btn sm"
              onClick={() => setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              title={sortDir === 'desc' ? 'বড় থেকে ছোট (Descending)' : 'ছোট থেকে বড় (Ascending)'}
              style={{
                padding: '6px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontSize: '0.8rem',
                color: 'var(--muted)',
                borderRadius: 8,
              }}
            >
              <ArrowUpDown size={13} />
              <span>{sortDir === 'desc' ? '↓' : '↑'}</span>
            </button>

            {/* Per Page */}
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                padding: '7px 8px',
                borderRadius: 8,
                border: '1px solid var(--line)',
                background: 'var(--surface2)',
                color: 'var(--ink)',
                fontSize: '0.83rem',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value={10}>১০টি</option>
              <option value={15}>১৫টি</option>
              <option value={25}>২৫টি</option>
              <option value={50}>৫০টি</option>
            </select>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                type="button"
                className="btn sm"
                onClick={handleResetFilters}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.8rem',
                  padding: '6px 10px',
                  color: 'var(--bad)',
                  borderColor: 'var(--bad-soft)',
                  background: 'var(--bad-soft)',
                }}
                title="সকল ফিল্টার রিসেট করুন"
              >
                <RotateCcw size={12} />
                <span>রিসেট</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Chips Strip (only if filters applied) */}
        {hasActiveFilters && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              padding: '7px 14px',
              background: 'var(--surface2)',
              borderBottom: '1px solid var(--line)',
              fontSize: '0.78rem',
            }}
          >
            <span style={{ color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Filter size={11} /> সক্রিয় ফিল্টার:
            </span>

            {debouncedSearch && (
              <span
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  padding: '2px 7px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                সার্চ: <b>{debouncedSearch}</b>
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: 'var(--muted)' }}
                >
                  <X size={11} />
                </button>
              </span>
            )}

            {partyFilter !== 'all' && (
              <span
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  padding: '2px 7px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                {language === 'en' ? 'Buyer / Vendor:' : 'বায়ার / ভেন্ডর:'} <b>{partyFilter}</b>
                <button
                  type="button"
                  onClick={() => setPartyFilter('all')}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: 'var(--muted)' }}
                >
                  <X size={11} />
                </button>
              </span>
            )}
          </div>
        )}

        {/* The Orders Table */}
        <div className="tw" style={{ border: 'none', borderRadius: 0, overflowX: 'auto', minHeight: 460 }}>
          <table style={{ margin: 0, width: '100%' }}>
            <thead>
              <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--line)' }}>
                <th style={{ padding: '11px 14px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)' }}>{t('অর্ডার নং')}</th>
                <th style={{ padding: '11px 14px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)' }}>{t('ভেন্ডর')}</th>
                <th style={{ padding: '11px 14px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)' }}>{t('ফেব্রিক')}</th>
                <th className="n" style={{ padding: '11px 14px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)' }}>
                  {t('অর্ডার (kg)')}
                </th>
                <th className="n" style={{ padding: '11px 14px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)' }}>
                  {t('হয়েছে (kg)')}
                </th>
                <th style={{ padding: '11px 14px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', minWidth: 120 }}>
                  {t('অগ্রগতি')}
                </th>
                <th className="n" style={{ padding: '11px 14px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)' }}>
                  {t('মেশিন')}
                </th>
                <th style={{ padding: '11px 14px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)' }}>{language === 'en' ? 'Target Date' : 'সম্ভাব্য শেষ'}</th>
                <th style={{ padding: '11px 14px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)' }}>{t('অবস্থা')}</th>
                <th style={{ padding: '11px 14px', textAlign: 'center', width: 85 }}></th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '52px 20px', color: 'var(--muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: '50%',
                          background: 'var(--surface2)',
                          display: 'grid',
                          placeItems: 'center',
                          color: 'var(--muted)',
                        }}
                      >
                        <Layers size={26} style={{ opacity: 0.6 }} />
                      </div>
                      <div style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--ink)' }}>কোনো অর্ডার পাওয়া যায়নি</div>
                      <p style={{ margin: 0, fontSize: '0.84rem', maxWidth: 400 }}>
                        {hasActiveFilters
                          ? 'আপনার সার্চ বা ফিল্টারের সাথে মিলে এমন কোনো অর্ডার খুঁজে পাওয়া যায়নি।'
                          : 'বর্তমানে ফ্যাক্টরিতে কোনো অর্ডার নেই। নতুন অর্ডার এন্ট্রি করতে নিচের বাটনে ক্লিক করুন।'}
                      </p>
                      {hasActiveFilters ? (
                        <button type="button" className="btn sm" onClick={handleResetFilters} style={{ marginTop: 4 }}>
                          ফিল্টার রিসেট করুন
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn pri sm"
                          onClick={() => navigate('/dashboard/neworder')}
                          style={{ marginTop: 4 }}
                        >
                          + প্রথম অর্ডার এন্ট্রি করুন
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

                  const isDone =
                    o.status === 'Completed' ||
                    (o.status as string) === 'done' ||
                    (o.status as string) === 'delivered';
                  const isWait = o.status === 'Pending' || (o.status as string) === 'wait';

                  const primaryFabric = o.fabric || o.lines[0]?.fabric || o.style || 'Single Jersey';
                  const primaryGsm = o.gsm || o.lines[0]?.gsm;
                  const primaryDia = (o as any).dia || o.lines[0]?.dia;
                  const primaryLot = (o as any).lot || o.lines[0]?.lot;

                  return (
                    <tr
                      key={o.id}
                      className="click"
                      onClick={() => {
                        setSelectedOrderId(o.id);
                        navigate(`/dashboard/orders/${o.id}`);
                        window.scrollTo(0, 0);
                      }}
                      style={{
                        transition: 'background-color 0.15s ease',
                        borderBottom: '1px solid var(--line)',
                      }}
                    >
                      {/* 1. অর্ডার নং */}
                      <td style={{ padding: '11px 14px' }}>
                        <span
                          style={{
                            fontFamily: 'var(--f-mono)',
                            fontWeight: 700,
                            fontSize: '0.86rem',
                            color: 'var(--accent)',
                            background: 'var(--accent-soft)',
                            padding: '2px 7px',
                            borderRadius: 5,
                            display: 'inline-block',
                          }}
                        >
                          {o.id}
                        </span>
                      </td>

                      {/* 2. ভেন্ডর */}
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.88rem' }}>
                          {o.party || o.buyer || 'ABC Knit Composite'}
                        </span>
                      </td>

                      {/* 3. ফেব্রিক */}
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.86rem' }}>
                            {primaryFabric}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                            {primaryGsm && (
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  color: 'var(--muted)',
                                  background: 'var(--surface2)',
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                }}
                              >
                                {primaryGsm} GSM
                              </span>
                            )}
                            {primaryDia && (
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  color: 'var(--muted)',
                                  background: 'var(--surface2)',
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                }}
                              >
                                {primaryDia}" Dia
                              </span>
                            )}
                            {primaryLot && (
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  color: 'var(--muted)',
                                  fontFamily: 'var(--f-mono)',
                                }}
                              >
                                লট: {primaryLot}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 4. অর্ডার (kg) */}
                      <td className="n" style={{ padding: '11px 14px' }}>
                        <span
                          style={{
                            fontFamily: 'var(--f-mono)',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            color: 'var(--ink)',
                          }}
                        >
                          {bnNum(totalKg.toLocaleString('en-IN'))}
                        </span>
                      </td>

                      {/* 5. হয়েছে (kg) */}
                      <td className="n" style={{ padding: '11px 14px' }}>
                        <span
                          style={{
                            fontFamily: 'var(--f-mono)',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            color: isDone ? 'var(--ok)' : 'var(--accent)',
                          }}
                        >
                          {bnNum(knitKg.toLocaleString('en-IN'))}
                        </span>
                      </td>

                      {/* 6. অগ্রগতি */}
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            style={{
                              flex: 1,
                              height: 6,
                              background: 'var(--surface2)',
                              borderRadius: 999,
                              overflow: 'hidden',
                              border: '1px solid var(--line)',
                              minWidth: 60,
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${progressPct}%`,
                                background: isDone
                                  ? 'var(--ok)'
                                  : progressPct > 50
                                  ? 'var(--grad)'
                                  : 'var(--yarn)',
                                borderRadius: 999,
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontFamily: 'var(--f-mono)',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              color: isDone ? 'var(--ok)' : 'var(--ink)',
                              minWidth: 36,
                              textAlign: 'right',
                            }}
                          >
                            {bnNum(progressPct)}%
                          </span>
                        </div>
                      </td>

                      {/* 7. মেশিন */}
                      <td className="n" style={{ padding: '11px 14px' }}>
                        {machineList.length > 0 ? (
                          <span
                            style={{
                              fontFamily: 'var(--f-mono)',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              color: 'var(--ink)',
                              background: 'var(--surface2)',
                              padding: '2px 7px',
                              borderRadius: 5,
                            }}
                          >
                            {bnNum(machineList.length)}টি
                          </span>
                        ) : (
                          <span style={{ color: 'var(--muted)' }}>—</span>
                        )}
                      </td>

                      {/* 8. সম্ভাব্য শেষ */}
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem' }}>
                          <Calendar size={12} style={{ color: 'var(--muted)' }} />
                          <span style={{ color: isDone ? 'var(--muted)' : 'var(--ink)' }}>
                            {isDone ? '—' : isWait ? 'সুতা এলে' : o.delivDate || '১৫ অক্টো'}
                          </span>
                        </div>
                      </td>

                      {/* 9. অবস্থা */}
                      <td style={{ padding: '11px 14px' }}>
                        {isDone ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '2px 9px',
                              borderRadius: 999,
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              background: 'var(--ok-soft)',
                              color: 'var(--ok)',
                            }}
                          >
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                            ডেলিভারি সম্পন্ন
                          </span>
                        ) : isWait ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '2px 9px',
                              borderRadius: 999,
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              background: 'var(--yarn-soft)',
                              color: 'var(--yarn)',
                            }}
                          >
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                            সুতার অপেক্ষায়
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '2px 9px',
                              borderRadius: 999,
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              background: 'var(--accent-soft)',
                              color: 'var(--accent)',
                            }}
                          >
                            <span
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                background: 'currentColor',
                              }}
                            />
                            চলমান
                          </span>
                        )}
                      </td>

                      {/* 10. Actions Column */}
                      <td
                        style={{ padding: '11px 14px', textAlign: 'center' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <button
                            type="button"
                            className="btn sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrderId(o.id);
                              navigate(`/dashboard/orders/${o.id}`);
                            }}
                            title="বিস্তারিত দেখুন"
                            style={{
                              padding: '3px 7px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                              fontSize: '0.76rem',
                              color: 'var(--accent)',
                              borderColor: 'var(--accent-soft)',
                            }}
                          >
                            <span>দেখুন</span>
                            <ArrowUpRight size={12} />
                          </button>

                          <button
                            type="button"
                            className="btn sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`আপনি কি ${o.id} অর্ডারটি সম্পূর্ণ মুছে ফেলতে চান?`)) {
                                deleteOrder(o.id).then(() => loadOrders());
                              }
                            }}
                            title="অর্ডারটি মুছুন"
                            style={{
                              padding: '3px 6px',
                              color: 'var(--bad)',
                              borderColor: 'var(--line)',
                              background: 'transparent',
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Integrated Pagination Footer */}
        {pagination.total > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              borderTop: '1px solid var(--line)',
              background: 'var(--surface)',
            }}
          >
            <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
              মোট <b>{bnNum(pagination.total)}</b>টি অর্ডারের মধ্যে{' '}
              <b style={{ color: 'var(--ink)' }}>
                {bnNum(pagination.from)} - {bnNum(pagination.to)}
              </b>{' '}
              প্রদর্শিত (পেজ <b style={{ color: 'var(--ink)' }}>{bnNum(pagination.current_page)}</b> /{' '}
              {bnNum(pagination.last_page)})
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                className="btn sm"
                disabled={pagination.current_page <= 1 || isLoading}
                onClick={() => setCurrentPage(1)}
                title="প্রথম পেজ"
                style={{ padding: '5px 7px', display: 'flex', alignItems: 'center' }}
              >
                <ChevronsLeft size={14} />
              </button>

              <button
                type="button"
                className="btn sm"
                disabled={pagination.current_page <= 1 || isLoading}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                title="পূর্ববর্তী পেজ"
                style={{ padding: '5px 9px', display: 'flex', alignItems: 'center', gap: 3 }}
              >
                <ChevronLeft size={14} />
                <span>আগের</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 3, margin: '0 3px' }}>
                {pageNumbers.map((p, idx) => {
                  if (p < 0) {
                    return (
                      <span key={`ellipsis-${idx}`} style={{ padding: '0 3px', color: 'var(--muted)', fontSize: 12 }}>
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
                        minWidth: 30,
                        height: 30,
                        borderRadius: 6,
                        fontSize: '0.82rem',
                        fontWeight: isActive ? 700 : 500,
                        border: isActive ? '1px solid var(--accent)' : '1px solid var(--line)',
                        background: isActive ? 'var(--accent)' : 'var(--surface)',
                        color: isActive ? '#ffffff' : 'var(--ink)',
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

              <button
                type="button"
                className="btn sm"
                disabled={pagination.current_page >= pagination.last_page || isLoading}
                onClick={() => setCurrentPage((prev) => Math.min(pagination.last_page, prev + 1))}
                title="পরবর্তী পেজ"
                style={{ padding: '5px 9px', display: 'flex', alignItems: 'center', gap: 3 }}
              >
                <span>পরের</span>
                <ChevronRight size={14} />
              </button>

              <button
                type="button"
                className="btn sm"
                disabled={pagination.current_page >= pagination.last_page || isLoading}
                onClick={() => setCurrentPage(pagination.last_page)}
                title="শেষ পেজ"
                style={{ padding: '5px 7px', display: 'flex', alignItems: 'center' }}
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info & Reset Data Option */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          paddingTop: 2,
          fontSize: '0.8rem',
          color: 'var(--muted)',
        }}
      >
        <span>
          💡 যেকোনো অর্ডারে ক্লিক করলে বিস্তারিত — সুতার ইস্যু, লট, মেশিন অ্যালোকেশন, শিফট প্রোডাকশন ও QC রিপোর্ট দেখা যাবে।
        </span>

        {pagination.total > 0 && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('সতর্কতা: আপনি কি নিশ্চিত যে সমস্ত টেস্ট/ডেমো অর্ডার মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না!')) {
                clearAllOrders();
                loadOrders();
              }
            }}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--muted)',
              fontSize: '0.78rem',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            সমস্ত অর্ডার পরিষ্কার করুন (Reset All)
          </button>
        )}
      </div>
    </div>
  );
};
