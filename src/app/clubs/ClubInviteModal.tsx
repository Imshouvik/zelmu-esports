"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabaseClient'
import { motion } from 'framer-motion'
import { FaTimes, FaCopy, FaLink, FaUsers, FaClock, FaTrash, FaUserPlus, FaUserTimes, FaSpinner } from 'react-icons/fa'

interface ClubInvite {
  id: string
  invite_code: string
  created_at: string
  expires_at?: string
  created_by: string
}

interface UserInvite {
  id: string
  user_id: string
  role: string
  status: 'pending' | 'active' | 'rejected'
  joined_at: string
  users: any // Supabase can return this as array or object
}

interface ClubInviteModalProps {
  open: boolean
  onClose: () => void
  clubId: string
  clubName: string
}

export default function ClubInviteModal({ open, onClose, clubId, clubName }: ClubInviteModalProps) {
  const [invites, setInvites] = useState<ClubInvite[]>([])
  const [userInvites, setUserInvites] = useState<UserInvite[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [cancelingInvite, setCancelingInvite] = useState<string | null>(null)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  // Fetch existing invites and user invites
  const fetchInvites = async () => {
    try {
      setLoading(true)
      
      // Fetch link invites (only general ones, not individual user invites)
      const { data: linkInvites, error: linkError } = await supabase!
        .from('club_invites')
        .select('*')
        .eq('club_id', clubId)
        .is('for_user_id', null) // Only show general invite links
        .order('created_at', { ascending: false })

      if (linkError) {
        console.error('Error fetching link invites:', linkError)
      } else {
        setInvites(linkInvites || [])
      }

      // Fetch user invites (pending memberships)
      const { data: pendingMemberships, error: userError } = await supabase!
        .from('club_members')
        .select(`
          id,
          user_id,
          role,
          status,
          joined_at,
          users (id, name, email)
        `)
        .eq('club_id', clubId)
        .eq('status', 'pending')
        .order('joined_at', { ascending: false })

      if (userError) {
        console.error('Error fetching user invites:', userError)
      } else {
        // Process the data to handle users field properly
        const processedMemberships = (pendingMemberships || []).map(membership => ({
          ...membership,
          users: Array.isArray(membership.users) ? membership.users[0] : membership.users
        }));
        
        setUserInvites(processedMemberships)
      }
    } catch (err) {
      console.error('Error:', err)
      setError('An error occurred while loading invites.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchInvites()
    }
  }, [open, clubId])

  // Real-time subscription for user invite updates
  useEffect(() => {
    if (!open) return

    const subscription = supabase!
      .channel('club_members_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'club_members',
          filter: `club_id=eq.${clubId}`
        },
        (payload) => {
          console.log('Real-time club membership change:', payload)
          fetchInvites()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [open, clubId])

  // Create new invite
  const createInvite = async () => {
    try {
      setCreating(true)
      setError('')
      
      const { data: { user }, error: userError } = await supabase!.auth.getUser()
      
      if (userError || !user) {
        throw new Error('You must be logged in to create invites.')
      }

      // Generate unique invite code
      const inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      
      // Set expiration to 7 days from now
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { error: insertError } = await supabase!
        .from('club_invites')
        .insert([{
          club_id: clubId,
          invite_code: inviteCode,
          created_by: user.id,
          expires_at: expiresAt.toISOString(),
          for_user_id: null // Explicitly set to null for general invite links
        }])

      if (insertError) {
        throw new Error(`Failed to create invite: ${insertError.message}`)
      }

      setSuccess('Invite created successfully!')
      fetchInvites() // Refresh the list
      
    } catch (err: any) {
      console.error('Create invite error:', err)
      setError(err.message || 'Failed to create invite.')
    } finally {
      setCreating(false)
    }
  }

  // Delete invite
  const deleteInvite = async (inviteId: string) => {
    if (!confirm('Are you sure you want to delete this invite?')) {
      return
    }

    try {
      const { error } = await supabase!
        .from('club_invites')
        .delete()
        .eq('id', inviteId)

      if (error) {
        throw new Error(`Failed to delete invite: ${error.message}`)
      }

      setSuccess('Invite deleted successfully!')
      fetchInvites() // Refresh the list
      
    } catch (err: any) {
      console.error('Delete invite error:', err)
      setError(err.message || 'Failed to delete invite.')
    }
  }

  // Cancel user invite
  const cancelUserInvite = async (membershipId: string, userName: string) => {
    if (!confirm(`Are you sure you want to cancel the invite for ${userName}?`)) {
      return
    }

    setCancelingInvite(membershipId)
    try {
      const { error } = await supabase!
        .from('club_members')
        .delete()
        .eq('id', membershipId)

      if (error) {
        throw new Error(`Failed to cancel invite: ${error.message}`)
      }

      setSuccess(`Invite for ${userName} cancelled successfully!`)
      fetchInvites() // Refresh the list
      
    } catch (err: any) {
      console.error('Cancel invite error:', err)
      setError(err.message || 'Failed to cancel invite.')
    } finally {
      setCancelingInvite(null)
    }
  }

  // Copy invite link to clipboard
  const copyInviteLink = async (inviteCode: string) => {
    const inviteLink = `${baseUrl}/join-club/${inviteCode}`
    
    try {
      await navigator.clipboard.writeText(inviteLink)
      setSuccess('Invite link copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
      setError('Failed to copy invite link.')
    }
  }

  // Check if invite is expired
  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  // Helper function to safely get user data
  const getUserData = (userInvite: UserInvite) => {
    const userData = Array.isArray(userInvite.users) ? userInvite.users[0] : userInvite.users;
    return userData || { name: 'Unknown User', email: 'unknown@email.com' };
  }

  if (!open) return null

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
        className="relative w-full max-w-4xl bg-gradient-to-br from-[#18122b]/95 to-[#232046]/95 shadow-2xl border border-fuchsia-700/30 backdrop-blur-xl rounded-2xl sm:rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto"
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
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 text-center drop-shadow-[0_2px_24px_rgba(236,72,153,0.5)]">Invite Members</h2>
          <p className="text-fuchsia-200 text-center mb-6 text-sm">Invite players to join {clubName}</p>
          
          {/* Success/Error messages */}
          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-center">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-center">
              {error}
            </div>
          )}

          {/* Create new invite button */}
          <div className="mb-6">
            <button
              onClick={createInvite}
              disabled={creating}
              className="w-full bg-gradient-to-r from-fuchsia-500 via-blue-500 to-purple-600 hover:from-fuchsia-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg transition-all border-2 border-white/10 hover:scale-105 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <FaLink />
              {creating ? 'Creating Invite...' : 'Create New Invite Link'}
            </button>
          </div>

          {/* User Invites Section */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <FaUserPlus className="text-fuchsia-400" />
              Direct User Invites ({userInvites.length})
            </h3>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-400 mx-auto mb-2"></div>
                <span className="text-fuchsia-200">Loading user invites...</span>
              </div>
            ) : userInvites.length === 0 ? (
              <div className="text-center py-8 text-fuchsia-200 bg-white/5 rounded-lg border border-fuchsia-500/20">
                <FaUserPlus className="text-4xl text-fuchsia-400 mx-auto mb-4 opacity-50" />
                <p>No direct user invites yet</p>
                <p className="text-sm text-fuchsia-300 mt-2">Use the search feature on the clubs page to invite specific users</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userInvites.map((userInvite) => (
                  <motion.div
                    key={userInvite.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-white/10 border border-fuchsia-500/30 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-600 to-purple-700 flex items-center justify-center border border-fuchsia-400/30">
                            <span className="text-white text-sm font-bold">
                              {getUserData(userInvite).name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-white font-semibold">{getUserData(userInvite).name}</h4>
                            <p className="text-fuchsia-200 text-sm">{getUserData(userInvite).email}</p>
                          </div>
                        </div>
                        <div className="text-xs text-fuchsia-300">
                          Invited: {new Date(userInvite.joined_at).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => cancelUserInvite(userInvite.id, getUserData(userInvite).name)}
                        disabled={cancelingInvite === userInvite.id}
                        className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/40 text-red-200 px-3 py-2 rounded-lg border border-red-500/30 transition-all disabled:opacity-50"
                      >
                        {cancelingInvite === userInvite.id ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <FaUserTimes />
                        )}
                        Cancel Invite
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Link Invites Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <FaUsers className="text-fuchsia-400" />
              Invite Links ({invites.filter(invite => !isExpired(invite.expires_at)).length})
            </h3>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-400 mx-auto mb-2"></div>
                <span className="text-fuchsia-200">Loading invite links...</span>
              </div>
            ) : !loading && invites.length === 0 ? (
              <div className="text-center py-8 text-fuchsia-200">
                No invite links created yet. Create your first invite above!
              </div>
            ) : (
              invites.map((invite) => (
                <motion.div
                  key={invite.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border ${
                    isExpired(invite.expires_at) 
                      ? 'bg-red-500/10 border-red-500/30' 
                      : 'bg-white/10 border-fuchsia-500/30'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Invite Code */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-fuchsia-200 font-semibold">Invite Code:</span>
                          <code className="bg-black/30 px-2 py-1 rounded text-fuchsia-300 font-mono text-sm">
                            {invite.invite_code}
                          </code>
                          {isExpired(invite.expires_at) && (
                            <span className="text-red-400 text-xs bg-red-500/20 px-2 py-1 rounded">EXPIRED</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Full URL */}
                    <div className="bg-black/20 rounded-lg p-3">
                      <div className="text-fuchsia-200 text-sm mb-2">Full Invite Link:</div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-black/30 px-3 py-2 rounded text-fuchsia-300 font-mono text-xs break-all">
                          {baseUrl}/join-club/{invite.invite_code}
                        </code>
                        {!isExpired(invite.expires_at) && (
                          <button
                            onClick={() => copyInviteLink(invite.invite_code)}
                            className="flex-shrink-0 p-2 bg-fuchsia-700/20 hover:bg-fuchsia-700/40 text-fuchsia-200 rounded-lg border border-fuchsia-500/30 transition-all"
                            title="Copy invite link"
                          >
                            <FaCopy className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Invite Details */}
                    <div className="flex items-center justify-between text-xs text-fuchsia-300">
                      <div className="flex items-center gap-4">
                        <span>Created: {new Date(invite.created_at).toLocaleDateString()}</span>
                        {invite.expires_at && (
                          <span className="flex items-center gap-1">
                            <FaClock />
                            Expires: {new Date(invite.expires_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => deleteInvite(invite.id)}
                        className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-300 rounded-lg border border-red-500/30 transition-all"
                        title="Delete invite"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h4 className="text-blue-300 font-semibold mb-2">How it works:</h4>
            <ul className="text-blue-200 text-sm space-y-1">
              <li>• <strong>Direct User Invites:</strong> Invite specific users via search - they get instant notifications</li>
              <li>• <strong>Invite Links:</strong> Create shareable links for anyone to join</li>
              <li>• Invites expire after 7 days for security</li>
              <li>• You can cancel user invites or delete invite links at any time</li>
              <li>• You'll be notified when users accept or reject your invites</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
} 