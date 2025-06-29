'use client'

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { AppDispatch, RootState } from '@/store'
import { setTournaments, setLoading, setError } from '@/store/slices/tournamentSlice'
import Link from 'next/link'
import { FaDiscord, FaInstagram, FaYoutube, FaTwitter, FaTrophy, FaUsers, FaStar, FaArrowRight } from 'react-icons/fa'
import Navigation from '@/components/Navigation'

const socialLinks = [
  { href: 'https://discord.gg/', icon: <FaDiscord />, label: 'Discord' },
  { href: 'https://instagram.com/', icon: <FaInstagram />, label: 'Instagram' },
  { href: 'https://youtube.com/', icon: <FaYoutube />, label: 'YouTube' },
  { href: 'https://twitter.com/', icon: <FaTwitter />, label: 'Twitter' },
]

export default function Home() {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-start">
      <Navigation />
      {/* Background image with absolute positioning */}
      <div className="absolute inset-0 w-full h-full -z-10 bg-black">
        <img
          src="/app/images/esports%20bg.webp"
          alt="Esports Background"
          className="w-full h-full object-cover object-center"
          style={{ opacity: 0.7 }}
        />
        {/* Blue-black overlay for modern effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a23]/80 via-blue-900/60 to-[#18122b]/90 mix-blend-multiply pointer-events-none" />
      </div>
      {/* Main content restored */}
      <main className="w-full flex flex-col items-center justify-start">
        {/* Hero Section */}
        <section className="w-full flex flex-col items-center justify-center pt-40 pb-16 text-center select-none">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-lg" style={{ fontFamily: "'Orbitron', 'Inter', sans-serif" }}>
            Monetize your passion for gaming
          </h1>
          <h2 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-blue-400 text-transparent bg-clip-text mb-4">
            Instant payments USDC
          </h2>
          <p className="text-lg md:text-xl text-fuchsia-100 mb-8 max-w-2xl mx-auto">
            Join the eSports platform and earn money!
          </p>
          <button className="bg-gradient-to-r from-cyan-400 to-fuchsia-500 hover:from-fuchsia-500 hover:to-cyan-400 text-white px-10 py-3 rounded-full font-bold text-lg shadow-lg transition-all duration-300 border-2 border-white/20 hover:scale-105 hover:shadow-2xl backdrop-blur-xl">
            BEGIN
          </button>
        </section>
        {/* Feature Cards */}
        <section className="w-full flex flex-col items-center justify-center pb-12">
          <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl justify-center">
            <div className="flex-1 bg-white/10 border border-cyan-400/30 rounded-2xl p-6 min-w-[260px] max-w-xs mx-auto backdrop-blur-lg shadow-xl flex flex-col items-center text-center">
              <FaTrophy className="text-3xl text-cyan-400 mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">ENTER AND EARN</h3>
              <p className="text-fuchsia-100 text-sm mb-2">Compete in thousands of free eSports tournaments.</p>
              <span className="text-cyan-300 text-xs font-semibold">30,000+ TOURNAMENTS</span>
            </div>
            <div className="flex-1 bg-white/10 border border-fuchsia-400/30 rounded-2xl p-6 min-w-[260px] max-w-xs mx-auto backdrop-blur-lg shadow-xl flex flex-col items-center text-center">
              <FaUsers className="text-3xl text-fuchsia-400 mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">ORGANIZE IT YOUR WAY</h3>
              <p className="text-fuchsia-100 text-sm mb-2">Organize tournaments in just one click, easily and quickly.</p>
              <span className="text-fuchsia-300 text-xs font-semibold">500K+ GAMERS</span>
            </div>
            <div className="flex-1 bg-white/10 border border-yellow-400/30 rounded-2xl p-6 min-w-[260px] max-w-xs mx-auto backdrop-blur-lg shadow-xl flex flex-col items-center text-center">
              <FaStar className="text-3xl text-yellow-400 mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">QUESTS AND REWARDS</h3>
              <p className="text-fuchsia-100 text-sm mb-2">Tasks, predictions, and quizzes every day for rewards.</p>
              <span className="text-yellow-300 text-xs font-semibold">₹2.5M+ IN PRIZES</span>
            </div>
          </div>
        </section>
        {/* Investors Row */}
        <section className="w-full flex flex-col items-center justify-center pb-10">
          <div className="max-w-5xl w-full flex flex-wrap justify-center items-center gap-8 py-4">
            {["BINANCE", "BITKRAFT", "COINFUND", "MESH", "SOFTBANK"].map((name) => (
              <span key={name} className="bg-white/10 px-6 py-2 rounded-xl text-white/70 text-lg font-bold tracking-wide shadow-md border border-white/10">
                {name}
              </span>
            ))}
          </div>
        </section>
        {/* Promo Banner */}
        <section className="w-full flex flex-col items-center justify-center pb-10">
          <div className="max-w-4xl w-full bg-gradient-to-r from-cyan-500/20 via-fuchsia-500/20 to-blue-500/20 border border-fuchsia-400/30 rounded-2xl px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl backdrop-blur-lg">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-fuchsia-400 rounded-full flex items-center justify-center">
                <FaArrowRight className="text-white text-3xl" />
              </div>
              <div>
                <h4 className="text-white text-xl font-bold mb-1">Introducing the ₹ZELMU token!</h4>
                <p className="text-fuchsia-100 text-sm">The ZELMU token is coming soon. Learn more about its features, utility, and more!</p>
              </div>
            </div>
            <button className="bg-gradient-to-r from-cyan-400 to-fuchsia-500 hover:from-fuchsia-500 hover:to-cyan-400 text-white px-6 py-2 rounded-full font-bold text-base shadow-lg transition-all duration-300 border-2 border-white/20 hover:scale-105 hover:shadow-2xl">
              FIND OUT MORE
            </button>
          </div>
        </section>
        {/* News Row */}
        <section className="w-full flex flex-col items-center justify-center pb-20">
          <div className="max-w-6xl w-full flex flex-col">
            <h5 className="text-white text-2xl font-bold mb-6">NEWS</h5>
            <div className="flex flex-col md:flex-row gap-6 w-full">
              {[1,2,3,4].map((n) => (
                <div key={n} className="flex-1 bg-white/10 border border-fuchsia-400/20 rounded-2xl p-4 min-w-[220px] max-w-xs mx-auto backdrop-blur-lg shadow-lg flex flex-col">
                  <div className="h-32 w-full bg-gradient-to-br from-fuchsia-500/30 to-blue-500/30 rounded-xl mb-3" />
                  <h6 className="text-white font-bold mb-2">Dummy News Headline {n}</h6>
                  <p className="text-fuchsia-100 text-xs mb-2">Short description for news item {n} goes here.</p>
                  <span className="text-fuchsia-300 text-xs font-semibold mt-auto">READ MORE</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
} 