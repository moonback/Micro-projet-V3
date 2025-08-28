import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { TaskWithProfiles } from '../types/task'

interface TaskMapProps {
  tasks: TaskWithProfiles[]
  onTaskPress: (task: TaskWithProfiles) => void
}

// Fix for default markers in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

export default function TaskMap({ tasks, onTaskPress }: TaskMapProps) {
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
          const marker = L.marker([coords[1], coords[0]])
            .addTo(mapRef.current)
            .bindPopup(
              `<div class="p-2">
                <h3 class="font-semibold mb-1">${task.title}</h3>
                <p class="text-sm text-gray-600 mb-2">${task.description}</p>
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-green-600">€${task.budget}</span>
                  <button class="bg-blue-600 text-white px-2 py-1 rounded text-xs">Voir</button>
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
  }, [tasks, onTaskPress])

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