import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send, Paperclip, Image, File, ArrowLeft, User, Clock, CheckCircle, AlertTriangle, Star, MapPin, Euro, Tag, Zap, TrendingUp, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { TaskWithProfiles } from '../types/task'
import type { Database } from '../lib/supabase'
import Header from './Header'

type Message = Database['public']['Tables']['messages']['Row'] & {
  sender_profile?: Database['public']['Tables']['profiles']['Row']
}

interface ChatViewProps {
  taskId: string
  onBack: () => void
}

export default function ChatView({ taskId, onBack }: ChatViewProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [task, setTask] = useState<TaskWithProfiles | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    loadTaskAndMessages()
    setupRealtimeSubscription()

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [taskId])

  const loadTaskAndMessages = async () => {
    try {
      // Charger la tâche
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select(`
          *,
          author_profile:profiles!tasks_author_fkey (
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
        .eq('id', taskId)
        .single()

      if (taskError) throw taskError
      setTask(taskData)

      // Charger les messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:profiles!messages_sender_fkey (
            id,
            name,
            avatar_url
          )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true })

      if (messagesError) throw messagesError
      setMessages(messagesData || [])
    } catch (error) {
      console.error('Error loading chat:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const sub = supabase
      .channel(`chat:${taskId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `task_id=eq.${taskId}`
        },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages(prev => [...prev, newMessage])
        }
      )
      .subscribe()

    setSubscription(sub)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !task) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          task_id: taskId,
          sender: user.id,
          content: newMessage.trim()
        })

      if (error) throw error

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Erreur lors de l\'envoi du message')
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Tâche non trouvée</p>
      </div>
    )
  }

  const otherParticipant = task.author === user?.id ? task.helper_profile : task.author_profile
  const canSendMessage = task.author === user?.id || task.helper === user?.id

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
             <Header
         title={task.title}
         subtitle={`Chat avec ${otherParticipant?.name || 'Utilisateur'}`}
         showSearch={false}
         showFilters={false}
         showViewToggle={false}
         showRefresh={false}
         onBack={onBack}
         participants={[
           task.author_profile?.name || 'Utilisateur',
           task.helper_profile?.name || 'Aideur'
         ].filter(Boolean)}
       />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender === user?.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.sender === user?.id ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {canSendMessage && (
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex space-x-2">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Paperclip className="w-5 h-5 text-gray-500" />
            </button>
            
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Tapez votre message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={sending}
            />
            
            <button
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
              className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
