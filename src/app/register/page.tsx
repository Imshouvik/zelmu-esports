'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabaseClient'
import Navigation from '@/components/Navigation'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { useSelector } from 'react-redux';  
import { RootState } from '@/store';
import { Country, State, City } from 'country-state-city';
import { FaSpinner, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

export default function RegisterPage() {
  const router = useRouter();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const authLoading = useSelector((state: RootState) => state.auth.loading);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  // All hooks must be called unconditionally
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('IN');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/adventurer/svg?seed=zelmu';
  const [zelmuname, setZelmuname] = useState('');
  const [zelmunameAvailable, setZelmunameAvailable] = useState<boolean | null>(null);
  const [checkingZelmuname, setCheckingZelmuname] = useState(false);

  const countries = Country.getAllCountries();
  const states = State.getStatesOfCountry(country);
  const cities = State.getStateByCodeAndCountry(state, country) ? City.getCitiesOfState(country, state) : [];

  useEffect(() => { setState(''); setCity(''); }, [country]);
  useEffect(() => { setCity(''); }, [state]);

  // Debounced zelmuname check
  useEffect(() => {
    if (!zelmuname) {
      setZelmunameAvailable(null);
      return;
    }
    setCheckingZelmuname(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-zelmuname?zelmuname=${encodeURIComponent(zelmuname)}`);
        const data = await res.json();
        setZelmunameAvailable(data.available);
      } catch {
        setZelmunameAvailable(null);
      } finally {
        setCheckingZelmuname(false);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [zelmuname]);

  if (authLoading) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    let avatarUrl = DEFAULT_AVATAR;
    
    if (!phone) {
      setError('Phone number is required.')
      setLoading(false)
      return
    }

    if (!country || !state || !city) {
      setError('Country, state, and city are required.');
      setLoading(false);
      return;
    }

    if (!zelmuname) {
      setError('Zelmu Name is required.');
      setLoading(false);
      return;
    }
    if (!zelmunameAvailable) {
      setError('Zelmu Name is not available.');
      setLoading(false);
      return;
    }

    try {
      // Step 0: Check if email already exists in users table
      const { data: existingUser, error: checkError } = await supabase!
        .from('users')
        .select('id, email, created_at')
        .eq('email', email)
        .single()

      if (existingUser) {
        // Email exists in users table
        setError('An account with this email already exists. Please try logging in instead.')
        setLoading(false)
        return
      }

      // Step 1: Create the user in Supabase Auth with redirectTo option
      const { data, error: signUpError } = await supabase!.auth.signUp({
        email,
        password,
        options: {
          data: { 
            name, 
            phone,
            country,
            state,
            city,
            zelmuname,
            full_name: name // Add this for better compatibility
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      })

      if (signUpError) {
        // Handle specific Supabase auth errors
        if (signUpError.message.includes('already registered')) {
          setError('An account with this email already exists. Please try logging in instead.')
        } else {
          setError(signUpError.message)
        }
        setLoading(false)
        return
      }

      if (data.user) {
        // Step 2: Immediately create user in users table with all details
        const { error: insertError } = await supabase!
          .from('users')
          .insert([{ 
            id: data.user.id, 
            email, 
            name, 
            phone, 
            country,
            state,
            city,
            zelmuname,
            created_at: new Date().toISOString(),
            role: 'user',
            avatar_url: avatarUrl
          }])

        if (insertError) {
          console.error('Error creating user in database:', insertError)
          setError('Failed to create user profile. Please try again.')
          setLoading(false)
          return
        }

        console.log('User created successfully in database with phone number:', phone)
        
        // Step 3: Check if there's a pending invite code
        const pendingInviteCode = localStorage.getItem('pendingInviteCode')
        
        if (pendingInviteCode) {
          // Clear the pending invite code
          localStorage.removeItem('pendingInviteCode')
        }
        
        // Redirect to login with success message
        console.log('Registration successful, redirecting to login...')
        router.push('/login?message=email_sent&email=' + encodeURIComponent(email))
        console.log('Redirect command sent to login')
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center">
      {/* Navigation removed for register page */}
      {/* Background image with blue-black overlay */}
      <div className="absolute inset-0 w-full h-full -z-10 bg-black">
        <img
          src="/app/images/esports%20bg.webp"
          alt="Esports Background"
          className="w-full h-full object-cover object-center"
          style={{ opacity: 0.7 }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a23]/80 via-blue-900/60 to-[#18122b]/90 mix-blend-multiply pointer-events-none" />
      </div>
      {/* Glassmorphic register card */}
      <div className="relative z-10 w-full max-w-md mx-auto px-6 py-10 sm:px-10 sm:py-12 rounded-3xl backdrop-blur-2xl bg-white/10 border border-fuchsia-500/30 shadow-2xl flex flex-col items-center text-center" style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
        {/* Logo and title */}
        <span className="bg-white/10 px-6 py-2 rounded-full text-white text-2xl font-extrabold tracking-widest shadow-lg mb-4" style={{ fontFamily: 'Orbitron, Inter, sans-serif', letterSpacing: '0.15em' }}>
          ZELMU
        </span>
        <h2 className="text-3xl font-bold text-white mb-8 drop-shadow-lg">Register</h2>
        {/* Register form */}
        <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
          {/* Full Name with floating label */}
          <div className="relative w-full">
            <input
              type="text"
              id="register-name"
              placeholder=" "
              value={name}
              onChange={e => setName(e.target.value)}
              className="peer w-full px-5 py-3 rounded-xl bg-white/10 border border-fuchsia-500/30 text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 transition-all text-base shadow-inner backdrop-blur-md"
              required
              disabled={loading}
            />
            <label htmlFor="register-name" className="absolute left-5 top-1/2 -translate-y-1/2 text-fuchsia-200 text-base pointer-events-none transition-all duration-200 bg-transparent px-1
              peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-xs peer-focus:text-fuchsia-400
              peer-not-placeholder-shown:top-2 peer-not-placeholder-shown:-translate-y-0 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-fuchsia-400">
              Full Name
            </label>
          </div>
          {/* Phone input unchanged */}
          <div className="w-full">
            <PhoneInput
              country={'in'}
              value={phone}
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
          {/* Zelmu Name with floating label */}
          <div className="w-full flex flex-col gap-2 relative">
            <div className="relative">
              <input
                type="text"
                id="register-zelmuname"
                placeholder=" "
                value={zelmuname}
                onChange={e => setZelmuname(e.target.value.replace(/\s/g, ''))}
                className="peer w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border border-fuchsia-500/30 text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 transition-all text-base shadow-inner backdrop-blur-md"
                required
                disabled={loading}
                minLength={3}
                maxLength={20}
                autoComplete="off"
              />
              <label htmlFor="register-zelmuname" className="absolute left-4 top-1/2 -translate-y-1/2 text-fuchsia-200 text-base pointer-events-none transition-all duration-200 bg-transparent px-1
                peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-xs peer-focus:text-fuchsia-400
                peer-not-placeholder-shown:top-2 peer-not-placeholder-shown:-translate-y-0 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-fuchsia-400">
                Zelmu Name (unique)
              </label>
              {/* Spinner or check/cross icon */}
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {checkingZelmuname && <FaSpinner className="animate-spin text-green-400 w-5 h-5" />}
                {!checkingZelmuname && zelmuname && zelmunameAvailable === true && <FaCheckCircle className="text-green-400 w-5 h-5" />}
                {!checkingZelmuname && zelmuname && zelmunameAvailable === false && <FaTimesCircle className="text-red-400 w-5 h-5" />}
              </span>
            </div>
            {zelmuname && (
              <span className={`text-xs mt-1 ${zelmunameAvailable === null ? 'text-gray-400' : zelmunameAvailable ? 'text-green-400' : 'text-red-400'}`}>
                {checkingZelmuname ? 'Checking availability...' : zelmunameAvailable === null ? '' : zelmunameAvailable ? 'Available!' : 'Not available'}
              </span>
            )}
          </div>
          {/* Country/State/City unchanged */}
          <div className="w-full flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <label className="block text-left text-fuchsia-200 text-sm mb-1">Country</label>
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-fuchsia-500/30 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 transition-all text-base shadow-inner backdrop-blur-md"
                required
                disabled={loading}
              >
                {countries.map(c => (
                  <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-left text-fuchsia-200 text-sm mb-1">State</label>
              <select
                value={state}
                onChange={e => setState(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-fuchsia-500/30 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 transition-all text-base shadow-inner backdrop-blur-md"
                required
                disabled={loading || !country}
              >
                <option value="" disabled>Select state</option>
                {states.map(s => (
                  <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-left text-fuchsia-200 text-sm mb-1">City</label>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-fuchsia-500/30 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 transition-all text-base shadow-inner backdrop-blur-md"
                required
                disabled={loading || !state}
              >
                <option value="" disabled>Select city</option>
                {cities.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Email with floating label */}
          <div className="relative w-full">
            <input
              type="email"
              id="register-email"
              placeholder=" "
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="peer w-full px-5 py-3 rounded-xl bg-white/10 border border-fuchsia-500/30 text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 transition-all text-base shadow-inner backdrop-blur-md"
              required
              disabled={loading}
            />
            <label htmlFor="register-email" className="absolute left-5 top-1/2 -translate-y-1/2 text-fuchsia-200 text-base pointer-events-none transition-all duration-200 bg-transparent px-1
              peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-xs peer-focus:text-fuchsia-400
              peer-not-placeholder-shown:top-2 peer-not-placeholder-shown:-translate-y-0 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-fuchsia-400">
              Email
            </label>
          </div>
          {/* Password with floating label */}
          <div className="relative w-full">
            <input
              type="password"
              id="register-password"
              placeholder=" "
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="peer w-full px-5 py-3 rounded-xl bg-white/10 border border-fuchsia-500/30 text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 transition-all text-base shadow-inner backdrop-blur-md"
              required
              disabled={loading}
            />
            <label htmlFor="register-password" className="absolute left-5 top-1/2 -translate-y-1/2 text-fuchsia-200 text-base pointer-events-none transition-all duration-200 bg-transparent px-1
              peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-xs peer-focus:text-fuchsia-400
              peer-not-placeholder-shown:top-2 peer-not-placeholder-shown:-translate-y-0 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-fuchsia-400">
              Password
            </label>
          </div>
          {error && <div className="text-red-400 text-sm font-semibold -mt-4 mb-2">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-2 bg-gradient-to-r from-cyan-400 to-fuchsia-500 hover:from-fuchsia-500 hover:to-cyan-400 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 border-2 border-white/20 hover:scale-105 hover:shadow-2xl backdrop-blur-xl ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        <p className="mt-6 text-fuchsia-100 text-sm">
          Already have an account?{' '}
          <a href="/login" className="text-fuchsia-300 hover:underline">Login</a>
        </p>
      </div>
    </div>
  )
} 