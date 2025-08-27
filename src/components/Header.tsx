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
    <div className={`relative bg-gradient-to-br from-slate-50 via-white to-blue-50/30 border-b border-gray-200/60 backdrop-blur-sm ${className}`}>
      {/* Éléments décoratifs d'arrière-plan */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-100/40 via-indigo-50/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-gradient-to-br from-purple-100/30 via-pink-50/20 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
      </div>

      <div className="relative z-10 px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          {/* Logo et titre améliorés */}
          <div className="flex items-center space-x-4">
            {onBack && (
              <motion.button
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="group p-3 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/60 shadow-lg hover:shadow-xl hover:bg-white transition-all duration-300"
                title="Retour"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
              </motion.button>
            )}
            
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25 ring-4 ring-white/50">
                <span className="text-xl">🚀</span>
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
            </motion.div>
            
            <div>
              <motion.h1 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="text-2xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent"
              >
                {title}
              </motion.h1>
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center space-x-2"
              >
                <p className="text-sm font-medium text-gray-600">{subtitle}</p>
                <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
              </motion.div>
              {participants.length > 0 && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-xs text-gray-400 mt-1 flex items-center space-x-1"
                >
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>{participants.join(' • ')}</span>
                </motion.p>
              )}
            </div>
          </div>
          
          {/* Actions principales redesignées */}
          <div className="flex items-center space-x-3">
            {/* Bouton de recherche avancée */}
            {showFilters && onFiltersOpen && (
              <motion.button
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onFiltersOpen}
                className="group relative p-3 bg-white/80 hover:bg-white backdrop-blur-sm text-blue-700 rounded-2xl border border-blue-200/60 shadow-lg hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                title="Recherche avancée"
              >
                <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {hasActiveFilters() && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-bounce"></div>
                  </div>
                )}
              </motion.button>
            )}

            {/* Bouton catégories */}
            {onCategoriesOpen && (
              <motion.button
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCategoriesOpen}
                className="group p-3 bg-white/80 hover:bg-white backdrop-blur-sm text-gray-700 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300"
                title={filters?.category || 'Catégories'}
              >
                <Tag className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </motion.button>
            )}

            {/* Bouton rafraîchir */}
            {showRefresh && onRefresh && (
              <motion.button
                whileHover={{ scale: 1.05, rotate: refreshing ? 0 : 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRefresh}
                disabled={refreshing}
                className="group p-3 bg-white/80 hover:bg-white backdrop-blur-sm text-gray-600 hover:text-blue-600 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300"
                title="Actualiser"
              >
                <RefreshCw className={`w-5 h-5 transition-transform ${refreshing ? 'animate-spin' : 'group-hover:scale-110'}`} />
              </motion.button>
            )}
            
            {/* Bouton vue liste/carte */}
            {showViewToggle && onViewToggle && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onViewToggle}
                className="group p-3 bg-white/80 hover:bg-white backdrop-blur-sm text-gray-600 hover:text-indigo-600 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300"
                title={viewMode === 'list' ? 'Voir la carte' : 'Voir la liste'}
              >
                {viewMode === 'list' ? 
                  <MapPin className="w-5 h-5 group-hover:scale-110 transition-transform" /> : 
                  <List className="w-5 h-5 group-hover:scale-110 transition-transform" />
                }
              </motion.button>
            )}

            {/* Boutons personnalisés */}
            {rightButtons.map((button, index) => {
              const Icon = button.icon
              return (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={button.onClick}
                  className={`group p-3 bg-white/80 hover:bg-white backdrop-blur-sm text-gray-600 hover:text-gray-800 rounded-2xl border border-gray-200/60 shadow-lg hover:shadow-xl transition-all duration-300 ${button.className || ''}`}
                  title={button.tooltip}
                >
                  <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Barre de recherche futuriste */}
        {showSearch && onSearchChange && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <div className="relative max-w-3xl group">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/10">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-full ml-3 shadow-lg">
                    <Search className="w-6 h-6 text-white" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Découvrez des opportunités extraordinaires..."
                    className="flex-1 px-6 py-5 bg-transparent border-0 text-gray-800 placeholder-gray-500 text-lg font-medium focus:outline-none focus:ring-0"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mr-3 p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg hover:shadow-indigo-500/30 transition-all duration-300"
                  >
                    <TrendingUp className="w-5 h-5 text-white" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Statistiques redesignées */}
        {showStats && stats && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid grid-cols-4 gap-4"
          >
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="group relative bg-white/80 backdrop-blur-sm border border-blue-200/60 rounded-2xl p-5 text-center shadow-lg hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="text-2xl font-black text-blue-700 mb-1">{stats.created || 0}</div>
                <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Créées</div>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="group relative bg-white/80 backdrop-blur-sm border border-green-200/60 rounded-2xl p-5 text-center shadow-lg hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="text-2xl font-black text-green-700 mb-1">{stats.accepted || 0}</div>
                <div className="text-xs font-semibold text-green-600 uppercase tracking-wider">Acceptées</div>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="group relative bg-white/80 backdrop-blur-sm border border-orange-200/60 rounded-2xl p-5 text-center shadow-lg hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="text-2xl font-black text-orange-700 mb-1">{stats.open || 0}</div>
                <div className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Ouvertes</div>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02, y: -2 }}
              className="group relative bg-white/80 backdrop-blur-sm border border-purple-200/60 rounded-2xl p-5 text-center shadow-lg hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="text-2xl font-black text-purple-700 mb-1">{stats.completed || 0}</div>
                <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Terminées</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}