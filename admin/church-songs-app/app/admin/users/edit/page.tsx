'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase, Category } from '@/lib/supabase/client'
import { FaArrowLeft, FaSave, FaUserShield, FaCrown, FaCheck, FaSpinner, FaFolder, FaUser } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Link from 'next/link'

import { useSearchParams } from 'next/navigation'

export default function EditAdminPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [formData, setFormData] = useState({
    full_name: '',
    role: '',
    category_ids: [] as string[],
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [originalRole, setOriginalRole] = useState('')

  useEffect(() => {
    fetchCategories()
    fetchAdmin()
  }, [id])

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories(data || [])
  }

  const fetchAdmin = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*, roles(name)')
        .eq('id', id)
        .single()
      
      if (error) throw error
      
      const { data: adminCategories } = await supabase
        .from('admin_categories')
        .select('category_id')
        .eq('admin_id', id)
      
      setFormData({
        full_name: profile.full_name || '',
        role: profile.roles?.name || 'category_admin',
        category_ids: adminCategories?.map(ac => ac.category_id) || [],
      })
      setOriginalRole(profile.roles?.name || 'category_admin')
    } catch (error) {
      toast.error('Failed to load admin data')
      router.push('/admin/users')
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.full_name) {
      toast.error('Please fill all required fields')
      return
    }
    
    if (formData.role === 'category_admin' && formData.category_ids.length === 0) {
      toast.error('Please select at least one category for category admin')
      return
    }

    setLoading(true)
    try {
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', formData.role)
        .single()
      
      if (!roleData) throw new Error('Role not found')
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          role_id: roleData.id
        })
        .eq('id', id)
      
      if (profileError) throw profileError
      
      if (originalRole === 'category_admin' || formData.role === 'category_admin') {
        await supabase
          .from('admin_categories')
          .delete()
          .eq('admin_id', id)
        
        if (formData.role === 'category_admin' && formData.category_ids.length > 0) {
          const adminCategories = formData.category_ids.map(category_id => ({
            admin_id: id,
            category_id: category_id
          }))
          
          const { error: assignError } = await supabase
            .from('admin_categories')
            .insert(adminCategories)
          
          if (assignError) throw assignError
        }
      }
      
      toast.success('Admin updated successfully!')
      router.push('/admin/users')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update admin')
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId]
    }))
  }

  const selectAllCategories = () => {
    if (formData.category_ids.length === categories.length) {
      setFormData(prev => ({ ...prev, category_ids: [] }))
    } else {
      setFormData(prev => ({ ...prev, category_ids: categories.map(c => c.id) }))
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
        <div className="text-center px-4">
          <FaSpinner className="animate-spin h-12 w-12 text-church-gold mx-auto mb-4" />
          <p className="text-primary-700 font-medium">Loading admin data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30">
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <Link href="/admin/users" className="inline-flex items-center gap-2 text-primary-600 hover:text-church-gold transition-colors mb-4 group">
            <FaArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Admins</span>
          </Link>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-8 bg-church-gold rounded-full"></div>
              <span className="text-xs sm:text-sm font-semibold text-church-gold uppercase tracking-wider">Edit</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-church-dark">
              Edit Admin
            </h1>
            <p className="text-sm sm:text-base text-primary-600 mt-1 sm:mt-2">
              Update administrator information and permissions
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-primary-100 overflow-hidden">
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaUserShield className="w-5 h-5 text-church-gold" />
                <h2 className="text-lg sm:text-xl font-bold text-church-dark">Basic Information</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-church-dark mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary-400" />
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full pl-11 pr-4 py-3 bg-primary-50 border border-primary-200 rounded-xl text-church-dark placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-church-gold focus:border-transparent transition-all duration-300"
                      required
                      autoFocus
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="bg-white rounded-2xl shadow-sm border border-primary-100 overflow-hidden">
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaUserShield className="w-5 h-5 text-church-gold" />
                <h2 className="text-lg sm:text-xl font-bold text-church-dark">Role & Permissions</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-church-dark mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.role === 'category_admin'
                        ? 'border-church-gold bg-church-gold/5'
                        : 'border-primary-200 hover:border-primary-300'
                    }`}>
                      <input
                        type="radio"
                        value="category_admin"
                        checked={formData.role === 'category_admin'}
                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                        className="w-4 h-4 text-church-gold"
                      />
                      <div>
                        <div className="font-semibold text-church-dark">Category Admin</div>
                        <div className="text-xs text-primary-500">Manage specific categories</div>
                      </div>
                    </label>
                    
                    <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.role === 'super_admin'
                        ? 'border-church-gold bg-church-gold/5'
                        : 'border-primary-200 hover:border-primary-300'
                    }`}>
                      <input
                        type="radio"
                        value="super_admin"
                        checked={formData.role === 'super_admin'}
                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                        className="w-4 h-4 text-church-gold"
                      />
                      <div>
                        <div className="font-semibold text-church-dark">Super Admin</div>
                        <div className="text-xs text-primary-500">Full system access</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category Assignments (for Category Admin) */}
          {formData.role === 'category_admin' && (
            <div className="bg-white rounded-2xl shadow-sm border border-primary-100 overflow-hidden">
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FaFolder className="w-5 h-5 text-church-gold" />
                    <h2 className="text-lg sm:text-xl font-bold text-church-dark">Assign Categories</h2>
                    <span className="text-xs text-red-500">*</span>
                  </div>
                  {categories.length > 0 && (
                    <button
                      type="button"
                      onClick={selectAllCategories}
                      className="text-xs text-church-gold hover:text-church-gold/80 font-medium transition-colors"
                    >
                      {formData.category_ids.length === categories.length ? 'Deselect All' : 'Select All'}
                    </button>
                  )}
                </div>
                
                {categories.length === 0 ? (
                  <div className="text-center py-8 bg-primary-50 rounded-xl">
                    <FaFolder className="w-12 h-12 text-primary-300 mx-auto mb-2" />
                    <p className="text-primary-500 text-sm">No categories available</p>
                    <p className="text-primary-400 text-xs mt-1">Create categories first before assigning admins</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
                    {categories.map((category) => (
                      <label
                        key={category.id}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                          formData.category_ids.includes(category.id)
                            ? 'bg-church-gold/5 border border-church-gold'
                            : 'bg-primary-50 hover:bg-primary-100 border border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.category_ids.includes(category.id)}
                          onChange={() => toggleCategory(category.id)}
                          className="w-4 h-4 text-church-gold rounded"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-church-dark">{category.name}</span>
                        </div>
                        {formData.category_ids.includes(category.id) && (
                          <FaCheck className="w-4 h-4 text-church-gold" />
                        )}
                      </label>
                    ))}
                  </div>
                )}
                
                <p className="text-xs text-primary-500 mt-4 flex items-center gap-1">
                  <span>📋</span>
                  Select the categories this admin can manage ({formData.category_ids.length} selected)
                </p>
              </div>
            </div>
          )}

          {/* Super Admin Info Box */}
          {formData.role === 'super_admin' && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-4 border border-amber-200">
              <div className="flex items-start gap-3">
                <FaCrown className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-800 font-medium text-sm">Super Admin Access</p>
                  <p className="text-amber-700 text-xs mt-1">
                    Super admins have full access to all categories, songs, and user management. 
                    They can create, edit, and delete any content in the system.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Submit Button */}
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
                  <span>Updating Admin...</span>
                </>
              ) : (
                <>
                  <FaSave className="w-5 h-5" />
                  <span>Update Admin</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}