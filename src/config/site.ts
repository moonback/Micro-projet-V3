// Configuration des URLs selon l'environnement
export const SITE_CONFIG = {
  // URL de base du site
  baseUrl: import.meta.env.VITE_SITE_URL || 
           (import.meta.env.DEV ? 'http://localhost:5173' : window.location.origin),
  
  // URL de redirection après vérification d'email
  redirectUrl: import.meta.env.VITE_SITE_URL || 
               (import.meta.env.DEV ? 'http://localhost:5173' : window.location.origin),
  
  // Nom du site
  siteName: 'MicroTask',
  
  // Support email
  supportEmail: 'support@microtask.com'
}

// Fonction utilitaire pour obtenir l'URL de redirection
export const getRedirectUrl = (path: string = '') => {
  const baseUrl = SITE_CONFIG.redirectUrl
  return path ? `${baseUrl}${path}` : baseUrl
}

// Fonction pour vérifier si on est en développement
export const isDevelopment = import.meta.env.DEV

// Fonction pour vérifier si on est en production
export const isProduction = import.meta.env.PROD
