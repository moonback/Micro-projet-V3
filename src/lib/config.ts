import { supabase } from './supabase'

export const SITE_CONFIG = {
  baseUrl: import.meta.env.VITE_SITE_URL || 
           (import.meta.env.DEV ? 'http://localhost:5173' : window.location.origin),
  name: 'MicroTask',
  description: 'Plateforme Locale de Délégation de Tâches',
  version: '1.0.0'
}

export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  storageKey: 'microtask-auth'
}

export const validateEnvironment = () => {
  const errors: string[] = []
  
  if (!SUPABASE_CONFIG.url) {
    errors.push('VITE_SUPABASE_URL is missing')
  }
  
  if (!SUPABASE_CONFIG.anonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is missing')
  }
  
  if (errors.length > 0) {
    console.error('Environment validation failed:', errors)
    throw new Error(`Missing environment variables: ${errors.join(', ')}`)
  }
  
  console.log('Environment validation passed')
  console.log('Supabase URL:', SUPABASE_CONFIG.url)
  console.log('Supabase Anon Key:', SUPABASE_CONFIG.anonKey ? 'Present' : 'Missing')
  
  return true
}

export const getRedirectUrl = (path: string = '') => {
  const baseUrl = SITE_CONFIG.baseUrl
  return `${baseUrl}${path}`
}

export const debugAuthState = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const { data: { user } } = await supabase.auth.getUser()
    
    console.log('=== AUTH DEBUG ===')
    console.log('Session:', session)
    console.log('User:', user)
    console.log('Local Storage Auth:', localStorage.getItem('microtask-auth'))
    console.log('Session Storage Auth:', sessionStorage.getItem('microtask-auth'))
    
    return { session, user }
  } catch (error) {
    console.error('Auth debug error:', error)
    return { session: null, user: null }
  }
}

// Configuration des messages d'erreur
export const ERROR_MESSAGES = {
  auth: {
    signInFailed: 'Échec de la connexion. Vérifiez vos identifiants.',
    signUpFailed: 'Échec de l\'inscription. Veuillez réessayer.',
    signOutFailed: 'Échec de la déconnexion.',
    sessionExpired: 'Votre session a expiré. Veuillez vous reconnecter.'
  },
  tasks: {
    createFailed: 'Erreur lors de la création de la tâche.',
    updateFailed: 'Erreur lors de la mise à jour de la tâche.',
    deleteFailed: 'Erreur lors de la suppression de la tâche.',
    loadFailed: 'Erreur lors du chargement des tâches.',
    notFound: 'Tâche non trouvée.'
  },
  messages: {
    sendFailed: 'Erreur lors de l\'envoi du message.',
    loadFailed: 'Erreur lors du chargement des messages.'
  },
  profile: {
    updateFailed: 'Erreur lors de la mise à jour du profil.',
    loadFailed: 'Erreur lors du chargement du profil.'
  },
  general: {
    networkError: 'Erreur de réseau. Vérifiez votre connexion.',
    unknownError: 'Une erreur inattendue s\'est produite.',
    permissionDenied: 'Permission refusée.'
  }
}

// Configuration des succès
export const SUCCESS_MESSAGES = {
  auth: {
    signInSuccess: 'Connexion réussie !',
    signUpSuccess: 'Inscription réussie !',
    signOutSuccess: 'Déconnexion réussie !'
  },
  tasks: {
    createSuccess: 'Tâche créée avec succès !',
    updateSuccess: 'Tâche mise à jour avec succès !',
    deleteSuccess: 'Tâche supprimée avec succès !',
    acceptSuccess: 'Tâche acceptée avec succès !',
    startSuccess: 'Tâche démarrée !',
    completeSuccess: 'Tâche marquée comme terminée !'
  },
  messages: {
    sendSuccess: 'Message envoyé !'
  },
  profile: {
    updateSuccess: 'Profil mis à jour avec succès !'
  }
}
