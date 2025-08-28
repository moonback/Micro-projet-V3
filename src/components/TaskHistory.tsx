import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  User, 
  CheckCircle, 
  XCircle, 
  Clock as ClockIcon,
  Filter,
  Search,
  RefreshCw,
  Eye,
  Star,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  BarChart3,
  History
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { TaskHistoryItem } from '../types/task'
import { useAuth } from '../hooks/useAuth'
import { useConfirmationModal } from './ConfirmationModal'

interface TaskHistoryProps {
  onTaskPress?: (task: TaskHistoryItem) => void
  showApplications?: boolean
  onBack?: () => void
  title?: string
}

export default function TaskHistory({ onTaskPress, showApplications = false, onBack, title = "Historique des Tâches" }: TaskHistoryProps) {
  const { user } = useAuth()
  const { showModal, ModalComponent } = useConfirmationModal()
  
  const [tasks, setTasks] = useState<TaskHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year' | 'all'>('month')
  const [sortBy, setSortBy] = useState<'date' | 'budget' | 'priority' | 'status'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskHistoryItem | null>(null)

  // Charger l'historique des tâches
  const loadTaskHistory = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('task_history')
        .select('*')

      // Filtrer par utilisateur (tâches créées ou aidées)
      query = query.or(`author.eq.${user.id},helper.eq.${user.id}`)

      // Appliquer les filtres
      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus)
      }
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory)
      }
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }
      if (dateRange !== 'all') {
        const now = new Date()
        let startDate = new Date()
        
        switch (dateRange) {
          case 'week':
            startDate.setDate(now.getDate() - 7)
            break
          case 'month':
            startDate.setMonth(now.getMonth() - 1)
            break
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1)
            break
        }
        
        query = query.gte('created_at', startDate.toISOString())
      }

      // Appliquer le tri
      let orderBy = 'created_at'
      switch (sortBy) {
        case 'budget':
          orderBy = 'budget'
          break
        case 'priority':
          orderBy = 'priority'
          break
        case 'status':
          orderBy = 'status'
          break
        default:
          orderBy = 'created_at'
      }

      let { data, error: queryError } = await query
        .order(orderBy, { ascending: sortOrder === 'asc' })

      if (queryError) throw queryError

      // Appliquer un tri personnalisé pour prioriser les tâches acceptées
      if (data) {
        data = data.sort((a, b) => {
          // Priorité 1: Tâches acceptées (assigned, in_progress, pending_approval)
          const aPriority = getStatusPriority(a.status)
          const bPriority = getStatusPriority(b.status)
          
          if (aPriority !== bPriority) {
            return aPriority - bPriority
          }
          
          // Si même priorité, trier par date de création (plus récent en premier)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
      }

      setTasks(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement de l\'historique')
      console.error('Error loading task history:', err)
    } finally {
      setLoading(false)
    }
  }

  // Charger au montage et quand les filtres changent
  useEffect(() => {
    loadTaskHistory()
  }, [user, selectedStatus, selectedCategory, dateRange, sortBy, sortOrder])

  // Recherche en temps réel
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadTaskHistory()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'assigned': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'in_progress': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Ouverte'
      case 'pending_approval': return 'En attente de validation'
      case 'assigned': return 'Assignée'
      case 'in_progress': return 'En cours'
      case 'completed': return 'Terminée'
      case 'cancelled': return 'Annulée'
      case 'expired': return 'Expirée'
      default: return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgente'
      case 'high': return 'Élevée'
      case 'medium': return 'Moyenne'
      case 'low': return 'Faible'
      default: return priority
    }
  }

  const getCategoryIcon = (category: string) => {
    const categoryIcons: Record<string, string> = {
      'Livraison': '🚚',
      'Nettoyage': '🧹',
      'Courses': '🛒',
      'Déménagement': '📦',
      'Montage': '🔧',
      'Garde d\'Animaux': '🐾',
      'Jardinage': '🌱',
      'Aide Informatique': '💻',
      'Cours Particuliers': '📚',
      'Autre': '✨'
    }
    return categoryIcons[category] || '🏷️'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (duration: string) => {
    if (!duration) return 'Non spécifiée'
    return duration
  }

  const getTaskStats = () => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'completed').length
    const inProgress = tasks.filter(t => ['assigned', 'in_progress', 'pending_approval'].includes(t.status)).length
    const cancelled = tasks.filter(t => ['cancelled', 'expired'].includes(t.status)).length
    const totalBudget = tasks.reduce((sum, t) => sum + (t.budget || 0), 0)
    const avgBudget = total > 0 ? totalBudget / total : 0

    return { total, completed, inProgress, cancelled, totalBudget, avgBudget }
  }

  const stats = getTaskStats()

  // Fonction pour déterminer la priorité des statuts
  const getStatusPriority = (status: string): number => {
    switch (status) {
      case 'assigned':
      case 'in_progress':
      case 'pending_approval':
        return 1 // Priorité la plus haute - tâches acceptées
      case 'completed':
        return 2 // Tâches terminées
      case 'open':
        return 3 // Tâches ouvertes
      case 'cancelled':
      case 'expired':
        return 4 // Tâches annulées/expirées
      default:
        return 5
    }
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erreur : {error}</p>
        <button
          onClick={loadTaskHistory}
          className="btn-primary mt-2"
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Navigation et titre */}
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Retour"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                  <p className="text-sm text-gray-600">
                    Consultez l'historique de vos tâches et de votre activité
                  </p>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="flex items-center gap-3">
              <button
                onClick={loadTaskHistory}
                className="btn-secondary flex items-center gap-2"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filtres
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Header avec statistiques */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Vue d'ensemble
          </h2>
          <div className="flex items-center gap-2 text-blue-600">
            <BarChart3 className="w-5 h-5" />
            <span className="text-sm font-medium">Statistiques</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Terminées</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.inProgress}</div>
            <div className="text-sm text-gray-600">En cours</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            <div className="text-sm text-gray-600">Annulées</div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <div className="text-lg font-semibold text-gray-700">
            Budget total : {stats.totalBudget.toFixed(2)}€
          </div>
          <div className="text-sm text-gray-600">
            Moyenne : {stats.avgBudget.toFixed(2)}€ par tâche
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher dans l'historique..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filtres rapides */}
          <div className="flex gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="accepted">Acceptées</option>
              <option value="open">Ouvertes</option>
              <option value="pending_approval">En attente</option>
              <option value="assigned">Assignées</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminées</option>
              <option value="cancelled">Annulées</option>
              <option value="expired">Expirées</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes catégories</option>
              <option value="Livraison">Livraison</option>
              <option value="Nettoyage">Nettoyage</option>
              <option value="Courses">Courses</option>
              <option value="Déménagement">Déménagement</option>
              <option value="Montage">Montage</option>
              <option value="Garde d'Animaux">Garde d'Animaux</option>
              <option value="Jardinage">Jardinage</option>
              <option value="Aide Informatique">Aide Informatique</option>
              <option value="Cours Particuliers">Cours Particuliers</option>
              <option value="Autre">Autre</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">7 derniers jours</option>
              <option value="month">30 derniers jours</option>
              <option value="year">12 derniers mois</option>
              <option value="all">Tout</option>
            </select>
          </div>
        </div>

        {/* Filtres avancés */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trier par
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="date">Date de création</option>
                    <option value="budget">Budget</option>
                    <option value="priority">Priorité</option>
                    <option value="status">Statut</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ordre
                  </label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="desc">Décroissant</option>
                    <option value="asc">Croissant</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedStatus('all')
                      setSelectedCategory('all')
                      setDateRange('month')
                      setSortBy('date')
                      setSortOrder('desc')
                    }}
                    className="btn-secondary w-full"
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Liste des tâches */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Chargement de l'historique...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Aucune tâche trouvée</p>
            <p className="text-gray-500">Essayez de modifier vos filtres de recherche</p>
          </div>
        ) : (
          tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onTaskPress?.(task)}
            >
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Informations principales */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getCategoryIcon(task.category)}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(task.status)}`}>
                            {getStatusLabel(task.status)}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                            {getPriorityLabel(task.priority)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">
                        {task.budget}€
                      </div>
                      <div className="text-sm text-gray-500">
                        {task.currency}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {task.description && (
                    <p className="text-gray-700 mb-4 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  {/* Métadonnées */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Créée le {formatDate(task.created_at)}</span>
                    </div>
                    
                    {task.deadline && (
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4" />
                        <span>Échéance : {formatDate(task.deadline)}</span>
                      </div>
                    )}
                    
                    {task.estimated_duration && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Durée : {formatDuration(task.estimated_duration)}</span>
                      </div>
                    )}
                    
                    {task.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{task.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {task.tags.slice(0, 5).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {task.tags.length > 5 && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                          +{task.tags.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Informations secondaires */}
                <div className="lg:w-48 space-y-4">
                  {/* Statistiques des candidatures */}
                  {showApplications && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="font-medium text-gray-900 mb-2">Candidatures</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total :</span>
                          <span className="font-medium">{task.total_applications || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>En attente :</span>
                          <span className="font-medium">{task.pending_applications || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Acceptées :</span>
                          <span className="font-medium">{task.accepted_applications || 0}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Profils des participants */}
                  <div className="space-y-3">
                    {task.author_profile && (
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          {task.author_profile.avatar_url ? (
                            <img 
                              src={task.author_profile.avatar_url} 
                              alt={task.author_profile.name || 'Auteur'}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {task.author_profile.name || 'Auteur'}
                          </div>
                          <div className="text-gray-600">Créateur</div>
                          {task.author_profile.rating && (
                            <div className="flex items-center justify-center gap-1 mt-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-xs">{task.author_profile.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {task.helper_profile && (
                      <div className="text-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          {task.helper_profile.avatar_url ? (
                            <img 
                              src={task.helper_profile.avatar_url} 
                              alt={task.helper_profile.name || 'Aide'}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-green-600" />
                          )}
                        </div>
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {task.helper_profile.name || 'Aide'}
                          </div>
                          <div className="text-gray-600">Aide assigné</div>
                          {task.helper_profile.rating && (
                            <div className="flex items-center justify-center gap-1 mt-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-xs">{task.helper_profile.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {onTaskPress && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onTaskPress(task)
                        }}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Voir détails
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal de confirmation */}
      <ModalComponent />
    </div>
  )
}
