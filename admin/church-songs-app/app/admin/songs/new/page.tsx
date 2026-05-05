'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Category, Subcategory } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { FaArrowLeft, FaUpload, FaPlus, FaTrash, FaImage, FaHeadphones, FaMusic, FaSpinner, FaTimes, FaInfoCircle } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Image from 'next/image'
import Link from 'next/link'

type AudioType = 'geez' | 'ezel' | 'araray'

export default function AddSongPage() {
  const router = useRouter()
  const { profile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    subcategory_id: '',
  })
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [audios, setAudios] = useState<{ type: AudioType; file: File | null }[]>([
    { type: 'geez', file: null },
    { type: 'ezel', file: null },
    { type: 'araray', file: null },
  ])

  useEffect(() => {
    fetchCategories()
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
    
    setImages(prev => [...prev, ...validFiles])
    const newPreviews = validFiles.map(file => URL.createObjectURL(file))
    setImagePreviews(prev => [...prev, ...newPreviews])
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    URL.revokeObjectURL(imagePreviews[index])
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
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
    setAudios(prev => prev.map(audio => 
      audio.type === type ? { ...audio, file } : audio
    ))
  }

  const uploadToStorage = async (file: File, path: string) => {
    const { error } = await supabase.storage
      .from('song-images')
      .upload(path, file)
    
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage
      .from('song-images')
      .getPublicUrl(path)
    
    return publicUrl
  }

  const uploadAudioToStorage = async (file: File, path: string) => {
    const { error } = await supabase.storage
      .from('song-audio')
      .upload(path, file)
    
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage
      .from('song-audio')
      .getPublicUrl(path)
    
    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.category_id || !formData.subcategory_id) {
      toast.error('Please fill all required fields')
      return
    }
    
    if (images.length === 0) {
      toast.error('Please upload at least one lyrics image')
      return
    }
    
    setLoading(true)
    
    try {
      const { data: song, error: songError } = await supabase
        .from('songs')
        .insert({
          title: formData.title,
          category_id: formData.category_id,
          subcategory_id: formData.subcategory_id,
          created_by: profile?.id,
        })
        .select()
        .single()
      
      if (songError) throw songError
      
      const imageUploads = images.map(async (image, index) => {
        const fileExt = image.name.split('.').pop()
        const fileName = `${song.id}/image-${index + 1}.${fileExt}`
        const imageUrl = await uploadToStorage(image, fileName)
        
        return supabase.from('song_images').insert({
          song_id: song.id,
          image_url: imageUrl,
          order_index: index,
        })
      })
      
      await Promise.all(imageUploads)
      
      const audioUploads = audios
        .filter(audio => audio.file)
        .map(async (audio) => {
          const fileExt = audio.file!.name.split('.').pop()
          const fileName = `${song.id}/${audio.type}.${fileExt}`
          const audioUrl = await uploadAudioToStorage(audio.file!, fileName)
          
          return supabase.from('song_audios').insert({
            song_id: song.id,
            type: audio.type,
            audio_url: audioUrl,
          })
        })
      
      await Promise.all(audioUploads)
      
      toast.success('Song added successfully!')
      router.push('/admin/songs')
    } catch (error: any) {
      toast.error(error.message || 'Failed to add song')
    } finally {
      setLoading(false)
    }
  }

  const getAudioTypeLabel = (type: AudioType) => {
    switch(type) {
      case 'geez': return 'Geez Version'
      case 'ezel': return 'Ezel Version'
      case 'araray': return 'Araray Version'
      default: return type
    }
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
              <span className="text-xs sm:text-sm font-semibold text-church-gold uppercase tracking-wider">Create</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-church-dark">
              Add New Song
            </h1>
            <p className="text-sm sm:text-base text-primary-600 mt-1 sm:mt-2">
              Upload lyrics images and audio files for your song
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
                    placeholder="Enter song title"
                    required
                    autoFocus
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
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
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
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Lyrics Images */}
          <div className="bg-white rounded-2xl shadow-sm border border-primary-100 overflow-hidden">
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaImage className="w-5 h-5 text-church-gold" />
                <h2 className="text-lg sm:text-xl font-bold text-church-dark">Lyrics Images</h2>
                <span className="text-xs text-red-500 ml-2">*Required</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {imagePreviews.map((preview, index) => (
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
                      onClick={() => removeImage(index)}
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
                    <span className="text-xs text-primary-600 text-center px-2">Upload Images</span>
                    <span className="text-xs text-primary-400 mt-1">(PNG, JPG)</span>
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
              <p className="text-xs text-primary-500 flex items-center gap-1">
                <FaInfoCircle className="w-3 h-3" />
                Upload song lyrics as images (multiple allowed, max 10MB each)
              </p>
            </div>
          </div>
          
          {/* Audio Files */}
          <div className="bg-white rounded-2xl shadow-sm border border-primary-100 overflow-hidden">
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaHeadphones className="w-5 h-5 text-church-gold" />
                <h2 className="text-lg sm:text-xl font-bold text-church-dark">Audio Files</h2>
                <span className="text-xs text-primary-500 ml-2">(Optional)</span>
              </div>
              
              <div className="space-y-3">
                {audios.map((audio) => (
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
                          onClick={() => handleAudioUpload(audio.type, null)}
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
                Upload up to 3 audio versions (MP3, WAV, M4A - max 20MB each)
              </p>
            </div>
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-church-gold hover:bg-church-gold/80 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin w-5 h-5" />
                <span>Adding Song...</span>
              </>
            ) : (
              <>
                <FaPlus className="w-5 h-5" />
                <span>Add Song</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}