import { useState, useEffect, useMemo } from 'react'
import { useStore } from './lib/store.js'
import { detect } from './lib/anomalies.js'
import { da } from './lib/dates.js'
import Icon from './components/Icon.jsx'
import WhyModal from './components/WhyModal.jsx'
import Home from './views/Home.jsx'
import Envelopes from './views/Envelopes.jsx'
import Alerts from './views/Alerts.jsx'
import History from './views/History.jsx'
import Settings from './views/Settings.jsx'
import Onboarding from './views/Onboarding.jsx'

const NAV = [['home', 'battery', 'Batterie'], ['env', 'env', 'Enveloppes'], ['alerts', 'bell', 'Alertes'], ['hist', 'cal', 'Historique'], ['settings', 'gear', 'Réglages']]

export default function App() {
  const [S, update] = useStore()
  const [view, setView] = useState('home')
  const [toast, setToast] = useState(null)     // { msg, undo }
  const [why, setWhy] = useState(null)         // alerte ouverte dans « Pourquoi ? »
  const found = useMemo(() => detect(S), [S])

  // Thème sombre et taille du texte : appliqués sur <html>.
  useEffect(() => {
    const el = document.documentElement
    el.classList.toggle('dark', S.settings.dark)
    el.classList.toggle('size-s', S.settings.size === 's')
    el.classList.toggle('size-l', S.settings.size === 'l')
  }, [S.settings.dark, S.settings.size])

  // Le message de confirmation disparaît tout seul après 6 secondes.
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 6000); return () => clearTimeout(id) }, [toast])

  const api = {
    go: setView,
    toast: (msg, undo) => setToast({ msg, undo }),
    openWhy: setWhy,
    addTx(tx) {
      const full = { ...tx, id: Date.now() }
      update((s) => { s.tx.push(full) })
      const env = S.envelopes.find((e) => e.id === tx.cat)
      setToast({ msg: `${da(tx.amt)} ajoutés à ${env.name}`, undo: () => update((s) => { s.tx = s.tx.filter((x) => x.id !== full.id) }) })
    },
    removeTx(id) {
      const old = S.tx.find((x) => x.id === id)
      update((s) => { s.tx = s.tx.filter((x) => x.id !== id) })
      setToast({ msg: `« ${old.label} » supprimée`, undo: () => update((s) => { s.tx.push(old) }) })
    },
    answer(a, kind) {
      const key = `${a.cat}|${a.dow}`
      update((s) => { s.feedback[a.key] = kind; if (kind === 'prevu') s.learned[key] = (s.learned[key] || 0) + 1 })
      setWhy(null)
      setToast({
        msg: kind === 'prevu' ? 'Compris. EcoBudget sera moins sensible pour ce type de dépense.' : 'Noté : cette dépense reste à surveiller.',
        undo: () => update((s) => { delete s.feedback[a.key]; if (kind === 'prevu') s.learned[key] = Math.max(0, (s.learned[key] || 1) - 1) }),
      })
    },
  }

  if (!S.onboarded) return <Onboarding update={update} />

  const badge = found.alerts.filter((a) => !S.feedback[a.key]).length
  const props = { S, update, api, found }
  const item = (mobile) => ([id, icon, label]) => (
    <button key={id} onClick={() => setView(id)} aria-current={view === id ? 'page' : undefined}
      className={mobile
        ? `relative flex-1 h-14 flex flex-col items-center justify-center gap-0.5 text-[0.7rem] ${view === id ? 'text-ink font-bold' : 'text-muted font-medium'}`
        : `relative h-12 px-3.5 rounded-2xl flex items-center gap-3 text-[0.95rem] ${view === id ? 'bg-card text-ink font-bold shadow-sm' : 'text-muted font-medium hover:bg-soft'}`}>
      <Icon name={icon} size={mobile ? 22 : 20} />{label}
      {id === 'alerts' && badge > 0 && <span className={`absolute ${mobile ? 'top-1.5 right-[22%]' : 'right-3'} min-w-5 h-5 px-1 rounded-full bg-warn text-white dark:text-black text-xs font-bold grid place-items-center`}>{badge}</span>}
    </button>
  )

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden md:flex w-60 shrink-0 flex-col gap-1.5 p-5 border-r border-line sticky top-0 h-screen">
        <div className="flex items-center gap-2.5 px-1.5 pb-6"><span className="size-10 rounded-xl bg-accent text-white dark:text-black grid place-items-center"><Icon name="battery" /></span><span className="font-display text-2xl font-extrabold">EcoBudget</span></div>
        <nav aria-label="Navigation principale" className="flex flex-col gap-1.5">{NAV.map(item(false))}</nav>
      </aside>

      <main className="flex-1 min-w-0 px-4 pt-8 pb-28 md:px-10 md:py-9">
        <div className="max-w-5xl mx-auto">
          {view === 'home' && <Home {...props} />}
          {view === 'env' && <Envelopes {...props} />}
          {view === 'alerts' && <Alerts {...props} />}
          {view === 'hist' && <History {...props} />}
          {view === 'settings' && <Settings {...props} />}
        </div>
      </main>

      <nav aria-label="Navigation principale" className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-card border-t border-line flex px-1 pb-[env(safe-area-inset-bottom)]">{NAV.map(item(true))}</nav>

      {toast && (
        <div role="status" className="fixed z-30 left-4 right-4 bottom-20 md:left-auto md:right-8 md:bottom-8 md:w-96 bg-ink text-sand rounded-2xl pl-4 pr-1.5 py-1.5 flex items-center gap-3 shadow-xl">
          <Icon name="check" className="text-[#7FD8C3] dark:text-accent" stroke={2.6} /><span className="flex-1 text-sm py-2">{toast.msg}</span>
          {toast.undo && <button onClick={() => { toast.undo(); setToast(null) }} className="h-11 px-3.5 rounded-xl bg-white/15 dark:bg-black/10 font-bold text-sm flex items-center gap-1.5"><Icon name="undo" size={16} />Annuler</button>}
        </div>
      )}
      {why && <WhyModal a={why} S={S} onClose={() => setWhy(null)} onAnswer={api.answer} />}
    </div>
  )
}
