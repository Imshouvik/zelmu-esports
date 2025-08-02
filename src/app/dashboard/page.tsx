"use client"

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AppDispatch, RootState } from '@/store'
import { setTournaments, setLoading, setError } from '@/store/slices/tournamentSlice'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'
import DashboardSidebar from '@/components/DashboardSidebar'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/utils/supabaseClient'
import { setUser } from '@/store/slices/authSlice'
import { FaTrophy, FaUsers, FaCrown, FaGamepad, FaLink, FaArrowRight, FaBars } from 'react-icons/fa'
import Navigation from '@/components/Navigation'
import AdminNotificationBell from '@/components/AdminNotificationBell'
import NotificationBell from '@/components/NotificationBell'
import PageGuard from '@/components/PageGuard'

const schema = yup.object({
  title: yup.string().required('Title is required'),
  game: yup.string().required('Game is required'),
  startDate: yup.string().required('Start date is required'),
  endDate: yup.string().required('End date is required'),
  prizePool: yup.number().required('Prize pool is required').min(0),
  registrationFee: yup.number().required('Registration fee is required').min(0),
  maxTeams: yup.number().required('Max teams is required').min(1),
  rules: yup.array().of(yup.string()).min(1, 'At least one rule is required'),
  rewards: yup.array().of(
    yup.object({
      position: yup.number().required(),
      amount: yup.number().required(),
    })
  ),
}).required()

type TournamentForm = yup.InferType<typeof schema>

