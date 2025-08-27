import React from 'react'
import { Clock, MapPin, Euro, User, CheckCircle, Truck, Wrench, ShoppingCart, Home, PawPrint, Leaf, Monitor, BookOpen, Package } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
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

  const formatDistance = (location: any) => {
    // In a real app, calculate distance based on user's location
    return 'à 1,2 km'
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
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
      case 'déménagement': return Package
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

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'accepted',
          helper: user.id 
        })
        .eq('id', task.id)

      if (error) throw error

      // Notifier le composant parent
      if (onTaskAccepted) {
        onTaskAccepted(task.id)
      }

      // Optionnel : recharger la page ou mettre à jour l'état
      window.location.reload()
    } catch (error) {
      console.error('Error accepting task:', error)
      alert('Erreur lors de l\'acceptation de la tâche')
    }
  }

  const CategoryIcon = getCategoryIcon(task.category)
  const isAuthor = user?.id === task.author
  const isHelper = user?.id === task.helper
  const canAccept = !isAuthor && !isHelper && task.status === 'open'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      onClick={() => onPress(task)}
      className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group"
    >
      {/* Header avec statut et catégorie */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <CategoryIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-2 leading-tight">
              {task.title}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          </div>
        </div>
        
        <div className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(task.status)}`}>
          {getStatusLabel(task.status)}
        </div>
      </div>

      {/* Informations de la tâche */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-600">
            <User className="w-4 h-4 mr-2" />
            <span className="font-medium">{task.author_profile?.name || 'Anonyme'}</span>
          </div>
          <div className="flex items-center text-gray-500">
            <Clock className="w-4 h-4 mr-2" />
            <span>{formatTimeAgo(task.created_at)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            <span className="text-sm">{task.address || formatDistance(task.location)}</span>
          </div>
          
          <div className="flex items-center bg-green-50 px-3 py-2 rounded-xl">
            <Euro className="w-5 h-5 text-green-600 mr-1" />
            <span className="font-bold text-lg text-green-700">€{task.budget}</span>
          </div>
        </div>
      </div>

      {/* Catégorie et Actions */}
      {task.category && (
        <div className="flex items-center justify-between">
          <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium">
            {task.category}
          </span>
          
          {/* Bouton Accepter - visible pour tous sauf l'auteur et l'aide actuel */}
          {canAccept && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAcceptTask}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors flex items-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Accepter</span>
            </motion.button>
          )}

          {/* Indicateur si l'utilisateur est l'aide */}
          {isHelper && task.status === 'accepted' && (
            <span className="inline-block bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium">
              Vous êtes l'aide
            </span>
          )}

          {/* Indicateur si l'utilisateur est l'auteur */}
          {isAuthor && (
            <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium">
              Votre tâche
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}