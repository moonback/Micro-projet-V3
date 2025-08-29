import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Clock, Euro, Star, User, CheckCircle, AlertTriangle, TrendingUp, Zap, Tag, Calendar, MessageCircle, Award, Heart, Globe, Building, Camera } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { TaskWithProfiles } from '../types/task'
import UserLocationBadge from './UserLocationBadge'
import DistanceBadge from './DistanceBadge'

// Fonctions utilitaires (pas de changement majeur)
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
    case 'open': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'in-progress': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'open': return '✨ Disponible'
    case 'accepted': return '🤝 Acceptée'
    case 'in-progress': return '⚡ En cours'
    case 'completed': return '🎉 Terminée'
    default: return status
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low': return 'bg-gray-100 text-gray-800 border-gray-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case 'urgent': return '🚨 Urgente'
    case 'high': return '⚡ Élevée'
    case 'medium': return '📋 Moyenne'
    case 'low': return '📝 Faible'
    default: return priority
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

const getCategoryGradient = (category: string) => {
  const categoryGradients: Record<string, string> = {
    'Livraison': 'from-blue-500 to-cyan-600',
    'Nettoyage': 'from-teal-500 to-emerald-600',
    'Courses': 'from-green-500 to-emerald-600',
    'Déménagement': 'from-orange-500 to-red-600',
    'Montage': 'from-gray-500 to-slate-600',
    'Garde d\'Animaux': 'from-pink-500 to-rose-600',
    'Jardinage': 'from-green-500 to-lime-600',
    'Aide Informatique': 'from-purple-500 to-indigo-600',
    'Cours Particuliers': 'from-indigo-500 to-blue-600',
    'Autre': 'from-violet-500 to-pink-600'
  }
  return categoryGradients[category] || 'from-blue-500 to-cyan-600'
}

interface TaskCardProps {
  task: TaskWithProfiles
  onPress: (task: TaskWithProfiles) => void
  onTaskAccepted?: (taskId: string) => void
  onApplyToTask?: (task: TaskWithProfiles) => void
  isDesktop?: boolean
}

