import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from './hooks/useAuth'
import SplashScreen from './components/SplashScreen'
import HomePage from './components/HomePage'
import AuthForm from './components/AuthForm'
import TaskFeed from './components/TaskFeed'
import CreateTask from './components/CreateTask'
import MyTasks from './components/MyTasks'
import AcceptedTasks from './components/AcceptedTasks'
import PendingRequests from './components/PendingRequests'
import Messages from './components/Messages'
import Profile from './components/Profile'
import TaskDetail from './components/TaskDetail'
import ChatView from './components/ChatView'
import BottomNavigation from './components/BottomNavigation'
import { showNotification } from './components/NotificationToast'
import type { Database } from './lib/supabase'

type Task = Database['public']['Tables']['tasks']['Row'] & {
  author_profile?: Database['public']['Tables']['profiles']['Row']
}

type View = 'splash' | 'home' | 'auth' | 'feed' | 'create' | 'my-tasks' | 'accepted-tasks' | 'pending-requests' | 'messages' | 'profile' | 'task-detail' | 'chat'

function App() {
  const [currentView, setCurrentView] = useState<View>('splash')
  const [hasSeenSplash, setHasSeenSplash] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [chatTaskId, setChatTaskId] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (hasSeenSplash) {
      if (user) {
        setCurrentView('feed')
      } else {
        setCurrentView('home')
      }
    }
  }, [hasSeenSplash, user])

  useEffect(() => {
    if (authLoading) return

    if (user && currentView === 'home') {
      setCurrentView('feed')
    } else if (!user && currentView === 'feed') {
      setCurrentView('home')
    }
  }, [user, authLoading, currentView])

  const handleSplashComplete = () => {
    setHasSeenSplash(true)
  }

  const handleGetStarted = () => {
    if (user) {
      setCurrentView('feed')
    } else {
      setCurrentView('auth')
    }
  }

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task)
    setCurrentView('task-detail')
  }

  const handleChatOpen = (taskId: string) => {
    setChatTaskId(taskId)
    setCurrentView('chat')
  }

  const handleBackToFeed = () => {
    setSelectedTask(null)
    setCurrentView('feed')
  }

  const handleBackToTaskDetail = () => {
    setChatTaskId(null)
    setCurrentView('task-detail')
  }

  const handleTabChange = (tab: View) => {
    if (tab === 'task-detail' && !selectedTask) {
      return
    }
    if (tab === 'chat' && !chatTaskId) {
      return
    }
    setCurrentView(tab)
  }

  const handleSignOut = async () => {
    try {
      // Sign out logic here
      setCurrentView('home')
      showNotification('success', 'Déconnexion réussie')
    } catch (error) {
      showNotification('error', 'Erreur lors de la déconnexion')
    }
  }

  const handleTaskAccepted = (taskId: string) => {
    showNotification('success', 'Demande d\'approbation envoyée !')
    // Optionally refresh the feed
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'splash':
        return <SplashScreen onComplete={handleSplashComplete} />
      
      case 'home':
        return <HomePage onGetStarted={handleGetStarted} />
      
      case 'auth':
        return <AuthForm />
      
      case 'feed':
        return (
          <TaskFeed 
            onTaskPress={handleTaskPress}
            onTaskAccepted={handleTaskAccepted}
          />
        )
      
      case 'create':
        return <CreateTask />
      
      case 'my-tasks':
        return (
          <MyTasks 
            onTaskPress={handleTaskPress}
            onCreateTask={() => setCurrentView('create')}
            onTaskAccepted={handleTaskAccepted}
          />
        )
      
      case 'accepted-tasks':
        return <AcceptedTasks />
      
      case 'pending-requests':
        return <PendingRequests />
      
      case 'messages':
        return <Messages onChatOpen={handleChatOpen} />
      
      case 'profile':
        return <Profile onSignOut={handleSignOut} />
      
      case 'task-detail':
        return selectedTask ? (
          <TaskDetail 
            task={selectedTask}
            onBack={handleBackToFeed}
            onChatOpen={handleChatOpen}
          />
        ) : null
      
      case 'chat':
        return chatTaskId ? (
          <ChatView 
            taskId={chatTaskId}
            onBack={handleBackToTaskDetail}
          />
        ) : null
      
      default:
        return <TaskFeed onTaskPress={handleTaskPress} />
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderCurrentView()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation du bas - seulement pour les vues principales */}
      {user && !['splash', 'home', 'auth', 'task-detail', 'chat'].includes(currentView) && (
        <BottomNavigation 
          activeTab={currentView} 
          onTabChange={handleTabChange}
        />
      )}
    </div>
  )
}

export default App