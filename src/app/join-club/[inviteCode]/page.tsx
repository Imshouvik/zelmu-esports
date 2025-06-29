"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabaseClient'
import { motion } from 'framer-motion'
import { FaCrown, FaUsers, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa'
import Navigation from '@/components/Navigation'

interface ClubInvite {
  id: string
  club_id: string
  invite_code: string
  created_at: string
  expires_at?: string
  created_by: string
}

interface Club {
  id: string
  name: string
  logo_url?: string
  bio?: string
  created_at: string
  owner_id: string
}

export default function JoinClubPage() {
  const params = useParams()
  const router = useRouter()
  const inviteCode = params?.inviteCode as string | undefined
  
  if (!inviteCode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h2 className="text-2xl text-white">Invalid invite link.</h2>
      </div>
    )
  }

  const [invite, setInvite] = useState<ClubInvite | null>(null)
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Fetch invite and club details
  const fetchInviteDetails = async () => {
    try {
      setLoading(true)
      
      // Get invite details
      const { data: inviteData, error: inviteError } = await supabase
        .from('club_invites')
        .select('*')
        .eq('invite_code', inviteCode)
        .single()

      if (inviteError) {
        if (inviteError.code === 'PGRST116') {
          setError('Invalid invite link. This invite does not exist.')
        } else {
          console.error('Error fetching invite:', inviteError)
          setError('Failed to load invite details.')
        }
        setLoading(false)
        return
      }

      setInvite(inviteData)

      // Check if invite is expired
      if (inviteData.expires_at && new Date(inviteData.expires_at) < new Date()) {
        setError('This invite has expired.')
        setLoading(false)
        return
      }

      // Get club details
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', inviteData.club_id)
        .single()

      if (clubError) {
        console.error('Error fetching club:', clubError)
        setError('Failed to load club details.')
        setLoading(false)
        return
      }

      setClub(clubData)
      
    } catch (err) {
      console.error('Error:', err)
      setError('An error occurred while loading invite details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (inviteCode) {
      fetchInviteDetails()
    }
  }, [inviteCode])

  // Join the club
  const handleJoinClub = async () => {
    try {
      setJoining(true)
      setError('')
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        // User is not logged in, redirect to register with invite code
        setError('You must be logged in to join a club.')
        setJoining(false)
        
        // Store invite code in localStorage for after registration
        localStorage.setItem('pendingInviteCode', inviteCode)
        
        // Redirect to register page
        setTimeout(() => {
          router.push('/register')
        }, 2000)
        return
      }

      if (!invite || !club) {
        setError('Invalid invite or club data.')
        setJoining(false)
        return
      }

      // Check if user is already a member
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('club_members')
        .select('id')
        .eq('club_id', club.id)
        .eq('user_id', user.id)
        .single()

      if (memberCheckError && memberCheckError.code !== 'PGRST116') {
        console.error('Error checking membership:', memberCheckError)
        setError('Failed to check membership status.')
        setJoining(false)
        return
      }

      if (existingMember) {
        setError('You are already a member of this club.')
        setJoining(false)
        return
      }

      // Check if user owns this club
      if (user.id === club.owner_id) {
        setError('You cannot join your own club.')
        setJoining(false)
        return
      }

      // Add user as member
      const { error: joinError } = await supabase
        .from('club_members')
        .insert([{
          club_id: club.id,
          user_id: user.id,
          role: 'member',
          status: 'active'
        }])

      if (joinError) {
        console.error('Join error:', joinError)
        throw new Error(`Failed to join club: ${joinError.message}`)
      }

      setSuccess('Successfully joined the club!')
      
      // Redirect to clubs page after a short delay
      setTimeout(() => {
        router.push('/clubs')
      }, 2000)
      
    } catch (err: any) {
      console.error('Join club error:', err)
      setError(err.message || 'Failed to join club.')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center">
      <Navigation />
      {/* Background image with blue-black overlay */}
      <div className="absolute inset-0 w-full h-full -z-10 bg-black">
        <img
          src="/app/images/esports%20bg.webp"
          alt="Esports Background"
          className="w-full h-full object-cover object-center"
          style={{ opacity: 0.7 }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a23]/80 via-blue-900/60 to-[#18122b]/90 mix-blend-multiply pointer-events-none" />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md mx-auto px-6 py-10 sm:px-10 sm:py-12 rounded-3xl backdrop-blur-2xl bg-white/10 border border-fuchsia-500/30 shadow-2xl flex flex-col items-center text-center" style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
        
        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center">
            <FaSpinner className="animate-spin text-4xl text-fuchsia-400 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Loading Invite...</h2>
            <p className="text-fuchsia-200">Please wait while we verify your invite.</p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="flex flex-col items-center">
            <FaTimes className="text-4xl text-red-400 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Invalid Invite</h2>
            <p className="text-red-300 mb-6">{error}</p>
            <button
              onClick={() => router.push('/clubs')}
              className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-6 py-3 rounded-xl font-bold transition-colors"
            >
              Go to Clubs
            </button>
          </div>
        )}

        {/* Success state */}
        {success && (
          <div className="flex flex-col items-center">
            <FaCheck className="text-4xl text-green-400 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Welcome!</h2>
            <p className="text-green-300 mb-6">{success}</p>
            <p className="text-fuchsia-200 text-sm">Redirecting to clubs page...</p>
          </div>
        )}

        {/* Club join form */}
        {!loading && !error && !success && club && (
          <div className="w-full">
            {/* Club info */}
            <div className="mb-8">
              <div className="mb-6">
                {club.logo_url ? (
                  <img
                    src={club.logo_url}
                    alt={`${club.name} logo`}
                    className="w-20 h-20 mx-auto rounded-2xl object-cover border-2 border-fuchsia-400/30 shadow-lg mb-4"
                  />
                ) : (
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-fuchsia-600 to-purple-700 flex items-center justify-center border-2 border-fuchsia-400/30 shadow-lg mb-4">
                    <FaCrown className="text-2xl text-white" />
                  </div>
                )}
                <h2 className="text-2xl font-bold text-white mb-2">{club.name}</h2>
                {club.bio && (
                  <p className="text-fuchsia-200 text-sm mb-4">{club.bio}</p>
                )}
              </div>

              <div className="bg-white/10 rounded-xl p-4 mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <FaUsers className="text-fuchsia-400" />
                  Club Invitation
                </h3>
                <div className="text-left space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-fuchsia-200">Invite Code:</span>
                    <code className="text-fuchsia-300 font-mono">{inviteCode}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-fuchsia-200">Created:</span>
                    <span className="text-fuchsia-300">{new Date(invite?.created_at || '').toLocaleDateString()}</span>
                  </div>
                  {invite?.expires_at && (
                    <div className="flex justify-between">
                      <span className="text-fuchsia-200">Expires:</span>
                      <span className="text-fuchsia-300">{new Date(invite.expires_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Join button */}
            <button
              onClick={handleJoinClub}
              disabled={joining}
              className="w-full bg-gradient-to-r from-fuchsia-500 via-blue-500 to-purple-600 hover:from-fuchsia-600 hover:to-blue-700 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg transition-all border-2 border-white/20 hover:scale-105 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {joining ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Joining Club...
                </>
              ) : (
                <>
                  <FaCheck />
                  Join Club
                </>
              )}
            </button>

            <p className="text-fuchsia-200 text-sm mt-4">
              By joining, you'll become a member of this club and can participate in club activities.
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 