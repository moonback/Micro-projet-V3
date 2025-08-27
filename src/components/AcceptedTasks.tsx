import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Play, X, Clock, Euro, User, MapPin, AlertCircle, Info } from 'lucide-react'
import { useTaskActions } from '../hooks/useTaskActions'
import { useAuth } from '../hooks/useAuth'
import type { Database } from '../lib/supabase'

type Task = Database['public']['Tables']['tasks']['Row'] & {
  author_profile?: Database['public']['Tables']['profiles']['Row']
  helper_profile?: Database['public']['Tables']['profiles']['Row']
}

type TaskAcceptance = Database['public']['Tables']['task_acceptances']['Row'] & {
  task: Task
}

export default function AcceptedTasks() {
  const { user } = useAuth()
  const { 
    getAcceptedTasks, 
    getAcceptanceHistory, 
    startTask, 
    completeTask, 
    cancelTask,
    loading,
    error,
    clearError
  } = useTaskActions()
  
  const [acceptedTasks, setAcceptedTasks] = useState<Task[]>([])
  const [acceptanceHistory, setAcceptanceHistory] = useState<TaskAcceptance[]>([])
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    setRefreshing(true)
    try {
      const [tasks, history] = await Promise.all([
        getAcceptedTasks(),
        getAcceptanceHistory()
      ])
      setAcceptedTasks(tasks)
      setAcceptanceHistory(history)
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err)
    } finally {
      setRefreshing(false)
    }
  }

  const handleStartTask = async (taskId: string) => {
    const success = await startTask(taskId)
    if (success) {
      await loadData() // Recharger les données
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    const success = await completeTask(taskId)
    if (success) {
      await loadData() // Recharger les données
    }
  }

  const handleCancelTask = async (taskId: string) => {
    const success = await cancelTask(taskId)
    if (success) {
      await loadData() // Recharger les données
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

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'À l\'instant'
    if (diffInHours < 24) return `Il y a ${diffInHours}h`
    return `Il y a ${Math.floor(diffInHours / 24)}j`
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Vous devez être connecté pour voir vos tâches acceptées</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mes Tâches Acceptées</h1>
            <p className="text-gray-600">Gérez les tâches que vous avez acceptées</p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadData}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Clock className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </motion.button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex space-x-8 px-4">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'active'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Tâches Actives ({acceptedTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Historique ({acceptanceHistory.length})
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'active' ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {acceptedTasks.length === 0 ? (
                <div className="text-center py-12">
                  <Info className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucune tâche active
                  </h3>
                  <p className="text-gray-600">
                    Vous n'avez pas encore accepté de tâches ou toutes vos tâches sont terminées.
                  </p>
                </div>
              ) : (
                acceptedTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-gray-600 mb-3">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Euro className="w-4 h-4 text-green-600" />
                            <span className="font-semibold">€{task.budget}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-blue-600" />
                            <span>{task.author_profile?.name || 'Anonyme'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-600" />
                            <span>{task.address || 'Localisation'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-600" />
                            <span>{formatTimeAgo(task.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </span>
                    </div>

                    {/* Actions selon le statut */}
                    <div className="flex items-center space-x-3">
                      {task.status === 'accepted' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleStartTask(task.id)}
                          disabled={loading}
                          className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                          <Play className="w-4 h-4" />
                          <span>Démarrer</span>
                        </motion.button>
                      )}

                      {task.status === 'in-progress' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleCompleteTask(task.id)}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Terminer</span>
                        </motion.button>
                      )}

                      {['accepted', 'in-progress'].includes(task.status) && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleCancelTask(task.id)}
                          disabled={loading}
                          className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                          <X className="w-4 h-4" />
                          <span>Annuler</span>
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {acceptanceHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Info className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun historique
                  </h3>
                  <p className="text-gray-600">
                    Vous n'avez pas encore d'historique d'acceptation de tâches.
                  </p>
                </div>
              ) : (
                acceptanceHistory.map((acceptance) => (
                  <motion.div
                    key={acceptance.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {acceptance.task.title}
                        </h3>
                        {acceptance.task.description && (
                          <p className="text-gray-600 mb-3">
                            {acceptance.task.description}
                          </p>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div className="flex items-center space-x-2">
                            <Euro className="w-4 h-4 text-green-600" />
                            <span className="font-semibold">€{acceptance.task.budget}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-blue-600" />
                            <span>{acceptance.task.author_profile?.name || 'Anonyme'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-600" />
                            <span>Acceptée {formatTimeAgo(acceptance.accepted_at)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-gray-600" />
                            <span className="capitalize">{acceptance.status}</span>
                          </div>
                        </div>

                        {acceptance.notes && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Notes :</span> {acceptance.notes}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(acceptance.task.status)}`}>
                        {getStatusLabel(acceptance.task.status)}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
