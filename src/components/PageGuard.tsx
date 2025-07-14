'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';

function SkeletonPage() {
  return (
    <div className="p-8 text-center text-fuchsia-300 animate-pulse">
      <div className="h-8 w-1/3 mx-auto bg-fuchsia-900/30 rounded mb-4" />
      <div className="h-4 w-2/3 mx-auto bg-fuchsia-900/20 rounded mb-2" />
      <div className="h-4 w-1/2 mx-auto bg-fuchsia-900/10 rounded" />
    </div>
  );
}

interface PageGuardProps {
  pageKey: string;
  children: React.ReactNode;
}

const CACHE_KEY = 'page_permissions';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export default function PageGuard({ pageKey, children }: PageGuardProps) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function checkPermission() {
      setLoading(true);
      // Get current user
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user) {
        if (isMounted) {
          setAllowed(false);
          setLoading(false);
        }
        return;
      }
      // Get role from users table
      const { data } = await supabase!
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      const role = data?.role;
      if (!role) {
        if (isMounted) {
          setAllowed(false);
          setLoading(false);
        }
        return;
      }
      // Always allow superadmin
      if (role === 'superadmin') {
        if (isMounted) {
          setAllowed(true);
          setLoading(false);
        }
        return;
      }
      // Try cache first
      const cacheRaw = localStorage.getItem(CACHE_KEY);
      let cache: any = {};
      try { cache = cacheRaw ? JSON.parse(cacheRaw) : {}; } catch { cache = {}; }
      const userCache = cache[user.id] || {};
      const now = Date.now();
      if (
        userCache[pageKey] &&
        userCache[pageKey].allowed !== undefined &&
        now - userCache[pageKey].ts < CACHE_TTL
      ) {
        setAllowed(userCache[pageKey].allowed);
        setLoading(false);
      }
      // Always check in background for updates
      const res = await fetch(`/api/role-permissions?role=${role}&type=page`);
      const json = await res.json();
      const allowedPages = (json.permissions || [])
        .filter((p: any) => p.allowed)
        .map((p: any) => p.permission_key);
      const isAllowed = allowedPages.includes(pageKey);
      // Update cache
      cache[user.id] = {
        ...userCache,
        [pageKey]: { allowed: isAllowed, ts: now },
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      if (isMounted) {
        setAllowed(isAllowed);
        setLoading(false);
      }
    }
    checkPermission();
    return () => { isMounted = false; };
  }, [pageKey]);

  if (loading) return <SkeletonPage />;
  if (!allowed) return <div className="p-8 text-center text-red-400 font-bold">Access Denied</div>;
  return <>{children}</>;
} 