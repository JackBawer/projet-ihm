// Les enveloppes par défaut et les mots-clés qui permettent de deviner la catégorie.
export const DEFAULT_ENVELOPES = [
  { id: 'courses', name: 'Courses', icon: 'cart', color: '#0E7C66', share: 0.36 },
  { id: 'transport', name: 'Transport', icon: 'bus', color: '#2563EB', share: 0.14 },
  { id: 'sorties', name: 'Sorties', icon: 'cup', color: '#C2410C', share: 0.19 },
  { id: 'autres', name: 'Autres', icon: 'dots', color: '#6B6558', share: 0.11 },
  { id: 'epargne', name: 'Épargne', icon: 'piggy', color: '#7C3AED', share: 0.20, saving: true },
]

export const KEYWORDS = {
  courses: ['courses', 'pain', 'lait', 'epicerie', 'superette', 'marche', 'legumes', 'fruits', 'viande', 'poulet', 'eau', 'oeufs', 'supermarche', 'huile', 'sucre', 'farine', 'pates', 'riz', 'fromage', 'yaourt'],
  transport: ['taxi', 'bus', 'metro', 'tram', 'tramway', 'yassir', 'heetch', 'essence', 'carburant', 'train', 'fourgon', 'telepherique', 'parking', 'peage'],
  sorties: ['cafe', 'resto', 'restaurant', 'pizza', 'cine', 'cinema', 'sortie', 'burger', 'sandwich', 'glace', 'chawarma', 'tacos', 'the', 'jus', 'patisserie', 'gateau', 'soiree'],
  autres: ['recharge', 'internet', 'telephone', 'vetements', 'livre', 'cadeau', 'coiffeur', 'pharmacie', 'photocopies', 'photocopie', 'medicaments', 'fournitures', 'abonnement', 'cahier', 'cahiers', 'stylo', 'stylos', 'classeur', 'impression'],
}

// "Café" -> "cafe" : minuscules et sans accents, pour comparer les mots.
export const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function buildEnvelopes(income) {
  return DEFAULT_ENVELOPES.map(({ share, ...e }) => ({ ...e, budget: Math.round((income * share) / 500) * 500 }))
}
