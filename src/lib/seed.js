import { iso, addDays, today } from './dates.js'

// Générateur pseudo-aléatoire à graine fixe : les données de démo sont les mêmes à chaque fois.
function rng(seed) {
  return () => { let t = (seed += 0x6d2b79f5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

// Fabrique ~5 mois de dépenses réalistes d'un étudiant, avec :
//  - une hausse des courses à la rentrée (septembre) -> ne doit PAS déclencher d'alerte
//  - une grosse sortie le dernier samedi -> DOIT déclencher une alerte
export function makeDemo(income = 36000) {
  const r = rng(42), k = income / 36000, t = today(), tx = []
  const between = (a, b, step = 10) => Math.round((a + r() * (b - a)) * k / step) * step
  let id = 1
  const push = (d, time, label, cat, amt) => tx.push({ id: id++, d: iso(d), t: time, label, cat, amt, pay: 'Espèces' })
  let lastSat = addDays(t, -1)
  while (lastSat.getDay() !== 6) lastSat = addDays(lastSat, -1)

  for (let i = 150; i >= 1; i--) {
    const d = addDays(t, -i), dow = d.getDay(), work = dow <= 4 // semaine algérienne : dimanche à jeudi
    const rentree = d.getMonth() === 8 && d.getDate() <= 21
    if (r() < 0.45) push(d, '08:15', 'Pain et lait', 'courses', between(70, 120))
    if (dow === 5) push(d, '10:30', 'Courses', 'courses', Math.round(between(2400, 2800, 50) * (rentree ? 2.6 : 1)))
    if (work) push(d, '07:40', 'Bus', 'transport', Math.round(100 * k))
    if (r() < 0.2) push(d, '18:10', 'Taxi', 'transport', between(200, 350, 50))
    if (dow === 4 && r() < 0.4) push(d, '19:00', 'Yassir', 'transport', Math.round(450 * k))
    if (r() < 0.6) push(d, '09:40', 'Café', 'sorties', Math.round(50 * k))
    if (dow === 4 && r() < 0.2) push(d, '20:30', 'Resto', 'sorties', between(600, 800, 50))
    if (dow === 6) push(d, '21:00', 'Sortie', 'sorties', iso(d) === iso(lastSat) ? Math.round(4500 * k) : between(1000, 1400, 100))
    if (d.getDate() === 3 || d.getDate() === 17) push(d, '12:00', 'Recharge', 'autres', Math.round(500 * k))
    if (r() < 0.1) push(d, '11:15', 'Photocopies', 'autres', between(100, 300, 50))
  }
  return tx
}
