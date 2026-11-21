import { iso, addDays, today, daysInMonth } from './dates.js'
import { reservedThisMonth, fixedTotalThisMonth } from './fixed.js'

export const savingIds = (S) => S.envelopes.filter((e) => e.saving).map((e) => e.id)

// Total dépensé un jour donné, éventuellement pour une seule catégorie.
// Les dépenses fixes sont exclues : payer internet le 25 ne fait pas de ce jour une « mauvaise journée ».
export function dayTotal(S, dateISO, cat) {
  return S.tx.filter((x) => x.d === dateISO && !x.fixed && (cat ? x.cat === cat : true)).reduce((s, x) => s + x.amt, 0)
}

// Tout ce que l'écran d'accueil affiche est calculé ici, à partir des dépenses du mois.
export function monthStats(S, ref = today()) {
  const prefix = iso(ref).slice(0, 7)
  const spendEnvs = S.envelopes.filter((e) => !e.saving)
  const spendable = spendEnvs.reduce((s, e) => s + e.budget, 0)        // budget du mois, hors épargne
  const monthTx = S.tx.filter((x) => x.d.startsWith(prefix))
  const byEnv = Object.fromEntries(S.envelopes.map((e) => [e.id, 0]))
  monthTx.forEach((x) => { byEnv[x.cat] = (byEnv[x.cat] || 0) + x.amt })
  const spent = monthTx.reduce((s, x) => s + x.amt, 0)
  // Dépenses fixes pas encore payées ce mois-ci : retirées d'avance (seulement pour le mois en cours).
  const current = prefix === iso(today()).slice(0, 7)
  const reserved = current ? reservedThisMonth(S, ref) : 0
  // Budget « libre » : sans les dépenses fixes. La batterie se mesure dessus, pour qu'un loyer prévu ne la fasse pas virer à l'orange.
  const flexBudget = Math.max(1, spendable - (current ? fixedTotalThisMonth(S, ref) : 0))
  const remaining = spendable - spent - reserved
  const dim = daysInMonth(ref)
  const daysLeft = dim - ref.getDate() + 1                             // aujourd'hui compris
  const perDay = Math.max(0, remaining / daysLeft)                     // « tu peux dépenser X DA par jour »
  const pct = spendable > 0 ? Math.max(0, Math.min(100, (remaining / flexBudget) * 100)) : 0   // charge de la batterie
  // La couleur dépend de l'avance ou du retard sur le mois, pas du pourcentage seul :
  // 50 % de batterie avec 50 % du mois restant = tout va bien.
  const ratio = pct / 100 / (daysLeft / dim)
  const level = ratio >= 0.8 ? 'good' : ratio >= 0.5 ? 'mid' : 'low'
  // Rythme réel : moyenne des 7 derniers jours complets.
  let last7 = 0
  for (let i = 1; i <= 7; i++) last7 += dayTotal(S, iso(addDays(ref, -i)))
  const rhythm = last7 / 7
  const covered = rhythm > 0 ? Math.floor(Math.max(0, remaining) / rhythm) : Infinity
  const endDate = covered < daysLeft ? addDays(ref, Math.max(0, covered - 1)) : null   // jour où l'argent s'épuise
  const surplus = endDate ? 0 : remaining - rhythm * daysLeft
  const saving = S.envelopes.filter((e) => e.saving).reduce((s, e) => s + e.budget, 0)
  return { spendable, spent, reserved, remaining, dim, daysLeft, perDay, pct, ratio, level, rhythm, endDate, surplus, byEnv, saving, baseDaily: spendable / dim }
}

// Niveau d'une journée pour le calendrier : comparée à l'allocation journalière de base.
export function dayLevel(total, baseDaily) {
  if (total <= baseDaily) return { level: 'good', pct: Math.max(55, 100 - (45 * total) / Math.max(1, baseDaily)) }
  if (total <= baseDaily * 2) return { level: 'mid', pct: 40 }
  return { level: 'low', pct: 12 }
}
