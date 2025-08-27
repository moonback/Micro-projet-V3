import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Edit3, Save, X, Star, Euro, MapPin, Calendar, LogOut, Shield, Zap, Heart, TrendingUp, CheckCircle, Clock, AlertTriangle, MessageCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Database } from '../lib/supabase'
import Header from './Header'
import ContactInfo from './ContactInfo'

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

        setUserStats({
          tasksCreated,
          tasksCompleted,
          tasksHelped,
          totalEarned,
          totalSpent,
          messagesSent: messagesData?.length || 0
        })
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
          phone: editForm.phone
        })
        .eq('id', user.id)

      if (error) throw error

      setProfile(prev => prev ? { ...prev, ...editForm } : null)
      setEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"
        />
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Erreur de chargement du profil</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <Header
        title="Profil"
        subtitle="Gérez vos informations personnelles"
        showSearch={false}
        showFilters={false}
        showViewToggle={false}
        showRefresh={false}
        className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 text-white shadow-lg"
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Composant ContactInfo principal */}
        <ContactInfo />

        {/* Actions rapides */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="w-6 h-6 mr-2 text-indigo-600" />
            Actions Rapides
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setEditing(!editing)}
              className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center space-x-2"
            >
              <Edit3 className="w-5 h-5" />
              <span>Modifier le profil</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSignOut}
              className="p-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center space-x-2"
            >
              <LogOut className="w-5 h-5" />
              <span>Se déconnecter</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Statistiques détaillées */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-green-600" />
            Statistiques Détaillées
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-blue-900">{userStats.tasksCreated}</p>
              <p className="text-sm text-blue-700">Créées</p>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-green-900">{userStats.tasksCompleted}</p>
              <p className="text-sm text-green-700">Terminées</p>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-purple-900">{userStats.tasksHelped}</p>
              <p className="text-sm text-purple-700">Aidées</p>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
              <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-orange-900">{userStats.messagesSent}</p>
              <p className="text-sm text-orange-700">Messages</p>
            </div>
          </div>

          {/* Finances */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
              <div className="flex items-center space-x-2 mb-2">
                <Euro className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-emerald-800">Gains totaux</span>
              </div>
              <p className="text-2xl font-bold text-emerald-900">{userStats.totalEarned}€</p>
              <p className="text-xs text-emerald-600">Tâches aidées</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
              <div className="flex items-center space-x-2 mb-2">
                <Euro className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-red-800">Dépenses totales</span>
              </div>
              <p className="text-2xl font-bold text-red-900">{userStats.totalSpent}€</p>
              <p className="text-xs text-red-600">Tâches créées</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}