import React from 'react'

export default function Topbar({ eyebrow, title, subtitle, meta }) {
  return (
    <div className="topbar">
      <div className="topbar-title-block">
        <div className="topbar-eyebrow">{eyebrow}</div>
        <h1 className="topbar-title">{title}</h1>
        {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
      </div>
      {meta && (
        <div className="topbar-meta">
          {meta.map((m, i) => (
            <div className="topbar-meta-item" key={i}>
              <span>{m.label}</span>
              <span className="topbar-meta-value">{m.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
