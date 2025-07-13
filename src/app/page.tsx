'use client'

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import { FaGoogle, FaFacebook, FaDiscord, FaCheck } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { AppDispatch, RootState } from '@/store'
import { setTournaments, setLoading, setError } from '@/store/slices/tournamentSlice'
import Link from 'next/link'
import { FaTwitter, FaTrophy, FaUsers, FaStar, FaArrowRight } from 'react-icons/fa'
import Navigation from '@/components/Navigation'

const socialLinks = [
  { href: 'https://discord.gg/', icon: <FaDiscord />, label: 'Discord' },
  { href: 'https://twitter.com/', icon: <FaTwitter />, label: 'Twitter' },
];

export default function Home() {
  // All hooks at the top!
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const loading = useSelector((state: RootState) => state.auth.loading);
  const router = require('next/navigation').useRouter();
  const searchParams = require('next/navigation').useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const redirectTo = searchParams?.get('redirect') || '/dashboard';
  const confirmed = searchParams?.get('confirmed');
  const message = searchParams?.get('message');
  const userEmail = searchParams?.get('email');

  useEffect(() => {
    if (confirmed === '1') {
      setShowSuccess(true);
      toast.success('Email confirmed successfully! You can now log in.');
    }
    if (message === 'email_sent' && userEmail) {
      setShowSuccess(true);
      setEmail(userEmail);
    }
  }, [confirmed, message, userEmail]);

  if (loading) return null;
  if (isAuthenticated) return null;

  if (typeof window === 'undefined' || !supabase) {
    throw new Error('Supabase client is not available on the server.');
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const { error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        setError('Please confirm your email address before logging in. Use the "Resend Confirmation Email" button below if needed.');
      } else if (error.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else {
        setError(error.message);
      }
    } else {
      router.push(redirectTo);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'facebook' | 'discord') => {
    await supabase!.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + '/oauth-callback' },
    });
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setResendLoading(true);
    setError('');
    try {
      const { error } = await supabase!.auth.resend({ type: 'signup', email });
      if (error) {
        setError(error.message);
      } else {
        setShowSuccess(true);
        toast.success('Confirmation email sent! Please check your inbox.');
      }
    } catch (err) {
      setError('Failed to send confirmation email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-gradient-to-br from-purple-100 via-fuchsia-50 to-blue-100 font-sans">
      <main className="flex flex-1 flex-col md:flex-row items-center justify-center w-full max-w-7xl mx-auto px-2 sm:px-4 py-6 sm:py-12 gap-6 md:gap-12">
        {/* Hero Section: Logo and tagline */}
        <div className="flex-1 flex flex-col items-center md:items-start justify-center max-w-lg w-full mb-8 md:mb-0">
          <div className="w-full flex flex-col items-center md:items-start">
            <span className="text-black text-4xl xs:text-5xl md:text-6xl font-extrabold mb-4 sm:mb-6 select-none tracking-tight text-center md:text-left" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.04em' }}>
              Zelmu
            </span>
            <div className="w-20 h-2 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 rounded-full mb-4 sm:mb-6 mx-auto md:mx-0" />
            <h2 className="text-xl xs:text-2xl md:text-3xl font-semibold text-gray-900 mb-3 sm:mb-4 select-none text-center md:text-left">
              India’s Sports Gateway for Everyone
            </h2>
            <p className="text-base xs:text-lg text-gray-700 select-none text-center md:text-left mb-2 sm:mb-0">
              Play, compete, and grow your skills. Affordable tournaments, multilingual support, and real career opportunities for gamers in Tier 2-3 cities and beyond.
            </p>
          </div>
        </div>
        {/* Login card with social login, register button redirects */}
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 xs:p-8 sm:p-10 flex flex-col gap-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Log in to Zelmu</h2>
            {showSuccess && (
              <div className="w-full mb-4 p-3 bg-green-500/20 border border-green-400/30 rounded-lg flex items-center gap-2">
                <FaCheck className="text-green-400 flex-shrink-0" />
                <span className="text-green-700 text-sm">
                  {message === 'email_sent'
                    ? `Registration successful! Please check your email (${userEmail}) and click the confirmation link to activate your account.`
                    : 'Account activation link sent to your email again. Please check your inbox and click the link to activate your account.'}
                </span>
              </div>
            )}
            <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all text-base shadow-inner"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all text-base shadow-inner"
              />
              {error && <div className="text-red-500 text-sm font-semibold -mt-2 mb-2">{error}</div>}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:from-fuchsia-600 hover:to-purple-700 text-white font-bold py-3 rounded-lg shadow text-lg text-center transition-all duration-200 mt-2"
              >
                Log in
              </button>
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
            <div className="flex items-center w-full my-4">
              <div className="flex-grow border-t border-fuchsia-400/30"></div>
              <span className="mx-4 text-fuchsia-400 text-xs uppercase tracking-widest font-semibold">or</span>
              <div className="flex-grow border-t border-fuchsia-400/30"></div>
            </div>
            {/* Social Login Buttons below divider */}
            <div className="w-full flex flex-col gap-2 mb-2">
              <span className="text-xs text-gray-500 text-center mb-1">Continue with</span>
              <div className="flex flex-row gap-4 justify-center">
                <button
                  onClick={() => handleOAuthLogin('google')}
                  className="bg-white text-[#4285F4] p-4 rounded-full shadow-lg hover:scale-110 transition-all duration-200 border-2 border-white/30 hover:border-[#4285F4] focus:outline-none focus:ring-2 focus:ring-[#4285F4] focus:ring-offset-2"
                  type="button"
                  title="Login with Google"
                >
                  <FaGoogle className="w-6 h-6" />
                </button>
                <button
                  onClick={() => handleOAuthLogin('facebook')}
                  className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-all duration-200 border-2 border-white/30 hover:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
                  type="button"
                  title="Login with Facebook"
                >
                  <FaFacebook className="w-6 h-6" />
                </button>
                <button
                  onClick={() => handleOAuthLogin('discord')}
                  className="bg-[#5865F2] text-white p-4 rounded-full shadow-lg hover:scale-110 transition-all duration-200 border-2 border-white/30 hover:border-[#5865F2] focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:ring-offset-2"
                  type="button"
                  title="Login with Discord"
                >
                  <FaDiscord className="w-6 h-6" />
                </button>
              </div>
            </div>
            <button
              onClick={() => router.push('/register')}
              className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white font-bold py-3 rounded-lg shadow text-lg text-center transition-all duration-200 border border-gray-300 mt-2"
            >
              Create new account
            </button>
          </div>
        </div>
      </main>
      {/* Mobile Footer */}
      <footer className="w-full py-4 text-center text-xs text-gray-400 bg-transparent block md:hidden">
        Zelmu © {new Date().getFullYear()} | All rights reserved
      </footer>
    </div>
  );
} 