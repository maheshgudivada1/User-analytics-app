import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, ChevronLeft, ChevronRight,
  ArrowUpDown, Clock, MousePointerClick, Eye,
  ExternalLink, Trash2
} from 'lucide-react';
import { fetchSessions, deleteSession } from '../api';

export default function Sessions() {
  const navigate = useNavigate();
  const [data, setData] = useState({ sessions: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('last_seen');
  const [sortOrder, setSortOrder] = useState(-1);

  const load = useCallback(() => {
    setLoading(true);
    fetchSessions({ page, limit: 15, search, sort: sortBy, order: sortOrder })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, sortBy, sortOrder]);

  useEffect(() => { load(); }, [load]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(o => o === -1 ? 1 : -1);
    } else {
      setSortBy(field);
      setSortOrder(-1);
    }
    setPage(1);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleDelete = async (e, sid) => {
    e.stopPropagation();
    if (!window.confirm(`Delete session ${sid}?`)) return;
    await deleteSession(sid);
    load();
  };

  const formatTime = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString('en-IN', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getDuration = (first, last) => {
    if (!first || !last) return '—';
    const diff = (new Date(last) - new Date(first)) / 1000;
    if (diff < 60) return `${Math.round(diff)}s`;
    if (diff < 3600) return `${Math.round(diff / 60)}m`;
    return `${Math.round(diff / 3600)}h ${Math.round((diff % 3600) / 60)}m`;
  };

  const getDeviceType = (ua) => {
    if (!ua) return 'Unknown';
    if (/iPhone|Android.*Mobile/i.test(ua)) return 'Mobile';
    if (/iPad|Android(?!.*Mobile)/i.test(ua)) return 'Tablet';
    return 'Desktop';
  };

  const SortIcon = ({ field }) => (
    <ArrowUpDown
      size={12}
      style={{
        opacity: sortBy === field ? 1 : 0.3,
        transform: sortBy === field && sortOrder === 1 ? 'scaleY(-1)' : 'none',
      }}
    />
  );

  return (
    <>
      <div className="page-header">
        <h1>Sessions</h1>
        <p>All tracked user sessions with event details</p>
      </div>

      <div className="page-body">
        {/* Search bar */}
        <div style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              className="input"
              placeholder="Search by session ID..."
              value={search}
              onChange={handleSearch}
              style={{ paddingLeft: 36 }}
            />
          </div>
          <span className="badge badge-purple" style={{ fontSize: 13, padding: '6px 14px' }}>
            {data.total} sessions
          </span>
        </div>

        {/* Table */}
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <div className="loading-state"><div className="spinner" /></div>
            ) : data.sessions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Users size={24} /></div>
                <p>{search ? 'No sessions match your search' : 'No sessions recorded yet'}</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('session_id')}>
                        Session ID <SortIcon field="session_id" />
                      </th>
                      <th onClick={() => handleSort('total_events')}>
                        Events <SortIcon field="total_events" />
                      </th>
                      <th>Views</th>
                      <th>Clicks</th>
                      <th>Device</th>
                      <th>Pages</th>
                      <th>Duration</th>
                      <th onClick={() => handleSort('last_seen')}>
                        Last Active <SortIcon field="last_seen" />
                      </th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sessions.map((s, i) => (
                      <tr
                        key={s.session_id}
                        onClick={() => navigate(`/sessions/${s.session_id}`)}
                        className={`animate-in stagger-${Math.min(i + 1, 4)}`}
                      >
                        <td>
                          <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {s.session_id.slice(0, 18)}…
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-purple">{s.total_events}</span>
                        </td>
                        <td>
                          <span className="badge badge-blue">
                            <Eye size={10} /> {s.event_counts?.page_view || 0}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-amber">
                            <MousePointerClick size={10} /> {s.event_counts?.click || 0}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                          {getDeviceType(s.user_agent)}
                        </td>
                        <td>
                          <span className="badge badge-green">
                            {s.pages_visited?.length || 0}
                          </span>
                        </td>
                        <td style={{ fontSize: 12 }}>
                          <Clock size={11} style={{ marginRight: 4, opacity: 0.5 }} />
                          {getDuration(s.first_seen, s.last_seen)}
                        </td>
                        <td style={{ fontSize: 12 }}>
                          {formatTime(s.last_seen)}
                        </td>
                        <td>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={(e) => handleDelete(e, s.session_id)}
                            title="Delete session"
                            style={{ padding: 4 }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="pagination" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(data.pages, 7) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    className={page === p ? 'active' : ''}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= data.pages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
