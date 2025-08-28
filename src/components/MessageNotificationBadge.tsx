import React from 'react'
import { MessageCircle } from 'lucide-react'
import { useMessages } from '../hooks/useMessages'

interface MessageNotificationBadgeProps {
  className?: string
}

export default function MessageNotificationBadge({ className = '' }: MessageNotificationBadgeProps) {
  const { conversations } = useMessages()
  
  // Calculer le nombre total de messages non lus
  const totalUnread = conversations.reduce((total, conv) => total + conv.unreadCount, 0)
  
  if (totalUnread === 0) {
    return (
      <div className={`relative ${className}`}>
        <MessageCircle className="w-6 h-6 text-gray-600" />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <MessageCircle className="w-6 h-6 text-gray-600" />
      
      {/* Badge de notification */}
      <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
        <span className="text-white text-xs font-bold">
          {totalUnread > 99 ? '99+' : totalUnread}
        </span>
      </div>
      
      {/* Animation de pulsation */}
      <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-400 rounded-full animate-ping opacity-75" />
    </div>
  )
}
