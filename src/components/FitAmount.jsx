import { fmt } from '../lib/dates.js'

// Le grand montant de la batterie : il rétrécit quand il a beaucoup de chiffres,
// pour ne jamais passer sous « DA » ni sous la batterie. Le parent doit être un conteneur (@container).
export default function FitAmount({ value }) {
  const text = fmt(value)
  const digits = text.replace(/\D/g, '').length, spaces = text.length - digits
  const width = 0.6 * digits + 0.26 * spaces + 1.2   // largeur approximative en em : chiffres, espaces, puis « DA »
  return (
    <p className="font-display font-extrabold leading-none tracking-tight whitespace-nowrap [--fit-max:3.75rem] md:[--fit-max:6rem]"
      style={{ fontSize: `min(var(--fit-max), calc(100cqw / ${width.toFixed(2)}))` }}>
      {text}<span className="text-[0.4em] font-bold"> DA</span>
    </p>
  )
}
