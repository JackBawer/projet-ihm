# EcoBudget — la batterie de ton budget

Projet IHM (thème 4, EcoBudget). Application de gestion de budget personnel en React + Tailwind CSS.

## Lancer le projet

Il faut Node.js 20 ou plus récent.

```bash
npm install
npm run dev      # ouvre http://localhost:5173
npm run build    # version finale dans le dossier dist/
```

Aucun serveur ni base de données : les données sont enregistrées dans le navigateur (localStorage).
Pour repartir de zéro : Réglages > Données.

## Ce que fait l'app

| Écran | Rôle |
|---|---|
| Démarrage | 3 questions à choix, bouton « Passer », enveloppes pré-remplies |
| Batterie (accueil) | Montant dépensable par jour, batterie du budget, « tu tiens jusqu'au… », 7 derniers jours |
| Saisie en phrase | « taxi 300 », « café 50 hier carte » : catégorie, montant, date et paiement devinés |
| Enveloppes | Budget par catégorie, dépenses du mois, modification du budget, suppression avec « Annuler » |
| Alertes | Dépenses inhabituelles, prise en compte des saisons, « Pourquoi cette alerte ? », « C'était prévu ? » |
| Et si… | Simule un achat et montre l'effet sur la batterie |
| Historique | Calendrier du mois coloré par jour, détail d'un jour, répartition par catégorie |
| Réglages | Mode économie, thème sombre, taille du texte, saisons, sensibilité |

## Où se trouve quoi

```
src/
  App.jsx                 navigation, message de confirmation avec « Annuler »
  lib/
    parser.js             comprend la phrase tapée (innovation 1)
    anomalies.js          détection des dépenses inhabituelles + saisons (innovation 2)
    budget.js             calculs de l'accueil : par jour, batterie, rythme
    seed.js               données de démonstration
    store.js              état de l'app + sauvegarde localStorage
    categories.js         enveloppes par défaut et mots-clés
    dates.js              dates et formatage des montants
  components/             Battery, QuickAdd, WhyModal, ClassicForm, Icon
  views/                  un fichier par écran
```

## Comment marche la détection (à savoir expliquer)

Pour chaque jour et chaque catégorie, on compare le total du jour à la moyenne du **même jour de la semaine**
sur les 8 semaines précédentes.

- Alerte si le total atteint 2 fois la moyenne (réglable) et dépasse la moyenne d'au moins 800 DA.
- Pendant une saison activée (Ramadan et Aïd, rentrée, été), le seuil est multiplié par 1,75 :
  une hausse normale pour la période ne déclenche rien, et s'affiche comme « pas d'alerte ».
- Chaque réponse « Oui, c'était prévu » relève le seuil de 0,5 pour ce couple catégorie + jour de la semaine.

Les dates du Ramadan et des Aïds dans `anomalies.js` sont approximatives (calendrier lunaire) : à ajuster.

## Les données de démonstration

Elles sont générées par rapport à la date du jour (5 mois en arrière) :
une grosse sortie le dernier samedi déclenche une alerte, et la hausse des courses de la rentrée n'en déclenche pas.

## Dépenses fixes

Onglet Enveloppes > Dépenses fixes : internet, loyer, salle de sport… (montant, jour du mois, enveloppe).
Tant qu'une dépense fixe du mois n'est pas marquée « Payé », son montant est retiré d'avance de ce que tu peux dépenser.
« Payé » la transforme en vraie dépense du jour : le budget du jour ne bouge pas, puisqu'elle était déjà réservée.
La batterie est mesurée sur le budget libre (sans les dépenses fixes), et les paiements fixes ne déclenchent pas d'alerte.
