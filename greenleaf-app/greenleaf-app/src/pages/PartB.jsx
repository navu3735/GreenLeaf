import React, { useMemo } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ComposedChart, Line, ScatterChart, Scatter, ZAxis, Cell, ReferenceLine,
} from 'recharts'
import Topbar from '../components/Topbar.jsx'
import Panel from '../components/Panel.jsx'
import CustomTooltip from '../components/CustomTooltip.jsx'
import { palette, treatmentColors, fmtMoney, fmtPct, fmtNum, linreg } from '../utils/format.js'

export default function PartB({ data }) {
  const { meta, plots, precision_buckets } = data

  // Bucket bars: profit & high-stress days per precision tier
  const bucketChartData = useMemo(() => precision_buckets.map(b => ({
    bucket: b.prec_bucket,
    profit: b.avg_profit,
    hs_days: b.avg_hs_days,
    roi: b.avg_roi,
    plots: b.plots,
    avg_pct: b.avg_precision_pct,
  })), [precision_buckets])

  // Scatter: each plot precision_pct vs season_profit, colored by treatment
  const scatterData = useMemo(() => plots.map(p => ({
    x: p.precision_pct,
    y: p.season_profit_cad,
    treatment: p.treatment,
    plot_id: p.plot_id,
    farm_name: p.farm_name,
    crop: p.crop,
    roi: p.season_roi,
    hs: p.high_stress_days,
  })), [plots])

  // Regression line through scatter
  const regression = useMemo(() => {
    const pts = scatterData.map(d => [d.x, d.y])
    const { a, b } = linreg(pts)
    const xs = scatterData.map(d => d.x)
    const xmin = Math.min(...xs)
    const xmax = Math.max(...xs)
    return [
      { x: xmin, y: a + b * xmin },
      { x: xmax, y: a + b * xmax },
    ]
  }, [scatterData])

  // For visual emphasis on lift
  const baseline = precision_buckets[0]
  const top = precision_buckets[precision_buckets.length - 2] || precision_buckets[0]  // skip the n=1 outlier

  return (
    <>
      <Topbar
        eyebrow="PART B · PRECISION ROI"
        title="Is GreenLeaf worth financing?"
        subtitle="A seasonal evaluation of whether precision agriculture spending delivers measurable returns — built for RBC's capital allocation review."
        meta={[
          { label: 'Plots', value: meta.plots },
          { label: 'Season profit', value: fmtMoney(meta.total_profit, { compact: true }) },
        ]}
      />
      <div className="page">
        {/* Headline */}
        <div className="headline-stat">
          <div className="headline-narrative">
            Of <em>${fmtNum(Math.round(meta.total_profit/1000))}K</em> in season profit,
            <em> ${fmtNum(Math.round(meta.total_precision_benefit/1000))}K</em> traces
            directly to precision actions — ~<em>${(meta.total_precision_benefit / (plots.reduce((s,p) => s + p.precision_cost, 0) || 1)).toFixed(2)}</em> back per $1 of precision spend.
          </div>
          <div className="headline-stat-big">
            <div className="num">{fmtPct(meta.total_precision_benefit / meta.total_profit, 0)}</div>
            <div className="lbl">of profit attributable to precision</div>
          </div>
          <div className="headline-pair">
            <div className="headline-pair-item">
              <div className="pn">{fmtMoney(meta.total_precision_benefit, { compact: true })}</div>
              <div className="pl">precision benefit</div>
            </div>
            <div className="headline-pair-item">
              <div className="pn">{fmtPct(meta.avg_roi, 1)}</div>
              <div className="pl">avg plot ROI</div>
            </div>
            <div className="headline-pair-item">
              <div className="pn">−{fmtPct((1 - top.avg_hs_days / baseline.avg_hs_days), 0)}</div>
              <div className="pl">stress days, top vs base tier</div>
            </div>
          </div>
        </div>

        {/* Two charts side by side */}
        <div className="grid-1-1" style={{ flex: 1, minHeight: 0 }}>
          <Panel
            title="Precision spend tier → profit & stress"
            subtitle="Average plot performance by share of cost spent on alert-triggered actions"
            tag="bucket"
          >
            <div className="chart-box">
              <ResponsiveContainer>
                <ComposedChart data={bucketChartData} margin={{ top: 8, right: 14, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={palette.border} vertical={false} />
                  <XAxis
                    dataKey="bucket"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: palette.border }}
                    stroke={palette.inkSoft}
                  />
                  <YAxis
                    yAxisId="L"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => '$' + v.toFixed(0)}
                    stroke={palette.inkSoft}
                  />
                  <YAxis
                    yAxisId="R"
                    orientation="right"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    stroke={palette.inkSoft}
                  />
                  <Tooltip
                    content={
                      <CustomTooltip
                        rows={(p) => {
                          const d = p[0].payload
                          return [
                            { k: 'Tier', v: d.bucket, color: palette.primary },
                            { k: 'Plots', v: d.plots, color: palette.inkSoft },
                            { k: 'Avg profit', v: fmtMoney(d.profit, { decimals: 0 }), color: palette.primary },
                            { k: 'Avg ROI', v: fmtPct(d.roi), color: palette.success },
                            { k: 'Avg HS days', v: d.hs_days.toFixed(1), color: palette.accent },
                            { k: 'Avg precision %', v: d.avg_pct.toFixed(2) + '%', color: palette.highlight },
                          ]
                        }}
                      />
                    }
                  />
                  <Bar yAxisId="L" dataKey="profit" fill={palette.primary} radius={[4,4,0,0]} barSize={42}>
                    {bucketChartData.map((entry, i) => (
                      <Cell key={i} fill={i === bucketChartData.length - 1 ? palette.highlight : i === 0 ? palette.primaryPale : palette.primary} />
                    ))}
                  </Bar>
                  <Line
                    yAxisId="R"
                    type="monotone"
                    dataKey="hs_days"
                    stroke={palette.accent}
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: palette.accent, stroke: palette.bg, strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="legend-chips" style={{ paddingTop: 4 }}>
              <span className="legend-chip"><span className="sw" style={{background: palette.primary}}/>Avg season profit ($)</span>
              <span className="legend-chip"><span className="sw" style={{background: palette.accent}}/>Avg high-stress days</span>
              <span className="legend-chip"><span className="sw" style={{background: palette.highlight}}/>Top tier (n=1, outlier)</span>
            </div>
          </Panel>

          <Panel
            title="Per-plot view: precision share vs season profit"
            subtitle="120 microplots · color = treatment · best fit line shows positive correlation"
            tag="scatter"
          >
            <div className="chart-box">
              <ResponsiveContainer>
                <ScatterChart margin={{ top: 8, right: 18, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={palette.border} />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Precision %"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: palette.border }}
                    stroke={palette.inkSoft}
                    label={{ value: 'precision spend (% of total cost)', position: 'insideBottom', offset: -2, style: { fontSize: 10, fill: palette.inkSoft } }}
                    tickFormatter={v => v.toFixed(0) + '%'}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="Profit"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    stroke={palette.inkSoft}
                    tickFormatter={v => '$' + (v/1000).toFixed(1) + 'K'}
                  />
                  <ZAxis range={[55, 55]} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3', stroke: palette.border }}
                    content={
                      <CustomTooltip
                        rows={(p) => {
                          const d = p[0]?.payload
                          if (!d) return []
                          return [
                            { k: 'Plot', v: `${d.plot_id} (${d.treatment})`, color: treatmentColors[d.treatment] },
                            { k: 'Precision', v: d.x.toFixed(2) + '%', color: palette.highlight },
                            { k: 'Profit', v: fmtMoney(d.y, { decimals: 0 }), color: palette.primary },
                            { k: 'ROI', v: fmtPct(d.roi), color: palette.success },
                            { k: 'Farm', v: d.farm_name, color: palette.inkSoft },
                          ]
                        }}
                      />
                    }
                  />
                  <ReferenceLine
                    segment={regression}
                    stroke={palette.primary}
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    ifOverflow="extendDomain"
                    label={{ value: 'best fit', position: 'insideTopRight', fill: palette.primary, fontSize: 10, offset: 8 }}
                  />
                  <ReferenceLine y={0} stroke={palette.danger} strokeDasharray="3 3" strokeOpacity={0.5}
                    label={{ value: 'break-even', position: 'right', fill: palette.danger, fontSize: 9 }} />
                  <Scatter data={scatterData} fillOpacity={0.78}>
                    {scatterData.map((d, i) => (
                      <Cell key={i} fill={treatmentColors[d.treatment] || palette.inkSoft} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="legend-chips" style={{ paddingTop: 4 }}>
              {Object.entries(treatmentColors).map(([k, c]) => (
                <span key={k} className="legend-chip">
                  <span className="sw" style={{ background: c, borderRadius: '50%' }} />
                  {k}
                </span>
              ))}
            </div>
          </Panel>
        </div>

        {/* Bottom insight callouts */}
        <div className="insight-grid">
          <div className="insight-card">
            <div className="insight-num">+{fmtPct((top.avg_profit - baseline.avg_profit) / baseline.avg_profit, 0)}</div>
            <div className="insight-label">Profit lift, top vs base tier</div>
            <div className="insight-text">High-precision plots ({fmtPct(top.avg_precision_pct/100, 1)} avg spend share) deliver {fmtMoney(top.avg_profit-baseline.avg_profit, { decimals: 0 })} more profit per plot than the lowest tier.</div>
          </div>
          <div className="insight-card accent">
            <div className="insight-num">−{Math.round(baseline.avg_hs_days - top.avg_hs_days)}d</div>
            <div className="insight-label">Stress days reduced</div>
            <div className="insight-text">The top precision tier averages just {top.avg_hs_days.toFixed(1)} high-stress days per plot, vs {baseline.avg_hs_days.toFixed(1)} in the low tier — fewer crop-loss exposures.</div>
          </div>
          <div className="insight-card gold">
            <div className="insight-num">{fmtPct(meta.total_precision_benefit / meta.total_profit, 0)}</div>
            <div className="insight-label">Of total profit from precision</div>
            <div className="insight-text">{fmtMoney(meta.total_precision_benefit, { compact: true })} of {fmtMoney(meta.total_profit, { compact: true })} in season profit attributable to precision actions — a clear financing case.</div>
          </div>
        </div>
      </div>
    </>
  )
}
