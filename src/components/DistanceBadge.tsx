import React from 'react'
import { MapPin, Navigation } from 'lucide-react'
import { useDistanceCalculation } from '../hooks/useDistanceCalculation'
import type { TaskWithProfiles } from '../types/task'

interface DistanceBadgeProps {
  task: TaskWithProfiles
  className?: string
  showIcon?: boolean
  variant?: 'default' | 'compact' | 'highlighted'
}

export default function DistanceBadge({ 
  task, 
  className = '',
  showIcon = true,
  variant = 'default'
}: DistanceBadgeProps) {
  const { getDistanceToTask, hasUserLocation } = useDistanceCalculation()
  
  const distance = getDistanceToTask(task)

  if (!hasUserLocation || !distance) {
    return null
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'text-xs text-gray-500 flex items-center space-x-1'
      case 'highlighted':
        return 'px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium flex items-center space-x-1'
      default:
        return 'px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs flex items-center space-x-1'
    }
  }

  const getDistanceColor = () => {
    const distanceValue = parseFloat(distance.replace(' km', '').replace('< ', ''))
    if (distanceValue < 1) return 'text-green-600'
    if (distanceValue < 5) return 'text-blue-600'
    if (distanceValue < 10) return 'text-orange-600'
    return 'text-gray-600'
  }

  return (
    <div className={`${getVariantClasses()} ${className}`}>
      {showIcon && (
        <Navigation className="w-3 h-3" />
      )}
      <span className={getDistanceColor()}>
        {distance}
      </span>
    </div>
  )
}
