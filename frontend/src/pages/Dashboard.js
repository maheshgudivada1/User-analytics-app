import React, { useState, useEffect } from 'react';
import {
  Users, MousePointerClick, Eye, Globe,
  TrendingUp, ArrowUpRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { fetchSummary } from '../api';

const CHART_COLORS = ['#6c63ff', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <div className={`stat-card animate-in stagger-${delay}`}>
      <div className="stat-icon" style={{ background: `${color}18`, color }}>
        <Icon size={20} />
      </div>
      <div className="stat-value">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      padding: '8px 14px',
      fontSize: 12,
    }}>
      <div style={{ color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSummary()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <div className="page-header">
          <h1>Overview</h1>
          <p>Real-time analytics dashboard</p>
        </div>
        <div className="loading-state"><div className="spinner" /><span>Loading analytics...</span></div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="page-header">
          <h1>Overview</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon"><Globe size={24} /></div>
          <p>Could not connect to the API. Make sure the Flask backend is running on port 5000.</p>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{error}</p>
        </div>
      </>
    );
  }

  const { total_sessions, total_events, total_clicks, total_pageviews, unique_pages, hourly_activity, top_pages } = data;

  const hourlyData = (hourly_activity || [])
    .sort((a, b) => a._id.localeCompare(b._id))
    .map(h => ({
      hour: h._id.slice(-2) + ':00',
      events: h.count,
    }));

  const topPagesData = (top_pages || []).map(p => ({
    name: p._id.replace(/https?:\/\/[^/]+/, '').replace(/\/$/, '') || '/',
    fullUrl: p._id,
    events: p.events,
    clicks: p.clicks,
    views: p.views,
  }));

  const pieData = [
    { name: 'Page Views', value: total_pageviews },
    { name: 'Clicks', value: total_clicks },
  ];

  return (
    <>
      <div className="page-header">
        <h1>Overview</h1>
        <p>Real-time user behavior analytics</p>
      </div>

      <div className="page-body">
        <div className="stats-grid">
          <StatCard icon={Users} label="Total Sessions" value={total_sessions} color="var(--accent)" delay={1} />
          <StatCard icon={TrendingUp} label="Total Events" value={total_events} color="var(--green)" delay={2} />
          <StatCard icon={MousePointerClick} label="Clicks" value={total_clicks} color="var(--amber)" delay={3} />
          <StatCard icon={Eye} label="Page Views" value={total_pageviews} color="var(--blue)" delay={4} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, marginBottom: 24 }}>
          {/* Activity chart */}
          <div className="card animate-in" style={{ animationDelay: '0.2s' }}>
            <div className="card-header">
              <h3>Event Activity</h3>
              <span className="badge badge-purple">{hourlyData.length} data points</span>
            </div>
            <div className="card-body" style={{ height: 280 }}>
              {hourlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyData}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="hour" stroke="#55556a" fontSize={11} tickLine={false} />
                    <YAxis stroke="#55556a" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="events"
                      stroke="#6c63ff"
                      strokeWidth={2}
                      fill="url(#areaGrad)"
                      dot={false}
                      activeDot={{ r: 5, fill: '#6c63ff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state" style={{ padding: 20 }}>No activity data yet</div>
              )}
            </div>
          </div>

          {/* Pie chart */}
          <div className="card animate-in" style={{ animationDelay: '0.25s' }}>
            <div className="card-header">
              <h3>Event Breakdown</h3>
            </div>
            <div className="card-body" style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pieData.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: CHART_COLORS[i] }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top pages */}
        <div className="card animate-in" style={{ animationDelay: '0.3s' }}>
          <div className="card-header">
            <h3>Top Pages</h3>
            <span className="badge badge-green">{unique_pages} unique pages</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {topPagesData.length > 0 ? (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Page</th>
                      <th>Events</th>
                      <th>Views</th>
                      <th>Clicks</th>
                      <th>Distribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPagesData.map((page, i) => (
                      <tr key={i}>
                        <td>
                          <span className="mono" style={{ color: 'var(--text-primary)' }}>
                            {page.name}
                          </span>
                        </td>
                        <td><span className="badge badge-purple">{page.events}</span></td>
                        <td><span className="badge badge-blue">{page.views}</span></td>
                        <td><span className="badge badge-amber">{page.clicks}</span></td>
                        <td style={{ minWidth: 140 }}>
                          <div style={{
                            height: 6,
                            background: 'var(--border)',
                            borderRadius: 3,
                            overflow: 'hidden',
                            display: 'flex',
                          }}>
                            <div
                              style={{
                                width: `${(page.views / page.events) * 100}%`,
                                background: 'var(--blue)',
                                borderRadius: '3px 0 0 3px',
                              }}
                            />
                            <div
                              style={{
                                width: `${(page.clicks / page.events) * 100}%`,
                                background: 'var(--amber)',
                                borderRadius: '0 3px 3px 0',
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">No page data yet</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
