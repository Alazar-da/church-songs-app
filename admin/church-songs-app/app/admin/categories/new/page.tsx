'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { FaArrowLeft, FaUpload, FaSave, FaTimes, FaSpinner, FaImage, FaTrash } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Image from 'next/image'
import Link from 'next/link'

export default function CreateCategoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image must be less than 10MB')
        return
      }
      setImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Category name is required')
      return
    }

    setLoading(true)
    try {
      let imageUrl = null
      
      // Upload image if selected
      if (image) {
        const fileExt = image.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('category-images')
          .upload(fileName, image)
        
        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage
          .from('category-images')
          .getPublicUrl(fileName)
        
        imageUrl = publicUrl
      }
      
      // Create category
      const { error } = await supabase
        .from('categories')
        .insert({ name, image_url: imageUrl })
      
      if (error) throw error
      
      toast.success('Category created successfully')
      router.push('/admin/categories')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create category')
    } finally {
      setLoading(false)
    }
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
              <span className="text-xs sm:text-sm font-semibold text-church-gold uppercase tracking-wider">Create</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-church-dark">
              New Category
            </h1>
            <p className="text-sm sm:text-base text-primary-600 mt-1 sm:mt-2">
              Add a new category to organize your songs
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
              <p className="text-xs text-primary-500 mb-3">Optional - helps with visual identification</p>
              
              <div className="relative">
                {imagePreview ? (
                  <div className="relative w-full max-w-xs mx-auto">
                    <div className="relative w-40 h-40 mx-auto rounded-xl overflow-hidden bg-primary-100">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImage(null)
                        setImagePreview('')
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-all active:scale-90"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                    <p className="text-center text-xs text-primary-500 mt-2">Click the × to remove</p>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full min-h-[200px] border-2 border-dashed border-primary-200 rounded-xl cursor-pointer bg-primary-50 hover:bg-primary-100 transition-colors group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                        <FaUpload className="w-6 h-6 text-church-gold" />
                      </div>
                      <p className="text-sm text-primary-600 font-medium">Click to upload</p>
                      <p className="text-xs text-primary-400 mt-1">PNG, JPG, GIF up to 10MB</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-church-gold hover:bg-church-gold/80 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg mt-6"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin w-5 h-5" />
                  <span>Creating Category...</span>
                </>
              ) : (
                <>
                  <FaSave className="w-5 h-5" />
                  <span>Create Category</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}