import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function TimeoutMonitor() {
  const { user, profile, loading } = useAuth()
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [elapsedTime, setElapsedTime] = useState<number>(0)

  useEffect(() => {
    if (loading) {
      setStartTime(Date.now())
    }
  }, [loading])

  useEffect(() => {
    if (!loading) return

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      setElapsedTime(elapsed)
      
      // Afficher un avertissement après 8 secondes
      if (elapsed > 8000 && elapsed < 10000) {
        console.warn('⚠️ Profile loading taking longer than expected:', Math.round(elapsed / 1000), 'seconds')
      }
      
      // Afficher une alerte après 9 secondes
      if (elapsed > 9000 && elapsed < 10000) {
        console.error('🚨 Profile loading timeout approaching! Will force loading to false in:', Math.round((10000 - elapsed) / 1000), 'seconds')
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [loading, startTime])

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  if (!loading) {
    return null
  }

  const seconds = Math.round(elapsedTime / 1000)
  const isWarning = seconds > 8
  const isCritical = seconds > 9

  return (
    <div className={`fixed top-4 left-4 bg-white border rounded-lg p-3 text-xs max-w-xs z-50 shadow-lg ${
      isCritical ? 'border-red-500 bg-red-50' : 
      isWarning ? 'border-yellow-500 bg-yellow-50' : 
      'border-blue-500 bg-blue-50'
    }`}>
      <h3 className={`font-bold mb-2 ${
        isCritical ? 'text-red-700' : 
        isWarning ? 'text-yellow-700' : 
        'text-blue-700'
      }`}>
        {isCritical ? '🚨 Timeout Critique' : 
         isWarning ? '⚠️ Timeout Approche' : 
         '⏱️ Chargement en Cours'}
      </h3>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Temps écoulé:</span>
          <span className={isCritical ? 'text-red-600 font-bold' : isWarning ? 'text-yellow-600' : 'text-blue-600'}>
            {seconds}s
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Timeout dans:</span>
          <span className={isCritical ? 'text-red-600 font-bold' : isWarning ? 'text-yellow-600' : 'text-blue-600'}>
            {Math.max(0, 10 - seconds)}s
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>User:</span>
          <span className={user ? 'text-green-600' : 'text-red-600'}>
            {user ? '✅ Connecté' : '❌ Déconnecté'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Profile:</span>
          <span className={profile ? 'text-green-600' : 'text-red-600'}>
            {profile ? '✅ Chargé' : '❌ En cours'}
          </span>
        </div>
      </div>
      
      {isCritical && (
        <div className="mt-2 pt-2 border-t border-red-200">
          <p className="text-red-600 text-xs">
            ⚠️ Le timeout de sécurité se déclenchera dans {Math.max(0, 10 - seconds)} secondes
          </p>
        </div>
      )}
    </div>
  )
}
