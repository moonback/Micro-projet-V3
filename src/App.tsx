import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ListTodo, Plus, MessageCircle, User, History, LogOut, Settings, Bell, Zap, Star, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { LocationProvider } from './contexts/LocationContext';
import SplashScreen from './components/SplashScreen';
import HomePage from './components/HomePage';
import AuthForm from './components/AuthForm';
import TaskFeed from './components/TaskFeed';
import CreateTask from './components/CreateTask';
import MyTasks from './components/MyTasks';
import Messages from './components/Messages';
import Profile from './components/Profile';
import TaskDetail from './components/TaskDetail';
import TaskHistory from './components/TaskHistory';
import TaskApplicationView from './components/TaskApplicationView';
import ChatView from './components/ChatView';
import NotificationToast from './components/NotificationToast';
import Logo from './components/Logo';
import type { TaskWithProfiles } from './types/task';

// Enum pour une meilleure sécurité de type
enum View {
  Splash = 'splash',
  Home = 'home',
  Auth = 'auth',
  Feed = 'feed',
  Create = 'create',
  MyTasks = 'my-tasks',
  Messages = 'messages',
  Profile = 'profile',
  TaskDetail = 'task-detail',
  Chat = 'chat',
  TaskHistory = 'task-history',
  TaskApplication = 'task-application',
}

// Configuration de la navigation
const NAVIGATION_CONFIG = {
  viewsWithoutNavigation: new Set([View.Splash, View.Home, View.Auth, View.TaskDetail, View.Chat, View.TaskApplication]),
  items: [
    { id: View.Feed, label: 'Accueil', icon: Home, color: 'from-blue-500 to-cyan-600', description: 'Découvrir des tâches' },
    { id: View.MyTasks, label: 'Mes Tâches', icon: ListTodo, color: 'from-green-500 to-emerald-600', description: 'Gérer mes tâches' },
    { id: View.Create, label: 'Créer', icon: Plus, color: 'from-purple-500 to-pink-600', description: 'Nouvelle tâche' },
    { id: View.Messages, label: 'Messages', icon: MessageCircle, color: 'from-orange-500 to-red-600', description: 'Conversations' },
    { id: View.TaskHistory, label: 'Historique', icon: History, color: 'from-indigo-500 to-purple-600', description: 'Tâches validées' },
    { id: View.Profile, label: 'Profil', icon: User, color: 'from-gray-500 to-slate-600', description: 'Mon compte' }
  ]
} as const;

// Types pour une meilleure sécurité
interface AppLayoutProps {
  children: React.ReactNode;
  currentView: View;
  onTabChange: (view: View) => void;
  user: any;
  profile: any;
  signOut: () => Promise<void>;
}

interface UserStats {
  tasksCreated: number;
  tasksAccepted: number;
  averageRating: number;
}

