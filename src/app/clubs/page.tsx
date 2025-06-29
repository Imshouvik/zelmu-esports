"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaPlus, FaCrown, FaEdit, FaUsers, FaTrophy, FaLink, FaUserPlus, FaUserMinus, FaSignOutAlt } from 'react-icons/fa'
import Navigation from '@/components/Navigation'
import DashboardSidebar from '@/components/DashboardSidebar'
import ClubCreateModal from './ClubCreateModal'
import ClubEditModal from './ClubEditModal'
import ClubInviteModal from './ClubInviteModal'
import UserSearchInvite from '@/components/UserSearchInvite'
import { supabase } from '@/utils/supabaseClient'
import PageGuard from '@/components/PageGuard'
import { Bars3Icon } from '@heroicons/react/24/outline'

interface Club {
  id: string
  name: string
  logo_url?: string
  bio?: string
  created_at: string
  owner_id: string
  member_count?: number
}

export default function ClubsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [userClub, setUserClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Fetch user's club
  const fetchUserClub = async () => {
    try {
      setLoading(true)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setError('You must be logged in to view clubs.')
        setLoading(false)
        return
      }

      setUser(user)

      // First, check if user owns a club
      const { data: ownedClub, error: ownedClubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (ownedClub) {
        // User owns a club, get member count
        const { count: memberCount, error: countError } = await supabase
          .from('club_members')
          .select('*', { count: 'exact', head: true })
          .eq('club_id', ownedClub.id)
          .eq('status', 'active')

        if (countError) {
          console.error('Error fetching member count:', countError)
        }

        setUserClub({
          ...ownedClub,
          member_count: memberCount || 0
        })
        setLoading(false)
        return
      }

      // If user doesn't own a club, check if they're a member of any club
      const { data: membership, error: membershipError } = await supabase
        .from('club_members')
        .select(`
          club_id,
          clubs (
            id,
            name,
            logo_url,
            bio,
            created_at,
            owner_id
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (membershipError && membershipError.code !== 'PGRST116') {
        console.error('Error fetching membership:', membershipError)
      } else if (membership && membership.clubs) {
        // User is a member of a club, get member count
        const { count: memberCount, error: countError } = await supabase
          .from('club_members')
          .select('*', { count: 'exact', head: true })
          .eq('club_id', membership.club_id)
          .eq('status', 'active')

        if (countError) {
          console.error('Error fetching member count:', countError)
        }

        // Handle the clubs data properly - it might be an array or object
        let clubData: Club
        if (Array.isArray(membership.clubs)) {
          clubData = membership.clubs[0] as Club
        } else {
          clubData = membership.clubs as Club
        }

        console.log('Club data for member:', clubData)
        console.log('Membership data:', membership)

        setUserClub({
          ...clubData,
          member_count: memberCount || 0
        })
        setLoading(false)
        return
      }

      // User has no club
      setUserClub(null)
    } catch (err) {
      console.error('Error:', err)
      setError('An error occurred while loading your club.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch all active members of the club
  const fetchMembers = async (clubId: string) => {
    setMembersLoading(true)
    try {
      const { data, error } = await supabase
        .from('club_members')
        .select('id, user_id, role, status, joined_at, users (id, name, email)')
        .eq('club_id', clubId)
        .eq('status', 'active')
        .order('joined_at', { ascending: true })
      if (error) {
        console.error('Error fetching members:', error)
        setMembers([])
      } else {
        setMembers(data || [])
      }
    } catch (err) {
      console.error('Error fetching members:', err)
      setMembers([])
    } finally {
      setMembersLoading(false)
    }
  }

  // Remove a member (admin only)
  const handleRemoveMember = async (memberId: string) => {
    setRemovingMemberId(memberId)
    try {
      const { error } = await supabase
        .from('club_members')
        .update({ status: 'rejected' })
        .eq('id', memberId)
      if (error) {
        console.error('Remove error:', error);
        alert('Failed to remove member: ' + error.message);
      } else {
        fetchMembers(userClub!.id)
      }
    } catch (err) {
      alert('Failed to remove member')
    } finally {
      setRemovingMemberId(null)
    }
  }

  // Leave club (member only)
  const handleLeaveClub = async (memberId: string) => {
    setRemovingMemberId(memberId)
    try {
      const { error } = await supabase
        .from('club_members')
        .update({ status: 'rejected' })
        .eq('id', memberId)
      if (error) {
        console.error('Leave error:', error);
        alert('Failed to leave club: ' + error.message);
      } else {
        setUserClub(null)
        setMembers([])
      }
    } catch (err) {
      alert('Failed to leave club')
    } finally {
      setRemovingMemberId(null)
    }
  }

  useEffect(() => {
    fetchUserClub()
  }, [])

  // Refresh club data when page is focused (e.g., after joining from dashboard)
  useEffect(() => {
    const handleFocus = () => {
      fetchUserClub()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // Fetch members when userClub changes
  useEffect(() => {
    if (userClub) {
      fetchMembers(userClub.id)
    } else {
      setMembers([])
    }
  }, [userClub])

  // Refresh club list after creation/editing
  const handleClubCreated = () => {
    fetchUserClub()
  }

  return (
    <PageGuard pageKey="clubs">
      {/* Sidebar for desktop and mobile drawer - render at root for z-index */}
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-h-screen bg-gradient-to-br from-[#0f051d] via-[#18122b] to-[#232046] flex">
        <div className="flex-1 flex flex-col pt-20 md:py-16 relative z-10 overflow-x-auto md:pl-8">
          {/* Sidebar toggle for mobile */}
          <button
            className="md:hidden fixed top-4 left-4 z-[100] bg-fuchsia-700/80 hover:bg-fuchsia-700 text-white p-2 rounded-lg shadow-lg focus:outline-none"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            style={{ pointerEvents: 'auto' }}
          >
            <Bars3Icon className="h-7 w-7" />
          </button>
          <div className="max-w-sm sm:max-w-md md:max-w-3xl lg:max-w-4xl mx-auto w-full px-2 sm:px-4 md:px-8">
            {/* Navigation bar without profile icon */}
            <Navigation />
            <div className="w-full space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-white/10 backdrop-blur-2xl rounded-xl sm:rounded-2xl shadow-2xl border border-fuchsia-700/30 overflow-hidden p-4 sm:p-8 mt-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-[0_2px_24px_rgba(236,72,153,0.5)] tracking-tight flex items-center gap-3">
                    <FaCrown className="text-fuchsia-400" /> My Club
                  </h1>
                  <div className="flex items-center gap-2">
                    {!userClub && (
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 via-blue-600 to-purple-700 hover:from-fuchsia-500 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-bold text-base shadow-xl border-2 border-fuchsia-400/30 hover:scale-105 transition-all duration-200 drop-shadow-[0_2px_24px_rgba(236,72,153,0.5)]"
                      >
                        <FaPlus /> Create Club
                      </button>
                    )}
                    {userClub && (
                      <button
                        onClick={fetchUserClub}
                        disabled={loading}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg border border-white/20 transition-all disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                      </button>
                    )}
                  </div>
                </div>

                {/* Loading state */}
                {loading && (
                  <div className="bg-white/10 rounded-2xl p-8 shadow-lg border border-fuchsia-700/20 flex flex-col items-center justify-center min-h-[200px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-400 mb-4"></div>
                    <span className="text-fuchsia-200 text-lg font-semibold">Loading your club...</span>
                  </div>
                )}

                {/* Error state */}
                {error && !loading && (
                  <div className="bg-red-500/20 rounded-2xl p-6 shadow-lg border border-red-500/30 flex flex-col items-center justify-center min-h-[200px]">
                    <span className="text-red-300 text-lg font-semibold text-center">{error}</span>
                    <button
                      onClick={fetchUserClub}
                      className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {/* No club state */}
                {!loading && !error && !userClub && (
                  <div className="bg-white/10 rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg border border-fuchsia-700/20 flex flex-col items-center justify-center min-h-[220px] sm:min-h-[300px] text-center">
                    <FaCrown className="text-6xl text-fuchsia-400 mb-6 opacity-50" />
                    <h3 className="text-2xl font-bold text-white mb-4">No Club Yet</h3>
                    <p className="text-fuchsia-200 text-lg mb-6 max-w-md">
                      Create your own esports club to start building your team and competing in tournaments.
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 via-blue-600 to-purple-700 hover:from-fuchsia-500 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl border-2 border-fuchsia-400/30 hover:scale-105 transition-all duration-200"
                    >
                      <FaPlus /> Create Your First Club
                    </button>
                  </div>
                )}

                {/* User's club display */}
                {!loading && !error && userClub && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-lg border border-fuchsia-700/20"
                    >
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        {/* Club Logo */}
                        <div className="flex-shrink-0">
                          {userClub.logo_url ? (
                            <img
                              src={userClub.logo_url}
                              alt={`${userClub.name} logo`}
                              className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border-2 border-fuchsia-400/30 shadow-lg"
                            />
                          ) : (
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-fuchsia-600 to-purple-700 flex items-center justify-center border-2 border-fuchsia-400/30 shadow-lg">
                              <FaCrown className="text-3xl md:text-4xl text-white" />
                            </div>
                          )}
                        </div>

                        {/* Club Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-[0_2px_24px_rgba(236,72,153,0.5)]">
                                {userClub.name}
                              </h2>
                              <div className="flex items-center gap-2 text-fuchsia-300 text-sm">
                                {userClub.owner_id === user?.id ? (
                                  <>
                                    <FaCrown className="text-fuchsia-400" />
                                    <span>Club Owner</span>
                                  </>
                                ) : (
                                  <>
                                    <FaUsers className="text-fuchsia-400" />
                                    <span>Club Member</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {userClub.owner_id === user?.id && (
                                <>
                                  <button 
                                    onClick={() => setShowInviteModal(true)}
                                    className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-200 px-4 py-2 rounded-lg border border-blue-500/30 transition-all"
                                  >
                                    <FaUserPlus /> Invite
                                  </button>
                                  <button 
                                    onClick={() => setShowEditModal(true)}
                                    className="flex items-center gap-2 bg-fuchsia-700/20 hover:bg-fuchsia-700/40 text-fuchsia-200 px-4 py-2 rounded-lg border border-fuchsia-500/30 transition-all"
                                  >
                                    <FaEdit /> Edit
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {userClub.bio && (
                            <p className="text-fuchsia-200 text-base mb-4 leading-relaxed">
                              {userClub.bio}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2 text-fuchsia-300">
                              <FaUsers className="text-fuchsia-400" />
                              <span>{userClub.member_count || 0} Members</span>
                            </div>
                            <div className="flex items-center gap-2 text-fuchsia-300">
                              <FaTrophy className="text-fuchsia-400" />
                              <span>0 Tournaments</span>
                            </div>
                            <div className="flex items-center gap-2 text-fuchsia-300">
                              <span>Created {new Date(userClub.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Members List */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-lg border border-fuchsia-700/20 mt-4 sm:mt-6"
                    >
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <FaUsers className="text-fuchsia-400" /> Members
                      </h3>
                      {membersLoading ? (
                        <div className="text-fuchsia-200">Loading members...</div>
                      ) : members.length === 0 ? (
                        <div className="text-fuchsia-200">No members found.</div>
                      ) : (
                        <ul className="divide-y divide-fuchsia-700/10">
                          {members.map((member) => {
                            const userData = Array.isArray(member.users) ? member.users[0] : member.users
                            const isSelf = user?.id === member.user_id
                            const isOwner = userClub.owner_id === member.user_id
                            return (
                              <li key={member.id} className="flex items-center justify-between py-3">
                                <div>
                                  <span className="text-white font-semibold">{userData?.name || 'Unknown'}</span>
                                  <span className="ml-2 text-fuchsia-300 text-xs">{userData?.email}</span>
                                  {isOwner && <span className="ml-2 px-2 py-0.5 bg-fuchsia-700/30 text-fuchsia-200 text-xs rounded">Owner</span>}
                                </div>
                                <div>
                                  {/* Admin: Remove member (not self/owner) */}
                                  {userClub.owner_id === user?.id && !isOwner && (
                                    <button
                                      onClick={() => handleRemoveMember(member.id)}
                                      disabled={removingMemberId === member.id}
                                      className="flex items-center gap-1 bg-red-600/20 hover:bg-red-600/40 text-red-200 px-3 py-1 rounded-lg border border-red-500/30 transition-all disabled:opacity-50 text-xs"
                                    >
                                      <FaUserMinus /> {removingMemberId === member.id ? 'Removing...' : 'Remove'}
                                    </button>
                                  )}
                                  {/* Member: Leave club (self, not owner) */}
                                  {!isOwner && isSelf && (
                                    <button
                                      onClick={() => handleLeaveClub(member.id)}
                                      disabled={removingMemberId === member.id}
                                      className="flex items-center gap-1 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-200 px-3 py-1 rounded-lg border border-yellow-500/30 transition-all disabled:opacity-50 text-xs"
                                    >
                                      <FaSignOutAlt /> {removingMemberId === member.id ? 'Leaving...' : 'Leave Club'}
                                    </button>
                                  )}
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </motion.div>

                    {/* Search & Invite Section for Club Owners */}
                    {userClub.owner_id === user?.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-4 sm:mt-6"
                      >
                        <UserSearchInvite onUserSelect={() => {}} />
                      </motion.div>
                    )}
                  </>
                )}
              </motion.div>
            </div>
            {/* Modals */}
            <ClubCreateModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={handleClubCreated} />
            <ClubEditModal open={showEditModal} onClose={() => setShowEditModal(false)} onSuccess={handleClubCreated} club={userClub} />
            <ClubInviteModal open={showInviteModal} onClose={() => setShowInviteModal(false)} clubId={userClub?.id || ''} clubName={userClub?.name || ''} />
          </div>
        </div>
      </div>
    </PageGuard>
  )
} 