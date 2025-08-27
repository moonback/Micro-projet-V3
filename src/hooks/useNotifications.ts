import { useState, useCallback } from 'react'
import type { NotificationType } from '../components/NotificationToast'

interface Notification {
  id: string
  type: NotificationType
  message: string
  duration?: number
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((
    type: NotificationType,
    message: string,
    duration: number = 5000
  ) => {
    const id = Date.now().toString()
    const notification: Notification = { id, type, message, duration }
    
    setNotifications(prev => [...prev, notification])
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const success = useCallback((message: string, duration?: number) => {
    addNotification('success', message, duration)
  }, [addNotification])

  const error = useCallback((message: string, duration?: number) => {
    addNotification('error', message, duration)
  }, [addNotification])

  const warning = useCallback((message: string, duration?: number) => {
    addNotification('warning', message, duration)
  }, [addNotification])

  const info = useCallback((message: string, duration?: number) => {
    addNotification('info', message, duration)
  }, [addNotification])

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info
  }
}
