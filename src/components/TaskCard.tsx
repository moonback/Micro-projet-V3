import React from 'react'
import { Clock, MapPin, Euro, User, CheckCircle, Truck, Wrench, ShoppingCart, Home, PawPrint, Leaf, Monitor, BookOpen, Package } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTaskActions } from '../hooks/useTaskActions'
import { useAuth } from '../hooks/useAuth'
import type { Database } from '../lib/supabase'

type Task = Database['public']['Tables']['tasks']['Row'] & {
  author_profile?: Database['public']['Tables']['profiles']['Row']
}

interface TaskCardProps {
  task: Task
  onPress: (task: Task) => void
  onTaskAccepted?: (taskId: string) => void
}

export default function TaskCard({ task, onPress, onTaskAccepted }: TaskCardProps) {
  const { user } = useAuth()
  const { acceptTask, loading, canAcceptTask } = useTaskActions()

  const formatDistance = (location: any) => {
    // In a real app, calculate distance based on user's location
    return 'à 1,2 km'
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'À l\'instant'
    if (diffInHours < 24) return `Il y a ${diffInHours}h`
    return `Il y a ${Math.floor(diffInHours / 24)}j`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800 border-green-200'
      case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in-progress': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Ouverte'
      case 'accepted': return 'Acceptée'
      case 'in-progress': return 'En Cours'
      case 'completed': return 'Terminée'
      default: return status
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'livraison': return Truck
      case 'nettoyage': return Wrench
      case 'courses': return ShoppingCart
      case 'déménagement': return Home
      case 'montage': return Wrench
      case 'garde d\'animaux': return PawPrint
      case 'jardinage': return Leaf
      case 'aide informatique': return Monitor
      case 'cours particuliers': return BookOpen
      default: return Package
    }
  }

  const handleAcceptTask = async (e: React.MouseEvent) => {
    e.stopPropagation() // Empêcher l'ouverture des détails
    
    if (!user) return

    const success = await acceptTask(task.id)
    if (success && onTaskAccepted) {
      onTaskAccepted(task.id)
    }
  }

  const isAuthor = user?.id === task.author
  const isHelper = user?.id === task.helper
  const canAccept = canAcceptTask(task)

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onPress(task)}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 cursor-pointer hover:shadow-xl transition-all duration-200"
    >
      {/* Header avec statut et catégorie */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {React.createElement(getCategoryIcon(task.category || ''), {
            className: "w-5 h-5 text-blue-600"
          })}
          <span className="text-sm font-medium text-gray-600 capitalize">
            {task.category}
          </span>
        </div>
        
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
          {getStatusLabel(task.status)}
        </span>
      </div>

      {/* Titre et description */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {task.title}
        </h3>
        {task.description && (
          <p className="text-gray-600 text-sm line-clamp-2">
            {task.description}
          </p>
        )}
      </div>

      {/* Informations de la tâche */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>{formatDistance(task.location)}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{formatTimeAgo(task.created_at)}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Euro className="w-4 h-4" />
          <span className="font-semibold text-green-600">€{task.budget}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <User className="w-4 h-4" />
          <span>{task.author_profile?.name || 'Anonyme'}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        {canAccept && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAcceptTask}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Acceptation...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Accepter</span>
              </>
            )}
          </motion.button>
        )}

        {/* Indicateur si l'utilisateur est l'aide */}
        {isHelper && (
          <div className="flex items-center space-x-2 text-blue-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Vous êtes l'aide</span>
          </div>
        )}

        {/* Indicateur si l'utilisateur est l'auteur */}
        {isAuthor && (
          <div className="flex items-center space-x-2 text-green-600">
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">Votre tâche</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}