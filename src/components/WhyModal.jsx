import Icon from './Icon.jsx'
import { da, fmt, DAYS, parseISO } from '../lib/dates.js'

// « Pourquoi cette alerte ? » : on montre le calcul, pour que la détection ne soit pas une boîte noire.
export default function WhyModal({ a, S, onClose, onAnswer }) {
  const env = S.envelopes.find((e) => e.id === a.cat)
  const bars = [...a.prev, { date: a.date, total: a.total, current: true }]
  const max = Math.max(...bars.map((b) => b.total), 1)
  const H = 130
  const lbl = (d) => { const x = parseISO(d); return `${x.getDate()}/${x.getMonth() + 1}` }
  return (
    <div className="fixed inset-0 z-40 bg-black/50 grid place-items-end md:place-items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="why-title" onClick={(e) => e.stopPropagation()}
        className="bg-sand w-full md:max-w-lg rounded-t-3xl md:rounded-3xl p-5 flex flex-col gap-4 max-h-[92vh] overflow-auto">
        <div className="flex items-center justify-between">
          <h2 id="why-title" className="font-display text-2xl font-bold">Pourquoi cette alerte ?</h2>
          <button onClick={onClose} aria-label="Fermer" className="size-11 rounded-xl bg-card border border-line grid place-items-center"><Icon name="x" /></button>
        </div>
        <p className="font-semibold">Le {DAYS[a.dow]} {parseISO(a.date).getDate()}, tu as dépensé <span className="text-warn">{da(a.total)}</span> en {env.name.toLowerCase()}. D'habitude, un {DAYS[a.dow]} te coûte {da(a.avg)}.</p>

        <figure className="bg-card rounded-3xl p-4 m-0">
          <figcaption className="text-sm font-bold mb-3">Tes {bars.length} derniers {DAYS[a.dow]}s · {env.name.toLowerCase()}</figcaption>
          <div className="relative" style={{ height: H }}>
            <div className="absolute inset-0 flex items-end gap-1.5">
              {bars.map((b) => <div key={b.date} className="flex-1 rounded-t-md" style={{ height: Math.max(3, (b.total / max) * H), background: b.current ? 'var(--warn)' : '#C9D6D1' }} />)}
            </div>
            <div className="absolute inset-x-0 border-t-2 border-dashed border-ink" style={{ bottom: (a.avg / max) * H }}>
              <span className="absolute left-0 -top-5 text-xs font-bold bg-card pr-1">moyenne {fmt(a.avg)}</span>
            </div>
          </div>
          <div className="flex gap-1.5 mt-1">{bars.map((b) => <span key={b.date} className={`flex-1 text-center text-[0.65rem] ${b.current ? 'text-warn font-bold' : 'text-muted'}`}>{lbl(b.date)}</span>)}</div>
        </figure>

        <dl className="bg-card rounded-3xl px-4 py-1 m-0">
          {[[`Ta moyenne du ${DAYS[a.dow]}`, da(a.avg)], [`Ce ${DAYS[a.dow]}`, da(a.total)], ['Écart', `×${a.ratio.toFixed(1).replace('.', ',')} (alerte dès ×${(a.season ? a.base * 1.75 : a.base).toFixed(1).replace('.', ',')})`]].map(([k, v], i) => (
            <div key={k} className="flex justify-between items-baseline py-2.5 border-b border-line last:border-0">
              <dt className="text-muted">{k}</dt><dd className={`font-display font-bold m-0 ${i ? 'text-warn' : ''}`}>{v}</dd>
            </div>
          ))}
        </dl>
        <p className="flex items-center gap-2 text-sm text-muted"><Icon name="moon" size={16} />{a.season ? `Saison en cours : ${a.season.name}. Le seuil est déjà relevé, et c'est quand même au-dessus.` : 'Aucune saison en cours : ni Ramadan, ni Aïd, ni rentrée.'}</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => onAnswer(a, 'prevu')} className="h-12 rounded-xl border-2 border-ink font-semibold">Oui, c'était prévu</button>
          <button onClick={() => onAnswer(a, 'surveille')} className="h-12 rounded-xl bg-ink text-sand font-semibold">Non, à surveiller</button>
        </div>
      </div>
    </div>
  )
}
