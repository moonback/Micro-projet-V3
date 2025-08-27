# Composant Header

Le composant `Header` est un composant réutilisable qui fournit une interface d'en-tête cohérente et moderne pour toute l'application MicroTask.

## Props

### Props de base
- `title` (string, optionnel) : Le titre principal de l'en-tête. Par défaut : "TaskHub"
- `subtitle` (string, optionnel) : Le sous-titre descriptif. Par défaut : "Trouvez votre prochaine opportunité"
- `className` (string, optionnel) : Classes CSS supplémentaires pour personnaliser l'apparence

### Props de fonctionnalité
- `showSearch` (boolean, optionnel) : Affiche la barre de recherche. Par défaut : true
- `showFilters` (boolean, optionnel) : Affiche le bouton de recherche avancée. Par défaut : true
- `showViewToggle` (boolean, optionnel) : Affiche le bouton de basculement vue liste/carte. Par défaut : true
- `showRefresh` (boolean, optionnel) : Affiche le bouton de rafraîchissement. Par défaut : true

### Props de données
- `searchQuery` (string, optionnel) : Valeur actuelle de la recherche
- `onSearchChange` (function, optionnel) : Callback appelé lors du changement de la recherche
- `viewMode` ('list' | 'map', optionnel) : Mode d'affichage actuel
- `refreshing` (boolean, optionnel) : État de chargement pour le bouton de rafraîchissement
- `filters` (object, optionnel) : Objet contenant les filtres actifs

### Props de navigation
- `onBack` (function, optionnel) : Callback pour le bouton de retour
- `onRefresh` (function, optionnel) : Callback pour le bouton de rafraîchissement
- `onViewToggle` (function, optionnel) : Callback pour le changement de vue
- `onFiltersOpen` (function, optionnel) : Callback pour ouvrir les filtres avancés
- `onCategoriesOpen` (function, optionnel) : Callback pour ouvrir les catégories

### Props personnalisées
- `rightButtons` (HeaderButton[], optionnel) : Tableau de boutons personnalisés à afficher à droite
- `participants` (string[], optionnel) : Liste des participants à afficher sous le titre
- `showStats` (boolean, optionnel) : Affiche les statistiques rapides. Par défaut : false
- `stats` (object, optionnel) : Objet contenant les statistiques à afficher

## Interface HeaderButton

```typescript
interface HeaderButton {
  icon: React.ComponentType<{ className?: string; size?: number }>
  onClick: () => void
  tooltip?: string
  className?: string
}
```

## Interface Stats

```typescript
interface Stats {
  created?: number
  accepted?: number
  open?: number
  completed?: number
}
```

## Exemples d'utilisation

### Header simple avec recherche
```tsx
<Header
  title="MicroTask"
  subtitle="Trouvez votre prochaine opportunité"
  searchQuery={searchQuery}
  onSearchChange={handleSearchChange}
/>
```

### Header avec filtres et vue toggle
```tsx
<Header
  title="Mes Tâches"
  subtitle="Gérez vos tâches créées et acceptées"
  showSearch={false}
  onFiltersOpen={() => setIsFiltersOpen(true)}
  onViewToggle={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
  viewMode={viewMode}
/>
```

### Header avec bouton de retour et participants
```tsx
<Header
  title={task.title}
  subtitle={`Chat avec ${otherParticipant?.name || 'Utilisateur'}`}
  showSearch={false}
  showFilters={false}
  onBack={onBack}
  participants={[task.author_profile?.name, task.helper_profile?.name]}
/>
```

### Header avec boutons personnalisés
```tsx
<Header
  title="Mon Profil"
  subtitle="Gérez vos informations personnelles"
  showSearch={false}
  rightButtons={[
    {
      icon: LogOut,
      onClick: handleSignOut,
      tooltip: 'Se déconnecter',
      className: 'text-red-600 hover:text-red-800 hover:bg-red-50'
    }
  ]}
/>
```

### Header avec statistiques
```tsx
<Header
  title="Mes Tâches"
  subtitle="Gérez vos tâches créées et acceptées"
  showSearch={false}
  showStats={true}
  stats={{
    created: 15,
    accepted: 8,
    open: 3,
    completed: 20
  }}
/>
```

### Header avec style personnalisé
```tsx
<Header
  title="Créer une Nouvelle Tâche"
  subtitle="Étape 1/4: Informations de base"
  showSearch={false}
  className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 text-white"
/>
```

## Caractéristiques

- **Design moderne** : Utilise des gradients, des ombres et des animations Framer Motion
- **Responsive** : S'adapte automatiquement aux différentes tailles d'écran
- **Accessible** : Inclut des tooltips et des états de focus appropriés
- **Flexible** : Peut être configuré pour différents cas d'usage
- **Cohérent** : Maintient une apparence uniforme dans toute l'application

## Animations

Le composant utilise Framer Motion pour :
- Les boutons avec effets hover et tap
- L'apparition des statistiques avec fade-in et slide-up
- Les transitions fluides entre les états

## Styles

Le composant utilise Tailwind CSS avec :
- Un design system cohérent de couleurs
- Des espacements et des tailles standardisés
- Des bordures et des ombres subtiles
- Des états hover et focus bien définis
