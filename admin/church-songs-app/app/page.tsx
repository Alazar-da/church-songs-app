'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function HomePage() {
  const router = useRouter()
  const { user, profile, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading) {
      if (user && profile) {
        // If logged in, go to admin dashboard
        router.push('/admin/dashboard')
      } else {
        // If not logged in, go to login
        router.push('/login')
      }
    }
  }, [user, profile, isLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center church-gradient">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-lg">Loading...</p>
      </div>
    </div>
  )
}