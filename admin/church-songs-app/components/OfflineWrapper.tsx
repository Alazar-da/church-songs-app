'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaWifi } from 'react-icons/fa'
import { FiWifiOff } from 'react-icons/fi'
import OfflinePage from './OfflinePage'

export default function OfflineWrapper({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)
  const [isChecking, setIsChecking] = useState(true)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Initial check
    setIsOnline(navigator.onLine)
    setIsChecking(false)

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      setShowBanner(true)
      setTimeout(() => setShowBanner(false), 3000)
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      setShowBanner(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Periodic check every 30 seconds
    const interval = setInterval(() => {
      setIsOnline(navigator.onLine)
    }, 30000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-church-gold/20 border-t-church-gold rounded-full animate-spin mx-auto mb-3" />
          <p className="text-primary-500 text-sm">Checking connection...</p>
        </div>
      </div>
    )
  }

  if (!isOnline) {
    return <OfflinePage />
  }

  return (
    <>
      {/* Connection Status Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50"
          >
            <div className={`px-4 py-2 text-center text-sm font-medium ${
              isOnline 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}>
              <div className="flex items-center justify-center gap-2">
                {isOnline ? (
                  <>
                    <FaWifi className="w-3 h-3" />
                    <span>Back online! Connection restored</span>
                  </>
                ) : (
                  <>
                    <FiWifiOff className="w-3 h-3" />
                    <span>Connection lost. Trying to reconnect...</span>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {children}
    </>
  )
}