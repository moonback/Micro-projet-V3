import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useLocationContext } from '../contexts/LocationContext'

interface UserLocation {
  city?: string
  postal_code?: string
  country?: string
  latitude?: number
  longitude?: number
}

interface TaskLocation {
  city?: string
  postal_code?: string
  country?: string
  latitude?: number
  longitude?: number
}

export function useDistanceCalculation() {
  const { user } = useAuth()
  const { subscribeToUpdates } = useLocationContext()
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)

  const loadUserLocation = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('city, postal_code, country, latitude, longitude')
        .eq('id', user.id)
        .single()

      if (!error && data) {
        setUserLocation({
          city: data.city || undefined,
          postal_code: data.postal_code || undefined,
          country: data.country || undefined,
          latitude: data.latitude || undefined,
          longitude: data.longitude || undefined
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la localisation:', error)
    }
  }, [user])

  // Fonction pour forcer le rafraîchissement de la localisation
  const refreshUserLocation = useCallback(async () => {
    await loadUserLocation()
  }, [loadUserLocation])

  useEffect(() => {
    if (user) {
      loadUserLocation()
    }
  }, [user, loadUserLocation])

  // S'abonner aux mises à jour de localisation
  useEffect(() => {
    const unsubscribe = subscribeToUpdates(() => {
      loadUserLocation()
    })
    
    return unsubscribe
  }, [subscribeToUpdates, loadUserLocation])

  // Calcul de distance en kilomètres entre deux points GPS
  const calculateDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

  // Formatage de la distance pour l'affichage
  const formatDistance = (distanceKm: number): string => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`
    } else if (distanceKm < 10) {
      return `${distanceKm.toFixed(1)}km`
    } else {
      return `${Math.round(distanceKm)}km`
    }
  }

  const calculateDistance = (taskLocation: TaskLocation): string => {
    if (!userLocation) {
      return 'Distance inconnue'
    }

    // Si on a des coordonnées GPS pour les deux localisations, calculer la vraie distance
    if (userLocation.latitude && userLocation.longitude && 
        taskLocation.latitude && taskLocation.longitude) {
      const distanceKm = calculateDistanceInKm(
        userLocation.latitude, 
        userLocation.longitude, 
        taskLocation.latitude, 
        taskLocation.longitude
      )
      return formatDistance(distanceKm)
    }

    // Si même ville, afficher "Même ville"
    if (userLocation.city && taskLocation.city && userLocation.city === taskLocation.city) {
      return 'Même ville'
    }

    // Si même code postal, afficher "Même secteur"
    if (userLocation.postal_code && taskLocation.postal_code && userLocation.postal_code === taskLocation.postal_code) {
      return 'Même secteur'
    }

    // Si même pays mais ville différente
    if (userLocation.country && taskLocation.country && userLocation.country === taskLocation.country) {
      if (userLocation.city && taskLocation.city) {
        return `${taskLocation.city}`
      }
      return 'Même pays'
    }

    // Si pays différent
    if (userLocation.country && taskLocation.country && userLocation.country !== taskLocation.country) {
      return `${taskLocation.country}`
    }

    return 'Distance inconnue'
  }

  const hasUserLocation = !!userLocation?.city || !!userLocation?.postal_code || !!userLocation?.latitude

  return {
    userLocation,
    calculateDistance,
    hasUserLocation,
    loadUserLocation,
    refreshUserLocation
  }
}
