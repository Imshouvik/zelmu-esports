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
    <nav className="fixed top-0 left-0 w-full z-50 bg-transparent flex items-center px-6 py-4">
      <div className="flex-1 flex justify-center md:justify-start items-center">
        <span className="bg-white/10 px-5 py-2 rounded-full text-white text-2xl font-extrabold tracking-widest shadow-lg" style={{ fontFamily: 'Orbitron, Inter, sans-serif', letterSpacing: '0.15em' }}>
          ZELMU
        </span>
      </div>
    </nav>
  )
}

export default Navigation 