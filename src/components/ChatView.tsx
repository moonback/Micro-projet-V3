import React, { useState, useEffect, useRef } from 'react'
import { Send, ArrowLeft, Paperclip, MessageCircle, Image, File, Download, Eye, EyeOff, MoreVertical, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMessages } from '../hooks/useMessages'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import type { TaskWithProfiles, MessageAttachment } from '../types/task'
import Header from './Header'

interface ChatViewProps {
  taskId: string
  onBack: () => void
}

export default function ChatView({ taskId, onBack }: ChatViewProps) {
  const { user } = useAuth()
  const { 
    messages, 
    loading, 
    sending, 
    hasMore, 
    sendMessage, 
    loadMessages, 
    markMessagesAsRead 
  } = useMessages({ taskId })
  
  const [newMessage, setNewMessage] = useState('')
  const [task, setTask] = useState<TaskWithProfiles | null>(null)
  const [showAttachments, setShowAttachments] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    loadTask()
    loadMessages(taskId, true)
  }, [taskId])

  const loadTask = async () => {
    try {
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
    } catch (error) {
      console.error('Error loading task:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() && selectedFiles.length === 0) return

    try {
      let attachments: MessageAttachment[] = []
      
      // Upload des fichiers si présents
      if (selectedFiles.length > 0) {
        setUploading(true)
        attachments = await uploadFiles(selectedFiles)
        setSelectedFiles([])
      }

      await sendMessage(taskId, newMessage.trim(), attachments)
      setNewMessage('')
      setShowAttachments(false)
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Erreur lors de l\'envoi du message')
    } finally {
      setUploading(false)
    }
  }

  const uploadFiles = async (files: File[]): Promise<MessageAttachment[]> => {
    const attachments: MessageAttachment[] = []
    
    for (const file of files) {
      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        
        const { data, error } = await supabase.storage
          .from('chat-attachments')
          .upload(fileName, file)

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(fileName)

        attachments.push({
          id: data.path,
          filename: file.name,
          url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          uploaded_at: new Date().toISOString()
        })
      } catch (error) {
        console.error('Error uploading file:', error)
      }
    }
    
    return attachments
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }

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

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Utilisateur non connecté</p>
      </div>
    )
  }

  const otherParticipant = task.author === user?.id ? task.helper_profile : task.author_profile
  
  // Permettre l'envoi de messages si :
  // 1. Vous êtes l'auteur de la tâche
  // 2. Vous êtes l'aideur assigné
  // 3. La tâche est ouverte et vous voulez postuler
  const canSendMessage = task.author === user?.id || 
                        task.helper === user?.id || 
                        (task.status === 'open' && user?.id)
  
  // Debug: vérifier les permissions
  console.log('Debug ChatView:', {
    userId: user?.id,
    taskAuthor: task.author,
    taskHelper: task.helper,
    canSendMessage,
    user,
    task
  })

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <Header
        title={task.title}
        subtitle={`Chat avec ${otherParticipant?.name || 'Utilisateur'}`}
        showSearch={false}
        showFilters={false}
        showViewToggle={false}
        showRefresh={true}
        onRefresh={() => loadMessages(taskId, true)}
        onBack={onBack}
        participants={[
          task.author_profile?.name || 'Utilisateur',
          task.helper_profile?.name || 'Aideur'
        ].filter(Boolean)}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {hasMore && (
          <div className="text-center">
            <button
              onClick={() => loadMessages(taskId, false)}
              className="text-blue-600 text-sm hover:underline"
            >
              Charger plus de messages
            </button>
          </div>
        )}

        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className={`flex ${message.sender === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                  message.sender === user?.id
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                {/* Contenu du message */}
                <p className="text-sm leading-relaxed">{message.content}</p>
                
                {/* Pièces jointes */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className={`flex items-center space-x-2 p-2 rounded-lg ${
                          message.sender === user?.id
                            ? 'bg-blue-500/20'
                            : 'bg-gray-100'
                        }`}
                      >
                        {getFileIcon(attachment.file_type)}
                        <span className="text-xs truncate flex-1">{attachment.filename}</span>
                        <button
                          onClick={() => window.open(attachment.url, '_blank')}
                          className="p-1 rounded hover:bg-white/20 transition-colors"
                          title="Voir le fichier"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = attachment.url
                            link.download = attachment.filename
                            link.click()
                          }}
                          className="p-1 rounded hover:bg-white/20 transition-colors"
                          title="Télécharger"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Métadonnées du message */}
                <div className={`flex items-center justify-between mt-2 text-xs ${
                  message.sender === user?.id ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  <span>{formatTime(message.created_at)}</span>
                  {message.sender !== user?.id && (
                    <span className="flex items-center space-x-1">
                      {message.is_read ? (
                        <EyeOff className="w-3 h-3" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      {canSendMessage && (
        <div className="p-4 border-t border-gray-200 bg-white">
        {/* Pièces jointes sélectionnées */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Fichiers sélectionnés ({selectedFiles.length})
              </span>
              <button
                onClick={() => setSelectedFiles([])}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Tout supprimer
              </button>
            </div>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex items-center space-x-2">
                    {getFileIcon(file.type)}
                    <span className="text-sm text-gray-700 truncate">{file.name}</span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          {/* Bouton pièces jointes */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Ajouter des pièces jointes"
          >
            <Paperclip className="w-5 h-5 text-gray-500" />
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          
          {/* Zone de saisie */}
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={1}
              disabled={sending || uploading}
            />
          </div>
          
          {/* Bouton d'envoi */}
          <button
            onClick={handleSendMessage}
            disabled={sending || uploading || (!newMessage.trim() && selectedFiles.length === 0)}
            className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
          >
            {sending || uploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      )}
    </div>
  )
}
