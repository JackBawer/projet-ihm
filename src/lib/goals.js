import { iso, today, parseISO, addDays } from './dates.js'

export const GOAL_COLORS = ['#7C3AED', '#2563EB', '#0E7C66', '#C2410C', '#B4235A']

// Deux objectifs d'exemple pour la démo : un en retard, un dans les temps.
export function demoGoals(ref = today()) {
  const m = (n) => iso(new Date(ref.getFullYear(), ref.getMonth() + n + 1, 0))   // dernier jour du mois, dans n mois
  return [
    { id: 1, name: 'Permis de conduire', target: 45000, saved: 39000, monthly: 3000, deadline: m(3), color: GOAL_COLORS[0] },
    { id: 2, name: 'Ordinateur portable', target: 80000, saved: 34000, monthly: 5000, deadline: m(7), color: GOAL_COLORS[1] },
  ]
}

// État d'un objectif au rythme actuel des versements :
// pourcentage, date à laquelle il sera atteint, en retard ou non, et montant mensuel nécessaire pour tenir la date.
export function goalStatus(g, ref = today()) {
  const left = Math.max(0, g.target - g.saved)
  const pct = g.target > 0 ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0
  const dl = parseISO(g.deadline)
  const monthsToDl = Math.max(1, (dl.getFullYear() - ref.getFullYear()) * 12 + dl.getMonth() - ref.getMonth())
  const need = Math.ceil(left / monthsToDl / 100) * 100
  if (left === 0) return { pct: 100, left, done: true, late: false, reach: null, need: 0, dl }
  if (!g.monthly) return { pct, left, done: false, late: true, reach: null, need, dl }
  const reach = new Date(ref.getFullYear(), ref.getMonth() + Math.ceil(left / g.monthly), 1)
  return { pct, left, done: false, late: reach > dl, reach, need, dl }
}

export const sortGoals = (goals) => [...goals].sort((a, b) => (a.deadline < b.deadline ? -1 : 1))
