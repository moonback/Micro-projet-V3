import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function SupabaseDiagnostic() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'failed' | 'idle'>('idle')
  const [testResults, setTestResults] = useState<string[]>([])
  const [isVisible, setIsVisible] = useState(false)

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testConnection = async () => {
    setConnectionStatus('testing')
    setTestResults([])
    
    try {
      addResult('🔍 Test de connexion Supabase...')
      
      // Test 1: Vérifier la configuration
      addResult(`📡 URL: ${supabase.supabaseUrl}`)
      addResult(`🔑 Anon Key: ${supabase.supabaseKey?.substring(0, 20)}...`)
      
      // Test 2: Test de ping simple
      addResult('🏓 Test de ping...')
      const startTime = Date.now()
      
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      const pingTime = Date.now() - startTime
      
      if (error) {
        addResult(`❌ Erreur de connexion: ${error.message}`)
        addResult(`🔍 Code d'erreur: ${error.code}`)
        addResult(`📋 Détails: ${error.details}`)
        setConnectionStatus('failed')
      } else {
        addResult(`✅ Connexion réussie en ${pingTime}ms`)
        addResult(`📊 Données reçues: ${JSON.stringify(data)}`)
        setConnectionStatus('connected')
      }
      
    } catch (error) {
      addResult(`💥 Exception: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
      setConnectionStatus('failed')
    }
  }

  const testProfileQuery = async () => {
    addResult('👤 Test de requête de profil...')
    
    try {
      const startTime = Date.now()
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
      
      const queryTime = Date.now() - startTime
      
      if (error) {
        addResult(`❌ Erreur de requête: ${error.message}`)
      } else {
        addResult(`✅ Requête réussie en ${queryTime}ms`)
        addResult(`📊 Profils trouvés: ${data?.length || 0}`)
      }
      
    } catch (error) {
      addResult(`💥 Exception lors de la requête: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg p-4 max-w-md max-h-96 overflow-hidden shadow-lg z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">🔧 Diagnostic Supabase</h3>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
        >
          {isVisible ? 'Masquer' : 'Afficher'}
        </button>
      </div>

      {isVisible && (
        <>
          <div className="space-y-2 mb-3">
            <button
              onClick={testConnection}
              disabled={connectionStatus === 'testing'}
              className={`w-full text-xs px-3 py-2 rounded ${
                connectionStatus === 'testing' 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {connectionStatus === 'testing' ? 'Test en cours...' : '🧪 Tester la Connexion'}
            </button>
            
            <button
              onClick={testProfileQuery}
              className="w-full text-xs px-3 py-2 rounded bg-green-500 hover:bg-green-600 text-white"
            >
              📊 Tester Requête Profil
            </button>
            
            <button
              onClick={clearResults}
              className="w-full text-xs px-3 py-2 rounded bg-gray-500 hover:bg-gray-600 text-white"
            >
              🗑️ Effacer Résultats
            </button>
          </div>

          <div className="text-xs">
            <div className="flex items-center space-x-2 mb-2">
              <span>Statut:</span>
              <span className={`px-2 py-1 rounded text-xs ${
                connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
                connectionStatus === 'failed' ? 'bg-red-100 text-red-800' :
                connectionStatus === 'testing' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {connectionStatus === 'connected' ? '✅ Connecté' :
                 connectionStatus === 'failed' ? '❌ Échec' :
                 connectionStatus === 'testing' ? '⏳ Test en cours' :
                 '⏸️ En attente'}
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto bg-gray-50 p-2 rounded text-xs font-mono">
              {testResults.length === 0 ? (
                <p className="text-gray-500">Aucun test effectué</p>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="mb-1 text-gray-700">
                    {result}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
