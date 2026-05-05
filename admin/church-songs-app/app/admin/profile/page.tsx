'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { FaUserCircle, FaEnvelope, FaCalendar, FaEdit, FaSave, FaTimes, FaSpinner, FaUserShield, FaCrown, FaCheck } from 'react-icons/fa'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { profile, user } = useAuthStore()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
    }
  }, [profile])

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      toast.error('Full name is required')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', profile?.id)
      
      if (error) throw error
      
      toast.success('Profile updated successfully')
      setIsEditing(false)
      
      // Refresh profile
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*, roles(name)')
          .eq('id', user.id)
          .single()
        
        if (data) {
          useAuthStore.setState({ profile: data })
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  if (!profile) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center px-4">
          <FaSpinner className="animate-spin h-12 w-12 text-church-gold mx-auto mb-4" />
          <p className="text-primary-700 font-medium">Loading profile...</p>
        </div>
      </div>
    )
  }

  const isSuperAdmin = profile.roles?.name === 'super_admin'
  const isCategoryAdmin = profile.roles?.name === 'category_admin'

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-primary-100">
        {/* Header - Mobile First */}
        <div className="bg-gradient-to-r from-church-gold to-church-gold/80 p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="relative">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <FaUserCircle className="w-14 h-14 text-white" />
              </div>
              {isSuperAdmin && (
                <div className="absolute -top-2 -right-2 bg-amber-500 rounded-full p-1.5">
                  <FaCrown className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold">{profile.full_name}</h1>
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium w-fit ${
                  isSuperAdmin
                    ? 'bg-amber-500/20 text-amber-100'
                    : 'bg-white/20 text-white'
                }`}>
                  {isSuperAdmin ? (
                    <>
                      <FaCrown className="w-3 h-3" />
                      Super Administrator
                    </>
                  ) : (
                    <>
                      <FaUserShield className="w-3 h-3" />
                      Category Administrator
                    </>
                  )}
                </span>
              </div>
              <p className="text-white/80 text-sm">
                {isSuperAdmin 
                  ? 'Full system access and control' 
                  : 'Manage songs in assigned categories'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-8 space-y-6 sm:space-y-8">
          {/* Profile Information Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-1 w-6 bg-church-gold rounded-full"></div>
                  <span className="text-xs font-semibold text-church-gold uppercase tracking-wider">Personal Info</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-church-dark">Profile Information</h2>
              </div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-church-gold hover:bg-church-gold/80 text-white rounded-xl font-semibold transition-all duration-300 active:scale-95"
                >
                  <FaEdit className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setFullName(profile.full_name || '')
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-all duration-300 active:scale-95"
                  >
                    <FaTimes className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleUpdateProfile}
                    disabled={loading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-church-gold hover:bg-church-gold/80 text-white rounded-xl font-semibold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin w-4 h-4" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <FaSave className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Info Cards */}
            <div className="space-y-3">
              {/* Full Name */}
              <div className="group bg-primary-50 rounded-xl p-4 hover:bg-primary-100 transition-colors duration-300">
                <div className="flex items-start gap-3">
                  <FaUserCircle className="w-5 h-5 text-church-gold mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-primary-500 uppercase tracking-wide mb-1">Full Name</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-primary-200 rounded-lg text-church-dark focus:outline-none focus:ring-2 focus:ring-church-gold focus:border-transparent transition-all"
                        placeholder="Enter your full name"
                        autoFocus
                      />
                    ) : (
                      <p className="text-base sm:text-lg font-semibold text-church-dark">
                        {profile.full_name || 'Not set'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Email Address */}
              <div className="group bg-primary-50 rounded-xl p-4 hover:bg-primary-100 transition-colors duration-300">
                <div className="flex items-start gap-3">
                  <FaEnvelope className="w-5 h-5 text-church-gold mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-primary-500 uppercase tracking-wide mb-1">Email Address</p>
                    <p className="text-base sm:text-lg font-semibold text-church-dark break-all">
                      {user?.email || 'Not available'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Member Since */}
              <div className="group bg-primary-50 rounded-xl p-4 hover:bg-primary-100 transition-colors duration-300">
                <div className="flex items-start gap-3">
                  <FaCalendar className="w-5 h-5 text-church-gold mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-primary-500 uppercase tracking-wide mb-1">Member Since</p>
                    <p className="text-base sm:text-lg font-semibold text-church-dark">
                      {new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Role Information Section */}
          {isCategoryAdmin && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-1 w-6 bg-church-gold rounded-full"></div>
                  <span className="text-xs font-semibold text-church-gold uppercase tracking-wider">Permissions</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-church-dark">Assigned Categories</h2>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaUserShield className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-blue-800 font-medium mb-1">
                      Category Admin Access
                    </p>
                    <p className="text-blue-700 text-sm">
                      You have access to manage songs in your assigned categories only. 
                      Contact a Super Administrator if you need access to additional categories.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Super Admin Stats */}
          {isSuperAdmin && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-1 w-6 bg-church-gold rounded-full"></div>
                  <span className="text-xs font-semibold text-church-gold uppercase tracking-wider">Access Level</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-church-dark">Administrative Access</h2>
              </div>
              
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaCrown className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-amber-800 font-medium mb-1">
                      Full System Access
                    </p>
                    <p className="text-amber-700 text-sm">
                      You have full administrative privileges including managing users, 
                      categories, subcategories, and all songs in the system.
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <FaCheck className="w-3 h-3 text-amber-600" />
                      <span className="text-xs text-amber-700">Manage all content</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <FaCheck className="w-3 h-3 text-amber-600" />
                      <span className="text-xs text-amber-700">User administration</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}