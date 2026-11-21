import { iso, today, parseISO } from './dates.js'

// Dates approximatives de l'Aïd el-Fitr (calendrier lunaire) : à confirmer chaque année.
const AID_FITR = ['2026-03-20', '2027-03-10', '2028-02-27']

export function nextAidFitr(ref = today()) {
  const d = AID_FITR.find((x) => x >= iso(ref))
  return d ? { date: parseISO(d), days: Math.round((parseISO(d) - ref) / 86400000) } : null
}

// Zakat sur l'épargne : 2,5 % si l'épargne atteint le nissab (seuil saisi par l'utilisateur).
// L'app ne tranche rien : elle fait le calcul et affiche « estimation ».
export function zakatStatus(z) {
  if (!z.nissab) return { state: 'setup' }
  if (z.savings < z.nissab) return { state: 'below', gap: z.nissab - z.savings }
  return { state: 'due', amount: Math.round(z.savings * 0.025) }
}
