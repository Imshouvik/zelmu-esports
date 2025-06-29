"use client"

import { useState, useRef } from 'react'
import { supabase } from '@/utils/supabaseClient'
import { motion } from 'framer-motion'
import { FaTimes, FaUpload } from 'react-icons/fa'

interface ClubCreateModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ClubCreateModal({ open, onClose, onSuccess }: ClubCreateModalProps) {
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

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
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !currentUser) {
        throw new Error('You must be logged in to create a club.')
      }

      // Check if user already has a club
      const { data: existingClub, error: checkError } = await supabase
        .from('clubs')
        .select('id, name')
        .eq('owner_id', currentUser.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking existing club:', checkError)
        throw new Error('Failed to check existing clubs.')
      }

      if (existingClub) {
        throw new Error(`You already have a club: ${existingClub.name}. Users can only create one club.`)
      }
      
      let logoUrl = ''
      
      // 1. Upload logo if provided
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const filePath = `club-logos/${currentUser.id}-${Date.now()}.${fileExt}`
        const { data, error: uploadError } = await supabase.storage.from('club-logos').upload(filePath, logoFile)
        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw new Error(`Failed to upload logo: ${uploadError.message}`)
        }
        const { data: urlData } = supabase.storage.from('club-logos').getPublicUrl(filePath)
        logoUrl = urlData.publicUrl
      }
      
      // 2. Create club
      const { data: club, error: clubError } = await supabase
        .from('clubs')
        .insert([{ 
          name: name.trim(), 
          logo_url: logoUrl || null, 
          bio: bio.trim() || null, 
          owner_id: currentUser.id 
        }])
        .select()
        .single()
        
      if (clubError) {
        console.error('Club creation error:', clubError)
        throw new Error(`Failed to create club: ${clubError.message}`)
      }
      
      // 3. Add user as owner in club_members
      const { error: memberError } = await supabase
        .from('club_members')
        .insert([{ 
          club_id: club.id, 
          user_id: currentUser.id, 
          role: 'owner', 
          status: 'active' 
        }])
        
      if (memberError) {
        console.error('Member creation error:', memberError)
        throw new Error(`Failed to add member: ${memberError.message}`)
      }
      
      setLoading(false)
      onSuccess()
      onClose()
      
    } catch (err: any) {
      console.error('Club creation error:', err)
      setError(err.message || 'Failed to create club.')
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
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 text-center drop-shadow-[0_2px_24px_rgba(236,72,153,0.5)]">Create Club</h2>
          <p className="text-fuchsia-200 text-center mb-6 text-sm">You can only create one club per account</p>
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
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-fuchsia-700/20 hover:bg-fuchsia-700/40 text-fuchsia-200 rounded-lg border border-fuchsia-500/30 font-medium transition-all"
                >
                  <FaUpload /> {logoFile ? logoFile.name : 'Upload Logo'}
                </button>
                {logoFile && (
                  <img src={URL.createObjectURL(logoFile)} alt="Logo Preview" className="w-12 h-12 rounded-full object-cover border-2 border-fuchsia-400 shadow" />
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
              />
            </div>
            {error && <div className="text-red-400 text-sm font-semibold text-center">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-fuchsia-500 via-blue-500 to-purple-600 hover:from-fuchsia-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg transition-all border-2 border-white/10 hover:scale-105 disabled:opacity-60"
            >
              {loading ? 'Creating...' : 'Create Club'}
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  )
} 