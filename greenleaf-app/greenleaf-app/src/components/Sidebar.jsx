import React from 'react'

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', meta: 'season', icon: 'M3 12L12 3l9 9M5 10v10h14V10' },
  { id: 'partA', label: 'Weekly Triage', meta: 'Part A', icon: 'M3 5h18M3 12h12M3 19h18' },
  { id: 'partB', label: 'Precision ROI', meta: 'Part B', icon: 'M3 3v18h18M7 14l4-4 4 4 5-5' },
  { id: 'partC', label: 'Treatment Audit', meta: 'Part C', icon: 'M4 4h16v6H4zM4 14h16v6H4z' },
]

export default function Sidebar({ active, onChange, meta }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-mark">
          <span className="mark-letter">G</span>
          <span className="mark-name">GreenLeaf</span>
        </div>
        <div className="sidebar-tag">Precision · CEA · 2025</div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Dashboards</div>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`nav-item ${active === item.id ? 'active' : ''}`}
            onClick={() => onChange(item.id)}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d={item.icon} />
            </svg>
            <span className="nav-label">{item.label}</span>
            <span className="nav-meta">{item.meta}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div><strong>{meta.farms}</strong> farms · <strong>{meta.greenhouses}</strong> GH · <strong>{meta.plots}</strong> plots</div>
        <div style={{ marginTop: 4 }}>{meta.date_min} → {meta.date_max}</div>
        <div style={{ marginTop: 8, opacity: 0.55 }}>RBC × BCCAI × SFU Beedie</div>
      </div>
    </aside>
  )
}
