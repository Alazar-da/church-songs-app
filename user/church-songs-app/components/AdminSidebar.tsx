'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FaHome, FaFolder, FaList, FaMusic, FaSignOutAlt } from 'react-icons/fa'
import { useAuthStore } from '@/store/authStore'

export default function AdminSidebar() {
  const pathname = usePathname()
  const { signOut } = useAuthStore()
  
  const menuItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: FaHome },
    { href: '/admin/categories', label: 'Categories', icon: FaFolder },
    { href: '/admin/subcategories', label: 'Subcategories', icon: FaList },
    { href: '/admin/songs', label: 'Songs', icon: FaMusic },
  ]
  
  const isActive = (href: string) => pathname === href
  
  return (
    <div className="w-64 bg-primary-900 text-white min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Admin Panel</h2>
      </div>
      
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-primary-700'
                  : 'hover:bg-primary-800'
              }`}
            >
              <Icon />
              <span>{item.label}</span>
            </Link>
          )
        })}
        
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary-800 transition-colors mt-8"
        >
          <FaSignOutAlt />
          <span>Sign Out</span>
        </button>
      </nav>
    </div>
  )
}