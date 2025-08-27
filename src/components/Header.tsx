import React from 'react'
import { Search, RefreshCw, MapPin, List, Tag, Filter, ArrowLeft, Sparkles, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

interface HeaderButton {
  icon: React.ComponentType<{ className?: string; size?: number }>
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
  const hasActiveFilters = () => {
    if (!filters) return false
    return filters.priority || filters.budgetMin || filters.budgetMax || 
           filters.location || filters.tags?.length > 0 || filters.isUrgent || 
           filters.isFeatured || filters.status || filters.sortBy !== 'created_at'
  }

  return (
    <div className={`relative bg-white border-b border-gray-200/60 shadow-sm ${className}`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          {/* Logo et titre */}
          <div className="flex items-center space-x-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
                title="Retour"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
            )}
            
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-lg">🚀</span>
            </div>
            
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {title}
              </h1>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-600">{subtitle}</p>
                <Sparkles className="w-3 h-3 text-yellow-500" />
              </div>
              {participants.length > 0 && (
                <p className="text-xs text-gray-400 mt-0.5 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                  <span>{participants.join(' • ')}</span>
                </p>
              )}
            </div>
          </div>
          
          {/* Actions principales */}
          <div className="flex items-center space-x-2">
            {/* Bouton de recherche avancée */}
            {showFilters && onFiltersOpen && (
              <button
                onClick={onFiltersOpen}
                className="relative p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 transition-colors"
                title="Recherche avancée"
              >
                <Search className="w-4 h-4" />
                {hasActiveFilters() && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full border border-white"></div>
                  </div>
                )}
              </button>
            )}

            {/* Bouton catégories */}
            {onCategoriesOpen && (
              <button
                onClick={onCategoriesOpen}
                className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 transition-colors"
                title={filters?.category || 'Catégories'}
              >
                <Tag className="w-4 h-4" />
              </button>
            )}

            {/* Bouton rafraîchir */}
            {showRefresh && onRefresh && (
              <button
                onClick={onRefresh}
                disabled={refreshing}
                className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-blue-600 rounded-lg border border-gray-200 transition-colors"
                title="Actualiser"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
            
            {/* Bouton vue liste/carte */}
            {showViewToggle && onViewToggle && (
              <button
                onClick={onViewToggle}
                className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-indigo-600 rounded-lg border border-gray-200 transition-colors"
                title={viewMode === 'list' ? 'Voir la carte' : 'Voir la liste'}
              >
                {viewMode === 'list' ? 
                  <MapPin className="w-4 h-4" /> : 
                  <List className="w-4 h-4" />
                }
              </button>
            )}

            {/* Boutons personnalisés */}
            {rightButtons.map((button, index) => {
              const Icon = button.icon
              return (
                <button
                  key={index}
                  onClick={button.onClick}
                  className={`p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-800 rounded-lg border border-gray-200 transition-colors ${button.className || ''}`}
                  title={button.tooltip}
                >
                  <Icon className="w-4 h-4" />
                </button>
              )
            })}
          </div>
        </div>

        {/* Barre de recherche */}
        {showSearch && onSearchChange && (
          <div className="mb-3">
            <div className="relative max-w-2xl">
              <div className="relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-l-lg">
                    <Search className="w-4 h-4 text-white" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Rechercher des tâches..."
                    className="flex-1 px-4 py-2 bg-transparent border-0 text-gray-800 placeholder-gray-500 text-sm focus:outline-none focus:ring-0"
                  />
                  <button className="mr-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors">
                    <TrendingUp className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistiques */}
        {showStats && stats && (
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-700 mb-1">{stats.created || 0}</div>
              <div className="text-xs font-medium text-blue-600 uppercase tracking-wider">Créées</div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-green-700 mb-1">{stats.accepted || 0}</div>
              <div className="text-xs font-medium text-green-600 uppercase tracking-wider">Acceptées</div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-orange-700 mb-1">{stats.open || 0}</div>
              <div className="text-xs font-medium text-orange-600 uppercase tracking-wider">Ouvertes</div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-purple-700 mb-1">{stats.completed || 0}</div>
              <div className="text-xs font-medium text-purple-600 uppercase tracking-wider">Terminées</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}