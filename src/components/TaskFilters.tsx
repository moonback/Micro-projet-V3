import React, { useState } from 'react'
import { Search, Filter, X, MapPin } from 'lucide-react'

interface TaskFiltersProps {
  onFiltersChange: (filters: TaskFilters) => void
  onSearchChange: (search: string) => void
  searchQuery: string
  filters: TaskFilters
}

export interface TaskFilters {
  category: string
  maxBudget: number | null
  minBudget: number | null
  radius: number
  status: string
}

export default function TaskFilters({ onFiltersChange, onSearchChange, searchQuery, filters }: TaskFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)

  const categories = [
    'Livraison', 'Nettoyage', 'Courses', 'Déménagement', 'Montage',
    'Garde d\'Animaux', 'Jardinage', 'Aide Informatique', 'Cours Particuliers', 'Autre'
  ]

  const radiusOptions = [1, 5, 10, 25, 50]

  const handleFilterChange = (key: keyof TaskFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      category: '',
      maxBudget: null,
      minBudget: null,
      radius: 5,
      status: 'open'
    })
  }

  const hasActiveFilters = filters.category || filters.maxBudget || filters.minBudget || filters.radius !== 5

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher des tâches..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtres</span>
          {hasActiveFilters && (
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Effacer
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Toutes les catégories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Budget Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget (EUR)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minBudget || ''}
                onChange={(e) => handleFilterChange('minBudget', e.target.value ? parseFloat(e.target.value) : null)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.maxBudget || ''}
                onChange={(e) => handleFilterChange('maxBudget', e.target.value ? parseFloat(e.target.value) : null)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Radius Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rayon de recherche
            </label>
            <div className="flex space-x-2">
              {radiusOptions.map((radius) => (
                <button
                  key={radius}
                  onClick={() => handleFilterChange('radius', radius)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filters.radius === radius
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {radius} km
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="open">Ouvertes</option>
              <option value="accepted">Acceptées</option>
              <option value="in-progress">En Cours</option>
              <option value="completed">Terminées</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
