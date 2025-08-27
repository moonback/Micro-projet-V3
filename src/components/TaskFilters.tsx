import React, { useState } from 'react'
import { Filter, X, Search, MapPin, Euro, Clock, Tag, AlertTriangle, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export interface TaskFilters {
  minBudget: null
  maxBudget: null
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

interface TaskFiltersProps {
  filters: TaskFilters
  onFiltersChange: (filters: TaskFilters) => void
  onReset: () => void
}

const categories = [
  'Livraison', 'Nettoyage', 'Courses', 'Déménagement', 'Montage', 
  'Garde d\'Animaux', 'Jardinage', 'Aide Informatique', 'Cours Particuliers', 'Autre'
]

const priorities = [
  { value: '', label: 'Toutes les priorités' },
  { value: 'low', label: 'Faible' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high', label: 'Élevée' },
  { value: 'urgent', label: 'Urgente' }
]

const statuses = [
  { value: '', label: 'Tous les statuts' },
  { value: 'open', label: 'Ouverte' },
  { value: 'assigned', label: 'Assignée' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminée' },
  { value: 'cancelled', label: 'Annulée' },
  { value: 'expired', label: 'Expirée' }
]

const sortOptions = [
  { value: 'created_at', label: 'Plus récentes' },
  { value: 'budget', label: 'Budget croissant' },
  { value: 'budget_desc', label: 'Budget décroissant' },
  { value: 'deadline', label: 'Échéance proche' },
  { value: 'priority', label: 'Priorité' },
  { value: 'distance', label: 'Distance' }
]

const commonTags = [
  'Urgent', 'Flexible', 'À domicile', 'Transport', 'Manuel', 'Intellectuel', 
  'Créatif', 'Technique', 'Social', 'Environnemental', 'Éducatif', 'Santé'
]

export default function TaskFilters({ filters, onFiltersChange, onReset }: TaskFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilter = (key: keyof TaskFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const addTag = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      updateFilter('tags', [...filters.tags, tag])
    }
  }

  const removeTag = (tagToRemove: string) => {
    updateFilter('tags', filters.tags.filter(tag => tag !== tagToRemove))
  }

  const hasActiveFilters = () => {
    return filters.search || 
           filters.category || 
           filters.priority || 
           filters.budgetMin || 
           filters.budgetMax || 
           filters.location || 
           filters.tags.length > 0 || 
           filters.isUrgent || 
           filters.isFeatured || 
           filters.status || 
           filters.sortBy !== 'created_at'
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 mb-6">
      {/* Header des filtres */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <Filter className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
            <p className="text-sm text-gray-600">Affinez votre recherche</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {hasActiveFilters() && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={onReset}
              className="px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              Réinitialiser
            </motion.button>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isExpanded ? <X className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Barre de recherche principale */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          placeholder="Rechercher une tâche..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Filtres étendus */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 pt-4 border-t border-gray-200"
          >
            {/* Première ligne de filtres */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Catégorie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                <select
                  value={filters.category}
                  onChange={(e) => updateFilter('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Priorité */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
                <select
                  value={filters.priority}
                  onChange={(e) => updateFilter('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {priorities.map((priority) => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </select>
              </div>

              {/* Statut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                <select
                  value={filters.status}
                  onChange={(e) => updateFilter('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {statuses.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Deuxième ligne de filtres */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Budget minimum */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget min (€)</label>
                <input
                  type="number"
                  value={filters.budgetMin}
                  onChange={(e) => updateFilter('budgetMin', e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Budget maximum */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget max (€)</label>
                <input
                  type="number"
                  value={filters.budgetMax}
                  onChange={(e) => updateFilter('budgetMax', e.target.value)}
                  placeholder="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Localisation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Localisation</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={filters.location}
                    onChange={(e) => updateFilter('location', e.target.value)}
                    placeholder="Ville, code postal..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Troisième ligne de filtres */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {commonTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => addTag(tag)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                          filters.tags.includes(tag)
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  {filters.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {filters.tags.map((tag) => (
                        <div key={tag} className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                          <span className="text-sm font-medium">{tag}</span>
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-blue-500 hover:text-blue-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Options spéciales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={filters.isUrgent}
                      onChange={(e) => updateFilter('isUrgent', e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
                      Tâches urgentes uniquement
                    </span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={filters.isFeatured}
                      onChange={(e) => updateFilter('isFeatured', e.target.checked)}
                      className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
                    />
                    <span className="text-sm text-gray-700 flex items-center">
                      <Star className="w-4 h-4 mr-2 text-yellow-500" />
                      Mises en avant uniquement
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Tri */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trier par</label>
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicateur de filtres actifs */}
      {hasActiveFilters() && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 pt-4 border-t border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Filtres actifs:</span>
              <div className="flex flex-wrap gap-2">
                {filters.category && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                    {filters.category}
                    <button
                      onClick={() => updateFilter('category', '')}
                      className="ml-1 text-blue-500 hover:text-blue-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.priority && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                    {priorities.find(p => p.value === filters.priority)?.label}
                    <button
                      onClick={() => updateFilter('priority', '')}
                      className="ml-1 text-orange-500 hover:text-orange-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-green-500 hover:text-green-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={onReset}
              className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
            >
              Tout effacer
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
