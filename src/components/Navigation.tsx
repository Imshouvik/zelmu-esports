'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { FaUserCircle } from 'react-icons/fa'

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Tournaments', href: '/tournaments' },
    { name: 'Teams', href: '/teams' },
    { name: 'About', href: '/about' },
  ]

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-200 flex items-center px-6 py-4 shadow-sm">
      <div className="flex-1 flex justify-center md:justify-start items-center">
        <span className="px-5 py-2 rounded-full text-gray-900 text-2xl font-extrabold tracking-widest" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.15em' }}>
          ZELMU
        </span>
      </div>
      <div className="flex gap-4 items-center justify-end">
        {!isAuthenticated ? (
          <>
            <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-lg shadow transition-all duration-200">Login</Link>
            <Link href="/register" className="bg-gray-200 hover:bg-gray-300 text-blue-700 font-bold px-5 py-2 rounded-lg shadow transition-all duration-200 border border-gray-300">Register</Link>
          </>
        ) : (
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-900 font-semibold hover:text-blue-600 transition-colors duration-200">
            <FaUserCircle className="text-2xl" />
            {user?.name || 'Profile'}
          </Link>
        )}
      </div>
    </nav>
  )
}

export default Navigation 