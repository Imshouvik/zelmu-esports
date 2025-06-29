"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import toast from 'react-hot-toast';
import { 
  FaTrophy, 
  FaUsers, 
  FaCrown, 
  FaCalendar, 
  FaMoneyBillWave, 
  FaSearch, 
  FaFilter,
  FaEye,
  FaEdit,
  FaTrash,
  FaDownload,
  FaArrowLeft,
  FaGamepad,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaUser,
  FaPhone,
  FaEnvelope
} from 'react-icons/fa';
import PageGuard from '@/components/PageGuard';

interface Tournament {
  id: string;
  title: string;
  game: string;
  start_date: string;
  end_date: string;
  prize_pool: number;
  registration_fee: number;
  max_teams: number;
  current_teams: number;
  status: string;
  type: string;
  is_featured: boolean;
  is_upcoming: boolean;
  rules: string[];
  rewards: { position: number; amount: number }[];
  created_at: string;
  created_by: string;
}

interface Registration {
  id: string;
  tournament_id: string;
  registration_type: 'team' | 'club';
  team_id?: string;
  club_id?: string;
  registered_by: string;
  registration_status: string;
  payment_status: string;
  registered_at: string;
  team?: {
    id: string;
    name: string;
    owner_id: string;
    team_type: string;
    registration_status: string;
    payment_status: string;
    team_players?: TeamPlayer[];
  };
  club?: {
    id: string;
    name: string;
    owner_id: string;
    logo_url?: string;
    bio?: string;
  };
  registered_by_user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

interface TeamPlayer {
  id: string;
  team_id: string;
  player_name: string;
  player_email?: string;
  player_phone?: string;
  game_id: string;
  player_position: string;
}

export default function TournamentManagementPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  
  // Tournament data
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [gameFilter, setGameFilter] = useState('all');
  
