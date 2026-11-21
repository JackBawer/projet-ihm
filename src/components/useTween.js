import { useEffect, useRef, useState } from 'react'

// Fait glisser un nombre de son ancienne valeur vers la nouvelle (la batterie qui se vide en direct).
// Si l'utilisateur a demandé moins d'animations dans son système, la valeur change d'un coup.
export default function useTween(value, ms = 750) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || from.current === value) { from.current = value; setShown(value); return }
    const start = performance.now(), a = from.current, b = value
    let raf
    const step = (now) => {
      const t = Math.min(1, (now - start) / ms), e = 1 - Math.pow(1 - t, 3)
      setShown(a + (b - a) * e)
      if (t < 1) raf = requestAnimationFrame(step)
      else from.current = b
    }
    raf = requestAnimationFrame(step)
    return () => { cancelAnimationFrame(raf); from.current = b }
  }, [value, ms])
  return shown
}
