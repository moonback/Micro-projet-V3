import React, { useState, useEffect, useRef } from 'react'
import { MapPin, List, Filter, RefreshCw } from 'lucide-react'
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

// Cache global pour les tâches
let tasksCache: Task[] = []
let lastFetchTime = 0
const CACHE_DURATION = 3 * 60 * 1000 // 3 minutes

export default function TaskFeed({ onTaskPress }: TaskFeedProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<TaskFiltersType>({
    category: '',
    maxBudget: null,
    minBudget: null,
    radius: 5,
    status: 'open'
  })
  const mountedRef = useRef(true)

  // Vérifier si le cache est valide
  const isCacheValid = () => {
    return Date.now() - lastFetchTime < CACHE_DURATION && tasksCache.length > 0
  }

  const loadTasks = async (forceRefresh = false) => {
    // Utiliser le cache si valide et pas de refresh forcé
    if (!forceRefresh && isCacheValid()) {
      console.log('Using cached tasks:', tasksCache.length)
      if (mountedRef.current) {
        setTasks(tasksCache)
        setLoading(false)
      }
      return
    }

    try {
      if (mountedRef.current) {
        setLoading(true)
      }
      
      console.log('Fetching tasks from database...')
      
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
      
      const fetchedTasks = data || []
      console.log('Fetched tasks:', fetchedTasks.length)
      
      // Mettre à jour le cache
      tasksCache = fetchedTasks
      lastFetchTime = Date.now()
      
      if (mountedRef.current) {
        setTasks(fetchedTasks)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error loading tasks:', error)
      // En cas d'erreur, essayer d'utiliser le cache même s'il est expiré
      if (tasksCache.length > 0 && mountedRef.current) {
        console.log('Using expired cache due to error')
        setTasks(tasksCache)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadTasks(true)
    setRefreshing(false)
  }

  useEffect(() => {
    mountedRef.current = true
    loadTasks()

    // Synchronisation en temps réel pour les tâches
    const tasksChannel = supabase
      .channel('tasks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('Task changed:', payload.eventType, payload.new)
          
          // Recharger les tâches si le cache est expiré
          if (!isCacheValid()) {
            console.log('Cache expired, reloading tasks...')
            loadTasks()
          } else {
            // Mettre à jour le cache localement si possible
            if (payload.eventType === 'INSERT') {
              const newTask = payload.new as Task
              tasksCache = [newTask, ...tasksCache]
              if (mountedRef.current) {
                setTasks(tasksCache)
              }
            } else if (payload.eventType === 'DELETE') {
              const deletedTask = payload.old as Task
              tasksCache = tasksCache.filter(task => task.id !== deletedTask.id)
              if (mountedRef.current) {
                setTasks(tasksCache)
              }
            } else if (payload.eventType === 'UPDATE') {
              const updatedTask = payload.new as Task
              const index = tasksCache.findIndex(task => task.id === updatedTask.id)
              if (index !== -1) {
                tasksCache[index] = updatedTask
                if (mountedRef.current) {
                  setTasks([...tasksCache])
                }
              }
            }
          }
        }
      )
      .subscribe()

    return () => {
      mountedRef.current = false
      supabase.removeChannel(tasksChannel)
    }
  }, [])

  // Écouter les changements de visibilité de la page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isCacheValid()) {
        console.log('Page became visible, refreshing tasks...')
        loadTasks()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    applyFilters()
  }, [tasks, searchQuery, filters])

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
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
            title="Actualiser les tâches"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
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