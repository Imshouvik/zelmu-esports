"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/utils/supabaseClient'
import { useDispatch } from 'react-redux'
import { setUser, setLoading, logout } from '@/store/slices/authSlice'

export default function AuthSyncProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useDispatch()

  useEffect(() => {
    if (!supabase) return; // Fix linter error: supabase is possibly undefined

    dispatch(setLoading(true))

    const hydrateUser = async () => {
      if (!supabase) return; // Extra check for linter
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (user) {
        const { data: userRow, error: userError } = await supabase
          .from('users')
          .select('id, name, phone, role, avatar_url, country, state, city, zelmuname')
          .eq('id', user.id)
          .single()
        
        if (userError && userError.code === 'PGRST116') {
          // User doesn't exist in users table - create them
          console.log('AuthSyncProvider - User not found in users table, creating...');
          const name = user.user_metadata?.full_name || user.user_metadata?.name || '';
          const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/adventurer/svg?seed=zelmu';
          const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || DEFAULT_AVATAR;
          
          const { error: insertError } = await supabase
            .from('users')
            .insert([{
              id: user.id,
              email: user.email,
              name,
              phone: null,
              country: null,
              state: null,
              city: null,
              zelmuname: null,
              created_at: new Date().toISOString(),
              role: 'user',
              avatar_url: avatar
            }]);

          if (insertError) {
            console.error('AuthSyncProvider - Error creating user:', insertError);
            // Continue with basic user data
          } else {
            console.log('AuthSyncProvider - User created successfully');
          }
        }
        
        const mappedUser = {
          id: user.id,
          email: user.email || '',
          name: userRow?.name || user.user_metadata?.full_name || user.user_metadata?.name || '',
          role: userRow?.role || 'user',
          avatar_url: userRow?.avatar_url || user.user_metadata?.avatar_url || ''
        }
        dispatch(setUser(mappedUser))
        
        // Check if user profile is complete and redirect to complete-profile if needed
        if (userRow) {
          const isProfileComplete = userRow.phone && 
                                   userRow.country && 
                                   userRow.state && 
                                   userRow.city;
          
          if (!isProfileComplete) {
            const safePath = pathname || '';
            // Only redirect if not already on complete-profile or public pages
            if (safePath !== '/complete-profile' && 
                safePath !== '/login' &&
                safePath !== '/' &&
                !safePath.startsWith('/community') &&
                safePath !== '/privacy-policy' &&
                safePath !== '/register' &&
                safePath !== '/data-deletion' &&
                safePath !== '/about-us' &&
                safePath !== '/contact-us' &&
                safePath !== '/terms-and-conditions') {
              console.log('AuthSyncProvider - Profile incomplete, redirecting to complete-profile');
              router.push('/complete-profile');
              return;
            }
          }
        }
      } else {
        dispatch(logout())
        // Only redirect to /login if not on a public page
        const safePath = pathname || '';
        if (
          safePath !== '/login' &&
          safePath !== '/' &&
          !safePath.startsWith('/community') &&
          safePath !== '/privacy-policy' &&
          safePath !== '/register' &&
          safePath !== '/data-deletion' &&
          safePath !== '/about-us' &&
          safePath !== '/contact-us' &&
          safePath !== '/terms-and-conditions'
        ) router.push(`/login?redirect=${encodeURIComponent(safePath)}`)
      }
      dispatch(setLoading(false))
    }

    hydrateUser()
  }, [pathname])

  return children
} 