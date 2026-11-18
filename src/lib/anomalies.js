import { iso, addDays, today, parseISO } from './dates.js'

// Les « saisons de dépenses » : périodes où dépenser plus est normal.
// Les dates du Ramadan et des Aïds suivent le calendrier lunaire : ce sont des dates approximatives à ajuster.
export const SEASONS = [
  { id: 'ramadan', name: 'Ramadan et Aïd', cats: ['courses', 'sorties', 'autres'],
    ranges: [['2026-02-18', '2026-03-23'], ['2026-05-24', '2026-05-30'], ['2027-02-08', '2027-03-12'], ['2027-05-14', '2027-05-20']] },
  { id: 'rentree', name: 'Rentrée scolaire', cats: ['courses', 'autres'], yearly: ['09-01', '09-21'] },
  { id: 'ete', name: 'Été', cats: ['sorties', 'transport'], yearly: ['07-01', '08-31'] },
]
const rangesOf = (s, year) => (s.yearly ? [[`${year}-${s.yearly[0]}`, `${year}-${s.yearly[1]}`]] : s.ranges)

// Renvoie la saison active ce jour-là pour cette catégorie (si l'utilisateur l'a laissée activée).
export function activeSeason(dateISO, cat, enabled) {
  const year = dateISO.slice(0, 4)
  return SEASONS.find((s) => enabled[s.id] && s.cats.includes(cat) && rangesOf(s, year).some(([a, b]) => dateISO >= a && dateISO <= b)) || null
}

export function nextSeason(enabled, ref = today()) {
  const now = iso(ref)
  let best = null
  SEASONS.filter((s) => enabled[s.id]).forEach((s) => {
    [ref.getFullYear(), ref.getFullYear() + 1].forEach((y) => rangesOf(s, y).forEach(([a]) => {
      if (a > now && (!best || a < best.start)) best = { season: s, start: a, days: Math.round((parseISO(a) - ref) / 86400000) }
    }))
  })
  return best
}

// Détection des dépenses inhabituelles.
// Principe : on compare le total d'une catégorie un jour donné à la moyenne
// du MÊME jour de la semaine sur les 8 semaines précédentes.
//   - alerte si total >= seuil × moyenne (seuil = 2 par défaut) et écart >= 800 DA
//   - pendant une saison, le seuil est multiplié par 1,75 : une hausse « normale » ne déclenche rien
//   - chaque réponse « c'était prévu » relève un peu le seuil pour ce couple catégorie + jour (apprentissage)
export function detect(S, ref = today()) {
  const totals = {}
  S.tx.forEach((x) => { if (x.fixed) return; const k = `${x.d}|${x.cat}`; totals[k] = (totals[k] || 0) + x.amt })
  const first = S.tx.reduce((m, x) => (x.d < m ? x.d : m), iso(ref))
  const cats = S.envelopes.filter((e) => !e.saving).map((e) => e.id)
  const alerts = [], expected = []

  for (let i = 0; i <= 120; i++) {
    const d = addDays(ref, -i), dISO = iso(d), dow = d.getDay()
    for (const cat of cats) {
      const total = totals[`${dISO}|${cat}`] || 0
      if (!total) continue
      const prev = []
      for (let w = 8; w >= 1; w--) { const p = iso(addDays(d, -7 * w)); if (p >= first) prev.push({ date: p, total: totals[`${p}|${cat}`] || 0 }) }
      if (prev.length < 4) continue
      const avg = prev.reduce((s, p) => s + p.total, 0) / prev.length
      if (total - avg < 800) continue
      const base = S.settings.sens + 0.5 * (S.learned[`${cat}|${dow}`] || 0)
      const season = activeSeason(dISO, cat, S.settings.seasons)
      const ratio = total / Math.max(avg, 100)
      const item = { key: `${dISO}|${cat}`, date: dISO, cat, dow, total, avg, ratio, prev, season, base }
      if (season) {
        if (ratio >= base * 1.75 && i <= 14) alerts.push(item)
        else if (ratio >= base) expected.push(item)
      } else if (ratio >= base && i <= 14) alerts.push(item)
    }
  }
  return {
    alerts: alerts.filter((a) => S.feedback[a.key] !== 'prevu'),
    expected: expected.slice(0, 1),            // la hausse « attendue » la plus récente
    upcoming: nextSeason(S.settings.seasons, ref),
  }
}
