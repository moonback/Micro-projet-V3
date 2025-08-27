import React from 'react'
import { useAuth } from '../hooks/useAuth'

export default function AuthStatus() {
  const { user, profile, loading } = useAuth()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 rounded-lg p-3 text-xs max-w-xs z-50 shadow-lg">
      <h3 className="font-bold mb-2 text-gray-800">🔐 Auth Status</h3>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Loading:</span>
          <span className={loading ? 'text-orange-600' : 'text-green-600'}>
            {loading ? '🔄 Oui' : '✅ Non'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>User:</span>
          <span className={user ? 'text-green-600' : 'text-red-600'}>
            {user ? `✅ ${user.email?.substring(0, 20)}...` : '❌ Aucun'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Profile:</span>
          <span className={profile ? 'text-green-600' : 'text-red-600'}>
            {profile ? `✅ ${profile.name}` : '❌ Aucun'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>User ID:</span>
          <span className="text-gray-600 text-xs">
            {user?.id || 'N/A'}
          </span>
        </div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-200">
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs w-full"
        >
          🔄 Recharger
        </button>
      </div>
    </div>
  )
}
