import { useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { useMessages } from './useMessages'
import { supabase } from '../lib/supabase'

export function useMessageNotifications() {
  const { user } = useAuth()
  const { conversations } = useMessages()

  // Demander la permission pour les notifications
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('Ce navigateur ne supporte pas les notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      console.log('Permission de notification refusée')
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }, [])

  // Envoyer une notification locale
  const sendLocalNotification = useCallback((title: string, options: NotificationOptions = {}) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      })
    }
  }, [])

  // Configurer la synchronisation en temps réel pour les notifications
  useEffect(() => {
    if (!user) return

    // Demander la permission au montage
    requestNotificationPermission()

    // Écouter les nouveaux messages
    const subscription = supabase
      .channel('message_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as any
          
          // Ne pas notifier si c'est notre propre message
          if (newMessage.sender === user.id) return

          // Trouver la conversation correspondante
          const conversation = conversations.find(conv => conv.task.id === newMessage.task_id)
          if (!conversation) return

          // Envoyer une notification
          const senderName = conversation.otherParticipant?.name || 'Quelqu\'un'
          const taskTitle = conversation.task.title
          
          sendLocalNotification(
            `Nouveau message de ${senderName}`,
            {
              body: `"${newMessage.content}" - ${taskTitle}`,
              tag: `message_${newMessage.id}`,
              requireInteraction: false,
              actions: [
                {
                  action: 'open',
                  title: 'Ouvrir le chat'
                }
              ]
            }
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [user, conversations, requestNotificationPermission, sendLocalNotification])

  // Fonction pour envoyer une notification manuelle
  const sendNotification = useCallback((title: string, options: NotificationOptions = {}) => {
    sendLocalNotification(title, options)
  }, [sendLocalNotification])

  return {
    requestNotificationPermission,
    sendNotification,
    hasPermission: Notification.permission === 'granted'
  }
}
