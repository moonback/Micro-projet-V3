import React, { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useAuthSync } from './hooks/useAuthSync'
import { useNotifications } from './hooks/useNotifications'
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
import { ConnectionStatus } from './components/ConnectionStatus'
import { AuthDebug } from './components/AuthDebug'
import type { TaskWithProfiles } from './types/task'

type View = 'splash' | 'home' | 'auth' | 'feed' | 'create' | 'my-tasks' | 'messages' | 'profile' | 'task-detail' | 'chat'

function App() {
  const { user, profile, loading, profileLoading } = useAuth()
  const { isFullyAuthenticated, forceSync, checkSessionState } = useAuthSync()
  const { notifications, removeNotification } = useNotifications()
  const [currentView, setCurrentView] = useState<View>('splash')
  const [activeTab, setActiveTab] = useState<View>('feed')
  const [selectedTask, setSelectedTask] = useState<TaskWithProfiles | null>(null)
  const [chatTaskId, setChatTaskId] = useState<string | null>(null)
  const [hasSeenSplash, setHasSeenSplash] = useState(false)

  // Debug: Afficher l'état d'authentification
  useEffect(() => {
    console.log('App - Auth state changed:', { 
      user: user?.id, 
      profile: profile?.id, 
      loading, 
      profileLoading,
      isFullyAuthenticated 
    })
  }, [user, profile, loading, profileLoading, isFullyAuthenticated])

  // Debug: Vérifier l'état de la session au chargement
  useEffect(() => {
    checkSessionState()
  }, [checkSessionState])

  // Gérer la navigation après le splash
  useEffect(() => {
    if (hasSeenSplash) {
      if (isFullyAuthenticated) {
        console.log('User fully authenticated, navigating to feed')
        setCurrentView('feed')
        setActiveTab('feed')
      } else if (!user && !loading) {
        console.log('No user, navigating to home')
        setCurrentView('home')
      }
      // Si user existe mais pas de profil, on attend que la synchronisation se termine
    }
  }, [hasSeenSplash, isFullyAuthenticated, user, loading])

  // Gérer le changement d'état d'authentification
  useEffect(() => {
    if (hasSeenSplash && !loading) {
      if (isFullyAuthenticated) {
        console.log('Auth state: User fully authenticated')
        // Ne pas forcer la navigation si l'utilisateur est déjà sur une autre vue
        if (currentView === 'splash' || currentView === 'home' || currentView === 'auth') {
          setCurrentView('feed')
          setActiveTab('feed')
        }
      } else if (!user) {
        console.log('Auth state: No user, going to home')
        setCurrentView('home')
      } else if (user && !profile) {
        console.log('Auth state: User exists but profile not loaded, forcing sync...')
        // Forcer la synchronisation si nécessaire
        setTimeout(() => {
          if (user && !profile) {
            forceSync()
          }
        }, 1000)
      }
    }
  }, [user, profile, loading, hasSeenSplash, isFullyAuthenticated, forceSync, currentView])

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
    console.log('Tab changed to:', tab)
    
    // Nettoyer les états spécifiques
    if (tab === 'feed') {
      setSelectedTask(null)
      setChatTaskId(null)
    }
    
    // Mettre à jour l'onglet actif et la vue
    setActiveTab(tab)
    setCurrentView(tab)
    
    console.log('Current view set to:', tab)
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

  if (loading && !hasSeenSplash) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement de MicroTask...</p>
        </div>
      </div>
    )
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

      {/* Statut de connexion */}
      <ConnectionStatus />

      {/* Composant de débogage (développement uniquement) */}
      <AuthDebug />

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