/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove or comment out 'output: export' for development
  // output: 'export',  // Comment this out for now
  output: "export",
  
  images: {
    // Disable image optimization for static export
    unoptimized: true,
    
    // Keep your remote patterns
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ngfsyygyrxmmeorvosml.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    domains: ['ngfsyygyrxmmeorvosml.supabase.co'],
  },
  
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig