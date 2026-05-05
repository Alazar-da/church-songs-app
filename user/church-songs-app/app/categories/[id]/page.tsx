'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { FaFolder, FaMusic, FaSearch, FaTimes, FaChevronRight, FaFire, FaImage } from 'react-icons/fa'
import Image from 'next/image'
import UserHeader from '@/components/UserHeader'

interface Subcategory {
  id: string
  name: string
  image_url: string | null
  category_id: string
  song_count?: number
}

interface Category {
  id: string
  name: string
  image_url?: string | null
}

export default function SubcategoriesPage() {
  const { id } = useParams()
  const router = useRouter()
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    fetchData()
  }, [id])

  useEffect(() => {
    if (searchTerm) {
      setFilteredSubcategories(
        subcategories.filter(sub => 
          sub.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    } else {
      setFilteredSubcategories(subcategories)
    }
  }, [searchTerm, subcategories])

  const fetchData = async () => {
    try {
      // Fetch category details
      const { data: categoryData } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single()
      
      setCategory(categoryData)

      // Fetch subcategories with song counts
      const { data: subData, error } = await supabase
        .from('subcategories')
        .select(`
          *,
          songs(count)
        `)
        .eq('category_id', id)
        .order('name')
      
      if (error) throw error
      
      const subcategoriesWithCount = subData?.map(sub => ({
        ...sub,
        song_count: sub.songs?.[0]?.count || 0
      })) || []
      
      setSubcategories(subcategoriesWithCount)
      setFilteredSubcategories(subcategoriesWithCount)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  const listItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  }

  const totalSongs = subcategories.reduce((sum, sub) => sum + (sub.song_count || 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30">
      <UserHeader 
        title={category?.name || 'Subcategories'} 
        subtitle={`${filteredSubcategories.length} subcategories • ${totalSongs} songs`}
        showBack 
        showSearch
        onSearch={(query) => setSearchTerm(query)}
      />
      
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Category Hero Banner */}
        {category && category.image_url && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 relative rounded-2xl overflow-hidden h-32 sm:h-40"
          >
            <Image
              src={category.image_url}
              alt={category.name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
            <div className="relative h-full flex items-center px-6">
              <div>
                <p className="text-white/80 text-sm mb-1">Exploring</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">{category.name}</h2>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats and Controls Bar */}
        {!loading && filteredSubcategories.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl shadow-sm border border-primary-100"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-church-gold/10 rounded-full flex items-center justify-center">
                <FaFolder className="w-4 h-4 text-church-gold" />
              </div>
              <span className="text-sm text-primary-600">
                <span className="font-semibold text-church-dark">{filteredSubcategories.length}</span> subcategories
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex bg-primary-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'grid'
                      ? 'bg-church-gold text-white shadow-sm'
                      : 'text-primary-600 hover:bg-primary-200'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'list'
                      ? 'bg-church-gold text-white shadow-sm'
                      : 'text-primary-600 hover:bg-primary-200'
                  }`}
                >
                  List
                </button>
              </div>

              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="flex items-center gap-1 text-sm text-primary-500 hover:text-church-gold transition-colors"
                >
                  <FaTimes className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-church-gold/20 border-t-church-gold rounded-full animate-spin mx-auto mb-4" />
              <p className="text-primary-600">Loading subcategories...</p>
            </div>
          </div>
        ) : filteredSubcategories.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaFolder className="w-12 h-12 text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-church-dark mb-2">No subcategories found</h3>
            <p className="text-primary-500">
              {searchTerm ? `No subcategories matching "${searchTerm}"` : 'No subcategories available in this category'}
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
        ) : viewMode === 'grid' ? (
          // Grid View
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
          >
            <AnimatePresence>
              {filteredSubcategories.map((subcategory) => (
                <motion.div
                  key={subcategory.id}
                  variants={itemVariants}
                  whileHover={{ y: -8 }}
                  whileTap={{ scale: 0.98 }}
                  layout
                  onClick={() => router.push(`/subcategories/${subcategory.id}`)}
                  className="group cursor-pointer"
                >
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-primary-100 h-full">
                    {/* Image Container */}
                    <div className="relative h-44 overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200">
                      {subcategory.image_url ? (
                        <Image
                          src={subcategory.image_url}
                          alt={subcategory.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                          <FaMusic className="w-12 h-12 text-primary-300 group-hover:scale-110 transition-transform duration-300" />
                          <span className="text-xs text-primary-400 mt-2">No image</span>
                        </div>
                      )}
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Song Count Badge */}
                      <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
                        <span className="text-white text-xs font-medium">
                          {subcategory.song_count || 0} songs
                        </span>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-church-dark group-hover:text-church-gold transition-colors line-clamp-2 mb-2">
                        {subcategory.name}
                      </h3>
                      
                      {/* Browse Button */}
                      <div className="flex items-center justify-between mt-3">
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
        ) : (
          // List View
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3 mb-3"
          >
            <AnimatePresence>
              {filteredSubcategories.map((subcategory) => (
                <motion.div
                  key={subcategory.id}
                  variants={listItemVariants}
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.99 }}
                  layout
                  onClick={() => router.push(`/subcategories/${subcategory.id}`)}
                  className="group cursor-pointer"
                >
                  <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-primary-100">
                    <div className="flex items-center gap-4">
                      {/* Small Image/Icon */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200 flex-shrink-0">
                        {subcategory.image_url ? (
                          <Image
                            src={subcategory.image_url}
                            alt={subcategory.name}
                            width={64}
                            height={64}
                            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <FaMusic className="w-6 h-6 text-primary-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-church-dark group-hover:text-church-gold transition-colors truncate">
                          {subcategory.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-primary-500">
                            {subcategory.song_count || 0} songs
                          </span>
                        </div>
                      </div>
                      
                      {/* Arrow */}
                      <FaChevronRight className="w-5 h-5 text-primary-400 group-hover:text-church-gold group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  )
}