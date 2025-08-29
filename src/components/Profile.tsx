import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Edit3, Save, X, Star, Euro, MapPin, Calendar, LogOut, Shield, Zap, Heart, TrendingUp, CheckCircle, Clock, AlertTriangle, Settings, Award, Activity, Wallet, MessageSquare, Target, Users, Eye } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Database } from '../lib/supabase'
import Header from './Header'
import SimpleLocationManager from './SimpleLocationManager'
import { useLocationContext } from '../contexts/LocationContext'

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
  const { user, profile: authProfile, loading: authLoading, updateProfile } = useAuth()
  const { refreshLocation } = useLocationContext()
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
  const [refreshKey, setRefreshKey] = useState(0)

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

  const handleSignOutClick = () => {
    // Utiliser directement la fonction onSignOut passée en props
    // qui gère la déconnexion et la redirection
    onSignOut()
  }

  const handleLocationUpdate = () => {
    // Utiliser le contexte pour rafraîchir la localisation dans toute l'application
    refreshLocation()
  }

  // Afficher le chargement si l'authentification ou le profil est en cours de chargement
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-6 shadow-lg"
          />
          <p className="text-gray-600 font-medium text-lg">Chargement du profil...</p>
        </motion.div>
      </div>
    )
  }

  // Afficher une erreur si pas d'utilisateur
  if (!user) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
            <User className="w-16 h-16 text-gray-400" />
          </div>
          <p className="text-gray-600 text-xl font-medium mb-4">Utilisateur non connecté</p>
          <p className="text-gray-500">Veuillez vous connecter pour accéder à votre profil</p>
        </motion.div>
      </div>
    )
  }

  // Afficher une erreur si pas de profil
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
            <User className="w-16 h-16 text-gray-400" />
          </div>
          <p className="text-gray-600 text-xl font-medium mb-4">Erreur lors du chargement du profil</p>
          <p className="text-gray-500 mb-6">Impossible de récupérer vos informations</p>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadProfile}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-2xl font-medium shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            Réessayer
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 relative">
      {/* Header avec gradient moderne */}
      <Header
        title={profile.name || 'Mon Profil'}
        subtitle="Gérez vos informations personnelles et suivez votre activité"
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

      {/* Content avec espacement optimisé */}
      <div className="flex-1 overflow-y-auto p-6 pb-24 space-y-8">
        
        {/* Section Profil Principal avec Avatar */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8, type: "spring" }}
          className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-gray-200/50"
        >
          <div className="text-center mb-8">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-24 h-24 bg-gradient-to-br from-blue-500 via-cyan-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl"
            >
              <span className="text-white font-bold text-3xl">
                {profile.name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </span>
            </motion.div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              {profile.name || 'Utilisateur'}
            </h1>
            <p className="text-gray-600">{user.email}</p>
          </div>

          <AnimatePresence mode="wait">
            {editing ? (
              <motion.div 
                key="editing"
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                transition={{ duration: 0.3, type: "spring" }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Nom Complet
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-lg"
                    placeholder="Votre nom complet"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-5 py-4 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-lg"
                    placeholder="Votre numéro de téléphone"
                  />
                </div>
                
                <div className="flex space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 px-6 rounded-2xl font-semibold hover:shadow-xl disabled:opacity-50 transition-all duration-300 flex items-center justify-center shadow-lg text-lg"
                  >
                    <Save className="w-5 h-5 mr-3" />
                    {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCancel}
                    className="flex-1 bg-gray-100 text-gray-700 py-4 px-6 rounded-2xl font-semibold hover:bg-gray-200 transition-all duration-300 flex items-center justify-center text-lg"
                  >
                    <X className="w-5 h-5 mr-3" />
                    Annuler
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="display"
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                transition={{ duration: 0.3, type: "spring" }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="flex items-center space-x-4 p-5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 shadow-md"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">{profile.name || 'Non spécifié'}</p>
                      <p className="text-sm text-gray-600">Nom complet</p>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="flex items-center space-x-4 p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 shadow-md"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">{profile.phone || 'Non spécifié'}</p>
                      <p className="text-sm text-gray-600">Numéro de téléphone</p>
                    </div>
                  </motion.div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleEdit}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 px-6 rounded-2xl font-semibold hover:shadow-xl transition-all duration-300 flex items-center justify-center shadow-lg text-lg"
                >
                  <Edit3 className="w-5 h-5 mr-3" />
                  Modifier le Profil
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Statistiques du Compte avec Design Amélioré */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
          className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-gray-200/50"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Award className="w-6 h-6 mr-3 text-blue-600" />
            Réputation et Évaluations
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div 
              whileHover={{ scale: 1.05, y: -4 }}
              className="bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 rounded-3xl p-6 text-white text-center shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <div className="text-4xl font-bold mb-2">
                {profile.rating || 0}
              </div>
              <div className="text-blue-100 text-lg mb-2">Note moyenne</div>
              <div className="flex justify-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-5 h-5 ${i < Math.floor(profile.rating || 0) ? 'fill-yellow-300 text-yellow-300' : 'text-blue-200'}`} 
                  />
                ))}
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.05, y: -4 }}
              className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-3xl p-6 text-white text-center shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <div className="text-4xl font-bold mb-2">
                {profile.rating_count || 0}
              </div>
              <div className="text-green-100 text-lg">Évaluations reçues</div>
            </motion.div>
          </div>
        </motion.div>

        {/* Activité de l'Utilisateur avec Grille Améliorée */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, type: "spring" }}
          className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-gray-200/50"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Activity className="w-6 h-6 mr-3 text-blue-600" />
            Activité sur la Plateforme
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div 
              whileHover={{ scale: 1.05, y: -4 }}
              className="bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 rounded-2xl p-5 text-white text-center shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <Target className="w-8 h-8 mx-auto mb-3 text-purple-200" />
              <div className="text-2xl font-bold mb-1">
                {userStats.tasksCreated}
              </div>
              <div className="text-purple-100 text-sm font-medium">Tâches créées</div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.05, y: -4 }}
              className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-2xl p-5 text-white text-center shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <Users className="w-8 h-8 mx-auto mb-3 text-orange-200" />
              <div className="text-2xl font-bold mb-1">
                {userStats.tasksHelped}
              </div>
              <div className="text-orange-100 text-sm font-medium">Tâches aidées</div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.05, y: -4 }}
              className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-2xl p-5 text-white text-center shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <CheckCircle className="w-8 h-8 mx-auto mb-3 text-green-200" />
              <div className="text-2xl font-bold mb-1">
                {userStats.tasksCompleted}
              </div>
              <div className="text-green-100 text-sm font-medium">Tâches terminées</div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.05, y: -4 }}
              className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 rounded-2xl p-5 text-white text-center shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <MessageSquare className="w-8 h-8 mx-auto mb-3 text-indigo-200" />
              <div className="text-2xl font-bold mb-1">
                {userStats.messagesSent}
              </div>
              <div className="text-indigo-100 text-sm font-medium">Messages envoyés</div>
            </motion.div>
          </div>
        </motion.div>

        {/* Finances avec Design Premium */}
        {(userStats.totalEarned > 0 || userStats.totalSpent > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, type: "spring" }}
            className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-gray-200/50"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Wallet className="w-6 h-6 mr-3 text-blue-600" />
              Activité Financière
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div 
                whileHover={{ scale: 1.05, y: -4 }}
                className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-3xl p-6 text-white text-center shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <TrendingUp className="w-10 h-10 mx-auto mb-4 text-green-200" />
                <div className="text-3xl font-bold mb-2">
                  €{userStats.totalEarned.toFixed(2)}
                </div>
                <div className="text-green-100 text-lg font-medium">Total gagné</div>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.05, y: -4 }}
                className="bg-gradient-to-br from-red-500 via-red-600 to-pink-600 rounded-3xl p-6 text-white text-center shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <Euro className="w-10 h-10 mx-auto mb-4 text-red-200" />
                <div className="text-3xl font-bold mb-2">
                  €{userStats.totalSpent.toFixed(2)}
                </div>
                <div className="text-red-100 text-lg font-medium">Total dépensé</div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Gestion de la Localisation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
        >
          <SimpleLocationManager onLocationUpdate={handleLocationUpdate} />
        </motion.div>

        {/* Informations du Compte avec Design Moderne */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, type: "spring" }}
          className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-gray-200/50"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Shield className="w-6 h-6 mr-3 text-blue-600" />
            Informations du Compte
          </h2>
          
          <div className="space-y-4">
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 via-blue-50 to-indigo-50 rounded-2xl border border-gray-200 shadow-md"
            >
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700 font-medium">Membre depuis</span>
              </div>
              <span className="font-semibold text-gray-900 bg-white px-4 py-2 rounded-xl shadow-sm">
                {new Date(profile.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 via-blue-50 to-indigo-50 rounded-2xl border border-gray-200 shadow-md"
            >
              <div className="flex items-center space-x-3">
                <Eye className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700 font-medium">Statut du compte</span>
              </div>
              <span className={`px-4 py-2 rounded-xl text-sm font-semibold shadow-sm ${
                profile.is_verified 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                  : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
              }`}>
                {profile.is_verified ? '✅ Vérifié' : '⏳ En attente de vérification'}
              </span>
            </motion.div>
          </div>
        </motion.div>

        {/* Bouton de Déconnexion avec Design Amélioré */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8, type: "spring" }}
          className="text-center"
        >
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSignOutClick}
            className="bg-gradient-to-r from-red-500 via-red-600 to-pink-600 text-white py-5 px-8 rounded-2xl font-semibold hover:shadow-2xl transition-all duration-300 flex items-center justify-center shadow-xl text-lg mx-auto"
          >
            <LogOut className="w-6 h-6 mr-3" />
            Se Déconnecter
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}