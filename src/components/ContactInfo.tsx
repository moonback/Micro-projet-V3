import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Star, 
  Shield, 
  Edit3, 
  Save, 
  X, 
  Copy, 
  CheckCircle,
  Globe,
  Building,
  Award,
  Clock,
  MessageCircle,
  Euro,
  TrendingUp,
  Heart,
  Zap
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Database } from '../lib/supabase'

interface ContactInfoProps {
  className?: string
}

interface UserStats {
  tasksCreated: number
  tasksCompleted: number
  tasksHelped: number
  totalEarned: number
  totalSpent: number
  messagesSent: number
  averageRating: number
  responseTime: string
}

export default function ContactInfo({ className = '' }: ContactInfoProps) {
  const { user, profile: authProfile } = useAuth()
  const [profile, setProfile] = useState<Database['public']['Tables']['profiles']['Row'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [userStats, setUserStats] = useState<UserStats>({
    tasksCreated: 0,
    tasksCompleted: 0,
    tasksHelped: 0,
    totalEarned: 0,
    totalSpent: 0,
    messagesSent: 0,
    averageRating: 0,
    responseTime: '0'
  })
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    bio: ''
  })
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user, authProfile])

  const loadProfile = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Charger le profil
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      if (data) {
        setProfile(data)
        setEditForm({
          name: data.name || '',
          phone: data.phone || '',
          bio: data.bio || ''
        })
        
        // Charger les statistiques
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
      // Statistiques des tâches
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('id, status, budget, author, helper')
        .or(`author.eq.${user.id},helper.eq.${user.id}`)

      // Statistiques des messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('id, sender')
        .eq('sender', user.id)

      if (tasksData) {
        const tasksCreated = tasksData.filter(t => t.author === user.id).length
        const tasksCompleted = tasksData.filter(t => t.status === 'completed').length
        const tasksHelped = tasksData.filter(t => t.helper === user.id).length
        const totalEarned = tasksData
          .filter(t => t.helper === user.id && t.status === 'completed')
          .reduce((sum, t) => sum + (t.budget || 0), 0)
        const totalSpent = tasksData
          .filter(t => t.author === user.id && t.status === 'completed')
          .reduce((sum, t) => sum + (t.budget || 0), 0)

        setUserStats(prev => ({
          ...prev,
          tasksCreated,
          tasksCompleted,
          tasksHelped,
          totalEarned,
          totalSpent,
          messagesSent: messagesData?.length || 0,
          averageRating: profile?.rating || 0
        }))
      }
    } catch (error) {
      console.error('Error loading user stats:', error)
    }
  }

  const handleSave = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editForm.name,
          phone: editForm.phone,
          bio: editForm.bio
        })
        .eq('id', user.id)

      if (error) throw error

      setProfile(prev => prev ? { ...prev, ...editForm } : null)
      setEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatRating = (rating: number) => {
    return rating.toFixed(1)
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full"
        />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className={`text-center p-8 text-gray-500 ${className}`}>
        <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p>Profil non trouvé</p>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden ${className}`}>
      {/* Header du profil */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Informations de Contact</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setEditing(!editing)}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            {editing ? <X className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
          </motion.button>
        </div>

        {/* Avatar et nom principal */}
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name || 'Avatar'}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold">{profile.name || 'Nom non défini'}</h3>
            <p className="text-blue-100">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-6 space-y-6">
        {/* Informations personnelles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-600" />
            Informations Personnelles
          </h4>

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Parlez-nous de vous..."
                />
              </div>
              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setEditing(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">Nom</p>
                  <p className="font-medium">{profile.name || 'Non défini'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-500">Téléphone</p>
                  <p className="font-medium">{profile.phone || 'Non défini'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user?.email}</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => copyToClipboard(user?.email || '', 'email')}
                    className="text-xs text-blue-600 hover:text-blue-700 mt-1 flex items-center"
                  >
                    {copiedField === 'email' ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" />
                        Copier
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-500">Membre depuis</p>
                  <p className="font-medium">{formatDate(profile.created_at)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-800">{profile.bio}</p>
            </div>
          )}
        </motion.div>

        {/* Statistiques et réputation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
            Statistiques et Réputation
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-blue-900">{userStats.tasksCreated}</p>
              <p className="text-sm text-blue-700">Tâches créées</p>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-green-900">{userStats.tasksCompleted}</p>
              <p className="text-sm text-green-700">Tâches terminées</p>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-purple-900">{userStats.tasksHelped}</p>
              <p className="text-sm text-purple-700">Tâches aidées</p>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
              <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-orange-900">{userStats.messagesSent}</p>
              <p className="text-sm text-orange-700">Messages envoyés</p>
            </div>
          </div>

          {/* Réputation et finances */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
              <div className="flex items-center space-x-2 mb-2">
                <Star className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-yellow-800">Note moyenne</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-yellow-900">{formatRating(profile.rating)}</span>
                <span className="text-sm text-yellow-700">/ 5.0</span>
              </div>
              <p className="text-xs text-yellow-600 mt-1">{profile.rating_count} évaluations</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
              <div className="flex items-center space-x-2 mb-2">
                <Euro className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-emerald-800">Gains totaux</span>
              </div>
              <p className="text-2xl font-bold text-emerald-900">{userStats.totalEarned}€</p>
              <p className="text-xs text-emerald-600 mt-1">Tâches aidées</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
              <div className="flex items-center space-x-2 mb-2">
                <Euro className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-red-800">Dépenses totales</span>
              </div>
              <p className="text-2xl font-bold text-red-900">{userStats.totalSpent}€</p>
              <p className="text-xs text-red-600 mt-1">Tâches créées</p>
            </div>
          </div>
        </motion.div>

        {/* Statut et vérification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-indigo-600" />
            Statut et Vérification
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${profile.is_verified ? 'bg-green-500' : 'bg-gray-400'}`} />
              <div>
                <p className="font-medium">Vérification du profil</p>
                <p className="text-sm text-gray-600">
                  {profile.is_verified ? 'Profil vérifié' : 'En attente de vérification'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium">Dernière activité</p>
                <p className="text-sm text-gray-600">
                  {profile.updated_at ? formatDate(profile.updated_at) : 'Jamais'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
