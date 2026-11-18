import { useState, useEffect, useRef } from 'react'
import Battery from '../components/Battery.jsx'
import Icon from '../components/Icon.jsx'
import QuickAdd from '../components/QuickAdd.jsx'
import { GoalPeek } from '../components/Goals.jsx'
import { FixedUpcoming } from '../components/Fixed.jsx'
import useTween from '../components/useTween.js'
import DayList from '../components/DayList.jsx'
import { monthStats, dayTotal, dayLevel } from '../lib/budget.js'
import { iso, today, addDays, longDate, da, fmt, MONTHS, DAYS, cap } from '../lib/dates.js'

const HERO = {
  good: 'bg-[#DCEFE5] text-[#16261F] dark:bg-[#17352C] dark:text-white',
  mid: 'bg-[#FBEBCB] text-[#2B2210] dark:bg-[#3A2F14] dark:text-white',
  low: 'bg-[#3A4256] text-white',
}
const MSG = { good: 'tu es dans les clous', mid: 'tu vas un peu vite', low: 'mode économie' }

export function EnvCard({ e, spent, onClick, selected }) {
  const pct = e.budget ? Math.min(100, Math.round((spent / e.budget) * 100)) : 0
  const warn = !e.saving && pct >= 85
  return (
    <button onClick={onClick} aria-pressed={selected} className={`text-left bg-card rounded-3xl p-4 flex flex-col gap-2.5 min-w-0 ${selected ? 'ring-2 ring-ink' : ''}`}>
      <span className="flex items-center justify-between">
        <span className="size-9 rounded-xl grid place-items-center" style={{ background: `${e.color}22`, color: e.color }}><Icon name={e.icon} size={19} /></span>
        <span className={`text-xs font-semibold ${warn ? 'text-danger' : 'text-muted'}`}>{e.saving ? 'de côté' : `${pct} %`}</span>
      </span>
      <span className="flex flex-col">
        <span className="text-sm text-muted">{e.name}</span>
        <span className="font-display text-xl font-bold whitespace-nowrap">{da(e.budget - spent)}</span>
        <span className="text-xs text-muted">{e.saving ? 'épargne du mois' : `restent sur ${fmt(e.budget)}`}</span>
      </span>
      {!e.saving && <span className="h-2 rounded bg-soft"><span className="block h-2 rounded" style={{ width: `${pct}%`, background: warn ? 'var(--danger)' : e.color }} /></span>}
    </button>
  )
}

export function TxRow({ x, S, onDelete }) {
  const e = S.envelopes.find((v) => v.id === x.cat)
  return (
    <li className="flex items-center gap-3 py-2.5 border-b border-line last:border-0">
      <span className="size-9 rounded-xl grid place-items-center" style={{ background: `${e.color}22`, color: e.color }}><Icon name={e.icon} size={18} /></span>
      <span className="flex flex-col flex-1 min-w-0"><span className="font-semibold text-sm truncate">{x.label}</span><span className="text-xs text-muted">{e.name} · {x.t} · {x.pay}</span></span>
      <span className="font-display font-bold whitespace-nowrap">−{da(x.amt)}</span>
      {onDelete && <button onClick={() => onDelete(x.id)} aria-label={`Supprimer ${x.label}`} className="size-11 -mr-2 grid place-items-center text-muted hover:text-danger"><Icon name="trash" size={18} /></button>}
    </li>
  )
}