export default function DashboardPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { tournaments, loading } = useSelector((state: RootState) => state.tournaments)
  const [activeTab, setActiveTab] = useState('tournaments')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userInfo, setUserInfo] = useState<{ id: string; name: string; email: string } | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [inviteCode, setInviteCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [userClub, setUserClub] = useState<any>(null)
  const [clubLoading, setClubLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [featuredTournaments, setFeaturedTournaments] = useState<any[]>([])
  const [upcomingTournaments, setUpcomingTournaments] = useState<any[]>([])
  const [users, setUsers] = useState<{ id: string; name: string; avatar_url?: string }[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TournamentForm>({
    resolver: yupResolver(schema),
  })

  // Check if user is already a club member
  const checkUserClub = async (userId: string) => {
    if (!supabase) return;
    try {
      setClubLoading(true)
      
      // First check if user owns a club
      const { data: ownedClub, error: ownedClubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('owner_id', userId)
        .single()

      if (ownedClub) {
        setUserClub(ownedClub)
        setClubLoading(false)
        return
      }

      // If not owner, check if user is a member of any club
      const { data: memberships, error: membershipError } = await supabase
        .from('club_members')
        .select(`
          club_id,
          clubs (*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)

      if (membershipError && membershipError.code !== 'PGRST116') {
        // console.error('Error checking membership:', membershipError)
      } else if (memberships && memberships.length > 0) {
        const membership = memberships[0];
        let clubData = undefined;
        if (membership.clubs) {
          if (Array.isArray(membership.clubs)) {
            clubData = membership.clubs[0];
          } else {
            clubData = membership.clubs;
          }
        }
        if (clubData) {
          setUserClub(clubData);
          setClubLoading(false);
          return;
        }
      }

      // User has no club
      setUserClub(null)
    } catch (err) {
      // console.error('Error checking user club:', err)
      setUserClub(null)
    } finally {
      setClubLoading(false)
    }
  }

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push('/login')
      } else {
        setIsLoggedIn(true)
        // Fetch user info from custom users table
        const { data: userData } = await supabase!
          .from('users')
          .select('id, name, email')
          .eq('id', data.user.id)
          .single()
        if (userData) setUserInfo(userData)
        
        // Check if user is already a club member
        await checkUserClub(data.user.id)
        
        setUserLoading(false)
      }
      setAuthChecked(true)
    })
  }, [router])

  useEffect(() => {
    if (!supabase) return;
    const fetchDashboardTournaments = async () => {
      // Fetch featured tournaments
      const { data: featured, error: featuredError } = await supabase!
        .from('tournaments')
        .select('*')
        .eq('is_featured', true)
        .order('start_date', { ascending: true });
      if (!featuredError) setFeaturedTournaments(featured || []);
      // Fetch upcoming tournaments
      const { data: upcoming, error: upcomingError } = await supabase!
        .from('tournaments')
        .select('*')
        .eq('is_upcoming', true)
        .order('start_date', { ascending: true });
      if (!upcomingError) setUpcomingTournaments(upcoming || []);
    };
    fetchDashboardTournaments();
  }, []);

  useEffect(() => {
    // Fetch users from Supabase
    const fetchUsers = async () => {
      const { data, error } = await supabase!
        .from('users')
        .select('id, name, avatar_url')
        .limit(6);
      if (!error && data) setUsers(data);
    };
    fetchUsers();
  }, []);

  const onSubmit = async (data: TournamentForm) => {
    if (!supabase) return;
    try {
      // TODO: Replace with actual API call
      toast.success('Tournament created successfully!')
      setShowCreateForm(false)
      reset()
    } catch (error) {
      toast.error('Failed to create tournament. Please try again.')
    }
  }

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase!.auth.signOut()
    if (userInfo) {
      dispatch(setUser(userInfo))
    }
    router.push('/login')
  }

  // Handle manual invite code join
  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError('')
    setInviteSuccess('')
    
    if (!inviteCode.trim()) {
      setInviteError('Please enter an invite code.')
      return
    }

    setJoining(true)
    if (!supabase) {
      setJoining(false);
      return;
    }
    
    try {
      // Check if user is logged in
      const { data: { user }, error: userError } = await supabase!.auth.getUser()
      
      if (userError || !user) {
        setInviteError('You must be logged in to join a club.')
        setJoining(false)
        return
      }

      // Validate invite code exists
      const { data: invite, error: inviteError } = await supabase!
        .from('club_invites')
        .select('*')
        .eq('invite_code', inviteCode.trim())
        .single()

      if (inviteError) {
        if (inviteError.code === 'PGRST116') {
          setInviteError('Invalid invite code. Please check and try again.')
        } else {
          setInviteError('Failed to validate invite code.')
        }
        setJoining(false)
        return
      }

      // Check if invite is expired
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        setInviteError('This invite code has expired.')
        setJoining(false)
        return
      }

      // Get club details
      const { data: club, error: clubError } = await supabase!
        .from('clubs')
        .select('*')
        .eq('id', invite.club_id)
        .single()

      if (clubError) {
        setInviteError('Failed to load club details.')
        setJoining(false)
        return
      }

      // Check if user is already a member
      const { data: existingMember, error: memberCheckError } = await supabase!
        .from('club_members')
        .select('id')
        .eq('club_id', club.id)
        .eq('user_id', user.id)
        .single()

      if (memberCheckError && memberCheckError.code !== 'PGRST116') {
        setInviteError('Failed to check membership status.')
        setJoining(false)
        return
      }

      if (existingMember) {
        setInviteError('You are already a member of this club.')
        setJoining(false)
        return
      }

      // Check if user owns this club
      if (user.id === club.owner_id) {
        setInviteError('You cannot join your own club.')
        setJoining(false)
        return
      }

      // Add user as member
      const { error: joinError } = await supabase!
        .from('club_members')
        .insert([{
          club_id: club.id,
          user_id: user.id,
          role: 'member',
          status: 'active'
        }])

      if (joinError) {
        setInviteError(`Failed to join club: ${joinError.message}`)
        setJoining(false)
        return
      }

      setInviteSuccess(`Successfully joined ${club.name}!`)
      setInviteCode('')
      
      // Update the dashboard to show the user's club
      await checkUserClub(user.id)
      
      // Redirect to clubs page after a short delay
      setTimeout(() => {
        router.push('/clubs')
      }, 2000)
      
    } catch (err: any) {
      setInviteError(err.message || 'Failed to join club.')
    } finally {
      setJoining(false)
    }
  }

  if (!authChecked || userLoading || clubLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f051d] via-[#1a103a] to-[#0a0a23] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-400 mx-auto mb-4"></div>
          <span className="text-fuchsia-200 text-lg font-semibold">Loading...</span>
        </div>
      </div>
    )
  }
  if (!isLoggedIn) {
    return null
  }

  return (
    <PageGuard pageKey="dashboard">
      <div className="min-h-screen bg-gradient-to-br from-[#18122b] to-[#232046] flex">
        {/* Sidebar for desktop and mobile drawer */}
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {/* Mobile menu button */}
        <button
          className="fixed top-4 left-4 z-40 md:hidden bg-fuchsia-700/90 text-white p-3 rounded-full shadow-lg focus:outline-none"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar menu"
        >
          <FaBars className="w-6 h-6" />
        </button>
        {/* Main content (add left margin for desktop sidebar) */}
        <main className="flex-1 md:ml-72">
          <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
            {/* Notification Bell */}
            <div className="flex justify-end items-center mb-6 gap-4">
              {userClub && userClub.owner_id === userInfo?.id ? (
                <AdminNotificationBell clubId={userClub.id} clubName={userClub.name} />
              ) : userInfo ? (
                <NotificationBell userId={userInfo.id} />
              ) : null}
            </div>


            {/* Featured Tournament - ZBCC Season 1 */}
            <section className="mb-8">
              <div className="bg-gradient-to-r from-blue-900/90 to-purple-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl border-2 border-blue-400/50 overflow-hidden">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <Image src="/app/images/BGMI logo.webp" alt="BGMI Logo" width={60} height={60} className="rounded-lg" />
                      <div>
                        <h2 className="text-3xl font-bold text-blue-300">ZELMU BGMI CLUB Championship</h2>
                        <p className="text-xl text-blue-200">Season 1</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-yellow-400">₹50,000</div>
                      <div className="text-sm text-gray-300">Prize Pool</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">192</div>
                      <div className="text-sm text-gray-300">Teams</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">17</div>
                      <div className="text-sm text-gray-300">Matches</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">960</div>
                      <div className="text-sm text-gray-300">Players</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-300 mb-6">
                    <p><strong>Dates:</strong> August 5-15, 2025</p>
                    <p><strong>Type:</strong> Club Championship</p>
                    <p><strong>Status:</strong> <span className="text-green-400 font-semibold">Upcoming</span></p>
                  </div>
                  
                  <div className="flex gap-4">
                    <Link
                      href="/tournaments/zbcc-season1"
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold text-center transition-colors"
                    >
                      View Tournament Details
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* Join Club Section */}
            {!clubLoading && !userClub && (
              <section className="mb-8">
                <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-fuchsia-700/30 overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                      <FaLink className="text-fuchsia-400" />
                      Join a Club
                    </h2>
                    <p className="text-fuchsia-200 mb-6">
                      Have an invite code? Enter it below to join a club.
                    </p>
                    
                    <form onSubmit={handleJoinWithCode} className="space-y-4">
                      <div>
                        <label className="block text-fuchsia-200 font-semibold mb-2">Invite Code</label>
                        <input
                          type="text"
                          value={inviteCode}
                          onChange={(e) => setInviteCode(e.target.value)}
                          placeholder="Enter invite code..."
                          className="w-full px-4 py-3 rounded-lg bg-white/10 border border-fuchsia-500/30 text-white placeholder-fuchsia-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-all text-base"
                          disabled={joining}
                        />
                      </div>
                      
                      {inviteError && (
                        <div className="text-red-400 text-sm font-semibold">{inviteError}</div>
                      )}
                      
                      {inviteSuccess && (
                        <div className="text-green-400 text-sm font-semibold">{inviteSuccess}</div>
                      )}
                      
                      <button
                        type="submit"
                        disabled={joining}
                        className="w-full bg-gradient-to-r from-fuchsia-500 via-blue-500 to-purple-600 hover:from-fuchsia-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg transition-all border-2 border-white/10 hover:scale-105 disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {joining ? (
                          <>
                            <FaArrowRight className="animate-pulse" />
                            Joining...
                          </>
                        ) : (
                          <>
                            <FaArrowRight />
                            Join Club
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </section>
            )}

            {/* Current Club Section */}
            {!clubLoading && userClub && (
              <section className="mb-8">
                <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-fuchsia-700/30 overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                      <FaCrown className="text-fuchsia-400" />
                      Your Club
                    </h2>
                    <div className="flex items-center gap-4">
                      {userClub.logo_url ? (
                        <img
                          src={userClub.logo_url}
                          alt={`${userClub.name} logo`}
                          className="w-16 h-16 rounded-xl object-cover border-2 border-fuchsia-400/30 shadow-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-fuchsia-600 to-purple-700 flex items-center justify-center border-2 border-fuchsia-400/30 shadow-lg">
                          <FaCrown className="text-xl text-white" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-white">{userClub.name}</h3>
                        <p className="text-fuchsia-200 text-sm">
                          {userClub.owner_id === userInfo?.id ? 'Club Owner' : 'Club Member'}
                        </p>
                      </div>
                      <button
                        onClick={() => router.push('/clubs')}
                        className="ml-auto bg-fuchsia-600/20 hover:bg-fuchsia-600/40 text-fuchsia-200 px-4 py-2 rounded-lg border border-fuchsia-500/30 transition-all"
                      >
                        View Club
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Featured Tournaments */}
            <section className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Featured Tournaments</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredTournaments.length === 0 ? (
                  <div className="text-fuchsia-200 col-span-full">No featured tournaments at the moment.</div>
                ) : featuredTournaments.map((t) => (
                  <div key={t.id} className="relative bg-white/10 border border-fuchsia-500/30 rounded-2xl shadow-xl overflow-hidden backdrop-blur-lg p-6 group transition-all duration-300 hover:border-fuchsia-500 hover:shadow-fuchsia-500/30">
                    {t.img ? (
                      <img src={t.img} alt={t.game} className="w-full h-32 object-cover rounded-xl mb-4" />
                    ) : (
                      <div className="w-full h-32 bg-fuchsia-900/20 rounded-xl mb-4 flex items-center justify-center">
                        <FaTrophy className="text-4xl text-fuchsia-400" />
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-white mb-2">{t.title}</h3>
                    <div className="flex items-center gap-2 text-fuchsia-200 mb-2 text-sm">
                      <span>{t.start_date ? new Date(t.start_date).toLocaleDateString() : ''}</span>
                      <span>•</span>
                      <div className="flex items-center gap-2">
                        {t.game === 'BGMI' && (
                          <Image src="/app/images/BGMI logo.webp" alt="BGMI Logo" width={24} height={24} className="inline-block rounded bg-white/10" />
                        )}
                        <span>{t.game}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="bg-yellow-400/20 text-yellow-300 px-3 py-1 rounded-full text-xs font-bold">Prize: ₹{t.prize_pool?.toLocaleString?.() ?? t.prize_pool}</span>
                      <span className="bg-fuchsia-900/40 text-fuchsia-200 px-3 py-1 rounded-full text-xs font-bold">{t.max_teams ? `${t.max_teams} Teams` : ''}</span>
                    </div>
                    <Link href={`/tournaments/${t.id}`} legacyBehavior>
                      <a className="w-full block bg-gradient-to-r from-fuchsia-500 via-blue-500 to-purple-600 hover:from-fuchsia-600 hover:to-blue-700 text-white px-4 py-2 rounded-full font-semibold shadow-lg transition-all duration-300 border-2 border-white/10 hover:scale-105 text-center">
                        Join Tournament
                      </a>
                    </Link>
                    <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-gradient-to-br from-fuchsia-500 to-blue-500 rounded-full blur-2xl opacity-30 group-hover:opacity-60 transition-all duration-300" />
                  </div>
                ))}
              </div>
            </section>
            {/* Upcoming Section */}
            <section>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Upcoming</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {upcomingTournaments.length === 0 ? (
                  <div className="text-fuchsia-200 col-span-full">No upcoming tournaments at the moment.</div>
                ) : upcomingTournaments.map((t) => (
                  <div key={t.id} className="relative bg-white/10 border border-fuchsia-500/30 rounded-2xl shadow-xl overflow-hidden backdrop-blur-lg p-6 group transition-all duration-300 hover:border-fuchsia-500 hover:shadow-fuchsia-500/30">
                    {t.img ? (
                      <img src={t.img} alt={t.game} className="w-full h-32 object-cover rounded-xl mb-4" />
                    ) : (
                      <div className="w-full h-32 bg-fuchsia-900/20 rounded-xl mb-4 flex items-center justify-center">
                        <FaTrophy className="text-4xl text-fuchsia-400" />
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-white mb-2">{t.title}</h3>
                    <div className="flex items-center gap-2 text-fuchsia-200 mb-2 text-sm">
                      <span>{t.start_date ? new Date(t.start_date).toLocaleDateString() : ''}</span>
                      <span>•</span>
                      <div className="flex items-center gap-2">
                        {t.game === 'BGMI' && (
                          <Image src="/app/images/BGMI logo.webp" alt="BGMI Logo" width={24} height={24} className="inline-block rounded bg-white/10" />
                        )}
                        <span>{t.game}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="bg-yellow-400/20 text-yellow-300 px-3 py-1 rounded-full text-xs font-bold">Prize: ₹{t.prize_pool?.toLocaleString?.() ?? t.prize_pool}</span>
                      <span className="bg-fuchsia-900/40 text-fuchsia-200 px-3 py-1 rounded-full text-xs font-bold">{t.max_teams ? `${t.max_teams} Teams` : ''}</span>
                    </div>
                    <Link href={`/tournaments/${t.id}`} legacyBehavior>
                      <a className="w-full block bg-gradient-to-r from-fuchsia-500 via-blue-500 to-purple-600 hover:from-fuchsia-600 hover:to-blue-700 text-white px-4 py-2 rounded-full font-semibold shadow-lg transition-all duration-300 border-2 border-white/10 hover:scale-105 text-center">
                        Join Tournament
                      </a>
                    </Link>
                    <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-gradient-to-br from-fuchsia-500 to-blue-500 rounded-full blur-2xl opacity-30 group-hover:opacity-60 transition-all duration-300" />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </PageGuard>
  )
} 