import React, { useState, useEffect } from 'react'
import { MessageCircle, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Database } from '../lib/supabase'

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

  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user])

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

      // Get latest message for each task
      const conversationsWithMessages = await Promise.all(
        (tasks || []).map(async (task: any) => {
          const { data: latestMessage } = await supabase
            .from('messages')
            .select('*')
            .eq('task_id', task.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          const otherParticipant = task.author === user.id ? task.helper_profile : task.author_profile

          return {
            task,
            latestMessage,
            otherParticipant,
            unreadCount: 0 // TODO: Implement unread count
          }
        })
      )

      setConversations(conversationsWithMessages.filter(conv => conv.latestMessage))
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'À l\'instant'
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`
    return `Il y a ${Math.floor(diffInMinutes / 1440)}j`
  }

  const filteredConversations = conversations.filter(conv =>
    conv.task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Messages</h1>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Rechercher des conversations..."
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <MessageCircle className="w-12 h-12 mb-2" />
            <p>Aucune conversation pour le moment</p>
            <p className="text-sm">Commencez par accepter une tâche</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.task.id}
                onClick={() => onChatOpen(conversation.task.id)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    {conversation.otherParticipant?.avatar_url ? (
                      <img
                        src={conversation.otherParticipant.avatar_url}
                        alt={conversation.otherParticipant.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 font-medium">
                        {conversation.otherParticipant?.name?.[0] || '?'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {conversation.otherParticipant?.name || 'Anonyme'}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(conversation.latestMessage.created_at)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 truncate mb-1">
                      {conversation.task.title}
                    </p>
                    
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.latestMessage.content || 'Média'}
                    </p>
                  </div>
                  
                  {conversation.unreadCount > 0 && (
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">
                        {conversation.unreadCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}