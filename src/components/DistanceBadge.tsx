import React from 'react'
import { useDistanceCalculation } from '../hooks/useDistanceCalculation'
import type { TaskWithProfiles } from '../types/task'

interface DistanceBadgeProps {
  task: TaskWithProfiles
  variant?: 'default' | 'compact' | 'highlighted'
  showIcon?: boolean
  className?: string
}

export default function DistanceBadge({ 
  task, 
  variant = 'default', 
  showIcon = true,
  className = '' 
}: DistanceBadgeProps) {
  const { calculateDistance, hasUserLocation } = useDistanceCalculation()

  // Utiliser la localisation de la tâche elle-même, pas celle de l'auteur
  const taskLocation = {
    city: task.city,
    postal_code: task.postal_code,
    country: task.country,
    latitude: task.latitude,
    longitude: task.longitude
  }

  const distance = calculateDistance(taskLocation)

  if (!hasUserLocation) {
    return (
      <span className={`text-xs text-gray-500 ${className}`}>
        {taskLocation.city || taskLocation.postal_code || 'Localisation inconnue'}
      </span>
    )
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'text-xs font-medium'
      case 'highlighted':
        return 'text-sm font-semibold text-blue-700'
      default:
        return 'text-sm font-medium'
    }
  }

  return (
    <span className={`${getVariantClasses()} ${className}`}>
      {distance}
    </span>
  )
}
