import { useState, useMemo } from 'react'
import Icon from './Icon.jsx'
import { parseExpense } from '../lib/parser.js'
import { da, iso, today, addDays } from '../lib/dates.js'

const dayWord = (d) => (d === iso(today()) ? "Aujourd'hui" : d === iso(addDays(today(), -1)) ? 'Hier' : 'Avant-hier')

// La saisie en une phrase : « taxi 300 ». C'est l'innovation principale côté charge de travail.
export default function QuickAdd({ S, onAdd }) {
  const [text, setText] = useState('')
  const [pending, setPending] = useState(null)   // question en attente : montant manquant ou montant suspect
  const [manual, setManual] = useState('')
  const live = useMemo(() => (text.trim() ? parseExpense(text, S) : null), [text, S])
  const envName = (id) => S.envelopes.find((e) => e.id === id)?.name
  const understood = live && (live.tx || live.draft)

  const done = (tx) => { onAdd(tx); setText(''); setPending(null); setManual('') }
  const submit = (e) => {
    e.preventDefault()
    const res = parseExpense(text, S)
    if (res.empty) return
    if (res.ok) done(res.tx)
    else setPending(res)
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={submit} className={`flex items-center gap-2 h-14 rounded-2xl bg-card border-2 pl-4 pr-1.5 focus-within:border-accent ${pending ? 'border-warn' : 'border-line'}`}>
        <label htmlFor="quick" className="sr-only">Ajouter une dépense en une phrase</label>
        <input id="quick" value={text} onChange={(e) => { setText(e.target.value); setPending(null) }} autoComplete="off"
          placeholder="« taxi 300 », « café 50 hier »…" className="flex-1 min-w-0 h-full bg-transparent outline-none focus-visible:outline-none text-base text-ink placeholder:text-muted" />
        <button type="submit" aria-label="Ajouter la dépense" className="size-11 rounded-xl bg-accent text-white dark:text-black grid place-items-center"><Icon name="send" stroke={2.4} /></button>
      </form>

      {!text && !pending && (
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1 [scrollbar-width:none]" aria-label="Dépenses fréquentes">
          {['café 50', 'taxi 300', 'pain 40', 'recharge 500'].map((q) => (
            <button key={q} type="button" onClick={() => setText(q)} className="h-10 px-3.5 rounded-full border border-line bg-sand text-sm font-semibold text-ink shrink-0">{q}</button>
          ))}
        </div>
      )}
      {understood && !pending && (
        <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted" aria-live="polite">
          <Icon name="spark" size={16} className="text-accent" /> Compris :
          {[envName(understood.cat), live.tx ? da(live.tx.amt) : 'montant ?', dayWord(understood.d), understood.pay].map((c, i) => (
            <span key={i} className={`px-2.5 py-1 rounded-full font-semibold ${i === 0 ? 'bg-accentsoft text-accent' : c === 'montant ?' ? 'bg-soft text-warn' : 'bg-soft text-ink'}`}>{c}</span>
          ))}
        </p>
      )}

      {pending?.need === 'amount' && (
        <div role="alert" className="flex flex-col gap-3">
          <p className="flex gap-2 font-semibold"><Icon name="info" className="text-warn mt-0.5" />Il manque le montant. Combien a coûté « {pending.draft.label} » ?</p>
          <div className="flex flex-wrap gap-2">
            {pending.suggestions.map((a) => (
              <button key={a} onClick={() => done({ ...pending.draft, amt: a })} className="h-11 px-4 rounded-full border border-line bg-card font-semibold">{da(a)}</button>
            ))}
            <form onSubmit={(e) => { e.preventDefault(); const a = parseInt(manual, 10); if (a > 0) done({ ...pending.draft, amt: a }) }} className="flex gap-2">
              <label htmlFor="manual" className="sr-only">Autre montant en dinars</label>
              <input id="manual" inputMode="numeric" value={manual} onChange={(e) => setManual(e.target.value.replace(/\D/g, ''))} placeholder="Autre montant"
                className="h-11 w-36 px-3 rounded-full border border-line bg-card outline-none" />
              <button className="h-11 px-4 rounded-full bg-ink text-sand font-semibold">OK</button>
            </form>
          </div>
        </div>
      )}

      {pending?.confirm && (
        <div role="alert" className="flex flex-col gap-3">
          <p className="flex gap-2"><Icon name="alert" className="text-warn mt-0.5" />
            <span><strong>{da(pending.tx.amt)} pour « {pending.tx.label} » ?</strong> D'habitude c'est autour de {da(pending.ref)}. Rien n'est enregistré tant que tu n'as pas choisi.</span></p>
          <div className="flex flex-wrap gap-2">
            {pending.suggest && <button onClick={() => done({ ...pending.tx, amt: pending.suggest })} className="h-11 px-4 rounded-xl bg-ink text-sand font-semibold">Corriger en {da(pending.suggest)}</button>}
            <button onClick={() => done(pending.tx)} className="h-11 px-4 rounded-xl border-2 border-ink font-semibold">Garder {da(pending.tx.amt)}</button>
            <button onClick={() => setPending(null)} className="h-11 px-4 rounded-xl text-muted font-semibold">Annuler</button>
          </div>
        </div>
      )}
    </div>
  )
}
