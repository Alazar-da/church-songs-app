'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Category } from '@/lib/supabase/client'
import { FaArrowLeft, FaSave, FaUpload, FaTrash, FaImage, FaSpinner, FaTimes, FaFolder } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Image from 'next/image'
import Link from 'next/link'

export default function CreateSubcategoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      
      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      toast.error('Failed to load categories')
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }
      setImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !categoryId) {
      toast.error('Please fill all required fields')
      return
    }

    setLoading(true)
    try {
      let imageUrl = null
      
      if (image) {
        const fileExt = image.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('subcategory-images')
          .upload(fileName, image)
        
        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage
          .from('subcategory-images')
          .getPublicUrl(fileName)
        
        imageUrl = publicUrl
      }
      
      const { error } = await supabase
        .from('subcategories')
        .insert({ 
          name, 
          category_id: categoryId,
          image_url: imageUrl 
        })
      
      if (error) throw error
      
      toast.success('Subcategory created successfully')
      router.push('/admin/subcategories')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create subcategory')
    } finally {
      setLoading(false)
    }
  }

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setImage(null)
    setImagePreview('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30">
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <Link href="/admin/subcategories" className="inline-flex items-center gap-2 text-primary-600 hover:text-church-gold transition-colors mb-4 group">
            <FaArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Subcategories</span>
          </Link>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-8 bg-church-gold rounded-full"></div>
              <span className="text-xs sm:text-sm font-semibold text-church-gold uppercase tracking-wider">Create</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-church-dark">
              New Subcategory
            </h1>
            <p className="text-sm sm:text-base text-primary-600 mt-1 sm:mt-2">
              Add a new subcategory under a parent category
            </p>
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-primary-100 overflow-hidden">
          <div className="p-5 sm:p-6 space-y-6">
            {/* Parent Category */}
            <div>
              <label className="block text-sm font-semibold text-church-dark mb-2">
                Parent Category <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FaFolder className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary-400" />
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-church-dark focus:outline-none focus:ring-2 focus:ring-church-gold focus:border-transparent transition-all duration-300 appearance-none"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subcategory Name */}
            <div>
              <label className="block text-sm font-semibold text-church-dark mb-2">
                Subcategory Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-church-dark placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-church-gold focus:border-transparent transition-all duration-300"
                placeholder="e.g., Fast Worship, Slow Worship, Instrumental"
                required
                autoFocus
              />
              <p className="text-xs text-primary-500 mt-1">This will be displayed under the parent category</p>
            </div>

            {/* Subcategory Image */}
            <div>
              <label className="block text-sm font-semibold text-church-dark mb-2">
                Subcategory Image
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
                      onClick={removeImage}
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
                      <p className="text-xs text-primary-400 mt-1">PNG, JPG, GIF up to 5MB</p>
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

              {!imagePreview && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                  <FaImage className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    Upload an image to make your subcategory more attractive and easily recognizable
                  </p>
                </div>
              )}
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
                  <span>Creating Subcategory...</span>
                </>
              ) : (
                <>
                  <FaSave className="w-5 h-5" />
                  <span>Create Subcategory</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}