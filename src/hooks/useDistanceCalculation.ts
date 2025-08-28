import { useMemo } from 'react'
import { useUserLocation } from './useUserLocation'
import type { TaskWithProfiles } from '../types/task'

export function useDistanceCalculation() {
  const { userLocation } = useUserLocation()

  const calculateDistance = useMemo(() => {
    return (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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
  }, [])

  const getDistanceToTask = useMemo(() => {
    return (task: TaskWithProfiles): string | null => {
      if (!userLocation || !task.latitude || !task.longitude) {
        return null
      }

      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        task.latitude,
        task.longitude
      )

      if (distance < 1) return '< 1 km'
      if (distance < 10) return `${distance.toFixed(1)} km`
      return `${Math.round(distance)} km`
    }
  }, [userLocation, calculateDistance])

  const getDistanceToUser = useMemo(() => {
    return (userLat?: number, userLon?: number): string | null => {
      if (!userLocation || !userLat || !userLon) {
        return null
      }

      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        userLat,
        userLon
      )

      if (distance < 1) return '< 1 km'
      if (distance < 10) return `${distance.toFixed(1)} km`
      return `${Math.round(distance)} km`
    }
  }, [userLocation, calculateDistance])

  const sortTasksByDistance = useMemo(() => {
    return (tasks: TaskWithProfiles[]): TaskWithProfiles[] => {
      if (!userLocation) return tasks

      return [...tasks].sort((a, b) => {
        if (!a.latitude || !a.longitude) return 1
        if (!b.latitude || !b.longitude) return -1

        const distanceA = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          a.latitude,
          a.longitude
        )
        const distanceB = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          b.latitude,
          b.longitude
        )

        return distanceA - distanceB
      })
    }
  }, [userLocation, calculateDistance])

  const filterTasksByRadius = useMemo(() => {
    return (tasks: TaskWithProfiles[], radiusKm: number): TaskWithProfiles[] => {
      if (!userLocation) return tasks

      return tasks.filter(task => {
        if (!task.latitude || !task.longitude) return false

        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          task.latitude,
          task.longitude
        )

        return distance <= radiusKm
      })
    }
  }, [userLocation, calculateDistance])

  return {
    calculateDistance,
    getDistanceToTask,
    getDistanceToUser,
    sortTasksByDistance,
    filterTasksByRadius,
    hasUserLocation: !!userLocation
  }
}
