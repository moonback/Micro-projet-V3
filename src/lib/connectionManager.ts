import { supabase } from './supabase'

export interface ConnectionState {
  isConnected: boolean
  lastConnected: Date | null
  connectionAttempts: number
  lastError: string | null
}

class ConnectionManager {
  private state: ConnectionState = {
    isConnected: false,
    lastConnected: null,
    connectionAttempts: 0,
    lastError: null
  }

  private listeners: Set<(state: ConnectionState) => void> = new Set()
  private reconnectInterval: NodeJS.Timeout | null = null
  private healthCheckInterval: NodeJS.Timeout | null = null

  constructor() {
    this.setupEventListeners()
    this.startHealthCheck()
  }

  private setupEventListeners() {
    // Écouter les changements d'état d'authentification
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        this.updateConnectionState(true)
      } else if (event === 'SIGNED_OUT') {
        this.updateConnectionState(false)
      }
    })

    // Écouter les erreurs de réseau
    window.addEventListener('online', () => {
      this.handleNetworkChange(true)
    })

    window.addEventListener('offline', () => {
      this.handleNetworkChange(false)
    })
  }

  private updateConnectionState(isConnected: boolean, error?: string) {
    this.state.isConnected = isConnected
    if (isConnected) {
      this.state.lastConnected = new Date()
      this.state.connectionAttempts = 0
      this.state.lastError = null
    } else {
      this.state.lastError = error || 'Déconnecté'
    }
    this.notifyListeners()
  }

  private handleNetworkChange(isOnline: boolean) {
    if (isOnline && !this.state.isConnected) {
      this.attemptReconnection()
    } else if (!isOnline) {
      this.updateConnectionState(false, 'Réseau hors ligne')
    }
  }

  private async attemptReconnection() {
    if (this.reconnectInterval) return

    this.state.connectionAttempts++
    this.notifyListeners()

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        this.updateConnectionState(true)
        return
      }
    } catch (error) {
      console.warn('Échec de reconnexion:', error)
    }

    // Programmer la prochaine tentative
    const delay = Math.min(1000 * Math.pow(2, this.state.connectionAttempts - 1), 30000)
    this.reconnectInterval = setTimeout(() => {
      this.reconnectInterval = null
      if (this.state.connectionAttempts < 5) {
        this.attemptReconnection()
      }
    }, delay)
  }

  private startHealthCheck() {
    this.healthCheckInterval = setInterval(async () => {
      if (this.state.isConnected) {
        try {
          // Test simple de connectivité
          const { data, error } = await supabase
            .from('profiles')
            .select('count')
            .limit(1)
            .single()

          if (error && error.code !== 'PGRST116') {
            this.updateConnectionState(false, 'Erreur de connexion à la base de données')
          }
        } catch (error) {
          this.updateConnectionState(false, 'Erreur de santé de la connexion')
        }
      }
    }, 30000) // Vérifier toutes les 30 secondes
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state))
  }

  // API publique
  public subscribe(listener: (state: ConnectionState) => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  public getState(): ConnectionState {
    return { ...this.state }
  }

  public async forceReconnection() {
    this.state.connectionAttempts = 0
    await this.attemptReconnection()
  }

  public destroy() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval)
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
    this.listeners.clear()
  }
}

// Instance singleton
export const connectionManager = new ConnectionManager()

// Hook React pour utiliser le gestionnaire de connexion
export function useConnectionManager() {
  const [state, setState] = useState<ConnectionState>(connectionManager.getState())

  useEffect(() => {
    const unsubscribe = connectionManager.subscribe(setState)
    return unsubscribe
  }, [])

  return {
    ...state,
    forceReconnection: connectionManager.forceReconnection.bind(connectionManager)
  }
}
