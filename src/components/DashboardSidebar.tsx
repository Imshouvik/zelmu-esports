import Link from 'next/link';
import { useSelector } from 'react-redux';
import { usePathname } from 'next/navigation';
import { RootState } from '@/store';
import { FaTrophy, FaHome, FaBook, FaStore, FaChartBar, FaHeadset, FaCog, FaCrown, FaDiscord, FaInstagram, FaYoutube, FaTwitter, FaSignOutAlt, FaWallet, FaTimes, FaCamera, FaSpinner } from 'react-icons/fa';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/utils/supabaseClient';
import React, { MouseEvent } from 'react';
import toast from 'react-hot-toast';

const navLinks = [
  { name: 'Home', href: '/dashboard', icon: <FaHome /> },
  { name: 'Tournaments', href: '/dashboard/tournaments', icon: <FaTrophy /> },
  { name: 'Clubs', href: '/clubs', icon: <FaCrown /> },
  { name: 'Leaderboard', href: '/dashboard/leaderboard', icon: <FaChartBar /> },
  { name: 'Teams', href: '/dashboard/teams', icon: <FaCrown /> },
  { name: 'Wallet', href: '/dashboard/wallet', icon: <FaWallet /> },
  { name: 'Community', href: '/community', icon: <FaBook /> },
  { name: 'Settings', href: '/dashboard/settings', icon: <FaCog /> },
  { name: 'Support', href: '/dashboard/support', icon: <FaHeadset /> },
];

const socialLinks = [
  { href: 'https://discord.gg/', icon: <FaDiscord />, label: 'Discord' },
  { href: 'https://instagram.com/', icon: <FaInstagram />, label: 'Instagram' },
  { href: 'https://youtube.com/', icon: <FaYoutube />, label: 'YouTube' },
  { href: 'https://twitter.com/', icon: <FaTwitter />, label: 'Twitter' },
];

const SIDEBAR_KEYS = [
  { name: 'Home', key: 'dashboard' },
  { name: 'Tournaments', key: 'tournaments' },
  { name: 'Clubs', key: 'clubs' },
  { name: 'Leaderboard', key: 'leaderboard' },
  { name: 'Teams', key: 'teams' },
  { name: 'Wallet', key: 'wallet' },
  { name: 'Community', key: 'community' },
  { name: 'Settings', key: 'settings' },
  { name: 'Support', key: 'support' },
];

interface DashboardSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

function Ripple({ children, className = '', ...props }: any) {
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const [ripple, setRipple] = useState(false);

  const createRipple = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setCoords({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
    setRipple(false);
    setTimeout(() => setRipple(true), 0);
    setTimeout(() => setRipple(false), 400);
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onClick={createRipple}
      {...props}
    >
      {children}
      {coords && ripple && (
        <span
          className="absolute pointer-events-none bg-fuchsia-400/30 rounded-full animate-ripple"
          style={{
            left: coords.x - 50,
            top: coords.y - 50,
            width: 100,
            height: 100,
          }}
        />
      )}
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="flex flex-col h-full justify-between pb-2 animate-pulse">
      <div className="flex flex-col items-center py-5 border-b border-fuchsia-900/30">
        <div className="w-20 h-20 rounded-full bg-fuchsia-900/30 mb-3" />
        <div className="h-5 w-24 bg-fuchsia-900/20 rounded mb-2" />
        <div className="h-3 w-32 bg-fuchsia-900/10 rounded" />
      </div>
      <nav className="flex-1 flex flex-col gap-1 mt-2 pb-10">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-8 w-5/6 mx-auto bg-fuchsia-900/10 rounded mb-2" />
        ))}
      </nav>
    </div>
  );
}

