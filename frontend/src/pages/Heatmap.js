import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchHeatmapData, fetchPages } from '../api';
import { MousePointerClick, Crosshair, Layers, ChevronDown, AlertCircle, RefreshCw, ZoomIn, ZoomOut, Grid3X3 } from 'lucide-react';

/* ─── colour helpers ─── */
function heatColor(intensity) {
  // 0 = cool blue → 1 = hot red
  if (intensity < 0.25) return `rgba(59,130,246,${0.45 + intensity * 2})`;
  if (intensity < 0.5)  return `rgba(234,179,8,${0.5 + intensity})`;
  if (intensity < 0.75) return `rgba(249,115,22,${0.55 + intensity * 0.6})`;
  return `rgba(239,68,68,${0.6 + intensity * 0.4})`;
}

function heatGlow(intensity) {
  if (intensity < 0.25) return '0 0 8px rgba(59,130,246,0.5)';
  if (intensity < 0.5)  return '0 0 12px rgba(234,179,8,0.5)';
  if (intensity < 0.75) return '0 0 14px rgba(249,115,22,0.5)';
  return '0 0 18px rgba(239,68,68,0.7)';
}

/* ─── grid density helper ─── */
function buildDensityGrid(clicks, cols, rows, containerW, containerH) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  const cellW = containerW / cols;
  const cellH = containerH / rows;

  clicks.forEach(c => {
    const nx = c.normalizedX ?? 0;
    const ny = c.normalizedY ?? 0;
    const col = Math.min(Math.floor(nx * cols), cols - 1);
    const row = Math.min(Math.floor(ny * rows), rows - 1);
    if (col >= 0 && row >= 0) grid[row][col]++;
  });

  let max = 0;
  grid.forEach(r => r.forEach(v => { if (v > max) max = v; }));

  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] > 0) {
        cells.push({
          x: c * cellW,
          y: r * cellH,
          w: cellW,
          h: cellH,
          count: grid[r][c],
          intensity: max > 0 ? grid[r][c] / max : 0
        });
      }
    }
  }
  return cells;
}

