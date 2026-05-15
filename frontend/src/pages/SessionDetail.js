import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Eye, MousePointerClick, Clock, Globe,
  Monitor, ExternalLink, Users
} from 'lucide-react';
import { fetchSessionEvents } from '../api';

export default function SessionDetail() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchSessionEvents(sessionId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId]);

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-IN', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const getDuration = (first, last) => {
    if (!first || !last) return '—';
    const diff = (new Date(last) - new Date(first)) / 1000;
    if (diff < 60) return `${Math.round(diff)}s`;
    return `${Math.floor(diff / 60)}m ${Math.round(diff % 60)}s`;
  };

  const getDeviceType = (ua) => {
    if (!ua) return 'Unknown';
    if (/iPhone|Android.*Mobile/i.test(ua)) return '📱 Mobile';
    if (/iPad|Android(?!.*Mobile)/i.test(ua)) return '📱 Tablet';
    return '🖥️ Desktop';
  };

  const getBrowser = (ua) => {
    if (!ua) return 'Unknown';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Firefox')) return 'Firefox';
    return 'Other';
  };

  if (loading) {
    return (
      <>
        <div className="page-header">
          <h1>Session Detail</h1>
        </div>
        <div className="loading-state"><div className="spinner" /></div>
      </>
    );
  }

  if (!data || !data.session) {
    return (
      <>
        <div className="page-header">
          <h1>Session Not Found</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon"><Users size={24} /></div>
          <p>This session doesn't exist or has been deleted.</p>
          <button className="btn btn-primary" onClick={() => navigate('/sessions')}>Back to Sessions</button>
        </div>
      </>
    );
  }

  const { session, events } = data;
  const filteredEvents = filter === 'all' ? events : events.filter(e => e.event_type === filter);

  const viewCount = events.filter(e => e.event_type === 'page_view').length;
  const clickCount = events.filter(e => e.event_type === 'click').length;

  return (
    <>
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/sessions')}>
          <ArrowLeft size={16} />
          Back to Sessions
        </button>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          Session Detail
          <span className="mono badge badge-purple" style={{ fontSize: 13 }}>
            {sessionId.slice(0, 20)}…
          </span>
        </h1>
        <p>User journey — {formatDate(session.first_seen)}</p>
      </div>

      <div className="page-body">
        {/* Session summary cards */}
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card animate-in stagger-1">
            <div className="stat-icon" style={{ background: 'var(--accent-muted)', color: 'var(--accent)' }}>
              <Eye size={20} />
            </div>
            <div className="stat-value">{viewCount}</div>
            <div className="stat-label">Page Views</div>
          </div>
          <div className="stat-card animate-in stagger-2">
            <div className="stat-icon" style={{ background: 'var(--amber-muted)', color: 'var(--amber)' }}>
              <MousePointerClick size={20} />
            </div>
            <div className="stat-value">{clickCount}</div>
            <div className="stat-label">Clicks</div>
          </div>
          <div className="stat-card animate-in stagger-3">
            <div className="stat-icon" style={{ background: 'var(--green-muted)', color: 'var(--green)' }}>
              <Globe size={20} />
            </div>
            <div className="stat-value">{session.pages_visited?.length || 0}</div>
            <div className="stat-label">Pages Visited</div>
          </div>
          <div className="stat-card animate-in stagger-4">
            <div className="stat-icon" style={{ background: 'var(--blue-muted)', color: 'var(--blue)' }}>
              <Clock size={20} />
            </div>
            <div className="stat-value" style={{ fontSize: 22 }}>{getDuration(session.first_seen, session.last_seen)}</div>
            <div className="stat-label">Duration</div>
          </div>
        </div>

        {/* Session info */}
        <div className="card animate-in" style={{ marginBottom: 24, animationDelay: '0.2s' }}>
          <div className="card-header">
            <h3>Session Info</h3>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              {getDeviceType(session.user_agent)} · {getBrowser(session.user_agent)}
            </span>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, fontSize: 13 }}>
              <div>
                <div style={{ color: 'var(--text-tertiary)', marginBottom: 4, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Session ID</div>
                <div className="mono" style={{ wordBreak: 'break-all' }}>{session.session_id}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-tertiary)', marginBottom: 4, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>First Seen</div>
                <div>{new Date(session.first_seen).toLocaleString('en-IN')}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-tertiary)', marginBottom: 4, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Last Active</div>
                <div>{new Date(session.last_seen).toLocaleString('en-IN')}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-tertiary)', marginBottom: 4, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Pages Visited</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {(session.pages_visited || []).map((p, i) => (
                    <span key={i} className="badge badge-blue mono" style={{ fontSize: 11 }}>
                      {p.replace(/https?:\/\/[^/]+/, '').replace(/\/$/, '') || '/'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Events timeline */}
        <div className="card animate-in" style={{ animationDelay: '0.3s' }}>
          <div className="card-header">
            <h3>User Journey ({filteredEvents.length} events)</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {['all', 'page_view', 'click'].map(f => (
                <button
                  key={f}
                  className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : f === 'page_view' ? 'Views' : 'Clicks'}
                </button>
              ))}
            </div>
          </div>
          <div className="card-body">
            <div className="timeline">
              {filteredEvents.map((event, i) => (
                <div key={event._id} className="timeline-item">
                  <div className={`timeline-dot ${event.event_type}`} />
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span
                        className="timeline-type"
                        style={{
                          color: event.event_type === 'page_view' ? 'var(--blue)' : 'var(--green)',
                        }}
                      >
                        {event.event_type === 'page_view' ? '👁️ Page View' : '🖱️ Click'}
                      </span>
                      <span className="timeline-time">{formatTime(event.timestamp)}</span>
                    </div>
                    <div className="timeline-details">
                      <div className="timeline-detail">
                        <span className="label">URL:</span>
                        <span className="mono" style={{ color: 'var(--text-primary)', fontSize: 12 }}>
                          {event.page_url.replace(/https?:\/\/[^/]+/, '') || '/'}
                        </span>
                      </div>
                      {event.event_type === 'click' && event.metadata && (
                        <>
                          <div className="timeline-detail">
                            <span className="label">Position:</span>
                            <span className="mono">
                              ({event.metadata.x}, {event.metadata.y})
                            </span>
                          </div>
                          {event.metadata.element_tag && (
                            <div className="timeline-detail">
                              <span className="label">Element:</span>
                              <span className="badge badge-green" style={{ fontSize: 11 }}>
                                &lt;{event.metadata.element_tag}&gt;
                              </span>
                              {event.metadata.element_text && (
                                <span style={{ fontSize: 12 }}>
                                  "{event.metadata.element_text.slice(0, 30)}"
                                </span>
                              )}
                            </div>
                          )}
                          {event.metadata.viewport_width > 0 && (
                            <div className="timeline-detail">
                              <span className="label">Viewport:</span>
                              <span className="mono">
                                {event.metadata.viewport_width}×{event.metadata.viewport_height}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                      {event.event_type === 'page_view' && event.metadata && (
                        <>
                          {event.metadata.referrer && event.metadata.referrer !== 'direct' && (
                            <div className="timeline-detail">
                              <span className="label">Referrer:</span>
                              <span className="mono" style={{ fontSize: 11 }}>
                                {event.metadata.referrer}
                              </span>
                            </div>
                          )}
                          {event.metadata.screen_width > 0 && (
                            <div className="timeline-detail">
                              <span className="label">Screen:</span>
                              <span className="mono">
                                {event.metadata.screen_width}×{event.metadata.screen_height}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
