import Icon from './Icon.jsx'
import { dayTotal } from '../lib/budget.js'
import { fixedTotalThisMonth } from '../lib/fixed.js'
import { iso, today, da, fmt, MONTHS } from '../lib/dates.js'

// Dépenses de chaque jour du mois en cours, jusqu'à aujourd'hui (hors dépenses fixes).
export function monthDays(S) {
  const t = today(), out = []
  for (let d = 1; d <= t.getDate(); d++) {
    const date = new Date(t.getFullYear(), t.getMonth(), d)
    out.push({ day: d, total: dayTotal(S, iso(date)) })
  }
  return out
}

// Budget du jour : ce qu'il faudrait dépenser chaque jour pour finir le mois pile (dépenses fixes à part).
export const dailyBudget = (S, st) => Math.max(1, (st.spendable - fixedTotalThisMonth(S)) / st.dim)

// Petite courbe sous un chiffre clé.
export function Spark({ values, color, w = 200, h = 50 }) {
  if (values.length < 2) return null
  const mx = Math.max(...values), mn = Math.min(...values)
  const pts = values.map((v, i) => [(i * w) / (values.length - 1), h - 5 - ((v - mn) / (mx - mn || 1)) * (h - 10)])
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const [lx, ly] = pts[pts.length - 1]
  return (
    <svg aria-hidden="true" width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible max-w-full">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="3.4" fill={color} stroke="var(--card)" strokeWidth="1.6" />
    </svg>
  )
}

// Un chiffre clé : libellé, montant, phrase d'explication, et un visuel à droite sur PC.
export function Kpi({ icon, color, label, value, foot, side, compact }) {
  return (
    <section className="bg-card border border-line rounded-3xl flex items-center gap-4 min-w-0 p-3.5 md:p-4 md:px-5">
      <div className="flex-1 min-w-0">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span className="size-8 rounded-xl grid place-items-center shrink-0" style={{ background: color.startsWith('var') ? 'var(--accentsoft)' : `${color}22`, color }}><Icon name={icon} size={16} /></span>{label}</p>
        <p className="font-display font-bold tracking-tight mt-2 whitespace-nowrap text-xl md:text-[1.75rem]">{fmt(value)}<span className="text-sm font-semibold text-muted"> DA</span></p>
        {foot && <p className="text-xs md:text-sm text-muted">{foot}</p>}
      </div>
      {side && <div className="hidden xl:block shrink-0">{side}</div>}
    </section>
  )
}

