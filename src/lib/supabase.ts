import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          phone: string | null
          avatar_url: string | null
          is_verified: boolean
          rating: number
          rating_count: number
          created_at: string
        }
        Insert: {
          id: string
          name?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_verified?: boolean
          rating?: number
          rating_count?: number
        }
        Update: {
          name?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_verified?: boolean
          rating?: number
          rating_count?: number
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string | null
          budget: number
          currency: string
          deadline: string | null
          location: any
          address: string | null
          author: string
          status: string
          helper: string | null
          stripe_payment_intent: string | null
          created_at: string
        }
        Insert: {
          title: string
          description?: string | null
          category?: string | null
          budget: number
          currency?: string
          deadline?: string | null
          location?: any
          address?: string | null
          author: string
          status?: string
          helper?: string | null
          stripe_payment_intent?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          category?: string | null
          budget?: number
          currency?: string
          deadline?: string | null
          location?: any
          address?: string | null
          status?: string
          helper?: string | null
          stripe_payment_intent?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          task_id: string
          sender: string
          content: string | null
          attachments: any | null
          created_at: string
        }
        Insert: {
          task_id: string
          sender: string
          content?: string | null
          attachments?: any | null
        }
        Update: {
          content?: string | null
          attachments?: any | null
        }
      }
      reviews: {
        Row: {
          id: string
          task_id: string
          reviewer: string
          reviewee: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          task_id: string
          reviewer: string
          reviewee: string
          rating: number
          comment?: string | null
        }
        Update: {
          rating?: number
          comment?: string | null
        }
      }
    }
  }
}