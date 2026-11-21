import { useState, useRef } from 'react'
import Icon from '../components/Icon.jsx'
import { SEASONS } from '../lib/anomalies.js'
import { freshState, parseBackup } from '../lib/store.js'
import { longDate } from '../lib/dates.js'
import { buildEnvelopes } from '../lib/categories.js'

function Toggle({ label, hint, on, onChange }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-line last:border-0">
      <span className="flex-1 min-w-0"><span className="block font-semibold">{label}</span>{hint && <span className="block text-xs text-muted">{hint}</span>}</span>
      <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className="h-11 flex items-center">
        <span className={`relative w-13 h-8 rounded-full ${on ? 'bg-accent' : 'bg-[#B9B1A1] dark:bg-[#5A626B]'}`}><span className={`absolute top-1 size-6 rounded-full bg-white transition-all ${on ? 'left-6' : 'left-1'}`} /></span>
      </button>
    </div>
  )
}
function Seg({ label, value, options, onChange }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-line last:border-0 flex-wrap">
      <span className="flex-1 font-semibold">{label}</span>
      <div className="flex gap-1 bg-soft p-1 rounded-xl">
        {options.map(([v, l]) => <button key={v} onClick={() => onChange(v)} aria-pressed={value === v} className={`h-10 px-3 rounded-lg text-sm font-semibold ${value === v ? 'bg-card shadow-sm' : 'text-muted'}`}>{l}</button>)}
      </div>
    </div>
  )
}
const Section = ({ title, children }) => (
  <section className="flex flex-col gap-1.5"><h2 className="text-xs font-bold uppercase tracking-wider text-muted">{title}</h2><div className="bg-card rounded-3xl px-4 py-1">{children}</div></section>
)

