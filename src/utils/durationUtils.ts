/**
 * Utilitaires pour la gestion des durées dans l'application MicroTask
 * Conversion entre formats français et PostgreSQL interval
 */

// Conversion de durée française vers format PostgreSQL interval
export const convertDurationToInterval = (duration: string): string | null => {
  if (!duration.trim()) return null
  
  const durationLower = duration.toLowerCase().trim()
  
  // Mapping des durées françaises vers PostgreSQL interval
  const durationMap: { [key: string]: string } = {
    // Heures
    '1 heur': '1 hour',
    '2 heurs': '2 hours', 
    '3 heurs': '3 hours',
    '4 heurs': '4 hours',
    '5 heurs': '5 hours',
    '6 heurs': '6 hours',
    '7 heurs': '7 hours',
    '8 heurs': '8 hours',
    '9 heurs': '9 hours',
    '10 heurs': '10 hours',
    '11 heurs': '11 hours',
    '12 heurs': '12 hours',
    
    // Minutes
    '15 minutes': '15 minutes',
    '30 minutes': '30 minutes',
    '45 minutes': '45 minutes',
    
    // Jours
    '1 jour': '1 day',
    '2 jours': '2 days',
    '3 jours': '3 days',
    '1 semaine': '1 week',
    '2 semaines': '2 weeks',
    
    // Formats alternatifs
    '1h': '1 hour',
    '2h': '2 hours',
    '3h': '3 hours',
    '4h': '4 hours',
    '5h': '5 hours',
    '6h': '6 hours',
    '7h': '7 hours',
    '8h': '8 hours',
    '1j': '1 day',
    '2j': '2 days',
    '1s': '1 week',
    '2s': '2 weeks'
  }
  
  // Vérifier d'abord les correspondances exactes
  if (durationMap[durationLower]) {
    return durationMap[durationLower]
  }
  
  // Gérer les formats avec nombres
  const hourMatch = durationLower.match(/^(\d+)\s*heurs?$/)
  if (hourMatch) {
    const hours = parseInt(hourMatch[1])
    return hours === 1 ? '1 hour' : `${hours} hours`
  }
  
  const dayMatch = durationLower.match(/^(\d+)\s*jours?$/)
  if (dayMatch) {
    const days = parseInt(dayMatch[1])
    return days === 1 ? '1 day' : `${days} days`
  }
  
  const weekMatch = durationLower.match(/^(\d+)\s*semaines?$/)
  if (weekMatch) {
    const weeks = parseInt(weekMatch[1])
    return weeks === 1 ? '1 week' : `${weeks} weeks`
  }
  
  const minuteMatch = durationLower.match(/^(\d+)\s*minutes?$/)
  if (minuteMatch) {
    const minutes = parseInt(minuteMatch[1])
    return `${minutes} minutes`
  }
  
  // Si aucun format reconnu, essayer de parser intelligemment
  if (durationLower.includes('heur') || durationLower.includes('h')) {
    return '1 hour' // Valeur par défaut sécurisée
  }
  
  if (durationLower.includes('jour') || durationLower.includes('j')) {
    return '1 day' // Valeur par défaut sécurisée
  }
  
  if (durationLower.includes('semaine') || durationLower.includes('s')) {
    return '1 week' // Valeur par défaut sécurisée
  }
  
  // Retourner null si le format n'est pas reconnu
  console.warn(`Format de durée non reconnu: "${duration}". Utilisation de la valeur par défaut.`)
  return null
}

// Conversion de format PostgreSQL interval vers format français d'affichage
export const formatDurationForDisplay = (duration: string | null): string => {
  if (!duration) return 'Non définie'
  
  const durationLower = duration.toLowerCase()
  
  // Mapping inverse pour l'affichage
  const displayMap: { [key: string]: string } = {
    '1 hour': '1 heure',
    '2 hours': '2 heures',
    '3 hours': '3 heures',
    '4 hours': '4 heures',
    '5 hours': '5 heures',
    '6 hours': '6 heures',
    '7 hours': '7 heures',
    '8 hours': '8 heures',
    '9 hours': '9 heures',
    '10 hours': '10 heures',
    '11 hours': '11 heures',
    '12 hours': '12 heures',
    
    '15 minutes': '15 minutes',
    '30 minutes': '30 minutes',
    '45 minutes': '45 minutes',
    
    '1 day': '1 jour',
    '2 days': '2 jours',
    '3 days': '3 jours',
    '1 week': '1 semaine',
    '2 weeks': '2 semaines'
  }
  
  // Vérifier les correspondances exactes
  if (displayMap[durationLower]) {
    return displayMap[durationLower]
  }
  
  // Parser les formats avec nombres
  const hourMatch = durationLower.match(/^(\d+)\s*hours?$/)
  if (hourMatch) {
    const hours = parseInt(hourMatch[1])
    return hours === 1 ? '1 heure' : `${hours} heures`
  }
  
  const dayMatch = durationLower.match(/^(\d+)\s*days?$/)
  if (dayMatch) {
    const days = parseInt(dayMatch[1])
    return days === 1 ? '1 jour' : `${days} jours`
  }
  
  const weekMatch = durationLower.match(/^(\d+)\s*weeks?$/)
  if (weekMatch) {
    const weeks = parseInt(weekMatch[1])
    return weeks === 1 ? '1 semaine' : `${weeks} semaines`
  }
  
  const minuteMatch = durationLower.match(/^(\d+)\s*minutes?$/)
  if (minuteMatch) {
    const minutes = parseInt(minuteMatch[1])
    return `${minutes} minutes`
  }
  
  // Si aucun format reconnu, retourner la valeur originale
  return duration
}

// Validation de format de durée
export const isValidDurationFormat = (duration: string): boolean => {
  if (!duration.trim()) return true // Vide est valide (optionnel)
  
  const converted = convertDurationToInterval(duration)
  return converted !== null
}

// Suggestions de durées communes
export const getCommonDurationSuggestions = (): string[] => [
  '30 minutes',
  '1 heure',
  '2 heures',
  '3 heures',
  '4 heures',
  '6 heures',
  '8 heures',
  '1 jour',
  '2 jours',
  '1 semaine'
]
