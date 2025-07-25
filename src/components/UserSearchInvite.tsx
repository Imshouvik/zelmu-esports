'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/utils/supabaseClient'
import { createPortal } from 'react-dom';

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
  onInviteUser?: (user: User) => void // Optional invite handler
  pendingMemberIds?: string[]
  activeMemberIds?: string[]
  onCancelInvite?: (user: User) => void
  refreshKey?: number // Add this line
}

export default function UserSearchInvite({
  onUserSelect,
  placeholder = "Search for a player...",
  label = "Player Name",
  className = "",
  disabled = false,
  onInviteUser,
  pendingMemberIds = [],
  activeMemberIds = [],
  onCancelInvite,
  refreshKey = 0 // Add this line
}: UserSearchInviteProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

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
          .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
          .order('name', { ascending: true })
          .limit(10)

        if (error) {
          console.error('Error searching users:', error)
          setUsers([])
        } else {
          // Filter out users who are already active or pending members
          const filteredUsers = (data || []).filter(u =>
            !activeMemberIds.includes(u.id) && !pendingMemberIds.includes(u.id)
          )
          // Sort results to prioritize exact matches first
          const sortedUsers = filteredUsers.sort((a, b) => {
            const searchLower = searchTerm.toLowerCase()
            const aNameLower = a.name.toLowerCase()
            const bNameLower = b.name.toLowerCase()
            const aEmailLower = a.email.toLowerCase()
            const bEmailLower = b.email.toLowerCase()

            // Exact match gets highest priority (name or email)
            if ((aNameLower === searchLower || aEmailLower === searchLower) && !(bNameLower === searchLower || bEmailLower === searchLower)) return -1
            if ((bNameLower === searchLower || bEmailLower === searchLower) && !(aNameLower === searchLower || aEmailLower === searchLower)) return 1

            // Starts with search term gets second priority
            if ((aNameLower.startsWith(searchLower) || aEmailLower.startsWith(searchLower)) && !(bNameLower.startsWith(searchLower) || bEmailLower.startsWith(searchLower))) return -1
            if ((bNameLower.startsWith(searchLower) || bEmailLower.startsWith(searchLower)) && !(aNameLower.startsWith(searchLower) || aEmailLower.startsWith(searchLower))) return 1

            // Contains search term gets third priority
            if ((aNameLower.includes(searchLower) || aEmailLower.includes(searchLower)) && !(bNameLower.includes(searchLower) || bEmailLower.includes(searchLower))) return -1
            if ((bNameLower.includes(searchLower) || bEmailLower.includes(searchLower)) && !(aNameLower.includes(searchLower) || aEmailLower.includes(searchLower))) return 1

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
  }, [searchTerm, refreshKey])

  // Update dropdown position on showDropdown/input focus
  useEffect(() => {
    if (showDropdown && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'absolute',
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        zIndex: 9999,
      });
    }
  }, [showDropdown, searchTerm]);

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
    <div className={`relative ${className}`}> {/* Remove overflow-visible for portal */}
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
      {/* Dropdown rendered in portal */}
      {typeof window !== 'undefined' && showDropdown && createPortal(
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          style={dropdownStyle}
          className="bg-[#232046]/95 backdrop-blur-sm border border-fuchsia-500/30 rounded-lg shadow-xl max-h-60 overflow-y-auto"
        >
          {loading ? (
            <div className="p-4 text-center text-fuchsia-200">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-fuchsia-500"></div>
              <span className="ml-2">Searching...</span>
            </div>
          ) : users.length > 0 ? (
            <div className="py-2">
              {users.map((user) => {
                const isActive = activeMemberIds.includes(user.id)
                const isPending = pendingMemberIds.includes(user.id)
                return (
                  <motion.div
                    key={user.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-fuchsia-500/20 transition-colors"
                  >
                    {/* If onInviteUser is not provided, just make the name clickable for selection */}
                    {onInviteUser ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleUserSelect(user)}
                          className="flex-1 text-left flex items-center space-x-3 focus:outline-none"
                          disabled={isActive}
                        >
                          <span className="font-medium text-white">{user.name}</span>
                          <span className="text-xs text-fuchsia-300">{user.email}</span>
                        </button>
                        {isActive ? (
                          <button type="button" className="ml-2 px-3 py-1 bg-green-600 text-white rounded text-xs font-semibold opacity-60 cursor-not-allowed" disabled>Member</button>
                        ) : isPending ? (
                          onCancelInvite ? (
                            <button
                              type="button"
                              onClick={() => onCancelInvite(user)}
                              className="ml-2 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs font-semibold"
                            >Cancel</button>
                          ) : (
                            <button type="button" className="ml-2 px-3 py-1 bg-yellow-600 text-white rounded text-xs font-semibold opacity-60 cursor-not-allowed" disabled>Invited</button>
                          )
                        ) : (
                          <button
                            type="button"
                            onClick={() => onInviteUser(user)}
                            className="ml-2 px-3 py-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded transition-colors text-xs font-semibold"
                          >Invite</button>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUserSelect(user)}
                        className="flex-1 text-left flex items-center space-x-3 focus:outline-none"
                      >
                        <span className="font-medium text-white">{user.name}</span>
                        <span className="text-xs text-fuchsia-300">{user.email}</span>
                      </button>
                    )}
                  </motion.div>
                )
              })}
            </div>
          ) : searchTerm.length >= 2 ? (
            <div className="p-4 text-center text-fuchsia-300">
              No users found matching "{searchTerm}"
            </div>
          ) : null}
        </motion.div>,
        document.body
      )}

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