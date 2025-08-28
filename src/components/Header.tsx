import React, { useState } from 'react'
import { Search, RefreshCw, MapPin, List, Tag, Filter, ArrowLeft, Sparkles, TrendingUp, Bell, Settings, User, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface HeaderButton {
  icon: React.ComponentType<{ className?: string; size?: number | string }>
  onClick: () => void
  tooltip?: string
  className?: string
}

interface HeaderProps {
  title?: string
  subtitle?: string
  showSearch?: boolean
  showFilters?: boolean
  showViewToggle?: boolean
  showRefresh?: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
  onRefresh?: () => void
  onViewToggle?: () => void
  onFiltersOpen?: () => void
  onCategoriesOpen?: () => void
  viewMode?: 'list' | 'map'
  refreshing?: boolean
  filters?: any
  className?: string
  rightButtons?: HeaderButton[]
  showStats?: boolean
  stats?: {
    created?: number
    accepted?: number
    open?: number
    completed?: number
  }
  onBack?: () => void
  participants?: string[]
}

export default function Header({
  title = "TaskHub",
  subtitle = "Trouvez votre prochaine opportunité",
  showSearch = true,
  showFilters = true,
  showViewToggle = true,
  showRefresh = true,
  searchQuery = "",
  onSearchChange,
  onRefresh,
  onViewToggle,
  onFiltersOpen,
  onCategoriesOpen,
  viewMode = 'list',
  refreshing = false,
  filters = {},
  className = "",
  rightButtons = [],
  showStats = false,
  stats = {},
  onBack,
  participants = []
}: HeaderProps) {
  // État local pour gérer l'affichage de la barre de recherche
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const hasActiveFilters = () => {
    if (!filters) return false
    return filters.priority || filters.budgetMin || filters.budgetMax || 
           filters.location || filters.tags?.length > 0 || filters.isUrgent || 
           filters.isFeatured || filters.status || filters.sortBy !== 'created_at'
  }

  return (
    <div className={`relative bg-white border-b border-gray-200 ${className}`}>
      <div className="relative px-4 py-3">
        {/* En-tête principal compact */}
        <div className="flex items-center justify-between">
          {/* Section gauche - Logo et navigation */}
          <div className="flex items-center space-x-3">
            {onBack && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onBack}
                className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all duration-200"
                title="Retour"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </motion.button>
            )}
            
            {/* Logo compact */}
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-sm">🚀</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white" />
            </div>
            
            {/* Titre et sous-titre compacts */}
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
              </div>
              
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <p>{subtitle}</p>
                {participants.length > 0 && (
                  <>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      <span className="text-xs">{participants.join(' • ')}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Section droite - Actions compactes */}
          <div className="flex items-center space-x-1.5">
            {/* Groupe de boutons principaux */}
            <div className="flex items-center space-x-0.5 bg-gray-50 border border-gray-200 rounded-lg p-0.5">
              {/* Recherche avancée */}
              {showFilters && onFiltersOpen && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onFiltersOpen}
                  className={`relative p-2 rounded-md border transition-all duration-200 ${
                    hasActiveFilters() 
                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                  title="Recherche avancée"
                >
                  <Search className="w-3.5 h-3.5" />
                  {hasActiveFilters() && (
                    <div className="absolute -top-0.5 -right-0.5">
                      <div className="w-2 h-2 bg-red-500 rounded-full border border-white" />
                    </div>
                  )}
                </motion.button>
              )}

              {/* Catégories */}
              {onCategoriesOpen && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onCategoriesOpen}
                  className="p-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-indigo-600 rounded-md transition-all duration-200"
                  title={filters?.category || 'Catégories'}
                >
                  <Tag className="w-3.5 h-3.5" />
                </motion.button>
              )}

              {/* Vue liste/carte */}
              {showViewToggle && onViewToggle && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onViewToggle}
                  className="p-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-purple-600 rounded-md transition-all duration-200"
                  title={viewMode === 'list' ? 'Voir la carte' : 'Voir la liste'}
                >
                  {viewMode === 'list' ? 
                    <MapPin className="w-3.5 h-3.5" /> : 
                    <List className="w-3.5 h-3.5" />
                  }
                </motion.button>
              )}

              {/* Actualiser */}
              {showRefresh && onRefresh && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onRefresh}
                  disabled={refreshing}
                  className="p-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-green-600 rounded-md transition-all duration-200 disabled:opacity-50"
                  title="Actualiser"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                </motion.button>
              )}
            </div>

            {/* Boutons personnalisés */}
            {rightButtons.map((button, index) => {
              const Icon = button.icon
              return (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={button.onClick}
                  className={`p-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800 rounded-lg transition-all duration-200 ${button.className || ''}`}
                  title={button.tooltip}
                >
                  <Icon className="w-3.5 h-3.5" />
                </motion.button>
              )
            })}

            {/* Profil utilisateur compact */}
            <div className="flex items-center ml-2 pl-2 border-l border-gray-200">
              <div className="w-6 h-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded-md flex items-center justify-center">
                <User className="w-3 h-3 text-gray-600" />
              </div>
            </div>
          </div>
        </div>



        {/* Statistiques compactes */}
        {showStats && stats && (
          <div className="grid grid-cols-4 gap-2 mt-3">
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="bg-white border border-blue-100 rounded-lg p-2 text-center shadow-sm"
            >
              <div className="text-lg font-bold text-blue-700 mb-1">{stats.created || 0}</div>
              <div className="text-xs text-blue-600 font-medium">Créées</div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="bg-white border border-emerald-100 rounded-lg p-2 text-center shadow-sm"
            >
              <div className="text-lg font-bold text-emerald-700 mb-1">{stats.accepted || 0}</div>
              <div className="text-xs text-emerald-600 font-medium">Acceptées</div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="bg-white border border-amber-100 rounded-lg p-2 text-center shadow-sm"
            >
              <div className="text-lg font-bold text-amber-700 mb-1">{stats.open || 0}</div>
              <div className="text-xs text-amber-600 font-medium">Ouvertes</div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="bg-white border border-violet-100 rounded-lg p-2 text-center shadow-sm"
            >
              <div className="text-lg font-bold text-violet-700 mb-1">{stats.completed || 0}</div>
              <div className="text-xs text-violet-600 font-medium">Terminées</div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}