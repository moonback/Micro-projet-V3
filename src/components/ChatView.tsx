import React, { useState, useEffect, useRef } from 'react'
import { Send, ArrowLeft, Paperclip, MessageCircle, Image, File, X, Smile, MoreHorizontal, Check, CheckCheck, Clock, User, MapPin, Euro, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { TaskWithProfiles } from '../types/task'
import Header from './Header'

type Message = {
  id: string
  task_id: string
  sender: string
  content: string
  attachments?: any[]
  created_at: string
  sender_profile?: {
    id: string
    name?: string
    avatar_url?: string
  }
  is_sending?: boolean
  is_error?: boolean
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
  const [attachments, setAttachments] = useState<File[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadTaskAndMessages()
    setupRealtimeSubscription()
    setupTypingSubscription()

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
          // Charger le profil de l'expéditeur
          loadSenderProfile(newMessage).then(messageWithProfile => {
            setMessages(prev => [...prev, messageWithProfile])
          })
        }
      )
      .subscribe()

    setSubscription(sub)
  }

  const setupTypingSubscription = () => {
    const typingChannel = supabase.channel(`typing:${taskId}`)
    
    typingChannel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== user?.id) {
          setTypingUsers(prev => new Set(prev).add(payload.userId))
          setTimeout(() => {
            setTypingUsers(prev => {
              const newSet = new Set(prev)
              newSet.delete(payload.userId)
              return newSet
            })
          }, 3000)
        }
      })
      .subscribe()

    return typingChannel
  }

  const loadSenderProfile = async (message: Message): Promise<Message> => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .eq('id', message.sender)
        .single()
      
      return {
        ...message,
        sender_profile: profile || undefined
      }
    } catch (error) {
      console.error('Error loading sender profile:', error)
      return message
    }
  }

  const sendTypingIndicator = () => {
    if (!user) return
    
    const typingChannel = supabase.channel(`typing:${taskId}`)
    typingChannel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user.id, userName: user.user_metadata?.full_name || user.email }
    })
  }

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    if (e.target.value.length > 0) {
      sendTypingIndicator()
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !task) return

    const messageContent = newMessage.trim()
    const messageAttachments = attachments.length > 0 ? await uploadAttachments() : []

    // Ajouter le message localement immédiatement
    const localMessage: Message = {
      id: `local-${Date.now()}`,
      task_id: taskId,
      sender: user.id,
      content: messageContent,
      attachments: messageAttachments,
      created_at: new Date().toISOString(),
      sender_profile: {
        id: user.id,
        name: user.user_metadata?.full_name || user.email?.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url
      },
      is_sending: true
    }

    setMessages(prev => [...prev, localMessage])
    setNewMessage('')
    setAttachments([])
    setSending(true)

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          task_id: taskId,
          sender: user.id,
          content: messageContent,
          attachments: messageAttachments
        })

      if (error) throw error

      // Mettre à jour le message local
      setMessages(prev => prev.map(msg => 
        msg.id === localMessage.id 
          ? { ...msg, is_sending: false }
          : msg
      ))
    } catch (error) {
      console.error('Error sending message:', error)
      // Marquer le message comme en erreur
      setMessages(prev => prev.map(msg => 
        msg.id === localMessage.id 
          ? { ...msg, is_error: true, is_sending: false }
          : msg
      ))
      alert('Erreur lors de l\'envoi du message')
    } finally {
      setSending(false)
    }
  }

  const uploadAttachments = async (): Promise<any[]> => {
    const uploadedFiles = []
    
    for (const file of attachments) {
      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
        const filePath = `chat-attachments/${taskId}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(filePath)

        uploadedFiles.push({
          id: fileName,
          filename: file.name,
          url: publicUrl,
          file_type: file.type,
          file_size: file.size
        })
      } catch (error) {
        console.error('Error uploading attachment:', error)
      }
    }

    return uploadedFiles
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setAttachments(prev => [...prev, ...files])
    setShowAttachmentMenu(false)
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    setAttachments(prev => [...prev, ...imageFiles])
    setShowAttachmentMenu(false)
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit' 
      })
    }
  }

  const getMessageStatus = (message: Message) => {
    if (message.is_sending) {
      return <Clock className="w-4 h-4 text-gray-400" />
    }
    if (message.is_error) {
      return <X className="w-4 h-4 text-red-400" />
    }
    if (message.sender === user?.id) {
      return <CheckCheck className="w-4 h-4 text-blue-500" />
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100">
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
          <p className="text-gray-600 font-medium text-lg">Chargement du chat...</p>
        </motion.div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100">
        <p className="text-gray-500 text-lg">Tâche non trouvée</p>
      </div>
    )
  }

  const otherParticipant = task.author === user?.id ? task.helper_profile : task.author_profile
  const canSendMessage = task.author === user?.id || task.helper === user?.id

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header avec informations de la tâche */}
      <Header
        title={otherParticipant?.name || 'Chat'}
        subtitle={task.title}
        showSearch={false}
        showFilters={false}
        showViewToggle={false}
        showRefresh={false}
        leftButton={{
          icon: ArrowLeft,
          onClick: onBack,
          tooltip: 'Retour'
        }}
        className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 text-white shadow-lg"
      />

      {/* Informations de la tâche */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-white/20"
      >
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm">{task.title}</h3>
            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
              <div className="flex items-center space-x-1">
                <MapPin className="w-3 h-3" />
                <span>{task.city || task.address}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Euro className="w-3 h-3" />
                <span>{task.budget}€</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{task.deadline ? new Date(task.deadline).toLocaleDateString('fr-FR') : 'Pas de limite'}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Zone des messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.6, type: "spring" }}
              className={`flex ${message.sender === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md ${message.sender === user?.id ? 'order-2' : 'order-1'}`}>
                {/* Avatar de l'expéditeur */}
                {message.sender !== user?.id && (
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                      {message.sender_profile?.avatar_url ? (
                        <img
                          src={message.sender_profile.avatar_url}
                          alt={message.sender_profile.name || 'Utilisateur'}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                      {message.sender_profile?.name || 'Anonyme'}
                    </span>
                  </div>
                )}

                {/* Message */}
                <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                  message.sender === user?.id
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                    : 'bg-white text-gray-900'
                }`}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  
                  {/* Pièces jointes */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.attachments.map((attachment, attIndex) => (
                        <div key={attIndex} className="bg-white/20 rounded-lg p-2">
                          {attachment.file_type?.startsWith('image/') ? (
                            <img
                              src={attachment.url}
                              alt={attachment.filename}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="flex items-center space-x-2">
                              <File className="w-4 h-4" />
                              <span className="text-xs">{attachment.filename}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Statut du message */}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-70">
                      {formatTime(message.created_at)}
                    </span>
                    {getMessageStatus(message)}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Indicateur de frappe */}
        {typingUsers.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                  />
                </div>
                <span className="text-xs text-gray-500">En train d'écrire...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200">
        {/* Pièces jointes sélectionnées */}
        {attachments.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 flex flex-wrap gap-2"
          >
            {attachments.map((file, index) => (
              <div key={index} className="relative bg-gray-100 rounded-lg p-2">
                {file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    <File className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
                <p className="text-xs text-gray-600 mt-1 truncate w-16">{file.name}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Barre de saisie */}
        <div className="flex items-center space-x-3">
          {/* Bouton pièces jointes */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              <Paperclip className="w-5 h-5 text-gray-600" />
            </motion.button>

            {/* Menu des pièces jointes */}
            <AnimatePresence>
              {showAttachmentMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute bottom-12 left-0 bg-white rounded-2xl shadow-xl border border-gray-200 p-2 z-50"
                >
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="flex items-center space-x-2 w-full px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Image className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Image</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 w-full px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <File className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Fichier</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bouton emoji */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            <Smile className="w-5 h-5 text-gray-600" />
          </motion.button>

          {/* Champ de saisie */}
          <div className="flex-1">
            <input
              type="text"
              value={newMessage}
              onChange={handleMessageChange}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Tapez votre message..."
              disabled={!canSendMessage || sending}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Bouton d'envoi */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={sendMessage}
            disabled={!newMessage.trim() || !canSendMessage || sending}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              newMessage.trim() && canSendMessage && !sending
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {sending ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </motion.button>
        </div>

        {/* Inputs cachés pour les fichiers */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          multiple
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
          multiple
        />
      </div>
    </div>
  )
}
