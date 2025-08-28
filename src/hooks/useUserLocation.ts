import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface UserLocation {
  lat: number
  lng: number
  address?: string
  city?: string
  postal_code?: string
  country?: string
}

export interface LocationState {
  currentLocation: UserLocation | null
  userLocation: UserLocation | null
  loading: boolean
  error: string | null
  permissionGranted: boolean
}

export function useUserLocation() {
  const { user } = useAuth()
  const [locationState, setLocationState] = useState<LocationState>({
    currentLocation: null,
    userLocation: null,
    loading: false,
    error: null,
    permissionGranted: false
  })

  // Récupérer la localisation actuelle de l'utilisateur (GPS)
  const getCurrentLocation = useCallback(async (): Promise<UserLocation | null> => {
    if (!navigator.geolocation) {
      setLocationState(prev => ({
        ...prev,
        error: 'La géolocalisation n\'est pas supportée par votre navigateur'
      }))
      return null
    }

    return new Promise((resolve) => {
      setLocationState(prev => ({ ...prev, loading: true, error: null }))

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          
          try {
            // Récupérer l'adresse à partir des coordonnées
            const address = await reverseGeocode(latitude, longitude)
            
            const location: UserLocation = {
              lat: latitude,
              lng: longitude,
              address: address,
              city: extractCityFromAddress(address),
              postal_code: extractPostalCodeFromAddress(address),
              country: 'France'
            }

            setLocationState(prev => ({
              ...prev,
              currentLocation: location,
              loading: false,
              permissionGranted: true
            }))

            resolve(location)
          } catch (error) {
            const location: UserLocation = {
              lat: latitude,
              lng: longitude,
              country: 'France'
            }

            setLocationState(prev => ({
              ...prev,
              currentLocation: location,
              loading: false,
              permissionGranted: true
            }))

            resolve(location)
          }
        },
        (error) => {
          let errorMessage = 'Erreur lors de la récupération de la localisation'
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permission de géolocalisation refusée'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Informations de localisation non disponibles'
              break
            case error.TIMEOUT:
              errorMessage = 'Délai d\'attente dépassé pour la géolocalisation'
              break
          }

          setLocationState(prev => ({
            ...prev,
            error: errorMessage,
            loading: false,
            permissionGranted: false
          }))

          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    })
  })

  // Charger la localisation sauvegardée de l'utilisateur
  const loadUserLocation = useCallback(async () => {
    if (!user) return

    try {
      setLocationState(prev => ({ ...prev, loading: true }))

      const { data, error } = await supabase
        .from('profiles')
        .select('latitude, longitude, address, city, postal_code, country')
        .eq('id', user.id)
        .single()

      if (error) throw error

      if (data && data.latitude && data.longitude) {
        const userLocation: UserLocation = {
          lat: data.latitude,
          lng: data.longitude,
          address: data.address || undefined,
          city: data.city || undefined,
          postal_code: data.postal_code || undefined,
          country: data.country || 'France'
        }

        setLocationState(prev => ({
          ...prev,
          userLocation,
          loading: false
        }))
      } else {
        setLocationState(prev => ({ ...prev, loading: false }))
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la localisation:', error)
      setLocationState(prev => ({
        ...prev,
        error: 'Erreur lors du chargement de la localisation',
        loading: false
      }))
    }
  })

  // Sauvegarder la localisation de l'utilisateur
  const saveUserLocation = useCallback(async (location: UserLocation) => {
    if (!user) return false

    try {
      setLocationState(prev => ({ ...prev, loading: true }))

      const { error } = await supabase
        .from('profiles')
        .update({
          location: {
            type: 'Point',
            coordinates: [location.lng, location.lat]
          },
          latitude: location.lat,
          longitude: location.lng,
          address: location.address || null,
          city: location.city || null,
          postal_code: location.postal_code || null,
          country: location.country || 'France',
          location_updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setLocationState(prev => ({
        ...prev,
        userLocation: location,
        loading: false
      }))

      return true
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la localisation:', error)
      setLocationState(prev => ({
        ...prev,
        error: 'Erreur lors de la sauvegarde de la localisation',
        loading: false
      }))
      return false
    }
  })

  // Mettre à jour la localisation avec la position actuelle
  const updateLocationWithCurrent = useCallback(async () => {
    const currentLocation = await getCurrentLocation()
    if (currentLocation) {
      const success = await saveUserLocation(currentLocation)
      if (success) {
        setLocationState(prev => ({
          ...prev,
          currentLocation,
          userLocation: currentLocation
        }))
      }
      return success
    }
    return false
  })

  // Charger la localisation au montage du composant
  useEffect(() => {
    if (user) {
      loadUserLocation()
    }
  }, [user, loadUserLocation])

  return {
    ...locationState,
    getCurrentLocation,
    loadUserLocation,
    saveUserLocation,
    updateLocationWithCurrent
  }
}

// Fonction utilitaire pour récupérer l'adresse à partir des coordonnées
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=fr`
    )
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de l\'adresse')
    }
    
    const data = await response.json()
    
    if (data.display_name) {
      return data.display_name
    }
    
    return 'Adresse non trouvée'
  } catch (error) {
    console.error('Erreur de géocodification:', error)
    throw error
  }
}

// Fonction utilitaire pour extraire la ville de l'adresse
function extractCityFromAddress(address: string): string | undefined {
  const parts = address.split(', ')
  // Chercher une partie qui ressemble à une ville (pas de chiffres, pas trop courte)
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
