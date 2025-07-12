"use client";
import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
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
  // All hooks at the top!
  const user = useSelector((state: any) => state.auth.user);
  const loadingAuth = useSelector((state: any) => state.auth.loading);

  const [stats, setStats] = useState({ users: 0, clubs: 0, tournaments: 0, activeMembers: 0 });
  const [tournament, setTournament] = useState({
    title: '', game: '', start_date: '', end_date: '', prize_pool: '', registration_fee: '', max_teams: '', current_teams: '0', status: 'upcoming', type: 'open', is_featured: false, is_upcoming: false, rules: [''], rewards: [{ position: 1, amount: 0 }],
  });
  const [creatingTournament, setCreatingTournament] = useState(false);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userLoading, setUserLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('user');
  const [sidebarPerms, setSidebarPerms] = useState<{ [key: string]: boolean }>({});
  const [pagePerms, setPagePerms] = useState<{ [key: string]: boolean }>({});
  const [permsLoading, setPermsLoading] = useState(false);
  const [games, setGames] = useState<any[]>([]);

  // Utility to get JWT token
  const getToken = async () => {
    if (!supabase) throw new Error('Supabase client not initialized');
    const session = await supabase.auth.getSession();
    return session.data.session?.access_token;
  };

  const fetchStats = useCallback(async () => {
    const token = await getToken();
    const res = await fetch('/api/admin-stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setStats({
        users: data.users || 0,
        clubs: data.clubs || 0,
        tournaments: data.tournaments || 0,
        activeMembers: data.activeMembers || 0,
      });
    } else {
      setStats({ users: 0, clubs: 0, tournaments: 0, activeMembers: 0 });
    }
  }, []);

  const fetchTournaments = useCallback(async () => {
    const token = await getToken();
    const res = await fetch('/api/admin-tournaments', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setTournaments(data.tournaments || []);
    } else {
      setTournaments([]);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setUserLoading(true);
    const token = await getToken();
    const res = await fetch('/api/admin-users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
    } else {
      setUsers([]);
    }
    setUserLoading(false);
  }, []);

  useEffect(() => {
    if (user && user.role === 'superadmin') {
      fetchTournaments();
      fetchStats();
      fetchUsers();
    }
  }, [user, fetchTournaments, fetchStats, fetchUsers]);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await fetch('/api/admin-games');
        const data = await res.json();
        if (Array.isArray(data)) {
          setGames(data);
          if (!tournament.game && data.length > 0) {
            setTournament(t => ({ ...t, game: data[0].name }));
          }
        } else {
          setGames([]);
        }
      } catch {
        setGames([]);
      }
    };
    fetchGames();
    // eslint-disable-next-line
  }, []);

  // Fetch permissions for selected role
  const fetchPerms = async () => {
    setPermsLoading(true);
    const [sidebarRes, pageRes] = await Promise.all([
      fetch(`/api/role-permissions?role=${selectedRole}&type=sidebar`).then(r => r.json()),
      fetch(`/api/role-permissions?role=${selectedRole}&type=page`).then(r => r.json()),
    ]);
    const sidebar: Record<string, boolean> = {};
    const page: Record<string, boolean> = {};
    sidebarRes.permissions?.forEach((p: any) => { sidebar[p.permission_key] = p.allowed; });
    pageRes.permissions?.forEach((p: any) => { page[p.permission_key] = p.allowed; });
    setSidebarPerms(sidebar);
    setPagePerms(page);
    setPermsLoading(false);
  };

  useEffect(() => {
    fetchPerms();
    // eslint-disable-next-line
  }, [selectedRole]);

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
    
    const token = await getToken();
    const res = await fetch('/api/create-tournament', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(tournamentData),
    });
    if (res.ok) {
      toast.success('Tournament created!');
      setTournament({ title: '', game: '', start_date: '', end_date: '', prize_pool: '', registration_fee: '', max_teams: '', current_teams: '0', status: 'upcoming', type: 'open', is_featured: false, is_upcoming: false, rules: [''], rewards: [{ position: 1, amount: 0 }] });
      fetchTournaments();
      fetchStats();
    } else {
      toast.error('Failed to create tournament');
      console.error('Tournament creation error:', res.status);
    }
    setCreatingTournament(false);
  };

  // Send push notification to all users
  const handleSendNotification = async (e: any) => {
    e.preventDefault();
    setSendingNotif(true);
    // Get all user FCM tokens
    const res = await fetch('/api/get-fcm-tokens');
    if (res.ok) {
      const data = await res.json();
      const tokens = data?.map((u: any) => u.fcm_token).filter(Boolean);
      if (!tokens || tokens.length === 0) {
        toast.error('No users with FCM tokens found');
        setSendingNotif(false);
        return;
      }
      const token = await getToken();
      // Send notification to each user
      for (const fcmToken of tokens) {
        const notificationRes = await fetch('/api/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: fcmToken,
            title: notifTitle,
            body: notifBody,
          }),
        });
        if (!notificationRes.ok) {
          console.error('Failed to send notification to token:', fcmToken, notificationRes.status);
          // If 500, remove the token from DB
          if (notificationRes.status === 500) {
            await fetch('/api/remove-fcm-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ fcm_token: fcmToken }),
            });
          }
        }
      }
      toast.success('Notification sent to all users!');
    } else {
      toast.error('Failed to fetch users with FCM tokens');
    }
    setNotifTitle('');
    setNotifBody('');
    setSendingNotif(false);
  };

  // Update user role
  const handleRoleChange = async (userId: string, newRole: string) => {
    const token = await getToken();
    const res = await fetch('/api/update-user-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId, newRole }),
    });
    if (res.ok) {
      toast.success('Role updated!');
      fetchUsers();
    } else {
      toast.error('Failed to update role');
      console.error('Role update error:', res.status);
    }
  };

  // Filtered users for search
  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Update permission
  const updatePerm = async (type: 'sidebar' | 'page', key: string, allowed: boolean) => {
    if (permsLoading) return;
    if (type === 'sidebar') setSidebarPerms(prev => ({ ...prev, [key]: allowed }));
    else setPagePerms(prev => ({ ...prev, [key]: allowed }));
    const token = await getToken();
    const res = await fetch('/api/role-permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role: selectedRole, permission_key: key, type, allowed }),
    });
    if (res.ok) {
      toast.success('Permission updated');
      fetchPerms(); // Refresh permissions from backend
    } else {
      toast.error('Failed to update permission');
      console.error('Permission update error:', res.status);
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-2xl font-bold text-gray-700">Loading...</span>
      </div>
    );
  }
  if (!user || user.role !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-2xl font-bold text-red-600">Access Denied</span>
      </div>
    );
  }

  return (
    <PageGuard pageKey="admin">
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