import React from 'react'

export default function CustomTooltip({ active, payload, label, labelFormat, rows }) {
  if (!active || !payload || !payload.length) return null
  const lbl = labelFormat ? labelFormat(label) : label
  const items = rows
    ? rows(payload)
    : payload.map(p => ({ k: p.name, v: typeof p.value === 'number' ? p.value.toLocaleString() : p.value, color: p.color }))

  return (
    <div className="custom-tooltip">
      {lbl && <div className="tt-label">{lbl}</div>}
      {items.map((r, i) => (
        <div className="tt-row" key={i}>
          <span className="k" style={r.color ? { color: r.color } : null}>{r.k}</span>
          <span className="v">{r.v}</span>
        </div>
      ))}
    </div>
  )
}
