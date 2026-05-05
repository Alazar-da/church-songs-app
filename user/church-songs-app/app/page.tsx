'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'


export default function HomePage() {
  const router = useRouter()

  return (
  router.push('/categories')
  )
}