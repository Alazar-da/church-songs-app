'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'
import { 
  FaBars, 
  FaTimes, 
  FaTachometerAlt, 
  FaFolder, 
  FaList, 
  FaMusic, 
  FaUsers, 
  FaUserCircle,
  FaSignOutAlt,
  FaChurch,
  FaCrown
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import FloatingAddButton from './FloatingAddButton'
import Image from 'next/image'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { profile, signOut } = useAuthStore()
  
  const isSuperAdmin = profile?.roles?.name === 'super_admin'
  const isCategoryAdmin = profile?.roles?.name === 'category_admin'

  // Close sidebar on route change for mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }, [pathname])

  const handleSignOut = async () => {
    await signOut()
    toast.success('Logged out successfully')
    router.push('/login')
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Menu items based on role
  const menuItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: FaTachometerAlt, requiresSuperAdmin: false },
    { href: '/admin/categories', label: 'Categories', icon: FaFolder, requiresSuperAdmin: false },
    { href: '/admin/subcategories', label: 'Subcategories', icon: FaList, requiresSuperAdmin: false },
    { href: '/admin/songs', label: 'Songs', icon: FaMusic, requiresSuperAdmin: false },
    { href: '/admin/users', label: 'Users', icon: FaUsers, requiresSuperAdmin: true },
    { href: '/admin/profile', label: 'Profile', icon: FaUserCircle, requiresSuperAdmin: false },
  ]

  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter(item => 
    !item.requiresSuperAdmin || isSuperAdmin
  )

  const getPageTitle = () => {
    const currentItem = visibleMenuItems.find(item => 
      pathname === item.href || pathname.startsWith(item.href + '/')
    )
    return currentItem?.label || 'Admin Panel'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-gradient-to-b from-primary-800 to-primary-900 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="sticky top-0 bg-primary-800/95 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between p-5 border-b border-primary-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-church-gold/20 rounded-xl flex items-center justify-center">
                <Image 
                  src="/logo.jpg" 
                  alt="Church Songs Logo"
                  width={40}
                  height={40}
                  className="rounded-xl"
                />
              </div>
              <div>
                <span className="text-white font-bold text-lg block">Church Songs</span>
                <span className="text-white/60 text-xs">Admin Panel</span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white/80 hover:text-white hover:bg-primary-700 p-2 rounded-lg transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User Info Card */}
        <div className="mx-4 mt-4 p-4 bg-primary-700/50 rounded-2xl border border-primary-600">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-church-gold to-church-gold/80 rounded-xl flex items-center justify-center shadow-lg">
              <FaUserCircle className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold truncate">
                {profile?.full_name?.split(' ')[0] || 'Admin'}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                {isSuperAdmin ? (
                  <>
                    <FaCrown className="w-3 h-3 text-amber-400" />
                    <span className="text-white/70 text-xs">Super Admin</span>
                  </>
                ) : (
                  <span className="text-white/70 text-xs">Category Admin</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1.5">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false)
                  }
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-church-gold text-white shadow-lg'
                    : 'text-white/80 hover:bg-primary-700 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : ''}`} />
                <span className="text-sm font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Sign Out Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-700 bg-primary-800/95 backdrop-blur-sm">
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 px-4 py-2.5 w-full bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-xl transition-all duration-200 group"
          >
            <FaSignOutAlt className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-30 border-b border-primary-100">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-primary-100 rounded-xl text-primary-600 transition-all duration-200 hover:scale-105"
                title="Menu"
              >
                <FaBars className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-church-dark">{getPageTitle()}</h1>
                <p className="text-xs text-primary-500 hidden sm:block mt-0.5">
                  {isSuperAdmin ? 'Full system access' : 'Manage assigned categories'}
                </p>
              </div>
            </div>
            
            {/* Desktop Sign Out */}
            <button
              onClick={handleSignOut}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-medium transition-all duration-200 hover:scale-105"
            >
              <FaSignOutAlt className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
        
        {/* Floating Add Button - Only show for relevant pages */}
        <FloatingAddButton />
      </div>
    </div>
  )
}