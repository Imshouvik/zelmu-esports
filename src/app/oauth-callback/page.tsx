"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import { FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        setLoading(true);
        
        // Get the current user after OAuth redirect
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error('OAuth callback error:', userError);
          setError('Failed to authenticate. Please try again.');
          setLoading(false);
          return;
        }

        console.log('OAuth callback - User authenticated:', user.email);

        // Check if user exists in users table
        const { data: existingUser, error: dbError } = await supabase
          .from('users')
          .select('id, name, phone')
          .eq('id', user.id)
          .single();

        if (dbError) {
          // User doesn't exist in users table - create them
          if (dbError.code === 'PGRST116') {
            console.log('OAuth callback - Creating user in users table...');
            
            // Extract user data from OAuth metadata
            const name = user.user_metadata?.full_name || user.user_metadata?.name || '';
            const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/adventurer/svg?seed=zelmu';
            const oauthAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || DEFAULT_AVATAR;
            
            // Insert into users table - match the actual schema
            const { error: insertError } = await supabase.from('users').insert([{
              id: user.id,
              email: user.email,
              name,
              phone: '', // Social providers don't provide phone
              created_at: new Date().toISOString(),
              role: 'user',
              avatar_url: oauthAvatar
              // Note: fcm_token will be null initially
            }]);

            if (insertError) {
              console.error('OAuth callback - Error creating user:', insertError);
              setError('Failed to create user profile. Please try again.');
              setLoading(false);
              return;
            }

            console.log('OAuth callback - User created successfully');
            toast.success('Account created successfully! Please complete your profile.');
            
            // Redirect to complete profile since no phone number
            router.push('/complete-profile');
          } else {
            console.error('OAuth callback - Database error:', dbError);
            setError('Database error. Please try again.');
            setLoading(false);
          }
        } else {
          // User exists in users table
          console.log('OAuth callback - User exists, checking phone number...');
          
          if (!existingUser.phone) {
            console.log('OAuth callback - User has no phone, redirecting to complete-profile');
            router.push('/complete-profile');
          } else {
            console.log('OAuth callback - User is complete, redirecting to dashboard');
            toast.success('Welcome back!');
            router.push('/dashboard');
          }
        }
      } catch (err) {
        console.error('OAuth callback - Unexpected error:', err);
        setError('An unexpected error occurred. Please try again.');
        setLoading(false);
      }
    };

    handleOAuthCallback();
  }, [router]);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center">
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
      
      {/* Loading/Error card */}
      <div className="relative z-10 w-full max-w-md mx-auto px-6 py-10 sm:px-10 sm:py-12 rounded-3xl backdrop-blur-2xl bg-white/10 border border-fuchsia-500/30 shadow-2xl flex flex-col items-center text-center">
        <span className="bg-white/10 px-6 py-2 rounded-full text-white text-2xl font-extrabold tracking-widest shadow-lg mb-4" style={{ fontFamily: 'Orbitron, Inter, sans-serif', letterSpacing: '0.15em' }}>
          ZELMU
        </span>
        
        {loading ? (
          <>
            <div className="flex items-center gap-3 text-white mb-4">
              <FaSpinner className="animate-spin text-2xl" />
              <span className="text-lg">Processing login...</span>
            </div>
            <p className="text-fuchsia-100 text-sm">Please wait while we set up your account.</p>
          </>
        ) : error ? (
          <>
            <h2 className="text-2xl font-bold text-white mb-4 drop-shadow-lg">Login Error</h2>
            <p className="text-red-200 text-sm mb-4">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-gradient-to-r from-cyan-400 to-fuchsia-500 hover:from-fuchsia-500 hover:to-cyan-400 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105"
            >
              Back to Login
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
} 