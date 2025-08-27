import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
}

export function useConnectionRetry(config: RetryConfig = {
  maxAttempts: 5,
  baseDelay: 1000,
  maxDelay: 30000
}) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [lastError, setLastError] = useState<Error | null>(null)

  const retryWithBackoff = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string = 'operation'
  ): Promise<T | null> => {
    let attempt = 0
    let delay = config.baseDelay

    while (attempt < config.maxAttempts) {
      try {
        setIsRetrying(true)
        setRetryCount(attempt + 1)
        setLastError(null)

        console.log(`Tentative ${attempt + 1}/${config.maxAttempts} pour ${operationName}`)
        
        const result = await operation()
        setIsRetrying(false)
        setRetryCount(0)
        console.log(`${operationName} réussi après ${attempt + 1} tentatives`)
        return result

      } catch (error) {
        attempt++
        const errorObj = error instanceof Error ? error : new Error(String(error))
        setLastError(errorObj)
        
        console.warn(`Échec de ${operationName} (tentative ${attempt}/${config.maxAttempts}):`, errorObj.message)

        if (attempt >= config.maxAttempts) {
          console.error(`Échec définitif de ${operationName} après ${config.maxAttempts} tentatives`)
          setIsRetrying(false)
          setRetryCount(0)
          return null
        }

        // Attendre avant la prochaine tentative avec backoff exponentiel
        await new Promise(resolve => setTimeout(resolve, delay))
        delay = Math.min(delay * 2, config.maxDelay)
      }
    }

    setIsRetrying(false)
    setRetryCount(0)
    return null
  }, [config])

  const resetRetryState = useCallback(() => {
    setIsRetrying(false)
    setRetryCount(0)
    setLastError(null)
  }, [])

  // Vérifier la connectivité réseau
  const checkNetworkConnection = useCallback(async (): Promise<boolean> => {
    try {
      // Test simple de connectivité avec Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
        .single()

      return !error
    } catch {
      return false
    }
  }, [])

  // Fonction pour tester la connexion Supabase
  const testSupabaseConnection = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      return !!session
    } catch {
      return false
    }
  }, [])

  return {
    isRetrying,
    retryCount,
    lastError,
    retryWithBackoff,
    resetRetryState,
    checkNetworkConnection,
    testSupabaseConnection,
    maxAttempts: config.maxAttempts
  }
}
