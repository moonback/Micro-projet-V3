import React, { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useNotifications } from './hooks/useNotifications'
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
import type { Database } from './lib/supabase'

type Task = Database['public']['Tables']['tasks']['Row'] & {
  author_profile?: Database['public']['Tables']['profiles']['Row']
}

type View = 'feed' | 'create' | 'my-tasks' | 'messages' | 'profile' | 'task-detail' | 'chat'

function App() {
  const { user, loading } = useAuth()
  const { notifications, removeNotification } = useNotifications()
  const [activeTab, setActiveTab] = useState<View>('feed')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [chatTaskId, setChatTaskId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task)
    setActiveTab('task-detail')
  }

  const handleChatOpen = (taskId: string) => {
    setChatTaskId(taskId)
    setActiveTab('chat')
  }

  const handleBackToFeed = () => {
    setActiveTab('feed')
    setSelectedTask(null)
    setChatTaskId(null)
  }

  const handleBackToTaskDetail = () => {
    setActiveTab('task-detail')
    setChatTaskId(null)
  }

  const handleTabChange = (tab: View) => {
    if (tab === 'feed') {
      setSelectedTask(null)
      setChatTaskId(null)
    }
    setActiveTab(tab)
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'feed':
        return <TaskFeed onTaskPress={handleTaskPress} />
      case 'create':
        return <CreateTask />
      case 'my-tasks':
        return (
          <MyTasks
            onTaskPress={handleTaskPress}
            onCreateTask={() => setActiveTab('create')}
          />
        )
      case 'messages':
        return <Messages onChatOpen={handleChatOpen} />
      case 'profile':
        return <Profile />
      case 'task-detail':
        return selectedTask ? (
          <TaskDetail
            task={selectedTask}
            onBack={handleBackToFeed}
            onChatOpen={handleChatOpen}
          />
        ) : (
          <TaskFeed onTaskPress={handleTaskPress} />
        )
      case 'chat':
        return chatTaskId ? (
          <ChatView
            taskId={chatTaskId}
            onBack={handleBackToTaskDetail}
          />
        ) : (
          <TaskFeed onTaskPress={handleTaskPress} />
        )
      default:
        return <TaskFeed onTaskPress={handleTaskPress} />
    }
  }

  // Ne pas afficher la navigation pour les vues détaillées
  const showBottomNavigation = !['task-detail', 'chat'].includes(activeTab)

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-md mx-auto bg-white shadow-lg min-h-screen flex flex-col">
        <main className="flex-1 pb-16 overflow-hidden">
          {renderActiveView()}
        </main>
        {showBottomNavigation && (
          <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        )}
      </div>

      {/* Notifications */}
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          type={notification.type}
          message={notification.message}
          isVisible={true}
          onClose={() => removeNotification(notification.id)}
          duration={notification.duration}
        />
      ))}
    </div>
  )
}

export default App