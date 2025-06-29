"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import toast from 'react-hot-toast';
import { FaUsers, FaCrown, FaTrophy, FaBell, FaUserShield, FaSearch, FaLock, FaUnlock } from 'react-icons/fa';
import PageGuard from '@/components/PageGuard';

const SIDEBAR_OPTIONS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'clubs', label: 'Clubs' },
  { key: 'tournaments', label: 'Tournaments' },
  { key: 'adminPanel', label: 'Admin Panel' },
  { key: 'settings', label: 'Settings' },
];
const PAGE_OPTIONS = [
  { key: 'dashboard', label: 'Dashboard Page' },
  { key: 'clubs', label: 'Clubs Page' },
  { key: 'tournaments', label: 'Tournaments Page' },
  { key: 'adminPanel', label: 'Admin Panel Page' },
  { key: 'settings', label: 'Settings Page' },
];
const ROLES = ['user', 'admin'];

export default function SuperAdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Stats
  const [stats, setStats] = useState({ users: 0, clubs: 0, tournaments: 0, activeMembers: 0 });

  // Tournament form state
  const [tournament, setTournament] = useState({
    title: '',
    game: '',
    start_date: '',
    end_date: '',
    prize_pool: '',
    registration_fee: '',
    max_teams: '',
    current_teams: '0',
    status: 'upcoming',
    type: 'open',
    is_featured: false,
    is_upcoming: false,
    rules: [''],
    rewards: [{ position: 1, amount: 0 }],
  });
  const [creatingTournament, setCreatingTournament] = useState(false);
  const [tournaments, setTournaments] = useState<any[]>([]);

  // Notification form state
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);

  // User management
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userLoading, setUserLoading] = useState(false);

  const [selectedRole, setSelectedRole] = useState('user');
  const [sidebarPerms, setSidebarPerms] = useState<{ [key: string]: boolean }>({});
  const [pagePerms, setPagePerms] = useState<{ [key: string]: boolean }>({});
  const [permsLoading, setPermsLoading] = useState(false);

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
          fetchStats();
          fetchUsers();
        }
      }
    });
  }, []);

  // Fetch dashboard stats
  const fetchStats = async () => {
    const [{ count: userCount }, { count: clubCount }, { count: tournamentCount }, { count: memberCount }] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('clubs').select('*', { count: 'exact', head: true }),
      supabase.from('tournaments').select('*', { count: 'exact', head: true }),
      supabase.from('club_members').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    ]);
    setStats({
      users: userCount || 0,
      clubs: clubCount || 0,
      tournaments: tournamentCount || 0,
      activeMembers: memberCount || 0,
    });
  };

  // Fetch tournaments
  const fetchTournaments = async () => {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('startDate', { ascending: true });
    if (!error) setTournaments(data || []);
  };

  // Fetch users
  const fetchUsers = async () => {
    setUserLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, fcm_token')
      .order('created_at', { ascending: false });
    if (!error) setUsers(data || []);
    setUserLoading(false);
  };

  // Create tournament
  const handleCreateTournament = async (e: any) => {
    e.preventDefault();
    setCreatingTournament(true);
    
    // Filter out empty rules
    const filteredRules = tournament.rules.filter(rule => rule.trim() !== '');
    
    // Filter out rewards with 0 amount
    const filteredRewards = tournament.rewards.filter(reward => reward.amount > 0);
    
    const tournamentData = {
      ...tournament,
      prize_pool: Number(tournament.prize_pool),
      registration_fee: Number(tournament.registration_fee) || 0,
      max_teams: Number(tournament.max_teams) || 64,
      current_teams: Number(tournament.current_teams) || 0,
      rules: filteredRules,
      rewards: filteredRewards,
      created_by: user?.id
    };
    
    const { error } = await supabase
      .from('tournaments')
      .insert([tournamentData]);
    if (error) {
      toast.error('Failed to create tournament');
      console.error('Tournament creation error:', error);
    } else {
      toast.success('Tournament created!');
      setTournament({ title: '', game: '', start_date: '', end_date: '', prize_pool: '', registration_fee: '', max_teams: '', current_teams: '0', status: 'upcoming', type: 'open', is_featured: false, is_upcoming: false, rules: [''], rewards: [{ position: 1, amount: 0 }] });
      fetchTournaments();
      fetchStats();
    }
    setCreatingTournament(false);
  };

  // Send push notification to all users
  const handleSendNotification = async (e: any) => {
    e.preventDefault();
    setSendingNotif(true);
    // Get all user FCM tokens
    const { data: users } = await supabase
      .from('users')
      .select('fcm_token')
      .not('fcm_token', 'is', null);
    const tokens = users?.map((u: any) => u.fcm_token).filter(Boolean);
    if (!tokens || tokens.length === 0) {
      toast.error('No users with FCM tokens found');
      setSendingNotif(false);
      return;
    }
    // Send notification to each user
    for (const token of tokens) {
      await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          title: notifTitle,
          body: notifBody,
        }),
      });
    }
    toast.success('Notification sent to all users!');
    setNotifTitle('');
    setNotifBody('');
    setSendingNotif(false);
  };

  // Update user role
  const handleRoleChange = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);
    if (error) {
      toast.error('Failed to update role');
    } else {
      toast.success('Role updated!');
      fetchUsers();
    }
  };

  // Filtered users for search
  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Fetch permissions for selected role
  useEffect(() => {
    const fetchPerms = async () => {
      setPermsLoading(true);
      const [sidebarRes, pageRes] = await Promise.all([
        fetch(`/api/role-permissions?role=${selectedRole}&type=sidebar`).then(r => r.json()),
        fetch(`/api/role-permissions?role=${selectedRole}&type=page`).then(r => r.json()),
      ]);
      const sidebar: { [key: string]: boolean } = {};
      const page: { [key: string]: boolean } = {};
      sidebarRes.permissions?.forEach((p: any) => { sidebar[p.permission_key] = p.allowed; });
      pageRes.permissions?.forEach((p: any) => { page[p.permission_key] = p.allowed; });
      setSidebarPerms(sidebar);
      setPagePerms(page);
      setPermsLoading(false);
    };
    fetchPerms();
  }, [selectedRole]);

  // Update permission
  const updatePerm = async (type: 'sidebar' | 'page', key: string, allowed: boolean) => {
    if (permsLoading) return;
    if (type === 'sidebar') setSidebarPerms(prev => ({ ...prev, [key]: allowed }));
    else setPagePerms(prev => ({ ...prev, [key]: allowed }));
    await fetch('/api/role-permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: selectedRole, permission_key: key, type, allowed }),
    });
    toast.success('Permission updated');
  };

  if (loading) return <div className="p-8 text-center text-fuchsia-300">Loading...</div>;
  if (accessDenied) return <div className="p-8 text-center text-red-400 font-bold">Access Denied</div>;

  return (
    <PageGuard pageKey="adminPanel">
      <div className="min-h-screen bg-gradient-to-br from-[#0f051d] via-[#18122b] to-[#232046] py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-extrabold mb-8 text-fuchsia-400 drop-shadow-[0_2px_24px_rgba(236,72,153,0.5)]">Zelmu Super Admin Panel</h1>

          {/* Dashboard Stats */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-gradient-to-br from-fuchsia-600 to-purple-700 rounded-2xl p-6 flex flex-col items-center shadow-xl">
              <FaUsers className="text-3xl text-white mb-2" />
              <div className="text-2xl font-bold text-white">{stats.users}</div>
              <div className="text-fuchsia-200 mt-1">Total Users</div>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-fuchsia-700 rounded-2xl p-6 flex flex-col items-center shadow-xl">
              <FaCrown className="text-3xl text-white mb-2" />
              <div className="text-2xl font-bold text-white">{stats.clubs}</div>
              <div className="text-fuchsia-200 mt-1">Total Clubs</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-fuchsia-600 rounded-2xl p-6 flex flex-col items-center shadow-xl">
              <FaTrophy className="text-3xl text-white mb-2" />
              <div className="text-2xl font-bold text-white">{stats.tournaments}</div>
              <div className="text-fuchsia-200 mt-1">Tournaments</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-fuchsia-600 rounded-2xl p-6 flex flex-col items-center shadow-xl">
              <FaBell className="text-3xl text-white mb-2" />
              <div className="text-2xl font-bold text-white">{stats.activeMembers}</div>
              <div className="text-fuchsia-200 mt-1">Active Members</div>
            </div>
          </section>

          {/* Quick Access */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
              <FaTrophy className="text-fuchsia-400" /> Quick Access
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <a
                href="/admin/tournaments"
                className="bg-gradient-to-br from-fuchsia-600 to-purple-700 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
              >
                <div className="flex items-center gap-3">
                  <FaTrophy className="text-3xl text-white group-hover:scale-110 transition-transform" />
                  <div>
                    <h3 className="text-xl font-bold text-white">Tournament Management</h3>
                    <p className="text-fuchsia-200 text-sm">View all tournaments, registrations, teams, and clubs</p>
                  </div>
                </div>
              </a>
            </div>
          </section>

          {/* Role Permissions Management */}
          <section className="bg-[#18122b] rounded-2xl p-6 mb-12 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center"><FaUserShield className="mr-2" />Role Permissions Management</h2>
            <div className="mb-4">
              <label className="font-semibold text-white mr-2">Select Role:</label>
              <select
                className="bg-[#232046] text-fuchsia-100 px-3 py-1 rounded"
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
                disabled={permsLoading}
              >
                {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
              <span className="ml-4 text-sm text-fuchsia-300 font-semibold">Superadmin always has access to all pages and options.</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Sidebar Options */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Sidebar Options</h3>
                {SIDEBAR_OPTIONS.map(opt => (
                  <div key={opt.key} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={sidebarPerms[opt.key] ?? true}
                      onChange={e => updatePerm('sidebar', opt.key, e.target.checked)}
                      disabled={permsLoading}
                      className="mr-2"
                    />
                    <span className="text-fuchsia-100">{opt.label}</span>
                    {sidebarPerms[opt.key] === false ? <FaLock className="ml-2 text-red-400" /> : <FaUnlock className="ml-2 text-green-400" />}
                  </div>
                ))}
              </div>
              {/* Page Options */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Page Access</h3>
                {PAGE_OPTIONS.map(opt => (
                  <div key={opt.key} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={pagePerms[opt.key] ?? true}
                      onChange={e => updatePerm('page', opt.key, e.target.checked)}
                      disabled={permsLoading}
                      className="mr-2"
                    />
                    <span className="text-fuchsia-100">{opt.label}</span>
                    {pagePerms[opt.key] === false ? <FaLock className="ml-2 text-red-400" /> : <FaUnlock className="ml-2 text-green-400" />}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* User Management */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2"><FaUserShield className="text-fuchsia-400" /> User Management</h2>
            <div className="mb-4 flex items-center gap-2">
              <FaSearch className="text-fuchsia-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="px-4 py-2 rounded bg-white/20 text-white w-full max-w-xs"
              />
            </div>
            <div className="overflow-x-auto rounded-xl bg-white/10">
              <table className="min-w-full text-white">
                <thead>
                  <tr className="bg-fuchsia-900/30">
                    <th className="py-2 px-4 text-left">Name</th>
                    <th className="py-2 px-4 text-left">Email</th>
                    <th className="py-2 px-4 text-left">Role</th>
                    <th className="py-2 px-4 text-left">FCM Token</th>
                  </tr>
                </thead>
                <tbody>
                  {userLoading ? (
                    <tr><td colSpan={4} className="text-center py-4 text-fuchsia-200">Loading users...</td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-4 text-fuchsia-200">No users found.</td></tr>
                  ) : filteredUsers.map(u => (
                    <tr key={u.id} className="border-b border-fuchsia-700/20">
                      <td className="py-2 px-4">{u.name}</td>
                      <td className="py-2 px-4">{u.email}</td>
                      <td className="py-2 px-4">
                        <select
                          value={u.role || 'user'}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          className="bg-white/10 text-white rounded px-2 py-1 border border-fuchsia-500/30"
                          disabled={u.id === user.id}
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="py-2 px-4 text-xs break-all">{u.fcm_token ? '✅' : '❌'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Create Tournament */}
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-4 text-white">Create Upcoming Tournament</h2>
            <form onSubmit={handleCreateTournament} className="space-y-4 bg-white/10 p-6 rounded-xl">
              <input
                type="text"
                placeholder="Title"
                value={tournament.title}
                onChange={e => setTournament({ ...tournament, title: e.target.value })}
                className="w-full px-4 py-2 rounded bg-white/20 text-white"
                required
              />
              <input
                type="text"
                placeholder="Game"
                value={tournament.game}
                onChange={e => setTournament({ ...tournament, game: e.target.value })}
                className="w-full px-4 py-2 rounded bg-white/20 text-white"
                required
              />
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-fuchsia-200 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    placeholder="Start Date"
                    value={tournament.start_date}
                    onChange={e => setTournament({ ...tournament, start_date: e.target.value })}
                    className="w-full px-4 py-2 rounded bg-white/20 text-white"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-fuchsia-200 font-semibold mb-1">End Date</label>
                  <input
                    type="date"
                    placeholder="End Date"
                    value={tournament.end_date}
                    onChange={e => setTournament({ ...tournament, end_date: e.target.value })}
                    className="w-full px-4 py-2 rounded bg-white/20 text-white"
                    required
                  />
                </div>
              </div>
              <input
                type="number"
                placeholder="Prize Pool"
                value={tournament.prize_pool}
                onChange={e => setTournament({ ...tournament, prize_pool: e.target.value })}
                className="w-full px-4 py-2 rounded bg-white/20 text-white"
                required
              />
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Registration Fee"
                    value={tournament.registration_fee}
                    onChange={e => setTournament({ ...tournament, registration_fee: e.target.value })}
                    className="w-full px-4 py-2 rounded bg-white/20 text-white"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Max Teams"
                    value={tournament.max_teams}
                    onChange={e => setTournament({ ...tournament, max_teams: e.target.value })}
                    className="w-full px-4 py-2 rounded bg-white/20 text-white"
                    min="1"
                  />
                </div>
              </div>
              
              {/* Tournament Rules */}
              <div className="space-y-2">
                <label className="block text-fuchsia-200 font-semibold">Tournament Rules</label>
                {tournament.rules.map((rule, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      placeholder={`Rule ${index + 1}`}
                      value={rule}
                      onChange={e => {
                        const newRules = [...tournament.rules];
                        newRules[index] = e.target.value;
                        setTournament({ ...tournament, rules: newRules });
                      }}
                      className="flex-1 px-4 py-2 rounded bg-white/20 text-white"
                    />
                    {tournament.rules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newRules = tournament.rules.filter((_, i) => i !== index);
                          setTournament({ ...tournament, rules: newRules });
                        }}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setTournament({ ...tournament, rules: [...tournament.rules, ''] })}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                >
                  Add Rule
                </button>
              </div>

              {/* Prize Distribution */}
              <div className="space-y-2">
                <label className="block text-fuchsia-200 font-semibold">Prize Distribution</label>
                {tournament.rewards.map((reward, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Position"
                      value={reward.position}
                      onChange={e => {
                        const newRewards = [...tournament.rewards];
                        newRewards[index] = { ...reward, position: Number(e.target.value) };
                        setTournament({ ...tournament, rewards: newRewards });
                      }}
                      className="w-24 px-4 py-2 rounded bg-white/20 text-white"
                      min="1"
                    />
                    <input
                      type="number"
                      placeholder="Amount (₹)"
                      value={reward.amount}
                      onChange={e => {
                        const newRewards = [...tournament.rewards];
                        newRewards[index] = { ...reward, amount: Number(e.target.value) };
                        setTournament({ ...tournament, rewards: newRewards });
                      }}
                      className="flex-1 px-4 py-2 rounded bg-white/20 text-white"
                      min="0"
                    />
                    {tournament.rewards.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newRewards = tournament.rewards.filter((_, i) => i !== index);
                          setTournament({ ...tournament, rewards: newRewards });
                        }}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setTournament({ ...tournament, rewards: [...tournament.rewards, { position: tournament.rewards.length + 1, amount: 0 }] })}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                >
                  Add Prize
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-fuchsia-200 font-semibold mb-1">Tournament Type</label>
                  <select
                    value={tournament.type}
                    onChange={e => setTournament({ ...tournament, type: e.target.value })}
                    className="w-full px-4 py-2 rounded bg-white/20 text-white"
                  >
                    <option value="open">Open (Team/Individual)</option>
                    <option value="club">Club</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-fuchsia-200 font-semibold mb-1">Status</label>
                  <select
                    value={tournament.status}
                    onChange={e => setTournament({ ...tournament, status: e.target.value })}
                    className="w-full px-4 py-2 rounded bg-white/20 text-white"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2 justify-center">
                  <label className="flex items-center gap-2 text-fuchsia-200 font-semibold">
                    <input
                      type="checkbox"
                      checked={tournament.is_featured}
                      onChange={e => setTournament({ ...tournament, is_featured: e.target.checked })}
                      className="accent-fuchsia-500 w-5 h-5 rounded"
                    />
                    Featured
                  </label>
                  <label className="flex items-center gap-2 text-fuchsia-200 font-semibold">
                    <input
                      type="checkbox"
                      checked={tournament.is_upcoming}
                      onChange={e => setTournament({ ...tournament, is_upcoming: e.target.checked })}
                      className="accent-fuchsia-500 w-5 h-5 rounded"
                    />
                    Upcoming
                  </label>
                </div>
              </div>
              <button
                type="submit"
                disabled={creatingTournament}
                className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-6 py-2 rounded font-bold disabled:opacity-50"
              >
                {creatingTournament ? 'Creating...' : 'Create Tournament'}
              </button>
            </form>
          </section>

          {/* List of Tournaments */}
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-4 text-white">Upcoming Tournaments</h2>
            <ul className="space-y-2">
              {tournaments.map((t) => (
                <li key={t.id} className="bg-white/10 p-4 rounded-xl text-white flex justify-between items-center">
                  <div>
                    <div className="font-bold">{t.title}</div>
                    <div className="text-fuchsia-200 text-sm">{t.game} | {t.date} | Prize: {t.prize}</div>
                  </div>
                  {/* You can add edit/delete buttons here */}
                </li>
              ))}
            </ul>
          </section>

          {/* Push Notification */}
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-4 text-white">Push Notification to All Users</h2>
            <form onSubmit={handleSendNotification} className="space-y-4 bg-white/10 p-6 rounded-xl">
              <input
                type="text"
                placeholder="Notification Title"
                value={notifTitle}
                onChange={e => setNotifTitle(e.target.value)}
                className="w-full px-4 py-2 rounded bg-white/20 text-white"
                required
              />
              <textarea
                placeholder="Notification Body"
                value={notifBody}
                onChange={e => setNotifBody(e.target.value)}
                className="w-full px-4 py-2 rounded bg-white/20 text-white"
                required
              />
              <button
                type="submit"
                disabled={sendingNotif}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold disabled:opacity-50"
              >
                {sendingNotif ? 'Sending...' : 'Send Notification'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </PageGuard>
  );
} 