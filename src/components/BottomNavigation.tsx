import React from 'react'
import { motion } from 'framer-motion'
import { Home, Plus, CheckCircle, Clock, MessageCircle, User } from 'lucide-react'

type View = 'splash' | 'home' | 'auth' | 'feed' | 'create' | 'my-tasks' | 'accepted-tasks' | 'pending-requests' | 'messages' | 'profile' | 'task-detail' | 'chat'

interface BottomNavigationProps {
  activeTab: View
  onTabChange: (tab: View) => void
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    { id: 'feed', label: 'Accueil', icon: Home },
    { id: 'create', label: 'Créer', icon: Plus },
    { id: 'my-tasks', label: 'Mes Tâches', icon: CheckCircle },
    { id: 'accepted-tasks', label: 'Acceptées', icon: CheckCircle },
    { id: 'pending-requests', label: 'En Attente', icon: Clock },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'profile', label: 'Profil', icon: User }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id as View)}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-xl transition-colors ${
                isActive 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
              <span className="text-xs font-medium">{tab.label}</span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}