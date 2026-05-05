'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { FaMusic, FaFolderOpen, FaSearch, FaTimes, FaChevronRight, FaFire, FaNewspaper } from 'react-icons/fa'
import Image from 'next/image'
import UserHeader from '@/components/UserHeader'

interface Category {
  id: string
  name: string
  image_url: string | null
  created_at: string
  song_count?: number
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    let filtered = categories
    
    if (searchTerm) {
      filtered = filtered.filter(cat => 
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (selectedLetter) {
      filtered = filtered.filter(cat => 
        cat.name.charAt(0).toUpperCase() === selectedLetter
      )
    }
    
    setFilteredCategories(filtered)
  }, [searchTerm, selectedLetter, categories])

  const fetchCategories = async () => {
    try {
      // Fetch categories with song counts
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          songs(count)
        `)
        .order('name')
      
      if (error) throw error
      
      // Transform data to include song count
      const categoriesWithCount = data?.map(cat => ({
        ...cat,
        song_count: cat.songs?.[0]?.count || 0
      })) || []
      
      setCategories(categoriesWithCount)
      setFilteredCategories(categoriesWithCount)
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get unique first letters for alphabet filter
  const alphabetLetters = [...new Set(categories.map(cat => cat.name.charAt(0).toUpperCase()))].sort()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30">
      <UserHeader 
        title="Categories" 
        subtitle={`${filteredCategories.length} categories available`}
        showSearch 
        onSearch={(query) => setSearchTerm(query)}
      />
      
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Alphabet Filter - Horizontal Scroll on Mobile */}
        {alphabetLetters.length > 0 && !searchTerm && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 overflow-x-auto pb-2 hide-scrollbar"
          >
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => setSelectedLetter(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  !selectedLetter
                    ? 'bg-church-gold text-white shadow-md'
                    : 'bg-white text-primary-600 hover:bg-primary-100'
                }`}
              >
                All
              </button>
              {alphabetLetters.map(letter => (
                <button
                  key={letter}
                  onClick={() => setSelectedLetter(selectedLetter === letter ? null : letter)}
                  className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${
                    selectedLetter === letter
                      ? 'bg-church-gold text-white shadow-md scale-105'
                      : 'bg-white text-primary-600 hover:bg-primary-100'
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Stats Bar */}
        {!loading && filteredCategories.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex items-center justify-between flex-wrap gap-3 p-4 bg-white rounded-2xl shadow-sm border border-primary-100"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-church-gold/10 rounded-full flex items-center justify-center">
                <FaFolderOpen className="w-4 h-4 text-church-gold" />
              </div>
              <span className="text-sm text-primary-600">
                <span className="font-semibold text-church-dark">{filteredCategories.length}</span> categories found
              </span>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="flex items-center gap-1 text-sm text-primary-500 hover:text-church-gold transition-colors"
              >
                <FaTimes className="w-3 h-3" />
                Clear search
              </button>
            )}
          </motion.div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-church-gold/20 border-t-church-gold rounded-full animate-spin mx-auto mb-4" />
              <p className="text-primary-600">Loading categories...</p>
            </div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaFolderOpen className="w-12 h-12 text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-church-dark mb-2">No categories found</h3>
            <p className="text-primary-500">
              {searchTerm ? `No categories matching "${searchTerm}"` : 'No categories available at the moment'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 text-church-gold font-medium hover:underline"
              >
                Clear search
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6"
          >
            <AnimatePresence>
              {filteredCategories.map((category, index) => (
                <motion.div
                  key={category.id}
                  variants={itemVariants}
                  whileHover={{ y: -8 }}
                  whileTap={{ scale: 0.98 }}
                  layout
                  onClick={() => router.push(`/categories/${category.id}`)}
                  className="group cursor-pointer"
                >
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-primary-100 h-full">
                    {/* Image Container */}
                    <div className="relative h-48 sm:h-52 overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200">
                      {category.image_url ? (
                        <Image
                          src={category.image_url}
                          alt={category.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                          <FaMusic className="w-16 h-16 text-primary-300 group-hover:scale-110 transition-transform duration-300" />
                          <span className="text-xs text-primary-400 mt-2">No image</span>
                        </div>
                      )}
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Song Count Badge */}
                      <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
                        <span className="text-white text-xs font-medium">
                          {category.song_count || 0} songs
                        </span>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-lg sm:text-xl font-bold text-church-dark group-hover:text-church-gold transition-colors line-clamp-2">
                          {category.name}
                        </h3>
                      </div>
                      
                      {/* Browse Button */}
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-sm text-primary-500">Browse songs</span>
                        <div className="w-8 h-8 rounded-full bg-primary-100 group-hover:bg-church-gold group-hover:scale-110 transition-all duration-300 flex items-center justify-center">
                          <FaChevronRight className="w-4 h-4 text-primary-600 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}