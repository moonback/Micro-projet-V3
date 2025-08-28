import React, { useState } from 'react'
import { MessageCircle, Clock, User, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useConversations } from '../hooks/useConversations'
import type { ConversationListItem } from '../types/task'

interface ConversationListProps {
  onSelectConversation: (taskId: string) => void
  selectedTaskId?: string
}

export default function ConversationList({ onSelectConversation, selectedTaskId }: ConversationListProps) {
  const { conversations, loading, error, refreshConversations } = useConversations()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.otherParticipant?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Toujours filtrer pour ne montrer que les conversations avec des messages
    const hasMessages = conv.lastMessage !== 'Aucun message'
    return matchesSearch && hasMessages
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'in_progress':
        return <AlertCircle className="w-4 h-4 text-blue-500" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return 'À l\'instant'
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit' 
      })
    }
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-500 mb-2">Erreur lors du chargement</p>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button
          onClick={refreshConversations}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Réessayer
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Aucune conversation avec messages trouvée</p>
        <p className="text-sm text-gray-400">
          Vous n'avez pas encore de conversations avec des messages
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Barre de recherche et rafraîchissement */}
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Rechercher une conversation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <MessageCircle className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        </div>
        <button
          onClick={refreshConversations}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          title="Rafraîchir les conversations"
        >
          <RefreshCw className="w-5 h-5 text-gray-500" />
        </button>
      </div>



      {/* Liste des conversations */}
      {filteredConversations.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucun résultat trouvé</p>
          <p className="text-sm text-gray-400">
            Essayez de modifier vos critères de recherche
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filteredConversations.map((conversation, index) => (
              <motion.div
                key={conversation.taskId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                onClick={() => onSelectConversation(conversation.taskId)}
                className={`
                  p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md
                  ${selectedTaskId === conversation.taskId 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* En-tête avec titre et statut */}
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium text-gray-900 truncate">
                        {conversation.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(conversation.status)}`}>
                        {conversation.status === 'open' && 'Ouverte'}
                        {conversation.status === 'in_progress' && 'En cours'}
                        {conversation.status === 'completed' && 'Terminée'}
                      </span>
                    </div>

                    {/* Dernier message */}
                    <p className="text-sm text-gray-600 truncate mb-2">
                      {conversation.lastMessage}
                    </p>

                    {/* Informations de la conversation */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{conversation.otherParticipant?.name || 'Utilisateur'}</span>
                        </div>
                        <span>•</span>
                        <span>{formatTime(conversation.lastMessageTime)}</span>
                      </div>
                      
                      {/* Badge de messages non lus */}
                      {conversation.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
