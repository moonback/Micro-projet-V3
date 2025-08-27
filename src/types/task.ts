// Types pour les tâches MicroTask

export interface TaskLocation {
  type: 'Point'
  coordinates: [number, number] // [longitude, latitude]
}

export interface AvailableHours {
  monday: string[]
  tuesday: string[]
  wednesday: string[]
  thursday: string[]
  friday: string[]
  saturday: string[]
  sunday: string[]
}

export interface TaskPhotos {
  id: string
  url: string
  alt?: string
  uploaded_at: string
}

export interface TaskAttachments {
  id: string
  filename: string
  url: string
  file_type: string
  file_size: number
  uploaded_at: string
}

export interface TaskMetadata {
  // Métadonnées flexibles pour extensions futures
  [key: string]: any
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'expired'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface Task {
  // Identifiants
  id: string
  author: string
  helper?: string
  
  // Informations de base
  title: string
  description: string
  category: string
  tags?: string[]
  priority: TaskPriority
  
  // Budget et paiement
  budget: number
  currency: string
  payment_status: PaymentStatus
  stripe_payment_intent?: string
  
  // Temps et échéances
  estimated_duration?: string
  deadline?: string
  created_at: string
  updated_at: string
  assigned_at?: string
  started_at?: string
  completed_at?: string
  
  // Localisation
  location?: TaskLocation
  latitude?: number
  longitude?: number
  address?: string
  city?: string
  postal_code?: string
  country: string
  
  // Statut et workflow
  status: TaskStatus
  
  // Options spéciales
  is_urgent: boolean
  is_featured: boolean
  
  // Métadonnées et analytics
  photos?: string[]
  attachments?: TaskAttachments[]
  available_hours?: AvailableHours
  view_count: number
  application_count: number
  metadata?: TaskMetadata
}

export interface TaskWithProfiles extends Task {
  author_profile?: UserProfile
  helper_profile?: UserProfile
}

export interface UserProfile {
  id: string
  name?: string
  phone?: string
  avatar_url?: string
  is_verified: boolean
  rating: number
  rating_count: number
  created_at: string
}

// Types pour les filtres
export interface TaskFilters {
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

// Types pour la création de tâches
export interface CreateTaskData {
  title: string
  description: string
  category: string
  tags?: string[]
  priority: TaskPriority
  budget: number
  estimated_duration?: string
  deadline?: string
  location: TaskLocation
  latitude: number
  longitude: number
  address: string
  city?: string
  postal_code?: string
  country: string
  is_urgent: boolean
  is_featured: boolean
  available_hours?: AvailableHours
}

// Types pour les mises à jour de tâches
export interface UpdateTaskData {
  title?: string
  description?: string
  category?: string
  tags?: string[]
  priority?: TaskPriority
  budget?: number
  estimated_duration?: string
  deadline?: string
  status?: TaskStatus
  is_urgent?: boolean
  is_featured?: boolean
  photos?: string[]
  metadata?: TaskMetadata
}

// Types pour les statistiques de tâches
export interface TaskStats {
  total: number
  open: number
  assigned: number
  in_progress: number
  completed: number
  cancelled: number
  expired: number
  by_category: Record<string, number>
  by_priority: Record<TaskPriority, number>
  average_budget: number
  total_budget: number
}

// Types pour les notifications de tâches
export interface TaskNotification {
  id: string
  task_id: string
  user_id: string
  type: 'assigned' | 'started' | 'completed' | 'cancelled' | 'message' | 'reminder'
  title: string
  message: string
  is_read: boolean
  created_at: string
}

// Types pour les messages de chat
export interface TaskMessage {
  id: string
  task_id: string
  sender: string
  content: string
  attachments?: any[]
  created_at: string
}

// Types pour les avis et évaluations
export interface TaskReview {
  id: string
  task_id: string
  reviewer: string
  reviewee: string
  rating: number
  comment?: string
  created_at: string
}

// Types pour les requêtes de recherche avancée
export interface TaskSearchQuery {
  filters: TaskFilters
  pagination: {
    page: number
    limit: number
  }
  sorting: {
    field: string
    direction: 'asc' | 'desc'
  }
  location?: {
    lat: number
    lng: number
    radius: number
  }
}

// Types pour les réponses de recherche
export interface TaskSearchResponse {
  tasks: TaskWithProfiles[]
  total: number
  page: number
  total_pages: number
  has_more: boolean
}

// Types pour les exports de données
export interface TaskExportOptions {
  format: 'csv' | 'json' | 'pdf'
  include_photos: boolean
  include_attachments: boolean
  date_range?: {
    start: string
    end: string
  }
  filters?: Partial<TaskFilters>
}

// Types pour les rapports et analytics
export interface TaskAnalytics {
  period: 'day' | 'week' | 'month' | 'year'
  metrics: {
    total_tasks: number
    completed_tasks: number
    average_completion_time: number
    total_budget: number
    average_budget: number
    top_categories: Array<{ category: string; count: number }>
    top_locations: Array<{ city: string; count: number }>
  }
  trends: {
    tasks_over_time: Array<{ date: string; count: number }>
    budget_over_time: Array<{ date: string; amount: number }>
  }
}
