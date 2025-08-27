import React, { useState } from 'react'
import { Search, Filter, X, MapPin, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-b border-gray-200 p-4"
    >
      {/* Toggle des filtres avec indicateur */}
      <div className="flex items-center justify-between mb-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors border border-gray-200"
        >
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filtres</span>
          {hasActiveFilters && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-3 h-3 bg-blue-600 rounded-full"
            />
          )}
          <motion.div
            animate={{ rotate: showFilters ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </motion.div>
        </motion.button>

        {hasActiveFilters && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-2 hover:bg-blue-50 rounded-xl transition-colors"
          >
            Effacer
          </motion.button>
        )}
      </div>

      {/* Panneau des filtres avec animation */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-6 p-6 bg-gray-50 rounded-2xl border border-gray-200">
              {/* Filtre par catégorie */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Catégorie
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <motion.button
                      key={category}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleFilterChange('category', filters.category === category ? '' : category)}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        filters.category === category
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {category}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Filtre par budget */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Budget (EUR)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minBudget || ''}
                      onChange={(e) => handleFilterChange('minBudget', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxBudget || ''}
                      onChange={(e) => handleFilterChange('maxBudget', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Filtre par rayon */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Rayon de recherche
                </label>
                <div className="flex flex-wrap gap-2">
                  {radiusOptions.map((radius) => (
                    <motion.button
                      key={radius}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleFilterChange('radius', radius)}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        filters.radius === radius
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {radius} km
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Filtre par statut */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Statut
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="open">Ouvertes</option>
                  <option value="accepted">Acceptées</option>
                  <option value="in-progress">En Cours</option>
                  <option value="completed">Terminées</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
