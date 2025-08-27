import React, { useState } from 'react'
import Header from './Header'

// Exemple 1: Header complet pour une page de tâches
export function TaskPageHeader() {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [refreshing, setRefreshing] = useState(false)
  const [filters, setFilters] = useState({})

  const handleRefresh = () => {
    setRefreshing(true)
    // Logique de rafraîchissement
    setTimeout(() => setRefreshing(false), 1000)
  }

  return (
    <Header
      title="MicroTask"
      subtitle="Trouvez votre prochaine opportunité"
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onFiltersOpen={() => console.log('Ouvrir filtres')}
      onCategoriesOpen={() => console.log('Ouvrir catégories')}
      onRefresh={handleRefresh}
      refreshing={refreshing}
      viewMode={viewMode}
      onViewToggle={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
      filters={filters}
    />
  )
}

// Exemple 2: Header simple pour une page de profil
export function ProfilePageHeader() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <Header
      title="Mon Profil"
      subtitle="Gérez vos informations personnelles"
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      showFilters={false}
      showViewToggle={false}
      showRefresh={false}
    />
  )
}

// Exemple 3: Header pour une page de statistiques
export function StatsPageHeader() {
  return (
    <Header
      title="Statistiques"
      subtitle="Analysez vos performances"
      showSearch={false}
      showFilters={false}
      showViewToggle={false}
      showRefresh={true}
      onRefresh={() => console.log('Actualiser stats')}
    />
  )
}

// Exemple 4: Header personnalisé avec classe CSS
export function CustomHeader() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <Header
      title="Dashboard"
      subtitle="Vue d'ensemble de votre activité"
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onFiltersOpen={() => console.log('Ouvrir filtres')}
      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
    />
  )
}

// Exemple 5: Header minimal pour une page simple
export function MinimalHeader() {
  return (
    <Header
      title="À propos"
      subtitle="En savoir plus sur notre plateforme"
      showSearch={false}
      showFilters={false}
      showViewToggle={false}
      showRefresh={false}
    />
  )
}
