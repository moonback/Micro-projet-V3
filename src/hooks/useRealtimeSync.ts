import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

interface RealtimeSyncOptions {
  table: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  onInsert?: (payload: any) => void
  onUpdate?: (payload: any) => void
  onDelete?: (payload: any) => void
  onError?: (error: any) => void
}

export function useRealtimeSync(options: RealtimeSyncOptions) {
  const channelRef = useRef<any>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    const event = options.event || '*'
    
    // Créer le canal de synchronisation
    channelRef.current = supabase
      .channel(`${options.table}_changes`)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table: options.table,
          filter: options.filter
        },
        (payload) => {
          if (!mountedRef.current) return

          console.log(`${options.table} changed:`, payload.eventType, payload.new)
          
          try {
            switch (payload.eventType) {
              case 'INSERT':
                if (options.onInsert) {
                  options.onInsert(payload)
                }
                break
              case 'UPDATE':
                if (options.onUpdate) {
                  options.onUpdate(payload)
                }
                break
              case 'DELETE':
                if (options.onDelete) {
                  options.onDelete(payload)
                }
                break
              default:
                // Gérer tous les événements
                if (payload.eventType === 'INSERT' && options.onInsert) {
                  options.onInsert(payload)
                } else if (payload.eventType === 'UPDATE' && options.onUpdate) {
                  options.onUpdate(payload)
                } else if (payload.eventType === 'DELETE' && options.onDelete) {
                  options.onDelete(payload)
                }
            }
          } catch (error) {
            console.error(`Error handling ${options.table} change:`, error)
            if (options.onError) {
              options.onError(error)
            }
          }
        }
      )
      .subscribe((status) => {
        if (mountedRef.current) {
          console.log(`${options.table} realtime status:`, status)
        }
      })

    return () => {
      mountedRef.current = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [options.table, options.event, options.filter])

  // Méthode pour forcer la déconnexion
  const disconnect = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }

  return { disconnect }
}
