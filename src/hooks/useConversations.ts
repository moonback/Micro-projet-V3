import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { ConversationListItem } from '../types/task'

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadConversations = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Début du chargement des conversations...')

      // Récupérer l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Utilisateur non connecté')
        return
      }

      console.log('👤 Utilisateur connecté:', user.id)

      // Récupérer toutes les tâches où l'utilisateur est impliqué
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          status,
          created_at,
          author,
          helper,
          author_profile:profiles!tasks_author_fkey (
            id,
            name,
            avatar_url
          ),
          helper_profile:profiles!tasks_helper_fkey (
            id,
            name,
            avatar_url
          )
        `)
        .or(`author.eq.${user.id},helper.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (tasksError) throw tasksError

      console.log('📋 Tâches récupérées:', tasks?.length || 0)

      // Récupérer les IDs des tâches qui ont des messages
      const { data: taskIdsWithMessages, error: messagesError } = await supabase
        .from('messages')
        .select('task_id')
        .not('task_id', 'is', null)

      if (messagesError) throw messagesError

      console.log('💬 Tâches avec messages:', taskIdsWithMessages?.length || 0)

      // Récupérer les tâches avec messages (soit impliquées, soit ouvertes)
      const { data: allTasksWithMessages, error: allTasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          status,
          created_at,
          author,
          helper,
          author_profile:profiles!tasks_author_fkey (
            id,
            name,
            avatar_url
          ),
          helper_profile:profiles!tasks_helper_fkey (
            id,
            name,
            avatar_url
          )
        `)
        .in('id', taskIdsWithMessages?.map(m => m.task_id) || [])
        .order('created_at', { ascending: false })

      if (allTasksError) throw allTasksError

      console.log('🔍 Toutes les tâches avec messages:', allTasksWithMessages?.length || 0)

      // Récupérer le dernier message et le nombre de messages non lus pour chaque tâche
      const conversationsWithMessages = await Promise.all(
        (allTasksWithMessages || []).map(async (task) => {
          // Dernier message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at, sender')
            .eq('task_id', task.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          // Nombre de messages non lus
          const { data: unreadMessages } = await supabase
            .from('messages')
            .select('id')
            .eq('task_id', task.id)
            .eq('is_read', false)
            .neq('sender', user.id)

          const otherParticipant = task.author === user.id 
            ? (Array.isArray(task.helper_profile) ? task.helper_profile[0] : task.helper_profile)
            : (Array.isArray(task.author_profile) ? task.author_profile[0] : task.author_profile)

          return {
            taskId: task.id,
            title: task.title,
            status: task.status,
            lastMessage: lastMessage?.content || 'Aucun message',
            lastMessageTime: lastMessage?.created_at || task.created_at,
            lastMessageSender: lastMessage?.sender || null,
            unreadCount: unreadMessages?.length || 0,
            otherParticipant,
            isAuthor: task.author === user.id,
            isHelper: task.helper === user.id
          }
        })
      )

      console.log('✅ Conversations finales:', conversationsWithMessages.length)
      console.log('📝 Détail des conversations:', conversationsWithMessages)

      setConversations(conversationsWithMessages)
    } catch (err) {
      console.error('❌ Error loading conversations:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des conversations')
    } finally {
      setLoading(false)
    }
  }

  const refreshConversations = () => {
    loadConversations()
  }

  useEffect(() => {
    loadConversations()
  }, [])

  return {
    conversations,
    loading,
    error,
    refreshConversations
  }
}
