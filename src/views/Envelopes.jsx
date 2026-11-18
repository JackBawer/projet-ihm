import { useState } from 'react'
import QuickAdd from '../components/QuickAdd.jsx'
import Icon from '../components/Icon.jsx'
import { EnvCard, TxRow } from './Home.jsx'
import ZakatCard from '../components/ZakatCard.jsx'
import Goals from '../components/Goals.jsx'
import FixedManager from '../components/Fixed.jsx'
import { monthStats } from '../lib/budget.js'
import { iso, today, da, fmt, MONTHS, DAYS, cap, parseISO } from '../lib/dates.js'

// Le détail d'une enveloppe : même contenu sur PC (panneau à droite) et sur téléphone (feuille qui monte).
function Detail({ env, spent, list, update, api, onClose }) {
  const left = env.budget - spent, pct = env.budget ? Math.min(100, Math.round((spent / env.budget) * 100)) : 0
  const rate = spent / Math.max(1, today().getDate()), days = rate > 0 ? Math.floor(left / rate) : null
  const warn = !env.saving && pct >= 85
  const setBudget = (v) => update((s) => { s.envelopes.find((e) => e.id === env.id).budget = Math.max(0, v) })
  const groups = []
  list.forEach((x) => { const g = groups.find((g) => g.d === x.d); g ? g.items.push(x) : groups.push({ d: x.d, items: [x] }) })
  return (
    <div className="flex flex-col gap-4 min-h-0">
      <div className="flex items-start gap-3">
        <span className="size-11 rounded-xl grid place-items-center shrink-0" style={{ background: `${env.color}1F`, color: env.color }}><Icon name={env.icon} size={22} /></span>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-xl font-medium">{env.name}</h2>
          <p className="text-sm text-muted">{env.saving ? 'mis de côté ce mois-ci' : warn ? 'presque vide' : days === null ? 'aucune dépense ce mois-ci' : days >= 30 ? 'tient tout le mois à ce rythme' : `tient encore ~${days} jours à ce rythme`}</p>
        </div>
        {onClose && <button onClick={onClose} aria-label="Fermer" className="size-11 rounded-xl bg-soft grid place-items-center shrink-0"><Icon name="x" /></button>}
      </div>
      {!env.saving && (
        <div>
          <p className="flex items-baseline justify-between"><span className={`font-display text-3xl font-medium tabular-nums ${warn ? 'text-danger' : ''}`}>{da(left)}</span><span className="text-sm text-muted">restent sur {fmt(env.budget)}</span></p>
          <div className="h-2 rounded-full bg-soft mt-2"><div className="h-2 rounded-full" style={{ width: `${100 - pct}%`, background: warn ? 'var(--danger)' : env.color }} /></div>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 bg-soft rounded-2xl pl-4 pr-1.5 py-1.5">
        <span className="text-sm font-semibold">Budget du mois</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setBudget(env.budget - 500)} aria-label="Retirer 500 DA" className="size-11 rounded-xl bg-card grid place-items-center text-lg font-semibold">−</button>
          <label className="sr-only" htmlFor={`b-${env.id}`}>Budget du mois en dinars</label>
          <input id={`b-${env.id}`} inputMode="numeric" value={fmt(env.budget)} onChange={(e) => setBudget(parseInt(e.target.value.replace(/\D/g, '') || '0', 10))} className="w-24 h-11 text-center font-semibold bg-transparent tabular-nums" />
          <button onClick={() => setBudget(env.budget + 500)} aria-label="Ajouter 500 DA" className="size-11 rounded-xl bg-card grid place-items-center text-lg font-semibold">+</button>
        </div>
      </div>
      {env.saving ? <p className="text-sm text-muted">Cette somme ne compte pas dans ce que tu peux dépenser.</p>
        : groups.length ? (
          <div className="flex flex-col gap-3 overflow-auto min-h-0 -mx-1 px-1">
            {groups.map((g) => { const d = parseISO(g.d); return (
              <section key={g.d}>
                <h3 className="flex justify-between text-xs font-semibold text-muted py-1.5"><span>{cap(DAYS[d.getDay()])} {d.getDate()} {MONTHS[d.getMonth()]}</span><span className="tabular-nums">−{da(g.items.reduce((s, x) => s + x.amt, 0))}</span></h3>
                <ul className="m-0 p-0 list-none">
                  {g.items.map((x) => (
                    <li key={x.id} className="flex items-center gap-3 py-2 border-b border-line last:border-0">
                      <span className="flex-1 min-w-0"><span className="block font-semibold text-sm truncate">{x.label}</span><span className="block text-xs text-muted">{x.t}, {x.pay.toLowerCase()}</span></span>
                      <span className="font-display font-medium tabular-nums whitespace-nowrap">−{da(x.amt)}</span>
                      <button onClick={() => api.removeTx(x.id)} aria-label={`Supprimer ${x.label}`} className="size-11 -mr-2 grid place-items-center text-muted"><Icon name="trash" size={17} /></button>
                    </li>
                  ))}
                </ul>
              </section>
            ) })}
          </div>
        ) : <p className="text-sm text-muted">Aucune dépense ce mois-ci dans cette enveloppe. Tape une dépense plus haut pour la remplir.</p>}
    </div>
  )
}

export default function Envelopes({ S, update, api }) {
  const [sel, setSel] = useState('courses')
  const [sheet, setSheet] = useState(false)   // sur téléphone : la feuille de détail est ouverte
  const st = monthStats(S), prefix = iso(today()).slice(0, 7)
  const env = S.envelopes.find((e) => e.id === sel)
  const list = S.tx.filter((x) => x.cat === sel && x.d.startsWith(prefix)).sort((a, b) => (a.d + a.t < b.d + b.t ? 1 : -1))
  const free = S.income - S.envelopes.reduce((s, e) => s + e.budget, 0)   // revenu pas encore réparti

  return (
    <div className="flex flex-col gap-4">
      <header><p className="text-sm text-muted">{MONTHS[today().getMonth()]} · revenu {da(S.income)}</p><h1 className="font-display text-2xl md:text-3xl font-bold">Enveloppes</h1></header>

      <section className="bg-card rounded-3xl p-4"><QuickAdd S={S} onAdd={api.addTx} /></section>

      {free !== 0 && (
        <p className={`rounded-2xl px-4 py-3 text-sm font-semibold ${free > 0 ? 'bg-accentsoft text-accent' : 'bg-soft text-danger'}`}>
          {free > 0 ? `Il te reste ${da(free)} à répartir dans tes enveloppes.` : `Tes enveloppes dépassent ton revenu de ${da(-free)}.`}</p>
      )}

      <div className="grid gap-4 md:grid-cols-[1.5fr_1fr] md:items-start">
        <div className="flex flex-col gap-4 min-w-0">
          <div className="grid grid-cols-2 gap-3">
            {S.envelopes.map((e) => <EnvCard key={e.id} e={e} spent={st.byEnv[e.id] || 0} selected={sel === e.id} onClick={() => { setSel(e.id); setSheet(true) }} />)}
          </div>
          <FixedManager S={S} update={update} api={api} />
          <Goals S={S} update={update} api={api} />
          {S.zakat.on && <ZakatCard S={S} update={update} />}
        </div>
        <aside className="hidden md:flex bg-card rounded-3xl p-5 flex-col sticky top-6 max-h-[calc(100vh-3rem)]">
          <Detail env={env} spent={st.byEnv[env.id] || 0} list={list} update={update} api={api} />
        </aside>
      </div>

      {sheet && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/45 flex items-end" onClick={() => setSheet(false)}>
          <div role="dialog" aria-modal="true" aria-label={`Détail : ${env.name}`} onClick={(e) => e.stopPropagation()}
            className="w-full max-h-[86vh] bg-card rounded-t-[1.75rem] px-5 pt-2 pb-8 flex flex-col">
            <span aria-hidden="true" className="self-center w-10 h-1.5 rounded-full bg-line mb-4" />
            <Detail env={env} spent={st.byEnv[env.id] || 0} list={list} update={update} api={api} onClose={() => setSheet(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
