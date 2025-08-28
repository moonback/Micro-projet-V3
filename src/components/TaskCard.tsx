import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Clock, Euro, Star, User, CheckCircle, AlertTriangle, TrendingUp, Zap, Tag, Calendar, MessageCircle, Award, Heart } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { TaskWithProfiles } from '../types/task'
import UserLocationBadge from './UserLocationBadge'
import DistanceBadge from './DistanceBadge'

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
  const [isHovered, setIsHovered] = useState(false)

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
        return 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border-emerald-200 shadow-sm'
      case 'accepted':
        return 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-200 shadow-sm'
      case 'in-progress':
        return 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border-orange-200 shadow-sm'
      case 'completed':
        return 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border-purple-200 shadow-sm'
      default:
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200 shadow-sm'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return '✨ Disponible'
      case 'accepted':
        return '🤝 Acceptée'
      case 'in-progress':
        return '⚡ En cours'
      case 'completed':
        return '🎉 Terminée'
      default:
        return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-200 shadow-sm'
      case 'high':
        return 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border-orange-200 shadow-sm'
      case 'medium':
        return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-200 shadow-sm'
      case 'low':
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200 shadow-sm'
      default:
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200 shadow-sm'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '🚨 Urgente'
      case 'high':
        return '⚡ Élevée'
      case 'medium':
        return '📋 Moyenne'
      case 'low':
        return '📝 Faible'
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

  const getCategoryGradient = (category: string) => {
    const categoryGradients: Record<string, string> = {
      'Livraison': 'from-blue-500 via-blue-600 to-cyan-600',
      'Nettoyage': 'from-teal-500 via-teal-600 to-emerald-600',
      'Courses': 'from-green-500 via-green-600 to-emerald-600',
      'Déménagement': 'from-orange-500 via-orange-600 to-red-600',
      'Montage': 'from-gray-500 via-gray-600 to-slate-600',
      'Garde d\'Animaux': 'from-pink-500 via-pink-600 to-rose-600',
      'Jardinage': 'from-green-500 via-lime-600 to-emerald-600',
      'Aide Informatique': 'from-purple-500 via-purple-600 to-indigo-600',
      'Cours Particuliers': 'from-indigo-500 via-indigo-600 to-blue-600',
      'Autre': 'from-violet-500 via-purple-600 to-pink-600'
    }
    return categoryGradients[category] || 'from-blue-500 via-blue-600 to-cyan-600'
  }

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
        // Pas de candidature existante
        setHasApplied(false)
      } finally {
        setCheckingApplication(false)
      }
    }

    checkApplication()
  }, [user, task.id, task.status])

  const handleAcceptTask = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user || !onTaskAccepted || hasApplied) return

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
      
      setHasApplied(true)
      onTaskAccepted(task.id)
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
    if (!user || !canCompleteTask) return

    if (!confirm('Êtes-vous sûr de vouloir marquer cette tâche comme terminée ?')) return

    setAccepting(true)
    try {
      const { error } = await supabase
        .rpc('mark_task_completed', { task_id_param: task.id })

      if (error) throw error

      alert('Tâche marquée comme terminée avec succès !')
      // Recharger la page pour mettre à jour l'affichage
      window.location.reload()
    } catch (error: any) {
      console.error('Error marking task as completed:', error)
      alert('Erreur lors de la finalisation de la tâche')
    } finally {
      setAccepting(false)
    }
  }

  const canAcceptTask = user && 
                       task.status === 'open' && 
                       task.author !== user.id && 
                       !hasApplied &&
                       onTaskAccepted
  const canCompleteTask = user && user.id === task.helper && task.status === 'in_progress'

  // Design adaptatif selon la taille d'écran - optimisé pour 3 cartes par ligne
  const cardClasses = isDesktop 
    ? 'group relative bg-white rounded-2xl border border-gray-200 p-4 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col overflow-hidden backdrop-blur-sm'
    : 'group relative bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-sm'

  const handleCardClick = () => {
    // Si c'est une tâche qui ne nous appartient pas et qu'on a onApplyToTask, utiliser cette fonction
    if (onApplyToTask && user && task.author !== user.id) {
      onApplyToTask(task)
    } else {
      // Sinon, utiliser la fonction normale onPress
      onPress(task)
    }
  }

  return (
    <motion.div
      whileHover={{ 
        y: isDesktop ? -8 : -4, 
        scale: 1.02,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.97 }}
      onClick={handleCardClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cardClasses}
      style={{
        background: isHovered 
          ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)'
          : 'rgba(255,255,255,0.95)'
      }}
    >
      {/* Effet de brillance animé */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      
      {/* Bordure gradient animée */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

      {/* En-tête avec statut et priorité - version compacte pour 4 cartes par ligne */}
      <div className={`flex items-start justify-between ${isDesktop ? 'mb-3' : 'mb-2'}`}>
        <div className="flex items-center space-x-3">
          <motion.div 
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
            className={`w-10 h-10 bg-gradient-to-br ${getCategoryGradient(task.category)} rounded-lg flex items-center justify-center text-white text-base font-bold shadow-md relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10">{getCategoryIcon(task.category)}</span>
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <motion.h3 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${isDesktop ? 'text-base' : 'text-sm'} font-bold text-gray-900 leading-tight mb-1 group-hover:text-blue-600 transition-colors duration-300`}
            >
              {task.title}
            </motion.h3>
            {isDesktop && (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                  <User className="w-2 h-2 text-white" />
                </div>
                <div className="flex flex-col">
                  <p className="text-xs text-gray-600 font-medium">
                    {task.author_profile?.name || 'Utilisateur'}
                  </p>
                  <UserLocationBadge
                    city={task.author_profile?.city}
                    postal_code={task.author_profile?.postal_code}
                    country={task.author_profile?.country}
                    compact={true}
                    showIcon={false}
                    className="text-xs text-gray-500"
                  />
                </div>
                {task.author_profile?.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-2 h-2 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-gray-500 font-medium">
                      {task.author_profile.rating}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-1">
          <motion.span 
            whileHover={{ scale: 1.05 }}
            className={`px-2 py-1 text-xs font-semibold rounded-lg border ${getStatusColor(task.status)} backdrop-blur-sm`}
          >
            {getStatusLabel(task.status)}
          </motion.span>
          <motion.span 
            whileHover={{ scale: 1.05 }}
            className={`px-2 py-1 text-xs font-semibold rounded-lg border ${getPriorityColor(task.priority)} backdrop-blur-sm`}
          >
            {getPriorityLabel(task.priority)}
          </motion.span>
        </div>
      </div>

      {/* Description avec effet de fade - version compacte */}
      <motion.div
        initial={{ opacity: 0.8 }}
        whileHover={{ opacity: 1 }}
        className={`${isDesktop ? 'mb-3' : 'mb-2'}`}
      >
        <p className="text-gray-600 leading-relaxed line-clamp-2 text-sm">
          {task.description}
        </p>
      </motion.div>

      {/* Métadonnées avec icônes animées - version compacte */}
      <div className={`${isDesktop ? 'grid grid-cols-2 gap-2 mb-3' : 'space-y-2 mb-2'}`}>
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="flex items-center space-x-2 bg-gradient-to-r from-green-50 to-emerald-50 p-2 rounded-lg border border-green-100"
        >
          <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-md flex items-center justify-center">
            <Euro className="w-3 h-3 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-green-700">€{task.budget}</span>
            <p className="text-xs text-green-600">Budget</p>
          </div>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-cyan-50 p-2 rounded-lg border border-blue-100"
        >
          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-md flex items-center justify-center">
            <MapPin className="w-3 h-3 text-white" />
          </div>
          <div>
            <DistanceBadge 
              task={task} 
              variant="compact" 
              showIcon={false}
              className="text-xs font-medium text-blue-700"
            />
            <p className="text-xs text-blue-600">Distance</p>
          </div>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="flex items-center space-x-2 bg-gradient-to-r from-orange-50 to-amber-50 p-2 rounded-lg border border-orange-100"
        >
          <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-amber-500 rounded-md flex items-center justify-center">
            <Clock className="w-3 h-3 text-white" />
          </div>
          <div>
            <span className="text-xs font-medium text-orange-700">{formatTimeAgo(task.created_at)}</span>
            <p className="text-xs text-blue-600">Publié</p>
          </div>
        </motion.div>
        
        {task.deadline && (
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-50 to-violet-50 p-2 rounded-lg border border-purple-100"
          >
            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-violet-500 rounded-md flex items-center justify-center">
              <Calendar className="w-3 h-3 text-white" />
            </div>
            <div>
              <span className="text-xs font-medium text-purple-700">
                {new Date(task.deadline).toLocaleDateString('fr-FR')}
              </span>
              <p className="text-xs text-purple-600">Échéance</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Tags avec animations - version compacte */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, isDesktop ? 4 : 2).map((tag, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -1 }}
              className="px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-xs font-medium rounded-md border border-blue-200 hover:shadow-sm transition-all duration-200"
            >
              #{tag}
            </motion.span>
          ))}
          {task.tags.length > (isDesktop ? 4 : 2) && (
            <motion.span 
              whileHover={{ scale: 1.05, y: -1 }}
              className="px-2 py-1 bg-gradient-to-r from-gray-50 to-slate-50 text-gray-600 text-xs font-medium rounded-md border border-gray-200 hover:shadow-sm transition-all duration-200"
            >
              +{task.tags.length - (isDesktop ? 4 : 2)}
            </motion.span>
          )}
        </div>
      )}

      {/* Actions avec animations améliorées - version compacte */}
      <div className={`${isDesktop ? 'mt-auto pt-3 border-t border-gray-100' : 'flex items-center justify-between'}`}>
        {checkingApplication ? (
          <div className="w-full flex items-center justify-center py-3 px-3 text-gray-500 bg-gray-50 rounded-xl">
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
            className="w-full bg-gradient-to-r from-blue-100 via-blue-50 to-indigo-100 border border-blue-200 text-blue-700 py-3 px-4 rounded-xl font-semibold flex items-center justify-center space-x-2 shadow-md"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <CheckCircle className="w-4 h-4" />
            </motion.div>
            <span className="text-sm">Candidature Envoyée ✨</span>
          </motion.div>
        ) : canAcceptTask ? (
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(34, 197, 94, 0.3)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAcceptTask}
            disabled={accepting}
            className={`w-full bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white py-3 px-4 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2 relative overflow-hidden ${
              accepting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-700" />
            {accepting ? (
              <>
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" 
                />
                <span className="text-sm">Envoi en cours...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Postuler à la Tâche</span>
                <Zap className="w-3 h-3 ml-1" />
              </>
            )}
          </motion.button>
        ) : canCompleteTask ? (
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(168, 85, 247, 0.3)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCompleteTask}
            disabled={accepting}
            className={`w-full bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 text-white py-3 px-4 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2 relative overflow-hidden ${
              accepting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-700" />
            {accepting ? (
              <>
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" 
                />
                <span className="text-sm">Finalisation...</span>
              </>
            ) : (
              <>
                <Award className="w-4 h-4" />
                <span className="text-sm">Marquer comme Terminée</span>
                <Heart className="w-3 h-3 ml-1" />
              </>
            )}
          </motion.button>
        ) : (
          <div className="flex items-center justify-between w-full">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="flex items-center space-x-2 text-gray-600 bg-gray-50 p-2 rounded-lg"
            >
              <MessageCircle className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium">Voir les détails</span>
            </motion.div>
            
            {isDesktop && (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center space-x-2 bg-yellow-50 p-2 rounded-lg border border-yellow-200"
              >
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-bold text-yellow-600">
                    {task.author_profile?.rating || 0}
                  </span>
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-xs text-gray-600 font-medium">
                  {task.author_profile?.rating_count || 0} avis
                </span>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}