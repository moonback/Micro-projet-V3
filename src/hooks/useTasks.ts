import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Task, TaskWithProfiles, TaskFilters, CreateTaskData, UpdateTaskData, TaskSearchQuery, TaskSearchResponse } from '../types/task'

export function useTasks() {
  const [tasks, setTasks] = useState<TaskWithProfiles[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  // Récupérer toutes les tâches avec filtres
  const fetchTasks = useCallback(async (filters?: Partial<TaskFilters>) => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          author_profile:profiles!tasks_author_fkey(*),
          helper_profile:profiles!tasks_helper_fkey(*)
        `)

      // Appliquer les filtres
      if (filters?.category) {
        query = query.eq('category', filters.category)
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.budgetMin) {
        query = query.gte('budget', parseFloat(filters.budgetMin))
      }
      if (filters?.budgetMax) {
        query = query.lte('budget', parseFloat(filters.budgetMax))
      }
      if (filters?.isUrgent) {
        query = query.eq('is_urgent', true)
      }
      if (filters?.isFeatured) {
        query = query.eq('is_featured', true)
      }
      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags)
      }
      if (filters?.location) {
        // Recherche par ville ou code postal
        query = query.or(`city.ilike.%${filters.location}%,postal_code.ilike.%${filters.location}%`)
      }

      // Tri
      if (filters?.sortBy) {
        switch (filters.sortBy) {
          case 'budget':
            query = query.order('budget', { ascending: true })
            break
          case 'budget_desc':
            query = query.order('budget', { ascending: false })
            break
          case 'deadline':
            query = query.order('deadline', { ascending: true })
            break
          case 'priority':
            query = query.order('priority', { ascending: false })
            break
          case 'created_at':
          default:
            query = query.order('created_at', { ascending: false })
            break
        }
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const { data, error: fetchError, count } = await query

      if (fetchError) throw fetchError

      setTasks(data || [])
      setTotalCount(count || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération des tâches')
      console.error('Error fetching tasks:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Récupérer une tâche par ID
  const fetchTaskById = useCallback(async (id: string): Promise<TaskWithProfiles | null> => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          author_profile:profiles!tasks_author_fkey(*),
          helper_profile:profiles!tasks_helper_fkey(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la récupération de la tâche')
      console.error('Error fetching task:', err)
      return null
    }
  }, [])

  // Créer une nouvelle tâche
  const createTask = useCallback(async (taskData: CreateTaskData): Promise<Task | null> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single()

      if (error) throw error

      // Ajouter la nouvelle tâche à la liste
      setTasks(prev => [data, ...prev])
      setTotalCount(prev => prev + 1)

      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la tâche')
      console.error('Error creating task:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Mettre à jour une tâche
  const updateTask = useCallback(async (id: string, updates: UpdateTaskData): Promise<Task | null> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Mettre à jour la tâche dans la liste
      setTasks(prev => prev.map(task => task.id === id ? { ...task, ...data } : task))

      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la tâche')
      console.error('Error updating task:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Supprimer une tâche
  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Retirer la tâche de la liste
      setTasks(prev => prev.filter(task => task.id !== id))
      setTotalCount(prev => prev - 1)

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression de la tâche')
      console.error('Error deleting task:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Accepter une tâche
  const acceptTask = useCallback(async (taskId: string, helperId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'assigned',
          helper: helperId,
          assigned_at: new Date().toISOString()
        })
        .eq('id', taskId)

      if (error) throw error

      // Mettre à jour le statut dans la liste
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'assigned', helper: helperId, assigned_at: new Date().toISOString() }
          : task
      ))

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'acceptation de la tâche')
      console.error('Error accepting task:', err)
      return false
    }
  }, [])

  // Démarrer une tâche
  const startTask = useCallback(async (taskId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', taskId)

      if (error) throw error

      // Mettre à jour le statut dans la liste
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'in_progress', started_at: new Date().toISOString() }
          : task
      ))

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du démarrage de la tâche')
      console.error('Error starting task:', err)
      return false
    }
  }, [])

  // Terminer une tâche
  const completeTask = useCallback(async (taskId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId)

      if (error) throw error

      // Mettre à jour le statut dans la liste
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'completed', completed_at: new Date().toISOString() }
          : task
      ))

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la finalisation de la tâche')
      console.error('Error completing task:', err)
      return false
    }
  }, [])

  // Annuler une tâche
  const cancelTask = useCallback(async (taskId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'cancelled' })
        .eq('id', taskId)

      if (error) throw error

      // Mettre à jour le statut dans la liste
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'cancelled' }
          : task
      ))

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'annulation de la tâche')
      console.error('Error cancelling task:', err)
      return false
    }
  }, [])

  // Recherche avancée avec pagination
  const searchTasks = useCallback(async (searchQuery: TaskSearchQuery): Promise<TaskSearchResponse | null> => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          author_profile:profiles!tasks_author_fkey(*),
          helper_profile:profiles!tasks_helper_fkey(*)
        `, { count: 'exact' })

      // Appliquer tous les filtres
      const { filters, pagination, sorting, location } = searchQuery

      if (filters.category) query = query.eq('category', filters.category)
      if (filters.priority) query = query.eq('priority', filters.priority)
      if (filters.status) query = query.eq('status', filters.status)
      if (filters.budgetMin) query = query.gte('budget', parseFloat(filters.budgetMin))
      if (filters.budgetMax) query = query.lte('budget', parseFloat(filters.budgetMax))
      if (filters.isUrgent) query = query.eq('is_urgent', true)
      if (filters.isFeatured) query = query.eq('is_featured', true)
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags)
      }
      if (filters.location) {
        query = query.or(`city.ilike.%${filters.location}%,postal_code.ilike.%${filters.location}%`)
      }

      // Recherche textuelle
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      // Tri
      if (sorting.field && sorting.direction) {
        query = query.order(sorting.field, { ascending: sorting.direction === 'asc' })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      // Pagination
      const offset = (pagination.page - 1) * pagination.limit
      query = query.range(offset, offset + pagination.limit - 1)

      const { data, error, count } = await query

      if (error) throw error

      const total = count || 0
      const totalPages = Math.ceil(total / pagination.limit)
      const hasMore = pagination.page < totalPages

      return {
        tasks: data || [],
        total,
        page: pagination.page,
        total_pages: totalPages,
        has_more: hasMore
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la recherche')
      console.error('Error searching tasks:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Recherche par proximité géographique
  const searchTasksByLocation = useCallback(async (lat: number, lng: number, radiusKm: number = 10): Promise<TaskWithProfiles[]> => {
    try {
      const { data, error } = await supabase
        .rpc('search_tasks_by_distance', {
          search_lat: lat,
          search_lng: lng,
          search_radius: radiusKm * 1000 // Convertir en mètres
        })

      if (error) throw error
      return data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la recherche géographique')
      console.error('Error searching tasks by location:', err)
      return []
    }
  }, [])

  // Incrémenter le compteur de vues
  const incrementViewCount = useCallback(async (taskId: string): Promise<void> => {
    try {
      await supabase
        .from('tasks')
        .update({ view_count: supabase.rpc('increment', { row_id: taskId, column_name: 'view_count' }) })
        .eq('id', taskId)
    } catch (err) {
      console.error('Error incrementing view count:', err)
    }
  }, [])

  // Incrémenter le compteur de candidatures
  const incrementApplicationCount = useCallback(async (taskId: string): Promise<void> => {
    try {
      await supabase
        .from('tasks')
        .update({ application_count: supabase.rpc('increment', { row_id: taskId, column_name: 'application_count' }) })
        .eq('id', taskId)
    } catch (err) {
      console.error('Error incrementing application count:', err)
    }
  }, [])

  // Récupérer les statistiques des tâches
  const getTaskStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('status, category, priority, budget')

      if (error) throw error

      const stats = {
        total: data.length,
        open: data.filter(t => t.status === 'open').length,
        assigned: data.filter(t => t.status === 'assigned').length,
        in_progress: data.filter(t => t.status === 'in_progress').length,
        completed: data.filter(t => t.status === 'completed').length,
        cancelled: data.filter(t => t.status === 'cancelled').length,
        expired: data.filter(t => t.status === 'expired').length,
        by_category: {} as Record<string, number>,
        by_priority: {} as Record<string, number>,
        average_budget: 0,
        total_budget: 0
      }

      // Calculer les statistiques par catégorie et priorité
      data.forEach(task => {
        stats.by_category[task.category] = (stats.by_category[task.category] || 0) + 1
        stats.by_priority[task.priority] = (stats.by_priority[task.priority] || 0) + 1
        stats.total_budget += task.budget
      })

      stats.average_budget = stats.total_budget / stats.total

      return stats
    } catch (err) {
      console.error('Error getting task stats:', err)
      return null
    }
  }, [])

  // Nettoyer l'erreur
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // État
    tasks,
    loading,
    error,
    totalCount,

    // Actions
    fetchTasks,
    fetchTaskById,
    createTask,
    updateTask,
    deleteTask,
    acceptTask,
    startTask,
    completeTask,
    cancelTask,
    searchTasks,
    searchTasksByLocation,
    incrementViewCount,
    incrementApplicationCount,
    getTaskStats,
    clearError
  }
}
