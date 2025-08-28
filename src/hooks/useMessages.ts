import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { TaskMessage, Conversation, MessageAttachment } from '../types/task'

interface UseMessagesOptions {
  taskId?: string
  autoScroll?: boolean
  pageSize?: number
}

export function useMessages(options: UseMessagesOptions = {}) {
  const { user } = useAuth()
  const { taskId, autoScroll = true, pageSize = 50 } = options
  
  const [messages, setMessages] = useState<TaskMessage[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  
  const subscriptionRef = useRef<any>(null)
  const mountedRef = useRef(true)

  // Charger les messages d'une tâche spécifique
  const loadMessages = useCallback(async (taskId: string, reset = false) => {
    if (!user || !taskId) return

    setLoading(true)
    try {
      const currentPage = reset ? 0 : page
      const from = currentPage * pageSize
      const to = from + pageSize - 1

      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:profiles!messages_sender_fkey (
            id,
            name,
            avatar_url
          )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      const newMessages = messagesData || []
      if (reset) {
        setMessages(newMessages.reverse())
        setPage(0)
        setHasMore(newMessages.length === pageSize)
      } else {
        setMessages(prev => [...prev, ...newMessages.reverse()])
        setPage(currentPage + 1)
        setHasMore(newMessages.length === pageSize)
      }

      // Marquer les messages comme lus
      await markMessagesAsRead(taskId, newMessages.map(m => m.id))
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }, [user, page, pageSize])

  // Charger toutes les conversations de l'utilisateur
  const loadConversations = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      // Récupérer les tâches où l'utilisateur est auteur ou aideur
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          author,
          helper,
          status,
          profiles!tasks_author_fkey (
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
        .not('helper', 'is', null)

      if (tasksError) throw tasksError

      // Récupérer le dernier message et le compteur de messages non lus pour chaque tâche
      const conversationsWithMessages = await Promise.all(
        (tasks || []).map(async (task: any) => {
          const { data: latestMessage } = await supabase
            .from('messages')
            .select('*')
            .eq('task_id', task.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          if (!latestMessage) return null

          // Compter les messages non lus
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('task_id', task.id)
            .eq('is_read', false)
            .neq('sender', user.id)

          const otherParticipant = task.author === user.id ? task.helper_profile : task.author_profile

          return {
            task,
            latestMessage,
            otherParticipant,
            unreadCount: unreadCount || 0,
            lastActivity: latestMessage.created_at
          }
        })
      )

      const validConversations = conversationsWithMessages
        .filter(Boolean)
        .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())

      setConversations(validConversations)
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Envoyer un message
  const sendMessage = useCallback(async (taskId: string, content: string, attachments?: MessageAttachment[]) => {
    if (!user || !content.trim()) return null

    setSending(true)
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          task_id: taskId,
          sender: user.id,
          content: content.trim(),
          attachments: attachments || null,
          is_read: false
        })
        .select()
        .single()

      if (error) throw error

      // Ajouter le message à la liste locale
      const newMessage: TaskMessage = {
        ...message,
        sender_profile: {
          id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur',
          avatar_url: user.user_metadata?.avatar_url
        }
      }

      setMessages(prev => [...prev, newMessage])
      
      // Mettre à jour la conversation
      await loadConversations()

      return message
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    } finally {
      setSending(false)
    }
  }, [user, loadConversations])

  // Marquer les messages comme lus
  const markMessagesAsRead = useCallback(async (taskId: string, messageIds: string[]) => {
    if (!user || messageIds.length === 0) return

    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('task_id', taskId)
        .in('id', messageIds)
        .neq('sender', user.id)

      if (error) throw error

      // Mettre à jour l'état local
      setMessages(prev => prev.map(msg => 
        messageIds.includes(msg.id) && msg.sender !== user.id
          ? { ...msg, is_read: true, read_at: new Date().toISOString() }
          : msg
      ))

      // Mettre à jour les conversations
      await loadConversations()
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }, [user, loadConversations])

  // Configurer la synchronisation en temps réel
  useEffect(() => {
    if (!user) return

    // Synchronisation des messages
    if (taskId) {
      subscriptionRef.current = supabase
        .channel(`messages:${taskId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `task_id=eq.${taskId}`
          },
          (payload) => {
            if (!mountedRef.current) return

            const newMessage = payload.new as TaskMessage
            setMessages(prev => {
              // Éviter les doublons
              if (prev.some(msg => msg.id === newMessage.id)) {
                return prev
              }
              return [...prev, newMessage]
            })

            // Marquer comme lu si c'est un message reçu
            if (newMessage.sender !== user.id) {
              markMessagesAsRead(taskId, [newMessage.id])
            }
          }
        )
        .subscribe()
    }

    // Synchronisation des conversations
    const conversationsSub = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          if (mountedRef.current) {
            loadConversations()
          }
        }
      )
      .subscribe()

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
      }
      supabase.removeChannel(conversationsSub)
    }
  }, [user, taskId, markMessagesAsRead, loadConversations])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Charger les conversations au montage
  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user, loadConversations])

  return {
    messages,
    conversations,
    loading,
    sending,
    hasMore,
    sendMessage,
    loadMessages,
    loadConversations,
    markMessagesAsRead,
    refresh: () => {
      if (taskId) {
        loadMessages(taskId, true)
      } else {
        loadConversations()
      }
    }
  }
}
