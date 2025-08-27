import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { showNotification } from '../components/NotificationToast'
import type { Database } from '../lib/supabase'

type Task = Database['public']['Tables']['tasks']['Row'] & {
  author_profile?: Database['public']['Tables']['profiles']['Row']
  helper_profile?: Database['public']['Tables']['profiles']['Row']
}

type TaskAcceptance = Database['public']['Tables']['task_acceptances']['Row']

type PendingRequest = Database['public']['Tables']['pending_task_requests']['Row'] & {
  task: Task
  helper_profile?: Database['public']['Tables']['profiles']['Row']
}

export function useTaskActions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // NOUVELLE FONCTIONNALITÉ: Demander l'approbation d'une tâche
  const requestTaskApproval = async (taskId: string, notes?: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non connecté')

      const { data, error } = await supabase.rpc('request_task_approval', {
        p_task_id: taskId,
        p_helper_id: user.id,
        p_notes: notes || null
      })

      if (error) throw error

      showNotification('success', 'Demande envoyée ! En attente d\'approbation du créateur.')
      return true
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'envoi de la demande'
      setError(errorMessage)
      showNotification('error', errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  // NOUVELLE FONCTIONNALITÉ: Approuver une demande
  const approveTaskRequest = async (taskId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non connecté')

      const { data, error } = await supabase.rpc('approve_task_request', {
        p_task_id: taskId,
        p_author_id: user.id
      })

      if (error) throw error

      showNotification('success', 'Demande approuvée ! La tâche est maintenant acceptée.')
      return true
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'approbation'
      setError(errorMessage)
      showNotification('error', errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  // NOUVELLE FONCTIONNALITÉ: Rejeter une demande
  const rejectTaskRequest = async (taskId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non connecté')

      const { data, error } = await supabase.rpc('reject_task_request', {
        p_task_id: taskId,
        p_author_id: user.id
      })

      if (error) throw error

      showNotification('success', 'Demande rejetée. La tâche est de nouveau disponible.')
      return true
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du rejet'
      setError(errorMessage)
      showNotification('error', errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  // NOUVELLE FONCTIONNALITÉ: Prolonger une demande
  const extendTaskRequest = async (taskId: string, extensionMinutes: number = 5): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non connecté')

      const { data, error } = await supabase.rpc('extend_task_request', {
        p_task_id: taskId,
        p_author_id: user.id,
        p_extension_minutes: extensionMinutes
      })

      if (error) throw error

      showNotification('success', `Demande prolongée de ${extensionMinutes} minutes.`)
      return true
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la prolongation'
      setError(errorMessage)
      showNotification('error', errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Fonction existante modifiée pour utiliser le nouveau système
  const acceptTask = async (taskId: string, notes?: string): Promise<boolean> => {
    // Maintenant, on envoie une demande d'approbation au lieu d'accepter directement
    return requestTaskApproval(taskId, notes)
  }

  const startTask = async (taskId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase.rpc('start_task', {
        p_task_id: taskId
      })

      if (error) throw error

      showNotification('success', 'Tâche démarrée avec succès !')
      return true
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors du démarrage de la tâche'
      setError(errorMessage)
      showNotification('error', errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  const completeTask = async (taskId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase.rpc('complete_task', {
        p_task_id: taskId
      })

      if (error) throw error

      showNotification('success', 'Tâche terminée avec succès !')
      return true
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la finalisation de la tâche'
      setError(errorMessage)
      showNotification('error', errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  const cancelTask = async (taskId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non connecté')

      // Vérifier si c'est une tâche en attente d'approbation
      const { data: pendingRequest } = await supabase
        .from('pending_task_requests')
        .select('*')
        .eq('task_id', taskId)
        .eq('status', 'pending')
        .single()

      if (pendingRequest) {
        // Si c'est une demande en attente, la rejeter
        return rejectTaskRequest(taskId)
      }

      // Sinon, annuler normalement
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'cancelled', 
          helper: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('author', user.id)

      if (error) throw error

      // Mettre à jour le statut de l'acceptation si elle existe
      await supabase
        .from('task_acceptances')
        .update({ status: 'cancelled' })
        .eq('task_id', taskId)
        .eq('helper_id', user.id)

      showNotification('success', 'Tâche annulée avec succès !')
      return true
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de l\'annulation de la tâche'
      setError(errorMessage)
      showNotification('error', errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  // NOUVELLES FONCTIONS: Vérifier les permissions avec le nouveau système
  const canRequestTask = (task: Task): boolean => {
    if (!task) return false
    if (task.status !== 'open') return false
    if (task.author === (supabase.auth.getUser() as any)?.data?.user?.id) return false
    return true
  }

  const canApproveRequest = (task: Task): boolean => {
    if (!task) return false
    if (task.status !== 'pending-approval') return false
    if (task.author !== (supabase.auth.getUser() as any)?.data?.user?.id) return false
    return true
  }

  const canRejectRequest = (task: Task): boolean => {
    return canApproveRequest(task) // Même logique
  }

  const canExtendRequest = (task: Task): boolean => {
    return canApproveRequest(task) // Même logique
  }

  const canAcceptTask = (task: Task): boolean => {
    // Maintenant, on ne peut plus accepter directement - il faut demander l'approbation
    return canRequestTask(task)
  }

  const canStartTask = (task: Task): boolean => {
    if (!task) return false
    if (task.status !== 'accepted') return false
    if (task.helper !== (supabase.auth.getUser() as any)?.data?.user?.id) return false
    return true
  }

  const canCompleteTask = (task: Task): boolean => {
    if (!task) return false
    if (task.status !== 'in-progress') return false
    if (task.helper !== (supabase.auth.getUser() as any)?.data?.user?.id) return false
    return true
  }

  const canCancelTask = (task: Task): boolean => {
    if (!task) return false
    const userId = (supabase.auth.getUser() as any)?.data?.user?.id
    if (!userId) return false
    
    // L'auteur peut toujours annuler
    if (task.author === userId) return true
    
    // L'aide peut annuler si la tâche est acceptée ou en cours
    if (task.helper === userId && ['accepted', 'in-progress'].includes(task.status)) return true
    
    // L'aide peut annuler sa demande en attente
    if (task.status === 'pending-approval' && task.helper === userId) return true
    
    return false
  }

  // NOUVELLE FONCTIONNALITÉ: Récupérer les demandes en attente
  const getPendingRequests = async (): Promise<PendingRequest[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('pending_task_requests')
        .select(`
          *,
          task:tasks(*, author_profile:profiles!tasks_author_fkey(*), helper_profile:profiles!tasks_helper_fkey(*)),
          helper_profile:profiles!pending_task_requests_helper_id_fkey(*)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (err) {
      console.error('Erreur lors de la récupération des demandes en attente:', err)
      return []
    }
  }

  // NOUVELLE FONCTIONNALITÉ: Récupérer les demandes en attente pour l'auteur
  const getPendingRequestsForAuthor = async (): Promise<PendingRequest[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('pending_task_requests')
        .select(`
          *,
          task:tasks(*, author_profile:profiles!tasks_author_fkey(*), helper_profile:profiles!tasks_helper_fkey(*)),
          helper_profile:profiles!pending_task_requests_helper_id_fkey(*)
        `)
        .eq('status', 'pending')
        .eq('task.author', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (err) {
      console.error('Erreur lors de la récupération des demandes en attente:', err)
      return []
    }
  }

  const getAcceptedTasks = async (): Promise<Task[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          author_profile:profiles!tasks_author_fkey(*),
          helper_profile:profiles!tasks_helper_fkey(*)
        `)
        .eq('helper', user.id)
        .in('status', ['accepted', 'in-progress'])
        .order('updated_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (err) {
      console.error('Erreur lors de la récupération des tâches acceptées:', err)
      return []
    }
  }

  const getAcceptanceHistory = async (): Promise<TaskAcceptance[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('task_acceptances')
        .select('*')
        .eq('helper_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'historique:', err)
      return []
    }
  }

  const clearError = () => {
    setError(null)
  }

  return {
    // Nouvelles fonctionnalités
    requestTaskApproval,
    approveTaskRequest,
    rejectTaskRequest,
    extendTaskRequest,
    getPendingRequests,
    getPendingRequestsForAuthor,
    
    // Fonctions existantes modifiées
    acceptTask,
    startTask,
    completeTask,
    cancelTask,
    
    // Nouvelles vérifications de permissions
    canRequestTask,
    canApproveRequest,
    canRejectRequest,
    canExtendRequest,
    
    // Vérifications existantes
    canAcceptTask,
    canStartTask,
    canCompleteTask,
    canCancelTask,
    
    // Fonctions utilitaires
    getAcceptedTasks,
    getAcceptanceHistory,
    
    // États
    loading,
    error,
    clearError
  }
}
