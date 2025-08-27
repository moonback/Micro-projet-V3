import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'

export function useAuthSync() {
  const { user, profile, loading, profileLoading, refreshProfile } = useAuth()
  const [isFullyAuthenticated, setIsFullyAuthenticated] = useState(false)
  const [syncLoading, setSyncLoading] = useState(true)

  // Vérifier si l'utilisateur est complètement authentifié
  useEffect(() => {
    if (user && profile && !loading && !profileLoading) {
      console.log('AuthSync: User fully authenticated')
      setIsFullyAuthenticated(true)
      setSyncLoading(false)
    } else if (!user && !loading) {
      console.log('AuthSync: No user, not authenticated')
      setIsFullyAuthenticated(false)
      setSyncLoading(false)
    } else {
      console.log('AuthSync: Still loading or syncing...', { user: !!user, profile: !!profile, loading, profileLoading })
      setSyncLoading(true)
    }
  }, [user, profile, loading, profileLoading])

  // Fonction pour forcer la synchronisation
  const forceSync = useCallback(async () => {
    if (user && !profile) {
      console.log('AuthSync: Forcing profile refresh')
      setSyncLoading(true)
      await refreshProfile()
    }
  }, [user, profile, refreshProfile])

  // Fonction pour vérifier l'état de la session
  const checkSessionState = useCallback(() => {
    console.log('AuthSync: Current state:', {
      user: user?.id,
      profile: profile?.id,
      loading,
      profileLoading,
      isFullyAuthenticated,
      syncLoading
    })
  }, [user, profile, loading, profileLoading, isFullyAuthenticated, syncLoading])

  return {
    user,
    profile,
    loading: syncLoading,
    isFullyAuthenticated,
    forceSync,
    checkSessionState,
    // États détaillés pour le débogage
    authLoading: loading,
    profileLoading,
    hasUser: !!user,
    hasProfile: !!profile
  }
}
