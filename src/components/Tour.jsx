import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'

// Guide du premier lancement : met en lumière une zone de l'écran à la fois, avec une bulle d'explication.
// Chaque étape vise un élément marqué data-tour="…". Une étape dont l'élément n'est pas affiché est sautée.
const STEPS = [
  { id: 'battery', title: 'Ta batterie', text: "Elle montre ce qu'il te reste pour le mois. Verte, tu es dans les clous ; orange, tu vas un peu vite. Le grand chiffre, c'est ce que tu peux dépenser par jour." },
  { id: 'quickadd', title: 'Ajoute une dépense en une phrase', text: 'Écris « taxi 300 » ou « café 50 hier », puis Entrée. EcoBudget trouve tout seul l\'enveloppe et la date.' },
  { id: 'envelopes', title: 'Tes enveloppes', text: 'Ton budget est réparti par catégorie. Touche une enveloppe pour voir ses dépenses et ajuster son montant.' },
  { id: 'alerts', title: 'Les alertes', text: "Quand une dépense sort de tes habitudes, EcoBudget te prévient ici et t'explique pourquoi." },
]
const PAD = 8

const visible = (id) => [...document.querySelectorAll(`[data-tour="${id}"]`)].find((el) => el.getBoundingClientRect().width > 0)

export default function Tour({ onDone }) {
  const [steps, setSteps] = useState(null)   // calculées après l'affichage de l'écran
  useLayoutEffect(() => { setSteps(STEPS.filter((s) => visible(s.id))) }, [])
  const [i, setI] = useState(0)
  const [rect, setRect] = useState(null)
  const bubble = useRef(null)
  const [bh, setBh] = useState(230)   // hauteur réelle de la bulle, mesurée après affichage
  const next = useRef(null)
  const step = steps?.[i]

  const measure = useCallback(() => {
    const el = step && visible(step.id)
    if (!el) return setRect(null)
    const r = el.getBoundingClientRect()
    setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 })
  }, [step])

  // Fait défiler jusqu'à la zone, puis la mesure une fois le défilement fini.
  useLayoutEffect(() => {
    const el = step && visible(step.id)
    if (!el) return
    const r = el.getBoundingClientRect()
    const fixed = !!el.closest('.fixed, .sticky')   // barre de navigation : rien à faire défiler
    const fits = r.top >= 0 && r.bottom <= window.innerHeight - 300
    if (!fixed && !fits) window.scrollBy({ top: r.top - 90, behavior: 'instant' })   // la zone en haut, la bulle juste dessous
    measure()
  }, [step, measure])

  useEffect(() => {
    window.addEventListener('resize', measure); window.addEventListener('scroll', measure, true)
    return () => { window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true) }
  }, [measure])

  useLayoutEffect(() => { if (bubble.current) setBh(bubble.current.offsetHeight) })
  useEffect(() => { next.current?.focus() }, [i])
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onDone() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDone])

  useEffect(() => { if (steps && !steps.length) onDone() }, [steps, onDone])
  if (!step || !rect) return null

  // Bulle sous la zone s'il y a la place, sinon au-dessus ; collée au bord gauche de la zone, sans sortir de l'écran.
  const vw = window.innerWidth, vh = window.innerHeight
  const safeBottom = vw < 768 ? 72 : 16   // ne pas cacher la barre de navigation du téléphone
  const w = Math.min(340, vw - 32)
  const below = rect.top + rect.height + 12
  const room = vh - safeBottom - bh
  const placeBelow = below <= room || rect.top - 12 - bh < 16
  const top = placeBelow ? Math.max(16, Math.min(below, room)) : rect.top - 12 - bh
  const left = Math.max(16, Math.min(rect.left, vw - w - 16))
  const last = i === steps.length - 1

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-text">
      <div aria-hidden="true" className="absolute rounded-[1rem] transition-all duration-300 pointer-events-none"
        style={{ ...rect, boxShadow: '0 0 0 9999px rgba(20,18,15,.58)' }} />
      <div ref={bubble} className="absolute bg-card text-ink rounded-3xl p-5 shadow-2xl flex flex-col gap-3" style={{ width: w, left, top }}>
        <p className="text-xs font-semibold text-muted">Étape {i + 1} sur {steps.length}</p>
        <h2 id="tour-title" className="font-display text-xl font-bold -mt-1">{step.title}</h2>
        <p id="tour-text" className="text-sm leading-relaxed">{step.text}</p>
        <div className="flex items-center justify-between gap-2 pt-1">
          <button onClick={onDone} className="h-11 px-1 text-sm font-semibold text-muted whitespace-nowrap">Passer le guide</button>
          <div className="flex gap-2">
            {i > 0 && <button onClick={() => setI(i - 1)} className="h-11 px-3.5 rounded-xl border border-line font-semibold text-sm">Retour</button>}
            <button ref={next} onClick={() => (last ? onDone() : setI(i + 1))} className="h-11 px-4 rounded-xl bg-ink text-sand font-semibold text-sm whitespace-nowrap">{last ? "C'est parti" : 'Suivant'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
