import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Clock, Euro, Star, User, CheckCircle, AlertTriangle, TrendingUp, Zap, Tag, Calendar, MessageCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { TaskWithProfiles } from '../types/task'

interface TaskCardProps {
  task: TaskWithProfiles
  onPress: (task: TaskWithProfiles) => void
  onTaskAccepted?: (taskId: string) => void
  isDesktop?: boolean
}

export default function TaskCard({ task, onPress, onTaskAccepted, isDesktop = false }: TaskCardProps) {
  const { user } = useAuth()
  const [accepting, setAccepting] = useState(false)

  const formatDistance = (location: any) => {
    if (!location || !location.coordinates) return 'Distance inconnue'
    // Calcul simple de distance (à améliorer avec une vraie API)
    return 'À proximité'
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) return 'À l\'instant'
    if (diffInHours < 24) return `Il y a ${Math.floor(diffInHours)}h`
    if (diffInHours < 48) return 'Hier'
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in-progress':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Disponible'
      case 'accepted':
        return 'Acceptée'
      case 'in-progress':
        return 'En cours'
      case 'completed':
        return 'Terminée'
      default:
        return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Urgente'
      case 'high':
        return 'Élevée'
      case 'medium':
        return 'Moyenne'
      case 'low':
        return 'Faible'
      default:
        return priority
    }
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

  const handleAcceptTask = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user || !onTaskAccepted) return

    setAccepting(true)
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
      onTaskAccepted(task.id)
    } catch (error) {
      console.error('Error applying for task:', error)
      alert('Erreur lors de la candidature à la tâche')
    } finally {
      setAccepting(false)
    }
  }

  const canAcceptTask = user && 
                       task.status === 'open' && 
                       task.author !== user.id && 
                       onTaskAccepted

  // Design adaptatif selon la taille d'écran
  const cardClasses = isDesktop 
    ? 'bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col'
    : 'bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer'

  const headerClasses = isDesktop 
    ? 'flex items-start justify-between mb-6'
    : 'flex items-start justify-between mb-4'

  const titleClasses = isDesktop 
    ? 'text-xl font-bold text-gray-900 leading-tight mb-2'
    : 'text-lg font-semibold text-gray-900 leading-tight mb-2'

  const descriptionClasses = isDesktop 
    ? 'text-gray-600 leading-relaxed mb-6'
    : 'text-gray-600 leading-relaxed mb-4'

  const metaClasses = isDesktop 
    ? 'grid grid-cols-2 gap-4 mb-6'
    : 'space-y-3 mb-4'

  const actionClasses = isDesktop 
    ? 'mt-auto pt-4 border-t border-gray-100'
    : 'flex items-center justify-between'

  return (
    <motion.div
      whileHover={{ y: isDesktop ? -4 : -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onPress(task)}
      className={cardClasses}
    >
      {/* En-tête avec statut et priorité */}
      <div className={headerClasses}>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
            {getCategoryIcon(task.category)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={titleClasses}>
              {task.title}
            </h3>
            {isDesktop && (
              <p className="text-sm text-gray-500 mb-2">
                Par {task.author_profile?.name || 'Utilisateur'}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(task.status)}`}>
            {getStatusLabel(task.status)}
          </span>
          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
            {getPriorityLabel(task.priority)}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className={descriptionClasses}>
        {task.description}
      </p>

      {/* Métadonnées */}
      <div className={metaClasses}>
        <div className="flex items-center space-x-2 text-gray-600">
          <Euro className="w-4 h-4" />
          <span className="text-sm font-medium">€{task.budget}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-600">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{formatDistance(task.location)}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-600">
          <Clock className="w-4 h-4" />
          <span className="text-sm">{formatTimeAgo(task.created_at)}</span>
        </div>
        
        {task.deadline && (
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">
              {new Date(task.deadline).toLocaleDateString('fr-FR')}
            </span>
          </div>
        )}
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {task.tags.slice(0, isDesktop ? 6 : 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-200"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > (isDesktop ? 6 : 3) && (
            <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-lg border border-gray-200">
              +{task.tags.length - (isDesktop ? 6 : 3)}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className={actionClasses}>
        {canAcceptTask ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAcceptTask}
            disabled={accepting}
            className={`w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2 ${
              accepting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {accepting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Acceptation...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Accepter la Tâche</span>
              </>
            )}
          </motion.button>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2 text-gray-500">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">Cliquez pour voir les détails</span>
            </div>
            
            {isDesktop && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 text-yellow-600">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-medium">
                    {task.author_profile?.rating || 0}
                  </span>
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-500">
                  {task.author_profile?.rating_count || 0} avis
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}