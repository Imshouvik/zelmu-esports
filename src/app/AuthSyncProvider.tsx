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
    console.log('WINDOW:', typeof window)
    console.log('supabase:', supabase)
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage).filter(k => k.includes('sb-'))
      keys.forEach(k => {
        console.log(`[localStorage] ${k}:`, localStorage.getItem(k))
      })
    }

    if (!supabase) return; // Fix linter error: supabase is possibly undefined

    dispatch(setLoading(true))

    const hydrateUser = async () => {
      if (!supabase) return; // Extra check for linter
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (user) {
        const { data: userRow } = await supabase
          .from('users')
          .select('id, name, phone, role, avatar_url')
          .eq('id', user.id)
          .single()
        const mappedUser = {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          role: userRow?.role || 'user',
          avatar_url: userRow?.avatar_url || user.user_metadata?.avatar_url || ''
        }
        dispatch(setUser(mappedUser))
      } else {
        dispatch(logout())
        // Only redirect to /login if not on a public page
        if (pathname !== '/login' && pathname !== '/') router.push('/login')
      }
      dispatch(setLoading(false))
    }

    hydrateUser()
  }, [pathname])

  return children
} 