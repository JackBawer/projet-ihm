import { iso, today, daysInMonth } from './dates.js'

// Dépenses fixes : elles reviennent chaque mois à la même date (internet, salle de sport, loyer…).
// Tant qu'une dépense fixe du mois n'est pas payée, son montant est « réservé » :
// il est retiré d'avance de ce que tu peux dépenser.
export function demoFixed() {
  return [
    { id: 1, label: 'Internet', amt: 2000, day: 25, cat: 'autres' },
    { id: 2, label: 'Salle de sport', amt: 1500, day: 22, cat: 'sorties' },
  ]
}

export const monthKey = (ref = today()) => iso(ref).slice(0, 7)

// Les dépenses fixes du mois avec leur état : payée, à venir, ou date passée sans paiement.
export function fixedThisMonth(S, ref = today()) {
  const key = monthKey(ref), paid = (S.fixedPaid || {})[key] || [], dim = daysInMonth(ref)
  return (S.fixed || []).map((f) => {
    const day = Math.min(f.day, dim)
    return { ...f, day, paid: paid.includes(f.id), late: !paid.includes(f.id) && day < ref.getDate(), inDays: day - ref.getDate() }
  }).sort((a, b) => a.day - b.day)
}

// Total de toutes les dépenses fixes du mois, payées ou non.
export function fixedTotalThisMonth(S, ref = today()) {
  return fixedThisMonth(S, ref).reduce((s, f) => s + f.amt, 0)
}

// Total encore réservé ce mois-ci (dépenses fixes pas encore payées).
export function reservedThisMonth(S, ref = today()) {
  return fixedThisMonth(S, ref).filter((f) => !f.paid).reduce((s, f) => s + f.amt, 0)
}
