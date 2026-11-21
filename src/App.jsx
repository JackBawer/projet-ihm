import { useState, useEffect, useMemo } from 'react'
import { useStore, exportData } from './lib/store.js'
import { monthStats, dayTotal } from './lib/budget.js'
import { iso, today as todayDate } from './lib/dates.js'
import Battery from './components/Battery.jsx'
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
import Tour from './components/Tour.jsx'

const NAV = [['home', 'battery', 'Batterie'], ['env', 'env', 'Enveloppes'], ['alerts', 'bell', 'Alertes'], ['hist', 'cal', 'Historique'], ['settings', 'gear', 'Réglages']]

// Encadré en bas de la barre latérale : où en est le mois, en un coup d'œil.
function MonthCard({ S }) {
  const st = monthStats(S), t = todayDate()
  let ok = 0
  for (let d = 1; d <= t.getDate(); d++) if (dayTotal(S, iso(new Date(t.getFullYear(), t.getMonth(), d))) <= st.baseDaily) ok++
  const used = Math.min(100, Math.max(0, 100 - st.pct))
  return (
    <div className="mt-auto bg-card border border-line rounded-3xl p-3.5 flex flex-col gap-2">
      <p className="flex items-center gap-2 font-bold text-sm"><Battery pct={st.pct} level={st.level} size={28} />Ce mois-ci</p>
      <p className="text-sm"><b>{fmtDA(Math.max(0, st.remaining))}</b> <span className="text-muted">restants</span></p>
      <span className="block h-1.5 rounded-full bg-soft overflow-hidden"><span className="block h-full rounded-full bg-accent" style={{ width: `${100 - used}%` }} /></span>
      <p className="text-xs text-muted">{ok} jour{ok > 1 ? 's' : ''} sur {t.getDate()} dans le budget</p>
    </div>
  )
}
const fmtDA = (n) => da(n)

export default function App() {
  const [S, update, issue, setIssue] = useStore()
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
    exportData: () => { const name = exportData(S); setToast({ msg: `Sauvegarde téléchargée : ${name}` }) },
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

  // Bandeau affiché quand l'enregistrement pose problème (critère : gestion des erreurs)
  const banner = issue && (
    <div role="alert" className="bg-[#FFF4E5] text-[#5C2E00] dark:bg-[#3A2A14] dark:text-[#FDE2C0] border-b border-[#F5C98B] dark:border-[#6B4A1E] px-4 py-3 md:px-10">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="flex-1 min-w-60 text-sm">{issue === 'save'
          ? <><strong>Tes données ne sont pas enregistrées sur cet appareil.</strong> Le navigateur refuse la sauvegarde (navigation privée ou stockage plein). Exporte-les avant de fermer l'onglet.</>
          : <><strong>Ta sauvegarde précédente était illisible.</strong> EcoBudget a redémarré à zéro ; l'ancienne copie est gardée à part dans le navigateur.</>}</p>
        <div className="flex gap-2">
          {issue === 'save' && S.onboarded && <button onClick={api.exportData} className="h-11 px-3.5 rounded-xl bg-[#5C2E00] text-white dark:bg-[#FDE2C0] dark:text-black font-semibold text-sm">Exporter mes données</button>}
          <button onClick={() => setIssue(null)} className="h-11 px-3.5 rounded-xl border border-current/30 font-semibold text-sm">{issue === 'save' ? 'Masquer' : 'Compris'}</button>
        </div>
      </div>
    </div>
  )

  if (!S.onboarded) return <>{banner}<Onboarding update={update} /></>

  const badge = found.alerts.filter((a) => !S.feedback[a.key]).length
  const props = { S, update, api, found }
  const item = (mobile) => ([id, icon, label]) => (
    <button key={id} data-tour={id === 'alerts' ? 'alerts' : undefined} onClick={() => setView(id)} aria-current={view === id ? 'page' : undefined}
      className={mobile
        ? `relative flex-1 h-14 flex flex-col items-center justify-center gap-0.5 text-[0.7rem] ${view === id ? 'text-accent font-bold' : 'text-muted font-medium'}`
        : `relative h-11 px-3.5 rounded-xl flex items-center gap-3 text-[0.95rem] ${view === id ? 'bg-accentsoft text-ink font-bold' : 'text-muted font-medium hover:bg-soft'}`}>
      {!mobile && view === id && <span aria-hidden="true" className="absolute -left-5 top-2.5 bottom-2.5 w-[3px] rounded bg-accent" />}
      <Icon name={icon} size={mobile ? 22 : 20} className={!mobile && view === id ? 'text-accent' : ''} />{label}
      {id === 'alerts' && badge > 0 && <span className={`absolute ${mobile ? 'top-1.5 right-[22%]' : 'right-3'} min-w-5 h-5 px-1 rounded-full bg-warn text-white dark:text-black text-xs font-bold grid place-items-center`}>{badge}</span>}
    </button>
  )

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden md:flex w-60 shrink-0 flex-col gap-1.5 p-5 bg-side border-r border-line sticky top-0 h-screen">
        <div className="flex items-center gap-2.5 px-1.5 pb-6"><span className="size-10 rounded-xl bg-accent text-on-accent grid place-items-center"><Icon name="battery" /></span><span className="font-display text-2xl font-extrabold">EcoBudget</span></div>
        <nav aria-label="Navigation principale" className="flex flex-col gap-1">{NAV.map(item(false))}</nav>
        <MonthCard S={S} />
      </aside>

      <main className="flex-1 min-w-0">
      {banner}
      <div className="px-4 pt-8 pb-28 md:px-10 md:py-9">
        <div className="max-w-5xl mx-auto">
          {view === 'home' && <Home {...props} />}
          {view === 'env' && <Envelopes {...props} />}
          {view === 'alerts' && <Alerts {...props} />}
          {view === 'hist' && <History {...props} />}
          {view === 'settings' && <Settings {...props} />}
        </div>
      </div>
      </main>

      <nav aria-label="Navigation principale" className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-card border-t border-line flex px-1 pb-[env(safe-area-inset-bottom)]">{NAV.map(item(true))}</nav>

      {toast && (
        <div role="status" className="fixed z-30 left-4 right-4 bottom-20 md:left-auto md:right-8 md:bottom-8 md:w-96 bg-ink text-sand rounded-2xl pl-4 pr-1.5 py-1.5 flex items-center gap-3 shadow-xl">
          <Icon name="check" className="text-[#7FD8C3] dark:text-accent" stroke={2.6} /><span className="flex-1 text-sm py-2">{toast.msg}</span>
          {toast.undo && <button onClick={() => { toast.undo(); setToast(null) }} className="h-11 px-3.5 rounded-xl bg-white/15 dark:bg-black/10 font-bold text-sm flex items-center gap-1.5"><Icon name="undo" size={16} />Annuler</button>}
        </div>
      )}
      {view === 'home' && !S.guided && <Tour onDone={() => update((s) => { s.guided = true })} />}
      {why && <WhyModal a={why} S={S} onClose={() => setWhy(null)} onAnswer={api.answer} />}
    </div>
  )
}
