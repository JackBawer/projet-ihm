import { zakatStatus, nextAidFitr } from '../lib/zakat.js'
import { da, MONTHS } from '../lib/dates.js'

const Num = ({ id, label, value, onChange }) => (
  <label htmlFor={id} className="flex items-center justify-between gap-3 text-sm">
    <span className="text-muted">{label}</span>
    <input id={id} inputMode="numeric" value={value || ''} placeholder="à saisir" onChange={(e) => onChange(parseInt(e.target.value.replace(/\D/g, '') || '0', 10))}
      className="h-11 w-32 px-3 rounded-xl border border-line bg-sand text-right font-semibold" />
  </label>
)

// Zakat : l'app aide à calculer, elle ne tranche pas. Les montants officiels changent chaque année,
// donc c'est l'utilisateur qui les saisit.
export default function ZakatCard({ S, update }) {
  const z = S.zakat, st = zakatStatus(z), aid = nextAidFitr()
  const set = (k) => (v) => update((s) => { s.zakat[k] = v })
  return (
    <section aria-labelledby="zakat-title" className="bg-card rounded-3xl p-5 flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="zakat-title" className="font-display text-lg font-medium">Zakat</h2>
        <span className="text-xs text-muted">estimation, vérifie auprès de ton imam</span>
      </div>
      <Num id="zk-sav" label="Ton épargne totale (DA)" value={z.savings} onChange={set('savings')} />
      <Num id="zk-nis" label="Nissab de l'année (DA)" value={z.nissab} onChange={set('nissab')} />
      <p className="text-sm leading-relaxed rounded-xl bg-soft px-3.5 py-3">
        {st.state === 'setup' && "Saisis le nissab annoncé cette année pour savoir si la zakat sur l'épargne te concerne."}
        {st.state === 'below' && <>Tu n'es pas concerné cette année : il manque <strong>{da(st.gap)}</strong> pour atteindre le nissab.</>}
        {st.state === 'due' && <>Ton épargne dépasse le nissab. Si elle y reste un an lunaire, la zakat serait d'environ <strong>{da(st.amount)}</strong> (2,5 %).</>}
      </p>
      <div className="border-t border-line pt-3 flex flex-col gap-2">
        <p className="text-sm font-semibold">Zakat el-Fitr{aid ? `, Aïd vers le ${aid.date.getDate()} ${MONTHS[aid.date.getMonth()]} (dans ${aid.days} jours)` : ''}</p>
        <Num id="zk-fitr" label="Montant par personne (DA)" value={z.fitr} onChange={set('fitr')} />
        <Num id="zk-ppl" label="Personnes à ta charge, toi compris" value={z.people} onChange={set('people')} />
        {z.fitr > 0 && <p className="text-sm">À prévoir : <strong>{da(z.fitr * Math.max(1, z.people))}</strong>.</p>}
      </div>
    </section>
  )
}
