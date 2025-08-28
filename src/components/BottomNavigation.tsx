import React from 'react'
import { Home, Plus, ListTodo, User, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import MessageNotificationBadge from './MessageNotificationBadge'

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
    { id: 'messages' as View, label: 'Messages', icon: null, color: 'orange' },
    { id: 'profile' as View, label: 'Profil', icon: User, color: 'indigo' },
  ]

  const createTab = tabs.find(tab => tab.id === 'create');

  return (
    <motion.nav 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb z-50 shadow-lg"
    >
      <div className="flex justify-between items-center py-1 px-1">
        {tabs.map(({ id, label, icon, color }) => {
          const isActive = activeTab === id;
          
          if (id === 'create') {
            return (
              <motion.div
                key={id}
                className="relative -top-3 flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onTabChange(id)}
              >
                <motion.button
                  className={`flex items-center justify-center w-14 h-14 rounded-full text-white shadow-lg transition-all duration-300 transform ${
                    isActive 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/25 ring-2 ring-blue-200' 
                      : 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-gray-400/25 ring-1 ring-gray-200'
                  }`}
                >
                  {icon && React.createElement(icon, { size: 24, className: "text-white" })}
                </motion.button>
              </motion.div>
            );
          }

          const activeColorClasses = {
            blue: 'text-blue-600 bg-blue-50',
            purple: 'text-purple-600 bg-purple-50',
            orange: 'text-orange-600 bg-orange-50',
            indigo: 'text-indigo-600 bg-indigo-50'
          };

          const inactiveColorClasses = {
            blue: 'text-gray-500 hover:text-blue-600 hover:bg-blue-50/50',
            purple: 'text-gray-500 hover:text-purple-600 hover:bg-purple-50/50',
            orange: 'text-gray-500 hover:text-orange-600 hover:bg-orange-50/50',
            indigo: 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50'
          };

          // Gestion spéciale pour l'onglet messages
          if (id === 'messages') {
            return (
              <motion.button
                key={id}
                onClick={() => onTabChange(id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex flex-col items-center justify-center p-1.5 rounded-lg transition-all duration-200 ease-in-out w-full max-w-[60px] group ${
                  isActive ? activeColorClasses[color as keyof typeof activeColorClasses] : inactiveColorClasses[color as keyof typeof activeColorClasses]
                }`}
              >
                <div className="relative z-10 p-1.5 rounded-lg transition-all duration-200">
                  <MessageNotificationBadge className="text-current" />
                </div>
                <span 
                  className={`text-xs font-medium mt-0.5 transition-all duration-200 text-current`}
                >
                  {label}
                </span>
                
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 inset-x-0 mx-auto w-8 h-0.5 rounded-full bg-current"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            )
          }

          return (
            <motion.button
              key={id}
              onClick={() => onTabChange(id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative flex flex-col items-center justify-center p-1.5 rounded-lg transition-all duration-200 ease-in-out w-full max-w-[60px] group ${
                isActive ? activeColorClasses[color as keyof typeof activeColorClasses] : inactiveColorClasses[color as keyof typeof activeColorClasses]
              }`}
            >
              <div className="relative z-10 p-1.5 rounded-lg transition-all duration-200">
                {icon && React.createElement(icon, { 
                  size: 20, 
                  className: "text-current"
                })}
              </div>
              <span 
                className={`text-xs font-medium mt-0.5 transition-all duration-200 text-current`}
              >
                {label}
              </span>
              
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 inset-x-0 mx-auto w-8 h-0.5 rounded-full bg-current"
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