import React, { useState, useEffect, useRef } from 'react'
import { MapPin, List, ChevronRight, Filter, X, Menu, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import TaskCard from './TaskCard'
import TaskMap from './TaskMap'
import Header from './Header'
import type { TaskWithProfiles } from '../types/task'
import { useAuth } from '../hooks/useAuth'

// Type simple pour les filtres
interface TaskFilters {
  search: string
  category: string
  priority: string
  budgetMin: string
  budgetMax: string
  location: string
  tags: string[]
  isUrgent: boolean
  isFeatured: boolean
  status: string
  sortBy: string
}

interface TaskFeedProps {
  onTaskPress: (task: TaskWithProfiles) => void
  onTaskAccepted?: (taskId: string) => void
  onApplyToTask?: (task: TaskWithProfiles) => void
}

// Cache global pour les tâches
let tasksCache: TaskWithProfiles[] = []
let lastFetchTime = 0
const CACHE_DURATION = 3 * 60 * 1000 // 3 minutes







export default function TaskFeed({ onTaskPress, onTaskAccepted, onApplyToTask }: TaskFeedProps) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<TaskWithProfiles[]>([])
  const [filteredTasks, setFilteredTasks] = useState<TaskWithProfiles[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [filters, setFilters] = useState<TaskFilters>({
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

  // État pour la navigation latérale desktop
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Détecter la taille de l'écran
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileView = window.innerWidth < 1024
      setIsMobile(isMobileView)
      // Sur desktop, on n'a plus de sidebar, donc on la ferme toujours
      if (!isMobileView) {
        setIsSidebarOpen(false)
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])
  

  
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
  }, [tasks, filters])

  const applyFilters = () => {
    let filtered = [...tasks]

    // Search filter
    if (filters.search.trim()) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        task.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
        task.category?.toLowerCase().includes(filters.search.toLowerCase())
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

  const handleFiltersChange = (newFilters: TaskFilters) => {
    setFilters(newFilters)
  }

  const handleSearchChange = (query: string) => {
    setFilters(prev => ({ ...prev, search: query }))
  }



  const clearFilters = () => {
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
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header avec toutes les fonctionnalités */}
      <Header
        searchQuery={filters.search}
        onSearchChange={handleSearchChange}
        onFiltersOpen={() => {
          // Les modales sont maintenant gérées directement dans le Header
        }}
        onCategoriesOpen={() => {
          // Les modales sont maintenant gérées directement dans le Header
        }}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        viewMode={viewMode}
        onViewToggle={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
        filters={filters}
        showSearch={true}
        showFilters={true}
        showViewToggle={true}
        showRefresh={true}
        // Bouton pour la sidebar desktop
        rightButtons={[
          {
            icon: isSidebarOpen ? X : Menu,
            onClick: () => setIsSidebarOpen(!isSidebarOpen),
            tooltip: isSidebarOpen ? 'Masquer la barre latérale' : 'Afficher la barre latérale',
            className: 'lg:hidden' // Seulement visible sur mobile
          }
        ]}
      />

      {/* Layout principal avec sidebar et contenu */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar mobile - Overlay */}
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar mobile - Panel */}
        {isMobile && (
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: isSidebarOpen ? 0 : -320 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed left-0 top-0 h-full w-80 bg-white border-r border-gray-200 shadow-xl z-50 lg:hidden overflow-y-auto"
          >
            <div className="p-6 space-y-6">
              {/* En-tête de la sidebar mobile */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Filtres avancés mobile */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Filter className="w-5 h-5 mr-2 text-blue-600" />
                  Filtres Avancés
                </h3>
                
                {/* Catégorie */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Toutes les catégories</option>
                    <option value="Livraison">Livraison</option>
                    <option value="Nettoyage">Nettoyage</option>
                    <option value="Courses">Courses</option>
                    <option value="Déménagement">Déménagement</option>
                    <option value="Montage">Montage</option>
                    <option value="Garde d'Animaux">Garde d'Animaux</option>
                    <option value="Jardinage">Jardinage</option>
                    <option value="Aide Informatique">Aide Informatique</option>
                    <option value="Cours Particuliers">Cours Particuliers</option>
                  </select>
                </div>

                {/* Priorité */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Toutes les priorités</option>
                    <option value="urgent">Urgente</option>
                    <option value="high">Élevée</option>
                    <option value="medium">Moyenne</option>
                    <option value="low">Faible</option>
                  </select>
                </div>

                {/* Budget */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min €"
                      value={filters.budgetMin}
                      onChange={(e) => setFilters({ ...filters, budgetMin: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Max €"
                      value={filters.budgetMax}
                      onChange={(e) => setFilters({ ...filters, budgetMax: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Options spéciales */}
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={filters.isUrgent}
                      onChange={(e) => setFilters({ ...filters, isUrgent: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Tâches urgentes uniquement</span>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={filters.isFeatured}
                      onChange={(e) => setFilters({ ...filters, isFeatured: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Tâches mises en avant</span>
                  </label>
                </div>

                {/* Tri */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trier par</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="created_at">Date de création</option>
                    <option value="budget">Budget croissant</option>
                    <option value="budget_desc">Budget décroissant</option>
                    <option value="deadline">Échéance</option>
                    <option value="priority">Priorité</option>
                  </select>
                </div>

                {/* Boutons d'action */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      applyFilters()
                      setIsSidebarOpen(false) // Fermer la sidebar après application
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all"
                  >
                    Appliquer les Filtres
                  </button>
                  <button
                    onClick={() => {
                      clearFilters()
                      setIsSidebarOpen(false) // Fermer la sidebar après reset
                    }}
                    className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-xl font-medium hover:bg-gray-200 transition-all"
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>

              {/* Statistiques rapides */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-blue-700">{filteredTasks.length}</div>
                    <div className="text-xs text-blue-600">Tâches trouvées</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-green-700">
                      {filteredTasks.filter(t => t.status === 'open').length}
                    </div>
                    <div className="text-xs text-green-600">Disponibles</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}

        {/* Sidebar desktop */}
        {!isMobile && (
          <motion.aside
            initial={{ width: isSidebarOpen ? 320 : 0 }}
            animate={{ width: isSidebarOpen ? 320 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-white border-r border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="p-6 space-y-6">
              {/* Filtres avancés desktop */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Filter className="w-5 h-5 mr-2 text-blue-600" />
                  Filtres Avancés
                </h3>
                
                {/* Catégorie */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Toutes les catégories</option>
                    <option value="Livraison">Livraison</option>
                    <option value="Nettoyage">Nettoyage</option>
                    <option value="Courses">Courses</option>
                    <option value="Déménagement">Déménagement</option>
                    <option value="Montage">Montage</option>
                    <option value="Garde d'Animaux">Garde d'Animaux</option>
                    <option value="Jardinage">Jardinage</option>
                    <option value="Aide Informatique">Aide Informatique</option>
                    <option value="Cours Particuliers">Cours Particuliers</option>
                  </select>
                </div>

                {/* Priorité */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Toutes les priorités</option>
                    <option value="urgent">Urgente</option>
                    <option value="high">Élevée</option>
                    <option value="medium">Moyenne</option>
                    <option value="low">Faible</option>
                  </select>
                </div>

                {/* Budget */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min €"
                      value={filters.budgetMin}
                      onChange={(e) => setFilters({ ...filters, budgetMin: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Max €"
                      value={filters.budgetMax}
                      onChange={(e) => setFilters({ ...filters, budgetMax: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Options spéciales */}
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={filters.isUrgent}
                      onChange={(e) => setFilters({ ...filters, isUrgent: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Tâches urgentes uniquement</span>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={filters.isFeatured}
                      onChange={(e) => setFilters({ ...filters, isFeatured: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Tâches mises en avant</span>
                  </label>
                </div>

                {/* Tri */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trier par</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="created_at">Date de création</option>
                    <option value="budget">Budget croissant</option>
                    <option value="budget_desc">Budget décroissant</option>
                    <option value="deadline">Échéance</option>
                    <option value="priority">Priorité</option>
                  </select>
                </div>

                {/* Boutons d'action */}
                <div className="space-y-2">
                  <button
                    onClick={applyFilters}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all"
                  >
                    Appliquer les Filtres
                  </button>
                  <button
                    onClick={clearFilters}
                    className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-xl font-medium hover:bg-gray-200 transition-all"
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>

              {/* Statistiques rapides */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-blue-700">{filteredTasks.length}</div>
                    <div className="text-xs text-blue-600">Tâches trouvées</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-green-700">
                      {filteredTasks.filter(t => t.status === 'open').length}
                    </div>
                    <div className="text-xs text-green-600">Disponibles</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}

        {/* Contenu principal */}
        <div className="flex-1 overflow-hidden">
          {/* Contenu avec animations fluides */}
          <AnimatePresence mode="wait">
            {viewMode === 'map' ? (
              <motion.div
                key="map"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex-1 h-full"
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
                className="flex-1 overflow-y-auto p-4 lg:p-6"
              >
                {/* Grille desktop vs liste mobile - optimisée pour 4 cartes par ligne */}
                <div className={`${
                  isMobile 
                    ? 'space-y-4' 
                    : 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4'
                }`}>
                  <AnimatePresence>
                    {filteredTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.5 }}
                        whileHover={{ y: -2 }}
                        className={isMobile ? '' : 'h-full'}
                      >
                        <TaskCard
                          task={task}
                          onPress={onTaskPress}
                          onTaskAccepted={onTaskAccepted}
                          onApplyToTask={onApplyToTask}
                          isDesktop={!isMobile}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* État vide */}
                {filteredTasks.length === 0 && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16"
                  >
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Search className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Aucune tâche trouvée
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Essayez de modifier vos critères de recherche ou de rafraîchir la liste
                    </p>
                    <button
                      onClick={handleRefresh}
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                    >
                      Rafraîchir
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}