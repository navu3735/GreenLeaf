import React from 'react'

export default function KpiCard({ label, value, unit, sub, variant }) {
  return (
    <div className={`kpi-card ${variant || ''}`}>
      <div className="kpi-eyebrow">{label}</div>
      <div className="kpi-value">
        {value}
        {unit && <span className="unit">{unit}</span>}
      </div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  )
}
