'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, Song, SongImage, SongAudio } from '@/lib/supabase/client'
import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Zoom, Navigation } from 'swiper/modules'
import { 
  FaArrowLeft, FaPlay, FaPause, FaHeadphones, FaMusic, 
  FaHeart, FaShare, FaStepBackward, FaStepForward, 
  FaRandom, FaRedoAlt, FaVolumeUp, FaVolumeMute,
  FaDownload, FaList, FaChevronDown
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import UserHeader from '@/components/UserHeader'
import { motion, AnimatePresence } from 'framer-motion'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import 'swiper/css/zoom'

interface SongWithDetails extends Song {
  categories?: { name: string }
  subcategories?: { name: string }
  
}

export default function SongDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [song, setSong] = useState<SongWithDetails | null>(null)
  const [images, setImages] = useState<SongImage[]>([])
  const [audios, setAudios] = useState<SongAudio[]>([])
  const [currentAudio, setCurrentAudio] = useState<SongAudio | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const [loopMode, setLoopMode] = useState<'none' | 'one' | 'all'>('none')
  const [playlistSongs, setPlaylistSongs] = useState<SongWithDetails[]>([])
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(-1)
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [audioDropdownOpen, setAudioDropdownOpen] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchSongData()
    loadFavorites()
  }, [id])

  useEffect(() => {
    // Fetch playlist songs from same subcategory
    if (song) {
      fetchPlaylistSongs()
    }
  }, [song])

  useEffect(() => {
    if (currentAudio && audioRef.current) {
      audioRef.current.src = currentAudio.audio_url
      if (isPlaying) {
        audioRef.current.play()
      }
    }
  }, [currentAudio])

  const fetchPlaylistSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*, categories(name), subcategories(name)')
        .eq('subcategory_id', song?.subcategory_id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setPlaylistSongs(data || [])
      const index = data?.findIndex(s => s.id === song?.id) || 0
      setCurrentPlaylistIndex(index)
    } catch (error) {
      console.error('Error fetching playlist:', error)
    }
  }

  const fetchSongData = async () => {
    try {
      const { data: songData, error: songError } = await supabase
        .from('songs')
        .select('*, categories(name), subcategories(name)')
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
      toast.error('Failed to load song')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const loadFavorites = () => {
    const saved = localStorage.getItem('favoriteSongs')
    if (saved) {
      const favorites = JSON.parse(saved)
      setIsFavorite(favorites.includes(id))
    }
  }

  const handleAudioPlay = (audio: SongAudio) => {
    if (currentAudio?.id === audio.id && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    } else {
      setCurrentAudio(audio)
      setIsPlaying(true)
    }
    setAudioDropdownOpen(false)
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
      setDuration(audioRef.current.duration)
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current && audioRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const width = rect.width
      const percentage = x / width
      audioRef.current.currentTime = percentage * duration
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 1
        setIsMuted(false)
      } else {
        audioRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const playNext = () => {
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * playlistSongs.length)
      setCurrentPlaylistIndex(randomIndex)
      router.push(`/song/${playlistSongs[randomIndex].id}`)
    } else if (currentPlaylistIndex < playlistSongs.length - 1) {
      const nextIndex = currentPlaylistIndex + 1
      setCurrentPlaylistIndex(nextIndex)
      router.push(`/song/${playlistSongs[nextIndex].id}`)
    } else if (loopMode === 'all') {
      setCurrentPlaylistIndex(0)
      router.push(`/song/${playlistSongs[0].id}`)
    }
  }

  const playPrevious = () => {
    if (currentPlaylistIndex > 0) {
      const prevIndex = currentPlaylistIndex - 1
      setCurrentPlaylistIndex(prevIndex)
      router.push(`/song/${playlistSongs[prevIndex].id}`)
    } else if (loopMode === 'all' && playlistSongs.length > 0) {
      setCurrentPlaylistIndex(playlistSongs.length - 1)
      router.push(`/song/${playlistSongs[playlistSongs.length - 1].id}`)
    }
  }

  const toggleLoop = () => {
    const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all']
    const currentIndex = modes.indexOf(loopMode)
    const nextMode = modes[(currentIndex + 1) % modes.length]
    setLoopMode(nextMode)
    
    if (audioRef.current) {
      audioRef.current.loop = nextMode === 'one'
    }
  }

  const handleSongEnd = () => {
    if (loopMode === 'one') {
      audioRef.current?.play()
    } else {
      playNext()
    }
  }

  const handleFavorite = () => {
    const saved = localStorage.getItem('favoriteSongs')
    let favorites = saved ? JSON.parse(saved) : []
    
    if (isFavorite) {
      favorites = favorites.filter((favId: string) => favId !== id)
      toast.success('Removed from favorites')
    } else {
      favorites.push(id)
      toast.success('Added to favorites')
    }
    
    localStorage.setItem('favoriteSongs', JSON.stringify(favorites))
    setIsFavorite(!isFavorite)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: song?.title,
        text: `Check out this song: ${song?.title}`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  const getLoopIcon = () => {
    switch(loopMode) {
      case 'one': return <FaRedoAlt className="w-4 h-4" />
      case 'all': return <FaRedoAlt className="w-4 h-4 text-church-gold" />
      default: return <FaRedoAlt className="w-4 h-4 opacity-50" />
    }
  }

  const getAudioTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      geez: 'ግእዝ (Geez)',
      ezel: 'እዝል (Ezel)',
      araray: 'አራራይ (Araray)'
    }
    return types[type] || type
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-church-gold/20 border-t-church-gold rounded-full animate-spin mx-auto mb-4" />
          <p className="text-primary-600">Loading song...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30 pb-32">
      <UserHeader title={song?.title} showBack />
      
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Song Info Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 mb-6 border border-primary-100"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-church-dark mb-2">{song?.title}</h1>
              <div className="flex items-center gap-2 text-sm text-primary-600">
                <span>{song?.categories?.name}</span>
                <span>•</span>
                <span>{song?.subcategories?.name}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleFavorite}
                className="p-3 bg-primary-50 rounded-xl hover:bg-red-50 transition-all duration-300 active:scale-95"
              >
                <FaHeart className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-primary-400'}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-3 bg-primary-50 rounded-xl hover:bg-primary-100 transition-all duration-300 active:scale-95"
              >
                <FaShare className="w-5 h-5 text-primary-600" />
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lyrics Images */}
          <div className="lg:col-span-2">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 border border-primary-100"
            >
              <h2 className="text-xl font-bold text-church-dark mb-4 flex items-center gap-2">
                <FaMusic className="text-church-gold" />
                Lyrics
              </h2>
              
              {images.length === 0 ? (
                <div className="text-center py-12 bg-primary-50 rounded-xl">
                  <FaMusic className="w-16 h-16 text-primary-300 mx-auto mb-3" />
                  <p className="text-primary-500">No lyrics images available</p>
                </div>
              ) : (
                <div className="lyrics-viewer">
                  <Swiper
                    modules={[Pagination, Zoom, Navigation]}
                    pagination={{ clickable: true, dynamicBullets: true }}
                    navigation={true}
                    zoom={true}
                    spaceBetween={20}
                    slidesPerView={1}
                    className="rounded-xl overflow-hidden"
                  >
                    {images.map((image, index) => (
                      <SwiperSlide key={image.id}>
                        <div className="swiper-zoom-container">
                          <div className="relative w-full min-h-[400px] sm:min-h-[500px] bg-primary-50 rounded-xl">
                            <Image
                              src={image.image_url}
                              alt={`Lyrics page ${index + 1}`}
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
                </div>
              )}
            </motion.div>
          </div>

          {/* Audio Player Sidebar */}
          <div className="space-y-6">
            {/* Audio Player Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-primary-100 overflow-hidden sticky top-20"
            >
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaHeadphones className="text-church-gold" />
                  <h2 className="text-lg font-bold text-church-dark">Audio Player</h2>
                </div>

                {/* Audio Dropdown Selector */}
                <div className="relative mb-4">
                  <button
                    onClick={() => setAudioDropdownOpen(!audioDropdownOpen)}
                    className="w-full flex items-center justify-between p-3 bg-primary-50 rounded-xl border border-primary-200 hover:border-church-gold transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <FaHeadphones className="w-4 h-4 text-church-gold" />
                      <span className="font-medium text-church-dark">
                        {currentAudio ? getAudioTypeLabel(currentAudio.type) : 'Select Audio Version'}
                      </span>
                    </div>
                    <FaChevronDown className={`w-4 h-4 text-primary-500 transition-transform ${audioDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {audioDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-primary-100 z-10 overflow-hidden"
                      >
                        {audios.map((audio) => (
                          <button
                            key={audio.id}
                            onClick={() => handleAudioPlay(audio)}
                            className={`w-full text-left p-3 hover:bg-primary-50 transition-colors flex items-center justify-between ${
                              currentAudio?.id === audio.id ? 'bg-church-gold/10 text-church-gold' : 'text-primary-700'
                            }`}
                          >
                            <span>{getAudioTypeLabel(audio.type)}</span>
                            {currentAudio?.id === audio.id && isPlaying && (
                              <div className="flex gap-0.5">
                                <div className="w-1 h-3 bg-church-gold animate-pulse" />
                                <div className="w-1 h-4 bg-church-gold animate-pulse" style={{ animationDelay: '0.2s' }} />
                                <div className="w-1 h-2 bg-church-gold animate-pulse" style={{ animationDelay: '0.4s' }} />
                              </div>
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Current Playing Indicator */}
                {currentAudio && (
                  <div className="mb-4 p-3 bg-church-gold/10 rounded-xl">
                    <p className="text-xs text-primary-600 mb-1">Currently Playing</p>
                    <p className="font-semibold text-church-dark">{getAudioTypeLabel(currentAudio.type)}</p>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="mb-4">
                  <div 
                    ref={progressBarRef}
                    onClick={handleProgressClick}
                    className="h-2 bg-primary-100 rounded-full cursor-pointer overflow-hidden"
                  >
                    <div 
                      className="h-full bg-church-gold rounded-full relative"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-church-gold rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-primary-500">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button
                    onClick={toggleLoop}
                    className={`p-2 rounded-full transition-all hover:scale-110 ${loopMode !== 'none' ? 'text-church-gold' : 'text-primary-400'}`}
                    title={loopMode === 'one' ? 'Loop One' : loopMode === 'all' ? 'Loop All' : 'No Loop'}
                  >
                    {getLoopIcon()}
                  </button>
                  
                  <button
                    onClick={playPrevious}
                    disabled={playlistSongs.length <= 1}
                    className="p-3 rounded-full bg-primary-100 hover:bg-primary-200 transition-all hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <FaStepBackward className="w-5 h-5 text-primary-700" />
                  </button>
                  
                  <button
                    onClick={() => currentAudio && handleAudioPlay(currentAudio)}
                    className="w-16 h-16 rounded-full bg-church-gold hover:bg-church-gold/80 shadow-lg transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
                  >
                    {isPlaying ? (
                      <FaPause className="w-6 h-6 text-white" />
                    ) : (
                      <FaPlay className="w-6 h-6 text-white ml-1" />
                    )}
                  </button>
                  
                  <button
                    onClick={playNext}
                    disabled={playlistSongs.length <= 1}
                    className="p-3 rounded-full bg-primary-100 hover:bg-primary-200 transition-all hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <FaStepForward className="w-5 h-5 text-primary-700" />
                  </button>
                  
                  <button
                    onClick={() => setIsShuffle(!isShuffle)}
                    className={`p-2 rounded-full transition-all hover:scale-110 ${isShuffle ? 'text-church-gold' : 'text-primary-400'}`}
                    title={isShuffle ? 'Shuffle On' : 'Shuffle Off'}
                  >
                    <FaRandom className="w-4 h-4" />
                  </button>
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-3">
                  <button onClick={toggleMute} className="p-2 hover:bg-primary-100 rounded-lg transition-all">
                    {isMuted || volume === 0 ? (
                      <FaVolumeMute className="w-4 h-4 text-primary-500" />
                    ) : (
                      <FaVolumeUp className="w-4 h-4 text-primary-500" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="flex-1 h-2 bg-primary-100 rounded-lg appearance-none cursor-pointer accent-church-gold"
                  />
                </div>

                {/* Playlist Button */}
                {playlistSongs.length > 1 && (
                  <button
                    onClick={() => setShowPlaylist(!showPlaylist)}
                    className="w-full mt-4 flex items-center justify-center gap-2 p-2 bg-primary-50 rounded-xl text-primary-600 hover:bg-primary-100 transition-all"
                  >
                    <FaList className="w-4 h-4" />
                    <span className="text-sm">Playlist ({playlistSongs.length} songs)</span>
                    <FaChevronDown className={`w-3 h-3 transition-transform ${showPlaylist ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            </motion.div>

            {/* Playlist Section */}
            <AnimatePresence>
              {showPlaylist && playlistSongs.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-2xl shadow-sm border border-primary-100 overflow-hidden"
                >
                  <div className="p-4 border-b border-primary-100">
                    <h3 className="font-bold text-church-dark">Playlist</h3>
                    <p className="text-xs text-primary-500">Songs from same subcategory</p>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {playlistSongs.map((playlistSong, index) => (
                      <button
                        key={playlistSong.id}
                        onClick={() => {
                          if (playlistSong.id !== song?.id) {
                            router.push(`/song/${playlistSong.id}`)
                          }
                        }}
                        className={`w-full text-left p-4 hover:bg-primary-50 transition-colors flex items-center gap-3 ${
                          playlistSong.id === song?.id ? 'bg-church-gold/10' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                          <FaMusic className="w-4 h-4 text-primary-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${playlistSong.id === song?.id ? 'text-church-gold' : 'text-church-dark'}`}>
                            {playlistSong.title}
                          </p>
                          {playlistSong.id === song?.id && (
                            <p className="text-xs text-church-gold">Currently Playing</p>
                          )}
                        </div>
                        {playlistSong.id === song?.id && isPlaying && (
                          <div className="flex gap-0.5">
                            <div className="w-1 h-3 bg-church-gold animate-pulse" />
                            <div className="w-1 h-4 bg-church-gold animate-pulse" style={{ animationDelay: '0.2s' }} />
                            <div className="w-1 h-2 bg-church-gold animate-pulse" style={{ animationDelay: '0.4s' }} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Info Card */}
            <div className="bg-gradient-to-r from-church-gold to-church-gold/80 rounded-2xl p-5 text-white">
              <h3 className="font-bold mb-2">About this song</h3>
              <p className="text-sm text-white/90 mb-3">
                Listen to multiple audio versions and follow along with the lyrics images.
              </p>
              <div className="text-xs text-white/70">
                Added: {new Date(song?.created_at || '').toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={handleSongEnd}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  )
}