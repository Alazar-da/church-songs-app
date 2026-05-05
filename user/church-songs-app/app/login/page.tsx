'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { FaEnvelope, FaLock, FaArrowRight, FaUserShield, FaSpinner, FaChurch, FaCross } from 'react-icons/fa'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { signIn, signOut, user, profile, isLoading } = useAuthStore()
  const router = useRouter()

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user && profile) {
      router.push('/admin/dashboard')
    }
  }, [user, profile, isLoading, router])

 // Add this after successful sign in
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  try {
    await signIn(email, password)
    
    // After sign in, check the profile
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, roles(name)')
        .eq('id', user.id)
        .single()
      
      console.log('Login profile check:', { profile, userId: user.id })
      
      if (!profile) {
        toast.error('Profile not found. Please contact administrator to set up your account.')
        await signOut()
        return
      }
      
      if (!profile.roles?.name) {
        toast.error('No role assigned. Please contact administrator.')
        await signOut()
        return
      }
      
      toast.success(`Welcome ${profile.full_name || 'Admin'}!`)
      
      // Redirect based on role
      if (profile.roles?.name === 'super_admin' || profile.roles?.name === 'category_admin') {
        router.push('/admin/dashboard')
      } else {
        toast.error('You do not have admin access.')
        await signOut()
      }
    }
  } catch (error: any) {
    toast.error(error.message || 'Login failed')
  } finally {
    setLoading(false)
  }
}

  // Demo admin credentials helper
  const fillDemoCredentials = () => {
    setEmail('admin@church.com')
    setPassword('Admin123!')
    toast.success('Demo credentials filled')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center relative mb-6">
            <div className="absolute inset-0 bg-church-gold/20 rounded-full blur-xl"></div>
            <div className="relative w-[4.5rem] h-[4.5rem] bg-gradient-to-br from-church-gold to-church-gold/80 rounded-full flex items-center justify-center shadow-xl">
          
                <Image 
                  src="/logo.jpg" 
                  alt="Church Logo" 
                  width={60} 
                  height={60} 
                  className="rounded-full object-cover"
                />
             {/*  ) : (
                <FaChurch className="w-10 h-10 text-white" />
              )} */}
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-church-dark mb-2">
            Welcome Back
          </h1>
          <p className="text-primary-600 text-sm sm:text-base">
            Sign in to manage your church songs
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-primary-100">
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-church-dark mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <FaEnvelope className="text-primary-400 group-focus-within:text-church-gold transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 bg-primary-50 border border-primary-200 rounded-xl text-church-dark placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-church-gold focus:border-transparent transition-all duration-300"
                    placeholder="admin@church.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold text-church-dark mb-2">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <FaLock className="text-primary-400 group-focus-within:text-church-gold transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-primary-50 border border-primary-200 rounded-xl text-church-dark placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-church-gold focus:border-transparent transition-all duration-300"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-400 hover:text-church-gold transition-colors"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => toast.success('Contact administrator to reset password')}
                  className="text-xs text-primary-500 hover:text-church-gold transition-colors"
                >
                  Forgot password?
                </button>
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
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Demo Credentials Button */}
            {/* <div className="mt-6 pt-6 border-t border-primary-100">
              <button
                onClick={fillDemoCredentials}
                className="w-full text-sm text-primary-600 hover:text-church-gold flex items-center justify-center gap-2 transition-colors py-2"
              >
                <FaUserShield className="w-4 h-4" />
                Use Demo Admin Credentials
              </button>
            </div> */}
          </div>
        </div>

        {/* Footer Message */}
       {/*  <div className="mt-6 text-center">
          <p className="text-xs text-primary-400">
            🔐 Admin access only. Contact system administrator for credentials.
          </p>
        </div> */}
      </div>

      <style jsx>{`
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
       
        
        .animate-slide-up {
          animation: slideUp 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}