export default function Heatmap() {
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [clicks, setClicks] = useState([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState('dots'); // dots | grid
  const [zoom, setZoom] = useState(1);
  const [tooltip, setTooltip] = useState(null);

  const containerRef = useRef(null);
  const CANVAS_W = 1200;
  const CANVAS_H = 800;

  /* fetch page list */
  useEffect(() => {
    fetchPages()
      .then(d => {
        const p = d.pages || [];
        setPages(p);
        if (p.length > 0 && !selectedPage) setSelectedPage(p[0]);
      })
      .catch(() => setError('Failed to load pages'));
  }, []); // eslint-disable-line

  /* fetch click data for selected page */
  const loadClicks = useCallback(() => {
    if (!selectedPage) return;
    setLoading(true);
    setError(null);
    fetchHeatmapData(selectedPage)
      .then(d => {
        const raw = d.clicks || [];
        // normalise coordinates by viewport width
        const processed = raw.map(c => {
          const vw = c.metadata?.viewport_width || 1440;
          const vh = c.metadata?.viewport_height || 900;
          return {
            ...c,
            normalizedX: Math.min((c.metadata?.x || 0) / vw, 1),
            normalizedY: Math.min((c.metadata?.y || 0) / vh, 1),
            rawX: c.metadata?.x || 0,
            rawY: c.metadata?.y || 0,
            element: c.metadata?.element_tag || '?',
            text: c.metadata?.element_text || '',
            viewportW: vw,
            viewportH: vh,
          };
        });
        setClicks(processed);
        setTotalClicks(d.total_clicks || processed.length);
      })
      .catch(() => setError('Failed to load heatmap data'))
      .finally(() => setLoading(false));
  }, [selectedPage]);

  useEffect(() => { loadClicks(); }, [loadClicks]);

  /* density grid cells */
  const gridCells = viewMode === 'grid'
    ? buildDensityGrid(clicks, 24, 16, CANVAS_W, CANVAS_H)
    : [];

  /* compute intensity for dots (cluster proximity) */
  const dotsWithIntensity = clicks.map((c, i) => {
    let nearby = 0;
    clicks.forEach((o, j) => {
      if (i === j) return;
      const dx = (c.normalizedX - o.normalizedX) * CANVAS_W;
      const dy = (c.normalizedY - o.normalizedY) * CANVAS_H;
      if (Math.sqrt(dx * dx + dy * dy) < 60) nearby++;
    });
    return { ...c, intensity: Math.min(nearby / Math.max(clicks.length * 0.1, 1), 1) };
  });

  /* unique sessions */
  const uniqueSessions = new Set(clicks.map(c => c.session_id)).size;

  /* hottest zone */
  const hotZone = gridCells.length > 0
    ? gridCells.reduce((a, b) => b.count > a.count ? b : a, gridCells[0])
    : null;

  return (
    <div className="page-content">
      {/* header */}
      <div className="page-header">
        <div>
          <h1>Click Heatmap</h1>
          <p className="page-subtitle">Visualise where users click on your pages</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={() => loadClicks()} title="Reload">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* stat cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Clicks</div>
          <div className="stat-value">{totalClicks}</div>
          <MousePointerClick size={18} style={{ opacity: 0.45, marginTop: 4 }} />
        </div>
        <div className="stat-card">
          <div className="stat-label">Unique Sessions</div>
          <div className="stat-value">{uniqueSessions}</div>
          <Layers size={18} style={{ opacity: 0.45, marginTop: 4 }} />
        </div>
        <div className="stat-card">
          <div className="stat-label">Available Pages</div>
          <div className="stat-value">{pages.length}</div>
          <Grid3X3 size={18} style={{ opacity: 0.45, marginTop: 4 }} />
        </div>
        <div className="stat-card">
          <div className="stat-label">Hottest Zone</div>
          <div className="stat-value" style={{ fontSize: 18 }}>
            {hotZone ? `${hotZone.count} clicks` : '—'}
          </div>
          <Crosshair size={18} style={{ opacity: 0.45, marginTop: 4 }} />
        </div>
      </div>

      {/* controls bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          {/* page selector */}
          <div style={{ position: 'relative', minWidth: 260, flex: 1 }}>
            <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.55, marginBottom: 4, display: 'block' }}>
              Page URL
            </label>
            <button
              className="btn btn-secondary"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, padding: '10px 14px' }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedPage || 'Select a page…'}
              </span>
              <ChevronDown size={14} style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, marginLeft: 8 }} />
            </button>
            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8,
                marginTop: 4, maxHeight: 240, overflowY: 'auto', boxShadow: '0 12px 32px rgba(0,0,0,0.35)'
              }}>
                {pages.map(p => (
                  <button
                    key={p}
                    onClick={() => { setSelectedPage(p); setDropdownOpen(false); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px',
                      background: p === selectedPage ? 'var(--accent-muted)' : 'transparent',
                      border: 'none', color: 'var(--text-primary)', cursor: 'pointer',
                      fontFamily: 'var(--font-mono)', fontSize: 12, transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => e.target.style.background = 'var(--hover-bg)'}
                    onMouseLeave={e => e.target.style.background = p === selectedPage ? 'var(--accent-muted)' : 'transparent'}
                  >
                    {p}
                  </button>
                ))}
                {pages.length === 0 && (
                  <div style={{ padding: '14px', opacity: 0.5, fontSize: 13 }}>No pages with click data</div>
                )}
              </div>
            )}
          </div>

          {/* view toggles */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
            <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.55, marginRight: 6, alignSelf: 'center' }}>
              View
            </label>
            <button
              className={`btn ${viewMode === 'dots' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('dots')}
              style={{ fontSize: 12, padding: '8px 14px' }}
            >
              Dots
            </button>
            <button
              className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('grid')}
              style={{ fontSize: 12, padding: '8px 14px' }}
            >
              Density
            </button>

            <div style={{ width: 1, height: 28, background: 'var(--border)', margin: '0 6px' }} />

            <button className="btn btn-secondary" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} style={{ padding: '8px 10px' }}>
              <ZoomOut size={14} />
            </button>
            <span style={{ fontSize: 12, opacity: 0.6, minWidth: 36, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
            <button className="btn btn-secondary" onClick={() => setZoom(z => Math.min(2, z + 0.25))} style={{ padding: '8px 10px' }}>
              <ZoomIn size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* error / empty state */}
      {error && (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--accent)' }}>
          <AlertCircle size={20} style={{ marginBottom: 8 }} />
          <p>{error}</p>
        </div>
      )}

      {/* heatmap canvas */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            {selectedPage ? `Heatmap — ${selectedPage}` : 'Select a page to view heatmap'}
          </span>
          <span style={{ fontSize: 11, opacity: 0.5 }}>
            {clicks.length} click{clicks.length !== 1 ? 's' : ''} captured
          </span>
        </div>

        <div
          ref={containerRef}
          className="heatmap-container"
          style={{
            position: 'relative',
            width: '100%',
            paddingBottom: `${(CANVAS_H / CANVAS_W) * 100}%`,
            overflow: 'auto',
            cursor: 'crosshair',
          }}
        >
          {/* inner scaled canvas */}
          <div style={{
            position: 'absolute', inset: 0,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            width: `${100 / zoom}%`,
            height: `${100 / zoom}%`,
          }}>
            {loading && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.4)', zIndex: 10, backdropFilter: 'blur(3px)'
              }}>
                <div className="loading-spinner" />
              </div>
            )}

            {!loading && clicks.length === 0 && selectedPage && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                <div style={{ textAlign: 'center' }}>
                  <MousePointerClick size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
                  <p style={{ fontSize: 14 }}>No click data for this page</p>
                </div>
              </div>
            )}

            {/* grid lines overlay */}
            {viewMode === 'grid' && (
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.08 }}>
                {Array.from({ length: 24 }, (_, i) => (
                  <line key={`v${i}`} x1={`${(i / 24) * 100}%`} y1="0" x2={`${(i / 24) * 100}%`} y2="100%" stroke="var(--text-primary)" strokeWidth="0.5" />
                ))}
                {Array.from({ length: 16 }, (_, i) => (
                  <line key={`h${i}`} x1="0" y1={`${(i / 16) * 100}%`} x2="100%" y2={`${(i / 16) * 100}%`} stroke="var(--text-primary)" strokeWidth="0.5" />
                ))}
              </svg>
            )}

            {/* DOTS mode */}
            {viewMode === 'dots' && dotsWithIntensity.map((c, i) => (
              <div
                key={i}
                onMouseEnter={() => setTooltip({ ...c, idx: i })}
                onMouseLeave={() => setTooltip(null)}
                style={{
                  position: 'absolute',
                  left: `${c.normalizedX * 100}%`,
                  top: `${c.normalizedY * 100}%`,
                  width: 14 + c.intensity * 10,
                  height: 14 + c.intensity * 10,
                  borderRadius: '50%',
                  background: heatColor(c.intensity),
                  boxShadow: heatGlow(c.intensity),
                  transform: 'translate(-50%, -50%)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  zIndex: Math.round(c.intensity * 10) + 1,
                  border: tooltip?.idx === i ? '2px solid #fff' : '1.5px solid rgba(255,255,255,0.15)',
                }}
              />
            ))}

            {/* GRID / density mode */}
            {viewMode === 'grid' && gridCells.map((cell, i) => (
              <div
                key={i}
                onMouseEnter={() => setTooltip({ gridCell: true, count: cell.count, intensity: cell.intensity, idx: i })}
                onMouseLeave={() => setTooltip(null)}
                style={{
                  position: 'absolute',
                  left: `${(cell.x / CANVAS_W) * 100}%`,
                  top: `${(cell.y / CANVAS_H) * 100}%`,
                  width: `${(cell.w / CANVAS_W) * 100}%`,
                  height: `${(cell.h / CANVAS_H) * 100}%`,
                  background: heatColor(cell.intensity),
                  opacity: 0.35 + cell.intensity * 0.55,
                  transition: 'opacity 0.2s',
                  cursor: 'pointer',
                  border: tooltip?.idx === i && tooltip?.gridCell ? '1px solid rgba(255,255,255,0.4)' : 'none',
                }}
              />
            ))}

            {/* tooltip */}
            {tooltip && (
              <div style={{
                position: 'fixed',
                top: 80,
                right: 24,
                zIndex: 100,
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '12px 16px',
                fontSize: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                minWidth: 170,
                pointerEvents: 'none',
              }}>
                {tooltip.gridCell ? (
                  <>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>Zone Density</div>
                    <div><span style={{ opacity: 0.55 }}>Clicks:</span> {tooltip.count}</div>
                    <div><span style={{ opacity: 0.55 }}>Intensity:</span> {Math.round(tooltip.intensity * 100)}%</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>Click Detail</div>
                    <div><span style={{ opacity: 0.55 }}>Position:</span> {tooltip.rawX}, {tooltip.rawY}</div>
                    <div><span style={{ opacity: 0.55 }}>Element:</span> &lt;{tooltip.element}&gt;</div>
                    {tooltip.text && <div><span style={{ opacity: 0.55 }}>Text:</span> {tooltip.text.slice(0, 40)}</div>}
                    <div><span style={{ opacity: 0.55 }}>Viewport:</span> {tooltip.viewportW}×{tooltip.viewportH}</div>
                    <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.4 }}>
                      Session {tooltip.session_id?.slice(0, 12)}…
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* colour legend */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, opacity: 0.5 }}>Intensity</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, opacity: 0.4 }}>Low</span>
            <div style={{ display: 'flex', gap: 2 }}>
              {[0.1, 0.3, 0.5, 0.7, 0.9].map(v => (
                <div key={v} style={{ width: 24, height: 10, borderRadius: 3, background: heatColor(v) }} />
              ))}
            </div>
            <span style={{ fontSize: 10, opacity: 0.4 }}>High</span>
          </div>
          <span style={{ fontSize: 10, opacity: 0.35, marginLeft: 'auto' }}>
            Coordinates normalised by viewport dimensions
          </span>
        </div>
      </div>
    </div>
  );
}
