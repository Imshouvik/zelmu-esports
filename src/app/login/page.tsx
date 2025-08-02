'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import { supabase } from '@/utils/supabaseClient'
import { FaGoogle, FaFacebook, FaDiscord, FaCheck } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

function LoginPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  // Get the redirect URL from query parameters
  const redirectTo = searchParams?.get('redirect') || '/dashboard'
  const confirmed = searchParams?.get('confirmed')
  const message = searchParams?.get('message')
  const userEmail = searchParams?.get('email')

  useEffect(() => {
    // Show success message if user just confirmed their email
    if (confirmed === '1') {
      setShowSuccess(true)
      toast.success('Email confirmed successfully! You can now log in.')
    }
    
    // Show success message if user just registered
    if (message === 'email_sent' && userEmail) {
      setShowSuccess(true)
      setEmail(userEmail) // Pre-fill the email field
    }
  }, [confirmed, message, userEmail])

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, redirectTo, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!supabase) {
      setError('Supabase client not available.');
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      console.error('Login error:', error); // Debug log
      // Handle specific login errors
      if (error.message.includes('Email not confirmed')) {
        setError('Please confirm your email address before logging in. Use the "Resend Confirmation Email" button below if needed.')
      } else if (error.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials and try again.')
      } else if (error.code === 'user_not_found') {
        setError('No account registered with this email address.')
      } else {
        setError(error.message)
      }
    } else {
      router.push(redirectTo)
    }
  }

  // Social login handler
  const handleOAuthLogin = async (provider: 'google' | 'facebook' | 'discord') => {
    if (!supabase) {
      setError('Supabase client not available.');
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + '/oauth-callback', // Works for both local and production
      },
    });
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email address first.')
      return
    }

    setResendLoading(true)
    setError('')
    if (!supabase) {
      setError('Supabase client not available.');
      setResendLoading(false);
      return;
    }
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })

      if (error) {
        setError(error.message)
      } else {
        setShowSuccess(true)
        toast.success('Confirmation email sent! Please check your inbox.')
      }
    } catch (err) {
      setError('Failed to send confirmation email. Please try again.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center">
      {/* Navigation removed for login page */}
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
      {/* Glassmorphic login card */}
      <div
        className="relative z-10 w-full max-w-xs sm:max-w-md mx-2 sm:mx-auto px-4 py-8 sm:px-8 sm:py-12 rounded-2xl sm:rounded-3xl backdrop-blur-2xl bg-white/10 border border-fuchsia-500/40 shadow-2xl flex flex-col items-center text-center"
        style={{
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          border: '1.5px solid rgba(255, 0, 255, 0.12)',
        }}
      >
        {/* Logo and title */}
        <span className="bg-white/10 px-5 py-2 rounded-full text-white text-2xl font-extrabold tracking-widest shadow-lg mb-4" style={{ fontFamily: 'Orbitron, Inter, sans-serif', letterSpacing: '0.15em' }}>
          ZELMU
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 drop-shadow-lg">Login</h2>
        
        {/* Success message for email confirmation or registration */}
        {showSuccess && (
          <div className="w-full mb-6 p-3 bg-green-500/20 border border-green-400/30 rounded-lg flex items-center gap-2">
            <FaCheck className="text-green-400 flex-shrink-0" />
            <span className="text-green-200 text-sm">
              {message === 'email_sent' 
                ? `Registration successful! Please check your email (${userEmail}) and click the confirmation link to activate your account.`
                : 'Account activation link sent to your email again. Please check your inbox and click the link to activate your account.'
              }
            </span>
          </div>
        )}
        
        {/* Login form */}
        <form className="w-full flex flex-col gap-4 sm:gap-6" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 sm:px-5 rounded-xl bg-white/10 border border-fuchsia-500/30 text-white placeholder-fuchsia-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 transition-all text-base shadow-inner backdrop-blur-md"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 sm:px-5 rounded-xl bg-white/10 border border-fuchsia-500/30 text-white placeholder-fuchsia-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 transition-all text-base shadow-inner backdrop-blur-md"
          />
          {error && <div className="text-red-400 text-sm font-semibold -mt-4 mb-2">{error}</div>}
          <button
            type="submit"
            className="w-full mt-1 sm:mt-2 bg-gradient-to-r from-cyan-400 to-fuchsia-500 hover:from-fuchsia-500 hover:to-cyan-400 text-white px-6 py-3 rounded-xl font-bold text-base sm:text-lg shadow-lg transition-all duration-300 border-2 border-white/20 hover:scale-105 hover:shadow-2xl backdrop-blur-xl"
          >
            Login
          </button>
          
          {/* Resend confirmation button - only show when needed */}
          {(error.includes('Email not confirmed') || error.includes('confirm your email') || message === 'email_sent') && (
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={resendLoading || !email}
              className={`w-full mt-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                resendLoading || !email
                  ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                  : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
              } shadow-lg`}
            >
              {resendLoading ? 'Sending...' : 'Resend Confirmation Email'}
            </button>
          )}
        </form>
        {/* Divider below login form */}
        <div className="flex items-center w-full my-6">
          <div className="flex-grow border-t border-fuchsia-400/30"></div>
          <span className="mx-4 text-fuchsia-200 text-xs uppercase tracking-widest font-semibold">or</span>
          <div className="flex-grow border-t border-fuchsia-400/30"></div>
        </div>
        {/* Social Login Buttons below divider */}
        <div className="w-full flex flex-row gap-4 justify-center mb-6">
          <button
            onClick={() => handleOAuthLogin('google')}
            className="bg-white text-[#4285F4] p-4 sm:p-3 rounded-full shadow-lg hover:scale-110 transition-all duration-200 border-2 border-white/30 hover:border-[#4285F4] focus:outline-none focus:ring-2 focus:ring-[#4285F4] focus:ring-offset-2"
            type="button"
            title="Login with Google"
          >
            <FaGoogle className="w-6 h-6 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => handleOAuthLogin('facebook')}
            className="bg-blue-600 text-white p-4 sm:p-3 rounded-full shadow-lg hover:scale-110 transition-all duration-200 border-2 border-white/30 hover:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
            type="button"
            title="Login with Facebook"
          >
            <FaFacebook className="w-6 h-6 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => handleOAuthLogin('discord')}
            className="bg-[#5865F2] text-white p-4 sm:p-3 rounded-full shadow-lg hover:scale-110 transition-all duration-200 border-2 border-white/30 hover:border-[#5865F2] focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:ring-offset-2"
            type="button"
            title="Login with Discord"
          >
            <FaDiscord className="w-6 h-6 sm:w-5 sm:h-5" />
          </button>
        </div>
        <p className="mt-4 sm:mt-6 text-fuchsia-100 text-sm">
          Don&apos;t have an account?{' '}
          <a href="/register" className="text-fuchsia-300 hover:underline">Register</a>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const authLoading = useSelector((state: RootState) => state.auth.loading);
  const router = useRouter();

  // Remove the useEffect in the default export that always pushes to /dashboard
  // if (!authLoading && isAuthenticated) {
  //   router.push('/dashboard');
  // }

  if (authLoading) return null;

  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
} 