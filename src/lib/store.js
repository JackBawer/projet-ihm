import { useState, useCallback } from 'react'
import { buildEnvelopes } from './categories.js'
import { makeDemo } from './seed.js'
import { demoGoals } from './goals.js'
import { demoFixed } from './fixed.js'

const KEY = 'mizane.v1'   // clé de sauvegarde inchangée pour ne pas perdre les données déjà enregistrées

export function freshState(income = 36000, demo = true) {
  return {
    onboarded: false, income,
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

function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.envelopes) { const f = freshState(); return { ...f, ...s, settings: { ...f.settings, ...s.settings }, zakat: { ...f.zakat, ...s.zakat }, goals: s.goals || [], fixed: s.fixed || [], fixedPaid: s.fixedPaid || {} } } } catch { /* stockage indisponible : on repart de zéro */ }
  return freshState()
}

// L'état de l'app : tout est dans un seul objet, sauvegardé dans le navigateur à chaque changement.
export function useStore() {
  const [S, setS] = useState(load)
  const update = useCallback((fn) => {
    setS((old) => {
      const next = structuredClone(old)
      fn(next)
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* pas grave */ }
      return next
    })
  }, [])
  return [S, update]
}
