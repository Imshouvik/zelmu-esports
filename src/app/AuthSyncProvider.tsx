"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/utils/supabaseClient'
import { useDispatch } from 'react-redux'
import { setUser } from '@/store/slices/authSlice'

interface AuthContextType {
  user: any
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true })

export const useAuth = () => useContext(AuthContext)

export default function AuthSyncProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useDispatch()

  useEffect(() => {
    // Skip auth sync for these pages to prevent interference
    const skipPages = ['/login', '/register', '/oauth-callback']
    if (pathname && skipPages.includes(pathname)) {
      setLoading(false)
      return
    }

    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUserState(user)
        if (user) {
          // Map Supabase user to our User type
          const mappedUser = {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.full_name || user.user_metadata?.name || ''
          }
          dispatch(setUser(mappedUser))
        }
        
        if (!user) {
          // No user, redirect to login
          router.push('/login')
        } else {
          // User exists, check if they need to complete profile
          const { data: userRow } = await supabase
            .from('users')
            .select('id, name, phone')
            .eq('id', user.id)
            .single()

          if (!userRow) {
            // User doesn't exist in users table, redirect to complete profile
            router.push('/complete-profile')
          } else if (!userRow.phone) {
            // User exists but no phone number, redirect to complete profile
            router.push('/complete-profile')
          }
          // If user exists and has phone number, they can access the current page
        }
      } catch (error) {
        console.error('Error getting user:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUserState(session?.user ?? null)
        if (session?.user) {
          // Map Supabase user to our User type
          const mappedUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || ''
          }
          dispatch(setUser(mappedUser))
        }
        
        if (event === 'SIGNED_OUT') {
          router.push('/login')
        } else if (event === 'SIGNED_IN' && session?.user) {
          // Completely disable SIGNED_IN redirects to prevent interference
          // Let individual pages handle their own redirects
          console.log('SIGNED_IN event detected, but skipping redirect to prevent interference')
          return
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, pathname, dispatch])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
} 