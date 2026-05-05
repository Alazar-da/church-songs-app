import { create } from 'zustand'
import { supabase, Profile } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  profile: (Profile & { roles?: { name: string } }) | null
  isLoading: boolean
  isInitialized: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: (Profile & { roles?: { name: string } }) | null) => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  loadProfile: (userId: string) => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),

  initialize: async () => {
    if (get().isInitialized) return
    
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      set({ user: session.user })
      await get().loadProfile(session.user.id)
    }
    set({ isLoading: false, isInitialized: true })
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    set({ user: data.user })
    await get().loadProfile(data.user!.id)
  },

  signUp: async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })
    if (error) throw error
    set({ user: data.user })
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    set({ user: null, profile: null, isInitialized: false })
  },

  loadProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, roles(name)')
      .eq('id', userId)
      .single()
    
    if (!error && data) {
      set({ profile: data })
    }
  },

  


  isSuperAdmin: () => {
    const { profile } = useAuthStore.getState()
    return profile?.roles?.name === 'super_admin'
  },
}))