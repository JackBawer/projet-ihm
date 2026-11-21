import { useState } from 'react'
import { MONTHS, fmt, today, iso, cap } from '../lib/dates.js'

// Dépenses des 5 derniers mois : une ligne par mois, une barre découpée par enveloppe,
// le total écrit en clair au bout, et un trait vertical pour le budget.
// Des lignes horizontales restent lisibles quelle que soit la largeur de l'écran.
export default function MonthsChart({ S }) {
  const t = today()
  const envs = S.envelopes.filter((e) => !e.saving)
  const budget = envs.reduce((s, e) => s + e.budget, 0)
  const [open, setOpen] = useState(null)   // mois dont on affiche le détail par enveloppe
  const months = [...Array(5)].map((_, i) => {
    const d = new Date(t.getFullYear(), t.getMonth() - 4 + i, 1), key = iso(d).slice(0, 7)
    const by = Object.fromEntries(envs.map((e) => [e.id, 0]))
    S.tx.forEach((x) => { if (x.d.startsWith(key) && by[x.cat] !== undefined) by[x.cat] += x.amt })
    return { d, key, by, total: Object.values(by).reduce((a, b) => a + b, 0), current: i === 4 }
  }).reverse()   // le mois en cours en haut
  const max = Math.max(budget, ...months.map((m) => m.total)) * 1.05
  const pct = (v) => `${(v / max) * 100}%`

  return (
    <section className="bg-card rounded-3xl p-4 md:p-5 flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="font-bold">Dépenses par mois</h2>
        <span className="text-sm text-muted flex items-center gap-2"><span aria-hidden="true" className="inline-block h-4 border-l-2 border-dashed border-ink" />budget : {fmt(budget)} DA</span>
      </div>

      <ul className="m-0 p-0 list-none flex flex-col gap-3.5">
        {months.map((m) => {
          const over = m.total - budget, isOpen = open === m.key
          return (
            <li key={m.key}>
              <button onClick={() => setOpen(isOpen ? null : m.key)} aria-expanded={isOpen} className="w-full text-left flex flex-col gap-1.5">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold">{cap(MONTHS[m.d.getMonth()])}{m.current && <span className="font-normal text-muted"> · en cours</span>}</span>
                  <span className="text-right whitespace-nowrap">
                    <span className={`font-display text-lg font-bold ${over > 0 ? 'text-danger' : ''}`}>{fmt(m.total)} DA</span>
                    {over > 0 && !m.current && <span className="block text-xs font-semibold text-danger">{fmt(over)} DA au-dessus du budget</span>}
                  </span>
                </span>
                <span className="relative block h-5">
                  <span className="absolute inset-0 rounded-md bg-soft" />
                  <span className="absolute inset-y-0 left-0 flex rounded-md overflow-hidden" style={{ width: pct(m.total), opacity: m.current ? 0.6 : 1 }}>
                    {envs.map((e) => m.by[e.id] > 0 && <span key={e.id} style={{ width: `${(m.by[e.id] / m.total) * 100}%`, background: e.color }} className="h-full border-r-2 border-card last:border-0" />)}
                  </span>
                  <span aria-hidden="true" className="absolute -inset-y-1 border-l-2 border-dashed border-ink" style={{ left: pct(budget) }} />
                </span>
              </button>
              {isOpen && (
                <ul className="m-0 mt-2 p-3 list-none grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 rounded-2xl bg-sand text-sm">
                  {envs.map((e) => (
                    <li key={e.id} className="flex items-center gap-2"><span className="size-2.5 rounded-sm shrink-0" style={{ background: e.color }} /><span className="flex-1 text-muted">{e.name}</span><span className="font-semibold whitespace-nowrap">{fmt(m.by[e.id])} DA</span></li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
        {envs.map((e) => <span key={e.id} className="flex items-center gap-1.5"><span className="size-3 rounded-sm" style={{ background: e.color }} />{e.name}</span>)}
      </div>
      <p className="text-xs text-muted -mt-2">Touche un mois pour voir le détail par enveloppe.</p>
    </section>
  )
}
