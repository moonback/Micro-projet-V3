import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { testAuthFlow, forceProfileRefresh } from '../utils/authTest'

export function AuthDebug() {
  const { user, profile, loading, profileLoading } = useAuth()

  // N'afficher que en mode développement
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black bg-opacity-75 text-white p-4 rounded-lg text-xs font-mono max-w-xs">
      <div className="font-bold mb-2">🔍 Auth Debug</div>
      <div className="space-y-1">
        <div>User: {user ? `✅ ${user.id}` : '❌ null'}</div>
        <div>Profile: {profile ? `✅ ${profile.name}` : '❌ null'}</div>
        <div>Loading: {loading ? '🔄 true' : '✅ false'}</div>
        <div>Profile Loading: {profileLoading ? '🔄 true' : '✅ false'}</div>
        <div>Email: {user?.email || 'N/A'}</div>
        <div>Session: {user ? '✅ Active' : '❌ None'}</div>
      </div>
      
      {user && !profile && (
        <div className="mt-2 p-2 bg-yellow-600 rounded text-xs">
          ⚠️ User exists but profile not loaded
        </div>
      )}
      
      {loading && (
        <div className="mt-2 p-2 bg-blue-600 rounded text-xs">
          🔄 Authentication in progress...
        </div>
      )}
      
      {profileLoading && (
        <div className="mt-2 p-2 bg-yellow-600 rounded text-xs">
          🔄 Profile loading in progress...
        </div>
      )}
      
      {/* Boutons de test */}
      <div className="mt-3 space-y-1">
        <button
          onClick={testAuthFlow}
          className="w-full bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
        >
          🧪 Test Auth Flow
        </button>
        {user && !profile && (
          <button
            onClick={() => forceProfileRefresh(user.id)}
            className="w-full bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
          >
            🔄 Force Profile Refresh
          </button>
        )}
      </div>
    </div>
  )
}
