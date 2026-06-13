// Aggregates the raw GreenLeaf CSVs into a single data.json consumed by the app.
// Run from the folder that contains the CSV files: `node build-data.mjs`
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CSV_DIR = __dirname
const OUT = path.join(__dirname, 'greenleaf-app', 'src', 'data.json')

// --- tiny CSV parser (handles quoted fields) ---
function parseCSV(text) {
  const rows = []
  let row = [], field = '', inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += c
    } else {
      if (c === '"') inQuotes = true
      else if (c === ',') { row.push(field); field = '' }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
      else if (c === '\r') { /* skip */ }
      else field += c
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }
  return rows
}

function loadCSV(name) {
  const text = fs.readFileSync(path.join(CSV_DIR, name), 'utf8')
  const rows = parseCSV(text).filter(r => r.length > 1 || (r.length === 1 && r[0] !== ''))
  const header = rows[0]
  return rows.slice(1).map(r => {
    const o = {}
    header.forEach((h, i) => { o[h] = r[i] })
    return o
  })
}

const num = (v) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

console.log('Loading CSVs...')
const plotsRaw = loadCSV('plots.csv')
const farmsRaw = loadCSV('farms.csv')
const greenhousesRaw = loadCSV('greenhouses.csv')
const summaryRaw = loadCSV('season_summary.csv')
const sensorRaw = loadCSV('daily_sensor_readings.csv')
const costsRaw = loadCSV('daily_input_costs.csv')

// --- lookups ---
const farmName = {}
farmsRaw.forEach(f => { farmName[f.farm_id] = f.farm_name })

const plotMeta = {}
plotsRaw.forEach(p => {
  plotMeta[p.plot_id] = {
    greenhouse_id: p.greenhouse_id,
    farm_id: p.farm_id,
    farm_name: farmName[p.farm_id] || p.farm_id,
    crop: p.crop,
    treatment: p.treatment,
    plot_area_m2: num(p.plot_area_m2),
  }
})

const summary = {}
summaryRaw.forEach(s => {
  summary[s.plot_id] = {
    yield: num(s.season_yield_kg_m2),
    revenue: num(s.season_revenue_cad),
    total_cost: num(s.total_cost_cad),
    profit: num(s.season_profit_cad),
    roi: num(s.season_roi),
    precision_benefit: num(s.precision_benefit_cad),
  }
})

const HS = 0.7 // high-stress threshold

// --- week bucketing ---
const allDates = sensorRaw.map(r => r.date).filter(Boolean).sort()
const minDate = allDates[0]
const maxDate = allDates[allDates.length - 1]
const minMs = new Date(minDate + 'T00:00:00').getTime()
const DAY = 86400000
const weekOf = (dateStr) => {
  const ms = new Date(dateStr + 'T00:00:00').getTime()
  const wIdx = Math.floor((ms - minMs) / (7 * DAY))
  return new Date(minMs + wIdx * 7 * DAY).toISOString().slice(0, 10)
}

// --- accumulators ---
const weeklyAgg = {}            // week -> {stressSum, n, alerts, hs, actions, delaySum, delayN, precCost}
const plotAgg = {}              // plot -> {precisionCost, hsDays, stressSum, stressN}
const plotWeek = {}             // `${plot}|${week}` -> {hs, stressSum, n}
const plotTimelines = {}        // plot -> [{date, stress, cost, alert, action}]
const alertAgg = {}             // type -> {count, actions}

let totalAlerts = 0, totalActions = 0, totalDelaySum = 0, totalDelayN = 0
let highStressTotal = 0, sameDayActions = 0

// cost lookup per plot|date for timelines
const costByKey = {}
costsRaw.forEach(c => {
  costByKey[`${c.plot_id}|${c.date}`] = {
    total: num(c.daily_total_input_cost),
    precision: num(c.daily_precision_cost),
  }
  const p = c.plot_id
  if (!plotAgg[p]) plotAgg[p] = { precisionCost: 0, hsDays: 0, stressSum: 0, stressN: 0 }
  plotAgg[p].precisionCost += num(c.daily_precision_cost)
  const w = weekOf(c.date)
  if (!weeklyAgg[w]) weeklyAgg[w] = { stressSum: 0, n: 0, alerts: 0, hs: 0, actions: 0, delaySum: 0, delayN: 0, precCost: 0 }
  weeklyAgg[w].precCost += num(c.daily_precision_cost)
})

