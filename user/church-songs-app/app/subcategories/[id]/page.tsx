'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { 
  FaMusic, FaHeadphones, FaCalendar, FaEye, 
  FaPlay, FaHeart, FaRegHeart, FaClock, FaSearch,
  FaTimes, FaChevronRight, FaChartLine
} from 'react-icons/fa'
import UserHeader from '@/components/UserHeader'

interface Song {
  id: string
  title: string
  created_at: string
  category_id: string
  subcategory_id: string
  audio_files?: { type: string }[]
  view_count?: number
}

interface Subcategory {
  id: string
  name: string
  category: {
    id: string
    name: string
  }
}

export default function SongsPage() {
  const { id } = useParams()
  const router = useRouter()
  const [songs, setSongs] = useState<Song[]>([])
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([])
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchData()
    loadFavorites()
  }, [id])

  useEffect(() => {
    let filtered = [...songs]
    
    if (searchTerm) {
      filtered = filtered.filter(song => 
        song.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Sort songs
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else {
        return a.title.localeCompare(b.title)
      }
    })
    
    setFilteredSongs(filtered)
  }, [searchTerm, songs, sortBy])

  const loadFavorites = () => {
    const saved = localStorage.getItem('favoriteSongs')
    if (saved) {
      setFavorites(new Set(JSON.parse(saved)))
    }
  }

  const toggleFavorite = (songId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newFavorites = new Set(favorites)
    if (newFavorites.has(songId)) {
      newFavorites.delete(songId)
    } else {
      newFavorites.add(songId)
    }
    setFavorites(newFavorites)
    localStorage.setItem('favoriteSongs', JSON.stringify([...newFavorites]))
  }

  const fetchData = async () => {
    try {
      // Fetch subcategory details with category
      const { data: subData } = await supabase
        .from('subcategories')
        .select(`
          *,
          category:categories(id, name)
        `)
        .eq('id', id)
        .single()
      
      setSubcategory(subData)

      // Fetch songs with audio files count
      const { data: songsData, error } = await supabase
        .from('songs')
        .select(`
          *,
          song_audios(type)
        `)
        .eq('subcategory_id', id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      const songsWithDetails = songsData?.map(song => ({
        ...song,
        audio_files: song.song_audios || [],
        view_count: Math.floor(Math.random() * 1000) // Placeholder - replace with actual view count
      })) || []
      
      setSongs(songsWithDetails)
      setFilteredSongs(songsWithDetails)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAudioIcon = (count: number) => {
    if (count === 0) return null
    if (count === 1) return <FaHeadphones className="w-3 h-3" />
    return <FaHeadphones className="w-3 h-3" />
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30">
      <UserHeader 
        title={subcategory?.name || 'Songs'} 
        subtitle={`${filteredSongs.length} songs • ${subcategory?.category?.name || ''}`}
        showBack 
        showSearch
        onSearch={(query) => setSearchTerm(query)}
      />
      
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Category Info Banner */}
        {subcategory && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gradient-to-r from-primary-100 to-primary-50 rounded-2xl border border-primary-200"
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-church-gold/20 rounded-xl flex items-center justify-center">
                  <FaMusic className="w-5 h-5 text-church-gold" />
                </div>
                <div>
                  <p className="text-xs text-primary-600">Category</p>
                  <p className="font-semibold text-church-dark">{subcategory.category?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-church-gold/20 rounded-xl flex items-center justify-center">
                  <FaChartLine className="w-5 h-5 text-church-gold" />
                </div>
                <div>
                  <p className="text-xs text-primary-600">Total Songs</p>
                  <p className="font-semibold text-church-dark">{songs.length} songs</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats and Controls Bar */}
        {!loading && filteredSongs.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl shadow-sm border border-primary-100"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-church-gold/10 rounded-full flex items-center justify-center">
                <FaMusic className="w-4 h-4 text-church-gold" />
              </div>
              <span className="text-sm text-primary-600">
                <span className="font-semibold text-church-dark">{filteredSongs.length}</span> songs found
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-700 focus:outline-none focus:ring-2 focus:ring-church-gold"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">A-Z</option>
              </select>

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
              <p className="text-primary-600">Loading songs...</p>
            </div>
          </div>
        ) : filteredSongs.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaMusic className="w-12 h-12 text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-church-dark mb-2">No songs found</h3>
            <p className="text-primary-500">
              {searchTerm ? `No songs matching "${searchTerm}"` : 'No songs available in this subcategory'}
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
          // List View Songs
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            <AnimatePresence>
              {filteredSongs.map((song, index) => (
                <motion.div
                  key={song.id}
                  variants={itemVariants}
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.99 }}
                  layout
                  onClick={() => router.push(`/song/${song.id}`)}
                  className="group cursor-pointer"
                >
                  <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-primary-100">
                    <div className="flex items-start gap-4">
                      {/* Song Icon */}
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-church-gold/20 to-primary-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <FaMusic className="w-7 h-7 text-church-gold" />
                      </div>
                      
                      {/* Song Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-bold text-church-dark group-hover:text-church-gold transition-colors line-clamp-2">
                              {song.title}
                            </h3>
                            
                            {/* Song Metadata */}
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              <div className="flex items-center gap-1 text-xs text-primary-500">
                                <FaCalendar className="w-3 h-3" />
                                <span>{new Date(song.created_at).toLocaleDateString()}</span>
                              </div>
                              
                              {song.audio_files && song.audio_files.length > 0 && (
                                <div className="flex items-center gap-1 text-xs text-primary-500">
                                  <FaHeadphones className="w-3 h-3" />
                                  <span>{song.audio_files.length} audio versions</span>
                                </div>
                              )}
                              
                              {song.view_count && (
                                <div className="flex items-center gap-1 text-xs text-primary-500">
                                  <FaEye className="w-3 h-3" />
                                  <span>{song.view_count} views</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => toggleFavorite(song.id, e)}
                              className="p-2 rounded-lg hover:bg-primary-100 transition-colors"
                            >
                              {favorites.has(song.id) ? (
                                <FaHeart className="w-5 h-5 text-red-500 fill-current" />
                              ) : (
                                <FaRegHeart className="w-5 h-5 text-primary-400" />
                              )}
                            </button>
                            
                            <div className="w-8 h-8 rounded-full bg-primary-100 group-hover:bg-church-gold transition-all duration-300 flex items-center justify-center">
                              <FaChevronRight className="w-4 h-4 text-primary-600 group-hover:text-white transition-colors" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Audio Version Tags */}
                        {song.audio_files && song.audio_files.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {song.audio_files.map((audio, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-0.5 bg-primary-100 text-primary-600 rounded-full"
                              >
                                {audio.type}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
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