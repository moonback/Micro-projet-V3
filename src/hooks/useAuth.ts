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
        const { data: { session } } = await supabase.auth.getSession()
        
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
          setUser(session.user)
          await loadProfile(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setLoading(false)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Ne pas recharger le profil pour un refresh de token
          setUser(session.user)
        } else if (event === 'USER_UPDATED' && session?.user) {
          setUser(session.user)
        } else if (session?.user && !profile) {
          setUser(session.user)
          await loadProfile(session.user.id)
        } else if (!session?.user) {
          setUser(null)
          setProfile(null)
          setLoading(false)
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
      // Charger le profil depuis Supabase
      console.log('📡 Chargement du profil depuis Supabase...')
      console.log(`🔍 Requête: SELECT * FROM profiles WHERE id = '${userId}'`)
      
      // Ajouter un timeout pour éviter le blocage
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: Requête Supabase bloquée')), 1000)
      })
      
      const supabasePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // Exécuter avec timeout
      const { data: profileData, error: profileError } = await Promise.race([
        supabasePromise,
        timeoutPromise
      ]) as any

      console.log('📊 Réponse Supabase reçue:', { profileData, profileError })

      if (profileError && profileError.code === 'PGRST116') {
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
        }
      } else if (profileError) {
        console.error('Error loading profile:', profileError)
        throw profileError
      } else {
        console.log('Profile loaded:', profileData)
        
        // Mettre en cache
        profileCache.set(userId, profileData)
        
        if (mountedRef.current) {
          setProfile(profileData)
        }
      }
    } catch (error) {
      console.error('Error in loadProfile:', error)
    } finally {
      loadingProfiles.delete(userId)
      if (mountedRef.current) {
        setLoading(false)
      }
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