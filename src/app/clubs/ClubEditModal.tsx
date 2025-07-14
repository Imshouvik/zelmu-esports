"use client"

import { useState, useRef } from 'react'
import { supabase } from '@/utils/supabaseClient'
import { motion } from 'framer-motion'
import { FaTimes, FaUpload, FaSave, FaTrash } from 'react-icons/fa'

interface Club {
  id: string
  name: string
  logo_url?: string
  bio?: string
  created_at: string
  owner_id: string
}

interface ClubEditModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  club: Club | null
}

export default function ClubEditModal({ open, onClose, onSuccess, club }: ClubEditModalProps) {
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize form with club data when modal opens
  useState(() => {
    if (club) {
      setName(club.name || '')
      setBio(club.bio || '')
    }
  })

  if (!open || !club) return null

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!name.trim()) {
      setError('Club name is required.')
      return
    }
    
    setLoading(true)
    
    try {
      // Get current user from Supabase
      const { data: { user: currentUser }, error: userError } = await supabase!.auth.getUser()
      
      if (userError || !currentUser) {
        throw new Error('You must be logged in to edit a club.')
      }

      // Verify user owns this club
      if (currentUser.id !== club.owner_id) {
        throw new Error('You can only edit clubs you own.')
      }
      
      let logoUrl = club.logo_url || ''
      
      // 1. Upload new logo if provided
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const filePath = `club-logos/${currentUser.id}-${Date.now()}.${fileExt}`
        const { data, error: uploadError } = await supabase!.storage.from('club-logos').upload(filePath, logoFile)
        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw new Error(`Failed to upload logo: ${uploadError.message}`)
        }
        const { data: urlData } = supabase!.storage.from('club-logos').getPublicUrl(filePath)
        logoUrl = urlData.publicUrl
      }
      
      // 2. Update club
      const { error: updateError } = await supabase!
        .from('clubs')
        .update({ 
          name: name.trim(), 
          logo_url: logoUrl || null, 
          bio: bio.trim() || null
        })
        .eq('id', club.id)
        .eq('owner_id', currentUser.id) // Extra security check
        
      if (updateError) {
        console.error('Club update error:', updateError)
        throw new Error(`Failed to update club: ${updateError.message}`)
      }
      
      setLoading(false)
      onSuccess()
      onClose()
      
    } catch (err: any) {
      console.error('Club update error:', err)
      setError(err.message || 'Failed to update club.')
      setLoading(false)
    }
  }

  const handleDeleteClub = async () => {
    if (!confirm('Are you sure you want to delete this club? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    
    try {
      const { data: { user: currentUser }, error: userError } = await supabase!.auth.getUser()
      
      if (userError || !currentUser || currentUser.id !== club.owner_id) {
        throw new Error('You can only delete clubs you own.')
      }

      // Delete club (this will cascade to related records due to foreign keys)
      const { error: deleteError } = await supabase!
        .from('clubs')
        .delete()
        .eq('id', club.id)
        .eq('owner_id', currentUser.id)

      if (deleteError) {
        throw new Error(`Failed to delete club: ${deleteError.message}`)
      }

      setLoading(false)
      onSuccess()
      onClose()
      
    } catch (err: any) {
      console.error('Club deletion error:', err)
      setError(err.message || 'Failed to delete club.')
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15, mass: 1 }}
        className="relative w-full max-w-lg bg-gradient-to-br from-[#18122b]/95 to-[#232046]/95 shadow-2xl border border-fuchsia-700/30 backdrop-blur-xl rounded-2xl sm:rounded-3xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-fuchsia-300 hover:text-white transition-colors p-1 z-10"
        >
          <FaTimes className="h-5 w-5" />
        </button>
        
        <div className="p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 text-center drop-shadow-[0_2px_24px_rgba(236,72,153,0.5)]">Edit Club</h2>
          <p className="text-fuchsia-200 text-center mb-6 text-sm">Update your club details</p>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-fuchsia-200 font-semibold mb-2">Club Name <span className="text-fuchsia-400">*</span></label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-fuchsia-500/30 text-white placeholder-fuchsia-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-all text-base"
                placeholder="Enter club name"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-fuchsia-200 font-semibold mb-2">Logo (optional)</label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                  className="hidden"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-fuchsia-700/20 hover:bg-fuchsia-700/40 text-fuchsia-200 rounded-lg border border-fuchsia-500/30 font-medium transition-all disabled:opacity-50"
                >
                  <FaUpload /> {logoFile ? logoFile.name : 'Upload New Logo'}
                </button>
                {logoFile && (
                  <img src={URL.createObjectURL(logoFile)} alt="Logo Preview" className="w-12 h-12 rounded-full object-cover border-2 border-fuchsia-400 shadow" />
                )}
                {club.logo_url && !logoFile && (
                  <img src={club.logo_url} alt="Current Logo" className="w-12 h-12 rounded-full object-cover border-2 border-fuchsia-400 shadow" />
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-fuchsia-200 font-semibold mb-2">Bio (optional)</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-fuchsia-500/30 text-white placeholder-fuchsia-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-all text-base min-h-[80px]"
                placeholder="Describe your club (max 200 chars)"
                maxLength={200}
                disabled={loading}
              />
            </div>
            
            {error && <div className="text-red-400 text-sm font-semibold text-center">{error}</div>}
            
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-fuchsia-500 via-blue-500 to-purple-600 hover:from-fuchsia-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg transition-all border-2 border-white/10 hover:scale-105 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <FaSave />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              
              <button
                type="button"
                onClick={handleDeleteClub}
                disabled={loading}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all border-2 border-red-400/30 hover:scale-105 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <FaTrash />
                Delete
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  )
} 