import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Database } from '../lib/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

// Cache global pour éviter les rechargements multiples
let profileCache: Map<string, Profile> = new Map()
let loadingProfiles: Set<string> = new Set()

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...')
        const { data: { session } } = await supabase.auth.getSession()
        
        if (mountedRef.current) {
          if (session?.user) {
            console.log('Initial session found for user:', session.user.id)
            setUser(session.user)
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
          console.log('User signed in:', session.user.id)
          setUser(session.user)
          await loadProfile(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out')
          setUser(null)
          setProfile(null)
          setLoading(false)
          // Vider le cache
          profileCache.clear()
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('Token refreshed for user:', session.user.id)
          setUser(session.user)
          // Vérifier que le profil est toujours chargé
          if (!profile) {
            await loadProfile(session.user.id)
          }
        } else if (event === 'USER_UPDATED' && session?.user) {
          console.log('User updated:', session.user.id)
          setUser(session.user)
        } else if (session?.user && !profile) {
          console.log('Session exists but no profile, loading profile...')
          setUser(session.user)
          await loadProfile(session.user.id)
        } else if (!session?.user) {
          console.log('No session, clearing user data')
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    )

    getInitialSession()

    // Timeout de sécurité pour éviter les blocages infinis
    const safetyTimeout = setTimeout(() => {
      if (mountedRef.current && loading) {
        console.log('Safety timeout reached (15s), forcing loading to false')
        setLoading(false)
      }
    }, 15000) // 15 secondes

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
      clearTimeout(safetyTimeout)
    }
  }, [])

  const loadProfile = async (userId: string) => {
    // Vérifier le cache
    if (profileCache.has(userId)) {
      console.log('Using cached profile for user:', userId)
      if (mountedRef.current) {
        setProfile(profileCache.get(userId)!)
        setLoading(false)
      }
      return
    }

    // Éviter les chargements multiples du même profil
    if (loadingProfiles.has(userId)) {
      console.log('Profile already loading for user:', userId)
      return
    }

    loadingProfiles.add(userId)

    try {
      console.log('Loading profile for user:', userId)
      
      // Test de connexion à la base
      console.log('Testing Supabase connection...')
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      console.log('Connection test - data:', testData, 'error:', testError)
      
      // Requête principale avec timeout
      console.log('Starting main profile query...')
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // Timeout de 10 secondes pour la requête
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile query timeout after 10s')), 10000)
      })

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any

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
        
        // Mettre en cache
        profileCache.set(userId, newProfile)
        
        if (mountedRef.current) {
          setProfile(newProfile)
          setLoading(false)
        }
      } else if (error) {
        console.error('Error loading profile:', error)
        throw error
      } else {
        console.log('Profile loaded:', data)
        
        // Mettre en cache
        profileCache.set(userId, data)
        
        if (mountedRef.current) {
          setProfile(data)
          setLoading(false)
        }
      }
    } catch (error) {
      console.error('Error in loadProfile:', error)
      if (mountedRef.current) {
        setLoading(false)
      }
    } finally {
      loadingProfiles.delete(userId)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Signing in user:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (data.user && !error) {
        console.log('User signed in successfully:', data.user.id)
        // Le profil sera chargé automatiquement par onAuthStateChange
      }
      
      return { error }
    } catch (error) {
      console.error('Sign in error:', error)
      return { error }
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('Signing up user:', email, name)
      
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
        console.log('User signed up successfully:', data.user.id)
        
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
          profileCache.set(data.user.id, {
            id: data.user.id,
            name: name,
            rating: 0,
            rating_count: 0,
            is_verified: false,
            phone: null,
            avatar_url: null,
            created_at: new Date().toISOString()
          })
        }
      }

      return { data, error }
    } catch (error) {
      console.error('Sign up error:', error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      console.log('Signing out user')
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
      } else {
        // Vider le cache du profil
        if (user) {
          profileCache.delete(user.id)
        }
        // Réinitialiser l'état local
        setUser(null)
        setProfile(null)
        setLoading(false)
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
      console.log('Updating profile for user:', user.id)
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (data) {
        // Mettre à jour le cache
        profileCache.set(user.id, data)
        console.log('Profile updated successfully:', data)
        
        if (mountedRef.current) {
          setProfile(data)
        }
      }

      return { data, error }
    } catch (error) {
      console.error('Update profile error:', error)
      return { error }
    }
  }

  // Fonction pour forcer le rechargement du profil
  const refreshProfile = async () => {
    if (user) {
      console.log('Refreshing profile for user:', user.id)
      // Vider le cache pour forcer le rechargement
      profileCache.delete(user.id)
      await loadProfile(user.id)
    }
  }

  // Fonction pour créer le profil si il n'existe pas
  const ensureProfile = async () => {
    if (!user) return false

    try {
      console.log('Ensuring profile exists for user:', user.id)
      
      // Vérifier si le profil existe
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        // Profil n'existe pas, le créer
        console.log('Profile does not exist, creating new profile...')
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'Nouvel Utilisateur',
            rating: 0,
            rating_count: 0,
            is_verified: false
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating profile:', createError)
          return false
        }

        console.log('Profile created successfully:', newProfile)
        // Mettre en cache
        profileCache.set(user.id, newProfile)
        setProfile(newProfile)
        return true
      } else if (profileError) {
        console.error('Error checking profile:', profileError)
        return false
      } else {
        console.log('Profile already exists:', existingProfile)
        return true
      }
    } catch (error) {
      console.error('Error ensuring profile:', error)
      return false
    }
  }

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
    ensureProfile,
  }
}