// « Dépenses par jour » : une barre par jour du mois, comparée au budget du jour (ligne pointillée).
export function DayChart({ S, st, className = '' }) {
  const days = monthDays(S), budget = dailyBudget(S, st), t = today()
  const W = 560, H = 360, L = 42, B = 24, T = 12
  const top = Math.max(budget * 1.5, ...days.map((d) => d.total))
  const step = top > 8000 ? 4000 : top > 4000 ? 2000 : top > 2000 ? 1000 : 500
  const max = Math.ceil((top * 1.08) / step) * step
  const y = (v) => T + (H - B - T) * (1 - v / max)
  const bw = (W - L) / Math.max(days.length, 10)
  const within = days.filter((d) => d.total <= budget).length
  const avg = days.reduce((s, d) => s + d.total, 0) / Math.max(1, days.length)
  const peak = days.reduce((m, d) => (d.total > m.total ? d : m), { total: 0, day: 0 })
  const grid = []
  for (let v = 0; v <= max; v += step) grid.push(v)
  return (
    <section className={`bg-card border border-line rounded-3xl p-5 flex-col gap-3 min-w-0 ${className}`}>
      <div>
        <h2 className="font-bold">Dépenses par jour</h2>
        <p className="text-sm text-muted">{MONTHS[t.getMonth()][0].toUpperCase() + MONTHS[t.getMonth()].slice(1)}, comparées à ton budget du jour</p>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-[var(--bar)]" />Dans le budget</span>
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-[var(--bar-over)]" />Jour qui dépasse</span>
        <span className="flex items-center gap-1.5"><i className="size-2.5 rounded-sm bg-accent" />Aujourd'hui</span>
      </div>
      <svg role="img" aria-label={`Dépenses par jour ce mois : ${within} jours sur ${days.length} dans le budget de ${da(budget)} par jour.`} viewBox={`0 0 ${W} ${H}`} className="w-full my-auto max-h-72 xl:max-h-none">
        {grid.map((v) => (
          <g key={v}><line x1={L} x2={W} y1={y(v)} y2={y(v)} stroke="var(--line)" />
            <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="10.5" fill="var(--muted)">{fmt(v)}</text></g>
        ))}
        {days.map((d, i) => {
          const x = L + i * bw + bw * 0.18, h = Math.max(d.total ? 2 : 0, y(0) - y(d.total))
          const last = i === days.length - 1
          return (
            <g key={d.day}>
              <rect x={x} y={y(0) - h} width={bw * 0.64} height={h} rx="2.5" fill={last ? 'var(--accent)' : d.total > budget ? 'var(--bar-over)' : 'var(--bar)'}><title>{`${d.day} ${MONTHS[t.getMonth()]} : ${da(d.total)}`}</title></rect>
              {(i % 3 === 0 || last) && <text x={x + bw * 0.32} y={H - 7} textAnchor="middle" fontSize="10.5" fill="var(--muted)">{d.day}</text>}
            </g>
          )
        })}
        <line x1={L} x2={W} y1={y(budget)} y2={y(budget)} stroke="var(--ink)" strokeWidth="1.4" strokeDasharray="5 4" opacity=".7" />
        <text x={W} y={y(budget) - 6} textAnchor="end" fontSize="10.5" fontWeight="600" fill="var(--ink)">budget du jour {fmt(budget)} DA</text>
      </svg>
      <div className="grid grid-cols-3 border-t border-line pt-3">
        <div><p className="text-xs text-muted">Moyenne par jour</p><p className="font-display font-bold text-lg whitespace-nowrap">{da(avg)}</p></div>
        <div className="border-l border-line pl-3.5"><p className="text-xs text-muted">Dans le budget</p><p className="font-display font-bold text-lg">{within} sur {days.length}</p></div>
        <div className="border-l border-line pl-3.5"><p className="text-xs text-muted">Plus gros jour</p><p className="font-display font-bold text-lg whitespace-nowrap">{peak.total ? `${da(peak.total)}` : '—'}</p></div>
      </div>
    </section>
  )
}

// Les enveloppes présentées comme un plan de dépenses : dépensé / prévu, barre, reste.
export function EnvPlan({ S, st, onOpen, className = '' }) {
  const envs = S.envelopes.filter((e) => !e.saving)
  const spent = envs.reduce((s, e) => s + (st.byEnv[e.id] || 0), 0)
  const left = Math.max(0, Math.round(100 - (spent / Math.max(1, st.spendable)) * 100))
  return (
    <section data-tour="envelopes" className={`bg-card border border-line rounded-3xl p-5 flex-col min-w-0 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div><h2 className="font-bold">Tes enveloppes</h2><p className="text-sm text-muted">Ce mois-ci</p></div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-accentsoft text-accent whitespace-nowrap">{left} % restants</span>
      </div>
      <ul className="m-0 p-0 list-none mt-2">
        {envs.map((e) => {
          const sp = st.byEnv[e.id] || 0, p = Math.min(100, (sp / Math.max(1, e.budget)) * 100), warn = p >= 85
          return (
            <li key={e.id} className="border-b border-line last:border-0">
              <button onClick={onOpen} className="w-full text-left flex gap-3 py-2.5">
                <span className="size-9 rounded-xl grid place-items-center shrink-0" style={{ background: `${e.color}22`, color: e.color }}><Icon name={e.icon} size={18} /></span>
                <span className="flex-1 min-w-0">
                  <span className="flex flex-wrap items-baseline justify-between gap-x-2"><span className="font-semibold">{e.name}</span>
                    <span className="text-sm whitespace-nowrap"><b>{fmt(sp)}</b><span className="text-muted"> / {fmt(e.budget)}</span></span></span>
                  <span className="block h-2 rounded-full bg-soft mt-1.5 overflow-hidden"><span className="block h-full rounded-full" style={{ width: `${p}%`, background: warn ? 'var(--warn)' : e.color }} /></span>
                  <span className={`block text-xs mt-1 text-right ${warn ? 'text-warn font-semibold' : 'text-muted'}`}>{warn ? 'presque vide · ' : ''}{da(e.budget - sp)} restants</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
        <span className="text-sm"><b>{fmt(spent)}</b><span className="text-muted"> / {fmt(st.spendable)} DA</span></span>
        <button onClick={onOpen} className="h-11 -my-2 text-sm font-semibold text-accent">Tout voir</button>
      </div>
    </section>
  )
}
