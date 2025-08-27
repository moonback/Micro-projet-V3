import React, { useState, useEffect, useRef } from 'react'
import { MapPin, List, Filter, RefreshCw, Search, Grid3X3, Zap, Clock, Star, TrendingUp, ChevronRight, X, Tag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import TaskCard from './TaskCard'
import TaskMap from './TaskMap'
import TaskFilters, { TaskFilters as TaskFiltersType } from './TaskFilters'
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
  { name: 'Livraison', icon: '🚚', color: 'bg-blue-100 text-blue-700' },
  { name: 'Transport', icon: '📦', color: 'bg-green-100 text-green-700' },
  { name: 'Animaux', icon: '🐕', color: 'bg-purple-100 text-purple-700' },
  { name: 'Ménage', icon: '🧹', color: 'bg-yellow-100 text-yellow-700' },
  { name: 'Jardinage', icon: '🌱', color: 'bg-emerald-100 text-emerald-700' }
]

// Composant Modal pour les catégories
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
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl p-6 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Catégories populaires</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <motion.button
                key={category.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onSelect(category.name)
                  onClose()
                }}
                className={`${category.color} p-4 rounded-xl text-sm font-medium flex flex-col items-center gap-2 ${
                  selectedCategory === category.name ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                }`}
              >
                <span className="text-2xl">{category.icon}</span>
                <span>{category.name}</span>
              </motion.button>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                onSelect('')
                onClose()
              }}
              className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
            >
              Voir toutes les catégories
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Composant Modal pour les filtres
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
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Filtres avancés</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
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
          
          <div className="mt-6 pt-4 border-t border-gray-200 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={() => {
                onReset()
                onClose()
              }}
              className="flex-1 py-3 px-4 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-medium transition-colors"
            >
              Réinitialiser
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
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
        />
        <p className="text-gray-500 font-medium">Chargement des tâches...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header avec gradient moderne */}
      {/* Header avec design moderne et futuriste */}
<div className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 text-white overflow-hidden">
  {/* Éléments décoratifs d'arrière-plan */}
  <div className="absolute inset-0">
    <div className="absolute top-0 left-1/4 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
  </div>
  
  <div className="relative z-10 p-6 pb-8">
    <div className="flex items-center justify-between mb-8">
      <div>
        <motion.div 
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center space-x-3 mb-2"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-xl">
            <span className="text-lg">🚀</span>
          </div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">
            Bonjour !
          </h1>
        </motion.div>
        <motion.p 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-cyan-200/80 text-sm font-medium ml-13"
        >
          Découvrez des opportunités extraordinaires près de chez vous
        </motion.p>
      </div>
      
      <div className="flex items-center space-x-3">
        <motion.button
          whileHover={{ scale: 1.05, rotate: 180 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          disabled={refreshing}
          className="group p-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
        >
          <RefreshCw className={`w-5 h-5 text-cyan-200 group-hover:text-white transition-colors ${refreshing ? 'animate-spin' : ''}`} />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
          className="group p-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
        >
          {viewMode === 'list' ? 
            <MapPin className="w-5 h-5 text-purple-200 group-hover:text-white transition-colors" /> : 
            <List className="w-5 h-5 text-purple-200 group-hover:text-white transition-colors" />
          }
        </motion.button>
      </div>
    </div>

    {/* Barre de recherche futuriste */}
    <motion.div 
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
      className="relative group"
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/50 to-purple-500/50 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full ml-2 shadow-lg">
            <Search className="w-6 h-6 text-white" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Que souhaitez-vous accomplir aujourd'hui ?"
            className="flex-1 px-6 py-4 bg-transparent border-0 text-white placeholder-cyan-200/60 text-lg font-medium focus:outline-none focus:ring-0"
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="mr-2 p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.div>

    {/* Indicateurs de tendance */}
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="flex items-center justify-center space-x-6 mt-6"
    >
      <div className="flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-xs text-cyan-200 font-medium">156 nouvelles tâches</span>
      </div>
      <div className="flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20">
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
        <span className="text-xs text-cyan-200 font-medium">Demande élevée</span>
      </div>
    </motion.div>
  </div>
</div>

      {/* Boutons d'action pour les modales */}
      <div className="px-4 py-4 flex gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsCategoryModalOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
        >
          <Tag className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-gray-700">
            {filters.category || 'Catégories'}
          </span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsFiltersModalOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
        >
          <Filter className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-gray-700">Filtres</span>
          {(filters.priority || filters.budgetMin || filters.budgetMax || filters.location || filters.tags.length > 0 || filters.isUrgent || filters.isFeatured || filters.status || filters.sortBy !== 'created_at') && (
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          )}
        </motion.button>
      </div>

      {/* Badge de filtre actif */}
      {(filters.category || searchQuery || filters.priority || filters.budgetMin || filters.budgetMax || filters.location || filters.tags.length > 0 || filters.isUrgent || filters.isFeatured || filters.status || filters.sortBy !== 'created_at') && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="px-4 pb-2"
        >
          <div className="flex items-center justify-between bg-blue-50 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <span className="text-blue-700 font-medium text-sm">
                Filtres actifs: {filters.category && `${filters.category}`} {searchQuery && `"${searchQuery}"`} {filters.priority && `${filters.priority}`} {filters.budgetMin && `≥${filters.budgetMin}€`} {filters.budgetMax && `≤${filters.budgetMax}€`} {filters.location && `${filters.location}`} {filters.tags.length > 0 && `${filters.tags.length} tag(s)`} {filters.isUrgent && 'Urgent'} {filters.isFeatured && 'Mis en avant'} {filters.status && `${filters.status}`} {filters.sortBy !== 'created_at' && `${filters.sortBy}`}
              </span>
            </div>
            <button
              onClick={clearFilters}
              className="text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors"
            >
              Effacer
            </button>
          </div>
        </motion.div>
      )}

      {/* Contenu avec animations */}
      <AnimatePresence mode="wait">
        {viewMode === 'map' ? (
          <motion.div
            key="map"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            <TaskMap tasks={filteredTasks} onTaskPress={onTaskPress} />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
            className="flex-1 overflow-y-auto"
          >
            {filteredTasks.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full text-center p-8"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Aucune tâche trouvée
                </h3>
                <p className="text-gray-500 mb-6 max-w-sm">
                  Aucune tâche ne correspond à vos critères de recherche. Essayez d'ajuster vos filtres.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearFilters}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-3 rounded-2xl font-medium shadow-lg"
                >
                  Voir toutes les tâches
                </motion.button>
              </motion.div>
            ) : (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-gray-900">
                    {filteredTasks.length} tâche{filteredTasks.length > 1 ? 's' : ''} disponible{filteredTasks.length > 1 ? 's' : ''}
                  </h2>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                
                <AnimatePresence>
                  {filteredTasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
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