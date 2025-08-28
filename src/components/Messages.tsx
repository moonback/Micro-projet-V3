import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Clock, CheckCircle, XCircle, User, MapPin, Euro, Calendar, ChevronRight, Search, RefreshCw, Filter } from 'lucide-react'
import { useMessages } from '../hooks/useMessages'
import type { Conversation } from '../types/task'
import Header from './Header'

interface MessagesProps {
  onChatOpen: (taskId: string) => void
}

export default function Messages({ onChatOpen }: MessagesProps) {
  const { conversations, loading, refresh } = useMessages()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'À l\'instant'
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`
    return `Il y a ${Math.floor(diffInMinutes / 1440)}j`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800'
      case 'assigned': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress': return 'bg-orange-100 text-orange-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || conv.task.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const statusFilters = [
    { value: 'all', label: 'Toutes', count: conversations.length },
    { value: 'open', label: 'Ouvertes', count: conversations.filter(c => c.task.status === 'open').length },
    { value: 'assigned', label: 'Assignées', count: conversations.filter(c => c.task.status === 'assigned').length },
    { value: 'in_progress', label: 'En cours', count: conversations.filter(c => c.task.status === 'in_progress').length },
    { value: 'completed', label: 'Terminées', count: conversations.filter(c => c.task.status === 'completed').length }
  ]

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white">
        <Header
          title="Messages"
          subtitle="Gérez vos conversations et échanges"
          showSearch={true}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showFilters={false}
          showViewToggle={false}
          showRefresh={true}
          onRefresh={refresh}
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <Header
        title="Messages"
        subtitle="Gérez vos conversations et échanges"
        showSearch={true}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showFilters={false}
        showViewToggle={false}
        showRefresh={true}
        onRefresh={refresh}
      />

      {/* Filtres de statut */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilterStatus(filter.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filterStatus === filter.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {filter.label}
              <span className="ml-1 text-xs opacity-75">({filter.count})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <MessageCircle className="w-12 h-12 mb-2" />
            <p>Aucune conversation trouvée</p>
            <p className="text-sm">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            <AnimatePresence>
              {filteredConversations.map((conversation, index) => (
                <motion.div
                  key={conversation.task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  onClick={() => onChatOpen(conversation.task.id)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                        {conversation.otherParticipant?.avatar_url ? (
                          <img
                            src={conversation.otherParticipant.avatar_url}
                            alt={conversation.otherParticipant.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span>
                            {conversation.otherParticipant?.name?.[0] || '?'}
                          </span>
                        )}
                      </div>
                      
                      {/* Indicateur de statut */}
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        conversation.task.status === 'completed' ? 'bg-green-500' :
                        conversation.task.status === 'in_progress' ? 'bg-orange-500' :
                        conversation.task.status === 'assigned' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`} />
                    </div>
                    
                    {/* Contenu de la conversation */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {conversation.otherParticipant?.name || 'Anonyme'}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(conversation.latestMessage.created_at)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 truncate mb-2">
                        {conversation.task.title}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 truncate flex-1">
                          {conversation.latestMessage.content || 'Média'}
                        </p>
                        
                        <div className="flex items-center space-x-2 ml-2">
                          {/* Statut de la tâche */}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(conversation.task.status)}`}>
                            {getStatusLabel(conversation.task.status)}
                          </span>
                          
                          {/* Compteur de messages non lus */}
                          {conversation.unreadCount > 0 && (
                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-semibold">
                                {conversation.unreadCount}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Flèche */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}