export default function TaskCard({ task, onPress, onTaskAccepted, onApplyToTask, isDesktop = false }: TaskCardProps) {
  const { user } = useAuth()
  const [accepting, setAccepting] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [checkingApplication, setCheckingApplication] = useState(false)

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
        setHasApplied(false)
      } finally {
        setCheckingApplication(false)
      }
    }
    checkApplication()
  }, [user, task.id, task.status])

  const handleApplyToTask = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user || !onApplyToTask) return

    setAccepting(true)
    try {
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
    } catch (error: any) {
      console.error('Error applying for task:', error)
      if (error?.code === '23505') {
        alert('Vous avez déjà candidaté à cette tâche')
      } else {
        alert('Erreur lors de la candidature à la tâche')
      }
    } finally {
      setAccepting(false)
    }
  }

  const handleCompleteTask = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user || user.id !== task.helper || task.status !== 'in_progress') return

    if (!confirm('Êtes-vous sûr de vouloir marquer cette tâche comme terminée ?')) return

    setAccepting(true)
    try {
      const { error } = await supabase
        .rpc('mark_task_completed', { task_id_param: task.id })

      if (error) throw error

      alert('Tâche marquée comme terminée avec succès !')
      window.location.reload()
    } catch (error: any) {
      console.error('Error marking task as completed:', error)
      alert('Erreur lors de la finalisation de la tâche')
    } finally {
      setAccepting(false)
    }
  }

  const canApply = user && task.status === 'open' && task.author !== user.id && !hasApplied
  const canComplete = user && user.id === task.helper && task.status === 'in_progress'

  const cardClasses = isDesktop
    ? 'group relative bg-white rounded-2xl border border-gray-200 p-4 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col overflow-hidden'
    : 'group relative bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden'

  return (
    <motion.div
      whileHover={{
        y: isDesktop ? -8 : -4,
        scale: 1.02,
        boxShadow: "0 15px 30px -5px rgba(0,0,0,0.1)",
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onPress(task)}
      className={cardClasses}
    >
      {/* Bordure gradient animée */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

      {/* En-tête avec statut, priorité et budget */}
      <div className={`flex items-start justify-between ${isDesktop ? 'mb-3' : 'mb-2'}`}>
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 bg-gradient-to-br ${getCategoryGradient(task.category)} rounded-lg flex items-center justify-center text-white text-base font-bold shadow-md relative overflow-hidden`}>
            <span>{getCategoryIcon(task.category)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`${isDesktop ? 'text-base' : 'text-sm'} font-bold text-gray-900 leading-tight mb-1 group-hover:text-blue-600 transition-colors duration-300`}>
              {task.title}
            </h3>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getStatusColor(task.status)}`}>
                {getStatusLabel(task.status)}
              </span>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getPriorityColor(task.priority)}`}>
                {getPriorityLabel(task.priority)}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-green-600">€{task.budget}</div>
        </div>
      </div>

      {/* Description */}
      <div className={`${isDesktop ? 'mb-3' : 'mb-2'}`}>
        <p className="text-gray-600 leading-relaxed line-clamp-2 text-sm">
          {task.description}
        </p>
      </div>

      {/* Métadonnées */}
      <div className={`grid grid-cols-2 gap-2 mt-auto ${isDesktop ? 'mb-3' : 'mb-2'}`}>
        {/* Distance */}
        <motion.div whileHover={{ scale: 1.02 }} className="flex items-center space-x-2 p-2 rounded-lg border border-blue-100">
          <MapPin className="w-4 h-4 text-blue-500" />
          <DistanceBadge task={task} variant="compact" showIcon={false} className="text-xs font-medium text-blue-700" />
        </motion.div>
        {/* Temps écoulé */}
        <motion.div whileHover={{ scale: 1.02 }} className="flex items-center space-x-2 p-2 rounded-lg border border-orange-100">
          <Clock className="w-4 h-4 text-orange-500" />
          <span className="text-xs font-medium text-orange-700">{formatTimeAgo(task.created_at)}</span>
        </motion.div>
        {/* Auteur */}
        <motion.div whileHover={{ scale: 1.02 }} className="flex items-center space-x-2 p-2 rounded-lg border border-gray-100">
          <User className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-700">{task.author_profile?.name || 'Utilisateur'}</span>
        </motion.div>
        {/* Note de l'auteur */}
        <motion.div whileHover={{ scale: 1.02 }} className="flex items-center space-x-1 p-2 rounded-lg border border-yellow-100">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-bold text-yellow-600">{task.author_profile?.rating?.toFixed(1) || 'N/A'}</span>
          <span className="text-gray-400">•</span>
          <span className="text-xs text-gray-600 font-medium">{task.author_profile?.rating_count || 0} avis</span>
        </motion.div>
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, isDesktop ? 3 : 2).map((tag, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.2 }}
              whileHover={{ scale: 1.05, y: -1 }}
              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200"
            >
              #{tag}
            </motion.span>
          ))}
          {task.tags.length > (isDesktop ? 3 : 2) && (
            <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-full border border-gray-200">
              +{task.tags.length - (isDesktop ? 3 : 2)}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto pt-3 border-t border-gray-100">
        {checkingApplication ? (
          <div className="w-full flex items-center justify-center py-3 text-gray-500 bg-gray-50 rounded-xl">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full mr-2"
            />
            <span className="text-sm font-medium">Vérification...</span>
          </div>
        ) : hasApplied ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full bg-blue-100 border border-blue-200 text-blue-700 py-3 px-4 rounded-xl font-semibold flex items-center justify-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Candidature Envoyée ✨</span>
          </motion.div>
        ) : canApply ? (
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(34, 197, 94, 0.3)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleApplyToTask}
            disabled={accepting}
            className={`w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 px-4 rounded-xl font-bold text-sm shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
              accepting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Postuler à la Tâche</span>
            <Zap className="w-3 h-3 ml-1" />
          </motion.button>
        ) : canComplete ? (
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(168, 85, 247, 0.3)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCompleteTask}
            disabled={accepting}
            className={`w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-bold text-sm shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
              accepting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            <Award className="w-4 h-4" />
            <span className="text-sm">Marquer comme Terminée</span>
            <Heart className="w-3 h-3 ml-1" />
          </motion.button>
        ) : (
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="w-full text-center py-2 px-3 text-gray-600 bg-gray-50 rounded-xl transition-colors duration-200"
          >
            <span className="text-xs font-medium">Voir les détails de la tâche</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}