// Composant de layout amélioré
const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  currentView, 
  onTabChange, 
  user, 
  profile, 
  signOut 
}) => {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [screenSize, setScreenSize] = useState<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('lg');

  // Détection intelligente de la taille d'écran avec breakpoints
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      let newScreenSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
      let newIsDesktop: boolean;
      let newIsSidebarCollapsed: boolean;

      if (width < 640) {
        newScreenSize = 'sm';
        newIsDesktop = false;
        newIsSidebarCollapsed = false;
      } else if (width < 768) {
        newScreenSize = 'md';
        newIsDesktop = false;
        newIsSidebarCollapsed = false;
      } else if (width < 1024) {
        newScreenSize = 'lg';
        newIsDesktop = false;
        newIsSidebarCollapsed = false;
      } else if (width < 1280) {
        newScreenSize = 'xl';
        newIsDesktop = true;
        newIsSidebarCollapsed = width < 1200; // Collapse automatiquement sur les écrans moyens
      } else {
        newScreenSize = '2xl';
        newIsDesktop = true;
        newIsSidebarCollapsed = false;
      }

      setScreenSize(newScreenSize);
      setIsDesktop(newIsDesktop);
      setIsSidebarVisible(newIsDesktop);
      setIsSidebarCollapsed(newIsSidebarCollapsed);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Gestion intelligente de la sidebar selon la taille d'écran
  const handleSidebarMouseEnter = useCallback(() => {
    if (isDesktop && isSidebarCollapsed && screenSize !== '2xl') {
      setIsSidebarVisible(true);
    }
  }, [isDesktop, isSidebarCollapsed, screenSize]);

  const handleSidebarMouseLeave = useCallback(() => {
    if (isDesktop && isSidebarCollapsed && screenSize !== '2xl') {
      setIsSidebarVisible(false);
    }
  }, [isDesktop, isSidebarCollapsed, screenSize]);

  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
    if (!isSidebarCollapsed) {
      setIsSidebarVisible(false);
    } else {
      setIsSidebarVisible(true);
    }
  }, [isSidebarCollapsed]);

  // Largeurs adaptatives selon la taille d'écran
  const getSidebarWidth = useCallback(() => {
    if (isSidebarCollapsed) {
      return 'w-16'; // Plus compact sur mobile
    }
    
    switch (screenSize) {
      case 'xl':
        return 'w-64'; // Largeur moyenne sur écrans moyens
      case '2xl':
        return 'w-80'; // Largeur maximale sur grands écrans
      default:
        return 'w-72'; // Largeur par défaut
    }
  }, [isSidebarCollapsed, screenSize]);

  const getMainContentMargin = useCallback(() => {
    if (isSidebarCollapsed) {
      return 'ml-10';
    }
    
    switch (screenSize) {
      case 'xl':
        return 'ml-64';
      case '2xl':
        return 'ml-80';
      default:
        return 'ml-72';
    }
  }, [isSidebarCollapsed, screenSize]);

  const showNavigation = !NAVIGATION_CONFIG.viewsWithoutNavigation.has(currentView);

  if (!showNavigation) {
    return (
      <div className="min-h-screen bg-white shadow-lg lg:max-w-md lg:mx-auto flex flex-col">
        {children}
      </div>
    );
  }

  // Layout Desktop avec sidebar adaptative
  if (isDesktop) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        {/* Zone de déclenchement pour la sidebar (seulement sur écrans moyens) */}
        {screenSize === 'xl' && (
          <div 
            className="fixed left-0 top-0 h-full w-2 bg-transparent z-30"
            onMouseEnter={handleSidebarMouseEnter}
          />
        )}
        
        {/* Sidebar principale avec largeur adaptative */}
        <motion.aside
          initial={{ x: -320 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className={`fixed left-0 top-0 h-full bg-white/95 backdrop-blur-sm border-r border-gray-200/50 shadow-2xl z-40 transition-all duration-500 ease-in-out ${getSidebarWidth()}`}
          onMouseEnter={handleSidebarMouseEnter}
          onMouseLeave={handleSidebarMouseLeave}
        >
          <div className={`h-full flex flex-col transition-all duration-500 ${
            isSidebarCollapsed ? 'px-3' : 'px-6'
          }`}>
            {/* En-tête de la sidebar */}
            <div className={`flex items-center justify-between mb-8 pt-6 ${
              isSidebarCollapsed ? 'flex-col space-y-3' : 'flex-row'
            }`}>
              <div className={`flex items-center space-x-3 ${
                isSidebarCollapsed ? 'flex-col space-y-2' : 'flex-row'
              }`}>
                <Logo size="lg" />
                <div className={`transition-all duration-500 ${
                  isSidebarCollapsed 
                    ? 'opacity-0 h-0 overflow-hidden' 
                    : 'opacity-100 h-auto'
                }`}>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    MicroTask
                  </h2>
                  <p className="text-sm text-gray-600">Navigation rapide</p>
                </div>
              </div>
              
              {/* Bouton de collapse/expand (seulement sur écrans moyens) */}
              {screenSize === 'xl' && (
                <button
                  onClick={toggleSidebarCollapse}
                  className={`p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-200 ${
                    isSidebarCollapsed ? 'rotate-180' : ''
                  }`}
                  title={isSidebarCollapsed ? 'Développer' : 'Réduire'}
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>
            
            {/* Navigation principale */}
            <nav className="flex-1 space-y-2">
              {NAVIGATION_CONFIG.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.02, x: isSidebarCollapsed ? 0 : 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onTabChange(item.id)}
                    className={`group w-full flex items-center space-x-3 px-3 py-3 rounded-2xl text-left transition-all duration-300 ${
                      isActive
                        ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md'
                    } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                  >
                    <div className={`p-2 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-white/20' 
                        : 'bg-gray-100 group-hover:bg-gray-200'
                    }`}>
                      <Icon className={`w-5 h-5 transition-all duration-300 ${
                        isActive ? 'text-white' : 'text-gray-600 group-hover:text-gray-800'
                      }`} />
                    </div>
                    
                    <div className={`transition-all duration-500 ${
                      isSidebarCollapsed 
                        ? 'opacity-0 w-0 overflow-hidden' 
                        : 'opacity-100 w-auto'
                    }`}>
                      <div className="font-semibold text-sm">{item.label}</div>
                      <div className={`text-xs transition-all duration-300 ${
                        isActive ? 'text-white/80' : 'text-gray-500'
                      }`}>
                        {item.description}
                      </div>
                    </div>
                    
                    {/* Indicateur de statut actif */}
                    {isActive && !isSidebarCollapsed && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="w-2 h-2 bg-white rounded-full ml-auto"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </nav>
            
            {/* Informations utilisateur */}
            {user && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={`pt-6 border-t border-gray-200 transition-all duration-500 ${
                  isSidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
              >
                <div className={`flex items-center space-x-3 mb-4 ${
                  isSidebarCollapsed ? 'flex-col space-y-2' : 'flex-row'
                }`}>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">
                      {profile?.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className={`flex-1 min-w-0 ${
                    isSidebarCollapsed ? 'text-center' : ''
                  }`}>
                    <p className="font-semibold text-gray-900 truncate">
                      {profile?.name || 'Utilisateur'}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <button className="w-full px-4 py-2 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors text-sm font-medium flex items-center justify-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span className={isSidebarCollapsed ? 'sr-only' : ''}>Paramètres</span>
                  </button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={signOut}
                    className="w-full px-4 py-2 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className={isSidebarCollapsed ? 'sr-only' : ''}>Se déconnecter</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.aside>
        
        {/* Contenu principal avec marge adaptative */}
        <main className={`flex-1 overflow-auto  transition-all duration-500 ease-in-out ${getMainContentMargin()}`}>
          {children}
        </main>
      </div>
    );
  }

  // Layout Mobile et Tablet avec navigation bottom adaptative
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
      
      {/* Navigation bottom adaptative selon la taille d'écran */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200/50 shadow-lg p-2 ${
          screenSize === 'sm' ? 'max-w-sm mx-auto' : ''
        }`}
      >
        <div className={`flex justify-around ${
          screenSize === 'sm' ? 'space-x-1' : 'space-x-2'
        }`}>
          {NAVIGATION_CONFIG.items.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`${
                  screenSize === 'sm' ? 'w-5 h-5' : 'w-6 h-6'
                }`} />
                <span className={`font-medium mt-1 ${
                  screenSize === 'sm' ? 'text-xs' : 'text-sm'
                }`}>
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

// Composant principal App optimisé
function App() {
  const { user, loading, profile, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>(View.Splash);
  const [selectedTask, setSelectedTask] = useState<TaskWithProfiles | null>(null);
  const [chatTaskId, setChatTaskId] = useState<string | null>(null);
  const [hasSeenSplash, setHasSeenSplash] = useState(false);
  const [taskForApplication, setTaskForApplication] = useState<TaskWithProfiles | null>(null);

  // Gestion de la navigation après le splash et l'authentification
  useEffect(() => {
    if (!loading) {
      if (user && profile) {
        setCurrentView(View.Feed);
      } else if (!user) {
        setCurrentView(View.Home);
      }
    }
  }, [loading, user, profile]);

  // Handlers optimisés avec useCallback
  const handleSplashComplete = useCallback(() => {
    setHasSeenSplash(true);
  }, []);

  const handleGetStarted = useCallback(() => {
    setCurrentView(user ? View.Feed : View.Auth);
  }, [user]);

  const handleTaskPress = useCallback((task: TaskWithProfiles) => {
    setSelectedTask(task);
    setCurrentView(View.TaskDetail);
  }, []);

  const handleChatOpen = useCallback((taskId: string) => {
    setChatTaskId(taskId);
    setCurrentView(View.Chat);
  }, []);

  const handleTabChange = useCallback((tab: View) => {
    if (tab === View.Feed) {
      setSelectedTask(null);
      setChatTaskId(null);
    }
    setCurrentView(tab);
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      setCurrentView(View.Home);
      setSelectedTask(null);
      setChatTaskId(null);
      setTaskForApplication(null);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // En cas d'erreur, rediriger quand même
      setCurrentView(View.Home);
      setSelectedTask(null);
      setChatTaskId(null);
      setTaskForApplication(null);
    }
  }, [signOut]);

  const handleApplyToTask = useCallback((task: TaskWithProfiles) => {
    setTaskForApplication(task);
    setCurrentView(View.TaskApplication);
  }, []);

  // Rendu des vues optimisé avec useMemo
  const currentViewComponent = useMemo(() => {
    switch (currentView) {
      case View.Splash:
        return <SplashScreen onComplete={handleSplashComplete} />;
      case View.Home:
        return <HomePage onGetStarted={handleGetStarted} />;
      case View.Auth:
        return <AuthForm />;
      case View.Feed:
        return <TaskFeed onTaskPress={handleTaskPress} onApplyToTask={handleApplyToTask} />;
      case View.Create:
        return <CreateTask onBack={() => setCurrentView(View.MyTasks)} />;
      case View.MyTasks:
        return (
          <MyTasks 
            onTaskPress={handleTaskPress} 
            onCreateTask={() => setCurrentView(View.Create)} 
            onBack={() => setCurrentView(View.Feed)} 
          />
        );
      case View.Messages:
        return <Messages onChatOpen={handleChatOpen} />;
      case View.Profile:
        return <Profile onSignOut={handleSignOut} />;
      case View.TaskHistory:
        return <TaskHistory onTaskPress={handleTaskPress} showApplications={true} />;
      case View.TaskApplication:
        return taskForApplication ? (
          <TaskApplicationView 
            task={taskForApplication} 
            onBack={() => setCurrentView(View.Feed)} 
            onChatOpen={handleChatOpen} 
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Erreur : Tâche non trouvée
          </div>
        );
      case View.TaskDetail:
        return selectedTask ? (
          <TaskDetail 
            task={selectedTask} 
            onBack={() => setCurrentView(View.Feed)} 
            onChatOpen={handleChatOpen} 
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Erreur : Tâche non trouvée
          </div>
        );
      case View.Chat:
        return chatTaskId ? (
          <ChatView 
            taskId={chatTaskId} 
            onBack={() => setCurrentView(View.TaskDetail)} 
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Erreur : Chat non trouvé
          </div>
        );
      default:
        return <TaskFeed onTaskPress={handleTaskPress} onApplyToTask={handleApplyToTask} />;
    }
  }, [
    currentView, 
    selectedTask, 
    chatTaskId, 
    taskForApplication, 
    handleSplashComplete, 
    handleGetStarted, 
    handleTaskPress, 
    handleChatOpen, 
    handleSignOut, 
    handleApplyToTask
  ]);

  // Affichage du splash screen
  if (!hasSeenSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <LocationProvider>
      <AppLayout 
        currentView={currentView} 
        onTabChange={handleTabChange} 
        user={user} 
        profile={profile} 
        signOut={handleSignOut}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            {currentViewComponent}
          </motion.div>
        </AnimatePresence>
      </AppLayout>
      
      <NotificationToast />
    </LocationProvider>
  );
}

export default App;