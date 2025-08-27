import React from 'react'
import { Home, Plus, ListTodo, MessageCircle, User } from 'lucide-react'

type View = 'splash' | 'home' | 'auth' | 'feed' | 'create' | 'my-tasks' | 'messages' | 'profile' | 'task-detail' | 'chat'

interface BottomNavigationProps {
  activeTab: View
  onTabChange: (tab: View) => void
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    { id: 'feed' as View, label: 'Accueil', icon: Home },
    { id: 'create' as View, label: 'Nouvelle Tâche', icon: Plus },
    { id: 'my-tasks' as View, label: 'Mes Tâches', icon: ListTodo },
    { id: 'messages' as View, label: 'Messages', icon: MessageCircle },
    { id: 'profile' as View, label: 'Profil', icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb z-50">
      <div className="flex justify-around items-center py-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center justify-center min-h-[44px] px-2 py-1 rounded-lg transition-colors ${
              activeTab === id
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon size={20} className="mb-1" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}