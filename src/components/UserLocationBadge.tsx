import React from 'react'
import { MapPin } from 'lucide-react'

interface UserLocationBadgeProps {
  city?: string
  postal_code?: string
  country?: string
  compact?: boolean
  showIcon?: boolean
  className?: string
}

export default function UserLocationBadge({ 
  city, 
  postal_code, 
  country, 
  compact = false,
  showIcon = true,
  className = '' 
}: UserLocationBadgeProps) {
  if (!city && !postal_code && !country) {
    return (
      <span className={`text-xs text-gray-400 ${className}`}>
        Localisation inconnue
      </span>
    )
  }

  const formatLocation = () => {
    if (city && postal_code) {
      return `${city} (${postal_code})`
    }
    if (city) {
      return city
    }
    if (postal_code) {
      return postal_code
    }
    if (country && country !== 'France') {
      return country
    }
    return 'Localisation inconnue'
  }

  const getSizeClasses = () => {
    if (compact) {
      return 'text-xs'
    }
    return 'text-sm'
  }

  return (
    <div className={`flex items-center space-x-1 ${getSizeClasses()} ${className}`}>
      {showIcon && <MapPin className="w-3 h-3 text-gray-400" />}
      <span className="text-gray-600">{formatLocation()}</span>
    </div>
  )
}
