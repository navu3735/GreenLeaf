import React, { useMemo } from 'react'
import {
  ResponsiveContainer, ComposedChart, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Line, Area, Legend, AreaChart, PieChart, Pie, Cell,
} from 'recharts'
import Topbar from '../components/Topbar.jsx'
import KpiCard from '../components/KpiCard.jsx'
import Panel from '../components/Panel.jsx'
import CustomTooltip from '../components/CustomTooltip.jsx'
import { palette, fmtMoney, fmtPct, fmtNum, fmtDate } from '../utils/format.js'

export default function Overview({ data }) {
  const { meta, weekly, crops, farms, alert_breakdown } = data

  const weeklyChartData = useMemo(() => weekly.map(w => ({
    week: w.week_label,
    stress: w.avg_stress,
    alerts: w.total_alerts,
    hs: w.high_stress_events,
    precision: w.weekly_precision_cost,
  })), [weekly])

  const cropChartData = useMemo(() => crops.map(c => ({
    crop: c.crop,
    profit: c.avg_profit,
    yield: c.avg_yield,
    plots: c.n_plots,
  })).sort((a,b) => b.profit - a.profit), [crops])

  const farmsChartData = useMemo(() => farms.map(f => ({
    name: f.farm_name.replace('BC Harvest ', 'BC '),
    profit: f.total_profit,
    benefit: f.total_precision_benefit,
    plots: f.n_plots,
  })).sort((a,b) => b.profit - a.profit), [farms])

  const alertTopFive = useMemo(() => {
    return [...alert_breakdown].sort((a,b) => b.count - a.count).slice(0, 5)
  }, [alert_breakdown])

  return (
    <>
      <Topbar
        eyebrow="OVERVIEW · SEASON 2025"
        title="Season at a Glance"
        subtitle="Eight farms · 20 greenhouses · 120 microplots · 209 growing days · February 15 → September 12."
        meta={[
          { label: 'Action rate', value: fmtPct(meta.action_rate_on_alert, 1) },
          { label: 'Avg delay', value: meta.avg_action_delay.toFixed(2) + 'd' },
          { label: 'Avg ROI', value: fmtPct(meta.avg_roi, 1) },
        ]}
      />
      <div className="page">
        <div className="kpi-row cols-5">
          <KpiCard
            variant="accent"
            label="Season Revenue"
            value={fmtMoney(meta.total_revenue, { compact: true })}
            sub={`across ${meta.plots} microplots`}
          />
          <KpiCard
            label="Season Profit"
            value={fmtMoney(meta.total_profit, { compact: true })}
            sub={`${fmtPct(meta.avg_roi)} avg ROI`}
          />
          <KpiCard
            variant="terracotta"
            label="Precision Benefit"
            value={fmtMoney(meta.total_precision_benefit, { compact: true })}
            sub={`${fmtPct(meta.total_precision_benefit / meta.total_profit)} of profit`}
          />
          <KpiCard
            label="Alerts → Actions"
            value={`${fmtNum(meta.total_actions)}/${fmtNum(meta.total_alerts)}`}
            sub={`${fmtPct(meta.action_rate_on_alert)} response rate`}
          />
          <KpiCard
            label="High-Stress Days"
            value={fmtNum(meta.high_stress_total)}
            sub={`${meta.same_day_actions} same-day actions`}
          />
        </div>

        <div className="grid-2-1">
          <Panel
            title="Stress, alerts & precision spend over the season"
            subtitle="Weekly aggregates · stress avg (line) vs alert volume (bars) vs precision $ (area)"
            tag="trend"
          >
            <div className="chart-box">
              <ResponsiveContainer>
                <ComposedChart data={weeklyChartData} margin={{ top: 8, right: 14, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="precFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={palette.highlight} stopOpacity={0.45} />
                      <stop offset="100%" stopColor={palette.highlight} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke={palette.border} vertical={false} />
                  <XAxis dataKey="week" tickFormatter={fmtDate} stroke={palette.inkSoft}
                    tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: palette.border }} />
                  <YAxis yAxisId="left" stroke={palette.inkSoft} tick={{ fontSize: 10 }}
                    tickLine={false} axisLine={false}
                    label={{ value: 'alerts / wk', angle: -90, position: 'insideLeft', offset: 12, style: { fontSize: 10, fill: palette.inkSoft } }} />
                  <YAxis yAxisId="right" orientation="right" stroke={palette.inkSoft}
                    domain={[0, 1]} tick={{ fontSize: 10 }} tickFormatter={v => v.toFixed(1)}
                    tickLine={false} axisLine={false}
                    label={{ value: 'stress', angle: 90, position: 'insideRight', offset: 12, style: { fontSize: 10, fill: palette.inkSoft } }} />
                  <Tooltip content={
                    <CustomTooltip
                      labelFormat={fmtDate}
                      rows={(payload) => {
                        const d = payload[0]?.payload
                        return [
                          { k: 'avg stress', v: d.stress?.toFixed(3) ?? '—', color: palette.primary },
                          { k: 'alerts', v: d.alerts ?? 0, color: palette.accent },
                          { k: 'high-stress evt', v: d.hs ?? 0, color: palette.danger },
                          { k: 'precision $', v: '$' + (d.precision ?? 0).toFixed(0), color: palette.highlight },
                        ]
                      }}
                    />
                  } />
                  <Area yAxisId="left" type="monotone" dataKey="precision" stroke={palette.highlight}
                    strokeWidth={1.5} fill="url(#precFill)" />
                  <Bar yAxisId="left" dataKey="alerts" fill={palette.accent} fillOpacity={0.55} radius={[2, 2, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="stress" stroke={palette.primary}
                    strokeWidth={2.2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="legend-chips" style={{ paddingTop: 6 }}>
              <span className="legend-chip"><span className="sw" style={{background: palette.accent, opacity: 0.55}}/>Weekly alerts</span>
              <span className="legend-chip"><span className="sw" style={{background: palette.primary}}/>Avg stress (0-1)</span>
              <span className="legend-chip"><span className="sw" style={{background: palette.highlight}}/>Precision spend $</span>
            </div>
          </Panel>

          <Panel title="Alerts by type" subtitle="6,460 alerts, dominated by pest pressure" tag="mix">
            <div className="chart-box">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={alertTopFive}
                    dataKey="count"
                    nameKey="alert_type"
                    innerRadius="48%"
                    outerRadius="78%"
                    paddingAngle={2}
                    stroke={palette.bg}
                    strokeWidth={2}
                  >
                    {alertTopFive.map((entry, i) => (
                      <Cell key={i} fill={[palette.accent, palette.highlight, palette.primary, palette.primaryLight, palette.inkSoft][i]} />
                    ))}
                  </Pie>
                  <Tooltip content={
                    <CustomTooltip
                      rows={(p) => [
                        { k: 'Type', v: p[0].name },
                        { k: 'Count', v: fmtNum(p[0].value) },
                        { k: 'Action rate', v: fmtPct(p[0].payload.action_rate ?? 0) },
                      ]}
                    />
                  } />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="legend-chips" style={{ paddingTop: 4 }}>
              {alertTopFive.slice(0,3).map((a, i) => (
                <span key={i} className="legend-chip">
                  <span className="sw" style={{background: [palette.accent, palette.highlight, palette.primary][i]}}/>
                  {a.alert_type} ({fmtNum(a.count)})
                </span>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid-1-1">
          <Panel title="Profit by farm" subtitle="Eight operating sites · cumulative season profit and precision benefit" tag="farms">
            <div className="chart-box">
              <ResponsiveContainer>
                <BarChart data={farmsChartData} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={palette.border} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false}
                    axisLine={{ stroke: palette.border }} stroke={palette.inkSoft} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                    tickFormatter={v => '$' + (v/1000).toFixed(0) + 'K'} stroke={palette.inkSoft} />
                  <Tooltip content={
                    <CustomTooltip
                      rows={(p) => {
                        const d = p[0].payload
                        return [
                          { k: 'Total profit', v: fmtMoney(d.profit, { decimals: 0 }), color: palette.primary },
                          { k: 'Precision $ benefit', v: fmtMoney(d.benefit, { decimals: 0 }), color: palette.highlight },
                          { k: 'Plots', v: d.plots, color: palette.inkSoft },
                        ]
                      }}
                    />
                  } />
                  <Bar dataKey="profit" fill={palette.primary} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="benefit" fill={palette.highlight} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Crop performance" subtitle="Avg profit & yield per plot, by crop type" tag="crops">
            <div className="chart-box">
              <ResponsiveContainer>
                <ComposedChart data={cropChartData} margin={{ top: 6, right: 14, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={palette.border} vertical={false} />
                  <XAxis dataKey="crop" tick={{ fontSize: 10 }} tickLine={false}
                    axisLine={{ stroke: palette.border }} stroke={palette.inkSoft} />
                  <YAxis yAxisId="L" tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                    tickFormatter={v => '$' + v.toFixed(0)} stroke={palette.inkSoft} />
                  <YAxis yAxisId="R" orientation="right" tick={{ fontSize: 10 }} tickLine={false}
                    axisLine={false} stroke={palette.inkSoft} />
                  <Tooltip content={
                    <CustomTooltip
                      rows={(p) => {
                        const d = p[0].payload
                        return [
                          { k: 'Avg profit / plot', v: fmtMoney(d.profit, { decimals: 0 }), color: palette.primary },
                          { k: 'Avg yield kg/m²', v: d.yield.toFixed(2), color: palette.accent },
                          { k: 'Plots', v: d.plots, color: palette.inkSoft },
                        ]
                      }}
                    />
                  } />
                  <Bar yAxisId="L" dataKey="profit" fill={palette.primary} radius={[3,3,0,0]} barSize={26} />
                  <Line yAxisId="R" type="monotone" dataKey="yield" stroke={palette.accent} strokeWidth={2.5}
                    dot={{ r: 4, fill: palette.accent, stroke: palette.bg, strokeWidth: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="legend-chips" style={{ paddingTop: 4 }}>
              <span className="legend-chip"><span className="sw" style={{background: palette.primary}}/>Avg profit / plot ($)</span>
              <span className="legend-chip"><span className="sw" style={{background: palette.accent}}/>Avg yield (kg/m²)</span>
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}
