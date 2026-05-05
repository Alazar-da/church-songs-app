'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { FaChurch, FaUserShield, FaEnvelope, FaLock, FaUserPlus } from 'react-icons/fa'

export default function SetupPage() {
  const [email, setEmail] = useState('admin@church.com')
  const [password, setPassword] = useState('Admin123!')
  const [fullName, setFullName] = useState('Super Admin')
  const [loading, setLoading] = useState(false)

  const createSuperAdmin = async () => {
    setLoading(true)
    try {
      // First, check if roles exist
      const { data: roles } = await supabase.from('roles').select('id')
      if (!roles || roles.length === 0) {
        toast.error('Please run database setup first. Roles table is empty.')
        return
      }

      // Sign up user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      })
      
      if (signUpError) throw signUpError
      
      if (authData.user) {
        // Get super_admin role ID
        const { data: roleData } = await supabase
          .from('roles')
          .select('id')
          .eq('name', 'super_admin')
          .single()
        
        if (!roleData) {
          throw new Error('Super admin role not found')
        }
        
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            full_name: fullName,
            role_id: roleData.id
          })
        
        if (profileError) throw profileError
        
        toast.success('Super admin created successfully! You can now login.')
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      }
    } catch (error: any) {
      if (error.message.includes('User already registered')) {
        toast.error('User already exists. Try logging in instead.')
      } else {
        toast.error(error.message || 'Failed to create super admin')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen church-gradient flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-900/10 rounded-full mb-4">
            <FaUserShield className="w-10 h-10 text-primary-900" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Setup Super Admin</h1>
          <p className="text-gray-600 mt-2">Create the first administrator account</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <FaUserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-primary pl-10"
                placeholder="Super Admin"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-primary pl-10"
                placeholder="admin@church.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-primary pl-10"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            onClick={createSuperAdmin}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <FaChurch /> Create Super Admin
              </>
            )}
          </button>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <p className="text-xs text-yellow-800">
              ⚠️ This page should be removed after initial setup for security reasons.
              Make sure your database tables are created before running this setup.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}