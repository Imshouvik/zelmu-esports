"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabaseClient'
import Navigation from '@/components/Navigation'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { FaSpinner } from 'react-icons/fa'

export default function CompleteProfilePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Fetch current user info
    const fetchUser = async () => {
      try {
        setInitialLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        setUser(user)

        // Get user data from users table
        const { data: userRow, error: userError } = await supabase
          .from('users')
          .select('name, phone')
          .eq('id', user.id)
          .single()

        if (userError) {
          console.error('Error fetching user data:', userError)
          setError('Failed to load user data.')
          setInitialLoading(false)
          return
        }

        if (userRow) {
          // Pre-fill with existing data from users table
          setName(userRow.name || '')
          setPhone(userRow.phone || '')
          
          // If user already has a phone number, redirect to dashboard
          if (userRow.phone) {
            router.push('/dashboard')
            return
          }
        } else {
          // Fallback to user metadata if no user row exists
          const metadataName = user.user_metadata?.full_name || user.user_metadata?.name || ''
          setName(metadataName)
        }
      } catch (err) {
        console.error('Error in fetchUser:', err)
        setError('An error occurred while loading user data.')
      } finally {
        setInitialLoading(false)
      }
    }
    fetchUser()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    if (!user) {
      setError('User not found.')
      setLoading(false)
      return
    }
    
    if (!name.trim()) {
      setError('Name is required.')
      setLoading(false)
      return
    }
    
    if (!phone.trim()) {
      setError('Phone number is required.')
      setLoading(false)
      return
    }

    try {
      // Update users table
      const { error: updateError } = await supabase
        .from('users')
        .update({ name: name.trim(), phone: phone.trim() })
        .eq('id', user.id)

      if (updateError) {
        console.error('Update error:', updateError)
        setError(updateError.message)
        setLoading(false)
        return
      }

      // Success - redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      console.error('Error updating profile:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center">
        <Navigation />
        <div className="absolute inset-0 w-full h-full -z-10 bg-black">
          <img
            src="/app/images/esports%20bg.webp"
            alt="Esports Background"
            className="w-full h-full object-cover object-center"
            style={{ opacity: 0.7 }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a23]/80 via-blue-900/60 to-[#18122b]/90 mix-blend-multiply pointer-events-none" />
        </div>
        <div className="relative z-10 flex items-center gap-3 text-white">
          <FaSpinner className="animate-spin text-2xl" />
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center">
      <Navigation />
      <div className="absolute inset-0 w-full h-full -z-10 bg-black">
        <img
          src="/app/images/esports%20bg.webp"
          alt="Esports Background"
          className="w-full h-full object-cover object-center"
          style={{ opacity: 0.7 }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a23]/80 via-blue-900/60 to-[#18122b]/90 mix-blend-multiply pointer-events-none" />
      </div>
      <div className="relative z-10 w-full max-w-xs sm:max-w-md mx-2 sm:mx-auto px-4 py-8 sm:px-8 sm:py-12 rounded-2xl sm:rounded-3xl backdrop-blur-2xl bg-white/10 border border-fuchsia-500/40 shadow-2xl flex flex-col items-center text-center">
        <span className="bg-white/10 px-5 py-2 rounded-full text-white text-2xl font-extrabold tracking-widest shadow-lg mb-4" style={{ fontFamily: 'Orbitron, Inter, sans-serif', letterSpacing: '0.15em' }}>
          ZELMU
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 drop-shadow-lg">Complete Your Profile</h2>
        <p className="text-fuchsia-100 text-sm mb-6">Please add your phone number to complete your profile.</p>
        <form className="w-full flex flex-col gap-4 sm:gap-6" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 sm:px-5 rounded-xl bg-white/10 border border-fuchsia-500/30 text-white placeholder-fuchsia-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 transition-all text-base shadow-inner backdrop-blur-md"
            required
            disabled={loading}
          />
          <div className="w-full">
            <PhoneInput
              country={'in'}
              value={phone.replace(/^\+/, '')}
              onChange={(phone: string) => setPhone('+' + phone)}
              inputClass="!w-full !bg-white/10 !text-white !rounded-xl !border !border-fuchsia-500/30 !placeholder-fuchsia-200 !focus:outline-none !focus:ring-2 !focus:ring-fuchsia-400 !focus:border-fuchsia-400 !transition-all !text-base !shadow-inner !backdrop-blur-md !py-3 !pl-14 !pr-4"
              buttonClass="!bg-transparent !border-none !rounded-l-xl !h-full !flex !items-center !justify-center"
              dropdownClass="!bg-[#18122b] !text-white !rounded-xl !border-none !shadow-lg"
              containerClass="!w-full"
              enableSearch
              disableDropdown={loading}
              inputStyle={{ minHeight: '48px', fontSize: '1rem', background: 'transparent', color: 'white', border: 'none' }}
              buttonStyle={{ background: 'transparent', border: 'none', borderRadius: '0.75rem 0 0 0.75rem', height: '48px' }}
              disabled={loading}
            />
          </div>
          {error && <div className="text-red-400 text-sm font-semibold -mt-4 mb-2">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-1 sm:mt-2 bg-gradient-to-r from-cyan-400 to-fuchsia-500 hover:from-fuchsia-500 hover:to-cyan-400 text-white px-6 py-3 rounded-xl font-bold text-base sm:text-lg shadow-lg transition-all duration-300 border-2 border-white/20 hover:scale-105 hover:shadow-2xl backdrop-blur-xl flex items-center justify-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                Saving...
              </>
            ) : (
              'Save & Continue'
            )}
          </button>
        </form>
      </div>
    </div>
  )
} 