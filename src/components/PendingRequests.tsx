import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, CheckCircle, XCircle, Plus, User, MessageCircle, Euro, MapPin } from 'lucide-react'
import { useTaskActions } from '../hooks/useTaskActions'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Database } from '../lib/supabase'

type PendingRequest = Database['public']['Tables']['pending_task_requests']['Row'] & {
  task: Database['public']['Tables']['tasks']['Row'] & {
    author_profile?: Database['public']['Tables']['profiles']['Row']
    helper_profile?: Database['public']['Tables']['profiles']['Row']
  }
  helper_profile?: Database['public']['Tables']['profiles']['Row']
}

export default function PendingRequests() {
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedExtension, setSelectedExtension] = useState(5)

  const {
    getPendingRequestsForAuthor,
    approveTaskRequest,
    rejectTaskRequest,
    extendTaskRequest,
    loading: actionLoading,
    error
  } = useTaskActions()

  const loadPendingRequests = async () => {
    try {
      setLoading(true)
      const requests = await getPendingRequestsForAuthor()
      setPendingRequests(requests)
    } catch (err) {
      console.error('Erreur lors du chargement des demandes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadPendingRequests()
    setRefreshing(false)
  }

  const handleApprove = async (taskId: string) => {
    const success = await approveTaskRequest(taskId)
    if (success) {
      await loadPendingRequests()
    }
  }

  const handleReject = async (taskId: string) => {
    const success = await rejectTaskRequest(taskId)
    if (success) {
      await loadPendingRequests()
    }
  }

  const handleExtend = async (taskId: string) => {
    const success = await extendTaskRequest(taskId, selectedExtension)
    if (success) {
      await loadPendingRequests()
    }
  }

  const formatTimeRemaining = (expiresAt: string) => {
    try {
      const expires = new Date(expiresAt)
      const now = new Date()
      const diffMs = expires.getTime() - now.getTime()
      
      if (diffMs <= 0) return 'Expiré'
      
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000)
      
      if (diffMins > 0) {
        return `${diffMins}m ${diffSecs}s`
      }
      return `${diffSecs}s`
    } catch {
      return 'Temps inconnu'
    }
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

  useEffect(() => {
    loadPendingRequests()
    
    // Rafraîchir automatiquement toutes les 30 secondes
    const interval = setInterval(loadPendingRequests, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 rounded-xl p-4 h-32"></div>
          ))}
        </div>
      </div>
    )
  }

  if (pendingRequests.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">
          <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune demande en attente
          </h3>
          <p className="text-gray-600">
            Vous n'avez pas de demandes d'aide en attente d'approbation.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* En-tête avec bouton de rafraîchissement */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          Demandes en attente ({pendingRequests.length})
        </h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <div className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}>
            {refreshing ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </div>
          <span className="text-sm font-medium">
            {refreshing ? 'Actualisation...' : 'Actualiser'}
          </span>
        </button>
      </div>

      {/* Liste des demandes */}
      <div className="space-y-4">
        {pendingRequests.map((request) => (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
          >
            {/* En-tête de la demande */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  Demande d'aide
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">
                  Demande reçue {formatTimeAgo(request.requested_at)}
                </div>
                <div className="text-sm font-medium text-gray-900">
                  Expire dans: {formatTimeRemaining(request.expires_at)}
                </div>
              </div>
            </div>

            {/* Informations de la tâche */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                {request.task.title}
              </h3>
              {request.task.description && (
                <p className="text-gray-600 text-sm mb-3">
                  {request.task.description}
                </p>
              )}
              
              {/* Détails de la tâche */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Euro className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-600">
                    {request.task.budget} {request.task.currency}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    {request.task.address || 'Localisation non précisée'}
                  </span>
                </div>
              </div>
            </div>

            {/* Informations sur l'aide */}
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-blue-900">
                    {request.helper_profile?.name || 'Utilisateur anonyme'}
                  </div>
                  <div className="text-sm text-blue-700">
                    Souhaite vous aider
                  </div>
                  {request.notes && (
                    <div className="text-sm text-blue-600 mt-1">
                      "{request.notes}"
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              {/* Bouton Approuver */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleApprove(request.task_id)}
                disabled={actionLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center space-x-2"
              >
                {actionLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>Approuver</span>
              </motion.button>

              {/* Bouton Rejeter */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleReject(request.task_id)}
                disabled={actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-4 py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center space-x-2"
              >
                {actionLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span>Rejeter</span>
              </motion.button>
            </div>

            {/* Section de prolongation */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">Prolonger de:</span>
                <select
                  value={selectedExtension}
                  onChange={(e) => setSelectedExtension(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                </select>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleExtend(request.task_id)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-300 text-white rounded-lg font-medium text-sm transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Prolonger</span>
                </motion.button>
              </div>
            </div>

            {/* Bouton de chat */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-3 rounded-xl transition-colors flex items-center justify-center space-x-2">
                <MessageCircle className="w-4 h-4" />
                <span>Ouvrir le chat avec l'aide</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Affichage des erreurs */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}
