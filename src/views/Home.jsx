import { useState, useEffect, useRef } from 'react'
import Battery from '../components/Battery.jsx'
import Icon from '../components/Icon.jsx'
import QuickAdd from '../components/QuickAdd.jsx'
import { GoalPeek } from '../components/Goals.jsx'
import { DayChart, EnvPlan, Kpi, Spark, monthDays } from '../components/HomeCards.jsx'
import { goalStatus } from '../lib/goals.js'
import { FixedUpcoming } from '../components/Fixed.jsx'
import useTween from '../components/useTween.js'
import DayList from '../components/DayList.jsx'
import FitAmount from '../components/FitAmount.jsx'
import { monthStats, dayTotal, dayLevel } from '../lib/budget.js'
import { iso, today, addDays, longDate, da, fmt, MONTHS, DAYS, cap } from '../lib/dates.js'

const HERO = { good: 'hero-good', mid: 'hero-mid', low: 'hero-low' }
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
  const openGoals = () => { api.go('env'); setTimeout(() => document.getElementById('objectifs')?.scrollIntoView({ behavior: 'smooth' }), 50) }
  // Chiffres clés : dépensé ce mois (courbe cumulée jour par jour) et mis de côté (avancée des objectifs).
  let run = 0
  const cumul = monthDays(S).map((d) => (run += d.total))
  const envSpent = S.envelopes.filter((e) => !e.saving).reduce((s, e) => s + (st.byEnv[e.id] || 0), 0)
  const goals = (S.goals || []).filter((g) => g.saved < g.target)
  const gSaved = goals.reduce((s, g) => s + g.saved, 0), gTarget = goals.reduce((s, g) => s + g.target, 0)
  const order = 'xl:order-none'

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-14 items-start">
      <header className={`order-0 md:col-span-2 xl:col-span-6 ${order}`}>
        <p className="text-sm text-muted">{longDate(t)}</p>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">{st.level === 'low' ? 'Courage, ça va remonter.' : 'Salut, voici ta batterie.'}</h1>
      </header>

      <section data-tour="quickadd" aria-label="Ajouter une dépense" className={`order-2 md:col-span-2 xl:col-span-8 xl:self-end bg-card border border-line rounded-3xl p-3.5 xl:p-0 xl:bg-transparent xl:border-0 ${order}`}>
        <h2 className="sr-only">Ajouter une dépense</h2>
        <QuickAdd S={S} onAdd={api.addTx} chipsClass="xl:hidden" />
      </section>

      <section data-tour="battery" aria-label="Batterie du budget" className={`hero ${HERO[st.level]} order-1 md:col-span-2 xl:col-span-6 xl:self-stretch min-w-0 rounded-[0.875rem] p-5 md:p-7 flex flex-col gap-4 ${order}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="@container flex-1 flex flex-col gap-3 min-w-0">
            <span className="self-start text-xs md:text-sm font-bold bg-hero-soft px-3 py-1.5 rounded-full">{Math.round(st.pct)} % · {MSG[st.level]}</span>
            <div>
              <p className="text-sm md:text-base text-hero-muted">Tu peux dépenser</p>
              <FitAmount value={shownPerDay} />
              <p className="text-sm md:text-base text-hero-muted mt-1">par jour, jusqu'au {st.dim} {MONTHS[t.getMonth()]}</p>
            </div>
          </div>
          <div className="relative shrink-0">
            <Battery vertical hero pct={shownPct} level={st.level} size={160} />
            {delta && <span key={delta.key} role="status" className={`absolute -top-2 right-0 md:-right-2 px-2.5 py-1 rounded-full text-sm font-bold shadow-sm whitespace-nowrap animate-[pop_2.6s_ease-out_forwards] ${delta.d < 0 ? 'bg-[#B42318] text-white' : 'bg-[#1E9E6A] text-white'}`}>{delta.d < 0 ? '−' : '+'}{da(Math.abs(delta.d))}</span>}
          </div>
        </div>
        <p className="text-sm leading-relaxed opacity-95">
          {st.remaining <= 0 ? 'Le budget du mois est épuisé.'
            : st.endDate ? <>À ton rythme ({da(st.rhythm)} par jour), tu tiens jusqu'au <strong>{st.endDate.getDate()} {MONTHS[st.endDate.getMonth()]}</strong>.</>
            : <>À ton rythme ({da(st.rhythm)} par jour), tu finis le mois avec environ <strong>{da(st.surplus)}</strong> d'avance.</>}
          {st.reserved > 0 && <> {da(st.reserved)} sont déjà réservés pour tes dépenses fixes.</>}
        </p>
        <div className="mt-auto pt-3.5 border-t border-hero-soft grid grid-cols-7">
          {week.map((w) => (
            <div key={iso(w.d)} title={`${cap(DAYS[w.d.getDay()])} : ${da(w.total)}`} className="flex flex-col items-center gap-1 text-xs font-semibold">
              <Battery hero pct={w.pct} level={w.level} size={32} /><span className="opacity-90">{iso(w.d) === iso(t) ? 'Auj.' : cap(DAYS[w.d.getDay()]).slice(0, 3)}</span>
              <span className="sr-only">{da(w.total)} dépensés</span>
            </div>
          ))}
        </div>
      </section>

      <div className={`order-3 md:col-span-2 xl:col-span-8 xl:self-stretch grid grid-cols-2 xl:grid-cols-1 xl:grid-rows-2 gap-3 xl:gap-4 ${order}`}>
        <Kpi icon="cart" color="#D9734E" label="Dépensé ce mois" value={envSpent}
          foot={`${Math.round((envSpent / Math.max(1, st.spendable)) * 100)} % du budget${spentToday ? ` · +${da(spentToday)} aujourd'hui` : ''}`}
          side={<Spark values={cumul} color="#D9734E" w={220} h={56} />} />
        <Kpi icon="piggy" color="var(--accent)" label="Mis de côté" value={st.saving}
          foot={`${Math.round((st.saving / Math.max(1, S.income)) * 100)} % de ton revenu${goals.length ? ` · ${goals.length} objectif${goals.length > 1 ? 's' : ''}` : ''}`}
          side={gTarget ? <div className="w-56"><p className="flex justify-between text-xs mb-1.5"><span className="text-muted">Objectifs atteints à</span><b>{Math.round((gSaved / gTarget) * 100)} %</b></p>
            <span className="seg">{Array.from({ length: 20 }, (_, i) => <i key={i} style={i < Math.round((gSaved / gTarget) * 20) ? { background: 'var(--accent)' } : undefined} />)}</span></div> : null} />
      </div>

      {eco ? (
        <section className={`order-4 md:col-span-2 xl:col-span-14 flex flex-col gap-2 ${order}`}>
          <h2 className="font-bold">Pour recharger</h2>
          {saveEnv && saveEnv.budget >= 2000 && (
            <button onClick={() => { update((s) => { s.envelopes.find((e) => e.saving).budget -= 2000; s.envelopes.find((e) => e.id === 'autres').budget += 2000 }); api.toast('2 000 DA déplacés depuis Épargne', () => update((s) => { s.envelopes.find((e) => e.saving).budget += 2000; s.envelopes.find((e) => e.id === 'autres').budget -= 2000 })) }}
              className="text-left bg-card border border-line rounded-2xl px-4 py-3 flex items-center gap-3">
              <span className="flex-1"><span className="block font-semibold text-sm">Prendre 2 000 DA sur Épargne</span><span className="block text-sm font-bold text-accent">Tu passes à {da((st.remaining + 2000) / st.daysLeft)} par jour</span></span><Icon name="right" className="text-muted" /></button>
          )}
          <button onClick={() => api.go('hist')} className="text-left bg-card border border-line rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="flex-1"><span className="block font-semibold text-sm">Voir où est parti l'argent</span><span className="block text-sm font-bold text-accent">Historique du mois</span></span><Icon name="right" className="text-muted" /></button>
          <p className="text-sm text-muted">Les enveloppes sont masquées pour aller à l'essentiel. <button onClick={() => setShowAll(true)} className="font-bold text-accent underline">Tout afficher</button></p>
        </section>
      ) : (
        <>
          <DayChart S={S} st={st} className={`hidden md:flex order-8 md:col-span-2 xl:col-span-6 xl:self-stretch ${order}`} />
          <EnvPlan S={S} st={st} onOpen={() => api.go('env')} className={`flex order-5 xl:col-span-4 xl:self-stretch ${order}`} />
          <GoalPeek S={S} onOpen={openGoals} className={`flex order-6 xl:col-span-4 xl:self-stretch ${order}`} />
        </>
      )}

      <section className={`order-4 md:col-span-2 xl:col-span-7 xl:self-stretch bg-card border border-line rounded-3xl p-5 flex flex-col ${order}`}>
        <div className="flex items-start justify-between gap-3">
          <div><h2 className="font-bold">Aujourd'hui</h2><p className="text-sm text-muted">{todayTx.length ? `${todayTx.length} dépense${todayTx.length > 1 ? 's' : ''} · ${da(spentToday)}` : 'Rien pour l\'instant'}</p></div>
          <button onClick={() => api.go('hist')} className="h-11 -my-2 text-sm font-semibold text-accent">Historique</button>
        </div>
        <div className="mt-2 flex-1">
          {todayTx.length ? <DayList items={todayTx} S={S} onDelete={api.removeTx} />
            : <p className="text-sm text-muted py-3">Aucune dépense aujourd'hui. Tape « café 50 » pour essayer.</p>}
        </div>
        <p className="mt-3 pt-3 border-t border-line text-sm text-accent font-semibold flex items-center gap-2"><Icon name="check" size={16} stroke={2.6} />
          À partir de maintenant : {da(st.perDay)} par jour</p>
      </section>
      <FixedUpcoming S={S} update={update} api={api} className={`flex order-7 md:col-span-2 xl:col-span-7 xl:self-stretch ${order}`} />
    </div>
  )
}
