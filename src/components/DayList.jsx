import { TxRow } from '../views/Home.jsx'

// Liste des dépenses d'un jour : hauteur limitée, puis défilement avec une barre.
// Au-delà de 5 dépenses, un dégradé en bas et le nombre total indiquent qu'il y en a d'autres.
export default function DayList({ items, S, onDelete }) {
  const long = items.length > 5
  return (
    <div>
      <div className="relative">
      <ul tabIndex={0} aria-label={`Dépenses du jour, ${items.length} au total`}
        className="m-0 p-0 list-none max-h-80 overflow-y-auto overscroll-contain pr-3 -mr-3 scroll-list">
        {items.map((x) => <TxRow key={x.id} x={x} S={S} onDelete={onDelete} />)}
        {long && <li aria-hidden="true" className="h-6" />}
      </ul>
      {long && <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card to-transparent" />}
      </div>
      {long && <p className="text-xs text-muted text-center pt-2">{items.length} dépenses · fais défiler pour tout voir</p>}
    </div>
  )
}
