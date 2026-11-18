import { KEYWORDS, norm } from './categories.js'
import { iso, addDays, today, cap } from './dates.js'

const median = (a) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] }

// Devine la catégorie à partir des mots de la phrase.
function guessCat(words) {
  for (const w of words) {
    const base = w.endsWith('s') ? w.slice(0, -1) : w
    for (const [cat, list] of Object.entries(KEYWORDS)) if (list.includes(w) || list.includes(base)) return cat
  }
  return 'autres'
}

// Transforme « taxi 300 hier carte » en dépense.
// Résultats possibles :
//   { ok: true, tx }                        -> tout est compris
//   { need: 'amount', draft, suggestions }  -> il manque le montant
//   { confirm: true, tx, ref, suggest }     -> montant suspect (10× l'habitude) : on demande avant d'enregistrer
//   { empty: true }
export function parseExpense(text, S) {
  const raw = text.trim()
  if (!raw) return { empty: true }
  const n = ` ${norm(raw)} `

  let offset = 0
  if (/ avant[- ]hier /.test(n)) offset = -2
  else if (/ hier /.test(n)) offset = -1
  const pay = / (carte|cib|edahabia) /.test(n) ? 'Carte' : 'Espèces'

  const m = n.match(/(\d{1,3}(?:[ .]\d{3})+|\d+)(?:[.,]\d{1,2})?\s*(?:da|dzd|dinars?)?(?=\s|$)/)
  const amt = m ? parseInt(m[1].replace(/[ .]/g, ''), 10) : null

  const words = n.replace(m ? m[0] : '', ' ').split(/\s+/)
    .filter((w) => w && !['avant-hier', 'avant', 'hier', "aujourd'hui", 'aujourdhui', 'carte', 'cib', 'edahabia', 'especes', 'cash', 'liquide', 'da', 'dzd', 'de', 'du', 'le', 'la', 'les', 'un', 'une', 'pour', 'au', 'en'].includes(w))
  const cat = guessCat(words)

  // Le libellé garde les accents tapés par l'utilisateur.
  const label = cap(raw
    .replace(/\d[\d .,]*\s*(da|dzd|dinars?)?/i, ' ')
    // Mots entiers seulement : « hier » ne doit pas être retiré de « cahier ».
    .replace(/(^|\s)(avant[- ]hier|hier|aujourd'?hui|carte|cib|edahabia|esp[eè]ces|cash|liquide)(?=\s|$)/gi, ' ')
    .replace(/\s+/g, ' ').trim()) || S.envelopes.find((e) => e.id === cat).name

  const now = new Date()
  const draft = { d: iso(addDays(today(), offset)), t: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`, label, cat, pay }

  // Montants habituels pour ce libellé (ou, à défaut, pour cette catégorie).
  const same = S.tx.filter((x) => norm(x.label) === norm(label)).map((x) => x.amt)
  const pool = same.length >= 3 ? same : S.tx.filter((x) => x.cat === cat).map((x) => x.amt)
  const ref = median(pool)

  if (amt === null || amt <= 0) {
    const suggestions = [...new Set(pool.slice(-12))].sort((a, b) => a - b).filter((_, i, arr) => arr.length <= 3 || i === 0 || i === Math.floor(arr.length / 2) || i === arr.length - 1)
    return { need: 'amount', draft, suggestions: suggestions.slice(0, 3) }
  }
  const tx = { ...draft, amt }
  if (ref > 0 && amt >= ref * 10 && amt >= 2000) {
    const near = (v) => v >= ref / 3 && v <= ref * 3
    const suggest = near(amt / 100) ? amt / 100 : near(amt / 10) ? amt / 10 : null
    return { confirm: true, tx, ref, suggest }
  }
  return { ok: true, tx }
}
