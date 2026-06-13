import React, { useMemo } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts'
import Topbar from '../components/Topbar.jsx'
import Panel from '../components/Panel.jsx'
import CustomTooltip from '../components/CustomTooltip.jsx'
import { palette, treatmentColors, fmtMoney, fmtPct, fmtNum } from '../utils/format.js'

export default function PartC({ data }) {
  const { meta, treatments } = data

  // Sort treatments by ROI desc, but keep Control as a baseline reference
  const control = treatments.find(t => t.treatment === 'Control')
  const others = treatments.filter(t => t.treatment !== 'Control')
  const sorted = [...others].sort((a, b) => b.avg_roi - a.avg_roi)
  const ordered = [control, ...sorted]

  const best = sorted[0]                          // highest ROI
  const worst = sorted[sorted.length - 1]         // lowest ROI

  // Scorecard rows with delta vs Control
  const scorecard = useMemo(() => sorted.map(t => ({
    treatment: t.treatment,
    plots: t.n_plots,
    profit: t.avg_profit,
    profit_delta: t.avg_profit - control.avg_profit,
    roi: t.avg_roi,
    roi_delta: t.avg_roi - control.avg_roi,
    yield: t.avg_yield,
    yield_delta: t.avg_yield - control.avg_yield,
    stress: t.avg_stress,
    stress_delta: t.avg_stress - control.avg_stress,
    hs_days: t.avg_hs_days,
  })), [sorted, control])

  // Max abs delta for bar scaling
  const maxProfitDelta = Math.max(...scorecard.map(r => Math.abs(r.profit_delta)))

  // Yield vs profit chart — every treatment, highlights inversion
  const yieldVsProfit = useMemo(() => treatments.map(t => ({
    treatment: t.treatment,
    yield: t.avg_yield,
    profit: t.avg_profit,
    roi: t.avg_roi,
    plots: t.n_plots,
  })).sort((a, b) => b.profit - a.profit), [treatments])

  return (
    <>
      <Topbar
        eyebrow="PART C · TREATMENT AUDIT"
        title="The 'high-N grows more' myth, busted"
        subtitle="An open-scenario investigation: does the industry rule of thumb — more nitrogen, more yield, more profit — hold up across our 120 plots?"
        meta={[
          { label: 'Treatments tested', value: treatments.length },
          { label: 'Baseline (Control)', value: fmtMoney(control.avg_profit, { decimals: 0 }) },
        ]}
      />
      <div className="page">
        {/* Myth / Truth banner */}
        <div className="myth-truth">
          <div className="mt-side myth">
            <div className="mt-eyebrow">Common Wisdom</div>
            <div className="mt-text">"Push the <em>nitrogen</em>. Heavier feed equals heavier harvest equals heavier <em>cheques</em>."</div>
          </div>
          <div className="mt-arrow">→</div>
          <div className="mt-side truth">
            <div className="mt-eyebrow">What the Data Says</div>
            <div className="mt-text mt-truth-text">High-N gives <em>+1.1 kg/m²</em> yield but barely moves profit. <em>High-Light</em> wins ROI ({fmtPct(best.avg_roi)}) on similar yield to Control.</div>
          </div>
        </div>

        {/* Treatment cards grid */}
        <div className="treatment-grid">
          {ordered.map(t => {
            const isBest = t.treatment === best.treatment
            const isWorst = t.treatment === worst.treatment
            const isControl = t.treatment === 'Control'
            const cls = `treatment-card ${isBest ? 'best' : ''} ${isWorst ? 'worst' : ''} ${isControl ? 'control' : ''}`
            const tag = isBest ? 'BEST ROI' : isWorst ? 'WORST' : isControl ? 'BASELINE' : null
            const tagCls = isBest ? 'best' : isWorst ? 'worst' : isControl ? 'baseline' : null
            const delta = isControl ? 0 : t.avg_profit - control.avg_profit
            const deltaPct = isControl ? 0 : (t.avg_roi - control.avg_roi)

            return (
              <div className={cls} key={t.treatment}>
                {tag && <div className={`treatment-tag ${tagCls}`}>{tag}</div>}
                <div className="treatment-name">{t.treatment}</div>
                <div className="treatment-name-sub">{t.n_plots} plots · stress {t.avg_stress.toFixed(2)}</div>
                <div className="treatment-stat-row">
                  <div className="treatment-stat">
                    <div className="val">{fmtMoney(t.avg_profit, { decimals: 0 })}</div>
                    <div className="lbl">profit</div>
                  </div>
                  <div className="treatment-stat">
                    <div className="val">{fmtPct(t.avg_roi, 0)}</div>
                    <div className="lbl">ROI</div>
                  </div>
                  <div className="treatment-stat">
                    <div className="val acc">{t.avg_yield.toFixed(2)}</div>
                    <div className="lbl">kg/m²</div>
                  </div>
                  <div className="treatment-stat">
                    <div className="val">{t.avg_hs_days.toFixed(1)}</div>
                    <div className="lbl">HS days</div>
                  </div>
                </div>
                {!isControl && (
                  <span className={`treatment-delta ${delta >= 0 ? 'pos' : 'neg'}`}>
                    {delta >= 0 ? '+' : ''}{fmtMoney(delta, { decimals: 0 })} vs Control · {deltaPct >= 0 ? '+' : ''}{(deltaPct * 100).toFixed(1)}pp ROI
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Bottom: scorecard table + yield vs profit chart */}
        <div className="grid-2-1" style={{ flex: 1, minHeight: 0 }}>
          <Panel
            title="Treatment scorecard"
            subtitle={`Δ shown vs Control baseline (${fmtMoney(control.avg_profit, { decimals: 0 })} profit, ${fmtPct(control.avg_roi)} ROI, ${control.avg_yield.toFixed(2)} kg/m²)`}
            tag="ranked by ROI"
          >
            <div className="scorecard-wrap">
              <table className="scorecard">
                <thead>
                  <tr>
                    <th>Treatment</th>
                    <th style={{ textAlign: 'right' }}>n</th>
                    <th style={{ textAlign: 'right' }}>Profit</th>
                    <th>Δ Profit (vs Control)</th>
                    <th style={{ textAlign: 'right' }}>ROI</th>
                    <th style={{ textAlign: 'right' }}>Yield</th>
                    <th style={{ textAlign: 'right' }}>HS days</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="row-control">
                    <td><span className="sc-name">Control</span></td>
                    <td className="sc-num" style={{ textAlign: 'right' }}>{control.n_plots}</td>
                    <td className="sc-num" style={{ textAlign: 'right' }}>{fmtMoney(control.avg_profit, { decimals: 0 })}</td>
                    <td className="sc-delta" style={{ color: 'var(--ink-soft)' }}>baseline</td>
                    <td className="sc-num" style={{ textAlign: 'right' }}>{fmtPct(control.avg_roi, 1)}</td>
                    <td className="sc-num" style={{ textAlign: 'right' }}>{control.avg_yield.toFixed(2)}</td>
                    <td className="sc-num" style={{ textAlign: 'right' }}>{control.avg_hs_days.toFixed(1)}</td>
                  </tr>
                  {scorecard.map(r => {
                    const isBest = r.treatment === best.treatment
                    const isWorst = r.treatment === worst.treatment
                    const pct = Math.abs(r.profit_delta) / maxProfitDelta * 50
                    const pos = r.profit_delta >= 0
                    const cls = isBest ? 'row-best' : isWorst ? 'row-worst' : ''
                    return (
                      <tr className={cls} key={r.treatment}>
                        <td><span className="sc-name">{r.treatment}</span></td>
                        <td className="sc-num" style={{ textAlign: 'right' }}>{r.plots}</td>
                        <td className="sc-num" style={{ textAlign: 'right' }}>{fmtMoney(r.profit, { decimals: 0 })}</td>
                        <td className="sc-bar-cell">
                          <div className="sc-bar-bg">
                            <div className="sc-bar-mid" />
                            <div
                              className={`sc-bar-fill ${pos ? 'pos' : 'neg'}`}
                              style={{
                                width: `${pct}%`,
                                ...(pos ? { left: '50%' } : { right: '50%' }),
                              }}
                            />
                          </div>
                          <div className={`sc-delta ${pos ? 'pos' : 'neg'}`} style={{ marginTop: 2, fontSize: 10 }}>
                            {pos ? '+' : ''}{fmtMoney(r.profit_delta, { decimals: 0 })}
                          </div>
                        </td>
                        <td className="sc-num" style={{ textAlign: 'right' }}>
                          {fmtPct(r.roi, 1)}
                          <div className={`sc-delta ${r.roi_delta >= 0 ? 'pos' : 'neg'}`} style={{ fontSize: 10 }}>
                            {r.roi_delta >= 0 ? '+' : ''}{(r.roi_delta * 100).toFixed(1)}pp
                          </div>
                        </td>
                        <td className="sc-num" style={{ textAlign: 'right' }}>
                          {r.yield.toFixed(2)}
                          <div className={`sc-delta ${r.yield_delta >= 0 ? 'pos' : 'neg'}`} style={{ fontSize: 10 }}>
                            {r.yield_delta >= 0 ? '+' : ''}{r.yield_delta.toFixed(2)}
                          </div>
                        </td>
                        <td className="sc-num" style={{ textAlign: 'right' }}>{r.hs_days.toFixed(1)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel
            title="Profit vs Yield by treatment"
            subtitle="The myth predicts diagonal correlation. Reality: it's flat."
            tag="inversion"
          >
            <div className="chart-box">
              <ResponsiveContainer>
                <BarChart
                  data={yieldVsProfit}
                  layout="vertical"
                  margin={{ top: 6, right: 18, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="2 4" stroke={palette.border} horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: palette.border }}
                    stroke={palette.inkSoft}
                    tickFormatter={v => '$' + v.toFixed(0)}
                  />
                  <YAxis
                    type="category"
                    dataKey="treatment"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    stroke={palette.inkSoft}
                    width={92}
                  />
                  <Tooltip
                    content={
                      <CustomTooltip
                        rows={(p) => {
                          const d = p[0].payload
                          return [
                            { k: 'Treatment', v: d.treatment, color: treatmentColors[d.treatment] },
                            { k: 'Avg profit', v: fmtMoney(d.profit, { decimals: 0 }), color: palette.primary },
                            { k: 'Avg yield', v: d.yield.toFixed(2) + ' kg/m²', color: palette.accent },
                            { k: 'Avg ROI', v: fmtPct(d.roi), color: palette.success },
                            { k: 'n', v: d.plots, color: palette.inkSoft },
                          ]
                        }}
                      />
                    }
                  />
                  <Bar dataKey="profit" radius={[0, 4, 4, 0]} barSize={20}>
                    {yieldVsProfit.map((entry, i) => (
                      <Cell key={i} fill={treatmentColors[entry.treatment] || palette.primary} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="legend-chips" style={{ paddingTop: 4 }}>
              <span className="legend-chip"><span className="sw" style={{ background: palette.highlight }} />High Light wins on profit despite mid yield</span>
            </div>
          </Panel>
        </div>

        {/* Recommendation callout */}
        <div className="callout">
          <div className="callout-icon">✦</div>
          <div className="callout-text">
            <em>Reallocate spend:</em> shift away from Shade & Reduced-Pest (negative ROI), expand <em>High-Light</em> blocks
            (+{fmtMoney(best.avg_profit - control.avg_profit, { decimals: 0 })}/plot, {fmtPct(best.avg_roi)} ROI),
            and treat <em>High-N</em> as a yield play only — not a profit lever.
          </div>
        </div>
      </div>
    </>
  )
}
