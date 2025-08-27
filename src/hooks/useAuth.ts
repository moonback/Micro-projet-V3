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
      // Timeout de sécurité pour le démarrage
      const startupTimeoutId = setTimeout(() => {
        if (mountedRef.current && loading) {
          console.log('Startup timeout after 15s, forcing loading to false')
          setLoading(false)
        }
      }, 15000) // 15 secondes

      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        // Annuler le timeout car l'opération s'est terminée
        clearTimeout(startupTimeoutId)
        
        if (mountedRef.current) {
          if (session?.user) {
            setUser(session.user)
            await loadProfile(session.user.id)
          } else {
            setLoading(false)
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        // Annuler le timeout en cas d'erreur
        clearTimeout(startupTimeoutId)
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
        
        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              setUser(session.user)
              // Charger le profil seulement si on n'en a pas déjà un
              if (!profile || profile.id !== session.user.id) {
                await loadProfile(session.user.id)
              }
            }
            break
            
          case 'SIGNED_OUT':
            setUser(null)
            setProfile(null)
            setLoading(false)
            // Vider le cache lors de la déconnexion
            profileCache.clear()
            loadingProfiles.clear()
            break
            
          case 'TOKEN_REFRESHED':
            if (session?.user) {
              setUser(session.user)
              // Ne pas recharger le profil pour un refresh de token
            }
            break
            
          case 'USER_UPDATED':
            if (session?.user) {
              setUser(session.user)
            }
            break
            
          case 'INITIAL_SESSION':
            // Ignorer cet événement car on gère déjà la session initiale
            // Ne pas recharger le profil si on en a déjà un
            if (session?.user && !profile) {
              setUser(session.user)
              await loadProfile(session.user.id)
            }
            break
            
          default:
            // Gérer les autres cas
            if (session?.user && !profile) {
              setUser(session.user)
              await loadProfile(session.user.id)
            } else if (!session?.user) {
              setUser(null)
              setProfile(null)
              setLoading(false)
            }
            break
        }
      }
    )

    getInitialSession()

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [])

  const loadProfile = async (userId: string) => {
    console.log('loadProfile called for user:', userId)
    
    // Vérifier le cache
    if (profileCache.has(userId)) {
      console.log('Using cached profile for user:', userId)
      if (mountedRef.current) {
        setProfile(profileCache.get(userId)!)
        setLoading(false)
        console.log('Profile loaded from cache, loading set to false')
      }
      return
    }

    // Éviter les chargements multiples du même profil
    if (loadingProfiles.has(userId)) {
      console.log('Profile already loading for user:', userId)
      return
    }

    // Vérifier si on a déjà un profil pour cet utilisateur
    if (profile && profile.id === userId) {
      console.log('Profile already exists for user:', userId)
      setLoading(false)
      return
    }

    loadingProfiles.add(userId)
    console.log('Starting profile load for user:', userId)

    // Timeout de sécurité pour éviter le blocage infini
    const timeoutId = setTimeout(() => {
      if (mountedRef.current && loading) {
        console.log('Profile loading timeout after 10s, forcing loading to false')
        setLoading(false)
        loadingProfiles.delete(userId)
      }
    }, 10000) // 10 secondes

    try {
      console.log('Loading profile for user:', userId)
      
      // Créer une promesse avec timeout pour la requête Supabase
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // Timeout de 8 secondes pour la requête elle-même
      const queryTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Supabase query timeout after 8s')), 8000)
      })

      // Race entre la requête et le timeout
      const { data, error } = await Promise.race([
        profilePromise,
        queryTimeout
      ]) as any

      // Annuler le timeout car l'opération s'est terminée
      clearTimeout(timeoutId)

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
          console.log('New profile created and loading set to false')
        }
      } else if (error) {
        console.error('Error loading profile:', error)
        
        // En cas d'erreur, créer un profil temporaire pour éviter de bloquer l'app
        console.log('Creating fallback profile to prevent app blocking')
        const fallbackProfile = {
          id: userId,
          name: 'Utilisateur Temporaire',
          phone: null,
          avatar_url: null,
          is_verified: false,
          rating: 0,
          rating_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        if (mountedRef.current) {
          setProfile(fallbackProfile)
          setLoading(false)
          console.log('Fallback profile set, loading set to false')
        }
        
        throw error
      } else {
        console.log('Profile loaded:', data)
        
        // Mettre en cache
        profileCache.set(userId, data)
        
        if (mountedRef.current) {
          setProfile(data)
          setLoading(false)
          console.log('Profile loaded successfully and loading set to false')
        }
      }
    } catch (error) {
      console.error('Error in loadProfile:', error)
      // Annuler le timeout en cas d'erreur
      clearTimeout(timeoutId)
      // En cas d'erreur, on continue quand même pour éviter de bloquer l'app
      if (mountedRef.current) {
        setLoading(false)
        console.log('Error occurred, loading set to false')
      }
    } finally {
      loadingProfiles.delete(userId)
      console.log('Profile loading completed for user:', userId)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (data.user && !error) {
        console.log('User signed in:', data.user.id)
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
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
      }
      // Vider le cache du profil
      if (user) {
        profileCache.delete(user.id)
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
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (data) {
        // Mettre à jour le cache
        profileCache.set(user.id, data)
        console.log('Profile updated:', data)
        
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

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }
}