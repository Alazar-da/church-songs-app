'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { FaPlus, FaEdit, FaTrash, FaUserShield, FaEnvelope, FaCalendar, FaSpinner, FaTimes, FaUsers, FaTag, FaCrown } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface AdminUser {
  id: string
  full_name: string
  email: string
  role_id: string
  role_name: string
  created_at: string
  categories: { id: string; name: string }[]
}

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { profile } = useAuthStore()
  const router = useRouter()

const isSuperAdmin = profile?.roles?.name === 'super_admin'

useEffect(() => {
  if (!isSuperAdmin) {
    toast.error('Access denied. Super admin privileges required.')
    router.push('/admin/dashboard')
    return
  }
  fetchAdmins()
}, [profile])

  

  const fetchAdmins = async () => {
    try {
      // Get all users with admin roles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          *,
          roles(name),
          admin_categories(
            categories(id, name)
          )
        `)
        .in('roles.name', ['super_admin', 'category_admin'])
      
      if (error) throw error
      
      // Get emails from auth.users
      const adminUsers = await Promise.all(
        (profiles || []).map(async (admin) => {
          const { data: userData } = await supabase.auth.admin.getUserById(admin.id)
          return {
            id: admin.id,
            full_name: admin.full_name,
            email: userData?.user?.email || 'N/A',
            role_id: admin.role_id,
            role_name: admin.roles?.name || 'Unknown',
            created_at: admin.created_at,
            categories: admin.admin_categories?.map((ac: any) => ac.categories) || [],
          }
        })
      )
      
      setAdmins(adminUsers)
    } catch (error) {
      toast.error('Failed to load admins')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedAdmin) return
    
    setDeleting(true)
    try {
      // Delete admin categories first
      await supabase
        .from('admin_categories')
        .delete()
        .eq('admin_id', selectedAdmin.id)
      
      // Delete profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedAdmin.id)
      
      if (error) throw error
      
      toast.success('Admin deleted successfully')
      fetchAdmins()
      setShowDeleteModal(false)
      setSelectedAdmin(null)
    } catch (error) {
      toast.error('Failed to delete admin')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
        <div className="text-center px-4">
          <FaSpinner className="animate-spin h-12 w-12 text-church-gold mx-auto mb-4" />
          <p className="text-primary-700 font-medium">Loading administrators...</p>
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
                Admin Users
              </h1>
              <p className="text-sm sm:text-base text-primary-600 mt-1 sm:mt-2">
                Manage administrators and their permissions
              </p>
            </div>
            
            <button
              onClick={() => router.push('/admin/users/new')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-church-gold hover:bg-church-gold/80 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 active:scale-95"
            >
              <FaPlus className="text-sm sm:text-base" />
              <span>Add New Admin</span>
            </button>
          </div>
        </div>

        {/* Admins Grid - Mobile First */}
        {admins.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 sm:p-12 text-center shadow-sm border border-primary-100">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUsers className="w-10 h-10 sm:w-12 sm:h-12 text-church-gold" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-church-dark mb-2">No admins yet</h3>
            <p className="text-primary-600 text-sm sm:text-base mb-6">
              Start by adding your first administrator
            </p>
            <button
              onClick={() => router.push('/admin/users/new')}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-church-gold text-white rounded-xl font-semibold hover:bg-church-gold/80 transition-all shadow-md active:scale-95"
            >
              <FaPlus />
              Add New Admin
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {admins.map((admin, index) => (
              <div
                key={admin.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 active:scale-[0.99] border border-primary-100"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Admin Avatar & Basic Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${
                          admin.role_name === 'super_admin' 
                            ? 'bg-gradient-to-br from-amber-100 to-amber-200' 
                            : 'bg-gradient-to-br from-primary-100 to-primary-200'
                        }`}>
                          {admin.role_name === 'super_admin' ? (
                            <FaCrown className="w-7 h-7 text-amber-600" />
                          ) : (
                            <FaUserShield className="w-7 h-7 text-church-gold" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg sm:text-xl font-bold text-church-dark group-hover:text-church-gold transition-colors">
                              {admin.full_name}
                            </h3>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              admin.role_name === 'super_admin'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-primary-100 text-primary-700'
                            }`}>
                              {admin.role_name === 'super_admin' ? 'Super Admin' : 'Category Admin'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <FaEnvelope className="w-3 h-3 text-primary-400 flex-shrink-0" />
                            <span className="text-sm text-primary-600 truncate">{admin.email}</span>
                          </div>
                        </div>
                      </div>

                      {/* Admin Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        {/* Created Date */}
                        <div className="flex items-start gap-2">
                          <FaCalendar className="w-4 h-4 text-church-gold mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-primary-500 uppercase tracking-wide">Joined</p>
                            <p className="text-sm font-medium text-church-dark">
                              {new Date(admin.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Assigned Categories */}
                        <div className="flex items-start gap-2">
                          <FaTag className="w-4 h-4 text-church-gold mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-primary-500 uppercase tracking-wide">Categories</p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {admin.categories.length > 0 ? (
                                admin.categories.map((cat) => (
                                  <span key={cat.id} className="text-xs px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full">
                                    {cat.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-primary-400">
                                  {admin.role_name === 'super_admin' ? 'All Categories' : 'No categories assigned'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 sm:gap-2 lg:flex-col lg:items-stretch">
                      <Link
                        href={`/admin/users/edit/${admin.id}`}
                        className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-2 bg-church-gold hover:bg-church-gold/80 text-white rounded-lg font-medium transition-all duration-300 active:scale-95 text-sm sm:text-base"
                      >
                        <FaEdit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Edit</span>
                      </Link>
                      {admin.role_name !== 'super_admin' && (
                        <button
                          onClick={() => {
                            setSelectedAdmin(admin)
                            setShowDeleteModal(true)
                          }}
                          className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-300 active:scale-95 text-sm sm:text-base"
                        >
                          <FaTrash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span>Delete</span>
                        </button>
                      )}
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
                  <h2 className="text-lg sm:text-xl font-bold text-white">Delete Admin</h2>
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
                  Are you sure you want to delete admin <span className="font-semibold text-red-600">"{selectedAdmin?.full_name}"</span>?
                </p>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded-lg mt-3">
                  <p className="text-xs sm:text-sm text-yellow-800">
                    ⚠️ Warning: This action cannot be undone. The admin will lose all access to the system.
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
                      Delete Admin
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