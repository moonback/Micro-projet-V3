import React, { useState, useEffect } from 'react'
import { MapPin, List, Filter } from 'lucide-react'
import { supabase } from '../lib/supabase'
import TaskCard from './TaskCard'
import TaskMap from './TaskMap'
import TaskFilters, { TaskFilters as TaskFiltersType } from './TaskFilters'
import type { Database } from '../lib/supabase'

type Task = Database['public']['Tables']['tasks']['Row'] & {
  author_profile?: Database['public']['Tables']['profiles']['Row']
}

interface TaskFeedProps {
  onTaskPress: (task: Task) => void
}

export default function TaskFeed({ onTaskPress }: TaskFeedProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<TaskFiltersType>({
    category: '',
    maxBudget: null,
    minBudget: null,
    radius: 5,
    status: 'open'
  })

  useEffect(() => {
    loadTasks()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [tasks, searchQuery, filters])

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
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
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...tasks]

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(task => task.category === filters.category)
    }

    // Budget filters
    if (filters.minBudget !== null) {
      filtered = filtered.filter(task => task.budget >= filters.minBudget!)
    }
    if (filters.maxBudget !== null) {
      filtered = filtered.filter(task => task.budget <= filters.maxBudget!)
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status)
    }

    setFilteredTasks(filtered)
  }

  const handleFiltersChange = (newFilters: TaskFiltersType) => {
    setFilters(newFilters)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Tâches Disponibles</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {viewMode === 'list' ? <MapPin className="w-5 h-5" /> : <List className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Filters */}
      <TaskFilters
        onFiltersChange={handleFiltersChange}
        onSearchChange={handleSearchChange}
        searchQuery={searchQuery}
        filters={filters}
      />

      {/* Content */}
      {viewMode === 'map' ? (
        <TaskMap tasks={filteredTasks} onTaskPress={onTaskPress} />
      ) : (
        <div className="flex-1 overflow-y-auto">
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <MapPin className="w-12 h-12 mb-2" />
              <p>
                {searchQuery || Object.values(filters).some(f => f !== '' && f !== null && f !== 5)
                  ? 'Aucune tâche ne correspond à vos critères'
                  : 'Aucune tâche disponible dans votre région'
                }
              </p>
              {searchQuery || Object.values(filters).some(f => f !== '' && f !== null && f !== 5) && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFilters({
                      category: '',
                      maxBudget: null,
                      minBudget: null,
                      radius: 5,
                      status: 'open'
                    })
                  }}
                  className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Effacer les filtres
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onPress={onTaskPress}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}