'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Subcategory, Category } from '@/lib/supabase/client'
import { FaPlus, FaEdit, FaTrash, FaFolder, FaImage, FaSpinner, FaTimes, FaFilter, FaChevronRight } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Image from 'next/image'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'

export default function SubcategoriesManagementPage() {
  const [subcategories, setSubcategories] = useState<(Subcategory & { category?: Category })[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const router = useRouter()
    const { profile } = useAuthStore()

  useEffect(() => {
    fetchCategories()
    fetchSubcategories()
  }, [])

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories(data || [])
  }

const isSuperAdmin = profile?.roles?.name === 'super_admin'
const isCategoryAdmin = profile?.roles?.name === 'category_admin'

const fetchSubcategories = async () => {
  try {
    let query = supabase
      .from('subcategories')
      .select('*, category:categories(*)')
      .order('created_at', { ascending: false })
    
    // For category admin, only show subcategories from their assigned categories
    if (isCategoryAdmin) {
      const { data: adminCats } = await supabase
        .from('admin_categories')
        .select('category_id')
        .eq('admin_id', profile?.id)
      
      const categoryIds = adminCats?.map(ac => ac.category_id) || []
      if (categoryIds.length > 0) {
        query = query.in('category_id', categoryIds)
      }
    }
    
    const { data, error } = await query
    if (error) throw error
    setSubcategories(data || [])
  } catch (error) {
    toast.error('Failed to load subcategories')
  } finally {
    setLoading(false)
  }
}

  useEffect(() => {
    fetchSubcategories()
  }, [selectedCategory])

  const handleDelete = async () => {
    if (!selectedSubcategory) return
    
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', selectedSubcategory.id)
      
      if (error) throw error
      
      toast.success('Subcategory deleted successfully')
      fetchSubcategories()
      setShowDeleteModal(false)
      setSelectedSubcategory(null)
    } catch (error) {
      toast.error('Failed to delete subcategory')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
        <div className="text-center px-4">
          <FaSpinner className="animate-spin h-12 w-12 text-church-gold mx-auto mb-4" />
          <p className="text-primary-700 font-medium">Loading subcategories...</p>
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
                Subcategories
              </h1>
              <p className="text-sm sm:text-base text-primary-600 mt-1 sm:mt-2">
                Organize your songs with subcategories
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push('/admin/subcategories/new')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-church-gold hover:bg-church-gold/80 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 active:scale-95"
              >
                <FaPlus className="text-sm sm:text-base" />
                <span>Add Subcategory</span>
              </button>
              
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="sm:hidden w-full inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 active:scale-95"
              >
                <FaFilter className="text-sm" />
                <span>Filter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter by Category - Desktop always visible, mobile toggle */}
        <div className={`${showFilter ? 'block' : 'hidden sm:block'} mb-6 sm:mb-8`}>
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-primary-100">
            <div className="flex items-center gap-2 mb-3">
              <FaFilter className="w-4 h-4 text-church-gold" />
              <label className="text-sm font-semibold text-church-dark">Filter by Category</label>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setShowFilter(false)
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-primary-50 border border-primary-200 rounded-xl text-church-dark focus:outline-none focus:ring-2 focus:ring-church-gold focus:border-transparent transition-all"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            
            {/* Selected filter indicator */}
            {selectedCategory !== 'all' && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-primary-500">Filtering by:</span>
                <span className="text-xs bg-church-gold/10 text-church-gold px-2 py-1 rounded-full">
                  {categories.find(c => c.id === selectedCategory)?.name}
                </span>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="text-xs text-primary-500 hover:text-primary-700"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Subcategories Grid - Mobile First */}
        {subcategories.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 sm:p-12 text-center shadow-sm border border-primary-100">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaFolder className="w-10 h-10 sm:w-12 sm:h-12 text-church-gold" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-church-dark mb-2">No subcategories yet</h3>
            <p className="text-primary-600 text-sm sm:text-base mb-6">
              {selectedCategory !== 'all' 
                ? `No subcategories found in this category. Create your first one!`
                : `Start organizing your songs by creating your first subcategory`}
            </p>
            <button
              onClick={() => router.push('/admin/subcategories/new')}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-church-gold text-white rounded-xl font-semibold hover:bg-church-gold/80 transition-all shadow-md active:scale-95"
            >
              <FaPlus />
              Create Subcategory
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {subcategories.map((sub, index) => (
              <div
                key={sub.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 active:scale-[0.99] border border-primary-100"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5">
                  {/* Subcategory Image - Mobile First */}
                  <div className="relative w-full sm:w-24 h-40 sm:h-24 rounded-xl overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200 flex-shrink-0">
                    {sub.image_url ? (
                      <Image
                        src={sub.image_url}
                        alt={sub.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        <FaImage className="w-8 h-8 text-primary-400 mb-1" />
                        <span className="text-xs text-primary-400">No image</span>
                      </div>
                    )}
                  </div>

                  {/* Subcategory Info */}
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg sm:text-xl font-bold text-church-dark group-hover:text-church-gold transition-colors">
                          {sub.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1 text-xs text-primary-500 bg-primary-50 px-2 py-1 rounded-full">
                          <FaFolder className="w-3 h-3" />
                          <span>{sub.category?.name || 'No category'}</span>
                        </div>
                        <span className="text-xs text-primary-400">•</span>
                        <p className="text-xs text-primary-500">
                          Created {new Date(sub.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 sm:gap-3">
                      <Link
                        href={`/admin/subcategories/edit/${sub.id}`}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-church-gold hover:bg-church-gold/80 text-white rounded-lg font-medium transition-all duration-300 active:scale-95 text-sm sm:text-base"
                      >
                        <FaEdit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Edit</span>
                      </Link>
                      <button
                        onClick={() => {
                          setSelectedSubcategory(sub)
                          setShowDeleteModal(true)
                        }}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-300 active:scale-95 text-sm sm:text-base"
                      >
                        <FaTrash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Delete</span>
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
                  <h2 className="text-lg sm:text-xl font-bold text-white">Delete Subcategory</h2>
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
                  Are you sure you want to delete <span className="font-semibold text-red-600">"{selectedSubcategory?.name}"</span>?
                </p>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded-lg mt-3">
                  <p className="text-xs sm:text-sm text-yellow-800">
                    ⚠️ Warning: This will also delete all songs in this subcategory. This action cannot be undone.
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
                      Delete Subcategory
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