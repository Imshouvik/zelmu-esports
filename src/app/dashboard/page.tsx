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
import { FaTrophy, FaUsers, FaCrown, FaGamepad, FaLink, FaArrowRight, FaBars, FaClock } from 'react-icons/fa'
import Navigation from '@/components/Navigation'
import AdminNotificationBell from '@/components/AdminNotificationBell'
import NotificationBell from '@/components/NotificationBell'
import PageGuard from '@/components/PageGuard'
import MusicControl from '@/components/MusicControl'
import { useAudio } from '@/contexts/AudioContext'

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
  const [isMobile, setIsMobile] = useState(false);
  const { isMusicPlaying, isAudioMuted, audioLoaded, isFirstLoad, cacheStatus } = useAudio();

  // Enhanced confetti effect on page load - INSTANT START
  useEffect(() => {
    const createConfetti = () => {
      const confettiContainer = document.querySelector('.confetti-container');
      if (!confettiContainer) return;

      // Create elegant amount of confetti particles
      for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.animationDelay = '0s'; // NO DELAY - confetti starts immediately
        confetti.style.animationDuration = (Math.random() * 4 + 3) + 's'; // Professional speed (3-7 seconds) - elegant and natural
        confetti.style.background = `linear-gradient(45deg, 
          ${['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#a8e6cf', '#dcedc1'][Math.floor(Math.random() * 8)]}, 
          ${['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#a8e6cf', '#dcedc1'][Math.floor(Math.random() * 8)]}
        )`;
        confettiContainer.appendChild(confetti);

        // Remove confetti after animation
        setTimeout(() => {
          if (confetti.parentNode) {
            confetti.parentNode.removeChild(confetti);
          }
        }, 8000); // Professional cleanup time to match elegant animation
      }
    };

    // Try to create confetti immediately
    createConfetti();
    
    // If DOM isn't ready yet, try again after a short delay
    const immediateRetry = setTimeout(createConfetti, 100);
    
    // Create additional confetti every 6 seconds for continuous effect
    const confettiInterval = setInterval(createConfetti, 6000);
    
    return () => {
      clearTimeout(immediateRetry);
      clearInterval(confettiInterval);
    };
  }, []);

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

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);



  // Simulate user interactions to enable audio autoplay
 

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
    <div className="min-h-screen bg-gradient-to-br from-[#18122b] to-[#232046] flex overflow-x-hidden">
        {/* Sidebar for desktop and mobile drawer */}
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {/* Mobile menu button */}
        <button
          className="fixed top-4 left-4 z-40 md:hidden text-white p-4 focus:outline-none"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar menu"
        >
          <FaBars className="w-7 h-7" />
        </button>
        
        {/* Mobile notification bell */}
        <div className="fixed top-4 right-4 z-40 md:hidden p-4">
          {userClub && userClub.owner_id === userInfo?.id ? (
            <div className="w-7 h-7">
              <AdminNotificationBell clubId={userClub.id} clubName={userClub.name} />
            </div>
          ) : userInfo ? (
            <div className="w-7 h-7">
              <NotificationBell userId={userInfo.id} />
            </div>
          ) : null}
        </div>
        
        {/* Mobile Z-logo, Bar, and Music Control - Centered Group */}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 md:hidden flex items-center gap-4">
          <img 
            src="/app/images/Z-logo.png" 
            alt="ZELMU Logo" 
            className="w-14 h-14 object-contain ml-4"
          />
          <div className="w-px h-8 bg-white/50"></div>
          <MusicControl />
        </div>

        {/* Background Music Player - Desktop Only */}
        <div className="hidden md:block fixed top-6 left-6 z-50">
          <MusicControl />
        </div>
        {/* Main content (add left margin for desktop sidebar) */}
        <main className="flex-1 md:ml-72 overflow-x-hidden">
          <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 w-full min-w-0 pt-24 md:pt-8">

            
            {/* Notification Bell - Desktop Only */}
            <div className="hidden md:flex justify-end items-center mb-6 gap-4 pt-4">
              {userClub && userClub.owner_id === userInfo?.id ? (
                <AdminNotificationBell clubId={userClub.id} clubName={userClub.name} />
              ) : userInfo ? (
                <NotificationBell userId={userInfo.id} />
              ) : null}
            </div>

            {/* ZELMU BGMI CLUB Championship Finals */}
            <section className="mb-8">
              <div className="bg-gradient-to-br from-[#0f051d] via-[#1a103a] to-[#0a0a23] backdrop-blur-2xl rounded-3xl shadow-2xl border border-purple-500/30 overflow-hidden relative">
                {/* Enhanced Confetti Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="confetti-container"></div>
                </div>
                
                <div className="p-8 relative z-10">
                  {/* Thank You Message */}
                  <div className="text-center mb-8">
                    <p className="text-lg text-pink-200 font-semibold">
                      💖 Thank you to all players, teams, and fans for making Season 1 legendary! See you in Season 2 🚀
                    </p>
                  </div>

                  {/* Championship Title */}
                  <div className="text-center mb-8">
                    {/* Mobile Layout - Stacked */}
                    <div className="block lg:hidden">
                      <div className="mb-4">
                        <Image 
                          src="/app/images/BGMI logo.webp" 
                          alt="BGMI Logo" 
                          width={80} 
                          height={80} 
                          className="w-20 h-20 mx-auto rounded-xl shadow-lg" 
                        />
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                        ZELMU BGMI CLUB<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                          Championship Finals
                        </span>
                      </h1>
                    </div>
                    
                    {/* Desktop Layout - Side by Side */}
                    <div className="hidden lg:flex items-center justify-center gap-6 mb-4">
                      <Image 
                        src="/app/images/BGMI logo.webp" 
                        alt="BGMI Logo" 
                        width={96} 
                        height={96} 
                        className="w-24 h-24 rounded-xl shadow-lg" 
                      />
                      <h1 className="text-6xl font-bold text-white">
                        ZELMU BGMI CLUB Championship Finals
                      </h1>
                    </div>
                  </div>

                  {/* Tournament Completion Status */}
                  <div className="text-center mb-8">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-400 mb-4">
                      🏆 TOURNAMENT COMPLETED! 🏆
                    </h2>
                    <div className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-white mb-4 font-mono">
                      
                    </div>
                    <p className="text-lg sm:text-xl text-gray-300 mb-2">
                      15th August 10 PM - Tournament Finished
                    </p>
                    <p className="text-sm sm:text-lg text-gray-400 px-2 sm:px-0">
                      An epic battle completed — thank you to all <span className="text-yellow-400 font-bold">192 teams</span> & <span className="text-green-400 font-bold">960 players</span>!
                    </p>
                  </div>

                  {/* Winner Announcement */}
                  <div className="text-center mb-8">
                    <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 p-6 rounded-2xl shadow-2xl border-4 border-yellow-300">
                      <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-4">
                        🥇 CHAMPION ANNOUNCED! 🥇
                      </h3>
                      <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black mb-2">
                        🏆 AKRA CLUB 🏆
                      </div>
                      <p className="text-lg sm:text-xl text-black font-semibold">
                        Congratulations to the Season 1 Champions!
                      </p>
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <span className="text-2xl">👑</span>
                        <span className="text-xl text-black font-bold">Season 1 Winners</span>
                        <span className="text-2xl">👑</span>
                      </div>
                    </div>
                  </div>

                  {/* Scrolling Finalist Marquee */}
                  <div className="mb-8">
                    <div className="relative overflow-hidden bg-black/20 rounded-lg">
                      <div className="flex items-center justify-center py-3">
                        <div className="marquee-container">
                          <div className="marquee-content-slow text-lg text-white font-bold whitespace-nowrap">
                            🥇 Congratulations Finalists: 🏆 Nabarun Songho • 🏆 Tarun Sangha Club • 🏆 Kamarthuba Pragati Sangha (K.P.S) • 🏆 Birnagar Sporting Club • 🏆 Banamalipur Five Star Club • 🏆 Baghogra Association • 🏆 Sweet Club • 🏆 Murarai Amra Kojon Club • 🏆 Arit Club • 🏆 Subhas Sangha Club • 🏆 Ranaghat Club Ten Star • 🏆 Ghoshpur Cultural Association • 🏆 Deshbondhu Park • 🏆 Surya Sangha • 🏆 Team Goregaon • 🏆 Kalyangarh Ramkrishna Seba Samity • 🏆 Navi Mumbai Kings • 🏆 Borivali Group • 🏆 Akra Club • 🏆 Dinobondhu Club • 🏆 Yuva Kalyan Samiti • 🏆 Ajmer Warriors • 🏆 Sirsa United • 🏆 Baliadanga Vidyasagar Club • 🏆 BIRBHUM United 🥇
                          </div>
                          <div className="marquee-content-slow text-lg text-white font-bold whitespace-nowrap" aria-hidden="true">
                            🥇 Congratulations Finalists: 🏆 Nabarun Songho • 🏆 Tarun Sangha Club • 🏆 Kamarthuba Pragati Sangha (K.P.S) • 🏆 Birnagar Sporting Club • 🏆 Banamalipur Five Star Club • 🏆 Baghogra Association • 🏆 Sweet Club • 🏆 Murarai Amra Kojon Club • 🏆 Arit Club • 🏆 Subhas Sangha Club • 🏆 Ranaghat Club Ten Star • 🏆 Ghoshpur Cultural Association • 🏆 Deshbondhu Park • 🏆 Surya Sangha • 🏆 Team Goregaon • 🏆 Kalyangarh Ramkrishna Seba Samity • 🏆 Navi Mumbai Kings • 🏆 Borivali Group • 🏆 Akra Club • 🏆 Dinobondhu Club • 🏆 Yuva Kalyan Samiti • 🏆 Ajmer Warriors • 🏆 Sirsa United • 🏆 Baliadanga Vidyasagar Club • 🏆 BIRBHUM United 🥇
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Journey to the Finals */}
                  <div className="text-center mb-8">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">JOURNEY TO THE FINALS</h3>
                    <div className="relative">
                      {/* Progress Line - Much shorter on mobile for perfect alignment */}
                      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-full max-w-[280px] sm:max-w-md h-0.5 bg-gradient-to-r from-green-500 via-purple-500 to-orange-500"></div>
                      
                      {/* Stages - Same layout for all devices */}
                      <div className="relative flex items-center justify-center space-x-4 lg:space-x-8">
                        {['START', 'GROUP STAGES', 'QUARTER-FINALS', 'SEMI-FINALS', 'FINALE'].map((stage, index) => (
                          <div key={index} className="flex flex-col items-center relative z-10" style={
                            index === 0 && isMobile ? { bottom: '7px', left: '-15px' } : 
                            index === 4 && isMobile ? { bottom: '7px', left: '15px' } : 
                            {}
                          }>
                            {/* Stage Dot - Custom positioning for START dot on mobile */}
                            <div className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                              index === 4 
                                ? 'bg-green-500 border-green-400 shadow-lg shadow-green-500/50 animate-pulse -top-1 sm:top-0' 
                                : index === 0
                                ? 'bg-green-500 border-green-400 shadow-lg shadow-green-500/30 -top-1 sm:top-0'
                                : 'bg-green-500 border-green-400 shadow-lg shadow-green-500/30'
                            }`}></div>
                            
                            {/* Stage Label - Smaller font on mobile */}
                            <span className={`text-xs sm:text-sm mt-2 font-medium text-center ${
                              index === 4 
                                ? 'text-green-400 font-bold' 
                                : 'text-gray-300'
                            }`}>{stage}</span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Progress Indicator - Same for all devices */}
                      <div className="mt-8 text-center">
                        <Link 
                          href="/tournaments/zbcc-season1" 
                          onClick={(e) => {
                            // Start audio when user clicks View Tournament Details
                            if (typeof window !== 'undefined' && (window as any).startAudioFromDashboard) {
                              (window as any).startAudioFromDashboard();
                              
                              // Add a small delay to ensure audio starts before navigation
                              setTimeout(() => {
                                // Audio start delay completed
                              }, 100);
                            }
                          }}
                          className="group relative inline-flex items-center justify-center bg-gradient-to-r from-orange-600 via-white to-green-600 hover:from-orange-700 hover:via-gray-100 hover:to-green-700 text-gray-800 px-4 py-2 rounded-full font-medium shadow-md transition-all duration-500 hover:scale-105 border border-orange-400/30 overflow-hidden"
                        >
                          {/* Premium glossy shine effect - continuous animation */}
                          <div className="absolute inset-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/80 to-transparent transform -skew-x-12 animate-shine"></div>
                          {/* Button content */}
                          <span className="relative z-10 text-xs font-medium">View Tournament Details</span>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Section */}
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    
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
  )
} 