import { supabase } from '../lib/supabase'

export async function testAuthFlow() {
  console.log('🧪 Testing authentication flow...')
  
  try {
    // 1. Vérifier la session actuelle
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('📋 Current session:', session ? '✅ Active' : '❌ None')
    if (sessionError) console.error('Session error:', sessionError)
    
    if (session?.user) {
      console.log('👤 User ID:', session.user.id)
      console.log('📧 User email:', session.user.email)
      
      // 2. Vérifier le profil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      if (profileError) {
        console.error('❌ Profile error:', profileError)
        if (profileError.code === 'PGRST116') {
          console.log('⚠️ Profile not found, would need to be created')
        }
      } else {
        console.log('✅ Profile found:', profile.name)
      }
      
      // 3. Tester la connectivité
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      if (testError) {
        console.error('❌ Connectivity test failed:', testError)
      } else {
        console.log('✅ Connectivity test passed')
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

export async function forceProfileRefresh(userId: string) {
  console.log('🔄 Forcing profile refresh for user:', userId)
  
  try {
    // Supprimer du cache local
    const cacheKey = 'profileCache'
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const cache = JSON.parse(cached)
      delete cache[userId]
      localStorage.setItem(cacheKey, JSON.stringify(cache))
      console.log('🗑️ Cleared profile from cache')
    }
    
    // Recharger le profil
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('❌ Profile refresh failed:', error)
      return null
    }
    
    console.log('✅ Profile refreshed:', profile.name)
    return profile
    
  } catch (error) {
    console.error('❌ Force refresh failed:', error)
    return null
  }
}

export function logAuthState(user: any, profile: any, loading: boolean, profileLoading: boolean) {
  console.log('🔍 Auth State Log:', {
    timestamp: new Date().toISOString(),
    user: user ? { id: user.id, email: user.email } : null,
    profile: profile ? { id: profile.id, name: profile.name } : null,
    loading,
    profileLoading,
    hasUser: !!user,
    hasProfile: !!profile,
    isFullyAuthenticated: !!user && !!profile && !loading && !profileLoading
  })
}