sensorRaw.forEach(r => {
  const p = r.plot_id
  const date = r.date
  if (!date) return
  const w = weekOf(date)
  const stress = num(r.plant_stress_index)
  const alert = num(r.alert_flag) === 1
  const action = num(r.action_taken) === 1
  const delay = num(r.action_delay_days)
  const isHS = stress > HS

  if (!plotAgg[p]) plotAgg[p] = { precisionCost: 0, hsDays: 0, stressSum: 0, stressN: 0 }
  plotAgg[p].stressSum += stress
  plotAgg[p].stressN += 1
  if (isHS) plotAgg[p].hsDays += 1

  if (!weeklyAgg[w]) weeklyAgg[w] = { stressSum: 0, n: 0, alerts: 0, hs: 0, actions: 0, delaySum: 0, delayN: 0, precCost: 0 }
  const wa = weeklyAgg[w]
  wa.stressSum += stress
  wa.n += 1
  if (isHS) wa.hs += 1

  const pwKey = `${p}|${w}`
  if (!plotWeek[pwKey]) plotWeek[pwKey] = { hs: 0, stressSum: 0, n: 0 }
  plotWeek[pwKey].stressSum += stress
  plotWeek[pwKey].n += 1
  if (isHS) plotWeek[pwKey].hs += 1

  if (isHS) highStressTotal += 1

  if (alert) {
    totalAlerts += 1
    wa.alerts += 1
    const type = (r.alert_type || '').trim()
    if (type) {
      if (!alertAgg[type]) alertAgg[type] = { count: 0, actions: 0 }
      alertAgg[type].count += 1
      if (action) alertAgg[type].actions += 1
    }
    if (action) {
      totalActions += 1
      wa.actions += 1
      totalDelaySum += delay
      totalDelayN += 1
      wa.delaySum += delay
      wa.delayN += 1
      if (delay === 0) sameDayActions += 1
    }
  }

  if (!plotTimelines[p]) plotTimelines[p] = []
  const cost = costByKey[`${p}|${date}`]?.total ?? 0
  plotTimelines[p].push({ date, stress: +stress.toFixed(4), cost: +cost.toFixed(2), alert, action })
})

// sort timelines by date
Object.values(plotTimelines).forEach(tl => tl.sort((a, b) => a.date.localeCompare(b.date)))

// --- weekly array ---
const weekLabels = Object.keys(weeklyAgg).sort()
const weekly = weekLabels.map(w => {
  const a = weeklyAgg[w]
  return {
    week_label: w,
    avg_stress: a.n ? +(a.stressSum / a.n).toFixed(4) : 0,
    total_alerts: a.alerts,
    high_stress_events: a.hs,
    total_actions: a.actions,
    action_rate: a.alerts ? +(a.actions / a.alerts).toFixed(4) : 0,
    avg_delay: a.delayN ? +(a.delaySum / a.delayN).toFixed(3) : 0,
    weekly_precision_cost: +a.precCost.toFixed(2),
  }
})

const peak_week = weekly.reduce((best, w) => w.high_stress_events > (best?.high_stress_events ?? -1) ? w : best, null)?.week_label

// --- weekly plot rankings ---
const weekly_plot_rankings = {}
weekLabels.forEach(w => {
  const list = []
  Object.keys(plotMeta).forEach(p => {
    const pw = plotWeek[`${p}|${w}`]
    if (pw && pw.hs > 0) {
      const m = plotMeta[p]
      list.push({
        plot_id: p,
        treatment: m.treatment,
        crop: m.crop,
        farm_name: m.farm_name,
        greenhouse_id: m.greenhouse_id,
        hs_days: pw.hs,
        avg_stress: +(pw.stressSum / pw.n).toFixed(4),
      })
    }
  })
  list.sort((a, b) => b.hs_days - a.hs_days || b.avg_stress - a.avg_stress)
  weekly_plot_rankings[w] = list.slice(0, 20)
})

// --- per-plot table (Part B) ---
const plots = Object.keys(plotMeta).map(p => {
  const m = plotMeta[p]
  const s = summary[p] || {}
  const agg = plotAgg[p] || { precisionCost: 0, hsDays: 0 }
  const totalCost = s.total_cost || 0
  const precisionPct = totalCost > 0 ? (agg.precisionCost / totalCost) * 100 : 0
  return {
    plot_id: p,
    treatment: m.treatment,
    crop: m.crop,
    farm_name: m.farm_name,
    precision_pct: +precisionPct.toFixed(3),
    precision_cost: +agg.precisionCost.toFixed(2),
    season_profit_cad: +(s.profit ?? 0).toFixed(2),
    season_roi: +(s.roi ?? 0).toFixed(4),
    high_stress_days: agg.hsDays,
  }
})

// --- precision buckets (quintiles by precision_pct) ---
const sortedByPrec = [...plots].sort((a, b) => a.precision_pct - b.precision_pct)
const tierLabels = ['Minimal', 'Low', 'Moderate', 'High', 'Intensive']
const nTiers = tierLabels.length
const precision_buckets = tierLabels.map((label, i) => {
  const start = Math.floor((i * sortedByPrec.length) / nTiers)
  const end = Math.floor(((i + 1) * sortedByPrec.length) / nTiers)
  const slice = sortedByPrec.slice(start, end)
  const n = slice.length || 1
  const mean = (key) => slice.reduce((s, p) => s + p[key], 0) / n
  return {
    prec_bucket: label,
    plots: slice.length,
    avg_profit: +mean('season_profit_cad').toFixed(2),
    avg_roi: +mean('season_roi').toFixed(4),
    avg_hs_days: +mean('high_stress_days').toFixed(2),
    avg_precision_pct: +mean('precision_pct').toFixed(3),
  }
})

