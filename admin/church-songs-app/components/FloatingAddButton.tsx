'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { FaPlus, FaTimes, FaMusic, FaFolder, FaList } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'

export default function FloatingAddButton() {
  const router = useRouter()
  const pathname = usePathname()
  const { profile } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  const isSuperAdmin = profile?.roles?.name === 'super_admin'

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Hide on specific pages where add doesn't make sense
  const hideOnPages = ['/admin/songs/new', '/admin/songs/edit', '/admin/categories/new', '/admin/categories/edit']
  if (hideOnPages.some(page => pathname?.startsWith(page))) {
    return null
  }

  // Quick actions based on user role
  const quickActions = [
    { 
      label: 'Add New Song', 
      icon: FaMusic, 
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500',
      href: '/admin/songs/new',
      description: 'Upload lyrics and audio',
      requiresSuperAdmin: false // Everyone can add songs
    },
    { 
      label: 'Add Category', 
      icon: FaFolder, 
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500',
      href: '/admin/categories/new',
      description: 'Create new category',
      requiresSuperAdmin: true // Only super admin
    },
    { 
      label: 'Add Subcategory', 
      icon: FaList, 
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500',
      href: '/admin/subcategories/new',
      description: 'Create new subcategory',
      requiresSuperAdmin: true // Only super admin
    },
  ]

  // Filter actions based on user role
  const visibleActions = quickActions.filter(action => 
    !action.requiresSuperAdmin || isSuperAdmin
  )

  // Don't show the button if there are no actions
  if (visibleActions.length === 0) {
    return null
  }

  const handleAction = (href: string) => {
    setIsOpen(false)
    router.push(href)
  }

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Quick Action Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-6 z-50 flex flex-col gap-3"
          >
            {visibleActions.map((action, index) => {
              const Icon = action.icon
              return (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ delay: index * 0.05, type: "spring", stiffness: 400, damping: 25 }}
                  onClick={() => handleAction(action.href)}
                  className="group relative flex items-center gap-3 bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden"
                  whileHover={{ scale: 1.05, x: -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${action.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  
                  <div className="relative flex items-center gap-3 px-4 py-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-white transition-colors">
                        {action.label}
                      </p>
                      <p className="text-xs text-gray-500 group-hover:text-white/80 transition-colors">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="fixed bottom-6 right-6 z-50 group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {/* Pulsing ring animation */}
        <div className="absolute inset-0 rounded-full animate-ping-slow opacity-30 bg-church-gold" />
        <div className="absolute inset-0 rounded-full animate-pulse-slow opacity-20 bg-church-gold" />
        
        {/* Main button */}
        <div className="relative w-14 h-14 bg-gradient-to-r from-church-gold to-church-gold/80 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:shadow-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={isOpen ? 'close' : 'open'}
              initial={{ rotate: 0, scale: 0 }}
              animate={{ rotate: isOpen ? 180 : 0, scale: 1 }}
              exit={{ rotate: 0, scale: 0 }}
              transition={{ duration: 0.2 }}
            >
              {isOpen ? (
                <FaTimes className="w-6 h-6 text-white" />
              ) : (
                <FaPlus className="w-6 h-6 text-white" />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-800 text-white px-3 py-1.5 rounded-lg text-sm whitespace-nowrap"
            >
              Quick Add
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45 w-2 h-2 bg-gray-800" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <style jsx>{`
        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          75% {
            transform: scale(1.5);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.05);
          }
        }
        
        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </>
  )
}