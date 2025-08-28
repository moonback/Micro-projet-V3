import React, { useState } from 'react'
import { Search, RefreshCw, MapPin, List, Tag, Filter, ArrowLeft, Sparkles, TrendingUp, Bell, Settings, User, ChevronDown, ChevronUp, X } from 'lucide-react'
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

// Composant Modal pour les catégories
const CategoryModal = ({ isOpen, onClose, onSelect, selectedCategory }: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSelect: (category: string) => void, 
  selectedCategory: string 
}) => {
  const categories = [
    { name: 'Livraison', icon: '🚚', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { name: 'Transport', icon: '📦', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { name: 'Animaux', icon: '🐕', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { name: 'Ménage', icon: '🧹', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { name: 'Jardinage', icon: '🌱', color: 'bg-green-50 text-green-700 border-green-200' }
  ]

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl border border-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Catégories</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2.5">
            {categories.map((category) => (
              <motion.button
                key={category.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onSelect(category.name)
                  onClose()
                }}
                className={`${category.color} p-3 rounded-2xl text-xs font-medium flex flex-col items-center gap-1.5 border transition-all ${
                  selectedCategory === category.name 
                    ? 'ring-2 ring-blue-500 ring-offset-1 shadow-lg scale-105' 
                    : 'hover:shadow-md'
                }`}
              >
                <span className="text-xl">{category.icon}</span>
                <span>{category.name}</span>
              </motion.button>
            ))}
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={() => {
                onSelect('')
                onClose()
              }}
              className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-2xl font-medium transition-colors text-sm"
            >
              Voir toutes
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Composant Modal pour les filtres avancés
const FiltersModal = ({ isOpen, onClose, filters, onFiltersChange, onReset }: {
  isOpen: boolean
  onClose: () => void
  filters: any
  onFiltersChange: (filters: any) => void
  onReset: () => void
}) => {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="bg-white rounded-3xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filtres avancés</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Priorité */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
              <select
                value={filters?.priority || ''}
                onChange={(e) => onFiltersChange({ ...filters, priority: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Toutes les priorités</option>
                <option value="urgent">Urgente</option>
                <option value="high">Élevée</option>
                <option value="medium">Moyenne</option>
                <option value="low">Faible</option>
              </select>
            </div>

            {/* Budget */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget min</label>
                <input
                  type="number"
                  placeholder="0€"
                  value={filters?.budgetMin || ''}
                  onChange={(e) => onFiltersChange({ ...filters, budgetMin: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget max</label>
                <input
                  type="number"
                  placeholder="1000€"
                  value={filters?.budgetMax || ''}
                  onChange={(e) => onFiltersChange({ ...filters, budgetMax: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Localisation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Localisation</label>
              <input
                type="text"
                placeholder="Ville, code postal..."
                value={filters?.location || ''}
                onChange={(e) => onFiltersChange({ ...filters, location: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Options spéciales */}
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={filters?.isUrgent || false}
                  onChange={(e) => onFiltersChange({ ...filters, isUrgent: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Tâches urgentes uniquement</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={filters?.isFeatured || false}
                  onChange={(e) => onFiltersChange({ ...filters, isFeatured: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Tâches mises en avant</span>
              </label>
            </div>

            {/* Tri */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trier par</label>
              <select
                value={filters?.sortBy || 'created_at'}
                onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="created_at">Date de création</option>
                <option value="budget">Budget croissant</option>
                <option value="budget_desc">Budget décroissant</option>
                <option value="deadline">Échéance</option>
                <option value="priority">Priorité</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-2xl font-medium transition-colors text-sm"
            >
              Fermer
            </button>
            <button
              onClick={() => {
                onReset()
                onClose()
              }}
              className="flex-1 py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 rounded-2xl font-medium transition-colors text-sm"
            >
              Reset
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function Header({
  title = "MicroTask",
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
  // États locaux pour gérer les modales
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  
  const hasActiveFilters = () => {
    if (!filters) return false
    return filters.priority || filters.budgetMin || filters.budgetMax || 
           filters.location || filters.tags?.length > 0 || filters.isUrgent || 
           filters.isFeatured || filters.status || filters.sortBy !== 'created_at'
  }

  // Fonctions pour gérer les modales
  const handleCategorySelect = (category: string) => {
    if (onCategoriesOpen) {
      onCategoriesOpen()
    }
    setIsCategoryModalOpen(false)
  }

  const handleFiltersChange = (newFilters: any) => {
    if (onFiltersOpen) {
      onFiltersOpen()
    }
  }

  const handleFiltersReset = () => {
    // Reset des filtres - à implémenter selon les besoins
    setIsFiltersModalOpen(false)
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
              {showFilters && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsFiltersModalOpen(true)}
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
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsCategoryModalOpen(true)}
                className="p-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-indigo-600 rounded-md transition-all duration-200"
                title={filters?.category || 'Catégories'}
              >
                <Tag className="w-3.5 h-3.5" />
              </motion.button>

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

        {/* Barre de recherche */}
        {showSearch && onSearchChange && (
          <div className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher des tâches..."
                value={searchQuery || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
        )}

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

       {/* Modales */}
       <CategoryModal
         isOpen={isCategoryModalOpen}
         onClose={() => setIsCategoryModalOpen(false)}
         onSelect={handleCategorySelect}
         selectedCategory={filters?.category || ''}
       />
       
       <FiltersModal
         isOpen={isFiltersModalOpen}
         onClose={() => setIsFiltersModalOpen(false)}
         filters={filters}
         onFiltersChange={handleFiltersChange}
         onReset={handleFiltersReset}
       />
     </div>
   )
 }