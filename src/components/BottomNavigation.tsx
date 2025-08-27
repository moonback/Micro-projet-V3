import React from 'react'
import { Home, Plus, ListTodo, MessageCircle, User, MapPin, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'

type View = 'splash' | 'home' | 'auth' | 'feed' | 'create' | 'my-tasks' | 'accepted-tasks' | 'messages' | 'profile' | 'task-detail' | 'chat'

interface BottomNavigationProps {
  activeTab: View
  onTabChange: (tab: View) => void
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    { id: 'feed' as View, label: 'Accueil', icon: Home, color: 'blue' },
    { id: 'create' as View, label: 'Nouvelle', icon: Plus, color: 'green' },
    { id: 'my-tasks' as View, label: 'Mes Tâches', icon: ListTodo, color: 'purple' },
    { id: 'accepted-tasks' as View, label: 'Acceptées', icon: CheckCircle, color: 'orange' },
    { id: 'messages' as View, label: 'Messages', icon: MessageCircle, color: 'indigo' },
    { id: 'profile' as View, label: 'Profil', icon: User, color: 'pink' },
  ]

  return (
    <motion.nav 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb z-50 shadow-lg"
    >
      <div className="flex justify-around items-center py-3 px-2">
        {tabs.map(({ id, label, icon: Icon, color }) => {
          const isActive = activeTab === id
          const colorClasses = {
            blue: 'text-blue-600 bg-blue-50',
            green: 'text-green-600 bg-green-50',
            purple: 'text-purple-600 bg-purple-50',
            orange: 'text-orange-600 bg-orange-50',
            indigo: 'text-indigo-600 bg-indigo-50',
            pink: 'text-pink-600 bg-pink-50'
          }
          
          return (
            <motion.button
              key={id}
              onClick={() => onTabChange(id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center justify-center min-h-[56px] px-2 py-2 rounded-2xl transition-all duration-200 ${
                isActive 
                  ? `${colorClasses[color as keyof typeof colorClasses]} shadow-md` 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} className="mb-1" />
              <span className="text-xs font-medium">{label}</span>
              
              {/* Indicateur actif */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-1 w-2 h-2 bg-current rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </motion.nav>
  )
}