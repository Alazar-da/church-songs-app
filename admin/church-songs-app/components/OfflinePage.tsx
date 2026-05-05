'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FaWifi, FaSync, FaPlug, FaLightbulb, FaSignal } from 'react-icons/fa'
import { FiWifiOff } from 'react-icons/fi'

interface OfflinePageProps {
  onRetry?: () => void
}

export default function OfflinePage({ onRetry }: OfflinePageProps) {
  const [retrying, setRetrying] = useState(false)
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    // Check online status periodically
    const interval = setInterval(() => {
      if (navigator.onLine) {
        setIsOnline(true)
        if (onRetry) onRetry()
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [onRetry])

  const handleRetry = () => {
    setRetrying(true)
    if (navigator.onLine) {
      window.location.reload()
    } else {
      setTimeout(() => {
        setRetrying(false)
      }, 1500)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Illustration */}
        <div className="text-center mb-6">
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="relative inline-block"
          >
            <div className="w-28 h-28 bg-primary-100 rounded-full flex items-center justify-center">
              <FiWifiOff className="w-12 h-12 text-primary-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <FaPlug className="w-4 h-4 text-white" />
            </div>
          </motion.div>
        </div>

        {/* Message Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-primary-100 p-6 text-center">
          <h1 className="text-xl font-bold text-church-dark mb-2">
            No Internet Connection
          </h1>
          <p className="text-primary-600 text-sm mb-4">
            Please check your connection and try again
          </p>

          {/* Tips Section */}
          <div className="bg-primary-50 rounded-xl p-4 mb-5 text-left">
            <div className="flex items-center gap-2 mb-2">
              <FaLightbulb className="w-4 h-4 text-church-gold" />
              <h3 className="text-sm font-semibold text-church-dark">Quick Tips</h3>
            </div>
            <ul className="text-xs text-primary-600 space-y-1.5">
              <li className="flex items-center gap-2">
                <FaSignal className="w-3 h-3" />
                <span>Check your Wi-Fi or mobile data</span>
              </li>
              <li className="flex items-center gap-2">
                <FaSync className="w-3 h-3" />
                <span>Toggle Airplane mode on/off</span>
              </li>
              <li className="flex items-center gap-2">
                <FaWifi className="w-3 h-3" />
                <span>Move closer to your router</span>
              </li>
            </ul>
          </div>

          {/* Retry Button */}
          <button
            onClick={handleRetry}
            disabled={retrying || isOnline}
            className="w-full bg-church-gold hover:bg-church-gold/80 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {retrying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Checking connection...</span>
              </>
            ) : (
              <>
                <FaSync className="w-4 h-4" />
                <span>Try Again</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}