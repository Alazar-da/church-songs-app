'use client'
import React from 'react'
import { useRouter } from 'next/navigation'

function page() {
    const router = useRouter()
  return (
    router.push('/admin/dashboard')
  )
}

export default page