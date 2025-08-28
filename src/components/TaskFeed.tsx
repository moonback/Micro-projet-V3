import React, { useState, useEffect, useRef } from 'react'
import { MapPin, List, Filter, RefreshCw, Search, Grid3X3, Zap, Clock, Star, TrendingUp, ChevronRight, X, Tag, SlidersHorizontal } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import TaskCard from './TaskCard'
import TaskMap from './TaskMap'
import TaskFilters, { TaskFilters as TaskFiltersType } from './TaskFilters'
import Header from './Header'
import type { TaskWithProfiles } from '../types/task'

interface TaskFeedProps {
  onTaskPress: (task: TaskWithProfiles) => void
  onTaskAccepted?: (taskId: string) => void
}

// Cache global pour les tâches
let tasksCache: TaskWithProfiles[] = []
let lastFetchTime = 0
const CACHE_DURATION = 3 * 60 * 1000 // 3 minutes

const categories = [
  { name: 'Livraison', icon: '🚚', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { name: 'Transport', icon: '📦', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { name: 'Animaux', icon: '🐕', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { name: 'Ménage', icon: '🧹', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { name: 'Jardinage', icon: '🌱', color: 'bg-green-50 text-green-700 border-green-200' }
]

// Composant Modal pour les catégories - Design compact
const CategoryModal = ({ isOpen, onClose, onSelect, selectedCategory }: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSelect: (category: string) => void, 
  selectedCategory: string 
}) => {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl border border-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Catégories</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2.5">
            {categories.map((category) => (
              <motion.button
                key={category.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onSelect(category.name)
                  onClose()
                }}
                className={`${category.color} p-3 rounded-2xl text-xs font-medium flex flex-col items-center gap-1.5 border transition-all ${
                  selectedCategory === category.name 
                    ? 'ring-2 ring-blue-500 ring-offset-1 shadow-lg scale-105' 
                    : 'hover:shadow-md'
                }`}
              >
                <span className="text-xl">{category.icon}</span>
                <span>{category.name}</span>
              </motion.button>
            ))}
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={() => {
                onSelect('')
                onClose()
              }}
              className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-2xl font-medium transition-colors text-sm"
            >
              Voir toutes
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Composant Modal pour les filtres - Design compact
const FiltersModal = ({ isOpen, onClose, filters, onFiltersChange, onReset }: {
  isOpen: boolean
  onClose: () => void
  filters: TaskFiltersType
  onFiltersChange: (filters: TaskFiltersType) => void
  onReset: () => void
}) => {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="bg-white rounded-3xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          
          <TaskFilters
            filters={filters}
            onFiltersChange={onFiltersChange}
            onReset={() => {
              onReset()
              onClose()
            }}
          />
          
          <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-2xl font-medium transition-colors text-sm"
            >
              Fermer
            </button>
            <button
              onClick={() => {
                onReset()
                onClose()
              }}
              className="flex-1 py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 rounded-2xl font-medium transition-colors text-sm"
            >
              Reset
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function TaskFeed({ onTaskPress, onTaskAccepted }: TaskFeedProps) {
  const [tasks, setTasks] = useState<TaskWithProfiles[]>([])
  const [filteredTasks, setFilteredTasks] = useState<TaskWithProfiles[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<TaskFiltersType>({
    search: '',
    category: '',
    priority: '',
    budgetMin: '',
    budgetMax: '',
    location: '',
    tags: [],
    isUrgent: false,
    isFeatured: false,
    status: 'open',
    sortBy: 'created_at'
  })
  
  // États pour les modales
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false)
  
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
              const newTask = payload.new as TaskWithProfiles
              tasksCache = [newTask, ...tasksCache]
              if (mountedRef.current) {
                setTasks(tasksCache)
              }
            } else if (payload.eventType === 'DELETE') {
              const deletedTask = payload.old as TaskWithProfiles
              tasksCache = tasksCache.filter(task => task.id !== deletedTask.id)
              if (mountedRef.current) {
                setTasks(tasksCache)
              }
            } else if (payload.eventType === 'UPDATE') {
              const updatedTask = payload.new as TaskWithProfiles
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

    // Priority filter
    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority)
    }

    // Budget filters
    if (filters.budgetMin) {
      const minBudget = parseFloat(filters.budgetMin)
      if (!isNaN(minBudget)) {
        filtered = filtered.filter(task => task.budget >= minBudget)
      }
    }
    if (filters.budgetMax) {
      const maxBudget = parseFloat(filters.budgetMax)
      if (!isNaN(maxBudget)) {
        filtered = filtered.filter(task => task.budget <= maxBudget)
      }
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(task => 
        task.city?.toLowerCase().includes(filters.location.toLowerCase()) ||
        task.postal_code?.includes(filters.location) ||
        task.country?.toLowerCase().includes(filters.location.toLowerCase())
      )
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(task => 
        task.tags && filters.tags.some(tag => task.tags!.includes(tag))
      )
    }

    // Urgent filter
    if (filters.isUrgent) {
      filtered = filtered.filter(task => task.is_urgent === true)
    }

    // Featured filter
    if (filters.isFeatured) {
      filtered = filtered.filter(task => task.is_featured === true)
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status)
    }

    // Sort tasks
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'budget':
          filtered.sort((a, b) => a.budget - b.budget)
          break
        case 'budget_desc':
          filtered.sort((a, b) => b.budget - a.budget)
          break
        case 'deadline':
          filtered.sort((a, b) => {
            if (!a.deadline || !b.deadline) return 0
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
          })
          break
        case 'priority':
          const priorityOrder: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 }
          filtered.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0))
          break
        case 'created_at':
        default:
          filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          break
      }
    }

    setFilteredTasks(filtered)
  }

  const handleFiltersChange = (newFilters: TaskFiltersType) => {
    setFilters(newFilters)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }

  const handleCategorySelect = (category: string) => {
    if (filters.category === category) {
      setFilters(prev => ({ ...prev, category: '' }))
    } else {
      setFilters(prev => ({ ...prev, category }))
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setFilters({
      search: '',
      category: '',
      priority: '',
      budgetMin: '',
      budgetMax: '',
      location: '',
      tags: [],
      isUrgent: false,
      isFeatured: false,
      status: 'open',
      sortBy: 'created_at'
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full"
        />
        <p className="text-gray-500 font-medium text-sm">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header compact et moderne */}
      <Header
        title="MicroTask"
        subtitle="Trouvez votre prochaine opportunité"
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onFiltersOpen={() => setIsFiltersModalOpen(true)}
        onCategoriesOpen={() => setIsCategoryModalOpen(true)}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        viewMode={viewMode}
        onViewToggle={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
        filters={filters}
      />



      {/* Contenu avec animations fluides */}
      <AnimatePresence mode="wait">
        {viewMode === 'map' ? (
          <motion.div
            key="map"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex-1"
          >
            <TaskMap tasks={filteredTasks} onTaskPress={onTaskPress} />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex-1 overflow-y-auto"
          >
            {filteredTasks.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full text-center p-6"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucune tâche trouvée
                </h3>
                <p className="text-gray-500 mb-4 max-w-xs text-sm">
                  Aucune tâche ne correspond à vos critères. Essayez d'ajuster vos filtres.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={clearFilters}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-2.5 rounded-2xl font-medium shadow-lg text-sm"
                >
                  Voir toutes
                </motion.button>
              </motion.div>
            ) : (
              <div className="p-3 space-y-3">
                {/* En-tête compact */}
                <div className="flex items-center justify-between mb-1 px-1">
                  <h2 className="text-base font-semibold text-gray-900">
                    {filteredTasks.length} tâche{filteredTasks.length > 1 ? 's' : ''}
                  </h2>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <span>Disponible{filteredTasks.length > 1 ? 's' : ''}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
                
                {/* Liste des tâches avec animations optimisées */}
                <AnimatePresence>
                  {filteredTasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ 
                        delay: Math.min(index * 0.05, 0.3), 
                        duration: 0.2,
                        ease: "easeOut"
                      }}
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
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modales */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSelect={handleCategorySelect}
        selectedCategory={filters.category}
      />
      
      <FiltersModal
        isOpen={isFiltersModalOpen}
        onClose={() => setIsFiltersModalOpen(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={clearFilters}
      />
    </div>
  )
}