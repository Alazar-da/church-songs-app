'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { FaChurch, FaMusic } from 'react-icons/fa'
import AppInitializer from './AppInitializer'

// Create client outside of component to avoid recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  const { initialize, isLoading } = useAuthStore()
  const [isReady, setIsReady] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const init = async () => {
      // Simulate progress
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 10
        })
      }, 150)

      await initialize()
      setIsReady(true)
      clearInterval(interval)
    }
    init()
  }, [initialize])

  // Show loading only on first load
  if (!isReady || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
        <div className="text-center px-4">
          {/* Logo */}
          <div className="w-20 h-20 bg-church-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FaChurch className="w-10 h-10 text-church-gold" />
          </div>
          
          {/* Title */}
          <h1 className="text-xl font-semibold text-church-dark mb-2">Church Songs</h1>
          <p className="text-sm text-primary-500 mb-6">Loading...</p>
          
          {/* Progress Bar */}
          <div className="w-48 mx-auto">
            <div className="h-1 bg-primary-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-church-gold rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          {/* Loading Text */}
          <p className="text-xs text-primary-400 mt-3 flex items-center justify-center gap-1">
            <FaMusic className="w-3 h-3" />
            <span>Preparing your experience</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <AppInitializer />
    </QueryClientProvider>
  )
}