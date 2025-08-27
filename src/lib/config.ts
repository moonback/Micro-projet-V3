// Configuration de l'application
export const APP_CONFIG = {
  name: 'MicroTask',
  version: '1.0.0',
  description: 'Plateforme locale de délégation de tâches',
  
  // Configuration des cartes
  map: {
    defaultCenter: {
      lat: 48.8566, // Paris
      lng: 2.3522
    },
    defaultZoom: 13,
    tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors'
  },
  
  // Configuration des tâches
  tasks: {
    categories: [
      'Livraison',
      'Nettoyage', 
      'Courses',
      'Déménagement',
      'Montage',
      'Garde d\'Animaux',
      'Jardinage',
      'Aide Informatique',
      'Cours Particuliers',
      'Autre'
    ],
    statuses: {
      open: 'Ouverte',
      accepted: 'Acceptée',
      'in-progress': 'En Cours',
      completed: 'Terminée',
      cancelled: 'Annulée'
    },
    defaultRadius: 5, // km
    radiusOptions: [1, 5, 10, 25, 50]
  },
  
  // Configuration des notifications
  notifications: {
    defaultDuration: 5000, // ms
    maxVisible: 3
  },
  
  // Configuration de l'interface
  ui: {
    minTouchTarget: 44, // px
    maxWidth: 'md', // Tailwind max-width
    borderRadius: 'lg',
    transitionDuration: 200 // ms
  }
}

// Validation des variables d'environnement
export const validateEnvironment = () => {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ]
  
  const missing = requiredVars.filter(varName => !import.meta.env[varName])
  
  if (missing.length > 0) {
    throw new Error(
      `Variables d'environnement manquantes: ${missing.join(', ')}\n` +
      'Vérifiez votre fichier .env'
    )
  }
}

// Configuration Supabase
export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
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
