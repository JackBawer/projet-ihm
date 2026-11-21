import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import { TxRow } from './Home.jsx'
import MonthsChart from '../components/MonthsChart.jsx'
import DayList from '../components/DayList.jsx'
import { monthStats, dayLevel } from '../lib/budget.js'
import { TONE } from '../components/Battery.jsx'
import { iso, today, da, fmt, MONTHS, cap, daysInMonth } from '../lib/dates.js'

export default function History({ S, api }) {
  const t = today()
  const [off, setOff] = useState(0)            // 0 = mois en cours, -1 = mois précédent…
  const [day, setDay] = useState(iso(t))
  const ref = new Date(t.getFullYear(), t.getMonth() + off, 1)
  const prefix = iso(ref).slice(0, 7), dim = daysInMonth(ref)
  const st = monthStats(S, off === 0 ? t : new Date(ref.getFullYear(), ref.getMonth(), dim))
  const totals = {}
  S.tx.forEach((x) => { if (x.d.startsWith(prefix)) totals[x.d] = (totals[x.d] || 0) + x.amt })
  const blanks = (ref.getDay() + 6) % 7        // la semaine commence le lundi
  const cells = [...Array(dim)].map((_, i) => { const d = `${prefix}-${String(i + 1).padStart(2, '0')}`; return { d, n: i + 1, future: d > iso(t), total: totals[d] || 0 } })
  const good = cells.filter((c) => !c.future && dayLevel(c.total, st.baseDaily).level === 'good').length
  const past = cells.filter((c) => !c.future).length
  const dayTx = S.tx.filter((x) => x.d === day).reverse()
  const maxCat = Math.max(1, ...S.envelopes.filter((e) => !e.saving).map((e) => st.byEnv[e.id] || 0))

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div><p className="text-sm text-muted">Historique</p><h1 className="font-display text-2xl md:text-3xl font-bold">{cap(MONTHS[ref.getMonth()])} {ref.getFullYear()}</h1></div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold bg-card border border-line rounded-full px-3 py-2">{good} jours dans le budget sur {past}</span>
          <button onClick={() => setOff(off - 1)} disabled={off <= -4} aria-label="Mois précédent" className="size-11 rounded-xl bg-card border border-line grid place-items-center disabled:opacity-40"><Icon name="left" /></button>
          <button onClick={() => setOff(off + 1)} disabled={off >= 0} aria-label="Mois suivant" className="size-11 rounded-xl bg-card border border-line grid place-items-center disabled:opacity-40"><Icon name="right" /></button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-[1.3fr_1fr] md:items-start">
        <div className="flex flex-col gap-4 min-w-0">
        <section className="bg-card rounded-3xl p-4">
          <div className="grid grid-cols-7 gap-1 mb-1">{['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <span key={i} className="text-center text-xs font-bold text-muted">{d}</span>)}</div>
          <div className="grid grid-cols-7 gap-1">
            {[...Array(blanks)].map((_, i) => <span key={`b${i}`} />)}
            {cells.map((c) => {
              if (c.future) return <span key={c.d} className="h-12 rounded-xl border border-dashed border-line grid place-items-center text-xs text-muted">{c.n}</span>
              const lv = dayLevel(c.total, st.baseDaily)
              return (
                <button key={c.d} onClick={() => setDay(c.d)} aria-label={`${c.n} ${MONTHS[ref.getMonth()]} : ${fmt(c.total)} DA dépensés`} aria-pressed={day === c.d}
                  className={`h-12 rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-bold ${day === c.d ? 'ring-2 ring-ink' : ''}`} style={{ background: `${TONE[lv.level]}26` }}>
                  {c.n}<span className="h-1.5 w-7 rounded bg-white/70 dark:bg-black/30"><span className="block h-1.5 rounded" style={{ width: `${lv.pct}%`, background: TONE[lv.level] }} /></span>
                </button>
              )
            })}
          </div>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted mt-3">
            {[['good', 'Dans le budget du jour'], ['mid', "Jusqu'à 2× le budget"], ['low', 'Plus de 2×']].map(([k, l]) => <span key={k} className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: TONE[k] }} />{l}</span>)}
          </p>
        </section>

          <MonthsChart S={S} />
        </div>

        <div className="flex flex-col gap-4 min-w-0">
          <section className="bg-card rounded-3xl p-4 md:p-5">
            <div className="flex items-baseline justify-between"><h2 className="font-bold">Le {parseInt(day.slice(8), 10)} {MONTHS[parseInt(day.slice(5, 7), 10) - 1]}</h2><span className="text-sm text-muted">{dayTx.length ? `−${da(dayTx.reduce((s, x) => s + x.amt, 0))}` : 'rien dépensé'}</span></div>
            {dayTx.length ? <DayList items={dayTx} S={S} onDelete={api.removeTx} /> : <p className="text-sm text-muted py-3">Aucune dépense ce jour-là.</p>}
          </section>
          <section className="bg-card rounded-3xl p-4 md:p-5 flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between"><h2 className="font-bold">Où est parti l'argent</h2><span className="text-sm text-muted">{da(st.spent)}</span></div>
            {S.envelopes.filter((e) => !e.saving).map((e) => (
              <div key={e.id} className="flex items-center gap-2.5 text-sm">
                <span style={{ color: e.color }}><Icon name={e.icon} size={18} /></span><span className="w-20">{e.name}</span>
                <span className="flex-1 h-2.5 rounded bg-soft"><span className="block h-2.5 rounded" style={{ width: `${((st.byEnv[e.id] || 0) / maxCat) * 100}%`, background: e.color }} /></span>
                <span className="font-display font-bold w-16 text-right whitespace-nowrap">{fmt(st.byEnv[e.id] || 0)}</span>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  )
}
