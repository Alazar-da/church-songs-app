'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FaChurch, FaArrowLeft, FaHome, FaMusic, FaSearch } from 'react-icons/fa'
import { useState } from 'react'

interface UserHeaderProps {
  title?: string
  subtitle?: string
  showBack?: boolean
  showHome?: boolean
  showSearch?: boolean
  onSearch?: (query: string) => void
}

export default function UserHeader({ 
  title, 
  subtitle,
  showBack = false, 
  showHome = false,
  showSearch = false,
  onSearch 
}: UserHeaderProps) {
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery)
      setSearchOpen(false)
    }
  }

  return (
    <>
      {/* Main Header */}
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative overflow-hidden bg-gradient-to-r from-primary-800 via-primary-900 to-primary-800"
      >
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] bg-repeat opacity-20" />
        </div>

        {/* Floating Musical Notes Animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-white/10 text-4xl"
              initial={{ y: 100, x: Math.random() * 100, opacity: 0 }}
              animate={{ y: -100, x: Math.random() * 100, opacity: 0.3 }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                delay: i * 2,
                ease: "linear"
              }}
              style={{ left: `${20 + i * 30}%` }}
            >
              ♪
            </motion.div>
          ))}
        </div>

        <div className="relative px-4 py-5 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Top Row - Navigation */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {showBack && (
                  <motion.button
                    whileHover={{ scale: 1.05, x: -3 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.back()}
                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 backdrop-blur-sm"
                  >
                    <FaArrowLeft className="w-5 h-5 text-white" />
                  </motion.button>
                )}
                
                {showHome && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/')}
                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 backdrop-blur-sm"
                  >
                    <FaHome className="w-5 h-5 text-white" />
                  </motion.button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {showSearch && !searchOpen && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSearchOpen(true)}
                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 backdrop-blur-sm"
                  >
                    <FaSearch className="w-5 h-5 text-white" />
                  </motion.button>
                )}
              </div>
            </div>

            {/* Logo and Title Section */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center text-center"
            >
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-20 h-20 bg-gradient-to-br from-church-gold to-amber-600 rounded-2xl flex items-center justify-center shadow-xl mb-4"
              >
                <FaChurch className="w-10 h-10 text-white" />
              </motion.div>
              
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Church Songs
              </h1>
              
              {title && (
                <motion.p 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/90 text-sm sm:text-base mt-1"
                >
                  {title}
                </motion.p>
              )}
              
              {subtitle && (
                <motion.p 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="text-white/70 text-xs sm:text-sm mt-1"
                >
                  {subtitle}
                </motion.p>
              )}
            </motion.div>

            {/* Decorative Bottom Line */}
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="h-0.5 bg-gradient-to-r from-transparent via-church-gold to-transparent mt-6 mx-auto max-w-[200px]"
            />
          </div>
        </div>
      </motion.div>

      {/* Search Modal */}
      {searchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setSearchOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search songs, categories..."
                className="w-full px-5 py-4 pr-24 bg-white rounded-2xl text-church-dark placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-church-gold text-base sm:text-lg shadow-2xl"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-church-gold hover:bg-church-gold/80 text-white px-4 py-2 rounded-xl font-medium transition-all"
              >
                Search
              </button>
            </form>
            
            <button
              onClick={() => setSearchOpen(false)}
              className="mt-4 w-full py-3 text-white/70 hover:text-white text-center transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}