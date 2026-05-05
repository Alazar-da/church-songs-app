'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Category } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { 
  FaPlus, FaEdit, FaTrash, FaImage, FaSpinner, 
  FaFolder, FaLock, FaEye, FaTimes, FaChevronRight 
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import Image from 'next/image'
import Link from 'next/link'

export default function CategoriesManagementPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { profile } = useAuthStore()
  const router = useRouter()

  const isSuperAdmin = profile?.roles?.name === 'super_admin'
  const isCategoryAdmin = profile?.roles?.name === 'category_admin'

  useEffect(() => {
    if (!isSuperAdmin && !isCategoryAdmin) {
      router.push('/admin/dashboard')
      return
    }
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      let query = supabase.from('categories').select('*').order('name')
      
      if (isCategoryAdmin) {
        const { data: adminCats } = await supabase
          .from('admin_categories')
          .select('category_id')
          .eq('admin_id', profile?.id)
        
        const categoryIds = adminCats?.map(ac => ac.category_id) || []
        if (categoryIds.length > 0) {
          query = query.in('id', categoryIds)
        } else {
          setCategories([])
          setLoading(false)
          return
        }
      }
      
      const { data, error } = await query
      
      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedCategory) return
    
    if (!isSuperAdmin) {
      toast.error('Only super admins can delete categories')
      return
    }
    
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', selectedCategory.id)
      
      if (error) throw error
      
      toast.success('Category deleted successfully')
      fetchCategories()
      setShowDeleteModal(false)
      setSelectedCategory(null)
    } catch (error) {
      toast.error('Failed to delete category')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
        <div className="text-center px-4">
          <FaSpinner className="animate-spin h-12 w-12 text-church-gold mx-auto mb-4" />
          <p className="text-primary-700 font-medium">Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30">
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-8 bg-church-gold rounded-full"></div>
                <span className="text-xs sm:text-sm font-semibold text-church-gold uppercase tracking-wider">
                  {isCategoryAdmin ? 'View Only' : 'Management'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-church-dark">
                Categories
              </h1>
              <p className="text-sm sm:text-base text-primary-600 mt-1 sm:mt-2">
                {isCategoryAdmin 
                  ? 'Viewing your assigned categories' 
                  : 'Organize your church songs with categories'}
              </p>
            </div>
            
            {isSuperAdmin && (
              <button
                onClick={() => router.push('/admin/categories/new')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-church-gold hover:bg-church-gold/80 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 active:scale-95"
              >
                <FaPlus className="text-sm sm:text-base" />
                <span>Add Category</span>
              </button>
            )}
          </div>
        </div>

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 sm:p-12 text-center shadow-sm border border-primary-100">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaFolder className="w-10 h-10 sm:w-12 sm:h-12 text-church-gold" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-church-dark mb-2">
              {isCategoryAdmin ? 'No categories assigned' : 'No categories yet'}
            </h3>
            <p className="text-primary-600 text-sm sm:text-base mb-6">
              {isCategoryAdmin 
                ? 'You don\'t have any categories assigned. Contact a super admin for access.'
                : 'Start organizing your songs by creating your first category'}
            </p>
            {isSuperAdmin && (
              <button
                onClick={() => router.push('/admin/categories/new')}
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-church-gold text-white rounded-xl font-semibold hover:bg-church-gold/80 transition-all shadow-md active:scale-95"
              >
                <FaPlus />
                Create Category
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {categories.map((category, index) => (
              <div
                key={category.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 active:scale-[0.99] border border-primary-100"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5">
                  {/* Category Image */}
                  <div className="relative w-full sm:w-32 h-40 sm:h-32 rounded-xl overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200 flex-shrink-0">
                    {category.image_url ? (
                      <Image
                        src={category.image_url}
                        alt={category.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        <FaImage className="w-8 h-8 text-primary-400 mb-1" />
                        <span className="text-xs text-primary-400">No image</span>
                      </div>
                    )}
                    
                    {/* Role Badge for Category Admin */}
                    {isCategoryAdmin && (
                      <div className="absolute top-2 right-2 bg-amber-500 text-white rounded-full p-1.5">
                        <FaLock className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  {/* Category Info */}
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg sm:text-xl font-bold text-church-dark group-hover:text-church-gold transition-colors">
                          {category.name}
                        </h3>
                        {isCategoryAdmin && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                            View Only
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-primary-500">
                        Created {new Date(category.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 sm:gap-3">
                      {isSuperAdmin ? (
                        <>
                          <Link
                            href={`/admin/categories/edit/${category.id}`}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-church-gold hover:bg-church-gold/80 text-white rounded-lg font-medium transition-all duration-300 active:scale-95 text-sm sm:text-base"
                          >
                            <FaEdit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>Edit</span>
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedCategory(category)
                              setShowDeleteModal(true)
                            }}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-300 active:scale-95 text-sm sm:text-base"
                          >
                            <FaTrash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>Delete</span>
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-primary-400 bg-primary-50 px-4 py-2 rounded-lg">
                          <FaLock className="w-3.5 h-3.5" />
                          <span className="text-sm">Read Only</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal - Only for super admin */}
      {showDeleteModal && isSuperAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-slideUp mx-4">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 sm:p-5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FaTrash className="text-white w-4 h-4 sm:w-5 sm:h-5" />
                  <h2 className="text-lg sm:text-xl font-bold text-white">Delete Category</h2>
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
                  Are you sure you want to delete <span className="font-semibold text-red-600">"{selectedCategory?.name}"</span>?
                </p>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded-lg mt-3">
                  <p className="text-xs sm:text-sm text-yellow-800">
                    ⚠️ Warning: This will also delete all subcategories and songs in this category. This action cannot be undone.
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
                      Delete Category
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