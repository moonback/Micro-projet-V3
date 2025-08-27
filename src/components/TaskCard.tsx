import React from 'react'
import { motion } from 'framer-motion'
import { MapPin, Clock, Euro, CheckCircle, MessageCircle, Home, Car, Wrench, BookOpen, Heart, Palette, Camera, Music, Utensils, ShoppingBag } from 'lucide-react'
import { useTaskActions } from '../hooks/useTaskActions'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { supabase } from '../lib/supabase'

type Task = Database['public']['Tables']['tasks']['Row'] & {
  author_profile?: Database['public']['Tables']['profiles']['Row']
}

interface TaskCardProps {
  task: Task
  onPress: (task: Task) => void
  onTaskAccepted?: (taskId: string) => void
}

export default function TaskCard({ task, onPress, onTaskAccepted }: TaskCardProps) {
  const { 
    requestTaskApproval, 
    canRequestTask, 
    loading, 
    error 
  } = useTaskActions()

  const formatDistance = (location: any) => {
    if (!location) return 'Distance inconnue'
    return 'À proximité'
  }

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: fr 
      })
    } catch {
      return 'Récemment'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800'
      case 'pending-approval':
        return 'bg-yellow-100 text-yellow-800'
      case 'accepted':
        return 'bg-blue-100 text-blue-800'
      case 'in-progress':
        return 'bg-orange-100 text-orange-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Ouverte'
      case 'pending-approval':
        return 'En attente'
      case 'accepted':
        return 'Acceptée'
      case 'in-progress':
        return 'En cours'
      case 'completed':
        return 'Terminée'
      case 'cancelled':
        return 'Annulée'
      default:
        return status
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'livraison':
        return <Car className="w-4 h-4" />
      case 'nettoyage':
        return <Wrench className="w-4 h-4" />
      case 'courses':
        return <ShoppingBag className="w-4 h-4" />
      case 'déménagement':
        return <Home className="w-4 h-4" />
      case 'montage':
        return <Wrench className="w-4 h-4" />
      case 'garde d\'animaux':
        return <Heart className="w-4 h-4" />
      case 'jardinage':
        return <Home className="w-4 h-4" />
      case 'aide informatique':
        return <BookOpen className="w-4 h-4" />
      case 'cours particuliers':
        return <BookOpen className="w-4 h-4" />
      case 'autre':
        return <Wrench className="w-4 h-4" />
      default:
        return <Wrench className="w-4 h-4" />
    }
  }

  const handleRequestApproval = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const success = await requestTaskApproval(task.id)
    if (success && onTaskAccepted) {
      onTaskAccepted(task.id)
    }
  }

  const isAuthor = task.author === (supabase.auth.getUser() as any)?.data?.user?.id
  const canRequest = canRequestTask(task)
  const isPendingApproval = task.status === 'pending-approval'

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onPress(task)}
      className={`
        bg-white rounded-xl p-4 shadow-sm border cursor-pointer transition-all duration-200
        ${isPendingApproval ? 'opacity-60 bg-gray-50 border-gray-200' : 'hover:shadow-md hover:border-gray-300'}
      `}
    >
      {/* En-tête avec statut */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getCategoryIcon(task.category)}
          <span className="text-sm text-gray-600 capitalize">
            {task.category || 'Autre'}
          </span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
          {getStatusLabel(task.status)}
        </span>
      </div>

      {/* Titre et description */}
      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
        {task.title}
      </h3>
      {task.description && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Informations de localisation et temps */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
        <div className="flex items-center space-x-1">
          <MapPin className="w-4 h-4" />
          <span>{formatDistance(task.location)}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="w-4 h-4" />
          <span>{formatTimeAgo(task.created_at)}</span>
        </div>
      </div>

      {/* Budget */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-1">
          <Euro className="w-4 h-4 text-green-600" />
          <span className="font-semibold text-green-600">
            {task.budget} {task.currency}
          </span>
        </div>
        {task.deadline && (
          <span className="text-xs text-gray-500">
            Échéance: {new Date(task.deadline).toLocaleDateString('fr-FR')}
          </span>
        )}
      </div>

      {/* Boutons d'action */}
      <div className="flex space-x-2">
        {/* Bouton de demande d'approbation */}
        {canRequest && !isPendingApproval && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRequestApproval}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors flex items-center space-x-2 flex-1 justify-center"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Envoi...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Demander l'approbation</span>
              </>
            )}
          </motion.button>
        )}

        {/* Indicateur de demande en attente */}
        {isPendingApproval && (
          <div className="w-full bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-center">
            <div className="flex items-center justify-center space-x-2 text-yellow-800">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                Demande en attente d'approbation
              </span>
            </div>
            <p className="text-xs text-yellow-600 mt-1">
              Le créateur a 5 minutes pour répondre
            </p>
          </div>
        )}

        {/* Bouton de chat (accessible à tous les utilisateurs connectés) */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            // Ouvrir le chat
          }}
          className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-xl transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Affichage des erreurs */}
      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
    </motion.div>
  )
}