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
    <div className={`relative bg-white border-b border-gray-100 ${className}`}>
      {/* Gradient subtil en arrière-plan */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white to-blue-50/30 pointer-events-none" />
      
      <div className="relative px-6 py-4">
        {/* En-tête principal */}
        <div className="flex items-center justify-between mb-6">
          {/* Section gauche - Logo et navigation */}
          <div className="flex items-center space-x-4">
            {onBack && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="p-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md"
                title="Retour"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </motion.button>
            )}
            
            {/* Logo amélioré */}
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/25">
                <span className="text-xl">🚀</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
            </div>
            
            {/* Titre et sous-titre améliorés */}
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                {/* <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  {title}
                </h1> */}
                
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <p>{subtitle}</p>
                {participants.length > 0 && (
                  <>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-xs font-medium">{participants.join(' • ')}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Section droite - Actions */}
          <div className="flex items-center space-x-2">
            {/* Groupe de boutons principaux */}
            <div className="flex items-center space-x-1 bg-gray-50/80 backdrop-blur-sm border border-gray-200/80 rounded-xl p-1">
              {/* Recherche avancée */}
              {showFilters && onFiltersOpen && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onFiltersOpen}
                  className={`relative p-2.5 rounded-lg border transition-all duration-200 ${
                    hasActiveFilters() 
                      ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                  title="Recherche avancée"
                >
                  <Search className="w-4 h-4" />
                  {hasActiveFilters() && (
                    <div className="absolute -top-1 -right-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm">
                        <div className="w-full h-full bg-red-400 rounded-full animate-ping" />
                      </div>
                    </div>
                  )}
                </motion.button>
              )}

              {/* Catégories */}
              {onCategoriesOpen && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onCategoriesOpen}
                  className="p-2.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-indigo-600 rounded-lg transition-all duration-200"
                  title={filters?.category || 'Catégories'}
                >
                  <Tag className="w-4 h-4" />
                </motion.button>
              )}

              {/* Vue liste/carte */}
              {showViewToggle && onViewToggle && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onViewToggle}
                  className="p-2.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-purple-600 rounded-lg transition-all duration-200"
                  title={viewMode === 'list' ? 'Voir la carte' : 'Voir la liste'}
                >
                  {viewMode === 'list' ? 
                    <MapPin className="w-4 h-4" /> : 
                    <List className="w-4 h-4" />
                  }
                </motion.button>
              )}

              {/* Actualiser */}
              {showRefresh && onRefresh && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onRefresh}
                  disabled={refreshing}
                  className="p-2.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-green-600 rounded-lg transition-all duration-200 disabled:opacity-50"
                  title="Actualiser"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </motion.button>
              )}
            </div>

            {/* Boutons personnalisés */}
            {rightButtons.map((button, index) => {
              const Icon = button.icon
              return (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={button.onClick}
                  className={`p-2.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md ${button.className || ''}`}
                  title={button.tooltip}
                >
                  <Icon className="w-4 h-4" />
                </motion.button>
              )
            })}

            {/* Profil utilisateur (exemple) */}
            <div className="flex items-center space-x-2 ml-3 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            </div>
          </div>
        </div>



        {/* Statistiques améliorées */}
        {showStats && stats && (
          <div className="grid grid-cols-4 gap-4">
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-white border border-blue-100 rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="text-2xl font-bold text-blue-700 mb-2">{stats.created || 0}</div>
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Créées</div>
              <div className="mt-1 w-full bg-blue-100 rounded-full h-1">
                <div className="bg-blue-600 h-1 rounded-full" style={{ width: '75%' }} />
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-white border border-emerald-100 rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="text-2xl font-bold text-emerald-700 mb-2">{stats.accepted || 0}</div>
              <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Acceptées</div>
              <div className="mt-1 w-full bg-emerald-100 rounded-full h-1">
                <div className="bg-emerald-600 h-1 rounded-full" style={{ width: '60%' }} />
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-white border border-amber-100 rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="text-2xl font-bold text-amber-700 mb-2">{stats.open || 0}</div>
              <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Ouvertes</div>
              <div className="mt-1 w-full bg-amber-100 rounded-full h-1">
                <div className="bg-amber-600 h-1 rounded-full" style={{ width: '45%' }} />
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-white border border-violet-100 rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="text-2xl font-bold text-violet-700 mb-2">{stats.completed || 0}</div>
              <div className="text-xs font-semibold text-violet-600 uppercase tracking-wider">Terminées</div>
              <div className="mt-1 w-full bg-violet-100 rounded-full h-1">
                <div className="bg-violet-600 h-1 rounded-full" style={{ width: '90%' }} />
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}