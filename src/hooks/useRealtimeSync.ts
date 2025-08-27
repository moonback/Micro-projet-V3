import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface MessageNotification {
  id: string
  task_id: string
  sender_id: string
  sender_name: string
  content: string
  task_title: string
  created_at: string
  is_read: boolean
}

export interface TaskUpdate {
  task_id: string
  type: 'status_change' | 'assigned' | 'completed' | 'cancelled'
  old_status?: string
  new_status?: string
  helper_id?: string
  helper_name?: string
  timestamp: string
}

export function useRealtimeSync() {
  const { user } = useAuth()
  const [messageNotifications, setMessageNotifications] = useState<MessageNotification[]>([])
  const [taskUpdates, setTaskUpdates] = useState<TaskUpdate[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)

  // Écouter les nouveaux messages
  const setupMessageListener = useCallback(() => {
    if (!user) return

    const messageChannel = supabase
      .channel('new-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `task_id=in.(${getUserTaskIds()})`
        },
        async (payload) => {
          const newMessage = payload.new as any
          
          // Ignorer les messages de l'utilisateur actuel
          if (newMessage.sender === user.id) return

          try {
            // Récupérer les informations de l'expéditeur et de la tâche
            const [senderProfile, taskInfo] = await Promise.all([
              supabase
                .from('profiles')
                .select('name')
                .eq('id', newMessage.sender)
                .single(),
              supabase
                .from('tasks')
                .select('title')
                .eq('id', newMessage.task_id)
                .single()
            ])

            const notification: MessageNotification = {
              id: newMessage.id,
              task_id: newMessage.task_id,
              sender_id: newMessage.sender,
              sender_name: senderProfile.data?.name || 'Anonyme',
              content: newMessage.content,
              task_title: taskInfo.data?.title || 'Tâche',
              created_at: newMessage.created_at,
              is_read: false
            }

            setMessageNotifications(prev => [notification, ...prev])
            setUnreadCount(prev => prev + 1)

            // Afficher une notification toast
            showNotificationToast(notification)
          } catch (error) {
            console.error('Error processing new message notification:', error)
          }
        }
      )
      .subscribe()

    return messageChannel
  }, [user])

  // Écouter les mises à jour de tâches
  const setupTaskUpdateListener = useCallback(() => {
    if (!user) return

    const taskChannel = supabase
      .channel('task-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `id=in.(${getUserTaskIds()})`
        },
        async (payload) => {
          const oldTask = payload.old as any
          const newTask = payload.new as any

          // Détecter les changements de statut
          if (oldTask.status !== newTask.status) {
            const update: TaskUpdate = {
              task_id: newTask.id,
              type: 'status_change',
              old_status: oldTask.status,
              new_status: newTask.status,
              timestamp: new Date().toISOString()
            }

            setTaskUpdates(prev => [update, ...prev])

            // Notification pour changement de statut
            if (newTask.status === 'completed') {
              showTaskUpdateToast('Tâche terminée !', `La tâche "${newTask.title}" a été marquée comme terminée.`)
            } else if (newTask.status === 'in_progress') {
              showTaskUpdateToast('Tâche en cours !', `La tâche "${newTask.title}" a commencé.`)
            }
          }

          // Détecter l'assignation d'un helper
          if (!oldTask.helper && newTask.helper) {
            try {
              const helperProfile = await supabase
                .from('profiles')
                .select('name')
                .eq('id', newTask.helper)
                .single()

              const update: TaskUpdate = {
                task_id: newTask.id,
                type: 'assigned',
                helper_id: newTask.helper,
                helper_name: helperProfile.data?.name || 'Anonyme',
                timestamp: new Date().toISOString()
              }

              setTaskUpdates(prev => [update, ...prev])

              if (newTask.author === user.id) {
                showTaskUpdateToast('Tâche assignée !', `${helperProfile.data?.name || 'Quelqu\'un'} a accepté votre tâche.`)
              }
            } catch (error) {
              console.error('Error processing helper assignment:', error)
            }
          }
        }
      )
      .subscribe()

    return taskChannel
  }, [user])

  // Écouter les nouvelles tâches assignées à l'utilisateur
  const setupNewTaskListener = useCallback(() => {
    if (!user) return

    const newTaskChannel = supabase
      .channel('new-assigned-tasks')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `helper=eq.${user.id}`
        },
        async (payload) => {
          const newTask = payload.new as any
          
          // Vérifier si c'est une nouvelle assignation
          if (newTask.helper === user.id && newTask.status === 'assigned') {
            try {
              const authorProfile = await supabase
                .from('profiles')
                .select('name')
                .eq('id', newTask.author)
                .single()

              showTaskUpdateToast(
                'Nouvelle tâche assignée !', 
                `${authorProfile.data?.name || 'Quelqu\'un'} vous a assigné la tâche "${newTask.title}".`
              )
            } catch (error) {
              console.error('Error processing new task assignment:', error)
            }
          }
        }
      )
      .subscribe()

    return newTaskChannel
  }, [user])

  // Récupérer les IDs des tâches de l'utilisateur
  const getUserTaskIds = useCallback(async (): Promise<string[]> => {
    if (!user) return []

    try {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id')
        .or(`author.eq.${user.id},helper.eq.${user.id}`)

      return tasks?.map(task => task.id) || []
    } catch (error) {
      console.error('Error fetching user task IDs:', error)
      return []
    }
  }, [user])

  // Marquer une notification comme lue
  const markNotificationAsRead = useCallback((notificationId: string) => {
    setMessageNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, is_read: true }
          : notif
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  // Marquer toutes les notifications comme lues
  const markAllNotificationsAsRead = useCallback(() => {
    setMessageNotifications(prev => 
      prev.map(notif => ({ ...notif, is_read: true }))
    )
    setUnreadCount(0)
  }, [])

  // Supprimer une notification
  const removeNotification = useCallback((notificationId: string) => {
    setMessageNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    )
  }, [])

  // Supprimer toutes les notifications
  const clearAllNotifications = useCallback(() => {
    setMessageNotifications([])
    setUnreadCount(0)
  }, [])

  // Afficher une notification toast
  const showNotificationToast = useCallback((notification: MessageNotification) => {
    // Ici vous pouvez intégrer avec votre système de notifications
    // Par exemple, utiliser react-hot-toast ou une bibliothèque similaire
    console.log('New message notification:', notification)
    
    // Optionnel : afficher une notification native du navigateur
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Nouveau message de ${notification.sender_name}`, {
        body: notification.content,
        icon: '/favicon.ico',
        tag: notification.id
      })
    }
  }, [])

  // Afficher une notification de mise à jour de tâche
  const showTaskUpdateToast = useCallback((title: string, message: string) => {
    console.log('Task update notification:', { title, message })
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico'
      })
    }
  }, [])

  // Demander la permission pour les notifications
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return Notification.permission === 'granted'
  }, [])

  // Initialiser la synchronisation en temps réel
  useEffect(() => {
    if (!user) return

    let messageChannel: any
    let taskChannel: any
    let newTaskChannel: any

    const initializeSync = async () => {
      try {
        // Demander la permission pour les notifications
        await requestNotificationPermission()

        // Initialiser les listeners
        messageChannel = setupMessageListener()
        taskChannel = setupTaskUpdateListener()
        newTaskChannel = setupNewTaskListener()

        setIsConnected(true)
      } catch (error) {
        console.error('Error initializing realtime sync:', error)
        setIsConnected(false)
      }
    }

    initializeSync()

    return () => {
      if (messageChannel) messageChannel.unsubscribe()
      if (taskChannel) taskChannel.unsubscribe()
      if (newTaskChannel) newTaskChannel.unsubscribe()
      setIsConnected(false)
    }
  }, [user, setupMessageListener, setupTaskUpdateListener, setupNewTaskListener, requestNotificationPermission])

  // Charger les notifications existantes au démarrage
  useEffect(() => {
    if (!user) return

    const loadExistingNotifications = async () => {
      try {
        const taskIds = await getUserTaskIds()
        if (taskIds.length === 0) return

        // Récupérer les messages récents non lus
        const { data: recentMessages } = await supabase
          .from('messages')
          .select(`
            id,
            task_id,
            sender,
            content,
            created_at,
            profiles!messages_sender_fkey (name),
            tasks!messages_task_id_fkey (title)
          `)
          .in('task_id', taskIds)
          .neq('sender', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (recentMessages) {
          const notifications: MessageNotification[] = recentMessages.map(msg => ({
            id: msg.id,
            task_id: msg.task_id,
            sender_id: msg.sender,
            sender_name: msg.profiles?.name || 'Anonyme',
            content: msg.content || '',
            task_title: msg.tasks?.title || 'Tâche',
            created_at: msg.created_at,
            is_read: false
          }))

          setMessageNotifications(notifications)
          setUnreadCount(notifications.length)
        }
      } catch (error) {
        console.error('Error loading existing notifications:', error)
      }
    }

    loadExistingNotifications()
  }, [user, getUserTaskIds])

  return {
    messageNotifications,
    taskUpdates,
    unreadCount,
    isConnected,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
    clearAllNotifications,
    requestNotificationPermission
  }
}
