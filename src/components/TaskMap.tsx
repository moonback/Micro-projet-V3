import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { TaskWithProfiles } from '../types/task'

interface TaskMapProps {
  tasks: TaskWithProfiles[]
  onTaskPress: (task: TaskWithProfiles) => void
  userLocation?: { lat: number; lng: number }
}

// Fix for default markers in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Format distance for display
const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km`
  } else {
    return `${Math.round(distance)}km`
  }
}

export default function TaskMap({ tasks, onTaskPress, userLocation }: TaskMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapContainerRef.current) return

    // Initialize map with better mobile support
    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      dragging: true,
      touchZoom: true,
      preferCanvas: false
    }).setView([48.8566, 2.3522], 13) // Paris

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      minZoom: 3
    }).addTo(mapRef.current)

    // Force a resize to ensure the map renders properly on mobile
    const resizeMap = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize()
      }
    }

    // Initial resize with delay
    setTimeout(resizeMap, 100)
    
    // Additional resize after a longer delay for mobile
    setTimeout(resizeMap, 500)
    
    // Resize on window resize
    window.addEventListener('resize', resizeMap)
    
    // Resize on orientation change (mobile)
    window.addEventListener('orientationchange', () => {
      setTimeout(resizeMap, 100)
    })

    return () => {
      window.removeEventListener('resize', resizeMap)
      window.removeEventListener('orientationchange', resizeMap)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current) return

    // Clear existing markers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapRef.current!.removeLayer(layer)
      }
    })

    // Add task markers
    tasks.forEach((task) => {
      if (task.location && mapRef.current) {
        // Parse PostGIS point format
        const coords = task.location.coordinates || task.location
        if (coords && coords.length >= 2) {
          // Calculate distance if user location is available
          let distanceText = ''
          if (userLocation) {
            const distance = calculateDistance(
              userLocation.lat, 
              userLocation.lng, 
              coords[1], 
              coords[0]
            )
            distanceText = formatDistance(distance)
          }

          const marker = L.marker([coords[1], coords[0]])
            .addTo(mapRef.current)
            .bindPopup(
              `<div class="p-3 min-w-[280px]">
                <div class="flex items-start space-x-3">
                  <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    ${task.category.charAt(0).toUpperCase()}
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center justify-between mb-2">
                      <h3 class="font-semibold text-gray-900 text-base">${task.title}</h3>
                      ${userLocation ? `
                        <div class="flex items-center space-x-1 text-blue-600">
                          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                          </svg>
                          <span class="text-sm font-medium">${distanceText}</span>
                        </div>
                      ` : ''}
                    </div>
                    <p class="text-sm text-gray-600 mb-3 line-clamp-2">${task.description}</p>
                    <div class="flex items-center justify-between mb-3">
                      <span class="font-semibold text-green-600 text-lg">€${task.budget}</span>
                      <span class="text-xs px-2 py-1 rounded-full ${
                        task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }">${task.priority}</span>
                    </div>
                    <div class="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>📅 ${task.deadline ? new Date(task.deadline).toLocaleDateString('fr-FR') : 'Non définie'}</span>
                      <span>⏱️ ${task.estimated_duration || 'Non définie'}h</span>
                    </div>
                    <button class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                      Voir les détails
                    </button>
                  </div>
                </div>
              </div>`
            )

          marker.on('click', () => onTaskPress(task))
        }
      }
    })

    // Fit map to markers if tasks exist
    if (tasks.length > 0) {
      const group = new L.FeatureGroup(
        tasks
          .filter(task => task.location)
          .map(task => {
            const coords = task.location!.coordinates || task.location!
            return L.marker([coords[1], coords[0]])
          })
      )
      
      if (group.getLayers().length > 0) {
        mapRef.current.fitBounds(group.getBounds().pad(0.1))
      }
    }
  }, [tasks, onTaskPress, userLocation])

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full min-h-[400px] md:min-h-[600px]"
      style={{
        height: '100%',
        minHeight: '400px',
        width: '100%',
        position: 'relative',
        zIndex: 1
      }}
    />
  )
}