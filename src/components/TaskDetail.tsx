import React, { useState, useEffect } from 'react'
import { ArrowLeft, MapPin, Calendar, Euro, User, CheckCircle, MessageCircle, Clock, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
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
  const [actionLoading, setActionLoading] = useState(false)
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null)
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)

  const isAuthor = user?.id === task.author
  const isHelper = user?.id === task.helper
  const canAccept = !isAuthor && !isHelper && task.status === 'open'
  const canComplete = (isAuthor || isHelper) && task.status === 'in-progress'
  const canCancel = (isAuthor || isHelper) && ['open', 'accepted', 'in-progress'].includes(task.status)

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
    if (!user) return

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'accepted',
          helper: user.id 
        })
        .eq('id', task.id)

      if (error) throw error

      // Recharger la page ou mettre à jour l'état
      window.location.reload()
    } catch (error) {
      console.error('Error accepting task:', error)
      alert('Erreur lors de l\'acceptation de la tâche')
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
        .update({ status: 'in-progress' })
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
        .update({ status: 'completed' })
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
      case 'accepted': return 'bg-yellow-100 text-yellow-800'
      case 'in-progress': return 'bg-orange-100 text-orange-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Ouverte'
      case 'accepted': return 'Acceptée'
      case 'in-progress': return 'En cours'
      case 'completed': return 'Terminée'
      case 'cancelled': return 'Annulée'
      default: return status
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
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
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Title and Description */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{task.title}</h2>
          <p className="text-gray-700 leading-relaxed">{task.description}</p>
        </div>

        {/* Task Info Grid */}
        <div className="grid grid-cols-2 gap-4">
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
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-red-600" />
            Localisation
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            {isLoadingAddress ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Récupération de l'adresse...</span>
              </div>
            ) : (
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{resolvedAddress || 'Adresse non disponible'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Participants */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Participants</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {canAccept && (
            <button
              onClick={handleAcceptTask}
              disabled={actionLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
            >
              {actionLoading ? 'Acceptation...' : 'Accepter cette tâche'}
            </button>
          )}

          {isHelper && task.status === 'accepted' && (
            <button
              onClick={handleStartTask}
              disabled={actionLoading}
              className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 disabled:bg-orange-300 transition-colors"
            >
              {actionLoading ? 'Démarrage...' : 'Démarrer la tâche'}
            </button>
          )}

          {canComplete && (
            <button
              onClick={handleCompleteTask}
              disabled={actionLoading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-green-300 transition-colors"
            >
              {actionLoading ? 'Finalisation...' : 'Marquer comme terminée'}
            </button>
          )}

          {canCancel && (
            <button
              onClick={handleCancelTask}
              disabled={actionLoading}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 disabled:bg-red-300 transition-colors"
            >
              {actionLoading ? 'Annulation...' : 'Annuler la tâche'}
            </button>
          )}

          {/* Chat button */}
          {(isAuthor || isHelper) && (
            <button
              onClick={() => onChatOpen(task.id)}
              className="w-full bg-gray-100 text-gray-900 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Ouvrir le chat</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
