'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/utils/supabaseClient'

interface User {
  id: string
  name: string
  email: string
}

interface UserSearchInviteProps {
  onUserSelect: (user: User) => void
  placeholder?: string
  label?: string
  className?: string
  disabled?: boolean
}

export default function UserSearchInvite({
  onUserSelect,
  placeholder = "Search for a player...",
  label = "Player Name",
  className = "",
  disabled = false
}: UserSearchInviteProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search users when search term changes
  useEffect(() => {
    const searchUsers = async () => {
      if (searchTerm.length < 2) {
        setUsers([])
        setShowDropdown(false)
        return
      }

      setLoading(true)
      try {
        const { data, error } = await supabase!
          .from('users')
          .select('id, name, email')
          .or(`name.ilike.%${searchTerm}%`)
          .order('name', { ascending: true })
          .limit(10)

        if (error) {
          console.error('Error searching users:', error)
          setUsers([])
        } else {
          // Sort results to prioritize exact matches first
          const sortedUsers = (data || []).sort((a, b) => {
            const searchLower = searchTerm.toLowerCase()
            const aNameLower = a.name.toLowerCase()
            const bNameLower = b.name.toLowerCase()
            
            // Exact match gets highest priority
            if (aNameLower === searchLower && bNameLower !== searchLower) return -1
            if (bNameLower === searchLower && aNameLower !== searchLower) return 1
            
            // Starts with search term gets second priority
            if (aNameLower.startsWith(searchLower) && !bNameLower.startsWith(searchLower)) return -1
            if (bNameLower.startsWith(searchLower) && !aNameLower.startsWith(searchLower)) return 1
            
            // Contains search term gets third priority
            if (aNameLower.includes(searchLower) && !bNameLower.includes(searchLower)) return -1
            if (bNameLower.includes(searchLower) && !aNameLower.includes(searchLower)) return 1
            
            // If both have same match type, sort alphabetically
            return aNameLower.localeCompare(bNameLower)
          })
          
          setUsers(sortedUsers)
          setShowDropdown(true)
        }
      } catch (error) {
        console.error('Error searching users:', error)
        setUsers([])
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    setSearchTerm(user.name)
    setShowDropdown(false)
    onUserSelect(user)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    if (!value) {
      setSelectedUser(null)
      onUserSelect({ id: '', name: '', email: '' })
    }
  }

  const handleInputFocus = () => {
    if (searchTerm.length >= 2 && users.length > 0) {
      setShowDropdown(true)
    }
  }

  const handleClear = () => {
    setSearchTerm('')
    setSelectedUser(null)
    setShowDropdown(false)
    onUserSelect({ id: '', name: '', email: '' })
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="peer w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-fuchsia-500/30 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-all text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <label className="absolute left-3 sm:left-4 top-2 sm:top-3 text-fuchsia-200 text-xs sm:text-sm transition-all peer-placeholder-shown:top-2 sm:peer-placeholder-shown:top-3 peer-placeholder-shown:text-fuchsia-200 peer-focus:-top-5 peer-focus:text-xs peer-focus:text-fuchsia-400 bg-[#232046]/80 px-1 rounded">
          {label}
        </label>
        
        {/* Search Icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <svg className="w-4 h-4 text-fuchsia-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Clear Button */}
        {searchTerm && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-10 top-1/2 transform -translate-y-1/2 text-fuchsia-300 hover:text-fuchsia-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-1 bg-[#232046]/95 backdrop-blur-sm border border-fuchsia-500/30 rounded-lg shadow-xl max-h-60 overflow-y-auto"
          >
            {loading ? (
              <div className="p-4 text-center text-fuchsia-200">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-fuchsia-500"></div>
                <span className="ml-2">Searching...</span>
              </div>
            ) : users.length > 0 ? (
              <div className="py-2">
                {users.map((user) => (
                  <motion.button
                    key={user.id}
                    type="button"
                    onClick={() => handleUserSelect(user)}
                    className="w-full px-4 py-3 text-left hover:bg-fuchsia-500/20 transition-colors flex items-center space-x-3"
                    whileHover={{ backgroundColor: 'rgba(236, 72, 153, 0.2)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* User Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">{user.name}</div>
                      <div className="text-fuchsia-300 text-sm truncate">{user.email}</div>
                    </div>
                    
                    {/* Select Indicator */}
                    <div className="flex-shrink-0">
                      <svg className="w-4 h-4 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : searchTerm.length >= 2 ? (
              <div className="p-4 text-center text-fuchsia-300">
                No users found matching "{searchTerm}"
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected User Display */}
      {selectedUser && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
              {selectedUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-green-300 text-sm font-medium">{selectedUser.name}</div>
              <div className="text-green-400 text-xs">{selectedUser.email}</div>
            </div>
            <div className="ml-auto">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
} 