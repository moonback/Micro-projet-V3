import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Navigation, Crosshair, Edit3, Check, X, AlertCircle } from 'lucide-react'
import { useUserLocation, UserLocation } from '../hooks/useUserLocation'
import LocationPicker from './LocationPicker'

interface UserLocationManagerProps {
  onLocationUpdate?: (location: UserLocation) => void
  className?: string
}

export default function UserLocationManager({ onLocationUpdate, className = '' }: UserLocationManagerProps) {
  const {
    currentLocation,
    userLocation,
    loading,
    error,
    permissionGranted,
    getCurrentLocation,
    saveUserLocation,
    updateLocationWithCurrent
  } = useUserLocation()

  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [editing, setEditing] = useState(false)

  const handleLocationSelect = async (location: { lat: number; lng: number }, address: string) => {
    const userLocation: UserLocation = {
      lat: location.lat,
      lng: location.lng,
      address,
      city: extractCityFromAddress(address),
      postal_code: extractPostalCodeFromAddress(address),
      country: 'France'
    }

    const success = await saveUserLocation(userLocation)
    if (success) {
      setShowLocationPicker(false)
      onLocationUpdate?.(userLocation)
    }
  }

  const handleUseCurrentLocation = async () => {
    const success = await updateLocationWithCurrent()
    if (success && currentLocation) {
      onLocationUpdate?.(currentLocation)
    }
  }

  const formatLocation = (location: UserLocation) => {
    if (location.address) {
      return location.address
    }
    if (location.city) {
      return `${location.city}${location.postal_code ? ` (${location.postal_code})` : ''}`
    }
    return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
  }

  const getDistanceFromCurrent = () => {
    if (!currentLocation || !userLocation) return null
    
    const distance = calculateDistance(
      currentLocation.lat, currentLocation.lng,
      userLocation.lat, userLocation.lng
    )
    
    if (distance < 1) return '< 1 km'
    if (distance < 10) return `${distance.toFixed(1)} km`
    return `${Math.round(distance)} km`
  }

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-20 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* En-tête de la section localisation */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-blue-600" />
          Ma Localisation
        </h3>
        
        {userLocation && (
          <button
            onClick={() => setEditing(!editing)}
            className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span>{editing ? 'Annuler' : 'Modifier'}</span>
          </button>
        )}
      </div>

      {/* Affichage de la localisation actuelle */}
      {currentLocation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Crosshair className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 mb-1">Position actuelle</p>
              <p className="text-sm text-blue-700">{formatLocation(currentLocation)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Affichage de la localisation sauvegardée */}
      {userLocation ? (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 mb-1">Localisation sauvegardée</p>
              <p className="text-sm text-gray-700">{formatLocation(userLocation)}</p>
              
              {currentLocation && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    Distance: {getDistanceFromCurrent()}
                  </span>
                  {getDistanceFromCurrent() && parseFloat(getDistanceFromCurrent()!.replace(' km', '')) > 5 && (
                    <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                      Mise à jour recommandée
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={handleUseCurrentLocation}
              disabled={!currentLocation || loading}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Navigation className="w-4 h-4" />
              <span>Utiliser ma position actuelle</span>
            </button>
            
            <button
              onClick={() => setShowLocationPicker(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              <span>Choisir sur la carte</span>
            </button>
          </div>
        </div>
      ) : (
        /* Pas de localisation sauvegardée */
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Aucune localisation définie</h4>
          <p className="text-gray-600 mb-4">
            Définissez votre localisation pour recevoir des tâches pertinentes et améliorer votre expérience.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleUseCurrentLocation}
              disabled={!permissionGranted || loading}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Crosshair className="w-4 h-4" />
              <span>Utiliser ma position GPS</span>
            </button>
            
            <button
              onClick={() => setShowLocationPicker(true)}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              <span>Choisir sur la carte</span>
            </button>
          </div>
        </div>
      )}

      {/* Messages d'erreur */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 mb-1">Erreur de localisation</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Sélecteur de localisation */}
      <AnimatePresence>
        {showLocationPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowLocationPicker(false)}
          >
            <motion.div
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Choisir ma localisation</h3>
                <button
                  onClick={() => setShowLocationPicker(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              
              <LocationPicker
                onLocationSelect={handleLocationSelect}
                onCancel={() => setShowLocationPicker(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Fonction utilitaire pour extraire la ville de l'adresse
function extractCityFromAddress(address: string): string | undefined {
  const parts = address.split(', ')
  for (const part of parts) {
    if (part.length > 2 && !/\d/.test(part) && !part.includes('France')) {
      return part
    }
  }
  return undefined
}

// Fonction utilitaire pour extraire le code postal de l'adresse
function extractPostalCodeFromAddress(address: string): string | undefined {
  const postalCodeMatch = address.match(/\b\d{5}\b/)
  return postalCodeMatch ? postalCodeMatch[0] : undefined
}

// Fonction utilitaire pour calculer la distance entre deux points (en km)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}
