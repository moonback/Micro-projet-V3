import React, { useState, useEffect } from 'react'
import { Plus, Filter } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import TaskCard from './TaskCard'
import type { Database } from '../lib/supabase'

type Task = Database['public']['Tables']['tasks']['Row'] & {
  profiles?: Database['public']['Tables']['profiles']['Row']
}

interface MyTasksProps {
  onTaskPress: (task: Task) => void
  onCreateTask: () => void
}

export default function MyTasks({ onTaskPress, onCreateTask }: MyTasksProps) {
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
          profiles (
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Mes Tâches</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={onCreateTask}
              className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setActiveTab('created')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'created'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Créées ({tasks.filter(t => t.author === user?.id).length})
          </button>
          <button
            onClick={() => setActiveTab('accepted')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'accepted'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Acceptées ({tasks.filter(t => t.helper === user?.id).length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Plus className="w-12 h-12 mb-2" />
            <p>
              {activeTab === 'created' 
                ? 'Vous n\'avez pas encore créé de tâches' 
                : 'Vous n\'avez pas encore accepté de tâches'}
            </p>
            {activeTab === 'created' && (
              <button
                onClick={onCreateTask}
                className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Créez votre première tâche
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {['open', 'accepted', 'in-progress', 'completed'].map(status => {
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

              return (
                <div key={status}>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {getStatusLabel(status)} ({statusTasks.length})
                  </h3>
                  <div className="space-y-3">
                    {statusTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onPress={onTaskPress}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}