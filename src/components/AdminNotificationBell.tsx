import { useState, useRef, useEffect } from 'react';
import { FaBell, FaUserCheck, FaUserTimes, FaSpinner } from 'react-icons/fa';
import { supabase } from '@/utils/supabaseClient';
import toast from 'react-hot-toast';

interface AdminNotification {
  id: string;
  club_id: string;
  user_id: string;
  role: string;
  status: 'pending' | 'active' | 'rejected';
  joined_at: string;
  users: any; // Supabase can return this as array or object
  clubs: any; // Supabase can return this as array or object
}

interface AdminNotificationBellProps {
  clubId: string;
  clubName: string;
}

export default function AdminNotificationBell({ clubId, clubName }: AdminNotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  // Get current user on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase!.auth.getUser();
      if (user) {
        setCurrentUser(user);
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    console.log('[AdminNotificationBell] Mounted with clubId:', clubId);
  }, [clubId]);

  // Fetch admin notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      if (!currentUser) return;

      // Fetch recent membership changes for the club (active and rejected)
      const { data: recentMemberships, error } = await supabase!
        .from('club_members')
        .select(`
          id,
          club_id,
          user_id,
          role,
          status,
          joined_at,
          users (id, name, email),
          clubs (id, name, logo_url, owner_id)
        `)
        .eq('club_id', clubId)
        .in('status', ['active', 'rejected'])
        .order('joined_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching admin notifications:', error);
        return;
      }

      console.log('[AdminNotificationBell] Fetched notifications:', recentMemberships);

      // Process the data to handle users field properly
      const processedNotifications = (recentMemberships || []).map(membership => ({
        ...membership,
        users: Array.isArray(membership.users) ? membership.users[0] : membership.users,
        clubs: Array.isArray(membership.clubs) ? membership.clubs[0] : membership.clubs
      })) as AdminNotification[];

      setNotifications(processedNotifications);
    } catch (err) {
      console.error('Error fetching admin notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Fetch notifications on mount and when dropdown opens
  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    }
  }, [currentUser]);

  useEffect(() => {
    if (open && currentUser) {
      fetchNotifications();
    }
  }, [open, currentUser]);

  // Real-time subscription for club membership changes
  useEffect(() => {
    if (!currentUser) return;

    // Create a new channel instance for each subscription
    const channel = supabase!.channel(`admin_club_members_changes_${clubId}_${Date.now()}`);

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'club_members',
        filter: `club_id=eq.${clubId}`
      },
      (payload) => {
        console.log('[AdminNotificationBell] Real-time club_members change payload:', payload);
        // Refresh notifications when there's a change
        fetchNotifications();
      }
    ).subscribe();

    return () => {
      channel.unsubscribe();
      supabase!.removeChannel(channel);
    };
  }, [currentUser, clubId]);

  // Helper function to safely get user data
  const getUserData = (notification: AdminNotification) => {
    const userData = Array.isArray(notification.users) ? notification.users[0] : notification.users;
    return userData || { name: 'Unknown User', email: 'unknown@email.com' };
  };

  const unreadCount = notifications.filter(n => 
    n.status === 'active' || n.status === 'rejected'
  ).length;

  const formatNotificationMessage = (notification: AdminNotification) => {
    const userName = getUserData(notification).name;
    switch (notification.status) {
      case 'active':
        return `${userName} accepted your invite to join ${clubName}`;
      case 'rejected':
        return `${userName} declined your invite to join ${clubName}`;
      default:
        return `Membership update for ${clubName}`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <FaUserCheck className="text-green-400" />;
      case 'rejected':
        return <FaUserTimes className="text-red-400" />;
      default:
        return <FaBell className="text-fuchsia-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'rejected':
        return 'text-red-400';
      default:
        return 'text-fuchsia-400';
    }
  };

  return (
    <div className="relative" ref={bellRef}>
      <button
        className="relative focus:outline-none"
        onClick={() => setOpen((v) => !v)}
        aria-label="Admin Notifications"
      >
        <FaBell className="text-2xl text-fuchsia-300 hover:text-fuchsia-400 transition" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 shadow-lg">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-[#18122b] border border-fuchsia-700/40 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-fuchsia-700/20 bg-fuchsia-900/10 flex items-center justify-between">
            <span className="text-white font-bold text-lg">Admin Notifications</span>
            <button
              onClick={fetchNotifications}
              className="ml-2 p-1 rounded hover:bg-fuchsia-800/40 text-fuchsia-300 hover:text-fuchsia-100 transition"
              title="Refresh"
              aria-label="Refresh Notifications"
              type="button"
            >
              <FaSpinner className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-fuchsia-700/10">
            {loading ? (
              <div className="p-6 text-center">
                <FaSpinner className="animate-spin text-fuchsia-400 mx-auto mb-2" />
                <span className="text-fuchsia-200">Loading...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-fuchsia-200">No notifications</div>
            ) : (
              notifications.map((notification) => {
                const userData = getUserData(notification);
                return (
                  <div key={notification.id} className="p-4 flex flex-col gap-2 bg-white/5 hover:bg-fuchsia-900/10 transition">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-600 to-purple-700 flex items-center justify-center border border-fuchsia-400/30">
                        {getStatusIcon(notification.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-white text-sm">{formatNotificationMessage(notification)}</span>
                        <span className={`text-xs font-semibold block mt-1 ${getStatusColor(notification.status)}`}>
                          {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                        </span>
                        <span className="text-fuchsia-300 text-xs mt-1">
                          {new Date(notification.joined_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
} 