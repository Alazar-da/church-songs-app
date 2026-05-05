'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase, Category, Subcategory, SongImage, SongAudio } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { FaArrowLeft, FaUpload, FaSave, FaTrash, FaMusic, FaImage, FaHeadphones, FaSpinner, FaTimes, FaInfoCircle, FaPlay } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Image from 'next/image'
import Link from 'next/link'

type AudioType = 'geez' | 'ezel' | 'araray'

export default function EditSongPage() {
  const router = useRouter()
  const { id } = useParams()
  const { profile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    subcategory_id: '',
  })
  const [existingImages, setExistingImages] = useState<SongImage[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])
  const [existingAudios, setExistingAudios] = useState<SongAudio[]>([])
  const [newAudios, setNewAudios] = useState<{ type: AudioType; file: File | null }[]>([
    { type: 'geez', file: null },
    { type: 'ezel', file: null },
    { type: 'araray', file: null },
  ])
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null)
  const [deletingAudioId, setDeletingAudioId] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
    fetchSongData()
  }, [])

  const fetchCategories = async () => {
    try {
      let query = supabase.from('categories').select('*')
      
      if (profile?.roles?.name === 'category_admin') {
        const { data: adminCats } = await supabase
          .from('admin_categories')
          .select('category_id')
          .eq('admin_id', profile.id)
        
        const categoryIds = adminCats?.map(ac => ac.category_id) || []
        if (categoryIds.length > 0) {
          query = query.in('id', categoryIds)
        } else {
          setCategories([])
          return
        }
      }
      
      const { data, error } = await query.order('name')
      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      toast.error('Failed to load categories')
    }
  }

  const fetchSongData = async () => {
    try {
      const { data: songData, error: songError } = await supabase
        .from('songs')
        .select('*')
        .eq('id', id)
        .single()
      
      if (songError) throw songError
      
      setFormData({
        title: songData.title,
        category_id: songData.category_id,
        subcategory_id: songData.subcategory_id,
      })
      
      if (songData.category_id) {
        await fetchSubcategories(songData.category_id)
      }
      
      const { data: imagesData } = await supabase
        .from('song_images')
        .select('*')
        .eq('song_id', id)
        .order('order_index', { ascending: true })
      
      setExistingImages(imagesData || [])
      
      const { data: audiosData } = await supabase
        .from('song_audios')
        .select('*')
        .eq('song_id', id)
      
      setExistingAudios(audiosData || [])
    } catch (error) {
      toast.error('Failed to load song')
      router.push('/admin/songs')
    } finally {
      setFetching(false)
    }
  }

  const fetchSubcategories = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .eq('category_id', categoryId)
        .order('name')
      
      if (error) throw error
      setSubcategories(data || [])
    } catch (error) {
      toast.error('Failed to load subcategories')
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`)
        return false
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB`)
        return false
      }
      return true
    })
    
    setNewImages(prev => [...prev, ...validFiles])
    const newPreviews = validFiles.map(file => URL.createObjectURL(file))
    setNewImagePreviews(prev => [...prev, ...newPreviews])
  }

  const removeExistingImage = async (image: SongImage) => {
    setDeletingImageId(image.id)
    try {
      const path = image.image_url.split('/').pop()
      if (path) {
        await supabase.storage.from('song-images').remove([path])
      }
      
      await supabase.from('song_images').delete().eq('id', image.id)
      
      setExistingImages(prev => prev.filter(img => img.id !== image.id))
      toast.success('Image removed')
    } catch (error) {
      toast.error('Failed to remove image')
    } finally {
      setDeletingImageId(null)
    }
  }

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
    URL.revokeObjectURL(newImagePreviews[index])
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleAudioUpload = (type: AudioType, file: File | null) => {
    if (file && !file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file')
      return
    }
    if (file && file.size > 20 * 1024 * 1024) {
      toast.error('Audio file should be less than 20MB')
      return
    }
    setNewAudios(prev => prev.map(audio => 
      audio.type === type ? { ...audio, file } : audio
    ))
  }

  const removeExistingAudio = async (audio: SongAudio) => {
    setDeletingAudioId(audio.id)
    try {
      const path = audio.audio_url.split('/').pop()
      if (path) {
        await supabase.storage.from('song-audio').remove([path])
      }
      
      await supabase.from('song_audios').delete().eq('id', audio.id)
      
      setExistingAudios(prev => prev.filter(a => a.id !== audio.id))
      toast.success('Audio removed')
    } catch (error) {
      toast.error('Failed to remove audio')
    } finally {
      setDeletingAudioId(null)
    }
  }

  const removeNewAudio = (type: AudioType) => {
    setNewAudios(prev => prev.map(audio => 
      audio.type === type ? { ...audio, file: null } : audio
    ))
  }

  const uploadToStorage = async (file: File, path: string) => {
    const { error } = await supabase.storage.from('song-images').upload(path, file)
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('song-images').getPublicUrl(path)
    return publicUrl
  }

  const uploadAudioToStorage = async (file: File, path: string) => {
    const { error } = await supabase.storage.from('song-audio').upload(path, file)
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('song-audio').getPublicUrl(path)
    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.category_id || !formData.subcategory_id) {
      toast.error('Please fill all required fields')
      return
    }
    
    setLoading(true)
    
    try {
      const { error: updateError } = await supabase
        .from('songs')
        .update({
          title: formData.title,
          category_id: formData.category_id,
          subcategory_id: formData.subcategory_id,
        })
        .eq('id', id)
      
      if (updateError) throw updateError
      
      const imageUploads = newImages.map(async (image, index) => {
        const fileExt = image.name.split('.').pop()
        const fileName = `${id}/image-${Date.now()}-${index}.${fileExt}`
        const imageUrl = await uploadToStorage(image, fileName)
        
        const existingCount = existingImages.length
        return supabase.from('song_images').insert({
          song_id: id,
          image_url: imageUrl,
          order_index: existingCount + index,
        })
      })
      
      await Promise.all(imageUploads)
      
      const audioUploads = newAudios
        .filter(audio => audio.file)
        .map(async (audio) => {
          const fileExt = audio.file!.name.split('.').pop()
          const fileName = `${id}/${audio.type}-${Date.now()}.${fileExt}`
          const audioUrl = await uploadAudioToStorage(audio.file!, fileName)
          
          return supabase.from('song_audios').insert({
            song_id: id,
            type: audio.type,
            audio_url: audioUrl,
          })
        })
      
      await Promise.all(audioUploads)
      
      toast.success('Song updated successfully!')
      router.push('/admin/songs')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update song')
    } finally {
      setLoading(false)
    }
  }

  const getAudioTypeLabel = (type: AudioType | string) => {
    switch(type) {
      case 'geez': return 'Geez Version'
      case 'ezel': return 'Ezel Version'
      case 'araray': return 'Araray Version'
      default: return type
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
        <div className="text-center px-4">
          <FaSpinner className="animate-spin h-12 w-12 text-church-gold mx-auto mb-4" />
          <p className="text-primary-700 font-medium">Loading song...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30 pb-20">
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <Link href="/admin/songs" className="inline-flex items-center gap-2 text-primary-600 hover:text-church-gold transition-colors mb-4 group">
            <FaArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Songs</span>
          </Link>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-8 bg-church-gold rounded-full"></div>
              <span className="text-xs sm:text-sm font-semibold text-church-gold uppercase tracking-wider">Edit</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-church-dark">
              Edit Song
            </h1>
            <p className="text-sm sm:text-base text-primary-600 mt-1 sm:mt-2">
              Update song information, images, and audio files
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Song Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-primary-100 overflow-hidden">
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaMusic className="w-5 h-5 text-church-gold" />
                <h2 className="text-lg sm:text-xl font-bold text-church-dark">Song Information</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-church-dark mb-2">
                    Song Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-church-dark placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-church-gold focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-church-dark mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, category_id: e.target.value, subcategory_id: '' }))
                      fetchSubcategories(e.target.value)
                    }}
                    className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-church-dark focus:outline-none focus:ring-2 focus:ring-church-gold focus:border-transparent transition-all duration-300"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-church-dark mb-2">
                    Subcategory <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.subcategory_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, subcategory_id: e.target.value }))}
                    className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-church-dark focus:outline-none focus:ring-2 focus:ring-church-gold focus:border-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                    disabled={!formData.category_id}
                  >
                    <option value="">Select subcategory</option>
                    {subcategories.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-primary-100 overflow-hidden">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaImage className="w-5 h-5 text-church-gold" />
                  <h2 className="text-lg sm:text-xl font-bold text-church-dark">Current Images</h2>
                  <span className="text-xs text-primary-500 ml-2">({existingImages.length} images)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {existingImages.map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="relative aspect-square bg-primary-50 rounded-xl overflow-hidden border-2 border-primary-100">
                        <Image
                          src={image.image_url}
                          alt="Lyrics"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExistingImage(image)}
                        disabled={deletingImageId === image.id}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-all active:scale-90 disabled:opacity-50"
                      >
                        {deletingImageId === image.id ? (
                          <FaSpinner className="w-3 h-3 animate-spin" />
                        ) : (
                          <FaTimes className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Add New Images */}
          <div className="bg-white rounded-2xl shadow-sm border border-primary-100 overflow-hidden">
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaUpload className="w-5 h-5 text-church-gold" />
                <h2 className="text-lg sm:text-xl font-bold text-church-dark">Add More Images</h2>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {newImagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <div className="relative aspect-square bg-primary-50 rounded-xl overflow-hidden border-2 border-primary-100">
                      <Image
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-all active:scale-90"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                <label className="flex flex-col items-center justify-center aspect-square bg-primary-50 rounded-xl border-2 border-dashed border-primary-200 cursor-pointer hover:border-church-gold hover:bg-primary-100 transition-all group">
                  <div className="flex flex-col items-center">
                    <div className="p-2 bg-white rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                      <FaUpload className="w-5 h-5 text-church-gold" />
                    </div>
                    <span className="text-xs text-primary-600 text-center px-2">Add Images</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-primary-500 mt-4 flex items-center gap-1">
                <FaInfoCircle className="w-3 h-3" />
                Add more lyrics images (max 10MB each)
              </p>
            </div>
          </div>
          
          {/* Existing Audios */}
          {existingAudios.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-primary-100 overflow-hidden">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaHeadphones className="w-5 h-5 text-church-gold" />
                  <h2 className="text-lg sm:text-xl font-bold text-church-dark">Current Audio Files</h2>
                </div>
                <div className="space-y-3">
                  {existingAudios.map((audio) => (
                    <div key={audio.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-primary-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-church-gold/10 rounded-full flex items-center justify-center">
                          <FaPlay className="w-3 h-3 text-church-gold" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-church-dark capitalize">
                            {getAudioTypeLabel(audio.type)}
                          </span>
                          <audio controls src={audio.audio_url} className="block mt-1 h-8" />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExistingAudio(audio)}
                        disabled={deletingAudioId === audio.id}
                        className="self-start sm:self-center px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1"
                      >
                        {deletingAudioId === audio.id ? (
                          <FaSpinner className="w-3 h-3 animate-spin" />
                        ) : (
                          <FaTrash className="w-3 h-3" />
                        )}
                        <span>Remove</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Add New Audios */}
          <div className="bg-white rounded-2xl shadow-sm border border-primary-100 overflow-hidden">
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaUpload className="w-5 h-5 text-church-gold" />
                <h2 className="text-lg sm:text-xl font-bold text-church-dark">Add or Replace Audio Files</h2>
              </div>
              
              <div className="space-y-3">
                {newAudios.map((audio) => (
                  <div key={audio.type} className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="w-full sm:w-28">
                      <span className="text-sm font-semibold text-church-dark capitalize">
                        {getAudioTypeLabel(audio.type)}
                      </span>
                    </div>
                    <label className="flex-1 flex items-center gap-3 p-3 bg-primary-50 rounded-xl cursor-pointer hover:bg-primary-100 transition-all group">
                      <div className="p-1.5 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                        <FaUpload className="w-3 h-3 text-church-gold" />
                      </div>
                      <span className="text-sm text-primary-600 truncate flex-1">
                        {audio.file ? audio.file.name : 'Choose audio file'}
                      </span>
                      {audio.file && (
                        <button
                          type="button"
                          onClick={() => removeNewAudio(audio.type)}
                          className="text-red-500 hover:text-red-600 transition-colors"
                        >
                          <FaTimes className="w-4 h-4" />
                        </button>
                      )}
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => handleAudioUpload(audio.type, e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-primary-500 mt-4 flex items-center gap-1">
                <FaInfoCircle className="w-3 h-3" />
                Upload new versions to add or replace existing audio (MP3, WAV, M4A - max 20MB)
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-3 bg-gray-100 text-primary-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-300 active:scale-95 order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-church-gold hover:bg-church-gold/80 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg order-1 sm:order-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin w-5 h-5" />
                  <span>Updating Song...</span>
                </>
              ) : (
                <>
                  <FaSave className="w-5 h-5" />
                  <span>Update Song</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}