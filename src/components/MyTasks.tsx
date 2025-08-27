import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Clock, CheckCircle, XCircle, AlertTriangle, Star, Euro, MapPin, Calendar, Tag, Zap, TrendingUp, ChevronRight, ListTodo } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Database } from '../lib/supabase'
import Header from './Header'
import TaskCard from './TaskCard'

type Task = Database['public']['Tables']['tasks']['Row'] & {
  author_profile?: Database['public']['Tables']['profiles']['Row']
}

interface MyTasksProps {
  onTaskPress: (task: Task) => void
  onCreateTask: () => void
  onTaskAccepted?: (taskId: string) => void
}

export default function MyTasks({ onTaskPress, onCreateTask, onTaskAccepted }: MyTasksProps) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [activeTab, setActiveTab] = useState<'created' | 'accepted'>('created')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadTasks()
    }
  }, [user, activeTab])

  const loadTasks = async () => {
    if (!user) return

    setLoading(true)
    try {
      const query = supabase
        .from('tasks')
        .select(`
          *,
          author_profile:profiles!tasks_author_fkey (
            id,
            name,
            avatar_url,
            rating,
            rating_count
          )
        `)

      if (activeTab === 'created') {
        query.eq('author', user.id)
      } else {
        query.eq('helper', user.id)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTaskCount = (status: string) => {
    return tasks.filter(task => task.status === status).length
  }

  const getStatusStats = () => {
    const createdTasks = tasks.filter(t => t.author === user?.id)
    const acceptedTasks = tasks.filter(t => t.helper === user?.id)
    
    return {
      created: createdTasks.length,
      accepted: acceptedTasks.length,
      open: createdTasks.filter(t => t.status === 'open').length,
      completed: createdTasks.filter(t => t.status === 'completed').length + acceptedTasks.filter(t => t.status === 'completed').length
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
          />
          <p className="text-gray-500 font-medium">Chargement de vos tâches...</p>
        </motion.div>
      </div>
    )
  }

  const stats = getStatusStats()

  return (
    <div className="flex flex-col h-full bg-gray-50">
             <Header
         title="Mes Tâches"
         subtitle="Gérez vos tâches créées et acceptées"
         showSearch={false}
         showFilters={false}
         showViewToggle={false}
         showRefresh={false}
         rightButtons={[
           {
             icon: Plus,
             onClick: onCreateTask,
             tooltip: 'Créer une nouvelle tâche'
           }
         ]}
         showStats={true}
         stats={stats}
       />

      {/* Onglets modernes */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="p-4"
      >
        <div className="bg-white rounded-3xl p-2 shadow-lg border border-gray-100">
          <div className="flex rounded-2xl bg-gray-100 p-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('created')}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'created'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <ListTodo className="w-4 h-4" />
                <span>Créées ({stats.created})</span>
              </div>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('accepted')}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'accepted'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Acceptées ({stats.accepted})</span>
              </div>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Contenu des tâches */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <AnimatePresence mode="wait">
          {tasks.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center h-64 text-center"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                <ListTodo className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {activeTab === 'created' 
                  ? 'Aucune tâche créée' 
                  : 'Aucune tâche acceptée'}
              </h3>
              <p className="text-gray-500 mb-6 max-w-sm">
                {activeTab === 'created' 
                  ? 'Vous n\'avez pas encore créé de tâches. Commencez par en créer une !' 
                  : 'Vous n\'avez pas encore accepté de tâches. Parcourez les tâches disponibles !'}
              </p>
              {activeTab === 'created' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onCreateTask}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-3 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  Créer ma première tâche
                </motion.button>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="tasks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {['open', 'accepted', 'in-progress', 'completed'].map((status, statusIndex) => {
                const statusTasks = tasks.filter(task => task.status === status)
                if (statusTasks.length === 0) return null

                const getStatusLabel = (status: string) => {
                  switch (status) {
                    case 'open': return 'Ouvertes'
                    case 'accepted': return 'Acceptées'
                    case 'in-progress': return 'En Cours'
                    case 'completed': return 'Terminées'
                    default: return status
                  }
                }

                const getStatusIcon = (status: string) => {
                  switch (status) {
                    case 'open': return Clock
                    case 'accepted': return CheckCircle
                    case 'in-progress': return TrendingUp
                    case 'completed': return Star
                    default: return ListTodo
                  }
                }

                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'open': return 'from-blue-500 to-blue-600'
                    case 'accepted': return 'from-green-500 to-green-600'
                    case 'in-progress': return 'from-orange-500 to-orange-600'
                    case 'completed': return 'from-purple-500 to-purple-600'
                    default: return 'from-gray-500 to-gray-600'
                  }
                }

                const StatusIcon = getStatusIcon(status)

                return (
                  <motion.div 
                    key={status}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + statusIndex * 0.1, duration: 0.6 }}
                    className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`w-10 h-10 bg-gradient-to-br ${getStatusColor(status)} rounded-full flex items-center justify-center`}>
                        <StatusIcon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {getStatusLabel(status)} ({statusTasks.length})
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <AnimatePresence>
                        {statusTasks.map((task, taskIndex) => (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: taskIndex * 0.05, duration: 0.6 }}
                          >
                            <TaskCard
                              task={task}
                              onPress={onTaskPress}
                              onTaskAccepted={onTaskAccepted}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}