import { useState } from 'react'
import Icon from './Icon.jsx'
import { fixedThisMonth, monthKey } from '../lib/fixed.js'
import { da, fmt, iso, today } from '../lib/dates.js'

const when = (f) => f.paid ? 'payée' : f.late ? `prévue le ${f.day}, à confirmer` : f.inDays === 0 ? "aujourd'hui" : f.inDays === 1 ? 'demain' : `le ${f.day}, dans ${f.inDays} jours`

// Marque une dépense fixe comme payée : elle devient une vraie dépense du jour et n'est plus réservée.
export function usePay(S, update, api) {
  return (f) => {
    const key = monthKey(), id = Date.now()
    update((s) => {
      s.fixedPaid = s.fixedPaid || {}; s.fixedPaid[key] = [...(s.fixedPaid[key] || []), f.id]
      const now = new Date()
      s.tx.push({ id, d: iso(today()), t: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`, label: f.label, cat: f.cat, amt: f.amt, pay: 'Espèces', fixed: f.id })
    })
    api.toast(`${f.label} payé : ${da(f.amt)}`, () => update((s) => { s.fixedPaid[key] = s.fixedPaid[key].filter((x) => x !== f.id); s.tx = s.tx.filter((x) => x.id !== id) }))
  }
}

// Accueil : les dépenses fixes du mois qui ne sont pas encore payées.
export function FixedUpcoming({ S, update, api, className = '', wide = false }) {
  const pay = usePay(S, update, api)
  const list = fixedThisMonth(S).filter((f) => !f.paid)
  if (!(S.fixed || []).length) return null
  const total = list.reduce((s, f) => s + f.amt, 0)
  return (
    <section className={`bg-card rounded-3xl p-4 md:p-5 flex-col gap-2 ${className}`}>
      <div className="flex items-baseline justify-between gap-3"><h2 className="font-bold">Dépenses fixes à venir</h2>
        <button onClick={() => { api.go('env'); setTimeout(() => document.getElementById('fixes')?.scrollIntoView({ behavior: 'smooth' }), 50) }} className="h-11 -my-3 text-sm font-semibold text-accent">Gérer</button></div>
      {list.length ? (
        <>
          <p className="text-sm text-muted">{da(total)} déjà mis de côté sur ton budget du jour.</p>
          <ul className={`m-0 p-0 list-none ${wide ? 'grid grid-cols-2 gap-3 mt-1' : ''}`}>
            {list.map((f) => wide ? (
              <li key={f.id} className="flex items-center gap-3 rounded-2xl bg-sand pl-4 pr-2 py-2 min-w-0">
                <span className="flex-1 min-w-0">
                  <span className="flex items-baseline justify-between gap-2"><span className="text-sm font-semibold truncate">{f.label}</span><span className="font-display font-bold whitespace-nowrap">{da(f.amt)}</span></span>
                  <span className={`block text-xs truncate ${f.late ? 'text-warn font-semibold' : 'text-muted'}`}>{when(f)}</span>
                </span>
                <button onClick={() => pay(f)} className="h-11 px-3 rounded-xl border-2 border-ink text-sm font-semibold shrink-0">Payé</button>
              </li>
            ) : (
              <li key={f.id} className="flex items-center gap-3 py-2 border-b border-line last:border-0">
                <span className="flex-1 min-w-0"><span className="block text-sm font-semibold">{f.label}</span><span className={`block text-xs ${f.late ? 'text-warn font-semibold' : 'text-muted'}`}>{when(f)}</span></span>
                <span className="font-display font-bold whitespace-nowrap">{da(f.amt)}</span>
                <button onClick={() => pay(f)} className="h-11 px-3 rounded-xl border-2 border-ink text-sm font-semibold">Payé</button>
              </li>
            ))}
          </ul>
        </>
      ) : <p className="text-sm text-muted flex items-center gap-2"><Icon name="check" size={16} className="text-accent" />Toutes tes dépenses fixes du mois sont payées.</p>}
    </section>
  )
}

// Onglet Enveloppes : ajouter, voir et supprimer ses dépenses fixes.
export default function FixedManager({ S, update, api }) {
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ label: '', amt: '', day: '', cat: 'autres' })
  const [error, setError] = useState('')
  const pay = usePay(S, update, api)
  const list = fixedThisMonth(S)
  const envs = S.envelopes.filter((e) => !e.saving)
  const field = 'h-11 px-3 rounded-xl border border-line bg-sand text-ink w-full'
  const save = (e) => {
    e.preventDefault()
    const amt = parseInt(f.amt || '0', 10), day = parseInt(f.day || '0', 10)
    if (!f.label.trim()) return setError('Donne un nom à la dépense, par exemple « Internet ».')
    if (amt <= 0) return setError('Indique le montant.')
    if (day < 1 || day > 31) return setError('Choisis un jour du mois entre 1 et 31.')
    update((s) => { s.fixed = s.fixed || []; s.fixed.push({ id: Date.now(), label: f.label.trim(), amt, day, cat: f.cat }) })
    api.toast(`« ${f.label.trim()} » ajoutée : ${da(amt)} le ${day} de chaque mois`)
    setF({ label: '', amt: '', day: '', cat: 'autres' }); setError(''); setOpen(false)
  }
  const remove = (x) => {
    const old = (S.fixed || []).find((y) => y.id === x.id)
    update((s) => { s.fixed = s.fixed.filter((y) => y.id !== x.id) })
    api.toast(`« ${x.label} » supprimée`, () => update((s) => { s.fixed.push(old) }))
  }
  return (
    <section id="fixes" className="flex flex-col gap-3 scroll-mt-6" aria-label="Dépenses fixes">
      <div className="flex items-baseline justify-between"><h2 className="font-bold">Dépenses fixes</h2>
        {!open && <button onClick={() => setOpen(true)} className="h-11 text-sm font-semibold text-accent">Ajouter</button>}</div>
      <p className="text-sm text-muted -mt-2">Elles reviennent chaque mois. Leur montant est retiré d'avance de ce que tu peux dépenser, jusqu'à ce que tu les marques payées.</p>
      {open && (
        <form onSubmit={save} className="bg-card rounded-3xl p-4 md:p-5 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold sm:col-span-2">Nom<input className={field} value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder="Internet, loyer, salle de sport…" /></label>
          <label className="grid gap-1 text-sm font-semibold">Montant (DA)<input className={field} inputMode="numeric" value={f.amt} onChange={(e) => setF({ ...f, amt: e.target.value.replace(/\D/g, '') })} /></label>
          <label className="grid gap-1 text-sm font-semibold">Jour du mois<input className={field} inputMode="numeric" value={f.day} onChange={(e) => setF({ ...f, day: e.target.value.replace(/\D/g, '').slice(0, 2) })} placeholder="1 à 31" /></label>
          <label className="grid gap-1 text-sm font-semibold sm:col-span-2">Enveloppe
            <select className={field} value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })}>{envs.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
          {error && <p role="alert" className="text-sm font-semibold text-danger sm:col-span-2">{error}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <button className="h-11 px-4 rounded-xl bg-ink text-sand font-semibold text-sm">Ajouter la dépense fixe</button>
            <button type="button" onClick={() => { setOpen(false); setError('') }} className="h-11 px-4 rounded-xl border border-line font-semibold text-sm">Annuler</button>
          </div>
        </form>
      )}
      {list.length ? (
        <ul className="m-0 bg-card rounded-3xl px-4 md:px-5 py-1 list-none">
          {list.map((x) => { const env = S.envelopes.find((e) => e.id === x.cat); return (
            <li key={x.id} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0">
              <span className="size-9 rounded-xl grid place-items-center shrink-0" style={{ background: `${env?.color}22`, color: env?.color }}><Icon name={env?.icon || 'dots'} size={18} /></span>
              <span className="flex-1 min-w-0"><span className="block text-sm font-semibold">{x.label}</span><span className={`block text-xs ${x.late ? 'text-warn font-semibold' : 'text-muted'}`}>le {x.day} de chaque mois · {when(x)}</span></span>
              <span className="font-display font-bold whitespace-nowrap">{fmt(x.amt)} DA</span>
              {!x.paid && <button onClick={() => pay(x)} className="h-11 px-3 rounded-xl border-2 border-ink text-sm font-semibold">Payé</button>}
              <button onClick={() => remove(x)} aria-label={`Supprimer ${x.label}`} className="size-11 -mr-2 grid place-items-center text-muted hover:text-danger"><Icon name="trash" size={18} /></button>
            </li>
          ) })}
        </ul>
      ) : !open && <p className="bg-card rounded-3xl p-4 text-sm text-muted">Aucune dépense fixe. Ajoute ton abonnement internet ou ton loyer pour que ton budget du jour en tienne compte.</p>}
    </section>
  )
}
