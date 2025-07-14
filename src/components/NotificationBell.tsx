import { useState, useRef, useEffect } from 'react';
import { FaBell, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import { supabase } from '@/utils/supabaseClient';
import toast from 'react-hot-toast';

interface ClubInvite {
  id: string;
  club_id: string;
  user_id: string;
  role: string;
  status: 'pending' | 'active' | 'rejected';
  joined_at: string;
  clubs: {
    id: string;
    name: string;
    logo_url?: string;
    owner_id: string;
  };
  created_by?: {
    id: string;
    name: string;
  };
}

interface NotificationBellProps {
  userId: string;
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<ClubInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      if (!userId) return;

      // Fetch pending club memberships for the current user
      const { data: pendingMemberships, error } = await supabase!
        .from('club_members')
        .select(`
          *,
          clubs (id, name, logo_url, owner_id)
        `)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      // Also fetch recent active memberships for context
      const { data: recentMemberships } = await supabase!
        .from('club_members')
        .select(`
          *,
          clubs (id, name, logo_url, owner_id)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('joined_at', { ascending: false })
        .limit(5);

      // Combine pending and recent memberships
      const allNotifications = [
        ...(pendingMemberships || []),
        ...(recentMemberships || [])
      ];

      setNotifications(allNotifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle accept/reject invite
  const handleInviteResponse = async (membershipId: string, status: 'active' | 'rejected') => {
    setResponding(membershipId);
    try {
      if (!userId) return;

      // Update membership status
      const { error: updateError } = await supabase!
        .from('club_members')
        .update({ 
          status,
          joined_at: new Date().toISOString()
        })
        .eq('id', membershipId)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating membership:', updateError);
        toast.error('Failed to respond to invite');
        return;
      }

      if (status === 'active') {
        const membership = notifications.find(n => n.id === membershipId);
        if (membership) {
          toast.success(`Successfully joined ${membership.clubs.name}!`);
        }
      } else {
        toast.success('Invite rejected');
      }

      // Refresh notifications
      await fetchNotifications();

      // Notify the club owner (admin) about the action
      try {
        // Find the membership to get the club info
        const membership = notifications.find(n => n.id === membershipId);
        if (membership) {
          // Get the club owner's fcm_token
          const { data: ownerData } = await supabase!
            .from('users')
            .select('fcm_token, name')
            .eq('id', membership.clubs.owner_id)
            .single();
          const adminFcmToken = ownerData?.fcm_token;
          // Get the current user's name
          const { data: userData } = await supabase!
            .from('users')
            .select('name')
            .eq('id', userId)
            .single();
          const currentUserName = userData?.name || 'A user';
          if (adminFcmToken) {
            await fetch('/api/send-notification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: adminFcmToken,
                title: 'Club Membership Update',
                body: `${currentUserName} has ${status === 'active' ? 'accepted' : 'rejected'} your club invite.`,
              }),
            });
          }
        }
      } catch (err) {
        console.error('Failed to send FCM notification to admin:', err);
      }
    } catch (err) {
      console.error('Error responding to invite:', err);
      toast.error('Failed to respond to invite');
    } finally {
      setResponding(null);
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
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  // Real-time subscription for club memberships
  useEffect(() => {
    const setupRealtime = async () => {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) return;

      // Subscribe to changes in club_members table
      const subscription = supabase!
        .channel('club_members_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'club_members',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Real-time club membership change:', payload);
            // Refresh notifications when there's a change
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    };

    setupRealtime();
  }, []);

  const unreadCount = notifications.filter(n => n.status === 'pending').length;

  const formatNotificationMessage = (membership: ClubInvite) => {
    switch (membership.status) {
      case 'pending':
        return `You have been invited to join ${membership.clubs.name}`;
      case 'active':
        return `You joined ${membership.clubs.name}`;
      case 'rejected':
        return `You declined to join ${membership.clubs.name}`;
      default:
        return `Club membership update for ${membership.clubs.name}`;
    }
  };

  return (
    <div className="relative" ref={bellRef}>
      <button
        className="relative focus:outline-none"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
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
          <div className="p-4 border-b border-fuchsia-700/20 bg-fuchsia-900/10">
            <span className="text-white font-bold text-lg">Notifications</span>
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
              notifications.map((membership) => (
                <div key={membership.id} className="p-4 flex flex-col gap-2 bg-white/5 hover:bg-fuchsia-900/10 transition">
                  <div className="flex items-start gap-3">
                    {membership.clubs.logo_url ? (
                      <img
                        src={membership.clubs.logo_url}
                        alt={`${membership.clubs.name} logo`}
                        className="w-8 h-8 rounded-lg object-cover border border-fuchsia-400/30"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-600 to-purple-700 flex items-center justify-center border border-fuchsia-400/30">
                        <span className="text-white text-xs font-bold">C</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-white text-sm">{formatNotificationMessage(membership)}</span>
                      <span className={`text-xs font-semibold block mt-1 ${
                        membership.status === 'pending' ? 'text-yellow-400' : 
                        membership.status === 'active' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {membership.status.charAt(0).toUpperCase() + membership.status.slice(1)}
                      </span>
                      <span className="text-fuchsia-300 text-xs mt-1">
                        {new Date(membership.joined_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Action buttons for pending invites */}
                  {membership.status === 'pending' && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleInviteResponse(membership.id, 'active')}
                        disabled={responding === membership.id}
                        className="flex items-center gap-1 bg-green-600/20 hover:bg-green-600/40 text-green-200 px-3 py-1 rounded-lg border border-green-500/30 transition-all disabled:opacity-50 text-xs"
                      >
                        {responding === membership.id ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <FaCheck />
                        )}
                        Accept
                      </button>
                      <button
                        onClick={() => handleInviteResponse(membership.id, 'rejected')}
                        disabled={responding === membership.id}
                        className="flex items-center gap-1 bg-red-600/20 hover:bg-red-600/40 text-red-200 px-3 py-1 rounded-lg border border-red-500/30 transition-all disabled:opacity-50 text-xs"
                      >
                        {responding === membership.id ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <FaTimes />
                        )}
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
} 