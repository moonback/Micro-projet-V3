import React from 'react'
import { Clock, MapPin, Euro, User } from 'lucide-react'
import type { Database } from '../lib/supabase'

type Task = Database['public']['Tables']['tasks']['Row'] & {
  author_profile?: Database['public']['Tables']['profiles']['Row']
}

interface TaskCardProps {
  task: Task
  onPress: (task: Task) => void
}

export default function TaskCard({ task, onPress }: TaskCardProps) {
  const formatDistance = (location: any) => {
    // In a real app, calculate distance based on user's location
    return 'à 1,2 km'
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'À l\'instant'
    if (diffInHours < 24) return `Il y a ${diffInHours}h`
    return `Il y a ${Math.floor(diffInHours / 24)}j`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800'
      case 'accepted': return 'bg-blue-100 text-blue-800'
      case 'in-progress': return 'bg-orange-100 text-orange-800'
      case 'completed': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Ouverte'
      case 'accepted': return 'Acceptée'
      case 'in-progress': return 'En Cours'
      case 'completed': return 'Terminée'
      default: return status
    }
  }

  return (
    <div
      onClick={() => onPress(task)}
      className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">
            {task.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2 mb-2">
            {task.description}
          </p>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
          {getStatusLabel(task.status)}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
        <div className="flex items-center">
          <User className="w-4 h-4 mr-1" />
          <span>{task.author_profile?.name || 'Anonyme'}</span>
        </div>
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-1" />
          <span>{formatTimeAgo(task.created_at)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{task.address || formatDistance(task.location)}</span>
        </div>
        <div className="flex items-center font-semibold text-lg text-green-600">
          <Euro className="w-5 h-5 mr-1" />
          <span>{task.budget}</span>
        </div>
      </div>

      {task.category && (
        <div className="mt-3">
          <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
            {task.category}
          </span>
        </div>
      )}
    </div>
  )
}