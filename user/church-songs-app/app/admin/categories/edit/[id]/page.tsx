'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase, Category } from '@/lib/supabase/client'
import { FaArrowLeft, FaSave, FaUpload, FaTrash, FaImage, FaSpinner, FaTimes } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Image from 'next/image'
import Link from 'next/link'

export default function EditCategoryPage() {
  const router = useRouter()
  const { id } = useParams()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [name, setName] = useState('')
  
  // Image states
  const [existingImageUrl, setExistingImageUrl] = useState<string>('')
  const [newImage, setNewImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [isDeletingImage, setIsDeletingImage] = useState(false)

  useEffect(() => {
    fetchCategory()
  }, [id])

  const fetchCategory = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      
      setName(data.name)
      setExistingImageUrl(data.image_url || '')
    } catch (error) {
      toast.error('Failed to load category')
      router.push('/admin/categories')
    } finally {
      setFetching(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size should be less than 10MB')
        return
      }
      setNewImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleDeleteImage = async () => {
    if (!existingImageUrl) return
    
    setIsDeletingImage(true)
    try {
      const filePath = existingImageUrl.split('/').pop()
      if (filePath) {
        const { error: deleteError } = await supabase.storage
          .from('category-images')
          .remove([filePath])
        
        if (deleteError) throw deleteError
      }
      
      const { error: updateError } = await supabase
        .from('categories')
        .update({ image_url: null })
        .eq('id', id)
      
      if (updateError) throw updateError
      
      setExistingImageUrl('')
      toast.success('Image removed successfully')
    } catch (error) {
      toast.error('Failed to delete image')
    } finally {
      setIsDeletingImage(false)
    }
  }

  const handleCancelNewImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setNewImage(null)
    setImagePreview('')
  }

  const uploadNewImage = async (): Promise<string | null> => {
    if (!newImage) return null
    
    const fileExt = newImage.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('category-images')
      .upload(fileName, newImage)
    
    if (uploadError) throw uploadError
    
    const { data: { publicUrl } } = supabase.storage
      .from('category-images')
      .getPublicUrl(fileName)
    
    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Category name is required')
      return
    }

    setLoading(true)
    try {
      let imageUrl = existingImageUrl
      
      if (newImage) {
        if (existingImageUrl) {
          const oldFilePath = existingImageUrl.split('/').pop()
          if (oldFilePath) {
            await supabase.storage
              .from('category-images')
              .remove([oldFilePath])
          }
        }
        
        const uploadedUrl = await uploadNewImage()
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        }
      }
      
      const { error } = await supabase
        .from('categories')
        .update({ 
          name, 
          image_url: imageUrl || null
        })
        .eq('id', id)
      
      if (error) throw error
      
      toast.success('Category updated successfully')
      router.push('/admin/categories')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update category')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
        <div className="text-center px-4">
          <FaSpinner className="animate-spin h-12 w-12 text-church-gold mx-auto mb-4" />
          <p className="text-primary-700 font-medium">Loading category...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30">
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <Link href="/admin/categories" className="inline-flex items-center gap-2 text-primary-600 hover:text-church-gold transition-colors mb-4 group">
            <FaArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Categories</span>
          </Link>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-8 bg-church-gold rounded-full"></div>
              <span className="text-xs sm:text-sm font-semibold text-church-gold uppercase tracking-wider">Edit</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-church-dark">
              Edit Category
            </h1>
            <p className="text-sm sm:text-base text-primary-600 mt-1 sm:mt-2">
              Update category information
            </p>
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-primary-100 overflow-hidden">
          <div className="p-5 sm:p-6 space-y-6">
            {/* Category Name */}
            <div>
              <label className="block text-sm font-semibold text-church-dark mb-2">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-church-dark placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-church-gold focus:border-transparent transition-all duration-300"
                placeholder="e.g., Worship Songs, Hymns, Gospel"
                required
                autoFocus
              />
              <p className="text-xs text-primary-500 mt-1">This will be displayed to users</p>
            </div>

            {/* Category Image */}
            <div>
              <label className="block text-sm font-semibold text-church-dark mb-2">
                Category Image
              </label>
              
              {/* Current/New Image Display */}
              {(existingImageUrl || imagePreview) && (
                <div className="mb-4">
                  <p className="text-xs text-primary-500 mb-2">
                    {existingImageUrl && !newImage ? 'Current Image' : 'New Image Preview'}
                  </p>
                  <div className="relative inline-block">
                    <div className="relative w-40 h-40 rounded-xl overflow-hidden bg-primary-100 border-2 border-primary-200">
                      <Image
                        src={imagePreview || existingImageUrl}
                        alt="Category preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (newImage) {
                          handleCancelNewImage()
                        } else {
                          handleDeleteImage()
                        }
                      }}
                      disabled={isDeletingImage}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-all active:scale-90 disabled:opacity-50"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </div>
                  {isDeletingImage && (
                    <div className="mt-2 flex items-center gap-2">
                      <FaSpinner className="animate-spin w-4 h-4 text-church-gold" />
                      <p className="text-xs text-primary-500">Removing image...</p>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Button */}
              <label className="flex flex-col items-center justify-center w-full min-h-[120px] border-2 border-dashed border-primary-200 rounded-xl cursor-pointer bg-primary-50 hover:bg-primary-100 transition-colors group">
                <div className="flex flex-col items-center justify-center pt-4 pb-4">
                  <div className="p-2 bg-white rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                    <FaUpload className="w-5 h-5 text-church-gold" />
                  </div>
                  <p className="text-sm text-primary-600 font-medium">
                    {newImage ? 'Change image' : (existingImageUrl ? 'Replace image' : 'Upload image')}
                  </p>
                  <p className="text-xs text-primary-400 mt-1">PNG, JPG, GIF up to 10MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              {/* Info Message */}
              {!existingImageUrl && !newImage && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                  <FaImage className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    No image uploaded. Upload an image to make your category more attractive.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
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
                    <span>Updating Category...</span>
                  </>
                ) : (
                  <>
                    <FaSave className="w-5 h-5" />
                    <span>Update Category</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}