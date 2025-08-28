import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Edit3, Save, X, Star, Euro, MapPin, Calendar, LogOut, Shield, Zap, Heart, TrendingUp, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Database } from '../lib/supabase'
import Header from './Header'

interface ProfileProps {
  onSignOut: () => void
}

interface UserStats {
  tasksCreated: number
  tasksCompleted: number
  tasksHelped: number
  totalEarned: number
  totalSpent: number
  messagesSent: number
}

export default function Profile({ onSignOut }: ProfileProps) {
  const { user, profile: authProfile, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<Database['public']['Tables']['profiles']['Row'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [userStats, setUserStats] = useState<UserStats>({
    tasksCreated: 0,
    tasksCompleted: 0,
    tasksHelped: 0,
    totalEarned: 0,
    totalSpent: 0,
    messagesSent: 0
  })
  const [editForm, setEditForm] = useState({
    name: '',
    phone: ''
  })

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user, authProfile])

  const loadProfile = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // D'abord, essayer de charger le profil existant
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        // Profil non trouvé, le créer automatiquement
        console.log('Profile not found, creating new profile...')
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'Utilisateur',
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

        data = newProfile
        console.log('New profile created:', data)
      } else if (error) {
        throw error
      }

      if (data) {
        setProfile(data)
        setEditForm({
          name: data.name || '',
          phone: data.phone || ''
        })
        
        // Charger les statistiques après avoir le profil
        loadUserStats()
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserStats = async () => {
    if (!user) return

    try {
      // Récupérer les tâches créées par l'utilisateur
      const { data: createdTasks, error: createdError } = await supabase
        .from('tasks')
        .select('id, status, budget')
        .eq('author', user.id)

      if (createdError) throw createdError

      // Récupérer les tâches où l'utilisateur est l'aide
      const { data: helpedTasks, error: helpedError } = await supabase
        .from('tasks')
        .select('id, status, budget')
        .eq('helper', user.id)

      if (helpedError) throw helpedError

      // Récupérer le nombre de messages envoyés
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id')
        .eq('sender', user.id)

      if (messagesError) throw messagesError

      // Calculer les statistiques
      const stats: UserStats = {
        tasksCreated: createdTasks?.length || 0,
        tasksCompleted: createdTasks?.filter(t => t.status === 'completed').length || 0,
        tasksHelped: helpedTasks?.length || 0,
        totalEarned: helpedTasks?.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.budget || 0), 0) || 0,
        totalSpent: createdTasks?.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.budget || 0), 0) || 0,
        messagesSent: messages?.length || 0
      }

      setUserStats(stats)
    } catch (error) {
      console.error('Error loading user stats:', error)
    }
  }

  const handleEdit = () => {
    setEditing(true)
  }

  const handleCancel = () => {
    setEditing(false)
    setEditForm({
      name: profile?.name || '',
      phone: profile?.phone || ''
    })
  }

  const handleSave = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editForm.name,
          phone: editForm.phone
        })
        .eq('id', user.id)

      if (error) throw error

      await loadProfile()
      setEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Erreur lors de la mise à jour du profil')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOutClick = async () => {
    try {
      await supabase.auth.signOut()
      onSignOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Afficher le chargement si l'authentification ou le profil est en cours de chargement
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
          />
          <p className="text-gray-500 font-medium">Chargement du profil...</p>
        </motion.div>
      </div>
    )
  }

  // Afficher une erreur si pas d'utilisateur
  if (!user) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg font-medium">Utilisateur non connecté</p>
        </motion.div>
      </div>
    )
  }

  // Afficher une erreur si pas de profil
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg font-medium mb-4">Erreur lors du chargement du profil</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadProfile}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-2xl font-medium shadow-lg"
          >
            Réessayer
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      {/* Header avec gradient moderne */}
             <Header
         title={profile.name || 'Mon Profil'}
         subtitle="Gérez vos informations personnelles"
         showSearch={false}
         showFilters={false}
         showViewToggle={false}
         showRefresh={false}
         rightButtons={[
           {
             icon: LogOut,
             onClick: handleSignOutClick,
             tooltip: 'Se déconnecter',
             className: 'text-red-600 hover:text-red-800 hover:bg-red-50'
           }
         ]}
       />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-24 space-y-6">
        {/* Informations de Contact */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-600" />
            Informations de Contact
          </h2>
          
          <AnimatePresence mode="wait">
            {editing ? (
              <motion.div 
                key="editing"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom Complet
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-2xl font-medium hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center shadow-md"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCancel}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-2xl font-medium hover:bg-gray-400 transition-all flex items-center justify-center"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Annuler
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="display"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{profile.name || 'Non spécifié'}</p>
                    <p className="text-sm text-gray-600">Nom complet</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{profile.phone || 'Non spécifié'}</p>
                    <p className="text-sm text-gray-600">Numéro de téléphone</p>
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleEdit}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-2xl font-medium hover:shadow-lg transition-all flex items-center justify-center shadow-md"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Modifier le Profil
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Statistiques du Compte */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2 text-blue-600" />
            Statistiques du Compte
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white text-center shadow-lg">
              <div className="text-2xl font-bold mb-1">
                {profile.rating || 0}
              </div>
              <div className="text-blue-100 text-sm">Note moyenne</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white text-center shadow-lg">
              <div className="text-2xl font-bold mb-1">
                {profile.rating_count || 0}
              </div>
              <div className="text-green-100 text-sm">Évaluations</div>
            </div>
          </div>
        </motion.div>

        {/* Activité de l'Utilisateur */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-600" />
            Activité sur la Plateforme
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white text-center shadow-lg">
              <div className="text-2xl font-bold mb-1">
                {userStats.tasksCreated}
              </div>
              <div className="text-purple-100 text-sm">Tâches créées</div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white text-center shadow-lg">
              <div className="text-2xl font-bold mb-1">
                {userStats.tasksHelped}
              </div>
              <div className="text-orange-100 text-sm">Tâches aidées</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white text-center shadow-lg">
              <div className="text-2xl font-bold mb-1">
                {userStats.tasksCompleted}
              </div>
              <div className="text-green-100 text-sm">Tâches terminées</div>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 text-white text-center shadow-lg">
              <div className="text-2xl font-bold mb-1">
                {userStats.messagesSent}
              </div>
              <div className="text-indigo-100 text-sm">Messages envoyés</div>
            </div>
          </div>
        </motion.div>

        {/* Finances */}
        {(userStats.totalEarned > 0 || userStats.totalSpent > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
              Activité Financière
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white text-center shadow-lg">
                <div className="text-2xl font-bold mb-1">
                  €{userStats.totalEarned.toFixed(2)}
                </div>
                <div className="text-green-100 text-sm">Total gagné</div>
              </div>
              
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 text-white text-center shadow-lg">
                <div className="text-2xl font-bold mb-1">
                  €{userStats.totalSpent.toFixed(2)}
                </div>
                <div className="text-red-100 text-sm">Total dépensé</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Informations du Compte */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.8 }}
          className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Informations du Compte
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-100">
              <span className="text-gray-600">Membre depuis</span>
              <span className="font-medium text-gray-900">
                {new Date(profile.created_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-100">
              <span className="text-gray-600">Statut</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                profile.is_verified ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
              }`}>
                {profile.is_verified ? 'Vérifié' : 'En attente'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Bouton de Déconnexion */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSignOutClick}
          className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 px-4 rounded-2xl font-medium hover:shadow-lg transition-all flex items-center justify-center shadow-md"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Se Déconnecter
        </motion.button>

        {/* Bouton de débogage pour tester la persistance */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={async () => {
            console.log('=== DEBUG AUTH STATE ===')
            console.log('User:', user)
            console.log('Profile:', profile)
            console.log('Loading:', loading)
            
            // Vérifier la session Supabase
            const { data: { session } } = await supabase.auth.getSession()
            console.log('Supabase Session:', session)
            
            // Vérifier le stockage local
            const authKey = localStorage.getItem('microtask-auth')
            console.log('Local Storage Auth Key:', authKey ? 'Present' : 'Missing')
            
            // Forcer le rechargement du profil
            if (user) {
              console.log('Refreshing profile...')
              await loadUserStats()
            }
          }}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors mb-4"
        >
          🔍 Déboguer l'Authentification
        </motion.button>

        {/* Bouton pour forcer la déconnexion et nettoyer le cache */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={async () => {
            console.log('=== FORCE CLEANUP ===')
            
            // Vider le stockage local
            localStorage.removeItem('microtask-auth')
            sessionStorage.removeItem('microtask-auth')
            
            // Vider le cache des profils
            console.log('Cache cleared, signing out...')
            
            // Se déconnecter
            await onSignOut()
          }}
          className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-medium py-3 px-4 rounded-xl transition-colors mb-4"
        >
          🧹 Nettoyer et Se Déconnecter
        </motion.button>

        {/* Bouton pour tester la connexion Supabase */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={async () => {
            console.log('=== TESTING SUPABASE CONNECTION ===')
            
            try {
              // Test de connexion à la base
              console.log('Testing connection to profiles table...')
              const { data, error } = await supabase
                .from('profiles')
                .select('count')
                .limit(1)
              
              console.log('Connection test result:', { data, error })
              
              // Test de lecture d'un profil spécifique
              if (user) {
                console.log('Testing profile read for user:', user.id)
                const { data: profileData, error: profileError } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', user.id)
                  .single()
                
                console.log('Profile read test:', { data: profileData, error: profileError })
              }
              
            } catch (error) {
              console.error('Supabase test error:', error)
            }
          }}
          className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-3 px-4 rounded-xl transition-colors mb-4"
        >
          🔌 Tester la Connexion Supabase
        </motion.button>

        {/* Bouton pour tester les permissions RLS */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={async () => {
            console.log('=== TESTING RLS POLICIES ===')
            
            try {
              if (user) {
                // Test 1: Lecture de son propre profil
                console.log('Test 1: Reading own profile...')
                const { data: ownProfile, error: ownError } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', user.id)
                  .single()
                
                console.log('Own profile read:', { data: ownProfile, error: ownError })
                
                // Test 2: Lecture d'un autre profil (devrait échouer)
                console.log('Test 2: Reading another profile (should fail)...')
                const { data: otherProfile, error: otherError } = await supabase
                  .from('profiles')
                  .select('*')
                  .neq('id', user.id)
                  .limit(1)
                  .single()
                
                console.log('Other profile read:', { data: otherProfile, error: otherError })
                
                // Test 3: Insertion d'un profil
                console.log('Test 3: Testing profile insertion...')
                const testProfile = {
                  id: user.id + '_test',
                  name: 'Test Profile',
                  rating: 0,
                  rating_count: 0,
                  is_verified: false
                }
                
                const { data: insertData, error: insertError } = await supabase
                  .from('profiles')
                  .insert(testProfile)
                  .select()
                
                console.log('Profile insertion test:', { data: insertData, error: insertError })
                
                // Nettoyer le profil de test
                if (insertData) {
                  await supabase
                    .from('profiles')
                    .delete()
                    .eq('id', testProfile.id)
                }
              }
              
            } catch (error) {
              console.error('RLS test error:', error)
            }
          }}
          className="w-full bg-green-100 hover:bg-green-200 text-green-700 font-medium py-3 px-4 rounded-xl transition-colors mb-4"
        >
          🛡️ Tester les Permissions RLS
        </motion.button>

        {/* Bouton pour forcer la création du profil */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={async () => {
            console.log('=== FORCING PROFILE CREATION ===')
            
            try {
              if (user) {
                console.log('Attempting to create profile for user:', user.id)
                
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
                  console.error('Profile creation failed:', createError)
                  alert('Erreur lors de la création du profil: ' + createError.message)
                } else {
                  console.log('Profile created successfully:', newProfile)
                  alert('Profil créé avec succès !')
                  // Recharger la page pour voir le profil
                  window.location.reload()
                }
              }
              
            } catch (error) {
              console.error('Profile creation error:', error)
              alert('Erreur lors de la création du profil')
            }
          }}
          className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-medium py-3 px-4 rounded-xl transition-colors mb-4"
        >
          🆕 Forcer la Création du Profil
        </motion.button>
      </div>
    </div>
  )
}