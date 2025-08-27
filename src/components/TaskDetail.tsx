import React, { useState, useEffect } from 'react'
import { ArrowLeft, MapPin, Calendar, Euro, User, CheckCircle, MessageCircle, Clock, Star } from 'lucide-react'
import { useTaskActions } from '../hooks/useTaskActions'
import { useAuth } from '../hooks/useAuth'
import type { Database } from '../lib/supabase'

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
      const parts = data.display_name.split(', ')
      const relevantParts = parts.slice(0, 4).join(', ')
      return relevantParts
    }
    
    return 'Adresse non disponible'
  } catch (error) {
    console.error('Erreur de géocodification inverse:', error)
    return 'Adresse non disponible'
  }
}

type Task = Database['public']['Tables']['tasks']['Row'] & {
  author_profile?: Database['public']['Tables']['profiles']['Row']
  helper_profile?: Database['public']['Tables']['profiles']['Row']
}

interface TaskDetailProps {
  task: Task
  onBack: () => void
  onChatOpen: (taskId: string) => void
}

export default function TaskDetail({ task, onBack, onChatOpen }: TaskDetailProps) {
  const { user } = useAuth()
  const { 
    acceptTask, 
    startTask, 
    completeTask, 
    cancelTask,
    canAcceptTask,
    canStartTask,
    canCompleteTask,
    canCancelTask,
    loading,
    error
  } = useTaskActions()
  
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null)
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)

  const isAuthor = user?.id === task.author
  const isHelper = user?.id === task.helper

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
      }
    }

    resolveAddress()
  }, [task.address, task.location])

  const handleAcceptTask = async () => {
    if (!user) return

    const success = await acceptTask(task.id)
    if (success) {
      // Recharger la page ou mettre à jour l'état
      window.location.reload()
    }
  }

  const handleStartTask = async () => {
    if (!user) return

    const success = await startTask(task.id)
    if (success) {
      window.location.reload()
    }
  }

  const handleCompleteTask = async () => {
    if (!user) return

    const success = await completeTask(task.id)
    if (success) {
      window.location.reload()
    }
  }

  const handleCancelTask = async () => {
    if (!user) return

    const success = await cancelTask(task.id)
    if (success) {
      window.location.reload()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800 border-green-200'
      case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in-progress': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Ouverte'
      case 'accepted': return 'Acceptée'
      case 'in-progress': return 'En Cours'
      case 'completed': return 'Terminée'
      case 'cancelled': return 'Annulée'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">Détails de la Tâche</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                {getStatusLabel(task.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Title and Description */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{task.title}</h2>
          <p className="text-gray-700 leading-relaxed">{task.description}</p>
        </div>

        {/* Task Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Euro className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Budget</span>
            </div>
            <p className="text-lg font-bold text-gray-900">€{task.budget}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Date Limite</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {task.deadline ? new Date(task.deadline).toLocaleDateString('fr-FR') : 'Aucune'}
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <MapPin className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-gray-600">Localisation</span>
          </div>
          <p className="text-gray-900">
            {isLoadingAddress ? (
              <span className="text-gray-500">Chargement de l'adresse...</span>
            ) : (
              resolvedAddress || 'Adresse non disponible'
            )}
          </p>
        </div>

        {/* Participants */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Auteur</p>
                <p className="text-sm text-gray-600">{task.author_profile?.name || 'Anonyme'}</p>
              </div>
            </div>
          </div>

          {task.helper_profile && (
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Aide</p>
                  <p className="text-sm text-gray-600">{task.helper_profile.name}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {canAcceptTask(task) && (
            <button
              onClick={handleAcceptTask}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
            >
              {loading ? 'Acceptation...' : 'Accepter cette tâche'}
            </button>
          )}

          {canStartTask(task) && (
            <button
              onClick={handleStartTask}
              disabled={loading}
              className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 disabled:bg-orange-300 transition-colors"
            >
              {loading ? 'Démarrage...' : 'Démarrer la tâche'}
            </button>
          )}

          {canCompleteTask(task) && (
            <button
              onClick={handleCompleteTask}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-green-300 transition-colors"
            >
              {loading ? 'Finalisation...' : 'Marquer comme terminée'}
            </button>
          )}

          {canCancelTask(task) && (
            <button
              onClick={handleCancelTask}
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 disabled:bg-red-300 transition-colors"
            >
              {loading ? 'Annulation...' : 'Annuler la tâche'}
            </button>
          )}

          {/* Chat button - accessible à tous les utilisateurs connectés */}
          {user && (
            <button
              onClick={() => onChatOpen(task.id)}
              className="w-full bg-gray-100 text-gray-900 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Ouvrir le chat</span>
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
