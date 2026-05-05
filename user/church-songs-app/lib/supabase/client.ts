import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client for client components
export const createClientComponent = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Server client for server components and middleware
export const createServerClient = (cookieStore: any) => {
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Singleton client for client-side (keeps existing code working)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Types
export type Role = 'super_admin' | 'category_admin'

export interface Profile {
  id: string
  full_name: string
  role_id: string
  category_id: string | null
  created_at: string
  roles?: {
    name: string
  }
}

export interface Category {
  id: string
  name: string
  image_url: string | null
  created_at: string
}

export interface Subcategory {
  id: string
  name: string
  category_id: string
  image_url: string | null
  created_at: string
}

export interface Song {
  id: string
  title: string
  category_id: string
  subcategory_id: string
  created_by: string
  created_at: string
  categories?: Category
  subcategories?: Subcategory
}

export interface SongImage {
  id: string
  song_id: string
  image_url: string
  order_index: number
  created_at: string
}

export interface SongAudio {
  id: string
  song_id: string
  type: 'geez' | 'ezel' | 'araray'
  audio_url: string
  created_at: string
}

// Add these to your existing types
export interface AdminCategory {
  id: string
  admin_id: string
  category_id: string
  created_at: string
  categories?: Category
}

export interface ProfileWithCategories extends Profile {
  admin_categories?: AdminCategory[]
  roles?: {
    name: string
  }
}