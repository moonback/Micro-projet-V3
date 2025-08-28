import React from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Send, Eye, Clock, TrendingUp } from 'lucide-react'
import { useMessages } from '../hooks/useMessages'

export default function MessageStats() {
  const { conversations } = useMessages()

  // Calculer les statistiques
  const totalConversations = conversations.length
  const totalMessages = conversations.reduce((total, conv) => {
    // Estimation basée sur l'activité récente
    return total + (conv.latestMessage ? 1 : 0)
  }, 0)
  
  const unreadMessages = conversations.reduce((total, conv) => total + conv.unreadCount, 0)
  
  const activeConversations = conversations.filter(conv => 
    ['open', 'assigned', 'in_progress'].includes(conv.task.status)
  ).length

  const completedConversations = conversations.filter(conv => 
    conv.task.status === 'completed'
  ).length

  const stats = [
    {
      label: 'Conversations',
      value: totalConversations,
      icon: MessageCircle,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      label: 'Messages non lus',
      value: unreadMessages,
      icon: Eye,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
    {
      label: 'En cours',
      value: activeConversations,
      icon: Clock,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      label: 'Terminées',
      value: completedConversations,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    }
  ]

  if (totalConversations === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune conversation</h3>
          <p className="text-gray-600 text-sm">
            Commencez par accepter une tâche pour démarrer des conversations
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Statistiques des Messages</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <MessageCircle className="w-4 h-4" />
          <span>{totalMessages} messages au total</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className={`${stat.bgColor} rounded-xl p-4 border border-gray-100`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center shadow-sm`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <span className={`text-2xl font-bold ${stat.textColor}`}>
                {stat.value}
              </span>
            </div>
            <p className={`text-sm font-medium ${stat.textColor}`}>
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Graphique d'activité récente */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Activité récente</h4>
        <div className="space-y-2">
          {conversations.slice(0, 3).map((conv, index) => (
            <motion.div
              key={conv.task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  conv.task.status === 'completed' ? 'bg-green-500' :
                  conv.task.status === 'in_progress' ? 'bg-orange-500' :
                  conv.task.status === 'assigned' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`} />
                <span className="text-sm text-gray-700 truncate flex-1">
                  {conv.task.title}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span>{conv.unreadCount > 0 ? `${conv.unreadCount} non lu(s)` : 'À jour'}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
