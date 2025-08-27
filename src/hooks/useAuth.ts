import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Database } from '../lib/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

// Cache persistant avec localStorage
const getProfileCache = (): Map<string, Profile> => {
  try {
    const cached = localStorage.getItem('profileCache')
    if (cached) {
      const parsed = JSON.parse(cached)
      return new Map(Object.entries(parsed))
    }
  } catch (error) {
    console.warn('Error reading profile cache from localStorage:', error)
  }
  return new Map()
}

const saveProfileCache = (cache: Map<string, Profile>) => {
  try {
    const obj = Object.fromEntries(cache)
    localStorage.setItem('profileCache', JSON.stringify(obj))
  } catch (error) {
    console.warn('Error saving profile cache to localStorage:', error)
  }
}

let profileCache: Map<string, Profile> = getProfileCache()
let loadingProfiles: Set<string> = new Set()

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const mountedRef = useRef(true)
  const profileLoadAttempts = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    mountedRef.current = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (mountedRef.current) {
          if (session?.user) {
            console.log('Initial session found:', session.user.id)
            setUser(session.user)
            setLoading(true)
            await loadProfile(session.user.id)
          } else {
            console.log('No initial session found')
            setLoading(false)
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return
        
        console.log('Auth state changed:', event, session?.user?.id)
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in, loading profile...')
          setUser(session.user)
          setLoading(true)
          setProfileLoading(true)
          await loadProfile(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out')
          setUser(null)
          setProfile(null)
          setLoading(false)
          setProfileLoading(false)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('Token refreshed')
          setUser(session.user)
          // Vérifier si le profil est déjà chargé
          if (!profile) {
            console.log('Profile not loaded after token refresh, loading...')
            setProfileLoading(true)
            await loadProfile(session.user.id)
          }
        } else if (event === 'USER_UPDATED' && session?.user) {
          console.log('User updated')
          setUser(session.user)
        } else if (session?.user && !profile) {
          console.log('Session exists but no profile, loading...')
          setUser(session.user)
          setLoading(true)
          setProfileLoading(true)
          await loadProfile(session.user.id)
        } else if (!session?.user) {
          console.log('No session')
          setUser(null)
          setProfile(null)
          setLoading(false)
          setProfileLoading(false)
        }
      }
    )

    getInitialSession()

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [profile]) // Ajouter profile comme dépendance

  const loadProfile = async (userId: string) => {
    if (!mountedRef.current) return

    // Vérifier le cache
    if (profileCache.has(userId)) {
      console.log('Using cached profile for user:', userId)
      const cachedProfile = profileCache.get(userId)!
      if (mountedRef.current) {
        setProfile(cachedProfile)
        setLoading(false)
        setProfileLoading(false)
      }
      return
    }

    // Éviter les chargements multiples du même profil
    if (loadingProfiles.has(userId)) {
      console.log('Profile already loading for user:', userId)
      return
    }

    loadingProfiles.add(userId)
    setProfileLoading(true)

    try {
      console.log('Loading profile for user:', userId)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code === 'PGRST116') {
        // Profil non trouvé, le créer automatiquement
        console.log('Profile not found, creating new profile...')
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            name: 'Nouvel Utilisateur',
            rating: 0,
            rating_count: 0,
            is_verified: false
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating profile:', createError)
          throw createError
        }

        console.log('New profile created:', newProfile)
        
        // Mettre en cache et persister
        profileCache.set(userId, newProfile)
        saveProfileCache(profileCache)
        
        if (mountedRef.current) {
          setProfile(newProfile)
          setLoading(false)
          setProfileLoading(false)
        }
      } else if (error) {
        console.error('Error loading profile:', error)
        
        // Réessayer en cas d'erreur temporaire
        const attempts = profileLoadAttempts.current.get(userId) || 0
        if (attempts < 3) {
          profileLoadAttempts.current.set(userId, attempts + 1)
          console.log(`Retrying profile load in ${1000 * (attempts + 1)}ms (attempt ${attempts + 1}/3)`)
          setTimeout(() => {
            if (mountedRef.current) {
              loadProfile(userId)
            }
          }, 1000 * (attempts + 1)) // Retry avec délai croissant
          return
        }
        
        throw error
      } else {
        console.log('Profile loaded successfully:', data)
        
        // Mettre en cache et persister
        profileCache.set(userId, data)
        saveProfileCache(profileCache)
        
        if (mountedRef.current) {
          setProfile(data)
          setLoading(false)
          setProfileLoading(false)
        }
      }
    } catch (error) {
      console.error('Error in loadProfile:', error)
      if (mountedRef.current) {
        setLoading(false)
        setProfileLoading(false)
      }
    } finally {
      loadingProfiles.delete(userId)
      profileLoadAttempts.current.delete(userId)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (data.user && !error) {
        console.log('User signed in:', data.user.id)
        // Le profil sera chargé automatiquement par onAuthStateChange
      }
      
      return { error }
    } catch (error) {
      console.error('Sign in error:', error)
      setLoading(false)
      return { error }
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('Signing up user:', email, name)
      setLoading(true)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      })

      if (data.user && !error) {
        console.log('User signed up:', data.user.id)
        
        // Créer le profil immédiatement
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          name: name,
          rating: 0,
          rating_count: 0,
          is_verified: false
        })

        if (profileError) {
          console.error('Error creating profile during signup:', profileError)
        } else {
          console.log('Profile created during signup')
          // Mettre en cache
          const newProfile = {
            id: data.user.id,
            name: name,
            rating: 0,
            rating_count: 0,
            is_verified: false
          } as Profile
          profileCache.set(data.user.id, newProfile)
          saveProfileCache(profileCache)
        }
      }

      return { data, error }
    } catch (error) {
      console.error('Sign up error:', error)
      setLoading(false)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
      }
      // Vider le cache du profil
      if (user) {
        profileCache.delete(user.id)
        saveProfileCache(profileCache)
      }
      return { error }
    } catch (error) {
      console.error('Sign out error:', error)
      return { error }
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user') }

    try {
      setProfileLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (data) {
        // Mettre à jour le cache et persister
        profileCache.set(user.id, data)
        saveProfileCache(profileCache)
        console.log('Profile updated:', data)
        
        if (mountedRef.current) {
          setProfile(data)
        }
      }

      return { data, error }
    } catch (error) {
      console.error('Update profile error:', error)
      return { error }
    } finally {
      if (mountedRef.current) {
        setProfileLoading(false)
      }
    }
  }

  // Fonction pour forcer le rechargement du profil
  const refreshProfile = async () => {
    if (user) {
      profileCache.delete(user.id)
      await loadProfile(user.id)
    }
  }

  return {
    user,
    profile,
    loading,
    profileLoading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
  }
}