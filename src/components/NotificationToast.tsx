import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle, CheckCircle, AlertTriangle, Bell, User, MapPin, Euro, Clock, Star, Zap } from 'lucide-react'
import { useRealtimeSync, type MessageNotification, type TaskUpdate } from '../hooks/useRealtimeSync'

export default function NotificationToast() {
  const {
    messageNotifications,
    taskUpdates,
    unreadCount,
    isConnected,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
    clearAllNotifications
  } = useRealtimeSync()

  const [showNotifications, setShowNotifications] = useState(false)
  const [activeTab, setActiveTab] = useState<'messages' | 'updates'>('messages')

  const totalUnread = messageNotifications.filter(n => !n.is_read).length + taskUpdates.length

  const formatTimeAgo = (timestamp: string): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInMinutes < 1) return 'À l\'instant'
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`
    if (diffInHours < 24) return `Il y a ${diffInHours}h`
    if (diffInDays < 7) return `Il y a ${diffInDays}j`
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  }

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'status_change': return CheckCircle
      case 'assigned': return User
      case 'completed': return Star
      case 'cancelled': return AlertTriangle
      default: return Bell
    }
  }

  const getUpdateColor = (type: string) => {
    switch (type) {
      case 'status_change': return 'from-blue-500 to-blue-600'
      case 'assigned': return 'from-green-500 to-green-600'
      case 'completed': return 'from-purple-500 to-purple-600'
      case 'cancelled': return 'from-red-500 to-red-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getUpdateLabel = (type: string) => {
    switch (type) {
      case 'status_change': return 'Changement de statut'
      case 'assigned': return 'Tâche assignée'
      case 'completed': return 'Tâche terminée'
      case 'cancelled': return 'Tâche annulée'
      default: return 'Mise à jour'
    }
  }

  return (
    <>
      {/* Bouton de notification flottant */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
        className="fixed top-6 right-6 z-50"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative w-14 h-14 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-full shadow-2xl hover:shadow-indigo-500/50 transition-all flex items-center justify-center"
        >
          <Bell className="w-7 h-7" />
          
          {/* Badge de notifications non lues */}
          {totalUnread > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center min-w-[24px]"
            >
              {totalUnread > 99 ? '99+' : totalUnread}
            </motion.div>
          )}

          {/* Indicateur de connexion */}
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
        </motion.button>
      </motion.div>

      {/* Panneau de notifications */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, x: 300, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-24 right-6 w-96 max-h-[80vh] bg-white rounded-3xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
          >
            {/* Header du panneau */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Notifications</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm opacity-90">
                    {isConnected ? 'Connecté' : 'Déconnecté'}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowNotifications(false)}
                    className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Onglets */}
              <div className="flex space-x-1 mt-3">
                {[
                  { id: 'messages', label: 'Messages', count: messageNotifications.length, icon: MessageCircle },
                  { id: 'updates', label: 'Mises à jour', count: taskUpdates.length, icon: CheckCircle }
                ].map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <motion.button
                      key={tab.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                      {tab.count > 0 && (
                        <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
                          {tab.count}
                        </span>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Actions rapides */}
            <div className="p-3 bg-gray-50 border-b border-gray-200">
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={markAllNotificationsAsRead}
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Tout marquer comme lu
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={clearAllNotifications}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Effacer tout
                </motion.button>
              </div>
            </div>

            {/* Contenu des notifications */}
            <div className="max-h-96 overflow-y-auto">
              <AnimatePresence mode="wait">
                {activeTab === 'messages' ? (
                  <motion.div
                    key="messages"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-3 space-y-3"
                  >
                    {messageNotifications.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Aucun nouveau message</p>
                      </div>
                    ) : (
                      messageNotifications.map((notification, index) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`bg-gray-50 rounded-xl p-3 border-l-4 ${
                            notification.is_read ? 'border-gray-300' : 'border-blue-500'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium text-gray-900 text-sm">
                                  {notification.sender_name}
                                </h4>
                                <span className="text-xs text-gray-500">
                                  {formatTimeAgo(notification.created_at)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mb-1">
                                Tâche: {notification.task_title}
                              </p>
                              <p className="text-sm text-gray-800 leading-relaxed">
                                {notification.content}
                              </p>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              {!notification.is_read && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => markNotificationAsRead(notification.id)}
                                  className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-600 transition-colors"
                                >
                                  ✓
                                </motion.button>
                              )}
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => removeNotification(notification.id)}
                                className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs hover:bg-red-500 hover:text-white transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="updates"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-3 space-y-3"
                  >
                    {taskUpdates.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Aucune mise à jour de tâche</p>
                      </div>
                    ) : (
                      taskUpdates.map((update, index) => {
                        const UpdateIcon = getUpdateIcon(update.type)
                        const updateColor = getUpdateColor(update.type)
                        
                        return (
                          <motion.div
                            key={`${update.task_id}-${update.timestamp}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-gray-50 rounded-xl p-3 border-l-4 border-blue-500"
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`w-10 h-10 bg-gradient-to-r ${updateColor} rounded-full flex items-center justify-center`}>
                                <UpdateIcon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-medium text-gray-900 text-sm">
                                    {getUpdateLabel(update.type)}
                                  </h4>
                                  <span className="text-xs text-gray-500">
                                    {formatTimeAgo(update.timestamp)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">
                                  {update.type === 'status_change' && (
                                    <>
                                      Statut changé de <span className="font-medium">{update.old_status}</span> à{' '}
                                      <span className="font-medium">{update.new_status}</span>
                                    </>
                                  )}
                                  {update.type === 'assigned' && (
                                    <>
                                      Tâche assignée à <span className="font-medium">{update.helper_name}</span>
                                    </>
                                  )}
                                  {update.type === 'completed' && (
                                    <>Tâche marquée comme terminée</>
                                  )}
                                  {update.type === 'cancelled' && (
                                    <>Tâche annulée</>
                                  )}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay pour fermer le panneau */}
      {showNotifications && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowNotifications(false)}
          className="fixed inset-0 bg-black/20 z-40"
        />
      )}
    </>
  )
}