export default function Home({ S, update, api }) {
  const [showAll, setShowAll] = useState(false)
  const t = today(), st = monthStats(S)
  // La batterie se vide (ou se recharge) en direct : les chiffres glissent vers leur nouvelle valeur.
  const shownPct = useTween(st.pct), shownPerDay = useTween(st.perDay)
  const prev = useRef(st.remaining)
  const [delta, setDelta] = useState(null)   // « −300 DA » affiché un instant à côté de la batterie
  useEffect(() => {
    const d = st.remaining - prev.current
    prev.current = st.remaining
    if (!d) return
    setDelta({ d, key: Date.now() })
    const id = setTimeout(() => setDelta(null), 2600)
    return () => clearTimeout(id)
  }, [st.remaining])
  const eco = st.level === 'low' && S.settings.eco && !showAll   // adaptabilité : l'écran se simplifie quand ça va mal
  const todayTx = S.tx.filter((x) => x.d === iso(t)).reverse()
  const spentToday = todayTx.reduce((s, x) => s + x.amt, 0)
  const week = [...Array(7)].map((_, i) => { const d = addDays(t, i - 6); return { d, ...dayLevel(dayTotal(S, iso(d)), st.baseDaily), total: dayTotal(S, iso(d)) } })
  const saveEnv = S.envelopes.find((e) => e.saving)
  // Ouvre l'onglet Enveloppes directement sur les objectifs
  const openGoals = () => { api.go('env'); setTimeout(() => document.getElementById('objectifs')?.scrollIntoView({ behavior: 'smooth' }), 50) }

  return (
    <div className="flex flex-col gap-4">
      <header><p className="text-sm text-muted">{longDate(t)}</p><h1 className="font-display text-2xl md:text-3xl font-bold">{st.level === 'low' ? 'Courage, ça va remonter.' : 'Salam, voici ta batterie.'}</h1></header>

      {/* Sur mobile : batterie, saisie, enveloppes. Sur PC : la saisie passe dans la colonne de droite. */}
      <div className="grid gap-4 md:grid-cols-[1.6fr_1fr] md:grid-rows-[auto_1fr] md:items-start">
          <section aria-label="Batterie du budget" className={`md:col-start-1 min-w-0 rounded-[1.75rem] p-5 md:p-7 flex flex-col gap-4 ${HERO[st.level]}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-3 min-w-0">
                <span className="self-start text-xs md:text-sm font-bold bg-white/70 dark:bg-white/15 text-ink dark:text-white px-3 py-1.5 rounded-full">
                  {Math.round(st.pct)} % · {MSG[st.level]}</span>
                <div>
                  <p className="text-sm md:text-base opacity-80">Tu peux dépenser</p>
                  <p className="font-display font-extrabold leading-none tracking-tight text-6xl md:text-8xl whitespace-nowrap">{fmt(shownPerDay)}<span className="text-2xl md:text-4xl font-bold"> DA</span></p>
                  <p className="text-sm md:text-base opacity-80">par jour, jusqu'au {st.dim} {MONTHS[t.getMonth()]}</p>
                </div>
              </div>
              <div className="relative shrink-0">
                <Battery vertical pct={shownPct} level={st.level} size={150} />
                {delta && <span key={delta.key} role="status" className={`absolute -top-2 right-0 md:-right-2 px-2.5 py-1 rounded-full text-sm font-bold shadow-sm whitespace-nowrap animate-[pop_2.6s_ease-out_forwards] ${delta.d < 0 ? 'bg-[#B42318] text-white' : 'bg-[#1E9E6A] text-white'}`}>{delta.d < 0 ? '−' : '+'}{da(Math.abs(delta.d))}</span>}
              </div>
            </div>
            <p className="text-sm rounded-xl px-3 py-2 bg-black/10 dark:bg-black/25">
              {st.remaining <= 0 ? 'Le budget du mois est épuisé.'
                : st.endDate ? <>Tu dépenses {da(st.rhythm)} par jour : à ce rythme, tu tiens jusqu'au <strong>{st.endDate.getDate()} {MONTHS[st.endDate.getMonth()]}</strong>.</>
                : <>À ton rythme actuel ({da(st.rhythm)} par jour), tu finis le mois avec environ <strong>{da(st.surplus)}</strong> d'avance.</>}
              {st.reserved > 0 && <> {da(st.reserved)} sont déjà réservés pour tes dépenses fixes.</>}
            </p>
            <div className="bg-white/70 dark:bg-white/10 rounded-2xl px-2 py-3 grid grid-cols-7 text-ink dark:text-white">
              {week.map((w) => (
                <div key={iso(w.d)} title={`${cap(DAYS[w.d.getDay()])} : ${da(w.total)}`} className="flex flex-col items-center gap-1 text-xs font-semibold">
                  <Battery pct={w.pct} level={w.level} size={34} /><span>{iso(w.d) === iso(t) ? 'Auj.' : cap(DAYS[w.d.getDay()]).slice(0, 3)}</span>
                  <span className="sr-only">{da(w.total)} dépensés</span>
                </div>
              ))}
            </div>
          </section>

          {eco ? (
            <section className="md:col-start-1 order-3 md:order-none flex flex-col gap-2">
              <h2 className="font-bold">Pour recharger</h2>
              {saveEnv && saveEnv.budget >= 2000 && (
                <button onClick={() => { update((s) => { s.envelopes.find((e) => e.saving).budget -= 2000; s.envelopes.find((e) => e.id === 'autres').budget += 2000 }); api.toast('2 000 DA déplacés depuis Épargne', () => update((s) => { s.envelopes.find((e) => e.saving).budget += 2000; s.envelopes.find((e) => e.id === 'autres').budget -= 2000 })) }}
                  className="text-left bg-card border border-line rounded-2xl px-4 py-3 flex items-center gap-3">
                  <span className="flex-1"><span className="block font-semibold text-sm">Prendre 2 000 DA sur Épargne</span><span className="block text-sm font-bold text-accent">Tu passes à {da((st.remaining + 2000) / st.daysLeft)} par jour</span></span><Icon name="right" className="text-muted" /></button>
              )}
              <button onClick={() => api.go('hist')} className="text-left bg-card border border-line rounded-2xl px-4 py-3 flex items-center gap-3">
                <span className="flex-1"><span className="block font-semibold text-sm">Voir où est parti l'argent</span><span className="block text-sm font-bold text-accent">Historique du mois</span></span><Icon name="right" className="text-muted" /></button>
              <FixedUpcoming S={S} update={update} api={api} wide className="hidden md:flex mt-1" />
              <p className="text-sm text-muted">Les enveloppes sont masquées pour aller à l'essentiel. <button onClick={() => setShowAll(true)} className="font-bold text-accent underline">Tout afficher</button></p>
            </section>
          ) : (
            <section className="md:col-start-1 order-3 md:order-none flex flex-col gap-3">
              <div className="flex items-baseline justify-between"><h2 className="font-bold">Tes enveloppes</h2><button onClick={() => api.go('env')} className="h-11 text-sm font-semibold text-accent">Tout voir</button></div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {S.envelopes.filter((e) => !e.saving).map((e) => <EnvCard key={e.id} e={e} spent={st.byEnv[e.id] || 0} onClick={() => api.go('env')} />)}
              </div>
              <GoalPeek S={S} onOpen={openGoals} className="flex md:hidden mt-1" />
              <FixedUpcoming S={S} update={update} api={api} wide className="hidden md:flex mt-1" />
            </section>
          )}

        <aside className="order-2 md:order-none md:col-start-2 md:row-start-1 md:row-span-2 flex flex-col gap-4 min-w-0">
          <section className="bg-card rounded-3xl p-4 md:p-5 flex flex-col gap-3">
            <h2 className="font-bold">Ajouter une dépense</h2>
            <QuickAdd S={S} onAdd={api.addTx} />
          </section>
          <section className="bg-card rounded-3xl p-4 md:p-5">
            <div className="flex items-baseline justify-between"><h2 className="font-bold">Aujourd'hui</h2><span className="text-sm text-muted">{spentToday ? `−${da(spentToday)}` : da(0)}</span></div>
            {todayTx.length ? <DayList items={todayTx} S={S} onDelete={api.removeTx} />
              : <p className="text-sm text-muted py-3">Aucune dépense aujourd'hui. Tape « café 50 » pour essayer.</p>}
            <p className="mt-3 rounded-2xl px-3.5 py-3 text-sm bg-accentsoft text-accent font-semibold flex items-center gap-2"><Icon name="check" size={16} stroke={2.6} />
              À partir de maintenant : {da(st.perDay)} par jour</p>
          </section>
          <FixedUpcoming S={S} update={update} api={api} className="flex md:hidden" />
          {!eco && <GoalPeek S={S} onOpen={openGoals} className="hidden md:flex" />}
        </aside>
      </div>
    </div>
  )
}
