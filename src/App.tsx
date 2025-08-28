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
import TaskHistory from './components/TaskHistory'
import TaskApplicationView from './components/TaskApplicationView'
import ChatView from './components/ChatView'
import NotificationToast from './components/NotificationToast'
import Logo from './components/Logo'
import type { TaskWithProfiles } from './types/task'

type View = 'splash' | 'home' | 'auth' | 'feed' | 'create' | 'my-tasks' | 'messages' | 'profile' | 'task-detail' | 'chat' | 'task-history' | 'task-application'

function App() {
  const { user, loading, profile } = useAuth() // Récupérer aussi le profile
  const { notifications, removeNotification } = useNotifications()
  const { hasPermission: hasNotificationPermission } = useMessageNotifications()
  const [currentView, setCurrentView] = useState<View>('splash')
  const [activeTab, setActiveTab] = useState<View>('feed')
  const [selectedTask, setSelectedTask] = useState<TaskWithProfiles | null>(null)
  const [chatTaskId, setChatTaskId] = useState<string | null>(null)
  const [hasSeenSplash, setHasSeenSplash] = useState(false)
  const [taskForApplication, setTaskForApplication] = useState<TaskWithProfiles | null>(null)

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

  const handleApplyToTask = (task: TaskWithProfiles) => {
    setTaskForApplication(task)
    setCurrentView('task-application')
  }

  const handleBackFromApplication = () => {
    setCurrentView('feed')
    setActiveTab('feed')
    setTaskForApplication(null)
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
        return <TaskFeed onTaskPress={handleTaskPress} onTaskAccepted={handleTaskAccepted} onApplyToTask={handleApplyToTask} />
      
      case 'create':
        return <CreateTask onBack={handleBackToFeed} />
      
      case 'my-tasks':
        return (
          <MyTasks
            onTaskPress={handleTaskPress}
            onCreateTask={() => setCurrentView('create')}
            onTaskAccepted={handleTaskAccepted}
            onBack={handleBackToFeed}
          />
        )
      
      case 'messages':
        return <Messages onChatOpen={handleChatOpen} />
      
      case 'profile':
        return <Profile onSignOut={handleSignOut} />
      
      case 'task-history':
        return (
          <TaskHistory
            onTaskPress={handleTaskPress}
            showApplications={true}
          />
        )
      
      case 'task-application':
        return taskForApplication ? (
          <TaskApplicationView
            task={taskForApplication}
            onBack={handleBackFromApplication}
            onChatOpen={handleChatOpen}
          />
        ) : (
          <div>Erreur : Tâche non trouvée</div>
        )
      
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
  const showBottomNavigation = !['splash', 'home', 'auth', 'task-detail', 'chat', 'task-application'].includes(currentView)

  // Détecter si on est sur desktop
  const [isDesktop, setIsDesktop] = useState(false)
  const [isSidebarVisible, setIsSidebarVisible] = useState(true)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Gérer la visibilité de la sidebar desktop
  const handleSidebarMouseEnter = () => {
    if (isDesktop) {
      setIsSidebarVisible(true)
    }
  }

  const handleSidebarMouseLeave = () => {
    if (isDesktop) {
      setIsSidebarVisible(false)
    }
  }

  // Afficher toujours le SplashScreen en premier
  if (!hasSeenSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Layout adaptatif : contraint sur mobile, plein écran sur desktop */}
      <div className={`${isDesktop ? 'w-full' : 'max-w-md mx-auto'} bg-white shadow-lg min-h-screen flex flex-col`}>
        <main className="flex-1 overflow-hidden">
          {renderCurrentView()}
        </main>
        {/* Navigation adaptative : bottom sur mobile, sidebar sur desktop */}
        {showBottomNavigation && (
          <>
            {/* Navigation mobile */}
            <div className="lg:hidden">
              <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
            </div>
            
            {/* Navigation desktop - sidebar latérale */}
            {isDesktop && (
              <>
                {/* Zone de déclenchement pour faire réapparaître la sidebar */}
                <div 
                  className="hidden lg:block fixed left-0 top-0 h-full w-2 bg-transparent z-30"
                  onMouseEnter={handleSidebarMouseEnter}
                />
                
                {/* Sidebar principale */}
                <div 
                  className={`hidden lg:block fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg z-40 transition-all duration-300 ease-in-out ${
                    isSidebarVisible ? 'w-64' : 'w-0'
                  }`}
                  onMouseEnter={handleSidebarMouseEnter}
                  onMouseLeave={handleSidebarMouseLeave}
                >
                  <div className={`p-6 transition-all duration-300 ${!isSidebarVisible ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <div className="mb-8">
                      <div className="flex items-center space-x-3 mb-2">
                        <Logo size="lg" />
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">MicroTask</h2>
                          <p className="text-sm text-gray-600">Navigation rapide</p>
                        </div>
                      </div>
                    </div>
                    
                    <nav className="space-y-2">
                      {[
                        { id: 'feed', label: 'Accueil', icon: '🏠' },
                        { id: 'my-tasks', label: 'Mes Tâches', icon: '📋' },
                        { id: 'create', label: 'Créer', icon: '➕' },
                        { id: 'messages', label: 'Messages', icon: '💬' },
                        { id: 'task-history', label: 'Tâche validees', icon: '📚' },
                        { id: 'profile', label: 'Profil', icon: '👤' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleTabChange(item.id as View)}
                          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                            activeTab === item.id
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          <span className="text-lg">{item.icon}</span>
                          <span className={`font-medium transition-all duration-300 ${!isSidebarVisible ? 'opacity-0' : 'opacity-100'}`}>
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </nav>
                    
                    {/* Informations utilisateur */}
                    {user && (
                      <div className={`mt-8 pt-6 border-t border-gray-200 transition-all duration-300 ${!isSidebarVisible ? 'opacity-0' : 'opacity-100'}`}>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {profile?.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {profile?.name || 'Utilisateur'}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        
                        <button
                          onClick={handleSignOut}
                          className="w-full mt-4 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                        >
                          Se déconnecter
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
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