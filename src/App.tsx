import React, { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import AuthForm from './components/AuthForm'
import BottomNavigation from './components/BottomNavigation'
import TaskFeed from './components/TaskFeed'
import CreateTask from './components/CreateTask'
import MyTasks from './components/MyTasks'
import Messages from './components/Messages'
import Profile from './components/Profile'
import type { Database } from './lib/supabase'

type Task = Database['public']['Tables']['tasks']['Row'] & {
  profiles?: Database['public']['Tables']['profiles']['Row']
}

function App() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('feed')

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
    // TODO: Navigate to task detail view
    console.log('Task pressed:', task)
  }

  const handleChatOpen = (taskId: string) => {
    // TODO: Navigate to chat view
    console.log('Chat opened for task:', taskId)
  }

  const renderActiveTab = () => {
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
      default:
        return <TaskFeed onTaskPress={handleTaskPress} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-md mx-auto bg-white shadow-lg min-h-screen flex flex-col">
        <main className="flex-1 pb-16 overflow-hidden">
          {renderActiveTab()}
        </main>
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  )
}

export default App