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
import { utcIsoToIstDisplay } from '@/utils/timezone';

function formatDateTime(raw: string) {
  const clean = raw.replace('T', ' ').slice(0, 16);
  const [date, time] = clean.split(' ');
  const [year, month, day] = date.split('-');
  let [hour, minute] = time.split(':');
  let ampm = 'AM';
  let hourNum = parseInt(hour, 10);
  if (hourNum >= 12) {
    ampm = 'PM';
    if (hourNum > 12) hourNum -= 12;
  }
  if (hourNum === 0) hourNum = 12;
  return `${day}/${month}/${year}, ${hourNum}:${minute} ${ampm}`;
}

const schema = yup.object({
  teamName: yup.string().required('Team name is required'),
  leaderName: yup.string().required('Leader name is required'),
  leaderPhone: yup.string().matches(/^\+\d{10,15}$/, 'Phone number must include country code and be 10-15 digits.'),
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
  leaderUserId: yup.string().optional(),
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
    leader: { id: string; name: string; email: string; phone?: string } | null;
    player2: { id: string; name: string; email: string; phone?: string } | null;
    player3: { id: string; name: string; email: string; phone?: string } | null;
    player4: { id: string; name: string; email: string; phone?: string } | null;
  }>({
    leader: null,
    player2: null,
    player3: null,
    player4: null,
  });
  const [groups, setGroups] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [userMatches, setUserMatches] = useState<any[]>([]);
  const [matchCredentials, setMatchCredentials] = useState<{ [matchId: string]: any }>({});
  const [matchesLoading, setMatchesLoading] = useState(false);
  // Add a state to store the user's registered group
  const [userGroup, setUserGroup] = useState<any>(null);

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
  const handlePlayer2Select = (user: { id: string; name: string; email: string; phone?: string }) => {
    // Check for duplicate selection
    if (selectedPlayers.player3?.id === user.id || selectedPlayers.player4?.id === user.id) {
      toast.error('This player is already selected for another position');
      return;
    }
    setSelectedPlayers(prev => ({ ...prev, player2: user }));
    setValue('player2Name', user.name);
    setValue('player2UserId', user.id);
  };

  const handlePlayer3Select = (user: { id: string; name: string; email: string; phone?: string }) => {
    // Check for duplicate selection
    if (selectedPlayers.player2?.id === user.id || selectedPlayers.player4?.id === user.id) {
      toast.error('This player is already selected for another position');
      return;
    }
    setSelectedPlayers(prev => ({ ...prev, player3: user }));
    setValue('player3Name', user.name);
    setValue('player3UserId', user.id);
  };

  const handlePlayer4Select = (user: { id: string; name: string; email: string; phone?: string }) => {
    // Check for duplicate selection
    if (selectedPlayers.player2?.id === user.id || selectedPlayers.player3?.id === user.id) {
      toast.error('This player is already selected for another position');
      return;
    }
    setSelectedPlayers(prev => ({ ...prev, player4: user }));
    setValue('player4Name', user.name);
    setValue('player4UserId', user.id);
  };

  const handleLeaderSelect = (user: { id: string; name: string; email: string; phone?: string }) => {
    // Check for duplicate selection
    if (
      selectedPlayers.player2?.id === user.id ||
      selectedPlayers.player3?.id === user.id ||
      selectedPlayers.player4?.id === user.id
    ) {
      toast.error('This player is already selected for another position');
      return;
    }
    setSelectedPlayers(prev => ({ ...prev, leader: user }));
    setValue('leaderName', user.name);
    setValue('leaderEmail', user.email);
    setValue('leaderPhone', user.phone || '');
    setValue('leaderUserId', user.id);
  };

  // Function to reset form and selected players
  const resetForm = () => {
    setSelectedPlayers({
      leader: null,
      player2: null,
      player3: null,
      player4: null,
    });
    setSaveForFuture(false);
  };

  // Check auth state on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase!.auth.getUser();
      if (user) {
        // Fetch user info from custom users table
        const { data: userData, error: userError } = await supabase!
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
    const { data: { user } } = await supabase!.auth.getUser();
    return !!user;
  };

  useEffect(() => {
    const fetchTournamentDetails = async () => {
      setTournamentLoading(true);
      setTournamentError('');
      const { data, error } = await supabase!
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

  // Fetch groups and stages for the current tournament
  useEffect(() => {
    const fetchGroupsAndStages = async () => {
      setGroupsLoading(true);
      try {
        const { data: { session } } = await supabase!.auth.getSession();
        const accessToken = session?.access_token;
        // Fetch all groups for this tournament
        const resGroups = await fetch(`/api/groups?tournament_id=${id}`, {
          headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
        });
        const dataGroups = await resGroups.json();
        if (Array.isArray(dataGroups)) setGroups(dataGroups);
        else setGroups([]);
        // Fetch all stages for this tournament
        const resStages = await fetch(`/api/tournament-stages?tournament_id=${id}`, {
          headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
        });
        const dataStages = await resStages.json();
        if (Array.isArray(dataStages)) setStages(dataStages);
        else setStages([]);
      } catch {
        setGroups([]);
        setStages([]);
      } finally {
        setGroupsLoading(false);
      }
    };
    if (id) fetchGroupsAndStages();
  }, [id]);

  const onSubmit = async (data: TeamRegistrationForm) => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }
    if (!selectedGroupId) {
      toast.error('Please select a group/time slot.');
      return;
    }
    // Check if group is full
    const group = groups.find(g => g.id === selectedGroupId);
    if (!group) {
      toast.error('Selected group not found.');
      return;
    }
    if (group.current_teams >= group.max_teams) {
      toast.error('Selected group is full. Please choose another group.');
      return;
    }
    try {
      setRegistering(true);
      
      // Create team
      const { data: teamData, error: teamError } = await supabase!
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
        { name: data.leaderName, email: data.leaderEmail, phone: data.leaderPhone, game_id: data.leaderGameId, position: 'captain', user_id: selectedPlayers.leader?.id || data.leaderUserId || null },
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
      // Only insert players with required fields
      const validPlayers = players
        .filter(p => p.name && p.game_id)
        .map((player, idx) => ({
          team_id: teamData.id,
          player_name: player.name,
          player_email: player.email,
          player_phone: player.phone,
          game_id: player.game_id,
          player_position: player.position,
          user_id: player.user_id,
          player_index: idx
        }));
      const { error: playersError } = await supabase!
        .from('team_players')
        .insert(validPlayers);

      if (playersError) {
        console.error('Team players creation error:', playersError);
        toast.error('Failed to add team players');
        return;
      }

      // Create tournament registration with group_id
      const { error: registrationError } = await supabase!
        .from('tournament_registrations')
        .insert([{
          tournament_id: tournament.id,
          registration_type: 'team',
          team_id: teamData.id,
          registered_by: user.id,
          registration_status: 'pending',
          payment_status: 'pending',
          group_id: selectedGroupId,
        }]);

      if (registrationError) {
        console.error('Tournament registration error:', registrationError);
        toast.error('Failed to register team for tournament');
        return;
      }

      // Increment current_teams for the group
      await supabase!
        .from('groups')
        .update({ current_teams: group.current_teams + 1 })
        .eq('id', selectedGroupId);

      // Update tournament current teams count
      await supabase!
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
      setSelectedGroupId("");
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
      const { error: registrationError } = await supabase!
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
      const { data: updatedTournament } = await supabase!
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
      const { data: ownedClub, error: ownedClubError } = await supabase!
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
      const { data: coLeaderClub, error: coLeaderError } = await supabase!
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
      const { data: memberClub, error: memberError } = await supabase!
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
      const { data: teamRegistration, error: teamError } = await supabase!
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
        const { data: clubRegistration, error: clubError } = await supabase!
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

  // Fetch matches for the user's group after registration is confirmed
  useEffect(() => {
    const fetchUserMatches = async () => {
      if (!isRegistered || !user || !tournament) return;
      setMatchesLoading(true);
      // Find the user's group registration
      const { data: reg } = await supabase
        .from('tournament_registrations')
        .select('group_id')
        .eq('tournament_id', tournament.id)
        .eq('registered_by', user.id)
        .eq('registration_status', 'approved')
        .single();
      if (!reg || !reg.group_id) {
        setUserMatches([]);
        setUserGroup(null);
        setMatchesLoading(false);
        return;
      }
      // Find the group object
      const groupObj = groups.find(g => g.id === reg.group_id);
      setUserGroup(groupObj);
      // Fetch matches for this group
      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .eq('group_id', reg.group_id)
        .order('scheduled_at', { ascending: true });
      setUserMatches(matches || []);
      setMatchesLoading(false);
      // Fetch credentials for each match
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (matches && accessToken) {
        for (const match of matches) {
          fetch(`/api/match-credentials/${match.id}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          })
            .then(res => res.json())
            .then(data => setMatchCredentials(prev => ({ ...prev, [match.id]: data })));
        }
      }
    };
    fetchUserMatches();
  }, [isRegistered, user, tournament]);

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
                          const { data: { user } } = await supabase!.auth.getUser();
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
                        const { data: { user } } = await supabase!.auth.getUser();
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
                      className="relative w-full max-w-4xl max-h-[calc(100vh-2rem)] min-h-[400px] overflow-y-scroll rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#18122b]/95 to-[#232046]/95 shadow-2xl border border-fuchsia-700/30 backdrop-blur-xl"
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
                                <label htmlFor="teamName" className="inline-block mb-1 px-3 py-1 rounded-full border border-fuchsia-500 bg-[#232046]/80 text-fuchsia-200 text-xs font-semibold">Team Name</label>
                                <input
                                  id="teamName"
                                  type="text"
                                  {...register('teamName')}
                                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-fuchsia-500/30 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 transition-all text-base shadow-inner backdrop-blur-md"
                                  placeholder="Enter team name"
                                  required
                                />
                                {errors.teamName && <p className="mt-1 text-xs sm:text-sm text-red-400">{errors.teamName.message}</p>}
                              </div>
                              <div className="relative mt-4">
                                <UserSearchInvite
                                  onUserSelect={handleLeaderSelect}
                                  placeholder="Search for Leader..."
                                  label="Leader Name"
                                  className="w-full"
                                />
                                {errors.leaderUserId && <p className="mt-1 text-xs sm:text-sm text-red-400">{errors.leaderUserId.message}</p>}
                              </div>
                              <div className="relative mt-4">
                                <label htmlFor="leaderName" className="inline-block mb-1 px-3 py-1 rounded-full border border-fuchsia-500 bg-[#232046]/80 text-fuchsia-200 text-xs font-semibold">Leader Name</label>
                                <input
                                  id="leaderName"
                                  type="text"
                                  {...register('leaderName')}
                                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-fuchsia-500/30 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 transition-all text-base shadow-inner backdrop-blur-md"
                                  placeholder="Leader name will be auto-filled"
                                  value={watch('leaderName')}
                                  readOnly
                                  tabIndex={-1}
                                />
                              </div>
                              <div className="relative mt-4">
                                <label htmlFor="leaderEmail" className="inline-block mb-1 px-3 py-1 rounded-full border border-fuchsia-500 bg-[#232046]/80 text-fuchsia-200 text-xs font-semibold">Leader Email</label>
                                <input
                                  id="leaderEmail"
                                  type="email"
                                  {...register('leaderEmail')}
                                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-fuchsia-500/30 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 transition-all text-base shadow-inner backdrop-blur-md"
                                  placeholder="Leader email will be auto-filled"
                                  value={watch('leaderEmail')}
                                  readOnly
                                  tabIndex={-1}
                                />
                              </div>
                              <div className="relative mt-4">
                                <label htmlFor="leaderPhone" className="inline-block mb-1 px-3 py-1 rounded-full border border-fuchsia-500 bg-[#232046]/80 text-fuchsia-200 text-xs font-semibold">Leader Phone</label>
                                <input
                                  id="leaderPhone"
                                  type="tel"
                                  {...register('leaderPhone')}
                                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-fuchsia-500/30 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 transition-all text-base shadow-inner backdrop-blur-md"
                                  placeholder="Leader phone will be auto-filled if available"
                                  value={watch('leaderPhone')}
                                  readOnly={!!watch('leaderPhone')}
                                />
                                {errors.leaderPhone && <p className="mt-1 text-xs sm:text-sm text-red-400">{errors.leaderPhone.message}</p>}
                              </div>
                              <div className="relative">
                                <label htmlFor="leaderGameId" className="inline-block mb-1 px-3 py-1 rounded-full border border-fuchsia-500 bg-[#232046]/80 text-fuchsia-200 text-xs font-semibold">Leader Game ID</label>
                                <input
                                  id="leaderGameId"
                                  type="text"
                                  {...register('leaderGameId')}
                                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-fuchsia-500/30 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 transition-all text-base shadow-inner backdrop-blur-md"
                                  placeholder="Enter leader game ID"
                                  required
                                />
                                {errors.leaderGameId && <p className="mt-1 text-xs sm:text-sm text-red-400">{errors.leaderGameId.message}</p>}
                              </div>
                            </div>
                            <div className="space-y-4 sm:space-y-6">
                              {/* Hidden inputs for user IDs */}
                              <input type="hidden" {...register('player2UserId')} />
                              <input type="hidden" {...register('player3UserId')} />
                              <input type="hidden" {...register('player4UserId')} />
                              <input type="hidden" {...register('leaderUserId')} />
                              
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
                              
                              {groupsLoading ? (
                                <div className="text-fuchsia-200">Loading groups...</div>
                              ) : groups.filter(g => g.registration_open).length > 0 ? (
                                <div className="mb-4">
                                  <label className="block text-fuchsia-200 text-sm mb-1">Select Group / Date & Time</label>
                                  <div className="space-y-2">
                                    {groups.filter(g => g.registration_open).map(group => (
                                      <label key={group.id} className={`flex items-center gap-2 p-2 rounded-lg border ${group.current_teams >= group.max_teams ? 'border-gray-500 bg-gray-800/40 text-gray-400' : 'border-fuchsia-500/30 bg-white/10 text-white'}`}>
                                        <input
                                          type="radio"
                                          name="group"
                                          value={group.id}
                                          checked={selectedGroupId === group.id}
                                          onChange={() => setSelectedGroupId(group.id)}
                                          disabled={group.current_teams >= group.max_teams}
                                          className="accent-fuchsia-500"
                                        />
                                        <span className="font-semibold">{group.name}</span>
                                        <span className="ml-2 text-xs">{group.scheduled_at ? utcIsoToIstDisplay(group.scheduled_at) : '-'}</span>
                                        <span className="ml-2 text-xs">({group.current_teams}/{group.max_teams} spots filled)</span>
                                        {group.current_teams >= group.max_teams && <span className="ml-2 text-xs text-red-400">Full</span>}
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-fuchsia-200">No groups available for registration.</div>
                              )}
                              
                              <UserSearchInvite
                                onUserSelect={handlePlayer2Select}
                                placeholder="Search for Player 2..."
                                label="Player 2 Name"
                                className="w-full"
                              />
                              {errors.player2UserId && <p className="mt-1 text-xs sm:text-sm text-red-400">{errors.player2UserId.message}</p>}
                              
                              <div className="relative">
                                <label htmlFor="player2GameId" className="inline-block mb-1 px-3 py-1 rounded-full border border-fuchsia-500 bg-[#232046]/80 text-fuchsia-200 text-xs font-semibold">Player 2 Game ID</label>
                                <input
                                  id="player2GameId"
                                  type="text"
                                  {...register('player2GameId')}
                                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-fuchsia-500/30 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 transition-all text-base shadow-inner backdrop-blur-md"
                                  placeholder="Enter player 2 game ID"
                                  required
                                />
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
                                <label htmlFor="player3GameId" className="inline-block mb-1 px-3 py-1 rounded-full border border-fuchsia-500 bg-[#232046]/80 text-fuchsia-200 text-xs font-semibold">Player 3 Game ID</label>
                                <input
                                  id="player3GameId"
                                  type="text"
                                  {...register('player3GameId')}
                                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-fuchsia-500/30 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 transition-all text-base shadow-inner backdrop-blur-md"
                                  placeholder="Enter player 3 game ID"
                                  required
                                />
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
                                <label htmlFor="player4GameId" className="inline-block mb-1 px-3 py-1 rounded-full border border-fuchsia-500 bg-[#232046]/80 text-fuchsia-200 text-xs font-semibold">Player 4 Game ID</label>
                                <input
                                  id="player4GameId"
                                  type="text"
                                  {...register('player4GameId')}
                                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-fuchsia-500/30 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 transition-all text-base shadow-inner backdrop-blur-md"
                                  placeholder="Enter player 4 game ID"
                                  required
                                />
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
                            <div className="w-full flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-8">
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
      {isRegistered && userGroup && (
  <div className="mt-8">
    <h2 className="text-xl font-bold text-fuchsia-300 mb-4">Your Group's Matches & Lobby Credentials</h2>
    <div className="mb-2 text-fuchsia-200 font-semibold text-lg">
      Registered Group: <span className="text-white">{userGroup.name}</span>
    </div>
    {matchesLoading ? (
      <div className="text-fuchsia-200">Loading matches...</div>
    ) : userMatches.length === 0 ? (
      <div className="text-fuchsia-200">No matches scheduled for your group yet.</div>
    ) : (
      <div className="space-y-4">
        {userMatches.map(match => {
          const cred = matchCredentials[match.id];
          const showTime = cred?.show_credentials_from ? new Date(cred.show_credentials_from) : null;
          const now = new Date();
          let countdown = '';
          if (showTime && now < showTime) {
            const diff = showTime.getTime() - now.getTime();
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            countdown = `${mins}m ${secs}s`;
          }
          // Find group and stage name
          const group = groups.find(g => g.id === match.group_id);
          const stage = group ? stages.find(s => s.id === group.stage_id) : null;
          const stageName = stage ? stage.name : '-';
          return (
            <div key={match.id} className="bg-white/10 rounded-xl p-4 border border-fuchsia-700/30">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                {/* Removed Scheduled: line */}
                <div>
                  <span className="font-bold text-fuchsia-200">Scheduled Date/Time:</span> {match.scheduled_at ? utcIsoToIstDisplay(match.scheduled_at) : '-'}
                </div>
                <div>
                  <span className="font-bold text-fuchsia-200">Map:</span> {match.map_name || '-'}
                </div>
                <div>
                  <span className="font-bold text-fuchsia-200">Stage:</span> {stageName}
                </div>
              </div>
              {cred?.can_view ? (
                <div className="mt-2">
                  <div className="text-green-300 font-bold">Room Credentials Available!</div>
                  <div className="flex flex-col gap-1 mt-1">
                    <span><span className="font-semibold text-fuchsia-200">Room ID:</span> <span className="font-mono text-white">{cred.room_id}</span></span>
                    <span><span className="font-semibold text-fuchsia-200">Password:</span> <span className="font-mono text-white">{cred.room_password}</span></span>
                  </div>
                </div>
              ) : cred && showTime && now < showTime ? (
                <div className="mt-2 text-yellow-300">Room credentials will be available in <span className="font-mono">{countdown}</span></div>
              ) : (
                <div className="mt-2 text-fuchsia-200">Room credentials are not available yet.</div>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
)}
    </div>
  )
} 