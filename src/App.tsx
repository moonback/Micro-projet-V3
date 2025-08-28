import React, { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useNotifications } from './hooks/useNotifications'
import { useMessageNotifications } from './hooks/useMessageNotifications'
import SplashScreen from './components/SplashScreen'
import HomePage from './components/HomePage'
import AuthForm from './components/AuthForm'
import BottomNavigation from './components/BottomNavigation'
import TaskFeed from './components/TaskFeed'
import CreateTask from './components/CreateTask'
import MyTasks from './components/MyTasks'
import Messages from './components/Messages'
import Profile from './components/Profile'
import TaskDetail from './components/TaskDetail'
import ChatView from './components/ChatView'
import NotificationToast from './components/NotificationToast'
import type { TaskWithProfiles } from './types/task'

type View = 'splash' | 'home' | 'auth' | 'feed' | 'create' | 'my-tasks' | 'messages' | 'profile' | 'task-detail' | 'chat'

function App() {
  const { user, loading, profile } = useAuth() // Récupérer aussi le profile
  const { notifications, removeNotification } = useNotifications()
  const { hasPermission: hasNotificationPermission } = useMessageNotifications()
  const [currentView, setCurrentView] = useState<View>('splash')
  const [activeTab, setActiveTab] = useState<View>('feed')
  const [selectedTask, setSelectedTask] = useState<TaskWithProfiles | null>(null)
  const [chatTaskId, setChatTaskId] = useState<string | null>(null)
  const [hasSeenSplash, setHasSeenSplash] = useState(false)

  // Gérer la navigation après le splash et l'état d'authentification
  useEffect(() => {
    if (!loading) { // Attendre que useAuth ait terminé son chargement initial
      if (user && profile) { // S'assurer que l'utilisateur ET le profil sont chargés
        setCurrentView('feed')
      } else if (!user) {
        setCurrentView('home')
      }
    }
  }, [loading, user, profile]) // Dépendances claires

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

  const handleTaskPress = (task: TaskWithProfiles) => {
    setSelectedTask(task)
    setActiveTab('task-detail')
    setCurrentView('task-detail')
  }

  const handleChatOpen = (taskId: string) => {
    setChatTaskId(taskId)
    setActiveTab('chat')
    setCurrentView('chat')
  }

  const handleBackToFeed = () => {
    setCurrentView('feed')
    setActiveTab('feed')
    setSelectedTask(null)
    setChatTaskId(null)
  }

  const handleBackToTaskDetail = () => {
    setCurrentView('task-detail')
    setActiveTab('task-detail')
    setChatTaskId(null)
  }

  const handleTabChange = (tab: View) => {
    if (tab === 'feed') {
      setSelectedTask(null)
      setChatTaskId(null)
    }
    setActiveTab(tab)
    setCurrentView(tab)
  }

  const handleSignOut = () => {
    setCurrentView('home')
    setActiveTab('feed')
    setSelectedTask(null)
    setChatTaskId(null)
  }

  const handleTaskAccepted = (taskId: string) => {
    // Optionnel : recharger les tâches ou mettre à jour l'état
    console.log('Task accepted:', taskId)
    // Ici vous pourriez mettre à jour l'état local ou recharger les tâches
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
        return <TaskFeed onTaskPress={handleTaskPress} onTaskAccepted={handleTaskAccepted} />
      
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
        ) : (
          <TaskFeed onTaskPress={handleTaskPress} onTaskAccepted={handleTaskAccepted} />
        )
      
      case 'chat':
        return chatTaskId ? (
          <ChatView
            taskId={chatTaskId}
            onBack={handleBackToTaskDetail}
          />
        ) : (
          <TaskFeed onTaskPress={handleTaskPress} onTaskAccepted={handleTaskAccepted} />
        )
      
      default:
        return <TaskFeed onTaskPress={handleTaskPress} onTaskAccepted={handleTaskAccepted} />
    }
  }

  // Ne pas afficher la navigation pour les vues spéciales
  const showBottomNavigation = !['splash', 'home', 'auth', 'task-detail', 'chat'].includes(currentView)



  // Afficher toujours le SplashScreen en premier
  if (!hasSeenSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white shadow-lg min-h-screen flex flex-col">
        <main className="flex-1 overflow-hidden">
          {renderCurrentView()}
        </main>
        {showBottomNavigation && (
          <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        )}
      </div>

      {/* Nouveau système de notifications */}
      <NotificationToast />

      {/* Ancien système de notifications pour compatibilité */}
      {notifications.map((notification) => (
        <div key={notification.id} className="hidden">
          {/* Les anciennes notifications sont maintenant gérées par react-hot-toast */}
        </div>
      ))}
    </div>
  )
}

export default App