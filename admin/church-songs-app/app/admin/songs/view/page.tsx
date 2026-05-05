'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, Song, SongImage, SongAudio, Category, Subcategory } from '@/lib/supabase/client'
import { 
  FaArrowLeft, 
  FaMusic, 
  FaImages, 
  FaHeadphones, 
  FaCalendar, 
  FaUser,
  FaFolder,
  FaList,
  FaPlay,
  FaPause,
  FaEdit,
  FaTrash,
  FaEye,
  FaSpinner,
  FaTimes,
  FaInfoCircle,
  FaDownload
} from 'react-icons/fa'
import Image from 'next/image'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Zoom, Navigation } from 'swiper/modules'
import { useSearchParams } from 'next/navigation'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import 'swiper/css/zoom'

interface SongWithDetails extends Song {
  categories: Category
  subcategories: Subcategory
  created_by_profile?: {
    full_name: string
  }
}

export default function ViewSongPage() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const router = useRouter()
  const [song, setSong] = useState<SongWithDetails | null>(null)
  const [images, setImages] = useState<SongImage[]>([])
  const [audios, setAudios] = useState<SongAudio[]>([])
  const [loading, setLoading] = useState(true)
  const [currentAudio, setCurrentAudio] = useState<SongAudio | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    fetchSongData()
  }, [id])

  const fetchSongData = async () => {
    try {
      const { data: songData, error: songError } = await supabase
        .from('songs')
        .select(`
          *,
          categories(*),
          subcategories(*),
          created_by_profile:profiles(full_name)
        `)
        .eq('id', id)
        .single()
      
      if (songError) throw songError
      setSong(songData)

      const { data: imagesData, error: imagesError } = await supabase
        .from('song_images')
        .select('*')
        .eq('song_id', id)
        .order('order_index', { ascending: true })
      
      if (imagesError) throw imagesError
      setImages(imagesData || [])

      const { data: audiosData, error: audiosError } = await supabase
        .from('song_audios')
        .select('*')
        .eq('song_id', id)
      
      if (audiosError) throw audiosError
      setAudios(audiosData || [])
      
      if (audiosData && audiosData.length > 0) {
        setCurrentAudio(audiosData[0])
      }
    } catch (error) {
      console.error('Error fetching song:', error)
      toast.error('Failed to load song details')
      router.push('/admin/songs')
    } finally {
      setLoading(false)
    }
  }

  const handleAudioPlay = (audio: SongAudio) => {
    if (currentAudio?.id === audio.id && audioElement) {
      if (isPlaying) {
        audioElement.pause()
        setIsPlaying(false)
      } else {
        audioElement.play()
        setIsPlaying(true)
      }
    } else {
      setCurrentAudio(audio)
      setIsPlaying(true)
    }
  }

  useEffect(() => {
    if (currentAudio && audioElement) {
      audioElement.src = currentAudio.audio_url
      if (isPlaying) {
        audioElement.play()
      }
    }
  }, [currentAudio])

  const getAudioTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      geez: 'ግእዝ (Geez)',
      ezel: 'እዝል (Ezel)',
      araray: 'አራራይ (Araray)'
    }
    return types[type] || type
  }

  const getAudioTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      geez: 'from-purple-500 to-purple-600',
      ezel: 'from-blue-500 to-blue-600',
      araray: 'from-green-500 to-green-600'
    }
    return colors[type] || 'from-gray-500 to-gray-600'
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      for (const image of images) {
        const path = image.image_url.split('/').pop()
        if (path) {
          await supabase.storage.from('song-images').remove([path])
        }
      }
      
      for (const audio of audios) {
        const path = audio.audio_url.split('/').pop()
        if (path) {
          await supabase.storage.from('song-audio').remove([path])
        }
      }
      
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      toast.success('Song deleted successfully')
      router.push('/admin/songs')
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
          <p className="text-primary-700 font-medium">Loading song details...</p>
        </div>
      </div>
    )
  }

  if (!song) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
        <div className="text-center">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaMusic className="w-10 h-10 text-primary-400" />
          </div>
          <p className="text-primary-600 mb-4">Song not found</p>
          <button
            onClick={() => router.push('/admin/songs')}
            className="bg-church-gold hover:bg-church-gold/80 text-white px-6 py-2 rounded-xl font-semibold transition-all"
          >
            Back to Songs
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30 pb-20">
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <Link href="/admin/songs" className="inline-flex items-center gap-2 text-primary-600 hover:text-church-gold transition-colors mb-4 group">
            <FaArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Songs</span>
          </Link>
        </div>

        {/* Song Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-primary-100 overflow-hidden mb-6">
          <div className="relative bg-gradient-to-r from-church-gold/10 to-primary-100 p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-church-gold to-church-gold/80 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <FaMusic className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-church-dark mb-2">
                    {song.title}
                  </h1>
                  <div className="flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-1.5 text-sm text-primary-600 bg-white/60 px-3 py-1 rounded-full">
                      <FaFolder className="w-3 h-3 text-church-gold" />
                      {song.categories?.name}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm text-primary-600 bg-white/60 px-3 py-1 rounded-full">
                      <FaList className="w-3 h-3 text-church-gold" />
                      {song.subcategories?.name}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm text-primary-600 bg-white/60 px-3 py-1 rounded-full">
                      <FaCalendar className="w-3 h-3 text-church-gold" />
                      {new Date(song.created_at).toLocaleDateString()}
                    </span>
                    {song.created_by_profile && (
                      <span className="inline-flex items-center gap-1.5 text-sm text-primary-600 bg-white/60 px-3 py-1 rounded-full">
                        <FaUser className="w-3 h-3 text-church-gold" />
                        By: {song.created_by_profile.full_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/admin/songs/edit/${song.id}`)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-church-gold hover:bg-church-gold/80 text-white rounded-xl font-semibold transition-all duration-300 active:scale-95"
                >
                  <FaEdit className="w-4 h-4" />
                  Edit Song
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all duration-300 active:scale-95"
                >
                  <FaTrash className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Lyrics Images */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-primary-100 overflow-hidden">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaImages className="w-5 h-5 text-church-gold" />
                  <h2 className="text-lg sm:text-xl font-bold text-church-dark">Lyrics Images</h2>
                  <span className="text-xs text-primary-500 ml-2">({images.length} pages)</span>
                </div>
                
                {images.length === 0 ? (
                  <div className="text-center py-12 bg-primary-50 rounded-xl">
                    <FaImages className="w-16 h-16 text-primary-300 mx-auto mb-3" />
                    <p className="text-primary-500">No lyrics images uploaded</p>
                    <p className="text-primary-400 text-sm mt-1">Add images when editing the song</p>
                  </div>
                ) : (
                  <div className="lyrics-viewer">
                    <Swiper
                      modules={[Pagination, Zoom, Navigation]}
                      pagination={{ 
                        clickable: true, 
                        dynamicBullets: true,
                        renderBullet: (index, className) => {
                          return `<span class="${className}">${index + 1}</span>`
                        }
                      }}
                      navigation={true}
                      zoom={true}
                      spaceBetween={20}
                      slidesPerView={1}
                      onSlideChange={(swiper) => setCurrentImageIndex(swiper.activeIndex)}
                      className="rounded-xl overflow-hidden"
                    >
                      {images.map((image, index) => (
                        <SwiperSlide key={image.id}>
                          <div className="swiper-zoom-container">
                            <div className="relative w-full min-h-[400px] sm:min-h-[500px] bg-primary-50 rounded-xl">
                              <Image
                                src={image.image_url}
                                alt={`Lyrics page ${index + 1} - ${song.title}`}
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 100vw, 800px"
                              />
                            </div>
                          </div>
                          <div className="text-center py-4 text-primary-500 text-sm">
                            Page {index + 1} of {images.length}
                          </div>
                        </SwiperSlide>
                      ))}
                    </Swiper>
                    
                    {/* Image Counter */}
                    <div className="flex justify-center gap-2 mt-2">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            const swiper = (document.querySelector('.swiper') as any)?.swiper
                            if (swiper) swiper.slideTo(index)
                          }}
                          className={`w-2 h-2 rounded-full transition-all ${
                            currentImageIndex === index
                              ? 'w-6 bg-church-gold'
                              : 'bg-primary-300 hover:bg-primary-400'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Audio Files */}
            <div className="bg-white rounded-2xl shadow-sm border border-primary-100 overflow-hidden">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaHeadphones className="w-5 h-5 text-church-gold" />
                  <h2 className="text-lg sm:text-xl font-bold text-church-dark">Audio Versions</h2>
                  <span className="text-xs text-primary-500 ml-2">({audios.length} versions)</span>
                </div>
                
                {audios.length === 0 ? (
                  <div className="text-center py-8 bg-primary-50 rounded-xl">
                    <FaHeadphones className="w-12 h-12 text-primary-300 mx-auto mb-2" />
                    <p className="text-primary-500 text-sm">No audio files uploaded</p>
                    <p className="text-primary-400 text-xs mt-1">Add audio when editing the song</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {audios.map((audio) => (
                      <div
                        key={audio.id}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          currentAudio?.id === audio.id
                            ? 'border-church-gold bg-church-gold/5'
                            : 'border-primary-200 hover:border-church-gold/50 bg-primary-50'
                        }`}
                        onClick={() => handleAudioPlay(audio)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getAudioTypeColor(audio.type)} flex items-center justify-center`}>
                              <FaMusic className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-church-dark">
                              {getAudioTypeLabel(audio.type)}
                            </span>
                          </div>
                          <button className="w-10 h-10 rounded-full bg-church-gold text-white flex items-center justify-center hover:bg-church-gold/80 transition-all hover:scale-105">
                            {currentAudio?.id === audio.id && isPlaying ? (
                              <FaPause className="w-4 h-4" />
                            ) : (
                              <FaPlay className="w-4 h-4 ml-0.5" />
                            )}
                          </button>
                        </div>
                        
                        {/* Audio Waveform Visualization */}
                        <div className="flex items-center gap-0.5 h-8">
                          {[...Array(20)].map((_, i) => (
                            <div
                              key={i}
                              className={`flex-1 rounded-full transition-all ${
                                currentAudio?.id === audio.id
                                  ? 'bg-church-gold'
                                  : 'bg-primary-300'
                              }`}
                              style={{
                                height: `${Math.sin(i * 0.5) * 15 + 10}px`,
                                opacity: currentAudio?.id === audio.id ? 1 : 0.5
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <audio
                  ref={el => setAudioElement(el)}
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  className="hidden"
                />
              </div>
            </div>

            {/* Song Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-primary-100 overflow-hidden">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaInfoCircle className="w-5 h-5 text-church-gold" />
                  <h2 className="text-lg sm:text-xl font-bold text-church-dark">Song Information</h2>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 border-b border-primary-100">
                    <span className="text-primary-600">Total Images</span>
                    <span className="font-semibold text-church-dark">{images.length} pages</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-primary-100">
                    <span className="text-primary-600">Total Audio</span>
                    <span className="font-semibold text-church-dark">{audios.length} versions</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-primary-100">
                    <span className="text-primary-600">Category</span>
                    <span className="font-semibold text-church-dark">{song.categories?.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-primary-100">
                    <span className="text-primary-600">Subcategory</span>
                    <span className="font-semibold text-church-dark">{song.subcategories?.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-primary-600">Created</span>
                    <span className="font-semibold text-church-dark">
                      {new Date(song.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-church-gold to-church-gold/80 rounded-2xl shadow-sm p-6 text-white">
              <h2 className="text-xl font-bold mb-2">Quick Actions</h2>
              <p className="text-white/90 text-sm mb-4">Need to make changes to this song?</p>
              <div className="space-y-2">
                <button
                  onClick={() => router.push(`/admin/songs/edit/${song.id}`)}
                  className="w-full bg-white/20 hover:bg-white/30 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:scale-105"
                >
                  Edit Song Details
                </button>
                <button
                  onClick={() => router.push(`/admin/songs/edit/${song.id}#images`)}
                  className="w-full bg-white/20 hover:bg-white/30 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:scale-105"
                >
                  Manage Lyrics Images
                </button>
                <button
                  onClick={() => router.push(`/admin/songs/edit/${song.id}#audio`)}
                  className="w-full bg-white/20 hover:bg-white/30 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:scale-105"
                >
                  Manage Audio Files
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
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
              <div className="text-center mb-5">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaMusic className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-primary-800 font-medium mb-2">
                  Delete "{song.title}"?
                </p>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded-lg mt-3 text-left">
                  <p className="text-xs sm:text-sm text-yellow-800">
                    ⚠️ Warning: This action cannot be undone. All lyrics images and audio files will be permanently deleted.
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
                      Delete Permanently
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