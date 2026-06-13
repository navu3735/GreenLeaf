import React from 'react'

export default function Panel({ title, subtitle, tag, children, style, className }) {
  return (
    <div className={`panel ${className || ''}`} style={style}>
      <div className="panel-header">
        <div>
          <div className="panel-title">{title}</div>
          {subtitle && <div className="panel-subtitle">{subtitle}</div>}
        </div>
        {tag && <div className="panel-tag">{tag}</div>}
      </div>
      <div className="panel-body">{children}</div>
    </div>
  )
}
