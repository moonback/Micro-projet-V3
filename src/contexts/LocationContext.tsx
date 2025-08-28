import React, { createContext, useContext, useState, useCallback } from 'react'

interface LocationContextType {
  refreshLocation: () => void
  subscribeToUpdates: (callback: () => void) => () => void
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [subscribers, setSubscribers] = useState<Set<() => void>>(new Set())

  const refreshLocation = useCallback(() => {
    // Notifier tous les abonnés
    subscribers.forEach(callback => callback())
  }, [subscribers])

  const subscribeToUpdates = useCallback((callback: () => void) => {
    setSubscribers(prev => new Set(prev).add(callback))
    
    // Retourner une fonction pour se désabonner
    return () => {
      setSubscribers(prev => {
        const newSet = new Set(prev)
        newSet.delete(callback)
        return newSet
      })
    }
  }, [])

  return (
    <LocationContext.Provider value={{ refreshLocation, subscribeToUpdates }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocationContext() {
  const context = useContext(LocationContext)
  if (context === undefined) {
    throw new Error('useLocationContext must be used within a LocationProvider')
  }
  return context
}