export default function Settings({ S, update, api }) {
  const [confirm, setConfirm] = useState(null)
  const [backup, setBackup] = useState(null)       // sauvegarde lue, en attente de confirmation
  const [importError, setImportError] = useState('')
  const file = useRef(null)
  const pick = async (e) => {
    const f = e.target.files?.[0]; e.target.value = ''
    if (!f) return
    try { setBackup(parseBackup(await f.text())); setImportError('') } catch (err) { setBackup(null); setImportError(err.message) }
  }
  const restore = () => {
    const old = structuredClone(S)
    const swap = (next) => (s) => { Object.keys(s).forEach((k) => delete s[k]); Object.assign(s, structuredClone(next)) }
    update(swap(backup.state))
    api.toast(`Sauvegarde importée : ${backup.state.tx.length} dépenses`, () => update(swap(old)))
    setBackup(null); api.go('home')
  }
  const set = (fn) => update((s) => fn(s.settings))
  const learned = Object.values(S.learned).reduce((a, b) => a + b, 0)

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-2xl md:text-3xl font-bold">Réglages</h1>
      <div className="grid gap-5 md:grid-cols-2 md:items-start">
        <div className="flex flex-col gap-5">
          <Section title="Affichage">
            <Toggle label="Mode économie automatique" hint="Simplifie l'accueil quand la batterie est faible" on={S.settings.eco} onChange={(v) => set((x) => { x.eco = v })} />
            <Toggle label="Thème sombre" on={S.settings.dark} onChange={(v) => set((x) => { x.dark = v })} />
            <Seg label="Taille du texte" value={S.settings.size} options={[['s', 'Petit'], ['m', 'Moyen'], ['l', 'Grand']]} onChange={(v) => set((x) => { x.size = v })} />
          </Section>
          <Section title="Saisons prises en compte">
            {SEASONS.map((se) => <Toggle key={se.id} label={se.name} hint="Une hausse normale à cette période ne déclenche pas d'alerte" on={S.settings.seasons[se.id]} onChange={(v) => set((x) => { x.seasons[se.id] = v })} />)}
          </Section>
          <Section title="Zakat">
            <Toggle label="Afficher la carte Zakat" hint="Dans les enveloppes, avec les montants que tu saisis" on={S.zakat.on} onChange={(v) => update((s) => { s.zakat.on = v })} />
          </Section>
          <Section title="Alertes">
            <Seg label="Sensibilité" value={S.settings.sens} options={[[3, 'Basse (×3)'], [2, 'Normale (×2)'], [1.5, 'Haute (×1,5)']]} onChange={(v) => set((x) => { x.sens = v })} />
            <div className="flex items-center gap-3 py-2.5">
              <span className="flex-1"><span className="block font-semibold">Ce qu’EcoBudget a appris</span><span className="block text-xs text-muted">{learned} réponse{learned > 1 ? 's' : ''} « c'était prévu »</span></span>
              <button disabled={!learned} onClick={() => update((s) => { s.learned = {}; s.feedback = {} })} className="h-11 px-3.5 rounded-xl border border-line font-semibold text-sm disabled:opacity-40">Oublier</button>
            </div>
          </Section>
        </div>

        <div className="flex flex-col gap-5">
          <Section title="Budget">
            <label className="flex items-center justify-between gap-3 py-2.5"><span className="font-semibold">Revenu mensuel (DA)</span>
              <input type="number" min="0" step="1000" value={S.income} onChange={(e) => update((s) => { s.income = Math.max(0, parseInt(e.target.value || '0', 10)) })} className="h-11 w-32 px-3 rounded-xl border border-line bg-sand font-semibold text-right" /></label>
            <div className="flex items-center gap-3 py-2.5 border-t border-line"><span className="flex-1 text-sm text-muted">Recalculer les enveloppes à partir du revenu</span>
              <button onClick={() => update((s) => { s.envelopes = buildEnvelopes(s.income) })} className="h-11 px-3.5 rounded-xl border border-line font-semibold text-sm">Répartir</button></div>
          </Section>

          <Section title="Sauvegarde">
            <p className="text-sm text-muted pt-2.5">Tes données restent dans ce navigateur. Exporte-les pour les garder en sécurité ou les retrouver sur un autre appareil.</p>
            {backup ? (
              <div role="alert" className="py-3 flex flex-col gap-2.5">
                <p className="font-semibold">Remplacer tes données actuelles par cette sauvegarde{backup.date ? ` du ${longDate(backup.date).toLowerCase()}` : ''} ({backup.state.tx.length} dépenses, {backup.state.goals.length} objectifs) ?</p>
                <div className="flex gap-2">
                  <button onClick={restore} className="h-11 px-4 rounded-xl bg-ink text-sand font-semibold text-sm">Oui, importer</button>
                  <button onClick={() => setBackup(null)} className="h-11 px-4 rounded-xl border border-line font-semibold text-sm">Annuler</button>
                </div>
              </div>
            ) : (
              <div className="py-2.5 flex flex-wrap gap-2">
                <button onClick={api.exportData} className="h-11 px-3.5 rounded-xl bg-ink text-sand font-semibold text-sm">Exporter mes données</button>
                <button onClick={() => file.current?.click()} className="h-11 px-3.5 rounded-xl border border-line font-semibold text-sm">Importer une sauvegarde</button>
                <input ref={file} type="file" accept=".json,application/json" onChange={pick} className="sr-only" tabIndex={-1} aria-label="Fichier de sauvegarde EcoBudget" />
              </div>
            )}
            {importError && <p role="alert" className="text-sm text-danger font-semibold pb-2.5">{importError}</p>}
          </Section>

          <Section title="Aide">
            <div className="flex items-center gap-3 py-2.5"><span className="flex-1 text-sm text-muted">Revoir la visite qui présente la batterie, la saisie rapide, les enveloppes et les alertes.</span>
              <button onClick={() => { update((s) => { s.guided = false }); api.go('home') }} className="h-11 px-3.5 rounded-xl border border-line font-semibold text-sm whitespace-nowrap">Revoir le guide</button></div>
          </Section>

          <Section title="Données">
            {confirm ? (
              <div role="alert" className="py-3 flex flex-col gap-2.5">
                <p className="font-semibold">{confirm === 'demo' ? 'Remettre les données de démonstration ? Tes dépenses ajoutées seront perdues.' : 'Tout effacer et repartir de zéro ? Cette action est définitive.'}</p>
                <div className="flex gap-2">
                  <button onClick={() => { update((s) => { const f = freshState(s.income, confirm === 'demo'); Object.assign(s, f, { onboarded: confirm === 'demo', settings: s.settings }) }); setConfirm(null); api.go('home') }} className="h-11 px-4 rounded-xl bg-danger text-white dark:text-black font-semibold text-sm">Oui, confirmer</button>
                  <button onClick={() => setConfirm(null)} className="h-11 px-4 rounded-xl border border-line font-semibold text-sm">Annuler</button>
                </div>
              </div>
            ) : (
              <div className="py-2.5 flex flex-wrap gap-2">
                <button onClick={() => setConfirm('demo')} className="h-11 px-3.5 rounded-xl border border-line font-semibold text-sm">Remettre les données de démo</button>
                <button onClick={() => setConfirm('wipe')} className="h-11 px-3.5 rounded-xl border border-line font-semibold text-sm text-danger">Tout effacer</button>
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  )
}
