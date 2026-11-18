import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import Battery from '../components/Battery.jsx'
import { monthStats } from '../lib/budget.js'
import { da, fmt, DAYS, parseISO, MONTHS } from '../lib/dates.js'

// Simulateur « Et si… » : montre l'effet d'un achat sur la batterie avant de le faire.
function EtSi({ S }) {
  const st = monthStats(S)
  const [amount, setAmount] = useState(10000)
  const [useSaving, setUseSaving] = useState(false)
  const pool = st.remaining + (useSaving ? st.saving : 0)
  const after = pool - amount
  const perDay = Math.max(0, after / st.daysLeft)
  const pct = Math.max(0, Math.min(100, (after / (st.spendable + (useSaving ? st.saving : 0))) * 100))
  const ratio = pct / 100 / (st.daysLeft / st.dim)
  const level = after <= 0 ? 'low' : ratio >= 0.8 ? 'good' : ratio >= 0.5 ? 'mid' : 'low'
  const months = st.saving > 0 ? Math.ceil(amount / st.saving) : null
  return (
    <section aria-label="Simulateur Et si" className="bg-[#3A4256] text-white rounded-[1.75rem] p-5 md:p-6 flex flex-col gap-4">
      <h2 className="font-display text-2xl font-bold">Et si j'achetais…</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/10 rounded-2xl p-3.5 flex items-center gap-3"><Battery pct={st.pct} level={st.level} size={48} />
          <div><p className="text-xs opacity-75">Aujourd'hui</p><p className="font-display text-2xl font-extrabold whitespace-nowrap">{da(st.perDay)}</p><p className="text-xs opacity-75">par jour</p></div></div>
        <div className="bg-white text-[#1B1A17] rounded-2xl p-3.5 flex items-center gap-3"><Battery pct={pct} level={level} size={48} />
          <div><p className="text-xs text-[#5E5A52]">Après l'achat</p><p className={`font-display text-2xl font-extrabold whitespace-nowrap ${level === 'low' ? 'text-[#B42318]' : ''}`}>{da(perDay)}</p><p className="text-xs text-[#5E5A52]">par jour</p></div></div>
      </div>
      <div className="bg-white text-[#1B1A17] rounded-2xl p-4 flex flex-col gap-2">
        <label htmlFor="etsi" className="flex justify-between items-baseline"><span className="text-sm text-[#5E5A52]">Montant simulé</span><span className="font-display text-2xl font-bold">{da(amount)}</span></label>
        <input id="etsi" type="range" min="0" max="70000" step="1000" value={amount} onChange={(e) => setAmount(+e.target.value)} className="w-full h-8" />
        <div className="flex justify-between text-xs text-[#5E5A52]"><span>0 DA</span><span>70 000 DA</span></div>
        <label className="flex items-center gap-2.5 text-sm font-semibold pt-1 min-h-11"><input type="checkbox" checked={useSaving} onChange={(e) => setUseSaving(e.target.checked)} className="size-5" />Utiliser aussi mon épargne du mois ({da(st.saving)})</label>
      </div>
      <p className="bg-white/10 rounded-2xl px-4 py-3 text-sm leading-relaxed" aria-live="polite">
        {amount === 0 ? 'Déplace le curseur pour simuler un achat.'
          : after < 0 ? <>Ça ne passe pas ce mois-ci : il te manquerait <strong>{da(-after)}</strong>.{months ? <> En mettant {da(st.saving)} de côté par mois, tu peux l'acheter dans <strong>{months} mois</strong> sans vider ta batterie.</> : null}</>
          : level === 'good' ? <>Ça passe : tu resterais dans les clous avec <strong>{da(perDay)}</strong> par jour.</>
          : <>Ça passe, mais c'est serré : il faudrait tenir avec <strong>{da(perDay)}</strong> par jour pendant {st.daysLeft} jours.</>}
      </p>
    </section>
  )
}

export default function Alerts({ S, api, found }) {
  const { alerts, expected, upcoming } = found
  const env = (id) => S.envelopes.find((e) => e.id === id)
  const when = (a) => `${DAYS[a.dow]} ${parseISO(a.date).getDate()} ${MONTHS[parseISO(a.date).getMonth()]}`
  return (
    <div className="flex flex-col gap-4">
      <header><p className="text-sm text-muted">Détection basée sur tes habitudes et sur les saisons</p><h1 className="font-display text-2xl md:text-3xl font-bold">Alertes et « Et si »</h1></header>
      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        <div className="flex flex-col gap-3 min-w-0">
          {alerts.length === 0 && <p className="bg-card rounded-3xl p-5 flex items-center gap-3"><Icon name="check" className="text-accent" />Aucune dépense inhabituelle ces 14 derniers jours.</p>}

          {alerts.map((a) => (
            <article key={a.key} className="bg-card rounded-3xl p-4 md:p-5 border-2 border-[#F3C9A8] dark:border-warn flex gap-3">
              <span className="size-10 rounded-xl bg-[#FFEDD5] text-[#C2410C] grid place-items-center shrink-0"><Icon name="alert" /></span>
              <div className="flex flex-col gap-2.5 min-w-0">
                <p className="text-sm font-semibold text-warn">{S.feedback[a.key] === 'surveille' ? 'À surveiller' : 'Dépense inhabituelle'}</p>
                <p className="font-bold leading-snug">{da(a.total)} en {env(a.cat).name.toLowerCase()} {when(a)}, {a.ratio.toFixed(1).replace('.', ',')}× ton {DAYS[a.dow]} habituel</p>
                <p className="self-start flex items-center gap-1.5 bg-soft rounded-lg px-2.5 py-1.5 text-xs text-muted"><Icon name="moon" size={14} />{a.season ? `Saison : ${a.season.name}` : 'Période normale · aucune saison en cours'}</p>
                <button onClick={() => api.openWhy(a)} className="self-start h-11 text-sm font-bold text-accent underline">Pourquoi cette alerte ?</button>
                {!S.feedback[a.key] && (
                  <>
                    <p className="text-sm font-semibold">C'était prévu ?</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => api.answer(a, 'prevu')} className="h-11 px-4 rounded-xl border-2 border-ink font-semibold text-sm">Oui, c'était prévu</button>
                      <button onClick={() => api.answer(a, 'surveille')} className="h-11 px-4 rounded-xl bg-ink text-sand font-semibold text-sm">Non, à surveiller</button>
                    </div>
                    <p className="text-xs text-muted">Ta réponse affine les prochaines alertes.</p>
                  </>
                )}
              </div>
            </article>
          ))}

          {expected.map((a) => (
            <article key={a.key} className="bg-card rounded-3xl p-4 md:p-5 border border-line flex gap-3">
              <span className="size-10 rounded-xl bg-accentsoft text-accent grid place-items-center shrink-0"><Icon name="check" /></span>
              <div className="flex flex-col gap-2 min-w-0">
                <p className="font-bold leading-snug">{env(a.cat).name} à {da(a.total)} le {when(a)} : pas d'alerte</p>
                <p className="text-sm text-muted">C'est {a.ratio.toFixed(1).replace('.', ',')}× ton {DAYS[a.dow]} habituel ({fmt(a.avg)} DA), mais cette hausse est normale à cette période.</p>
                <p className="self-start flex items-center gap-1.5 bg-soft rounded-lg px-2.5 py-1.5 text-xs text-muted"><Icon name="moon" size={14} />Saison : {a.season.name}</p>
              </div>
            </article>
          ))}

          {upcoming && (
            <article className="bg-card rounded-3xl p-4 md:p-5 border border-line flex gap-3">
              <span className="size-10 rounded-xl bg-accentsoft text-accent grid place-items-center shrink-0"><Icon name="moon" /></span>
              <div className="flex flex-col gap-1.5">
                <p className="font-bold">{upcoming.season.name} dans {upcoming.days} jours</p>
                <p className="text-sm text-muted">Pendant cette période, EcoBudget relève le seuil d'alerte : une hausse normale ne te dérangera pas. Tu peux mettre un peu de côté d'ici là pour l'absorber.</p>
              </div>
            </article>
          )}
        </div>
        <EtSi S={S} />
      </div>
    </div>
  )
}
