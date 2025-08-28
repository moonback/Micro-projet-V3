import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, ArrowLeft } from 'lucide-react'
import ConversationList from './ConversationList'
import ChatView from './ChatView'
import Header from './Header'

interface MessagesProps {
  onChatOpen: (taskId: string) => void
}

export default function Messages({ onChatOpen }: MessagesProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'chat'>('list')

  const handleSelectConversation = (taskId: string) => {
    setSelectedTaskId(taskId)
    setView('chat')
  }

  const handleBackToList = () => {
    setView('list')
    setSelectedTaskId(null)
  }

  // Si une conversation est sélectionnée, afficher le chat
  if (view === 'chat' && selectedTaskId) {
    return (
      <ChatView 
        taskId={selectedTaskId} 
        onBack={handleBackToList} 
      />
    )
  }

  // Sinon, afficher la liste des conversations
  return (
    <div className="flex flex-col h-full bg-white">
      <Header
        title="Messages"
        subtitle="Gérez vos conversations et échanges"
        showSearch={false}
        showFilters={false}
        showViewToggle={false}
        showRefresh={false}
      />
      
      <div className="flex-1 overflow-y-auto p-4">
        <ConversationList
          onSelectConversation={handleSelectConversation}
          selectedTaskId={selectedTaskId}
        />
      </div>
    </div>
  )
}