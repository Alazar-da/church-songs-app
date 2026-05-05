'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { 
  FaMusic, FaImages, FaHeadphones, FaFolder, 
  FaList, FaChartLine, FaCalendarAlt, 
  FaUserShield, FaExclamationTriangle, FaArrowRight,
  FaSpinner, FaPlus, FaEye
} from 'react-icons/fa'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Stats {
  totalSongs: number
  totalImages: number
  totalAudios: number
  totalCategories: number
  totalSubcategories: number
  recentSongs: any[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalSongs: 0,
    totalImages: 0,
    totalAudios: 0,
    totalCategories: 0,
    totalSubcategories: 0,
    recentSongs: [],
  })
  const [loading, setLoading] = useState(true)
  const [userCategories, setUserCategories] = useState<any[]>([])
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const { profile, signOut, user } = useAuthStore()
  const router = useRouter()

  const isSuperAdmin = profile?.roles?.name === 'super_admin'
  const isCategoryAdmin = profile?.roles?.name === 'category_admin'

  useEffect(() => {
    if (!loading && profile) {
      if (!isSuperAdmin && !isCategoryAdmin) {
        toast.error('Access denied. Admin privileges required.')
        router.push('/login')
        return
      }
    }
    
    if (user && profile) {
      fetchStats()
      fetchUserCategories()
    }
  }, [profile, user])

  const fetchUserCategories = async () => {
    if (isSuperAdmin) return
    
    const { data: adminCats } = await supabase
      .from('admin_categories')
      .select('categories(*)')
      .eq('admin_id', profile?.id)
    
    if (adminCats) {
      setUserCategories(adminCats.map(ac => ac.categories).filter(Boolean))
    }
  }

  const fetchStats = async () => {
    try {
      let songsQuery = supabase.from('songs').select('*', { count: 'exact', head: true })
      let imagesQuery = supabase.from('song_images').select('*', { count: 'exact', head: true })
      let audiosQuery = supabase.from('song_audios').select('*', { count: 'exact', head: true })
      let categoriesQuery = supabase.from('categories').select('*', { count: 'exact', head: true })
      let subcategoriesQuery = supabase.from('subcategories').select('*', { count: 'exact', head: true })

      if (isCategoryAdmin && !isSuperAdmin) {
        const { data: adminCats } = await supabase
          .from('admin_categories')
          .select('category_id')
          .eq('admin_id', profile?.id)
        
        const categoryIds = adminCats?.map(ac => ac.category_id) || []
        
        if (categoryIds.length > 0) {
          songsQuery = songsQuery.in('category_id', categoryIds)
          subcategoriesQuery = subcategoriesQuery.in('category_id', categoryIds)
        }
      }

      const [
        { count: songsCount },
        { count: imagesCount },
        { count: audiosCount },
        { count: categoriesCount },
        { count: subcategoriesCount },
      ] = await Promise.all([
        songsQuery,
        imagesQuery,
        audiosQuery,
        categoriesQuery,
        subcategoriesQuery,
      ])

      let recentQuery = supabase
        .from('songs')
        .select('*, categories(name), subcategories(name)')
        .order('created_at', { ascending: false })
        .limit(5)

      if (isCategoryAdmin && !isSuperAdmin) {
        const { data: adminCats } = await supabase
          .from('admin_categories')
          .select('category_id')
          .eq('admin_id', profile?.id)
        
        const categoryIds = adminCats?.map(ac => ac.category_id) || []
        if (categoryIds.length > 0) {
          recentQuery = recentQuery.in('category_id', categoryIds)
        }
      }

      const { data: recentSongs } = await recentQuery

      setStats({
        totalSongs: songsCount || 0,
        totalImages: imagesCount || 0,
        totalAudios: audiosCount || 0,
        totalCategories: categoriesCount || 0,
        totalSubcategories: subcategoriesCount || 0,
        recentSongs: recentSongs || [],
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
        <div className="text-center px-4">
          <FaSpinner className="animate-spin h-12 w-12 text-church-gold mx-auto mb-4" />
          <p className="text-primary-700 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Restrict access for non-admin roles
  if (!isSuperAdmin && !isCategoryAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
        <div className="text-center px-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaExclamationTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-church-dark mb-2">Access Denied</h1>
          <p className="text-primary-600 mb-6">You don't have permission to access this page.</p>
          <button
            onClick={handleSignOut}
            className="bg-church-gold hover:bg-church-gold/80 text-white px-6 py-2.5 rounded-xl font-semibold transition-all active:scale-95"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  const statCards = [
    { id: 'songs', title: 'Total Songs', value: stats.totalSongs, icon: FaMusic, href: '/admin/songs' },
    { id: 'images', title: 'Lyrics Images', value: stats.totalImages, icon: FaImages, href: '/admin/songs' },
    { id: 'audios', title: 'Audio Files', value: stats.totalAudios, icon: FaHeadphones, href: '/admin/songs' },
    { id: 'categories', title: 'Categories', value: stats.totalCategories, icon: FaFolder, href: '/admin/categories' },
    { id: 'subcategories', title: 'Subcategories', value: stats.totalSubcategories, icon: FaList, href: '/admin/subcategories' },
  ]

  // Quick actions based on role
  const quickActions = [
    ...(isSuperAdmin ? [
      { title: 'New Category', icon: FaFolder, color: 'from-purple-500 to-purple-600', href: '/admin/categories/new' },
      { title: 'New Subcategory', icon: FaList, color: 'from-blue-500 to-blue-600', href: '/admin/subcategories/new' },
    ] : []),
    { title: 'New Song', icon: FaMusic, color: 'from-green-500 to-green-600', href: '/admin/songs/new' },
    ...(isSuperAdmin ? [
      { title: 'Manage Admins', icon: FaUserShield, color: 'from-indigo-500 to-indigo-600', href: '/admin/users' },
    ] : []),
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/30">
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-8 bg-church-gold rounded-full"></div>
                <span className="text-xs sm:text-sm font-semibold text-church-gold uppercase tracking-wider">Dashboard</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-church-dark">
                    Welcome back, {profile?.full_name?.split(' ')[0]}
                  </h1>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                      isSuperAdmin 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {isSuperAdmin ? '👑 Super Admin' : '📋 Category Admin'}
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="text-xs text-primary-500 hover:text-red-500 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Categories Notice for Category Admin */}
        {isCategoryAdmin && userCategories.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FaFolder className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">Your Assigned Categories</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  You have access to manage songs in: {userCategories.map(c => c.name).join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {statCards.map((card) => {
            const Icon = card.icon
            const isHovered = hoveredCard === card.id
            
            return (
              <Link key={card.id} href={card.href}>
                <div
                  onMouseEnter={() => setHoveredCard(card.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 active:scale-[0.99] border border-primary-100 cursor-pointer"
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-church-gold/10 rounded-xl group-hover:bg-church-gold/20 transition-colors">
                        <Icon className="w-5 h-5 text-church-gold" />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xl sm:text-2xl font-extrabold text-church-dark">{card.value.toLocaleString()}</span>
                        <FaArrowRight className={`text-church-gold text-xs transition-all duration-300 ${isHovered ? 'translate-x-1 opacity-100' : 'opacity-0'}`} />
                      </div>
                    </div>
                    <h3 className="text-xs sm:text-sm text-primary-600 font-semibold uppercase tracking-wide">{card.title}</h3>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-primary-100">
            <div className="p-5 sm:p-6 border-b border-primary-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-church-gold/10 rounded-xl">
                  <FaChartLine className="w-4 h-4 sm:w-5 sm:h-5 text-church-gold" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-church-dark">Quick Actions</h2>
                  <p className="text-xs sm:text-sm text-primary-500 mt-0.5">Create new content in seconds</p>
                </div>
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon
                  return (
                    <Link key={index} href={action.href}>
                      <div className={`bg-gradient-to-br ${action.color} text-white rounded-xl p-3 sm:p-4 text-center transition-all duration-300 active:scale-95 hover:shadow-md cursor-pointer`}>
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1.5 sm:mb-2" />
                        <p className="text-xs sm:text-sm font-semibold">{action.title}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-primary-100">
            <div className="p-5 sm:p-6 border-b border-primary-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-church-gold/10 rounded-xl">
                  <FaCalendarAlt className="w-4 h-4 sm:w-5 sm:h-5 text-church-gold" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-church-dark">Recent Songs</h2>
                  <p className="text-xs sm:text-sm text-primary-500 mt-0.5">Latest additions to your collection</p>
                </div>
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <div className="space-y-3">
                {stats.recentSongs.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FaMusic className="w-8 h-8 text-primary-400" />
                    </div>
                    <p className="text-primary-600 text-sm">No songs added yet</p>
                    <p className="text-primary-400 text-xs mt-1">Start by adding your first song!</p>
                  </div>
                ) : (
                  stats.recentSongs.map((song) => (
                    <Link key={song.id} href={`/admin/songs/view/${song.id}`}>
                      <div className="group flex items-center justify-between p-3 sm:p-4 bg-primary-50 rounded-xl hover:bg-church-gold/5 transition-all duration-300 cursor-pointer active:scale-[0.99]">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-church-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FaMusic className="w-4 h-4 sm:w-5 sm:h-5 text-church-gold" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-church-dark group-hover:text-church-gold transition-colors text-sm sm:text-base truncate">
                              {song.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs px-1.5 sm:px-2 py-0.5 bg-church-gold/20 text-church-gold rounded-full">
                                {song.categories?.name || 'Uncategorized'}
                              </span>
                              <span className="text-xs text-primary-400">•</span>
                              <span className="text-xs text-primary-500 truncate">
                                {song.subcategories?.name || 'No subcategory'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <button className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-church-gold opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-church-gold/10 rounded-lg whitespace-nowrap">
                            View
                          </button>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Footer */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-xs sm:text-sm text-primary-400">
            🎵 Managing {stats.totalSongs} songs • {stats.totalCategories} categories • {stats.totalSubcategories} subcategories
          </p>
        </div>
      </div>
    </div>
  )
}