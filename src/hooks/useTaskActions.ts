import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Database } from '../lib/supabase'

type Task = Database['public']['Tables']['tasks']['Row'] & {
  author_profile?: Database['public']['Tables']['profiles']['Row']
  helper_profile?: Database['public']['Tables']['profiles']['Row']
}

type TaskAcceptance = Database['public']['Tables']['task_acceptances']['Row']

export function useTaskActions() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Accepter une tâche
  const acceptTask = async (taskId: string, notes?: string): Promise<boolean> => {
    if (!user) {
      setError('Vous devez être connecté pour accepter une tâche')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      // Utiliser la fonction PostgreSQL pour accepter la tâche
      const { data, error: functionError } = await supabase.rpc('accept_task', {
        p_task_id: taskId,
        p_helper_id: user.id,
        p_notes: notes || null
      })

      if (functionError) {
        throw functionError
      }

      return true
    } catch (err: any) {
      console.error('Erreur lors de l\'acceptation de la tâche:', err)
      setError(err.message || 'Erreur lors de l\'acceptation de la tâche')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Démarrer une tâche
  const startTask = async (taskId: string): Promise<boolean> => {
    if (!user) {
      setError('Vous devez être connecté pour démarrer une tâche')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: functionError } = await supabase.rpc('start_task', {
        p_task_id: taskId
      })

      if (functionError) {
        throw functionError
      }

      return true
    } catch (err: any) {
      console.error('Erreur lors du démarrage de la tâche:', err)
      setError(err.message || 'Erreur lors du démarrage de la tâche')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Terminer une tâche
  const completeTask = async (taskId: string): Promise<boolean> => {
    if (!user) {
      setError('Vous devez être connecté pour terminer une tâche')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: functionError } = await supabase.rpc('complete_task', {
        p_task_id: taskId
      })

      if (functionError) {
        throw functionError
      }

      return true
    } catch (err: any) {
      console.error('Erreur lors de la finalisation de la tâche:', err)
      setError(err.message || 'Erreur lors de la finalisation de la tâche')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Annuler une tâche
  const cancelTask = async (taskId: string): Promise<boolean> => {
    if (!user) {
      setError('Vous devez être connecté pour annuler une tâche')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      // Mettre à jour le statut de la tâche
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'cancelled',
          helper: null
        })
        .eq('id', taskId)
        .or(`author.eq.${user.id},helper.eq.${user.id}`)

      if (error) throw error

      // Mettre à jour le statut de l'acceptation si elle existe
      await supabase
        .from('task_acceptances')
        .update({ status: 'cancelled' })
        .eq('task_id', taskId)
        .eq('helper_id', user.id)

      return true
    } catch (err: any) {
      console.error('Erreur lors de l\'annulation de la tâche:', err)
      setError(err.message || 'Erreur lors de l\'annulation de la tâche')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Vérifier si l'utilisateur peut accepter une tâche
  const canAcceptTask = (task: Task): boolean => {
    if (!user) return false
    if (task.author === user.id) return false // L'auteur ne peut pas accepter sa propre tâche
    if (task.status !== 'open') return false // Seules les tâches ouvertes peuvent être acceptées
    if (task.helper) return false // La tâche a déjà un aide
    return true
  }

  // Vérifier si l'utilisateur peut démarrer une tâche
  const canStartTask = (task: Task): boolean => {
    if (!user) return false
    if (task.status !== 'accepted') return false
    if (task.helper !== user.id) return false // Seul l'aide peut démarrer la tâche
    return true
  }

  // Vérifier si l'utilisateur peut terminer une tâche
  const canCompleteTask = (task: Task): boolean => {
    if (!user) return false
    if (task.status !== 'in-progress') return false
    if (task.helper !== user.id) return false // Seul l'aide peut terminer la tâche
    return true
  }

  // Vérifier si l'utilisateur peut annuler une tâche
  const canCancelTask = (task: Task): boolean => {
    if (!user) return false
    if (['completed', 'cancelled'].includes(task.status)) return false
    if (task.author !== user.id && task.helper !== user.id) return false
    return true
  }

  // Récupérer les tâches acceptées par l'utilisateur
  const getAcceptedTasks = async (): Promise<Task[]> => {
    if (!user) return []

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          author_profile:profiles!tasks_author_fkey (
            id,
            name,
            avatar_url,
            rating,
            rating_count
          ),
          helper_profile:profiles!tasks_helper_fkey (
            id,
            name,
            avatar_url,
            rating,
            rating_count
          )
        `)
        .eq('helper', user.id)
        .in('status', ['accepted', 'in-progress', 'completed'])
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Erreur lors de la récupération des tâches acceptées:', err)
      return []
    }
  }

  // Récupérer l'historique des acceptations
  const getAcceptanceHistory = async (): Promise<TaskAcceptance[]> => {
    if (!user) return []

    try {
      const { data, error } = await supabase
        .from('task_acceptances')
        .select(`
          *,
          task:tasks (
            id,
            title,
            description,
            category,
            budget,
            status,
            author_profile:profiles!tasks_author_fkey (
              id,
              name,
              avatar_url
            )
          )
        `)
        .eq('helper_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'historique:', err)
      return []
    }
  }

  // Effacer l'erreur
  const clearError = () => {
    setError(null)
  }

  return {
    // Actions
    acceptTask,
    startTask,
    completeTask,
    cancelTask,
    
    // Vérifications
    canAcceptTask,
    canStartTask,
    canCompleteTask,
    canCancelTask,
    
    // Récupération de données
    getAcceptedTasks,
    getAcceptanceHistory,
    
    // État
    loading,
    error,
    clearError
  }
}
