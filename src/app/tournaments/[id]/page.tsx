'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AppDispatch, RootState } from '@/store'
import { setSelectedTournament, setLoading, setError } from '@/store/slices/tournamentSlice'
import { setUser, logout } from '@/store/slices/authSlice'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'
import Image from 'next/image'
import BackButton from '@/components/BackButton'
import UserSearchInvite from '@/components/UserSearchInvite'
import { supabase } from '@/utils/supabaseClient'
import Link from 'next/link'

const schema = yup.object({
  teamName: yup.string().required('Team name is required'),
  leaderName: yup.string().required('Leader name is required'),
  leaderPhone: yup.string().matches(/^[0-9]{10}$/, 'Phone number must be 10 digits'),
  leaderEmail: yup.string().email('Invalid email').required('Email is required'),
  leaderGameId: yup.string().required('Game ID is required'),
  player2Name: yup.string().optional(),
  player2GameId: yup.string().required('Game ID is required'),
  player3Name: yup.string().optional(),
  player3GameId: yup.string().required('Game ID is required'),
  player4Name: yup.string().optional(),
  player4GameId: yup.string().required('Game ID is required'),
  player2UserId: yup.string().required('Please select Player 2 from registered users'),
  player3UserId: yup.string().required('Please select Player 3 from registered users'),
  player4UserId: yup.string().required('Please select Player 4 from registered users'),
}).required()

type TeamRegistrationForm = yup.InferType<typeof schema>

