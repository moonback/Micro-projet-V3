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
          updated_at: string
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
          updated_at: string
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
      task_acceptances: {
        Row: {
          id: string
          task_id: string
          helper_id: string
          accepted_at: string
          status: string
          notes: string | null
          created_at: string
        }
        Insert: {
          task_id: string
          helper_id: string
          notes?: string | null
        }
        Update: {
          status?: string
          notes?: string | null
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
      notifications: {
        Row: {
          id: string
          user_id: string
          task_id: string | null
          type: string
          title: string
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          user_id: string
          task_id?: string | null
          type: string
          title: string
          message: string
          is_read?: boolean
        }
        Update: {
          is_read?: boolean
        }
      }
    }
    Views: {
      user_task_stats: {
        Row: {
          user_id: string | null
          name: string | null
          total_tasks_created: number | null
          completed_tasks_created: number | null
          total_tasks_accepted: number | null
          completed_tasks_accepted: number | null
          total_earned: number | null
          total_spent: number | null
          total_messages_sent: number | null
        }
      }
      task_details: {
        Row: {
          id: string | null
          title: string | null
          description: string | null
          category: string | null
          budget: number | null
          currency: string | null
          deadline: string | null
          location: any
          address: string | null
          author: string | null
          status: string | null
          helper: string | null
          stripe_payment_intent: string | null
          created_at: string | null
          updated_at: string | null
          author_name: string | null
          author_avatar: string | null
          author_rating: number | null
          helper_name: string | null
          helper_avatar: string | null
          helper_rating: number | null
          accepted_at: string | null
          acceptance_notes: string | null
          message_count: number | null
        }
      }
    }
    Functions: {
      accept_task: {
        Args: {
          p_task_id: string
          p_helper_id: string
          p_notes?: string
        }
        Returns: boolean
      }
      start_task: {
        Args: {
          p_task_id: string
        }
        Returns: boolean
      }
      complete_task: {
        Args: {
          p_task_id: string
        }
        Returns: boolean
      }
      create_notification: {
        Args: {
          p_user_id: string
          p_task_id: string
          p_type: string
          p_title: string
          p_message: string
        }
        Returns: string
      }
    }
  }
}