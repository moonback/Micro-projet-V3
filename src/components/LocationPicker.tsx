import React, { useEffect, useRef, useState } from 'react'
import { Check, X, Search } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number }, address: string) => void
  onCancel: () => void
}

export default function LocationPicker({ onLocationSelect, onCancel }: LocationPickerProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [address, setAddress] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!mapContainerRef.current) return

    // Initialize map
    mapRef.current = L.map(mapContainerRef.current).setView([52.3676, 4.9041], 13) // Amsterdam

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapRef.current)

    // Add click handler
    mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      setSelectedLocation({ lat, lng })
      
      // Remove existing marker
      if (markerRef.current) {
        mapRef.current!.removeLayer(markerRef.current)
      }
      
      // Add new marker
      markerRef.current = L.marker([lat, lng]).addTo(mapRef.current!)
      
      // Reverse geocode to get address (simplified)
      setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation, address)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-gray-900">Sélectionner l'Emplacement</h1>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Rechercher une adresse..."
          />
        </div>
      </div>

      <div className="flex-1 relative">
        <div ref={mapContainerRef} className="w-full h-full" />
        
        {selectedLocation && (
          <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg border border-gray-200 p-4 shadow-lg">
            <p className="text-sm text-gray-600 mb-2">Emplacement sélectionné :</p>
            <p className="font-medium mb-3">{address}</p>
            <button
              onClick={handleConfirm}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors min-h-[44px] flex items-center justify-center"
            >
              <Check className="w-4 h-4 mr-2" />
              Confirmer l'Emplacement
            </button>
          </div>
        )}
      </div>

      {!selectedLocation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-lg shadow-lg p-3 border border-gray-200">
            <p className="text-sm text-gray-600">Appuyez sur la carte pour sélectionner un emplacement</p>
          </div>
        </div>
      )}
    </div>
  )
}