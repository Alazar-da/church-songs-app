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

  // Root path redirect
  if (path === '/') {
    if (session) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Public paths (no auth required)
  const isPublicPath = path === '/login' || path === '/register'
  
  // Protected paths (auth required)
  const isProtectedPath = path.startsWith('/admin')
  
  // If not authenticated and trying to access protected path
  if (!session && isProtectedPath) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('error', 'unauthorized')
    return NextResponse.redirect(redirectUrl)
  }
  
  // If authenticated and trying to access login page
  if (session && isPublicPath) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }
  
  // Admin role check for all /admin routes (but less strict)
  if (session && path.startsWith('/admin')) {
    // Get user profile with role
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*, roles(name)')
      .eq('id', session.user.id)
      .single()
    
    console.log('Profile check:', { profile, error, userId: session.user.id })
    
    // If no profile exists, create one with default role
    if (!profile) {
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
          // Allow access to dashboard only
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
    
    // Check if user has valid role
    const userRole = profile?.roles?.name
    
    if (userRole !== 'super_admin' && userRole !== 'category_admin') {
      console.log('Invalid role:', userRole)
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}