import { create } from 'zustand'
import { supabase, Profile } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import {
  saveSession,
  clearSession,
  getStoredSession,
} from '@/lib/session'

interface AuthState {
  user: User | null
  profile: (Profile & { roles?: { name: string } }) | null
  isLoading: boolean
  isInitialized: boolean

  setUser: (user: User | null) => void
  setProfile: (
    profile: (Profile & { roles?: { name: string } }) | null
  ) => void

  signIn: (email: string, password: string) => Promise<void>
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<void>

  signOut: () => Promise<void>

  loadProfile: (userId: string) => Promise<void>
  initialize: () => Promise<void>

  isSuperAdmin: () => boolean
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

    try {
      // Get current Supabase session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // Fallback from Capacitor storage
      const storedSession = await getStoredSession()

      const activeSession = session || storedSession

      if (activeSession?.user) {
        set({ user: activeSession.user })

        await get().loadProfile(activeSession.user.id)
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
          await saveSession(session)

          set({
            user: session.user,
          })

          await get().loadProfile(session.user.id)
        } else {
          await clearSession()

          set({
            user: null,
            profile: null,
          })
        }
      })
    } catch (error) {
      console.error('Initialize auth error:', error)
    } finally {
      set({
        isLoading: false,
        isInitialized: true,
      })
    }
  },

  signIn: async (email, password) => {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    if (error) throw error

    // Save session
    if (data.session) {
      await saveSession(data.session)
    }

    set({
      user: data.user,
    })

    await get().loadProfile(data.user.id)
  },

  signUp: async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) throw error

    if (data.session) {
      await saveSession(data.session)
    }

    set({
      user: data.user,
    })
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()

    if (error) throw error

    // Remove stored session
    await clearSession()

    set({
      user: null,
      profile: null,
      isInitialized: false,
    })
  },

  loadProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, roles(name)')
      .eq('id', userId)
      .single()

    if (!error && data) {
      set({
        profile: data,
      })
    }
  },

 isSuperAdmin: (): boolean => {
  const { profile } = get()

  return profile?.roles?.name === 'super_admin'
},
}))