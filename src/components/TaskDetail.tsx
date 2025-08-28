import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, MapPin, Euro, Calendar, Clock, Star, MessageCircle, CheckCircle, Play, XCircle, AlertTriangle, User, Tag, Zap, TrendingUp, Shield, Heart, Crown, Globe, Building, Camera } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { TaskWithProfiles } from '../types/task'
import Header from './Header'
import TaskApplications from './TaskApplications'

// Fonction pour récupérer l'adresse à partir des coordonnées GPS
const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=fr`
    )
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de l\'adresse')
    }
    
    const data = await response.json()
    
    if (data.display_name) {
      // Extraire les parties les plus pertinentes de l'adresse
      const addressParts = data.display_name.split(', ')
      const relevantParts = addressParts.slice(0, 3) // Prendre les 3 premières parties
      return relevantParts.join(', ')
    }
    
    return 'Adresse non trouvée'
  } catch (error) {
    console.error('Erreur de géocodification:', error)
    return 'Erreur de géocodification'
  }
}

interface TaskDetailProps {
  task: TaskWithProfiles
  onBack: () => void
  onChatOpen: (taskId: string) => void
}

export default function TaskDetail({ task, onBack, onChatOpen }: TaskDetailProps) {
  const { user } = useAuth()
  const [actionLoading, setActionLoading] = useState(false)
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null)
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [checkingApplication, setCheckingApplication] = useState(false)
  const [address, setAddress] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Détecter la taille de l'écran
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Vérifier si l'utilisateur a déjà candidaté à cette tâche
  useEffect(() => {
    const checkApplication = async () => {
      if (!user || task.status !== 'open') return
      
      setCheckingApplication(true)
      try {
        const { data, error } = await supabase
          .from('task_applications')
          .select('id, status')
          .eq('task_id', task.id)
          .eq('helper_id', user.id)
          .single()

        if (!error && data) {
          setHasApplied(true)
        }
      } catch (error) {
        // Pas de candidature existante
        setHasApplied(false)
      } finally {
        setCheckingApplication(false)
      }
    }

    checkApplication()
  }, [user, task.id, task.status])

  const isAuthor = user?.id === task.author
  const isHelper = user?.id === task.helper
  const canAccept = !isAuthor && !isHelper && task.status === 'open'
  const canComplete = (isAuthor || isHelper) && task.status === 'in_progress'
  const canCancel = (isAuthor || isHelper) && ['open', 'assigned', 'in_progress'].includes(task.status)

  // Récupérer l'adresse à partir des coordonnées si elle n'est pas stockée
  useEffect(() => {
    const resolveAddress = async () => {
      if (task.address) {
        setResolvedAddress(task.address)
        return
      }

      if (task.location) {
        setIsLoadingAddress(true)
        try {
          // Extraire les coordonnées du format PostGIS
          const coords = task.location as any
          if (coords.coordinates && coords.coordinates.length >= 2) {
            const [lng, lat] = coords.coordinates
            const address = await reverseGeocode(lat, lng)
            setResolvedAddress(address)
          }
        } catch (error) {
          console.error('Erreur lors de la résolution de l\'adresse:', error)
          setResolvedAddress('Adresse non disponible')
        } finally {
          setIsLoadingAddress(false)
        }
      } else {
        setResolvedAddress('Aucune localisation')
      }
    }

    resolveAddress()
  }, [task.address, task.location])

  const handleAcceptTask = async () => {
    if (!user || hasApplied) return

    setActionLoading(true)
    try {
      // Créer une candidature au lieu d'accepter directement
      const { error } = await supabase
        .from('task_applications')
        .insert({
          task_id: task.id,
          helper_id: user.id,
          message: 'Je suis intéressé par cette tâche et disponible pour l\'accomplir.',
          status: 'pending'
        })

      if (error) throw error

      setHasApplied(true)
      // Optionnel : recharger la page ou mettre à jour l'état
      window.location.reload()
    } catch (error) {
      console.error('Error applying for task:', error)
      if (error.code === '23505') {
        alert('Vous avez déjà candidaté à cette tâche')
        setHasApplied(true)
      } else {
        alert('Erreur lors de la candidature à la tâche')
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleStartTask = async () => {
    if (!user) return

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', task.id)

      if (error) throw error

      window.location.reload()
    } catch (error) {
      console.error('Error starting task:', error)
      alert('Erreur lors du démarrage de la tâche')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCompleteTask = async () => {
    if (!user) return

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', task.id)

      if (error) throw error

      window.location.reload()
    } catch (error) {
      console.error('Error completing task:', error)
      alert('Erreur lors de la finalisation de la tâche')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelTask = async () => {
    if (!user) return

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'cancelled' })
        .eq('id', task.id)

      if (error) throw error

      window.location.reload()
    } catch (error) {
      console.error('Error cancelling task:', error)
      alert('Erreur lors de l\'annulation de la tâche')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800'
      case 'assigned': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress': return 'bg-orange-100 text-orange-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'expired': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Ouverte'
      case 'assigned': return 'Assignée'
      case 'in_progress': return 'En cours'
      case 'completed': return 'Terminée'
      case 'cancelled': return 'Annulée'
      case 'expired': return 'Expirée'
      default: return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-700'
      case 'medium': return 'bg-blue-100 text-blue-700'
      case 'high': return 'bg-orange-100 text-orange-700'
      case 'urgent': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Faible'
      case 'medium': return 'Moyenne'
      case 'high': return 'Élevée'
      case 'urgent': return 'Urgente'
      default: return priority
    }
  }

  const formatDuration = (duration: string) => {
    // Convertir la durée PostgreSQL en format lisible
    return duration
  }

  const getCategoryIcon = (category: string) => {
    const categoryIcons: Record<string, string> = {
      'Livraison': '🚚',
      'Nettoyage': '🧹',
      'Courses': '🛒',
      'Déménagement': '📦',
      'Montage': '🔧',
      'Garde d\'Animaux': '🐾',
      'Jardinage': '🌱',
      'Aide Informatique': '💻',
      'Cours Particuliers': '📚',
      'Autre': '✨'
    }
    return categoryIcons[category] || '🏷️'
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <Header
        title={task.title}
        subtitle={`Tâche ${task.status === 'open' ? 'disponible' : 'en cours'}`}
        showSearch={false}
        showFilters={false}
        showViewToggle={false}
        showRefresh={false}
        onBack={onBack}
        className="bg-white text-gray-900 shadow-sm border-b border-gray-200"
      />

      {/* Contenu principal avec layout adaptatif */}
      <div className="flex-1 overflow-y-auto">
        <div className={`${isMobile ? 'p-4' : 'p-6 lg:p-8'} max-w-7xl mx-auto`}>
          <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-3 gap-8'}`}>
            {/* Colonne principale - Informations de la tâche */}
            <div className={`${isMobile ? '' : 'lg:col-span-2'}`}>
              {/* En-tête de la tâche */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      {getCategoryIcon(task.category)}
                    </div>
                    <div>
                      <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                        {task.title}
                      </h1>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(task.status)}`}>
                          {getStatusLabel(task.status)}
                        </span>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Budget en évidence */}
                  <div className="text-right">
                    <div className="text-3xl lg:text-4xl font-bold text-green-600 mb-1">
                      €{task.budget}
                    </div>
                    <div className="text-sm text-gray-500">Budget</div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-700 leading-relaxed text-base lg:text-lg">
                    {task.description}
                  </p>
                </div>

                {/* Tags */}
                {task.tags && task.tags.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {task.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-200 font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Informations détaillées */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {task.estimated_duration && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                      <Clock className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Durée estimée</div>
                        <div className="text-sm text-gray-600">{formatDuration(task.estimated_duration)}</div>
                      </div>
                    </div>
                  )}
                  
                  {task.deadline && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                      <Calendar className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Date limite</div>
                        <div className="text-sm text-gray-600">
                          {new Date(task.deadline).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Localisation */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  Localisation
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">{address || 'Chargement...'}</div>
                      {task.city && (
                        <div className="text-sm text-gray-600">{task.city}, {task.country}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  {checkingApplication ? (
                    <div className="flex-1 flex items-center justify-center py-4 px-6 text-gray-500 bg-gray-100 rounded-xl">
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mr-3" />
                      <span>Vérification...</span>
                    </div>
                  ) : hasApplied ? (
                    <div className="flex-1 bg-blue-50 border border-blue-200 text-blue-700 py-4 px-6 rounded-xl font-semibold flex items-center justify-center space-x-3">
                      <CheckCircle className="w-5 h-5" />
                      <span>Candidature Envoyée</span>
                    </div>
                  ) : canAccept ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAcceptTask}
                      disabled={actionLoading}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-3"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Postuler à cette Tâche</span>
                    </motion.button>
                  ) : null}
                  
                  {isHelper && task.status === 'assigned' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleStartTask}
                      disabled={actionLoading}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-3"
                    >
                      <TrendingUp className="w-5 h-5" />
                      <span>Commencer la Tâche</span>
                    </motion.button>
                  )}
                  
                  {canComplete && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCompleteTask}
                      disabled={actionLoading}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-3"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Marquer comme Terminée</span>
                    </motion.button>
                  )}
                  
                  {canCancel && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCancelTask}
                      disabled={actionLoading}
                      className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-3"
                    >
                      <XCircle className="w-5 h-5" />
                      <span>Annuler la Tâche</span>
                    </motion.button>
                  )}
                  
                  {/* Bouton de chat toujours visible */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onChatOpen(task.id)}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-3"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Ouvrir le Chat</span>
                  </motion.button>
                              </div>
            </div>
          </div>

          {/* Section des candidatures */}
          <TaskApplications
            taskId={task.id}
            taskTitle={task.title}
            taskStatus={task.status}
            isAuthor={isAuthor}
            onStatusChange={() => {
              // Optionnel : recharger la tâche ou mettre à jour l'état
              console.log('Task status changed')
            }}
          />

          {/* Colonne latérale - Informations complémentaires */}
            {!isMobile && (
              <div className="space-y-6">
                {/* Profil de l'auteur */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Auteur de la Tâche</h3>
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold shadow-lg">
                      {task.author_profile?.name?.charAt(0) || 'U'}
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {task.author_profile?.name || 'Utilisateur'}
                    </h4>
                    <div className="flex items-center justify-center space-x-1 text-yellow-600 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < (task.author_profile?.rating || 0) ? 'fill-current' : ''}`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">
                      {task.author_profile?.rating_count || 0} évaluation(s)
                    </p>
                  </div>
                </div>

                {/* Statistiques de la tâche */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Créée le</span>
                      <span className="font-medium text-gray-900">
                        {new Date(task.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Statut</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Priorité</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                    </div>
                    {task.is_urgent && (
                      <div className="flex items-center justify-center p-2 bg-red-50 rounded-lg border border-red-200">
                        <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                        <span className="text-sm font-medium text-red-700">Tâche urgente</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