  // UI states
  const [showRegistrations, setShowRegistrations] = useState(false);
  const [expandedRegistrations, setExpandedRegistrations] = useState<Set<string>>(new Set());
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [savingTournament, setSavingTournament] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        setAccessDenied(true);
        setLoading(false);
      } else {
        // Fetch user from users table to check role
        const { data: userRow } = await supabase
          .from('users')
          .select('id, email, role')
          .eq('id', data.user.id)
          .single();
        if (!userRow || userRow.role !== 'superadmin') {
          setAccessDenied(true);
          setLoading(false);
        } else {
          setUser(userRow);
          setAccessDenied(false);
          setLoading(false);
          fetchTournaments();
        }
      }
    });
  }, []);

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching tournaments:', error);
        toast.error('Failed to fetch tournaments');
      } else {
        setTournaments(data || []);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast.error('Failed to fetch tournaments');
    }
  };

  const fetchTournamentRegistrations = async (tournamentId: string) => {
    setRegistrationsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select(`
          *,
          team:teams(
            id,
            name,
            owner_id,
            team_type,
            registration_status,
            payment_status,
            team_players(
              id,
              player_name,
              player_email,
              player_phone,
              game_id,
              player_position
            )
          ),
          club:clubs(
            id,
            name,
            owner_id,
            logo_url,
            bio
          ),
          registered_by_user:users!tournament_registrations_registered_by_fkey(
            id,
            name,
            email,
            phone
          )
        `)
        .eq('tournament_id', tournamentId)
        .order('registered_at', { ascending: false });

      if (error) {
        console.error('Error fetching registrations:', error);
        toast.error('Failed to fetch registrations');
      } else {
        setRegistrations(data || []);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Failed to fetch registrations');
    } finally {
      setRegistrationsLoading(false);
    }
  };

  const handleViewRegistrations = async (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setShowRegistrations(true);
    await fetchTournamentRegistrations(tournament.id);
  };

  const handleEditTournament = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setShowEditModal(true);
  };

  const saveTournament = async (updatedTournament: Tournament) => {
    setSavingTournament(true);
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({
          title: updatedTournament.title,
          game: updatedTournament.game,
          start_date: updatedTournament.start_date,
          end_date: updatedTournament.end_date,
          prize_pool: updatedTournament.prize_pool,
          registration_fee: updatedTournament.registration_fee,
          max_teams: updatedTournament.max_teams,
          current_teams: updatedTournament.current_teams,
          status: updatedTournament.status,
          type: updatedTournament.type,
          is_featured: updatedTournament.is_featured,
          is_upcoming: updatedTournament.is_upcoming,
          rules: updatedTournament.rules,
          rewards: updatedTournament.rewards
        })
        .eq('id', updatedTournament.id);

      if (error) {
        console.error('Error updating tournament:', error);
        toast.error('Failed to update tournament');
      } else {
        toast.success('Tournament updated successfully!');
        setShowEditModal(false);
        setEditingTournament(null);
        // Refresh tournaments list
        await fetchTournaments();
      }
    } catch (error) {
      console.error('Error updating tournament:', error);
      toast.error('Failed to update tournament');
    } finally {
      setSavingTournament(false);
    }
  };

  const toggleRegistrationExpansion = (registrationId: string) => {
    const newExpanded = new Set(expandedRegistrations);
    if (newExpanded.has(registrationId)) {
      newExpanded.delete(registrationId);
    } else {
      newExpanded.add(registrationId);
    }
    setExpandedRegistrations(newExpanded);
  };

  const updateRegistrationStatus = async (registrationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .update({ registration_status: newStatus })
        .eq('id', registrationId);

      if (error) {
        console.error('Error updating registration status:', error);
        toast.error('Failed to update registration status');
      } else {
        toast.success('Registration status updated successfully');
        // Refresh registrations
        if (selectedTournament) {
          await fetchTournamentRegistrations(selectedTournament.id);
        }
      }
    } catch (error) {
      console.error('Error updating registration status:', error);
      toast.error('Failed to update registration status');
    }
  };

  const updatePaymentStatus = async (registrationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .update({ payment_status: newStatus })
        .eq('id', registrationId);

      if (error) {
        console.error('Error updating payment status:', error);
        toast.error('Failed to update payment status');
      } else {
        toast.success('Payment status updated successfully');
        // Refresh registrations
        if (selectedTournament) {
          await fetchTournamentRegistrations(selectedTournament.id);
        }
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    }
  };

  const exportRegistrations = () => {
    if (!selectedTournament || registrations.length === 0) {
      toast.error('No registrations to export');
      return;
    }

    const csvData = registrations.map(reg => ({
      'Registration ID': reg.id,
      'Type': reg.registration_type,
      'Name': reg.registration_type === 'team' ? reg.team?.name : reg.club?.name,
      'Registered By': reg.registered_by_user?.name || 'Unknown',
      'Email': reg.registered_by_user?.email || 'Unknown',
      'Phone': reg.registered_by_user?.phone || 'Unknown',
      'Registration Status': reg.registration_status,
      'Payment Status': reg.payment_status,
      'Registered At': new Date(reg.registered_at).toLocaleString(),
      'Players': reg.team?.team_players?.map(p => p.player_name).join(', ') || 'N/A'
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTournament.title}_registrations.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch = tournament.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tournament.game.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tournament.status === statusFilter;
    const matchesType = typeFilter === 'all' || tournament.type === typeFilter;
    const matchesGame = gameFilter === 'all' || tournament.game === gameFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesGame;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f051d] via-[#18122b] to-[#232046] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-400 mx-auto mb-4"></div>
          <span className="text-fuchsia-200 text-lg font-semibold">Loading...</span>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f051d] via-[#18122b] to-[#232046] flex items-center justify-center">
        <div className="text-center">
          <span className="text-red-400 text-lg font-semibold">Access Denied</span>
        </div>
      </div>
    );
  }

  return (
    <PageGuard pageKey="adminPanel">
      <div className="min-h-screen bg-gradient-to-br from-[#0f051d] via-[#18122b] to-[#232046]">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-xl border-b border-fuchsia-700/30">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/admin')}
                  className="text-fuchsia-300 hover:text-white transition-colors"
                >
                  <FaArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-white">Tournament Management</h1>
                  <p className="text-fuchsia-200">Manage all tournaments and view registrations</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Filters */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-fuchsia-700/30">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-fuchsia-200 text-sm font-medium mb-2">Search</label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-fuchsia-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search tournaments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-fuchsia-500/30 rounded-lg text-white placeholder-fuchsia-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-fuchsia-200 text-sm font-medium mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-fuchsia-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                >
                  <option value="all">All Status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-fuchsia-200 text-sm font-medium mb-2">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-fuchsia-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                >
                  <option value="all">All Types</option>
                  <option value="open">Open</option>
                  <option value="club">Club</option>
                </select>
              </div>
              
              <div>
                <label className="block text-fuchsia-200 text-sm font-medium mb-2">Game</label>
                <select
                  value={gameFilter}
                  onChange={(e) => setGameFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-fuchsia-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                >
                  <option value="all">All Games</option>
                  <option value="BGMI">BGMI</option>
                  <option value="Free Fire">Free Fire</option>
                  <option value="Football">Football</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setGameFilter('all');
                  }}
                  className="w-full px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Tournaments List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-fuchsia-700/30 hover:border-fuchsia-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FaTrophy className="text-fuchsia-400 w-6 h-6" />
                    <div>
                      <h3 className="text-xl font-bold text-white">{tournament.title}</h3>
                      <div className="flex items-center gap-2 text-fuchsia-300">
                        <FaGamepad className="w-4 h-4" />
                        <span>{tournament.game}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      tournament.status === 'upcoming' ? 'bg-blue-500/20 text-blue-300' :
                      tournament.status === 'ongoing' ? 'bg-green-500/20 text-green-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {tournament.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      tournament.type === 'club' ? 'bg-purple-500/20 text-purple-300' : 'bg-orange-500/20 text-orange-300'
                    }`}>
                      {tournament.type}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-fuchsia-200">Prize Pool:</span>
                    <span className="text-yellow-300 font-bold">₹{tournament.prize_pool?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-fuchsia-200">Registration Fee:</span>
                    <span className="text-white">₹{tournament.registration_fee || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-fuchsia-200">Teams:</span>
                    <span className="text-white">{tournament.current_teams || 0}/{tournament.max_teams || 64}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-fuchsia-200">Start Date:</span>
                    <span className="text-white">{new Date(tournament.start_date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewRegistrations(tournament)}
                    className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <FaEye className="w-4 h-4" />
                    View Registrations
                  </button>
                  <button
                    onClick={() => handleEditTournament(tournament)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <FaEdit className="w-4 h-4" />
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredTournaments.length === 0 && (
            <div className="text-center py-12">
              <FaTrophy className="text-fuchsia-400 w-16 h-16 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No tournaments found</h3>
              <p className="text-fuchsia-200">Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>

        {/* Registrations Modal */}
        {showRegistrations && selectedTournament && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-fuchsia-700/30">
              {/* Modal Header */}
              <div className="bg-white/5 p-6 border-b border-fuchsia-700/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedTournament.title} - Registrations</h2>
                    <p className="text-fuchsia-200">Total: {registrations.length} registrations</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={exportRegistrations}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <FaDownload className="w-4 h-4" />
                      Export CSV
                    </button>
                    <button
                      onClick={() => setShowRegistrations(false)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {registrationsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-400 mx-auto mb-4"></div>
                    <span className="text-fuchsia-200">Loading registrations...</span>
                  </div>
                ) : registrations.length === 0 ? (
                  <div className="text-center py-12">
                    <FaUsers className="text-fuchsia-400 w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No registrations yet</h3>
                    <p className="text-fuchsia-200">This tournament hasn't received any registrations</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {registrations.map((registration) => (
                      <div
                        key={registration.id}
                        className="bg-white/10 rounded-xl p-4 border border-fuchsia-700/30"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {registration.registration_type === 'club' ? (
                              <FaCrown className="text-purple-400 w-5 h-5" />
                            ) : (
                              <FaUsers className="text-blue-400 w-5 h-5" />
                            )}
                            <div>
                              <h4 className="text-lg font-bold text-white">
                                {registration.registration_type === 'team' 
                                  ? registration.team?.name 
                                  : registration.club?.name
                                }
                              </h4>
                              <p className="text-fuchsia-200 text-sm">
                                Registered by: {registration.registered_by_user?.name || 'Unknown'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              registration.registration_status === 'approved' ? 'bg-green-500/20 text-green-300' :
                              registration.registration_status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                              'bg-yellow-500/20 text-yellow-300'
                            }`}>
                              {registration.registration_status}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              registration.payment_status === 'paid' ? 'bg-green-500/20 text-green-300' :
                              registration.payment_status === 'refunded' ? 'bg-red-500/20 text-red-300' :
                              'bg-yellow-500/20 text-yellow-300'
                            }`}>
                              {registration.payment_status}
                            </span>
                            <button
                              onClick={() => toggleRegistrationExpansion(registration.id)}
                              className="text-fuchsia-300 hover:text-white transition-colors"
                            >
                              {expandedRegistrations.has(registration.id) ? '▼' : '▶'}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedRegistrations.has(registration.id) && (
                          <div className="mt-4 pt-4 border-t border-fuchsia-700/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Registration Details */}
                              <div>
                                <h5 className="text-fuchsia-300 font-bold mb-3">Registration Details</h5>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-fuchsia-200">Registration ID:</span>
                                    <span className="text-white">{registration.id}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-fuchsia-200">Type:</span>
                                    <span className="text-white capitalize">{registration.registration_type}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-fuchsia-200">Registered At:</span>
                                    <span className="text-white">{new Date(registration.registered_at).toLocaleString()}</span>
                                  </div>
                                </div>

                                {/* Status Controls */}
                                <div className="mt-4 space-y-2">
                                  <div>
                                    <label className="block text-fuchsia-200 text-sm mb-1">Registration Status</label>
                                    <select
                                      value={registration.registration_status}
                                      onChange={(e) => updateRegistrationStatus(registration.id, e.target.value)}
                                      className="w-full px-3 py-1 bg-white/10 border border-fuchsia-500/30 rounded text-white text-sm"
                                    >
                                      <option value="pending">Pending</option>
                                      <option value="approved">Approved</option>
                                      <option value="rejected">Rejected</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-fuchsia-200 text-sm mb-1">Payment Status</label>
                                    <select
                                      value={registration.payment_status}
                                      onChange={(e) => updatePaymentStatus(registration.id, e.target.value)}
                                      className="w-full px-3 py-1 bg-white/10 border border-fuchsia-500/30 rounded text-white text-sm"
                                    >
                                      <option value="pending">Pending</option>
                                      <option value="paid">Paid</option>
                                      <option value="refunded">Refunded</option>
                                    </select>
                                  </div>
                                </div>
                              </div>

                              {/* User Details */}
                              <div>
                                <h5 className="text-fuchsia-300 font-bold mb-3">Registrant Details</h5>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <FaUser className="text-fuchsia-400 w-4 h-4" />
                                    <span className="text-white">{registration.registered_by_user?.name || 'Unknown'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <FaEnvelope className="text-fuchsia-400 w-4 h-4" />
                                    <span className="text-white">{registration.registered_by_user?.email || 'Unknown'}</span>
                                  </div>
                                  {registration.registered_by_user?.phone && (
                                    <div className="flex items-center gap-2">
                                      <FaPhone className="text-fuchsia-400 w-4 h-4" />
                                      <span className="text-white">{registration.registered_by_user.phone}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Team Players (for team registrations) */}
                                {registration.registration_type === 'team' && registration.team?.team_players && (
                                  <div className="mt-4">
                                    <h5 className="text-fuchsia-300 font-bold mb-3">Team Players</h5>
                                    <div className="space-y-2">
                                      {registration.team.team_players.map((player) => (
                                        <div key={player.id} className="bg-white/5 rounded p-2 text-sm">
                                          <div className="flex justify-between items-center">
                                            <span className="text-white font-medium">{player.player_name}</span>
                                            <span className={`px-2 py-1 rounded text-xs ${
                                              player.player_position === 'captain' 
                                                ? 'bg-yellow-500/20 text-yellow-300' 
                                                : 'bg-blue-500/20 text-blue-300'
                                            }`}>
                                              {player.player_position}
                                            </span>
                                          </div>
                                          <div className="text-fuchsia-200 text-xs mt-1">
                                            Game ID: {player.game_id}
                                            {player.player_email && ` • ${player.player_email}`}
                                            {player.player_phone && ` • ${player.player_phone}`}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Tournament Modal */}
        {showEditModal && editingTournament && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-fuchsia-700/30">
              {/* Modal Header */}
              <div className="bg-white/5 p-6 border-b border-fuchsia-700/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Edit Tournament</h2>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-fuchsia-200 text-sm mb-1">Title</label>
                    <input
                      type="text"
                      value={editingTournament.title}
                      onChange={(e) => setEditingTournament({ ...editingTournament, title: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-fuchsia-500/30 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-fuchsia-200 text-sm mb-1">Game</label>
                    <input
                      type="text"
                      value={editingTournament.game}
                      onChange={(e) => setEditingTournament({ ...editingTournament, game: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-fuchsia-500/30 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-fuchsia-200 text-sm mb-1">Start Date</label>
                    <input
                      type="date"
                      value={editingTournament.start_date}
                      onChange={(e) => setEditingTournament({ ...editingTournament, start_date: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-fuchsia-500/30 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-fuchsia-200 text-sm mb-1">End Date</label>
                    <input
                      type="date"
                      value={editingTournament.end_date}
                      onChange={(e) => setEditingTournament({ ...editingTournament, end_date: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-fuchsia-500/30 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-fuchsia-200 text-sm mb-1">Prize Pool (₹)</label>
                    <input
                      type="number"
                      value={editingTournament.prize_pool}
                      onChange={(e) => setEditingTournament({ ...editingTournament, prize_pool: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white/10 border border-fuchsia-500/30 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-fuchsia-200 text-sm mb-1">Registration Fee (₹)</label>
                    <input
                      type="number"
                      value={editingTournament.registration_fee}
                      onChange={(e) => setEditingTournament({ ...editingTournament, registration_fee: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white/10 border border-fuchsia-500/30 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-fuchsia-200 text-sm mb-1">Max Teams</label>
                    <input
                      type="number"
                      value={editingTournament.max_teams}
                      onChange={(e) => setEditingTournament({ ...editingTournament, max_teams: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white/10 border border-fuchsia-500/30 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-fuchsia-200 text-sm mb-1">Current Teams</label>
                    <input
                      type="number"
                      value={editingTournament.current_teams}
                      onChange={(e) => setEditingTournament({ ...editingTournament, current_teams: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white/10 border border-fuchsia-500/30 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-fuchsia-200 text-sm mb-1">Status</label>
                    <select
                      value={editingTournament.status}
                      onChange={(e) => setEditingTournament({ ...editingTournament, status: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-fuchsia-500/30 rounded text-white text-sm"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-fuchsia-200 text-sm mb-1">Type</label>
                    <select
                      value={editingTournament.type}
                      onChange={(e) => setEditingTournament({ ...editingTournament, type: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-fuchsia-500/30 rounded text-white text-sm"
                    >
                      <option value="open">Open</option>
                      <option value="club">Club</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-fuchsia-200 text-sm mb-1">Featured Tournament</label>
                    <select
                      value={editingTournament.is_featured ? 'yes' : 'no'}
                      onChange={(e) => setEditingTournament({ ...editingTournament, is_featured: e.target.value === 'yes' })}
                      className="w-full px-3 py-2 bg-white/10 border border-fuchsia-500/30 rounded text-white text-sm"
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-fuchsia-200 text-sm mb-1">Upcoming Tournament</label>
                    <select
                      value={editingTournament.is_upcoming ? 'yes' : 'no'}
                      onChange={(e) => setEditingTournament({ ...editingTournament, is_upcoming: e.target.value === 'yes' })}
                      className="w-full px-3 py-2 bg-white/10 border border-fuchsia-500/30 rounded text-white text-sm"
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-fuchsia-200 text-sm mb-1">Rules (one per line)</label>
                    <textarea
                      value={Array.isArray(editingTournament.rules) ? editingTournament.rules.join('\n') : ''}
                      onChange={(e) => setEditingTournament({ 
                        ...editingTournament, 
                        rules: e.target.value.split('\n').filter(rule => rule.trim() !== '')
                      })}
                      placeholder="Enter tournament rules, one per line..."
                      rows={4}
                      className="w-full px-3 py-2 bg-white/10 border border-fuchsia-500/30 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-fuchsia-200 text-sm mb-1">Rewards (format: position - amount, one per line)</label>
                    <textarea
                      value={Array.isArray(editingTournament.rewards) ? 
                        editingTournament.rewards.map(r => `${r.position} - ${r.amount}`).join('\n') : ''
                      }
                      onChange={(e) => {
                        const rewards = e.target.value.split('\n')
                          .filter(line => line.trim() !== '')
                          .map(line => {
                            const [position, amount] = line.split(' - ');
                            return {
                              position: parseInt(position) || 1,
                              amount: parseInt(amount) || 0
                            };
                          });
                        setEditingTournament({ ...editingTournament, rewards });
                      }}
                      placeholder="1 - 10000&#10;2 - 5000&#10;3 - 2500"
                      rows={4}
                      className="w-full px-3 py-2 bg-white/10 border border-fuchsia-500/30 rounded text-white text-sm"
                    />
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveTournament(editingTournament)}
                    disabled={savingTournament}
                    className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {savingTournament ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageGuard>
  );
} 