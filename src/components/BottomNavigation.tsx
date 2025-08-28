import React from 'react'
import { Home, Plus, ListTodo, MessageCircle, User, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

type View = 'splash' | 'home' | 'auth' | 'feed' | 'create' | 'my-tasks' | 'messages' | 'profile' | 'task-detail' | 'chat'

interface BottomNavigationProps {
  activeTab: View
  onTabChange: (tab: View) => void
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    { id: 'feed' as View, label: 'Accueil', icon: Home, color: 'blue' },
    { id: 'my-tasks' as View, label: 'Tâches', icon: ListTodo, color: 'purple' },
    { id: 'create' as View, label: 'Ajouter', icon: Plus, color: 'green' },
    { id: 'messages' as View, label: 'Messages', icon: MessageCircle, color: 'orange' },
    { id: 'profile' as View, label: 'Profil', icon: User, color: 'indigo' },
  ]

  const createTab = tabs.find(tab => tab.id === 'create');

  return (
    <motion.nav 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-600 text-white border-t border-white/20 safe-area-pb z-50 shadow-2xl"
    >
      <div className="flex justify-between items-center py-3 px-4">
        {tabs.map(({ id, label, icon: Icon, color }) => {
          const isActive = activeTab === id;
          
          if (id === 'create') {
            return (
              <motion.div
                key={id}
                className="relative -top-4 flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onTabChange(id)}
              >
                <motion.button
                  className={`flex items-center justify-center w-16 h-16 rounded-full text-white shadow-xl transition-all duration-300 transform ${
                    isActive 
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/25 ring-4 ring-white/20' 
                      : 'bg-gradient-to-br from-white/20 to-white/10 shadow-white/25 ring-2 ring-white/30'
                  }`}
                >
                  <Icon size={28} className="text-white" />
                </motion.button>
              </motion.div>
            );
          }

          const activeColorClasses = {
            blue: 'text-white bg-white/20',
            purple: 'text-white bg-white/20',
            orange: 'text-white bg-white/20',
            indigo: 'text-white bg-white/20'
          };

          const inactiveColorClasses = {
            blue: 'text-white/70 hover:text-white hover:bg-white/10',
            purple: 'text-white/70 hover:text-white hover:bg-white/10',
            orange: 'text-white/70 hover:text-white hover:bg-white/10',
            indigo: 'text-white/70 hover:text-white hover:bg-white/10'
          };

          return (
            <motion.button
              key={id}
              onClick={() => onTabChange(id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ease-in-out w-full max-w-[70px] group ${
                isActive ? activeColorClasses[color as keyof typeof activeColorClasses] : inactiveColorClasses[color as keyof typeof inactiveColorClasses]
              }`}
            >
              <div className="relative z-10 p-2 rounded-full transition-all duration-200">
                <Icon 
                  size={24} 
                  className="text-current"
                />
              </div>
              <span 
                className={`text-xs font-semibold mt-1 transition-all duration-200 text-current`}
              >
                {label}
              </span>
              
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 inset-x-0 mx-auto w-10 h-1 rounded-full bg-white/80"
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