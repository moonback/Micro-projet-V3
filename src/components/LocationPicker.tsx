import React, { useEffect, useRef, useState } from 'react'
import { Check, X, Search, MapPin } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number }, address: string) => void
  onCancel: () => void
}

// Fonction pour récupérer l'adresse à partir des coordonnées GPS
const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=fr`
    )
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de l\'adresse')
    }
    
    const data = await response.json()
    
    if (data.display_name) {
      // Extraire les parties les plus pertinentes de l'adresse
      const addressParts = data.display_name.split(', ')
      const relevantParts = addressParts.slice(0, 3) // Prendre les 3 premières parties
      return relevantParts.join(', ')
    }
    
    return 'Adresse non trouvée'
  } catch (error) {
    console.error('Erreur de géocodification:', error)
    return 'Erreur de géocodification'
  }
}

export default function LocationPicker({ onLocationSelect, onCancel }: LocationPickerProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [address, setAddress] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)

  useEffect(() => {
    if (!mapContainerRef.current) return

    // Initialize map
    mapRef.current = L.map(mapContainerRef.current).setView([48.8566, 2.3522], 13) // Paris

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapRef.current)

    // Add click handler
    mapRef.current.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      setSelectedLocation({ lat, lng })
      setIsLoadingAddress(true)
      
      // Remove existing marker
      if (markerRef.current) {
        mapRef.current!.removeLayer(markerRef.current)
      }
      
      // Add new marker
      markerRef.current = L.marker([lat, lng]).addTo(mapRef.current!)
      
      // Reverse geocode to get real address
      try {
        const realAddress = await reverseGeocode(lat, lng)
        setAddress(realAddress)
      } catch (error) {
        setAddress('Erreur lors de la récupération de l\'adresse')
      } finally {
        setIsLoadingAddress(false)
      }
    })

    // Force a resize to ensure the map renders properly
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize()
      }
    }, 100)

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
        <div 
          ref={mapContainerRef} 
          className="map-container"
        />
        
        {selectedLocation && (
          <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg border border-gray-200 p-4 shadow-lg z-10">
            <div className="flex items-start space-x-3 mb-3">
              <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Emplacement sélectionné :</p>
                {isLoadingAddress ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-gray-500">Récupération de l'adresse...</span>
                  </div>
                ) : (
                  <p className="font-medium text-gray-900">{address}</p>
                )}
              </div>
            </div>
            
            <button
              onClick={handleConfirm}
              disabled={isLoadingAddress}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2 px-4 rounded-lg transition-colors min-h-[44px] flex items-center justify-center"
            >
              <Check className="w-4 h-4 mr-2" />
              {isLoadingAddress ? 'Chargement...' : 'Confirmer l\'Emplacement'}
            </button>
          </div>
        )}
      </div>

      {!selectedLocation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="bg-white rounded-lg shadow-lg p-3 border border-gray-200">
            <p className="text-sm text-gray-600">Appuyez sur la carte pour sélectionner un emplacement</p>
          </div>
        </div>
      )}
    </div>
  )
}