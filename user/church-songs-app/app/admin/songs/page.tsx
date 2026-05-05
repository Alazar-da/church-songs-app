'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Song, Category, Subcategory } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { FaPlus, FaEdit, FaTrash, FaMusic, FaEye, FaSpinner, FaTimes, FaCalendarAlt, FaFolder, FaHeadphones, FaImage } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function SongsManagementPage() {
  const [songs, setSongs] = useState<(Song & { categories?: Category; subcategories?: Subcategory })[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { profile } = useAuthStore()
  const router = useRouter()

  const isSuperAdmin = profile?.roles?.name === 'super_admin'
  const isCategoryAdmin = profile?.roles?.name === 'category_admin'


// Add this useEffect to fetch songs with category filtering
useEffect(() => {
  if (profile) {
    if (!isSuperAdmin && !isCategoryAdmin) {
      router.push('/admin/dashboard')
      return
    }
    fetchSongs()
  }
}, [profile])

const fetchSongs = async () => {
  try {
    let query = supabase
      .from('songs')
      .select('*, categories(*), subcategories(*)')
      .order('created_at', { ascending: false })
    
    // For category admin, only show songs from their assigned categories
    if (isCategoryAdmin) {
      const { data: adminCats } = await supabase
        .from('admin_categories')
        .select('category_id')
        .eq('admin_id', profile?.id)
      
      const categoryIds = adminCats?.map(ac => ac.category_id) || []
      if (categoryIds.length > 0) {
        query = query.in('category_id', categoryIds)
      } else {
        setSongs([])
        setLoading(false)
        return
      }
    }
    
    const { data, error } = await query
    
    if (error) throw error
    setSongs(data || [])
  } catch (error) {
    toast.error('Failed to load songs')
  } finally {
    setLoading(false)
  }
}

  const handleDelete = async () => {
    if (!selectedSong) return
    
    setDeleting(true)
    try {
      // Delete images from storage
      const { data: images } = await supabase
        .from('song_images')
        .select('image_url')
        .eq('song_id', selectedSong.id)
      
      if (images) {
        for (const image of images) {
          const path = image.image_url.split('/').pop()
          if (path) {
            await supabase.storage.from('song-images').remove([path])
          }
        }
      }
      
      // Delete audio files from storage
      const { data: audios } = await supabase
        .from('song_audios')
        .select('audio_url')
        .eq('song_id', selectedSong.id)
      
      if (audios) {
        for (const audio of audios) {
          const path = audio.audio_url.split('/').pop()
          if (path) {
            await supabase.storage.from('song-audio').remove([path])
          }
        }
      }
      
      // Delete song (cascades to images and audios)
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', selectedSong.id)
      
      if (error) throw error
      
      toast.success('Song deleted successfully')
      fetchSongs()
      setShowDeleteModal(false)
      setSelectedSong(null)
    } catch (error) {
      toast.error('Failed to delete song')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
        <div className="text-center px-4">
          <FaSpinner className="animate-spin h-12 w-12 text-church-gold mx-auto mb-4" />
          <p className="text-primary-700 font-medium">Loading songs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30">
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header Section - Mobile First */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-8 bg-church-gold rounded-full"></div>
                <span className="text-xs sm:text-sm font-semibold text-church-gold uppercase tracking-wider">Management</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-church-dark">
                Songs
              </h1>
              <p className="text-sm sm:text-base text-primary-600 mt-1 sm:mt-2">
                Manage your church songs collection
              </p>
            </div>
            
            <button
              onClick={() => router.push('/admin/songs/new')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-church-gold hover:bg-church-gold/80 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 active:scale-95"
            >
              <FaPlus className="text-sm sm:text-base" />
              <span>Add New Song</span>
            </button>
          </div>
        </div>

        {/* Songs Grid - Mobile First */}
        {songs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 sm:p-12 text-center shadow-sm border border-primary-100">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaMusic className="w-10 h-10 sm:w-12 sm:h-12 text-church-gold" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-church-dark mb-2">No songs yet</h3>
            <p className="text-primary-600 text-sm sm:text-base mb-6">
              Start building your church music collection by adding your first song
            </p>
            <button
              onClick={() => router.push('/admin/songs/new')}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-church-gold text-white rounded-xl font-semibold hover:bg-church-gold/80 transition-all shadow-md active:scale-95"
            >
              <FaPlus />
              Add New Song
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {songs.map((song, index) => (
              <div
                key={song.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 active:scale-[0.99] border border-primary-100"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Song Icon - Mobile First */}
                    <div className="relative w-full sm:w-20 h-32 sm:h-20 rounded-xl overflow-hidden bg-gradient-to-br from-church-gold/10 to-primary-100 flex-shrink-0 flex items-center justify-center">
                      <FaMusic className="w-10 h-10 sm:w-8 sm:h-8 text-church-gold" />
                    </div>

                    {/* Song Info */}
                    <div className="flex-1 space-y-2">
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-church-dark group-hover:text-church-gold transition-colors line-clamp-1">
                          {song.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap mt-1.5">
                          <div className="flex items-center gap-1 text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                            <FaFolder className="w-3 h-3" />
                            <span>{song.categories?.name || 'Uncategorized'}</span>
                          </div>
                          <span className="text-xs text-primary-300">•</span>
                          <div className="flex items-center gap-1 text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                            <FaMusic className="w-3 h-3" />
                            <span>{song.subcategories?.name || 'No subcategory'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-primary-500">
                        <div className="flex items-center gap-1">
                          <FaCalendarAlt className="w-3 h-3" />
                          <span>{new Date(song.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaImage className="w-3 h-3" />
                          <span>Images</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaHeadphones className="w-3 h-3" />
                          <span>Audio</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 sm:gap-2">
                      <Link
                        href={`/admin/songs/view/${song.id}`}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all duration-300 active:scale-95 text-sm sm:text-base"
                      >
                        <FaEye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">View</span>
                      </Link>
                      <Link
                        href={`/admin/songs/edit/${song.id}`}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-church-gold hover:bg-church-gold/80 text-white rounded-lg font-medium transition-all duration-300 active:scale-95 text-sm sm:text-base"
                      >
                        <FaEdit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Edit</span>
                      </Link>
                      <button
                        onClick={() => {
                          setSelectedSong(song)
                          setShowDeleteModal(true)
                        }}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-300 active:scale-95 text-sm sm:text-base"
                      >
                        <FaTrash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal - Mobile First */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-slideUp mx-4">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 sm:p-5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FaTrash className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                  <h2 className="text-lg sm:text-xl font-bold text-white">Delete Song</h2>
                </div>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-white/80 hover:text-white transition-colors active:scale-90"
                >
                  <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-5 sm:p-6">
              <div className="mb-5 sm:mb-6">
                <p className="text-primary-800 text-sm sm:text-base mb-2">
                  Are you sure you want to delete <span className="font-semibold text-red-600">"{selectedSong?.title}"</span>?
                </p>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded-lg mt-3">
                  <p className="text-xs sm:text-sm text-yellow-800">
                    ⚠️ Warning: This will permanently remove all lyrics images and audio files associated with this song. This action cannot be undone.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2.5 bg-gray-100 text-primary-700 rounded-lg font-medium hover:bg-gray-200 transition-colors active:scale-95 order-2 sm:order-1"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-1 sm:order-2 active:scale-95"
                >
                  {deleting ? (
                    <>
                      <FaSpinner className="animate-spin w-4 h-4" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FaTrash className="w-4 h-4" />
                      Delete Song
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}