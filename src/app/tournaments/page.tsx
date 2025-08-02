'use client'

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { AppDispatch, RootState } from '@/store'
import { setTournaments, setLoading, setError } from '@/store/slices/tournamentSlice'
import Link from 'next/link'
import Image from 'next/image'
import BackButton from '@/components/BackButton'
import PageGuard from '@/components/PageGuard'
import { supabase } from '@/utils/supabaseClient'

type Filter = {
  game: string
  status: string
  minPrize: number
}

export default function TournamentsPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { tournaments, loading } = useSelector((state: RootState) => state.tournaments)
  const [filters, setFilters] = useState<Filter>({
    game: 'all',
    status: 'all',
    minPrize: 0,
  })

  useEffect(() => {
    const fetchTournaments = async () => {
      dispatch(setLoading(true))
      try {
        const { data, error } = await supabase!
          .from('tournaments')
          .select('*')
          .order('start_date', { ascending: true });
        
        if (error) {
          console.error('Error fetching tournaments:', error);
          dispatch(setError('Failed to fetch tournaments'));
        } else {
          // Transform the data to match the Tournament interface
          const transformedTournaments = data?.map((t: any) => ({
            id: t.id,
            title: t.title,
            game: t.game as 'BGMI' | 'Free Fire' | 'Football',
            startDate: t.start_date,
            endDate: t.end_date,
            prizePool: t.prize_pool,
            registrationFee: t.registration_fee || 0,
            maxTeams: t.max_teams || 64,
            currentTeams: t.current_teams || 0,
            status: t.status as 'upcoming' | 'ongoing' | 'completed',
            type: t.type as 'open' | 'club',
            is_featured: t.is_featured || false,
            is_upcoming: t.is_upcoming || false,
            rules: t.rules || [],
            rewards: t.rewards || [],
            created_by: t.created_by,
            created_at: t.created_at
          })) || [];
          
          dispatch(setTournaments(transformedTournaments))
        }
      } catch (error) {
        console.error('Error fetching tournaments:', error);
        dispatch(setError('Failed to fetch tournaments'))
      }
    }

    fetchTournaments()
  }, [dispatch])

  const filteredTournaments = tournaments.filter((tournament) => {
    if (filters.game !== 'all' && tournament.game !== filters.game) return false
    if (filters.status !== 'all' && tournament.status !== filters.status) return false
    if (tournament.prizePool < filters.minPrize) return false
    return true
  })

  return (
    <PageGuard pageKey="tournaments">
      <div className="min-h-screen bg-gray-50 py-12">
        <BackButton />
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8">Tournaments</h1>

          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="game" className="block text-sm font-medium text-gray-700 mb-2">
                  Game
                </label>
                <select
                  id="game"
                  value={filters.game}
                  onChange={(e) => setFilters({ ...filters, game: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                >
                  <option value="all">All Games</option>
                  <option value="BGMI">BGMI</option>
                  <option value="Free Fire">Free Fire</option>
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                >
                  <option value="all">All Status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label htmlFor="minPrize" className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Prize Pool
                </label>
                <input
                  type="number"
                  id="minPrize"
                  value={filters.minPrize}
                  onChange={(e) => setFilters({ ...filters, minPrize: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter minimum prize pool"
                />
              </div>
            </div>
          </div>

          {/* Featured Tournament - ZBCC Season 1 */}
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg shadow-2xl overflow-hidden border-2 border-blue-400"
            >
              <div className="p-8 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Image src="/app/images/BGMI logo.webp" alt="BGMI Logo" width={60} height={60} className="rounded-lg" />
                    <div>
                      <h2 className="text-3xl font-bold text-blue-300">ZELMU BGMI CLUB Championship</h2>
                      <p className="text-xl text-blue-200">Season 1</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-400">₹50,000</div>
                    <div className="text-sm text-gray-300">Prize Pool</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">192</div>
                    <div className="text-sm text-gray-300">Teams</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">17</div>
                    <div className="text-sm text-gray-300">Matches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">960</div>
                    <div className="text-sm text-gray-300">Players</div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-300 mb-6">
                  <p><strong>Dates:</strong> August 5-15, 2025</p>
                  <p><strong>Type:</strong> Club Championship</p>
                  <p><strong>Status:</strong> <span className="text-green-400 font-semibold">Upcoming</span></p>
                </div>
                
                <div className="flex gap-4">
                  <Link
                    href="/tournaments/zbcc-season1"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold text-center transition-colors"
                  >
                    View Tournament Details
                  </Link>
                  <button 
                    onClick={() => window.open('mailto:contact@zelmu.com?subject=ZBCC Season 1 Registration', '_blank')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Register Now
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Tournament List */}
          {loading ? (
            <div className="text-center">Loading tournaments...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments.map((tournament) => (
                <motion.div
                  key={tournament.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-lg shadow-lg overflow-hidden"
                >
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{tournament.title}</h3>
                    <div className="flex items-center text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        {tournament.game === 'BGMI' && (
                          <Image src="/app/images/BGMI logo.webp" alt="BGMI Logo" width={20} height={20} className="inline-block rounded bg-white/10" />
                        )}
                        <span>{tournament.game}</span>
                      </div>
                      <span className="mx-2">•</span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                        {tournament.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-gray-600">
                      <p>Prize Pool: ₹{tournament.prizePool.toLocaleString()}</p>
                      <p>Registration Fee: ₹{tournament.registrationFee}</p>
                      <p>Start Date: {new Date(tournament.startDate).toLocaleDateString()}</p>
                      <p>Teams: {tournament.currentTeams}/{tournament.maxTeams}</p>
                      <p>Type: {tournament.type === 'open' ? 'Open' : 'Club'}</p>
                      {tournament.is_featured && <p className="text-orange-600 font-semibold">⭐ Featured</p>}
                    </div>
                    <Link
                      href={`/tournaments/${tournament.id}`}
                      className="mt-4 block text-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageGuard>
  )
} 