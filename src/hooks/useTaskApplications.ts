import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  TaskApplication, 
  TaskApplicationWithProfiles, 
  ApplicationFormData,
  TaskApplicationFilters 
} from '../types/task'

export function useTaskApplications(taskId?: string) {
  const [applications, setApplications] = useState<TaskApplicationWithProfiles[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<TaskApplicationFilters>({})

  // Charger les candidatures pour une tâche
  const loadApplications = useCallback(async (taskIdParam?: string) => {
    const targetTaskId = taskIdParam || taskId
    if (!targetTaskId) return

    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('task_applications_with_profiles')
        .select('*')
        .eq('task_id', targetTaskId)

      // Appliquer les filtres
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo)
      }
      if (filters.hasMessage) {
        query = query.not('message', 'is', null)
      }
      if (filters.hasProposal) {
        query = query.or(`proposed_budget.not.is.null,proposed_duration.not.is.null`)
      }

      const { data, error: queryError } = await query
        .order('created_at', { ascending: false })

      if (queryError) throw queryError

      setApplications(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des candidatures')
      console.error('Error loading applications:', err)
    } finally {
      setLoading(false)
    }
  }, [taskId, filters])

  // Créer une nouvelle candidature
  const createApplication = useCallback(async (
    taskIdParam: string, 
    applicationData: ApplicationFormData
  ): Promise<TaskApplication | null> => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      const { data, error: insertError } = await supabase
        .from('task_applications')
        .insert({
          task_id: taskIdParam,
          helper_id: user.id,
          message: applicationData.message,
          proposed_budget: applicationData.proposed_budget,
          proposed_duration: applicationData.proposed_duration
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Recharger les candidatures
      await loadApplications(taskIdParam)
      
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la candidature')
      console.error('Error creating application:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [loadApplications])

  // Accepter une candidature
  const acceptApplication = useCallback(async (applicationId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: functionError } = await supabase
        .rpc('accept_application', { application_id: applicationId })

      if (functionError) throw functionError

      if (data) {
        // Recharger les candidatures
        await loadApplications()
        return true
      }
      
      return false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'acceptation de la candidature')
      console.error('Error accepting application:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [loadApplications])

  // Rejeter une candidature
  const rejectApplication = useCallback(async (applicationId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('task_applications')
        .update({ 
          status: 'rejected',
          rejected_at: new Date().toISOString()
        })
        .eq('id', applicationId)

      if (updateError) throw updateError

      // Recharger les candidatures
      await loadApplications()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du rejet de la candidature')
      console.error('Error rejecting application:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [loadApplications])

  // Retirer sa candidature
  const withdrawApplication = useCallback(async (applicationId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('task_applications')
        .update({ 
          status: 'withdrawn',
          withdrawn_at: new Date().toISOString()
        })
        .eq('id', applicationId)

      if (updateError) throw updateError

      // Recharger les candidatures
      await loadApplications()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du retrait de la candidature')
      console.error('Error withdrawing application:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [loadApplications])

  // Valider le démarrage de la tâche (après acceptation)
  const approveTaskStart = useCallback(async (taskIdParam: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: functionError } = await supabase
        .rpc('approve_task_start', { task_id: taskIdParam })

      if (functionError) throw functionError

      if (data) {
        // Recharger les candidatures
        await loadApplications()
        return true
      }
      
      return false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la validation du démarrage')
      console.error('Error approving task start:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [loadApplications])

  // Rejeter le démarrage de la tâche (remettre en open)
  const rejectTaskStart = useCallback(async (taskIdParam: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: functionError } = await supabase
        .rpc('reject_task_start', { task_id: taskIdParam })

      if (functionError) throw functionError

      if (data) {
        // Recharger les candidatures
        await loadApplications()
        return true
      }
      
      return false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du rejet du démarrage')
      console.error('Error rejecting task start:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [loadApplications])

  // Mettre à jour les filtres
  const updateFilters = useCallback((newFilters: Partial<TaskApplicationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Réinitialiser les filtres
  const resetFilters = useCallback(() => {
    setFilters({})
  }, [])

  // Charger les candidatures au montage et quand les filtres changent
  useEffect(() => {
    if (taskId) {
      loadApplications()
    }
  }, [taskId, filters, loadApplications])

  return {
    applications,
    loading,
    error,
    filters,
    loadApplications,
    createApplication,
    acceptApplication,
    rejectApplication,
    withdrawApplication,
    approveTaskStart,
    rejectTaskStart,
    updateFilters,
    resetFilters
  }
}
