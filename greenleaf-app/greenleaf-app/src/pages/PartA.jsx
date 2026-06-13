import React, { useState, useMemo } from 'react'
import {
  ResponsiveContainer, ComposedChart, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Line, Area, ReferenceLine, ReferenceArea, Scatter, Cell,
} from 'recharts'
import Topbar from '../components/Topbar.jsx'
import KpiCard from '../components/KpiCard.jsx'
import Panel from '../components/Panel.jsx'
import CustomTooltip from '../components/CustomTooltip.jsx'
import { palette, fmtMoney, fmtPct, fmtNum, fmtDate, fmtDateLong, expandTimeline } from '../utils/format.js'

export default function PartA({ data }) {
  const { meta, weekly, weekly_plot_rankings, peak_week, plot_timelines } = data

  const weekLabels = useMemo(() => weekly.map(w => w.week_label), [weekly])
  const peakIdx = weekLabels.indexOf(peak_week)
  const [weekIdx, setWeekIdx] = useState(peakIdx >= 0 ? peakIdx : 0)
  const currentWeek = weekLabels[weekIdx]
  const weekRow = weekly[weekIdx]

  const ranking = weekly_plot_rankings[currentWeek] || []
  const [selectedPlot, setSelectedPlot] = useState(ranking[0]?.plot_id || 'P0001')

  // Re-select top plot when changing week
  React.useEffect(() => {
    if (ranking.length && !ranking.find(r => r.plot_id === selectedPlot)) {
      setSelectedPlot(ranking[0].plot_id)
    }
  }, [currentWeek])

  const tl = plot_timelines[selectedPlot]
  const tlData = useMemo(() => expandTimeline(tl), [tl])
  const selectedPlotMeta = useMemo(() =>
    ranking.find(r => r.plot_id === selectedPlot) || null
  , [ranking, selectedPlot])

  // Calculate week boundary (current week range) for highlight band
  const weekStartDate = currentWeek
  const weekEndDate = useMemo(() => {
    if (!currentWeek) return null
    const d = new Date(currentWeek + 'T00:00:00')
    d.setDate(d.getDate() + 6)
    return d.toISOString().slice(0, 10)
  }, [currentWeek])

  // Season-wide HS-events strip chart data
  const seasonStrip = useMemo(() => weekly.map((w, i) => ({
    week: w.week_label,
    hs: w.high_stress_events,
    isCurrent: i === weekIdx,
    isPeak: w.week_label === peak_week,
  })), [weekly, weekIdx, peak_week])

  return (
    <>
      <Topbar
        eyebrow="PART A · WEEKLY TRIAGE"
        title="Where to act first this morning"
        subtitle="A weekly stress and alert triage view: pick a week, scan the top plots by risk, and drill into the daily picture for the worst offender."
        meta={[
          { label: 'Peak week', value: fmtDate(peak_week) },
          { label: 'Total HS days', value: fmtNum(meta.high_stress_total) },
        ]}
      />
      <div className="page">
        {/* Week selector + KPIs */}
        <div className="week-selector">
          <div className="week-label-block">
            <div className="week-eyebrow">Week of</div>
            <div className="week-label">{fmtDateLong(currentWeek)}</div>
          </div>
          <div className="week-slider-wrap">
            <input
              type="range"
              className="week-slider"
              min={0}
              max={weekLabels.length - 1}
              value={weekIdx}
              onChange={e => setWeekIdx(parseInt(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9.5, color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
              <span>{fmtDate(weekLabels[0])}</span>
              <span>Week {weekIdx + 1} / {weekLabels.length}</span>
              <span>{fmtDate(weekLabels[weekLabels.length - 1])}</span>
            </div>
          </div>
          <button className="week-jump accent" onClick={() => setWeekIdx(peakIdx)}>
            ⚑ Jump to peak stress week
          </button>
        </div>

        <div className="kpi-row cols-4">
          <KpiCard
            variant="terracotta"
            label="High-Stress Events"
            value={fmtNum(weekRow.high_stress_events)}
            sub={`plot-days above 0.7 stress`}
          />
          <KpiCard
            label="Total Alerts"
            value={fmtNum(weekRow.total_alerts)}
            sub={`across all plots`}
          />
          <KpiCard
            label="Action Rate"
            value={fmtPct(weekRow.action_rate, 0)}
            sub={`${fmtNum(weekRow.total_actions)} actions taken`}
          />
          <KpiCard
            variant="accent"
            label="Avg Stress"
            value={weekRow.avg_stress.toFixed(3)}
            sub={`avg delay ${weekRow.avg_delay?.toFixed(2) ?? '—'}d`}
          />
        </div>

        <div className="grid-1-2" style={{ minHeight: 0 }}>
          {/* Left: ranked plot list */}
          <Panel
            title="Worst plots this week"
            subtitle="Ranked by high-stress days, then average stress"
            tag={`top ${Math.min(ranking.length, 15)}`}
          >
            <div className="plot-list">
              {ranking.slice(0, 15).map((r, i) => (
                <button
                  key={r.plot_id}
                  className={`plot-row ${selectedPlot === r.plot_id ? 'selected' : ''}`}
                  onClick={() => setSelectedPlot(r.plot_id)}
                >
                  <div className="plot-row-main">
                    <span className="plot-row-id">#{i+1} · {r.plot_id} · {r.treatment}</span>
                    <span className="plot-row-meta">{r.crop} · {r.farm_name} · {r.greenhouse_id}</span>
                  </div>
                  <div className="plot-row-hs">
                    <span className="dot"/>
                    {r.hs_days}d
                  </div>
                  <div className="plot-row-stress">
                    {r.avg_stress.toFixed(2)}
                  </div>
                </button>
              ))}
              {ranking.length === 0 && (
                <div style={{ padding: 16, color: 'var(--ink-soft)', fontSize: 12, fontStyle: 'italic' }}>
                  No high-stress events this week.
                </div>
              )}
            </div>
          </Panel>

          {/* Right: drill-down chart */}
          <Panel
            title={`Stress timeline — ${selectedPlot}`}
            subtitle={selectedPlotMeta
              ? `${selectedPlotMeta.treatment} · ${selectedPlotMeta.crop} · ${selectedPlotMeta.farm_name} · ${selectedPlotMeta.greenhouse_id}`
              : 'Daily stress, alerts and treatment costs over the season'}
            tag="drilldown"
          >
            <div className="chart-box">
              <ResponsiveContainer>
                <ComposedChart data={tlData} margin={{ top: 6, right: 18, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={palette.accent} stopOpacity={0.30} />
                      <stop offset="100%" stopColor={palette.accent} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={palette.highlight} stopOpacity={0.40} />
                      <stop offset="100%" stopColor={palette.highlight} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke={palette.border} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={fmtDate}
                    tickLine={false}
                    axisLine={{ stroke: palette.border }}
                    stroke={palette.inkSoft}
                    minTickGap={28}
                  />
                  <YAxis
                    yAxisId="left"
                    domain={[0, 1]}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    stroke={palette.inkSoft}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    stroke={palette.inkSoft}
                    tickFormatter={v => '$' + v.toFixed(0)}
                  />
                  <ReferenceArea
                    yAxisId="left"
                    x1={weekStartDate}
                    x2={weekEndDate}
                    fill={palette.primary}
                    fillOpacity={0.06}
                    stroke={palette.primary}
                    strokeOpacity={0.25}
                    strokeDasharray="3 3"
                  />
                  <ReferenceLine
                    yAxisId="left"
                    y={0.7}
                    stroke={palette.danger}
                    strokeDasharray="4 4"
                    strokeWidth={1.2}
                    label={{ value: 'stress threshold', position: 'right', fill: palette.danger, fontSize: 10 }}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="cost"
                    stroke={palette.highlight}
                    strokeWidth={1}
                    fill="url(#costGrad)"
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="stress"
                    stroke={palette.accent}
                    strokeWidth={2}
                    fill="url(#stressGrad)"
                  />
                  <Scatter
                    yAxisId="left"
                    dataKey={d => d.alert ? d.stress : null}
                    fill={palette.danger}
                    shape="circle"
                    legendType="none"
                  />
                  <Tooltip
                    content={
                      <CustomTooltip
                        labelFormat={fmtDate}
                        rows={(p) => {
                          const d = p[0]?.payload
                          if (!d) return []
                          return [
                            { k: 'stress', v: d.stress?.toFixed(3) ?? '—', color: palette.accent },
                            { k: 'alert', v: d.alert ? 'yes' : '—', color: palette.danger },
                            { k: 'action', v: d.action ? 'yes' : '—', color: palette.primary },
                            { k: 'cost', v: '$' + d.cost.toFixed(0), color: palette.highlight },
                          ]
                        }}
                      />
                    }
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="legend-chips" style={{ paddingTop: 4 }}>
              <span className="legend-chip"><span className="sw" style={{background: palette.accent, opacity: 0.6}}/>Daily stress (0-1)</span>
              <span className="legend-chip"><span className="sw" style={{background: palette.danger, borderRadius: '50%'}}/>Alert day</span>
              <span className="legend-chip"><span className="sw" style={{background: palette.highlight}}/>Treatment $</span>
              <span className="legend-chip"><span className="sw" style={{background: palette.primary, opacity: 0.5}}/>Selected week</span>
            </div>
          </Panel>
        </div>

        {/* Season strip - high stress events per week */}
        <Panel title="Season high-stress map" subtitle="Click a bar to jump to that week" tag="season" style={{ flex: 'none', height: 120 }}>
          <div className="chart-box">
            <ResponsiveContainer>
              <BarChart data={seasonStrip} margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 9 }}
                  tickFormatter={fmtDate}
                  tickLine={false}
                  axisLine={{ stroke: palette.border }}
                  stroke={palette.inkSoft}
                  minTickGap={20}
                />
                <YAxis hide />
                <Tooltip
                  content={
                    <CustomTooltip
                      labelFormat={fmtDate}
                      rows={(p) => [
                        { k: 'high-stress evt', v: p[0].payload.hs, color: palette.accent },
                      ]}
                    />
                  }
                />
                <Bar
                  dataKey="hs"
                  radius={[2, 2, 0, 0]}
                  onClick={(_, idx) => setWeekIdx(idx)}
                  cursor="pointer"
                >
                  {seasonStrip.map((entry, i) => (
                    <Cell key={i} fill={entry.isCurrent ? palette.primary : entry.isPeak ? palette.accent : palette.accentPale} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </>
  )
}
