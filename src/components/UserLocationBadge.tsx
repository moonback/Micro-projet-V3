import React from 'react'
import { MapPin } from 'lucide-react'

interface UserLocationBadgeProps {
  city?: string | null
  postal_code?: string | null
  country?: string | null
  className?: string
  showIcon?: boolean
  compact?: boolean
}

export default function UserLocationBadge({ 
  city, 
  postal_code, 
  country, 
  className = '',
  showIcon = true,
  compact = false
}: UserLocationBadgeProps) {
  if (!city && !postal_code && !country) {
    return null
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

  if (compact) {
    return (
      <div className={`flex items-center space-x-1 text-xs text-gray-500 ${className}`}>
        {showIcon && <MapPin className="w-3 h-3" />}
        <span className="truncate">{formatLocation()}</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-2 px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-600 ${className}`}>
      {showIcon && <MapPin className="w-3 h-3" />}
      <span>{formatLocation()}</span>
    </div>
  )
}
