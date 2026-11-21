import { useState, useCallback, useEffect } from 'react'
import { buildEnvelopes } from './categories.js'
import { makeDemo } from './seed.js'
import { demoGoals } from './goals.js'
import { demoFixed } from './fixed.js'

export const KEY = 'mizane.v1'   // clé de sauvegarde inchangée pour ne pas perdre les données déjà enregistrées

export function freshState(income = 36000, demo = true) {
  return {
    onboarded: false, guided: false, income,
    envelopes: buildEnvelopes(income),
    tx: demo ? makeDemo(income) : [],
    settings: { eco: true, dark: false, size: 'm', sens: 2, seasons: { ramadan: true, rentree: true, ete: false } },
    feedback: {},   // réponses aux alertes : { "2026-11-14|sorties": "prevu" | "surveille" }
    learned: {},    // apprentissage : { "sorties|6": 1 } = 1 réponse « prévu » pour les sorties du samedi
    zakat: { on: true, savings: 0, nissab: 0, fitr: 0, people: 1 },   // valeurs saisies par l'utilisateur, jamais codées en dur
    fixed: demo ? demoFixed() : [],   // dépenses fixes : { id, label, amt, day, cat }
    fixedPaid: {},                    // { "2026-11": [ids payés ce mois] }
    goals: demo ? demoGoals() : [],   // objectifs d'épargne : { id, name, target, saved, monthly, deadline, color }
  }
}

// Complète une sauvegarde ancienne ou importée avec les champs ajoutés depuis.
function withDefaults(s) {
  const f = freshState()
  return { ...f, ...s, settings: { ...f.settings, ...s.settings }, zakat: { ...f.zakat, ...s.zakat }, goals: s.goals || [], fixed: s.fixed || [], fixedPaid: s.fixedPaid || {} }
}

// Au démarrage : relit la sauvegarde et signale un problème au lieu de l'ignorer.
// issue = 'save' (le navigateur refuse d'enregistrer) ou 'corrupt' (sauvegarde illisible, copie gardée à part)
function load() {
  let raw = null
  try {
    localStorage.setItem(KEY + '.test', '1'); localStorage.removeItem(KEY + '.test')
    raw = localStorage.getItem(KEY)
  } catch { return { state: freshState(), issue: 'save' } }
  if (!raw) return { state: freshState(), issue: null }
  try {
    const s = JSON.parse(raw)
    if (s && Array.isArray(s.envelopes) && Array.isArray(s.tx)) return { state: withDefaults(s), issue: null }
  } catch { /* illisible : traité juste en dessous */ }
  try { localStorage.setItem(KEY + '.illisible', raw) } catch { /* rien de plus à faire */ }
  return { state: freshState(), issue: 'corrupt' }
}

// Sauvegarde téléchargeable : un fichier .json que l'on peut réimporter plus tard ou sur un autre appareil.
export function exportData(S) {
  const day = new Date().toISOString().slice(0, 10)
  const name = `ecobudget-sauvegarde-${day}.json`
  const blob = new Blob([JSON.stringify({ app: 'EcoBudget', version: 1, date: new Date().toISOString(), data: S }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return name
}

// Lit un fichier de sauvegarde. Renvoie { state, date } ou lève une erreur avec un message clair.
export function parseBackup(text) {
  let j
  try { j = JSON.parse(text) } catch { throw new Error("Ce fichier n'est pas une sauvegarde EcoBudget. Choisis le fichier .json créé avec « Exporter mes données ».") }
  const s = j && j.data ? j.data : j
  if (!s || !Array.isArray(s.envelopes) || !Array.isArray(s.tx)) throw new Error("Ce fichier ne contient pas de données EcoBudget. Choisis le fichier .json créé avec « Exporter mes données ».")
  return { state: { ...withDefaults(s), onboarded: true, guided: true }, date: j.date ? new Date(j.date) : null }
}

// L'état de l'app : tout est dans un seul objet, sauvegardé dans le navigateur à chaque changement.
export function useStore() {
  const [boot] = useState(load)
  const [S, setS] = useState(boot.state)
  const [issue, setIssue] = useState(boot.issue)
  const update = useCallback((fn) => {
    setS((old) => { const next = structuredClone(old); fn(next); return next })
  }, [])
  // Enregistre après chaque changement ; si le navigateur refuse, l'app le dit au lieu de perdre les données en silence.
  useEffect(() => {
    if (boot.issue === 'corrupt' && S === boot.state) return   // ne pas écraser tout de suite la sauvegarde illisible
    try { localStorage.setItem(KEY, JSON.stringify(S)) } catch { setIssue('save') }
  }, [S, boot])
  return [S, update, issue, setIssue]
}
