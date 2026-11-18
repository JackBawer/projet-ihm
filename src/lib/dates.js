// Petites fonctions de dates et de formatage, utilisées partout.
export const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
export const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }
export const daysInMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
export const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
export const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
export const longDate = (d) => `${cap(DAYS[d.getDay()])} ${d.getDate()} ${MONTHS[d.getMonth()]}`
export const shortDate = (d) => `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 4)}${MONTHS[d.getMonth()].length > 4 ? '.' : ''}`
// 12500 -> "12 500" (espace insécable pour ne jamais couper un montant en fin de ligne)
export const fmt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
export const da = (n) => `${fmt(n)} DA`