// --- treatments (Part C) ---
const byTreatment = {}
Object.keys(plotMeta).forEach(p => {
  const m = plotMeta[p]
  const s = summary[p] || {}
  const agg = plotAgg[p] || { hsDays: 0, stressSum: 0, stressN: 0 }
  const t = m.treatment
  if (!byTreatment[t]) byTreatment[t] = { profit: 0, roi: 0, yield: 0, stressSum: 0, stressN: 0, hsDays: 0, n: 0 }
  const b = byTreatment[t]
  b.profit += s.profit ?? 0
  b.roi += s.roi ?? 0
  b.yield += s.yield ?? 0
  b.hsDays += agg.hsDays
  b.stressSum += agg.stressSum
  b.stressN += agg.stressN
  b.n += 1
})
const treatments = Object.keys(byTreatment).map(t => {
  const b = byTreatment[t]
  return {
    treatment: t,
    n_plots: b.n,
    avg_profit: +(b.profit / b.n).toFixed(2),
    avg_roi: +(b.roi / b.n).toFixed(4),
    avg_yield: +(b.yield / b.n).toFixed(3),
    avg_stress: b.stressN ? +(b.stressSum / b.stressN).toFixed(4) : 0,
    avg_hs_days: +(b.hsDays / b.n).toFixed(2),
  }
})

// --- crops ---
const byCrop = {}
Object.keys(plotMeta).forEach(p => {
  const m = plotMeta[p]
  const s = summary[p] || {}
  if (!byCrop[m.crop]) byCrop[m.crop] = { profit: 0, yield: 0, n: 0 }
  byCrop[m.crop].profit += s.profit ?? 0
  byCrop[m.crop].yield += s.yield ?? 0
  byCrop[m.crop].n += 1
})
const crops = Object.keys(byCrop).map(c => ({
  crop: c,
  avg_profit: +(byCrop[c].profit / byCrop[c].n).toFixed(2),
  avg_yield: +(byCrop[c].yield / byCrop[c].n).toFixed(3),
  n_plots: byCrop[c].n,
}))

// --- farms ---
const byFarm = {}
Object.keys(plotMeta).forEach(p => {
  const m = plotMeta[p]
  const s = summary[p] || {}
  if (!byFarm[m.farm_id]) byFarm[m.farm_id] = { name: m.farm_name, profit: 0, benefit: 0, n: 0 }
  byFarm[m.farm_id].profit += s.profit ?? 0
  byFarm[m.farm_id].benefit += s.precision_benefit ?? 0
  byFarm[m.farm_id].n += 1
})
const farms = Object.keys(byFarm).map(fid => ({
  farm_name: byFarm[fid].name,
  total_profit: +byFarm[fid].profit.toFixed(2),
  total_precision_benefit: +byFarm[fid].benefit.toFixed(2),
  n_plots: byFarm[fid].n,
}))

// --- alert breakdown ---
const alert_breakdown = Object.keys(alertAgg).map(type => ({
  alert_type: type,
  count: alertAgg[type].count,
  action_rate: alertAgg[type].count ? +(alertAgg[type].actions / alertAgg[type].count).toFixed(4) : 0,
}))

// --- meta ---
const totalProfit = Object.values(summary).reduce((s, v) => s + v.profit, 0)
const totalRevenue = Object.values(summary).reduce((s, v) => s + v.revenue, 0)
const totalBenefit = Object.values(summary).reduce((s, v) => s + v.precision_benefit, 0)
const avgRoi = Object.values(summary).reduce((s, v) => s + v.roi, 0) / Object.keys(summary).length

const meta = {
  farms: farmsRaw.length,
  greenhouses: greenhousesRaw.length,
  plots: Object.keys(plotMeta).length,
  total_profit: +totalProfit.toFixed(2),
  total_revenue: +totalRevenue.toFixed(2),
  total_precision_benefit: +totalBenefit.toFixed(2),
  avg_roi: +avgRoi.toFixed(4),
  action_rate_on_alert: totalAlerts ? +(totalActions / totalAlerts).toFixed(4) : 0,
  avg_action_delay: totalDelayN ? +(totalDelaySum / totalDelayN).toFixed(3) : 0,
  high_stress_total: highStressTotal,
  total_actions: totalActions,
  total_alerts: totalAlerts,
  same_day_actions: sameDayActions,
  date_min: minDate,
  date_max: maxDate,
}

const data = {
  meta,
  weekly,
  crops,
  farms,
  alert_breakdown,
  weekly_plot_rankings,
  plot_timelines: plotTimelines,
  peak_week,
  plots,
  precision_buckets,
  treatments,
}

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, JSON.stringify(data))
console.log('Wrote', OUT)
console.log('meta:', meta)
console.log('weeks:', weekly.length, 'peak_week:', peak_week)
console.log('treatments:', treatments.map(t => t.treatment).join(', '))