export default function DashboardSidebar({ isOpen = false, onClose }: DashboardSidebarProps) {
  const pathname = usePathname() || '';
  const { user } = useSelector((state: RootState) => state.auth);
  const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [spin, setSpin] = useState(false);
  const prevIsOpen = useRef(isOpen);
  const [role, setRole] = useState<string | null>(null);
  const [allowedSidebar, setAllowedSidebar] = useState<string[]>([]);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchUserInfo() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get name, email, role, and avatar_url from users table
        const { data } = await supabase
          .from('users')
          .select('name, email, role, avatar_url')
          .eq('id', user.id)
          .single();
        if (data) {
          setUserInfo(data);
          setRole(data.role);
          setAvatar(data.avatar_url || 'https://api.dicebear.com/7.x/identicon/svg?seed=zelmu');
        }
      }
      setUserLoading(false);
    }
    fetchUserInfo();
  }, []);

  useEffect(() => {
    if (!role) return;
    if (role === 'superadmin') {
      setAllowedSidebar(SIDEBAR_KEYS.map(k => k.key));
      setSidebarLoading(false);
      return;
    }
    async function fetchSidebarPerms() {
      setSidebarLoading(true);
      const res = await fetch(`/api/role-permissions?role=${role}&type=sidebar`);
      const json = await res.json();
      const allowed = (json.permissions || [])
        .filter((p: any) => p.allowed)
        .map((p: any) => p.permission_key);
      setAllowedSidebar(allowed);
      setSidebarLoading(false);
    }
    fetchSidebarPerms();
  }, [role]);

  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      setSpin(true);
      setTimeout(() => setSpin(false), 600); // match animation duration
    }
    prevIsOpen.current = isOpen;
  }, [isOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('user-avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('user-avatars').getPublicUrl(filePath);
      const avatarUrl = urlData.publicUrl;
      // Update users table
      await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', user.id);
      setAvatar(avatarUrl);
      toast.success('Profile picture updated!');
    } catch (err) {
      toast.error('Failed to upload avatar.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Sidebar content (shared by desktop and mobile)
  const sidebarContent = (
    <div className="flex flex-col h-full justify-between pb-2">
      {/* User Profile */}
      <div className="flex flex-col items-center py-5 border-b border-fuchsia-900/30">
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-fuchsia-500 to-blue-500 p-1 mb-3 group">
          <img
            src={avatar || 'https://api.dicebear.com/7.x/identicon/svg?seed=zelmu'}
            alt="User Avatar"
            className="w-full h-full rounded-full object-cover border-4 border-[#232046]"
          />
          {/* Camera Icon Overlay */}
          <button
            type="button"
            className="absolute bottom-1 right-1 bg-fuchsia-700/80 hover:bg-fuchsia-500/90 text-white rounded-full p-2 shadow-lg transition-all group-hover:scale-110"
            style={{ zIndex: 2 }}
            onClick={handleAvatarClick}
            disabled={uploading}
            title="Change profile picture"
          >
            {uploading ? <FaSpinner className="animate-spin" /> : <FaCamera />}
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleAvatarChange}
            disabled={uploading}
          />
        </div>
        {/* User Info */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-white">
            {userLoading ? '...' : userInfo?.name || 'Gamer'}
          </h2>
          <p className="text-fuchsia-200 text-xs">{userLoading ? '' : userInfo?.email || ''}</p>
        </div>
      </div>
      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-1 mt-2 pb-10">
        {sidebarLoading
          ? <SidebarSkeleton />
          : navLinks.filter((link, i) => {
              const key = SIDEBAR_KEYS[i]?.key;
              return allowedSidebar.length === 0 || allowedSidebar.includes(key);
            }).map((link) => {
              const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
              return (
                <Ripple key={link.name} className="rounded-lg">
                  <Link
                    href={link.href}
                    className={`flex items-center gap-3 px-5 py-2.5 rounded-lg text-base font-medium transition-all duration-200
                      ${isActive ? 'bg-fuchsia-700/20 text-white shadow-lg' : 'text-fuchsia-100 hover:bg-fuchsia-700/10'}
                      active:scale-95
                    `}
                    onClick={onClose}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <span
                      className={`text-lg transition-transform duration-300 ${isActive ? 'scale-110 text-fuchsia-400 drop-shadow' : 'group-hover:scale-110 group-hover:text-fuchsia-300'}`}
                    >
                      {link.icon}
                    </span>
                    <span className="truncate">{link.name}</span>
                  </Link>
                </Ripple>
              );
            })}
        <div className="mt-3" />
      </nav>
      <div className="flex-1 flex flex-col justify-end min-h-0">
        <hr className="my-3 border-fuchsia-900/30" />
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-5 py-2.5 mb-2 text-red-400 bg-white/5 rounded-lg font-bold border border-transparent shadow-md text-base cursor-pointer select-none transition-none"
        >
          <FaSignOutAlt className="text-lg" />
          <span>Logout</span>
        </button>
        <hr className="my-3 border-fuchsia-900/30" />
        <div className="flex justify-center gap-4 pb-3">
          <a href="https://discord.gg/" target="_blank" rel="noopener noreferrer" className="text-fuchsia-300 hover:text-white text-2xl transition-all"><FaDiscord /></a>
          <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" className="text-fuchsia-300 hover:text-white text-2xl transition-all"><FaInstagram /></a>
          <a href="https://youtube.com/" target="_blank" rel="noopener noreferrer" className="text-fuchsia-300 hover:text-white text-2xl transition-all"><FaYoutube /></a>
          <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" className="text-fuchsia-300 hover:text-white text-2xl transition-all"><FaTwitter /></a>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-72 h-screen fixed top-0 left-0 z-30 bg-gradient-to-br from-[#18122b]/90 to-[#232046]/90 backdrop-blur-xl border-r border-fuchsia-900/30 shadow-2xl glassmorphism">
        {sidebarContent}
      </aside>

      {/* Mobile drawer sidebar with animation */}
      <div
        className={`fixed inset-0 z-50 md:hidden pointer-events-none transition-all duration-300 ${isOpen ? 'pointer-events-auto' : ''}`}
        aria-hidden={!isOpen}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={onClose}
        />
        {/* Sidebar drawer */}
        <aside
          className={`absolute top-0 left-0 h-full w-72 bg-gradient-to-br from-[#18122b]/95 to-[#232046]/95 border-r border-fuchsia-900/30 shadow-2xl glassmorphism flex flex-col transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {/* Close button */}
          <button
            className={`absolute top-4 right-4 text-fuchsia-200 hover:text-white text-2xl transition-transform duration-500 ${spin ? 'animate-spin-once' : ''}`}
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <FaTimes />
          </button>
          <div className="pt-8 h-full flex flex-col">
            {sidebarContent}
          </div>
        </aside>
      </div>
      <style jsx global>{`
        .glassmorphism {
          background: rgba(24, 18, 43, 0.85);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
          backdrop-filter: blur(12px);
        }
        @keyframes ripple {
          0% {
            opacity: 0.5;
            transform: scale(0.5);
          }
          100% {
            opacity: 0;
            transform: scale(2.5);
          }
        }
        .animate-ripple {
          animation: ripple 0.4s linear;
        }
        @keyframes spin-once {
          0% { transform: rotate(0deg); }
          80% { transform: rotate(380deg) scale(1.2); }
          100% { transform: rotate(360deg) scale(1); }
        }
        .animate-spin-once {
          animation: spin-once 0.6s cubic-bezier(0.4,0.2,0.2,1);
        }
      `}</style>
    </>
  );
} 