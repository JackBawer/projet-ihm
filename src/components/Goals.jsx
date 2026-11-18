import { useState } from 'react'
import Icon from './Icon.jsx'
import { goalStatus, sortGoals, GOAL_COLORS } from '../lib/goals.js'
import { da, fmt, MONTHS, today, iso } from '../lib/dates.js'

const monthName = (d) => `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
const field = 'h-11 px-3 rounded-xl border border-line bg-sand text-ink w-full'
const num = (v) => parseInt(String(v).replace(/\D/g, '') || '0', 10)

function GoalForm({ onSave, onCancel }) {
  const t = today()
  const [f, setF] = useState({ name: '', target: '', monthly: '', deadline: iso(new Date(t.getFullYear(), t.getMonth() + 7, 0)).slice(0, 7) })
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: k === 'name' || k === 'deadline' ? e.target.value : e.target.value.replace(/\D/g, '') })
  const submit = (e) => {
    e.preventDefault()
    if (!f.name.trim()) return setError('Donne un nom à ton objectif.')
    if (num(f.target) <= 0) return setError('Indique le montant à atteindre.')
    if (f.deadline <= iso(t).slice(0, 7)) return setError('Choisis une date dans le futur.')
    const [y, m] = f.deadline.split('-').map(Number)
    onSave({ name: f.name.trim(), target: num(f.target), monthly: num(f.monthly), deadline: iso(new Date(y, m, 0)), saved: 0 })
  }
  return (
    <form onSubmit={submit} className="bg-card rounded-3xl p-4 md:p-5 grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-sm font-semibold sm:col-span-2">Nom<input className={field} value={f.name} onChange={set('name')} placeholder="Ordinateur, voyage, permis…" /></label>
      <label className="grid gap-1 text-sm font-semibold">Montant à atteindre (DA)<input className={field} inputMode="numeric" value={f.target} onChange={set('target')} /></label>
      <label className="grid gap-1 text-sm font-semibold">Avant (mois)<input type="month" className={field} value={f.deadline} onChange={set('deadline')} /></label>
      <label className="grid gap-1 text-sm font-semibold sm:col-span-2">Je compte mettre de côté par mois (DA)<input className={field} inputMode="numeric" value={f.monthly} onChange={set('monthly')} placeholder="facultatif" /></label>
      {error && <p role="alert" className="text-sm font-semibold text-danger sm:col-span-2">{error}</p>}
      <div className="flex gap-2 sm:col-span-2">
        <button className="h-11 px-4 rounded-xl bg-ink text-sand font-semibold text-sm">Créer l'objectif</button>
        <button type="button" onClick={onCancel} className="h-11 px-4 rounded-xl border border-line font-semibold text-sm">Annuler</button>
      </div>
    </form>
  )
}

function GoalCard({ g, update, api }) {
  const st = goalStatus(g)
  const [adding, setAdding] = useState(false)
  const [amt, setAmt] = useState('')
  const edit = (fn) => update((s) => fn(s.goals.find((x) => x.id === g.id)))
  const addPayment = (e) => {
    e.preventDefault()
    const a = num(amt); if (a <= 0) return
    edit((x) => { x.saved += a })
    setAmt(''); setAdding(false)
    api.toast(`${da(a)} ajoutés à « ${g.name} »`, () => edit((x) => { x.saved -= a }))
  }
  const remove = () => {
    update((s) => { s.goals = s.goals.filter((x) => x.id !== g.id) })
    api.toast(`Objectif « ${g.name} » supprimé`, () => update((s) => { s.goals.push(g) }))
  }
  const badge = st.done ? ['atteint', 'bg-accentsoft text-accent'] : st.late ? ['en retard', 'bg-[#FFEDD5] text-[#9A3412] dark:bg-warn/20 dark:text-warn'] : ['dans les temps', 'bg-accentsoft text-accent']
  return (
    <article className="bg-card rounded-3xl p-4 md:p-5 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className="size-10 rounded-xl grid place-items-center shrink-0" style={{ background: `${g.color}1F`, color: g.color }}><Icon name="piggy" size={20} /></span>
        <div className="flex-1 min-w-0"><h3 className="font-bold">{g.name}</h3><p className="text-sm text-muted">avant {monthName(st.dl)}</p></div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${badge[1]}`}>{badge[0]}</span>
      </div>
      <div>
        <p className="flex items-baseline justify-between gap-3"><span className="font-display text-2xl font-bold whitespace-nowrap">{da(g.saved)}</span><span className="text-sm text-muted whitespace-nowrap">sur {fmt(g.target)} · {st.pct} %</span></p>
        <div className="h-3 rounded-full bg-soft mt-2 overflow-hidden"><div className="h-3 rounded-full" style={{ width: `${st.pct}%`, background: g.color }} /></div>
      </div>
      <p className="text-sm leading-snug">
        {st.done ? <>Objectif atteint. Bravo.</>
          : !g.monthly ? <>Pour l'atteindre à temps, mets de côté <strong>{da(st.need)} par mois</strong>.</>
          : <>À ton rythme ({da(g.monthly)} par mois), tu l'atteins en <strong>{monthName(st.reach)}</strong>.{st.late ? <> Pour tenir la date, il faudrait <strong>{da(st.need)} par mois</strong>.</> : <> C'est avant la date prévue.</>}</>}
      </p>
      {adding ? (
        <form onSubmit={addPayment} className="flex gap-2">
          <label htmlFor={`v-${g.id}`} className="sr-only">Montant du versement en dinars</label>
          <input id={`v-${g.id}`} autoFocus inputMode="numeric" value={amt} onChange={(e) => setAmt(e.target.value.replace(/\D/g, ''))} placeholder="Montant en DA" className={`${field} flex-1 min-w-0`} />
          <button className="h-11 px-4 rounded-xl bg-ink text-sand font-semibold text-sm">Ajouter</button>
          <button type="button" onClick={() => setAdding(false)} aria-label="Annuler le versement" className="size-11 rounded-xl border border-line grid place-items-center shrink-0"><Icon name="x" size={18} /></button>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {!st.done && <button onClick={() => setAdding(true)} className="h-11 px-4 rounded-xl bg-ink text-sand font-semibold text-sm">Ajouter un versement</button>}
          {!st.done && st.late && <button onClick={() => { const old = g.monthly; edit((x) => { x.monthly = st.need }); api.toast(`Rythme passé à ${da(st.need)} par mois`, () => edit((x) => { x.monthly = old })) }} className="h-11 px-4 rounded-xl border-2 border-ink font-semibold text-sm">Passer à {fmt(st.need)} DA/mois</button>}
          <button onClick={remove} aria-label={`Supprimer l'objectif ${g.name}`} className="size-11 ml-auto grid place-items-center text-muted hover:text-danger"><Icon name="trash" size={18} /></button>
        </div>
      )}
    </article>
  )
}

