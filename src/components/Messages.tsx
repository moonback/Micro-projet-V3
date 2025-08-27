import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Clock, CheckCircle, XCircle, User, MapPin, Euro, Calendar, ChevronRight, Search, Filter, MoreHorizontal, Star, AlertTriangle, Zap } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Database } from '../lib/supabase'
import Header from './Header'

type Message = Database['public']['Tables']['messages']['Row'] & {
  profiles?: Database['public']['Tables']['profiles']['Row']
  tasks?: Database['public']['Tables']['tasks']['Row']
}

interface MessagesProps {
  onChatOpen: (taskId: string) => void
}

export default function Messages({ onChatOpen }: MessagesProps) {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'recent'>('all')
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    if (user) {
      loadConversations()
      setupRealtimeSubscription()
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [user])

  const setupRealtimeSubscription = () => {
    const sub = supabase
      .channel('messages-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          // Recharger les conversations quand un nouveau message arrive
          loadConversations()
        }
      )
      .subscribe()

    setSubscription(sub)
  }

  const loadConversations = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Get tasks where user is either author or helper
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          author,
          helper,
          status,
          budget,
          city,
          deadline,
          created_at,
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

      // Get latest message and unread count for each task
      const conversationsWithMessages = await Promise.all(
        (tasks || []).map(async (task: any) => {
          const { data: latestMessage } = await supabase
            .from('messages')
            .select('*')
            .eq('task_id', task.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          // Compter les messages non lus (messages reçus après la dernière visite)
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('task_id', task.id)
            .neq('sender', user.id)
            .gt('created_at', getLastVisitTime(task.id))

          const otherParticipant = task.author === user.id ? task.helper_profile : task.author_profile

          return {
            task,
            latestMessage,
            otherParticipant,
            unreadCount: unreadCount || 0,
            lastActivity: latestMessage?.created_at || task.created_at
          }
        })
      )

      // Filtrer et trier les conversations
      const validConversations = conversationsWithMessages
        .filter(conv => conv.latestMessage)
        .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())

      setConversations(validConversations)
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getLastVisitTime = (taskId: string): string => {
    // Récupérer le timestamp de la dernière visite depuis le localStorage
    const lastVisit = localStorage.getItem(`last_visit_${taskId}`)
    return lastVisit || new Date(0).toISOString()
  }

  const markAsRead = (taskId: string) => {
    // Marquer la conversation comme lue
    localStorage.setItem(`last_visit_${taskId}`, new Date().toISOString())
    // Mettre à jour le compteur local
    setConversations(prev => prev.map(conv => 
      conv.task.id === taskId ? { ...conv, unreadCount: 0 } : conv
    ))
  }

  const handleChatOpen = (taskId: string) => {
    markAsRead(taskId)
    onChatOpen(taskId)
  }

  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = conversation.task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conversation.otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conversation.latestMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = selectedFilter === 'all' ||
                         (selectedFilter === 'unread' && conversation.unreadCount > 0) ||
                         (selectedFilter === 'recent' && isRecent(conversation.lastActivity))

    return matchesSearch && matchesFilter
  })

  const isRecent = (timestamp: string): boolean => {
    const lastActivity = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60)
    return diffInHours < 24
  }

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return Clock
      case 'assigned': return CheckCircle
      case 'in_progress': return Zap
      case 'completed': return Star
      case 'cancelled': return XCircle
      default: return Clock
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'from-blue-500 to-blue-600'
      case 'assigned': return 'from-green-500 to-green-600'
      case 'in_progress': return 'from-orange-500 to-orange-600'
      case 'completed': return 'from-purple-500 to-purple-600'
      case 'cancelled': return 'from-red-500 to-red-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Ouverte'
      case 'assigned': return 'Assignée'
      case 'in_progress': return 'En cours'
      case 'completed': return 'Terminée'
      case 'cancelled': return 'Annulée'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-6 shadow-lg"
          />
          <p className="text-gray-600 font-medium text-lg">Chargement des conversations...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <Header
        title="Messages"
        subtitle={`${conversations.length} conversation${conversations.length > 1 ? 's' : ''}`}
        showSearch={false}
        showFilters={false}
        showViewToggle={false}
        showRefresh={false}
        className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 text-white shadow-lg"
      />

      {/* Barre de recherche et filtres */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="p-4 space-y-4"
      >
        {/* Barre de recherche */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher dans vos conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
          />
        </div>

        {/* Filtres */}
        <div className="flex space-x-2">
          {[
            { value: 'all', label: 'Toutes', icon: MessageCircle },
            { value: 'unread', label: 'Non lues', icon: AlertTriangle },
            { value: 'recent', label: 'Récentes', icon: Clock }
          ].map((filter) => {
            const Icon = filter.icon
            const isActive = selectedFilter === filter.value
            return (
              <motion.button
                key={filter.value}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedFilter(filter.value as any)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                    : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:text-gray-900 hover:bg-white shadow-sm hover:shadow-md'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{filter.label}</span>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <AnimatePresence mode="wait">
          {filteredConversations.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center h-64 text-center"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-28 h-28 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6 shadow-lg"
              >
                <MessageCircle className="w-14 h-14 text-gray-400" />
              </motion.div>
              <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-gray-900 mb-3"
              >
                Aucune conversation
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-500 mb-8 max-w-sm text-lg leading-relaxed"
              >
                {searchQuery || selectedFilter !== 'all'
                  ? 'Aucune conversation ne correspond à vos critères de recherche.'
                  : 'Vous n\'avez pas encore de conversations. Commencez par accepter une tâche !'
                }
              </motion.p>
            </motion.div>
          ) : (
            <motion.div 
              key="conversations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              {filteredConversations.map((conversation, index) => {
                const StatusIcon = getStatusIcon(conversation.task.status)
                const statusColor = getStatusColor(conversation.task.status)
                
                return (
                  <motion.div
                    key={conversation.task.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: index * 0.05, duration: 0.6, type: "spring" }}
                    whileHover={{ scale: 1.01, y: -2 }}
                    onClick={() => handleChatOpen(conversation.task.id)}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/20 cursor-pointer transition-all hover:shadow-lg"
                  >
                    <div className="flex items-start space-x-4">
                      {/* Avatar et statut */}
                      <div className="relative">
                        <div className="w-14 h-14 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                          {conversation.otherParticipant?.avatar_url ? (
                            <img
                              src={conversation.otherParticipant.avatar_url}
                              alt={conversation.otherParticipant.name}
                              className="w-14 h-14 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-7 h-7 text-white" />
                          )}
                        </div>
                        
                        {/* Indicateur de statut */}
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br ${statusColor} rounded-full flex items-center justify-center shadow-lg`}>
                          <StatusIcon className="w-3 h-3 text-white" />
                        </div>
                      </div>

                      {/* Contenu de la conversation */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg truncate">
                            {conversation.otherParticipant?.name || 'Anonyme'}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(conversation.lastActivity)}
                            </span>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>

                        {/* Titre de la tâche */}
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`w-2 h-2 bg-gradient-to-r ${statusColor} rounded-full`} />
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {conversation.task.title}
                          </p>
                        </div>

                        {/* Dernier message */}
                        <p className="text-sm text-gray-600 truncate mb-2">
                          {conversation.latestMessage?.content || 'Aucun message'}
                        </p>

                        {/* Informations supplémentaires */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              <span>{conversation.task.city || 'Localisation'}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Euro className="w-3 h-3" />
                              <span>{conversation.task.budget}€</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <StatusIcon className="w-3 h-3" />
                              <span>{getStatusLabel(conversation.task.status)}</span>
                            </div>
                          </div>

                          {/* Compteur de messages non lus */}
                          {conversation.unreadCount > 0 && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center"
                            >
                              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}