export default function TournamentDetails() {
  const params = useParams();
  const id = typeof params === 'object' && params !== null ? (params as any).id : params;
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedTournament, loading, error } = useSelector((state: RootState) => state.tournaments);
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [registrationType, setRegistrationType] = useState<'team' | 'club'>('team');
  const [saveForFuture, setSaveForFuture] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [tournament, setTournament] = useState<any>(null);
  const [tournamentLoading, setTournamentLoading] = useState(true);
  const [tournamentError, setTournamentError] = useState('');
  const [userClub, setUserClub] = useState<any>(null);
  const [clubLoading, setClubLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [checkingClubRegistration, setCheckingClubRegistration] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<{
    player2: { id: string; name: string; email: string } | null;
    player3: { id: string; name: string; email: string } | null;
    player4: { id: string; name: string; email: string } | null;
  }>({
    player2: null,
    player3: null,
    player4: null,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TeamRegistrationForm>({
    resolver: yupResolver(schema),
  })

  // Handler functions for player selection
  const handlePlayer2Select = (user: { id: string; name: string; email: string }) => {
    // Check for duplicate selection
    if (selectedPlayers.player3?.id === user.id || selectedPlayers.player4?.id === user.id) {
      toast.error('This player is already selected for another position');
      return;
    }
    setSelectedPlayers(prev => ({ ...prev, player2: user }));
    setValue('player2Name', user.name);
    setValue('player2UserId', user.id);
  };

  const handlePlayer3Select = (user: { id: string; name: string; email: string }) => {
    // Check for duplicate selection
    if (selectedPlayers.player2?.id === user.id || selectedPlayers.player4?.id === user.id) {
      toast.error('This player is already selected for another position');
      return;
    }
    setSelectedPlayers(prev => ({ ...prev, player3: user }));
    setValue('player3Name', user.name);
    setValue('player3UserId', user.id);
  };

  const handlePlayer4Select = (user: { id: string; name: string; email: string }) => {
    // Check for duplicate selection
    if (selectedPlayers.player2?.id === user.id || selectedPlayers.player3?.id === user.id) {
      toast.error('This player is already selected for another position');
      return;
    }
    setSelectedPlayers(prev => ({ ...prev, player4: user }));
    setValue('player4Name', user.name);
    setValue('player4UserId', user.id);
  };

  // Function to reset form and selected players
  const resetForm = () => {
    setSelectedPlayers({
      player2: null,
      player3: null,
      player4: null,
    });
    setSaveForFuture(false);
  };

  // Check auth state on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch user info from custom users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, name, phone, avatar')
          .eq('id', user.id)
          .single();
        
        console.log('User data fetch result:', { userData, userError });
        
        if (userData) {
          dispatch(setUser(userData));
          // Check if user is a club admin
          await checkUserClubAdmin(user.id);
          // Check if user is already registered
          await checkRegistrationStatus(user.id);
        } else if (userError) {
          console.error('Error fetching user data:', userError);
          // Fallback: use auth user data if database fetch fails
          dispatch(setUser({
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || 'User',
            phone: user.user_metadata?.phone || '',
            avatar: user.user_metadata?.avatar || ''
          }));
          // Still check for club admin status and registration
          await checkUserClubAdmin(user.id);
          await checkRegistrationStatus(user.id);
        }
      } else {
        dispatch(logout());
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, [dispatch]);

  // Re-check registration status when userClub changes
  useEffect(() => {
    if (user && tournament && !clubLoading) {
      checkRegistrationStatus(user.id);
    }
  }, [userClub, user, tournament, clubLoading]);

  // Debug: Log auth state changes
  useEffect(() => {
    console.log('Auth state changed - isAuthenticated:', isAuthenticated);
  }, [isAuthenticated]);

  // Debug: Log modal state changes
  useEffect(() => {
    console.log('Modal state changed - showRegistrationForm:', showRegistrationForm);
  }, [showRegistrationForm]);

  // Debug: Monitor userClub state changes
  useEffect(() => {
    console.log('userClub state changed:', userClub);
  }, [userClub]);

  // Debug: Monitor clubLoading state changes
  useEffect(() => {
    console.log('clubLoading state changed:', clubLoading);
  }, [clubLoading]);

  // Debug: Log registration status changes
  useEffect(() => {
    console.log('Registration status changed:', { isRegistered, registrationLoading, checkingClubRegistration });
  }, [isRegistered, registrationLoading, checkingClubRegistration]);

  // Helper function to check if user is actually authenticated
  const isUserAuthenticated = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  };

  useEffect(() => {
    const fetchTournamentDetails = async () => {
      setTournamentLoading(true);
      setTournamentError('');
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !data) {
        setTournamentError('Tournament not found');
        setTournament(null);
      } else {
        setTournament(data);
      }
      setTournamentLoading(false);
    };
    if (id) fetchTournamentDetails();
  }, [id]);

  const onSubmit = async (data: TeamRegistrationForm) => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setRegistering(true);
      
      // Create team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert([{
          name: data.teamName,
          owner_id: user.id,
          tournament_id: tournament.id,
          team_type: 'open',
          registration_status: 'pending',
          payment_status: 'pending'
        }])
        .select()
        .single();

      if (teamError || !teamData) {
        console.error('Team creation error:', teamError);
        toast.error('Failed to create team');
        return;
      }

      // Create team players
      const players = [
        { name: data.leaderName, email: data.leaderEmail, phone: data.leaderPhone, game_id: data.leaderGameId, position: 'captain' },
        { 
          name: selectedPlayers.player2?.name || data.player2Name || '', 
          email: selectedPlayers.player2?.email || '', 
          phone: '', 
          game_id: data.player2GameId, 
          position: 'member',
          user_id: selectedPlayers.player2?.id || null
        },
        { 
          name: selectedPlayers.player3?.name || data.player3Name || '', 
          email: selectedPlayers.player3?.email || '', 
          phone: '', 
          game_id: data.player3GameId, 
          position: 'member',
          user_id: selectedPlayers.player3?.id || null
        },
        { 
          name: selectedPlayers.player4?.name || data.player4Name || '', 
          email: selectedPlayers.player4?.email || '', 
          phone: '', 
          game_id: data.player4GameId, 
          position: 'member',
          user_id: selectedPlayers.player4?.id || null
        }
      ];

      const { error: playersError } = await supabase
        .from('team_players')
        .insert(players.map(player => ({
          team_id: teamData.id,
          player_name: player.name,
          player_email: player.email,
          player_phone: player.phone,
          game_id: player.game_id,
          player_position: player.position,
          user_id: player.user_id
        })));

      if (playersError) {
        console.error('Team players creation error:', playersError);
        toast.error('Failed to add team players');
        return;
      }

      // Create tournament registration
      const { error: registrationError } = await supabase
        .from('tournament_registrations')
        .insert([{
          tournament_id: tournament.id,
          registration_type: 'team',
          team_id: teamData.id,
          registered_by: user.id,
          registration_status: 'pending',
          payment_status: 'pending'
        }]);

      if (registrationError) {
        console.error('Tournament registration error:', registrationError);
        toast.error('Failed to register team for tournament');
        return;
      }

      // Update tournament current teams count
      await supabase
        .from('tournaments')
        .update({ current_teams: (tournament.current_teams || 0) + 1 })
        .eq('id', tournament.id);

      // Check registration status after successful registration
      if (user) {
        await checkRegistrationStatus(user.id);
      }

      setShowRegistrationForm(false);
      setRegistering(false);
      resetForm();
      toast.success('Registration successful!');
    } catch (error) {
      console.error('Registration error:', error);
      setRegistering(false);
      toast.error('Registration failed. Please try again.');
    }
  }

  const handleClubRegistration = async () => {
    if (!user || !userClub) {
      toast.error('User or club information not found');
      return;
    }

    try {
      setRegistering(true);
      
      // Create tournament registration for club
      const { error: registrationError } = await supabase
        .from('tournament_registrations')
        .insert([{
          tournament_id: tournament.id,
          registration_type: 'club',
          club_id: userClub.id,
          registered_by: user.id,
          registration_status: 'pending',
          payment_status: 'pending'
        }]);

      if (registrationError) {
        console.error('Club registration error:', registrationError);
        toast.error('Failed to register club for tournament');
        return;
      }

      toast.success(`Club ${userClub.name} registered successfully!`);
      setShowRegistrationForm(false);
      setIsRegistered(true);
      
      // Refresh tournament data to update team count
      const { data: updatedTournament } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournament.id)
        .single();
      
      if (updatedTournament) {
        setTournament(updatedTournament);
      }
    } catch (error) {
      console.error('Club registration error:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  // Check if user is a club admin
  const checkUserClubAdmin = async (userId: string) => {
    try {
      setClubLoading(true);
      console.log('Checking club admin status for user:', userId);
      
      // Check if user owns a club
      const { data: ownedClub, error: ownedClubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('owner_id', userId)
        .single();

      console.log('Owned club check:', { ownedClub, ownedClubError });

      if (ownedClub) {
        console.log('User owns club:', ownedClub.name);
        setUserClub(ownedClub);
        console.log('Setting userClub state to:', ownedClub);
        setClubLoading(false);
        return;
      }

      // Check if user is a co-leader of any club
      const { data: coLeaderClub, error: coLeaderError } = await supabase
        .from('club_members')
        .select(`
          club_id,
          clubs (*)
        `)
        .eq('user_id', userId)
        .eq('role', 'co-leader')
        .eq('status', 'active')
        .limit(1);

      console.log('Co-leader check:', { coLeaderClub, coLeaderError });

      if (coLeaderClub && coLeaderClub.length > 0) {
        const clubData = Array.isArray(coLeaderClub[0].clubs) 
          ? coLeaderClub[0].clubs[0] 
          : coLeaderClub[0].clubs;
        console.log('User is co-leader of club:', clubData?.name);
        setUserClub(clubData);
        console.log('Setting userClub state to:', clubData);
        setClubLoading(false);
        return;
      }

      // Also check if user is a member of any club (for debugging)
      const { data: memberClub, error: memberError } = await supabase
        .from('club_members')
        .select(`
          club_id,
          role,
          status,
          clubs (*)
        `)
        .eq('user_id', userId)
        .limit(5);

      console.log('All club memberships:', { memberClub, memberError });

      console.log('User is not a club admin');
      setUserClub(null);
    } catch (err) {
      console.error('Error checking user club admin status:', err);
      setUserClub(null);
    } finally {
      setClubLoading(false);
    }
  };

  // Check if user is already registered for this tournament
  const checkRegistrationStatus = async (userId: string) => {
    try {
      setRegistrationLoading(true);
      console.log('Checking registration status for user:', userId, 'tournament:', tournament.id);
      
      // Check for team registration
      const { data: teamRegistration, error: teamError } = await supabase
        .from('tournament_registrations')
        .select('*')
        .eq('tournament_id', tournament.id)
        .eq('registered_by', userId)
        .eq('registration_type', 'team')
        .single();

      console.log('Team registration check:', { teamRegistration, teamError });

      if (teamRegistration) {
        console.log('User has team registration');
        setIsRegistered(true);
        setRegistrationLoading(false);
        return;
      }

      // Check for club registration - check if user's club is already registered
      if (userClub) {
        console.log('Checking club registration for club:', userClub.id);
        setCheckingClubRegistration(true);
        const { data: clubRegistration, error: clubError } = await supabase
          .from('tournament_registrations')
          .select('*')
          .eq('tournament_id', tournament.id)
          .eq('club_id', userClub.id)
          .eq('registration_type', 'club')
          .single();

        console.log('Club registration check:', { clubRegistration, clubError });

        if (clubRegistration) {
          console.log('Club is already registered');
          setIsRegistered(true);
          setRegistrationLoading(false);
          setCheckingClubRegistration(false);
          return;
        }
        setCheckingClubRegistration(false);
      }

      console.log('No registration found');
      setIsRegistered(false);
    } catch (err) {
      console.error('Error checking registration status:', err);
      setIsRegistered(false);
    } finally {
      setRegistrationLoading(false);
      setCheckingClubRegistration(false);
    }
  };

  if (tournamentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f051d] via-[#18122b] to-[#232046]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-400 mx-auto mb-4"></div>
          <span className="text-fuchsia-200 text-lg font-semibold">Loading tournament...</span>
        </div>
      </div>
    );
  }
  if (tournamentError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f051d] via-[#18122b] to-[#232046]">
        <div className="text-center">
          <span className="text-red-400 text-lg font-semibold">{tournamentError}</span>
        </div>
      </div>
    );
  }
  if (!tournament) return null;

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-[#0f051d] via-[#18122b] to-[#232046] overflow-x-hidden">
      <BackButton />
      {/* Futuristic animated background overlays */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[40vw] bg-gradient-to-tr from-fuchsia-500/20 via-blue-500/10 to-purple-500/20 rounded-full blur-3xl opacity-60 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/3 bg-gradient-to-br from-blue-500/10 to-fuchsia-500/10 rounded-full blur-2xl opacity-40 animate-pulse" />
      </div>
      <div className="relative z-10 container mx-auto px-2 sm:px-4 py-8 md:py-16 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-fuchsia-700/30 overflow-hidden"
        >
          <div className="p-4 sm:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                {tournament.game === 'BGMI' && (
                  <Image src="/app/images/BGMI logo.webp" alt="BGMI Logo" width={36} height={36} className="inline-block rounded bg-white/10 shadow-lg" />
                )}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white drop-shadow-[0_2px_24px_rgba(236,72,153,0.5)] tracking-tight">
                  {tournament.title}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-fuchsia-300 font-semibold text-lg flex items-center gap-1">
                  {tournament.game}
                </span>
                <span className="hidden sm:inline-block text-fuchsia-400">•</span>
                <span className="bg-gradient-to-r from-green-400/80 to-blue-500/80 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md border border-white/10 uppercase tracking-wider">
                  {tournament.status}
                </span>
              </div>
            </div>
            {/* Neon divider */}
            <div className="h-1 w-24 bg-gradient-to-r from-fuchsia-500 via-blue-500 to-purple-500 rounded-full mb-8 mx-auto" />

            {/* Details & Rewards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8">
              <div className="bg-white/10 rounded-2xl p-5 shadow-lg border border-fuchsia-700/20 flex flex-col gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-fuchsia-200 mb-2">Tournament Details</h2>
                <div className="space-y-2 text-fuchsia-100 text-base">
                  <p><span className="font-semibold text-fuchsia-400">Prize Pool:</span> ₹{tournament.prize_pool ? tournament.prize_pool.toLocaleString() : 0}</p>
                  <p><span className="font-semibold text-fuchsia-400">Registration Fee:</span> ₹{tournament.registration_fee ? tournament.registration_fee : 0}</p>
                  <p><span className="font-semibold text-fuchsia-400">Start Date:</span> {tournament.start_date ? new Date(tournament.start_date).toLocaleDateString() : ''}</p>
                  <p><span className="font-semibold text-fuchsia-400">End Date:</span> {tournament.end_date ? new Date(tournament.end_date).toLocaleDateString() : ''}</p>
                  <p><span className="font-semibold text-fuchsia-400">Teams:</span> {tournament.current_teams ?? '-'} / {tournament.max_teams ?? '-'}</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-2xl p-5 shadow-lg border border-blue-700/20 flex flex-col gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-blue-200 mb-2">Prize Distribution</h2>
                <div className="space-y-2">
                  {Array.isArray(tournament.rewards) && tournament.rewards.length > 0 ? (
                    tournament.rewards.map((reward: any) => (
                      <div
                        key={reward.position}
                        className="flex justify-between items-center bg-gradient-to-r from-fuchsia-500/10 to-blue-500/10 rounded-lg px-4 py-2 mb-2"
                      >
                        <span className="text-fuchsia-100 font-semibold">Position {reward.position}</span>
                        <span className="text-yellow-300 font-bold">₹{reward.amount}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-fuchsia-200">No prize distribution info.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Rules */}
            <div className="mb-8 bg-white/10 rounded-2xl p-5 shadow-lg border border-purple-700/20">
              <h2 className="text-lg sm:text-xl font-bold text-purple-200 mb-2">Tournament Rules</h2>
              <ul className="list-disc list-inside space-y-2 text-fuchsia-100 text-base pl-4">
                {Array.isArray(tournament.rules) && tournament.rules.length > 0 ? (
                  tournament.rules.map((rule: any, index: number) => (
                    <li key={index}>{rule}</li>
                  ))
                ) : (
                  <li>No rules specified.</li>
                )}
              </ul>
            </div>

            {/* Register Button or Form */}
            <div key={`registration-${userClub?.id || 'no-club'}-${clubLoading}-${isRegistered}`}>
              {!showRegistrationForm ? (
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  {registrationLoading ? (
                    // Loading registration status
                    <div className="text-center">
                      <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto mb-2"></div>
                        <p className="text-blue-200 text-sm">
                          {checkingClubRegistration 
                            ? `Checking if ${userClub?.name} is already registered...`
                            : 'Checking registration status...'
                          }
                        </p>
                      </div>
                    </div>
                  ) : isRegistered ? (
                    // User is already registered
                    <div className="text-center">
                      <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-6">
                        <h3 className="text-green-300 font-bold text-lg mb-2">✅ Already Registered</h3>
                        <p className="text-green-200 text-sm">
                          {tournament.type === 'club' && userClub 
                            ? `Your club "${userClub.name}" has been registered for this tournament!`
                            : 'You have successfully registered for this tournament!'
                          }
                        </p>
                      </div>
                    </div>
                  ) : tournament.type === 'club' ? (
                    // Club tournament - only club admins can register
                    userClub ? (
                      <motion.button
                        onClick={async () => {
                          const { data: { user } } = await supabase.auth.getUser();
                          if (!user) {
                            router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                            return;
                          }
                          setRegistrationType('club');
                          setShowRegistrationForm(true);
                        }}
                        className="w-full md:w-auto bg-gradient-to-r from-green-600 via-blue-600 to-purple-700 hover:from-green-500 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-extrabold text-lg shadow-xl border-2 border-green-400/30 hover:scale-105 transition-all duration-200 tracking-wider drop-shadow-[0_2px_24px_rgba(34,197,94,0.5)]"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Register Club ({userClub.name})
                      </motion.button>
                    ) : (
                      <div className="text-center">
                        <p className="text-fuchsia-200 mb-2">This is a Club Tournament</p>
                        <p className="text-fuchsia-300 text-sm">Only club owners and co-leaders can register</p>
                        {!userClub && !clubLoading && (
                          <Link href="/clubs" className="text-blue-400 hover:text-blue-300 underline">
                            Create or Join a Club
                          </Link>
                        )}
                      </div>
                    )
                  ) : (
                    // Open tournament - anyone can register a team
                    <motion.button
                      onClick={async () => {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) {
                          router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                          return;
                        }
                        setRegistrationType('team');
                        setShowRegistrationForm(true);
                      }}
                      className="w-full md:w-auto bg-gradient-to-r from-fuchsia-600 via-blue-600 to-purple-700 hover:from-fuchsia-500 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-extrabold text-lg shadow-xl border-2 border-fuchsia-400/30 hover:scale-105 transition-all duration-200 tracking-wider drop-shadow-[0_2px_24px_rgba(236,72,153,0.5)]"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Register Team
                    </motion.button>
                  )}
                </div>
              ) : (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setShowRegistrationForm(false)}
                  >
                    {/* Modal */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 100,
                        damping: 15,
                        mass: 1
                      }}
                      className="relative w-full max-w-4xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#18122b]/95 to-[#232046]/95 shadow-2xl border border-fuchsia-700/30 backdrop-blur-xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Close button */}
                      <button
                        onClick={() => setShowRegistrationForm(false)}
                        className="absolute top-3 right-3 sm:top-4 sm:right-4 text-fuchsia-300 hover:text-white transition-colors p-1 z-10"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      <div className="p-4 sm:p-6 md:p-8">
                        {/* Futuristic overlay shapes */}
                        <motion.div 
                          className="absolute -top-16 -left-16 w-48 sm:w-64 h-48 sm:h-64 bg-gradient-to-br from-fuchsia-500/30 to-blue-500/20 rounded-full blur-3xl opacity-40 -z-10"
                          animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.4, 0.6, 0.4],
                          }}
                          transition={{ 
                            duration: 8,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        <motion.div 
                          className="absolute -bottom-16 -right-16 w-48 sm:w-64 h-48 sm:h-64 bg-gradient-to-tr from-blue-500/30 to-purple-500/20 rounded-full blur-2xl opacity-30 -z-10"
                          animate={{ 
                            scale: [1, 1.1, 1],
                            opacity: [0.3, 0.5, 0.3],
                          }}
                          transition={{ 
                            duration: 6,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        <motion.h2 
                          className="text-2xl sm:text-3xl font-extrabold text-white mb-6 sm:mb-8 tracking-tight text-center drop-shadow-[0_2px_24px_rgba(236,72,153,0.5)]"
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          {registrationType === 'club' ? 'Club Registration' : 'Team Registration'}
                        </motion.h2>
                        
                        {registrationType === 'club' ? (
                          // Club Registration Form
                          <div className="space-y-6">
                            <div className="bg-white/10 rounded-xl p-6 border border-green-500/30">
                              <h3 className="text-lg font-bold text-green-300 mb-4">Registering Club: {userClub?.name}</h3>
                              <div className="space-y-3 text-fuchsia-200">
                                <p><span className="font-semibold">Club Name:</span> {userClub?.name}</p>
                                <p><span className="font-semibold">Registration Fee:</span> ₹{tournament.registration_fee || 0}</p>
                                <p><span className="font-semibold">Tournament:</span> {tournament.title}</p>
                                <p><span className="font-semibold">Game:</span> {tournament.game}</p>
                              </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                              <motion.button
                                type="button"
                                onClick={() => {
                                  setShowRegistrationForm(false);
                                  resetForm();
                                }}
                                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 border border-green-500/40 rounded-lg text-green-200 hover:bg-green-900/30 font-medium transition-all text-sm sm:text-base"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Cancel
                              </motion.button>
                              <motion.button
                                onClick={handleClubRegistration}
                                disabled={registering}
                                className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 rounded-lg bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 hover:from-green-600 hover:to-blue-700 text-white font-bold text-sm sm:text-base shadow-lg transition-all border-2 border-white/10 hover:scale-105 disabled:opacity-50"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                {registering ? 'Registering...' : 'Register Club'}
                              </motion.button>
                            </div>
                          </div>
                        ) : (
                          // Team Registration Form
                          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                            <div className="space-y-4 sm:space-y-6">
                              <div className="relative">
                                <input
                                  id="teamName"
                                  type="text"
                                  {...register('teamName')}
                                  className="peer w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-fuchsia-500/30 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-all text-sm sm:text-base"
                                  placeholder="Team Name"
                                />
                                <label htmlFor="teamName" className="absolute left-3 sm:left-4 top-2 sm:top-3 text-fuchsia-200 text-xs sm:text-sm transition-all peer-placeholder-shown:top-2 sm:peer-placeholder-shown:top-3 peer-placeholder-shown:text-fuchsia-200 peer-focus:-top-5 peer-focus:text-xs peer-focus:text-fuchsia-400 bg-[#232046]/80 px-1 rounded">Team Name</label>
                                {errors.teamName && <p className="mt-1 text-xs sm:text-sm text-red-400">{errors.teamName.message}</p>}
                              </div>
                              <div className="relative">
                                <input
                                  id="leaderName"
                                  type="text"
                                  {...register('leaderName')}
                                  className="peer w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-fuchsia-500/30 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-all text-sm sm:text-base"
                                  placeholder="Leader Name"
                                />
                                <label htmlFor="leaderName" className="absolute left-3 sm:left-4 top-2 sm:top-3 text-fuchsia-200 text-xs sm:text-sm transition-all peer-placeholder-shown:top-2 sm:peer-placeholder-shown:top-3 peer-placeholder-shown:text-fuchsia-200 peer-focus:-top-5 peer-focus:text-xs peer-focus:text-fuchsia-400 bg-[#232046]/80 px-1 rounded">Leader Name</label>
                                {errors.leaderName && <p className="mt-1 text-xs sm:text-sm text-red-400">{errors.leaderName.message}</p>}
                              </div>
                              <div className="relative">
                                <input
                                  id="leaderPhone"
                                  type="tel"
                                  {...register('leaderPhone')}
                                  className="peer w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-fuchsia-500/30 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-all text-sm sm:text-base"
                                  placeholder="Leader Phone"
                                />
                                <label htmlFor="leaderPhone" className="absolute left-3 sm:left-4 top-2 sm:top-3 text-fuchsia-200 text-xs sm:text-sm transition-all peer-placeholder-shown:top-2 sm:peer-placeholder-shown:top-3 peer-placeholder-shown:text-fuchsia-200 peer-focus:-top-5 peer-focus:text-xs peer-focus:text-fuchsia-400 bg-[#232046]/80 px-1 rounded">Leader Phone</label>
                                {errors.leaderPhone && <p className="mt-1 text-xs sm:text-sm text-red-400">{errors.leaderPhone.message}</p>}
                              </div>
                              <div className="relative">
                                <input
                                  id="leaderEmail"
                                  type="email"
                                  {...register('leaderEmail')}
                                  className="peer w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-fuchsia-500/30 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-all text-sm sm:text-base"
                                  placeholder="Leader Email"
                                />
                                <label htmlFor="leaderEmail" className="absolute left-3 sm:left-4 top-2 sm:top-3 text-fuchsia-200 text-xs sm:text-sm transition-all peer-placeholder-shown:top-2 sm:peer-placeholder-shown:top-3 peer-placeholder-shown:text-fuchsia-200 peer-focus:-top-5 peer-focus:text-xs peer-focus:text-fuchsia-400 bg-[#232046]/80 px-1 rounded">Leader Email</label>
                                {errors.leaderEmail && <p className="mt-1 text-xs sm:text-sm text-red-400">{errors.leaderEmail.message}</p>}
                              </div>
                              <div className="relative">
                                <input
                                  id="leaderGameId"
                                  type="text"
                                  {...register('leaderGameId')}
                                  className="peer w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-fuchsia-500/30 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-all text-sm sm:text-base"
                                  placeholder="Leader Game ID"
                                />
                                <label htmlFor="leaderGameId" className="absolute left-3 sm:left-4 top-2 sm:top-3 text-fuchsia-200 text-xs sm:text-sm transition-all peer-placeholder-shown:top-2 sm:peer-placeholder-shown:top-3 peer-placeholder-shown:text-fuchsia-200 peer-focus:-top-5 peer-focus:text-xs peer-focus:text-fuchsia-400 bg-[#232046]/80 px-1 rounded">Leader Game ID</label>
                                {errors.leaderGameId && <p className="mt-1 text-xs sm:text-sm text-red-400">{errors.leaderGameId.message}</p>}
                              </div>
                            </div>
                            <div className="space-y-4 sm:space-y-6">
                              {/* Hidden inputs for user IDs */}
                              <input type="hidden" {...register('player2UserId')} />
                              <input type="hidden" {...register('player3UserId')} />
                              <input type="hidden" {...register('player4UserId')} />
                              
                              {/* Help text for player selection */}
                              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                                <div className="flex items-start space-x-3">
                                  <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <div>
                                    <h4 className="text-blue-300 font-semibold text-sm mb-1">Player Selection</h4>
                                    <p className="text-blue-200 text-xs">
                                      Search for registered users to add them to your team. Type at least 2 characters to start searching. 
                                      Each player can only be selected once.
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              <UserSearchInvite
                                onUserSelect={handlePlayer2Select}
                                placeholder="Search for Player 2..."
                                label="Player 2 Name"
                                className="w-full"
                              />
                              {errors.player2UserId && <p className="mt-1 text-xs sm:text-sm text-red-400">{errors.player2UserId.message}</p>}
                              
                              <div className="relative">
                                <input
                                  id="player2GameId"
                                  type="text"
                                  {...register('player2GameId')}
                                  className="peer w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-fuchsia-500/30 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-all text-sm sm:text-base"
                                  placeholder="Player 2 Game ID"
                                />
                                <label htmlFor="player2GameId" className="absolute left-3 sm:left-4 top-2 sm:top-3 text-fuchsia-200 text-xs sm:text-sm transition-all peer-placeholder-shown:top-2 sm:peer-placeholder-shown:top-3 peer-placeholder-shown:text-fuchsia-200 peer-focus:-top-5 peer-focus:text-xs peer-focus:text-fuchsia-400 bg-[#232046]/80 px-1 rounded">Player 2 Game ID</label>
                                {errors.player2GameId && <p className="mt-1 text-xs sm:text-sm text-red-400">{errors.player2GameId.message}</p>}
                              </div>
                              
                              <UserSearchInvite
                                onUserSelect={handlePlayer3Select}
                                placeholder="Search for Player 3..."
                                label="Player 3 Name"
                                className="w-full"
                              />
                              {errors.player3UserId && <p className="mt-1 text-xs sm:text-sm text-red-400">{errors.player3UserId.message}</p>}
                              
                              <div className="relative">
                                <input
                                  id="player3GameId"
                                  type="text"
                                  {...register('player3GameId')}
                                  className="peer w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-fuchsia-500/30 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-all text-sm sm:text-base"
                                  placeholder="Player 3 Game ID"
                                />
                                <label htmlFor="player3GameId" className="absolute left-3 sm:left-4 top-2 sm:top-3 text-fuchsia-200 text-xs sm:text-sm transition-all peer-placeholder-shown:top-2 sm:peer-placeholder-shown:top-3 peer-placeholder-shown:text-fuchsia-200 peer-focus:-top-5 peer-focus:text-xs peer-focus:text-fuchsia-400 bg-[#232046]/80 px-1 rounded">Player 3 Game ID</label>
                                {errors.player3GameId && <p className="mt-1 text-xs sm:text-sm text-red-400">{errors.player3GameId.message}</p>}
                              </div>
                              
                              <UserSearchInvite
                                onUserSelect={handlePlayer4Select}
                                placeholder="Search for Player 4..."
                                label="Player 4 Name"
                                className="w-full"
                              />
                              {errors.player4UserId && <p className="mt-1 text-xs sm:text-sm text-red-400">{errors.player4UserId.message}</p>}
                              
                              <div className="relative">
                                <input
                                  id="player4GameId"
                                  type="text"
                                  {...register('player4GameId')}
                                  className="peer w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-fuchsia-500/30 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 transition-all text-sm sm:text-base"
                                  placeholder="Player 4 Game ID"
                                />
                                <label htmlFor="player4GameId" className="absolute left-3 sm:left-4 top-2 sm:top-3 text-fuchsia-200 text-xs sm:text-sm transition-all peer-placeholder-shown:top-2 sm:peer-placeholder-shown:top-3 peer-placeholder-shown:text-fuchsia-200 peer-focus:-top-5 peer-focus:text-xs peer-focus:text-fuchsia-400 bg-[#232046]/80 px-1 rounded">Player 4 Game ID</label>
                                {errors.player4GameId && <p className="mt-1 text-xs sm:text-sm text-red-400">{errors.player4GameId.message}</p>}
                              </div>
                            </div>
                            <div className="flex items-center mt-4 mb-6">
                              <input
                                id="saveForFuture"
                                type="checkbox"
                                checked={saveForFuture}
                                onChange={e => setSaveForFuture(e.target.checked)}
                                className="accent-fuchsia-500 w-4 h-4 rounded focus:ring-2 focus:ring-fuchsia-400 transition-all duration-150"
                              />
                              <label htmlFor="saveForFuture" className="ml-2 text-sm sm:text-base text-fuchsia-200 select-none cursor-pointer">
                                Save for future registration
                              </label>
                            </div>
                            <div className="md:col-span-2 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-6 sm:mt-8">
                              <motion.button
                                type="button"
                                onClick={() => {
                                  setShowRegistrationForm(false);
                                  resetForm();
                                }}
                                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 border border-fuchsia-500/40 rounded-lg text-fuchsia-200 hover:bg-fuchsia-900/30 font-medium transition-all text-sm sm:text-base"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Cancel
                              </motion.button>
                              <motion.button
                                type="submit"
                                className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 rounded-lg bg-gradient-to-r from-fuchsia-500 via-blue-500 to-purple-600 hover:from-fuchsia-600 hover:to-blue-700 text-white font-bold text-sm sm:text-base shadow-lg transition-all border-2 border-white/10 hover:scale-105"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Submit Registration
                              </motion.button>
                            </div>
                          </form>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 