export default function Goals({ S, update, api }) {
  const [creating, setCreating] = useState(() => consumeCreate())
  const goals = sortGoals(S.goals || [])
  const save = (g) => {
    update((s) => { s.goals = s.goals || []; s.goals.push({ ...g, id: Date.now(), color: GOAL_COLORS[s.goals.length % GOAL_COLORS.length] }) })
    setCreating(false); api.toast(`Objectif « ${g.name} » créé`)
  }
  return (
    <section id="objectifs" className="flex flex-col gap-3 scroll-mt-6" aria-label="Objectifs d'épargne">
      <div className="flex items-baseline justify-between"><h2 className="font-bold">Objectifs d'épargne</h2>
        {!creating && <button onClick={() => setCreating(true)} className="h-11 text-sm font-semibold text-accent">Nouvel objectif</button>}</div>
      {creating && <GoalForm onSave={save} onCancel={() => setCreating(false)} />}
      {goals.length === 0 && !creating && <p className="bg-card rounded-3xl p-4 text-sm text-muted">Aucun objectif pour l'instant. Crée-en un pour suivre ce que tu mets de côté.</p>}
      {goals.map((g) => <GoalCard key={g.id} g={g} update={update} api={api} />)}
    </section>
  )
}

// Aperçu pour l'accueil : jusqu'à 3 objectifs en cours, avec leur barre.
// Sans objectif, la carte invite à en créer un au lieu de disparaître.
let createOnOpen = false   // demande d'ouvrir directement le formulaire en arrivant sur les objectifs
export const askCreateGoal = () => { createOnOpen = true }

export function GoalPeek({ S, onOpen, className = '' }) {
  const goals = sortGoals((S.goals || []).filter((g) => g.saved < g.target))
  if (!goals.length) return (
    <section className={`bg-card rounded-3xl p-4 md:p-5 flex-col gap-3 ${className}`}>
      <h2 className="font-bold flex items-center gap-2"><Icon name="piggy" size={18} className="text-accent" />Objectifs d'épargne</h2>
      <p className="text-sm text-muted">Aucun objectif pour l'instant. Un ordinateur, un voyage, le permis : fixe un montant et une date, EcoBudget te dit combien mettre de côté chaque mois.</p>
      <button onClick={() => { askCreateGoal(); onOpen() }} className="self-start h-11 px-4 rounded-xl bg-ink text-sand font-semibold text-sm">Créer un objectif</button>
    </section>
  )
  const shown = goals.slice(0, 3), more = goals.length - shown.length
  return (
    <section className={`bg-card rounded-3xl p-4 md:p-5 flex-col gap-3 ${className}`}>
      <div className="flex items-baseline justify-between gap-3"><h2 className="font-bold">Objectifs d'épargne</h2>
        <button onClick={onOpen} className="h-11 -my-3 text-sm font-semibold text-accent">{more > 0 ? `Voir les ${goals.length}` : 'Voir tout'}</button></div>
      <ul className="m-0 p-0 list-none flex flex-col gap-3">
        {shown.map((g) => { const st = goalStatus(g); return (
          <li key={g.id} className="flex flex-col gap-1.5">
            <span className="flex items-baseline justify-between gap-3">
              <span className="text-sm min-w-0"><span className="font-semibold">{g.name}</span><span className={st.late ? 'text-warn' : 'text-muted'}> · {st.late ? 'en retard' : 'dans les temps'}</span></span>
              <span className="font-display font-bold">{st.pct} %</span>
            </span>
            <span className="block h-2.5 rounded-full bg-soft overflow-hidden"><span className="block h-2.5 rounded-full" style={{ width: `${st.pct}%`, background: g.color }} /></span>
          </li>
        ) })}
      </ul>
    </section>
  )
}

export const consumeCreate = () => { const v = createOnOpen; createOnOpen = false; return v }
