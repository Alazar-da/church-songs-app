import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set(name, value)
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set(name, value, options)
        },
        remove(name: string, options: any) {
          request.cookies.set(name, '')
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set(name, '', options)
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const path = request.nextUrl.pathname

  // Define public routes (no authentication required)
  const isPublicRoute = 
    path === '/' ||
    path === '/login' ||
    path === '/register' ||
    path.startsWith('/categories') ||
    path.startsWith('/subcategories') ||
    path.startsWith('/song/') ||
    path === '/songs' ||
    path.startsWith('/debug') ||
    path.startsWith('/setup')

  // Define admin routes (authentication + role required)
  const isAdminRoute = path.startsWith('/admin')

  // Root path redirect
  if (path === '/') {
    // Root is public, no redirect needed
    return response
  }

  // Handle admin routes
  if (isAdminRoute) {
    // Check if user is authenticated
    if (!session) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(redirectUrl)
    }

    // Get user profile with role
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*, roles(name)')
      .eq('id', session.user.id)
      .single()

    // If no profile exists, create one with default role
    if (!profile && !error) {
      // Get category_admin role ID
      const { data: defaultRole } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'category_admin')
        .single()
      
      if (defaultRole) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name || 'Admin User',
            role_id: defaultRole.id
          })
        
        if (!insertError) {
          // Allow access to dashboard
          if (path === '/admin/dashboard') {
            return response
          }
        }
      }
      
      // For any other admin page, redirect to dashboard
      if (path !== '/admin/dashboard') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
    }
    
    // Check if user has valid admin role
    const userRole = profile?.roles?.name
    
    if (userRole !== 'super_admin' && userRole !== 'category_admin') {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(redirectUrl)
    }

    // For category admins, restrict access to super-admin-only pages
    if (userRole === 'category_admin') {
      const superAdminOnlyRoutes = [
        '/admin/users',
        '/admin/categories/new',
        '/admin/categories/edit',
        '/admin/subcategories/new',
        '/admin/subcategories/edit',
      ]
      
      const isSuperAdminOnlyRoute = superAdminOnlyRoutes.some(route => 
        path === route || path.startsWith(route)
      )
      
      if (isSuperAdminOnlyRoute) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
    }
    
    return response
  }

  // Handle public routes - no authentication needed
  if (isPublicRoute) {
    return response
  }

  // If user is authenticated and tries to access login/register, redirect to admin dashboard
  if (session && (path === '/login' || path === '/register')) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  // Default: allow access
  return response
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/categories/:path*',
    '/subcategories/:path*',
    '/song/:path*',
    '/songs/:path*',
    '/admin/:path*',
    '/debug/:path*',
    '/setup/:path*',
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
}