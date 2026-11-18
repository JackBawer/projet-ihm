import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import { freshState } from '../lib/store.js'
import { buildEnvelopes } from '../lib/categories.js'
import { fmt } from '../lib/dates.js'

const STEPS = [
  { q: 'Tu es plutôt…', hint: 'Juste pour te proposer un point de départ.', options: [['boursier', 'Étudiant boursier'], ['job', 'Étudiant avec un petit boulot'], ['salarie', 'Salarié']] },
  { q: 'Tu reçois combien par mois, à peu près ?', hint: 'Bourse, salaire, argent de poche… Tu pourras changer plus tard.', options: [[15000, 'Moins de 20 000 DA'], [36000, '20 000 à 40 000 DA'], [55000, '40 000 à 70 000 DA'], [80000, 'Plus de 70 000 DA']] },
  { q: 'Tu veux commencer comment ?', hint: 'Les données d\'exemple permettent de voir tout de suite les alertes et l\'historique.', options: [[true, "Avec des données d'exemple"], [false, 'Avec un compte vide']] },
]
const GUESS = { boursier: 15000, job: 36000, salarie: 55000 }

// Démarrage sans formulaire : 3 questions à choix, un bouton « Passer », et les enveloppes sont prêtes.
export default function Onboarding({ update }) {
  const [step, setStep] = useState(0)
  const [ans, setAns] = useState([null, 36000, true])
  const [exact, setExact] = useState('')   // montant exact tapé par l'utilisateur (prioritaire sur les tranches)
  const finish = (income, demo) => update((s) => { Object.assign(s, freshState(income, demo), { onboarded: true }) })
  const cur = STEPS[step]
  const pick = (v) => { const a = [...ans]; a[step] = v; if (step === 0) a[1] = GUESS[v]; if (step === 1) setExact(''); setAns(a) }
  const typeExact = (v) => { const d = v.replace(/\D/g, '').slice(0, 9); setExact(d); const a = [...ans]; a[1] = parseInt(d || '0', 10); setAns(a) }
  const canGo = step === 1 ? ans[1] > 0 : ans[step] !== null

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto px-5 pt-10 pb-8 gap-5">
      <div className="flex items-center gap-3">
        <div role="img" aria-label={`Étape ${step + 1} sur 3`} className="flex-1 grid grid-cols-3 gap-1.5">{[0, 1, 2].map((i) => <span key={i} className={`h-1.5 rounded ${i <= step ? 'bg-accent' : 'bg-line'}`} />)}</div>
        <button onClick={() => finish(36000, true)} className="h-11 px-2 text-muted font-semibold">Passer</button>
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-bold text-accent">Question {step + 1} sur 3</p>
        <h1 className="font-display text-3xl font-bold leading-tight">{cur.q}</h1>
        <p className="text-sm text-muted">{cur.hint}</p>
      </div>
      <div className="flex flex-col gap-2.5">
        {cur.options.map(([v, l]) => {
          const on = ans[step] === v && !(step === 1 && exact)
          return (
            <button key={String(v)} onClick={() => pick(v)} aria-pressed={on}
              className={`h-14 rounded-2xl px-4 flex items-center justify-between text-left ${on ? 'border-2 border-accent bg-accentsoft font-bold' : 'border border-line bg-card font-medium'}`}>
              {l}<span className={`size-6 rounded-full grid place-items-center ${on ? 'bg-accent text-white dark:text-black' : 'border-2 border-line'}`}>{on && <Icon name="check" size={14} stroke={3.2} />}</span>
            </button>
          )
        })}
      </div>
      {step === 1 && (
        <label className="flex flex-col gap-1.5 text-sm font-semibold">Ou ton montant exact
          <span className={`h-14 rounded-2xl px-4 flex items-center gap-2 bg-card ${exact ? 'border-2 border-accent' : 'border border-line'}`}>
            <input inputMode="numeric" value={exact ? fmt(+exact) : ''} onChange={(e) => typeExact(e.target.value)} placeholder="par exemple 120 000"
              className="flex-1 min-w-0 bg-transparent outline-none text-base font-semibold text-ink placeholder:text-muted placeholder:font-normal" />
            <span className="text-muted">DA par mois</span>
          </span>
        </label>
      )}
      {step === 1 && ans[1] > 0 && (
        <div className="bg-card rounded-3xl p-4 flex flex-col gap-2.5">
          <p className="text-sm font-bold flex items-center gap-1.5"><Icon name="spark" size={16} className="text-accent" />Tes enveloppes de départ, déjà prêtes</p>
          <div className="grid grid-cols-2 gap-2">
            {buildEnvelopes(ans[1]).map((e) => (
              <span key={e.id} className="flex items-center gap-2 bg-sand rounded-xl px-2.5 py-2 text-sm"><span style={{ color: e.color }}><Icon name={e.icon} size={16} /></span><span className="flex-1">{e.name}</span><strong>{fmt(e.budget)}</strong></span>
            ))}
          </div>
        </div>
      )}
      <div className="mt-auto flex gap-2.5">
        {step > 0 && <button onClick={() => setStep(step - 1)} className="h-14 px-5 rounded-2xl border border-line bg-card font-semibold">Retour</button>}
        <button disabled={!canGo} onClick={() => (step < 2 ? setStep(step + 1) : finish(ans[1], ans[2]))}
          className="flex-1 h-14 rounded-2xl bg-ink text-sand font-semibold disabled:opacity-40">{step < 2 ? 'Continuer' : 'Commencer'}</button>
      </div>
    </div>
  )
}
