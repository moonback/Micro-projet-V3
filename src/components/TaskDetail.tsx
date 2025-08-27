import React, { useState } from 'react'
import { ArrowLeft, MapPin, Clock, Euro, User, MessageCircle, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Database } from '../lib/supabase'

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
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const isAuthor = task.author === user?.id
  const isHelper = task.helper === user?.id
  const canAccept = !isAuthor && !isHelper && task.status === 'open'
  const canComplete = isAuthor && task.status === 'in-progress'
  const canCancel = isAuthor && task.status === 'open'

  const handleAcceptTask = async () => {
    if (!user) return

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          helper: user.id,
          status: 'accepted'
        })
        .eq('id', task.id)

      if (error) throw error

      // Créer un message automatique
      await supabase
        .from('messages')
        .insert({
          task_id: task.id,
          sender: user.id,
          content: 'J\'ai accepté cette tâche !'
        })

      alert('Tâche acceptée avec succès !')
      onBack()
    } catch (error) {
      console.error('Error accepting task:', error)
      alert('Erreur lors de l\'acceptation de la tâche')
    } finally {
      setActionLoading(false)
    }
  }

  const handleStartTask = async () => {
    if (!user || !isHelper) return

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'in-progress' })
        .eq('id', task.id)

      if (error) throw error

      alert('Tâche démarrée !')
      onBack()
    } catch (error) {
      console.error('Error starting task:', error)
      alert('Erreur lors du démarrage de la tâche')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCompleteTask = async () => {
    if (!user || !isAuthor) return

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', task.id)

      if (error) throw error

      alert('Tâche marquée comme terminée !')
      onBack()
    } catch (error) {
      console.error('Error completing task:', error)
      alert('Erreur lors de la finalisation de la tâche')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelTask = async () => {
    if (!user || !isAuthor) return

    if (!confirm('Êtes-vous sûr de vouloir annuler cette tâche ?')) return

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'cancelled' })
        .eq('id', task.id)

      if (error) throw error

      alert('Tâche annulée')
      onBack()
    } catch (error) {
      console.error('Error cancelling task:', error)
      alert('Erreur lors de l\'annulation de la tâche')
    } finally {
      setActionLoading(false)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800'
      case 'accepted': return 'bg-blue-100 text-blue-800'
      case 'in-progress': return 'bg-orange-100 text-orange-800'
      case 'completed': return 'bg-purple-100 text-purple-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{task.title}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                {getStatusLabel(task.status)}
              </span>
              <span className="text-sm text-gray-500">
                {new Date(task.created_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Description */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
          <p className="text-gray-700">{task.description || 'Aucune description fournie'}</p>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Euro className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900">Budget</span>
            </div>
            <p className="text-2xl font-bold text-green-600">€{task.budget}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Date limite</span>
            </div>
            <p className="text-gray-700">
              {task.deadline 
                ? new Date(task.deadline).toLocaleDateString('fr-FR')
                : 'Aucune limite'
              }
            </p>
          </div>
        </div>

        {/* Location */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Localisation</h3>
          <div className="flex items-center space-x-2 text-gray-700">
            <MapPin className="w-5 h-5" />
            <span>{task.address || 'Adresse non spécifiée'}</span>
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
