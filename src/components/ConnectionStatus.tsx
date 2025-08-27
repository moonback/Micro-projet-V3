import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { useConnectionRetry } from '../hooks/useConnectionRetry'

export function ConnectionStatus() {
  const { user, profile, loading, profileLoading, refreshProfile } = useAuth()
  const { isRetrying, retryCount, lastError, retryWithBackoff, checkNetworkConnection } = useConnectionRetry()

  if (loading) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Connexion en cours...</span>
          </div>
        </div>
      </div>
    )
  }

  if (profileLoading) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Chargement du profil...</span>
          </div>
        </div>
      </div>
    )
  }

  if (user && !profile) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <span>Erreur de profil</span>
              <button
                onClick={refreshProfile}
                className="bg-white text-red-500 px-2 py-1 rounded text-sm hover:bg-gray-100"
              >
                Réessayer
              </button>
            </div>
            {lastError && (
              <div className="text-xs opacity-90">
                Erreur: {lastError.message}
              </div>
            )}
            <div className="flex space-x-2">
              <button
                onClick={() => retryWithBackoff(() => checkNetworkConnection(), 'vérification réseau')}
                className="bg-white text-red-500 px-2 py-1 rounded text-xs hover:bg-gray-100"
              >
                Tester réseau
              </button>
              <button
                onClick={() => retryWithBackoff(() => refreshProfile(), 'chargement profil')}
                className="bg-white text-red-500 px-2 py-1 rounded text-xs hover:bg-gray-100"
              >
                Recharger
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (user && profile) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>Connecté: {profile.name}</span>
            {isRetrying && (
              <div className="flex items-center space-x-1 text-xs opacity-90">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                <span>Reconnexion ({retryCount})</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}
