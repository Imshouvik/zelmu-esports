"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminNotificationBell from '@/components/AdminNotificationBell';
import NotificationBell from '@/components/NotificationBell';
import { FaBars } from 'react-icons/fa';
import MusicControl from '@/components/MusicControl';
import { useAudio } from '@/contexts/AudioContext';
import Link from 'next/link';

export default function ZBCCSeason1Page() {
  const router = useRouter();
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth);
  const [round1Expanded, setRound1Expanded] = useState(false);
  const [round2Expanded, setRound2Expanded] = useState(false);
  const [round3Expanded, setRound3Expanded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { isMusicPlaying, isAudioMuted, audioLoaded, isFirstLoad, cacheStatus } = useAudio();
  // Final stage teams data
  const finalTeams = [
    { slot: 1, name: 'Nabarun Songho' },
    { slot: 2, name: 'Tarun Sangha Club' },
    { slot: 3, name: 'Kamarthuba Pragati Sangha (K.P.S)' },
    { slot: 4, name: 'Birnagar Sporting Club' },
    { slot: 5, name: 'Banamalipur Five Star Club' },
    { slot: 6, name: 'Baghogra Association' },
    { slot: 7, name: 'Sweet Club' },
    { slot: 8, name: 'Murarai Amra Kojon Club' },
    { slot: 9, name: 'Arit Club' },
    { slot: 10, name: 'Subhas Sangha Club' },
    { slot: 11, name: 'Ranaghat Club Ten Star' },
    { slot: 12, name: 'Ghoshpur Cultural Association' },
    { slot: 13, name: 'Deshbondhu Park' },
    { slot: 14, name: 'Surya Sangha' },
    { slot: 15, name: 'Team Goregaon' },
    { slot: 16, name: 'Kalyangarh Ramkrishna Seba Samity' },
    { slot: 17, name: 'Navi Mumbai Kings' },
    { slot: 18, name: 'Borivali Group' },
    { slot: 19, name: 'Akra Club' },
    { slot: 20, name: 'Dinobondhu Club' },
    { slot: 21, name: 'Yuva Kalyan Samiti' },
    { slot: 22, name: 'Ajmer Warriors' },
    { slot: 23, name: 'Sirsa United' },
    { slot: 24, name: 'Baliadanga Vidyasagar Club' },
    { slot: 25, name: 'BIRBHUM United' }
  ];

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/tournaments/zbcc-season1');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

      return (
      <div className="min-h-screen bg-gradient-to-br from-[#18122b] to-[#232046] flex overflow-x-hidden">
        {/* Sidebar for desktop and mobile drawer */}
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Mobile menu button */}
        <button
          className="fixed top-4 left-4 z-40 md:hidden text-white p-4 focus:outline-none"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar menu"
        >
          <FaBars className="w-7 h-7" />
        </button>
        
        {/* Mobile notification bell */}
        <div className="fixed top-4 right-4 z-40 md:hidden p-4">
          <div className="w-7 h-7">
            <NotificationBell userId="user" />
          </div>
        </div>
        
        {/* Mobile Z-logo, Bar, and Music Control - Centered Group */}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 md:hidden flex items-center gap-4">
          <img 
            src="/app/images/Z-logo.png" 
            alt="ZELMU Logo" 
            className="w-14 h-14 object-contain ml-4"
          />
          <div className="w-px h-8 bg-white/50"></div>
          <MusicControl />
        </div>

        {/* Background Music Player - Desktop Only */}
        <div className="hidden md:block fixed top-6 left-6 z-50">
          <MusicControl />
        </div>

        {/* Notification Bell - Desktop Only */}
        <div className="hidden md:flex justify-end items-center fixed top-6 right-6 z-50">
          <NotificationBell userId="user" />
        </div>
       
        {/* Main content (add left margin for desktop sidebar) */}
        <main className="flex-1 md:ml-72 overflow-x-hidden">
          <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 w-full min-w-0 pt-24 md:pt-8">

          
          <style jsx>{`
            .bracket-box {
              background: #2D2D2D;
              border: 2px solid #00D1FF;
              border-radius: 8px;
              padding: 1rem;
              position: relative;
            }
            .group-table th, .group-table td {
              border: 1px solid #00D1FF;
              padding: 0.5rem;
              text-align: left;
            }
            .animate-pulse-slow {
              animation: pulse 3s ease-in-out infinite;
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.7; }
            }
          `}</style>
          <div className="bg-gray-900 rounded-lg shadow-2xl p-6 max-w-5xl w-full mx-auto text-white">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-6">
              <div className="w-24 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center text-white font-bold text-sm">
                ZELMU
              </div>
              <div className="w-36 h-36 rounded-full overflow-hidden">
                <img 
                  src="/app/images/BGMI logo.webp" 
                  alt="BGMI Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4" style={{
              textShadow: '0 0 15px #FFD700, 0 0 25px #FFD700, 0 0 35px #FF6B35',
              color: '#FFD700',
              background: 'linear-gradient(45deg, #FFD700, #FF6B35, #FFD700)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              ZELMU BGMI CLUB Championship - Season 1
            </h1>
            
            {/* View Leaderboard Button */}
            <div className="text-center mb-6">
              <Link
                href="/tournaments/zbcc-season1/leaderboard"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Leaderboard
              </Link>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-semibold text-red-500 mb-6">
              India's First & Biggest Club Championship for Esports
            </h2>

            {/* Search Section */}
            <div className="bg-gray-800 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-bold text-blue-400 mb-3">🔍 Search Your Club (FINAL Stage Only)</h3>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Enter your club name..."
                  className="flex-1 px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:border-blue-400"
                  onChange={(e) => {
                    const searchTerm = e.target.value.toLowerCase();
                    const rows = document.querySelectorAll('tbody tr');
                    let foundClubs: Array<{name: string, group: string}> = [];
                    
                    rows.forEach(row => {
                      // Skip Round 1 teams (they're in collapsed section)
                      const round1Section = row.closest('.bracket-box')?.querySelector('h4')?.textContent?.includes('Round 1');
                      if (round1Section) {
                        row.classList.add('hidden');
                        row.classList.remove('bg-yellow-600', 'bg-opacity-20');
                        return;
                      }
                      
                      const teamName = row.querySelector('td:last-child')?.textContent?.toLowerCase() || '';
                      if (teamName.includes(searchTerm)) {
                        row.classList.remove('hidden');
                        row.classList.add('bg-yellow-600', 'bg-opacity-20');
                        
                        // Find the group header for this team
                        const groupHeader = row.closest('div')?.querySelector('h5')?.textContent || '';
                        
                        // Only show FINAL stage matches in search results
                        if (groupHeader.includes('Final Group') || groupHeader.includes('August 15')) {
                          foundClubs.push({ name: row.querySelector('td:last-child')?.textContent || '', group: groupHeader });
                        }
                      } else {
                        row.classList.add('hidden');
                        row.classList.remove('bg-yellow-600', 'bg-opacity-20');
                      }
                    });
                    
                    // Show search results
                    const resultsDiv = document.getElementById('search-results');
                    const matchInfoDiv = document.getElementById('match-info');
                    if (resultsDiv && matchInfoDiv) {
                      if (foundClubs.length > 0 && searchTerm.length > 0) {
                        resultsDiv.classList.remove('hidden');
                        matchInfoDiv.innerHTML = foundClubs.map(club => 
                          `<div class="mb-1">🏆 <strong>${club.name}</strong> - ${club.group}</div>`
                        ).join('');
                      } else {
                        resultsDiv.classList.add('hidden');
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const rows = document.querySelectorAll('tbody tr');
                    rows.forEach(row => {
                      // Keep Round 1 teams hidden when clearing search
                      const round1Section = row.closest('.bracket-box')?.querySelector('h4')?.textContent?.includes('Round 1');
                      if (round1Section) {
                        row.classList.add('hidden');
                        row.classList.remove('bg-yellow-600', 'bg-opacity-20');
                      } else {
                        row.classList.remove('hidden', 'bg-yellow-600', 'bg-opacity-20');
                      }
                    });
                    const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                    if (input) input.value = '';
                    const resultsDiv = document.getElementById('search-results');
                    if (resultsDiv) resultsDiv.classList.add('hidden');
                  }}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Clear Search
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                💡 Tip: Search for your club name to quickly find your FINAL stage match schedule
              </p>
              <div id="search-results" className="mt-3 p-3 bg-blue-900 rounded-lg hidden">
                <h4 className="text-sm font-bold text-blue-300 mb-2">📅 Match Details Found:</h4>
                <div id="match-info" className="text-xs text-gray-300"></div>
              </div>
            </div>

            {/* Tournament Overview */}
            <div className="bg-gray-800 p-4 rounded-lg mb-8">
              <h3 className="text-xl font-bold text-yellow-400 mb-2">Overview</h3>
              <p className="text-sm">The ZELMU BGMI CLUB Championship is a fully online Battlegrounds Mobile India (BGMI) tournament featuring <strong>192 teams</strong> (960 players, 4 players + 1 substitute per team). Running from <strong>August 5 to August 15, 2025</strong>, it includes <strong>17 online matches</strong> across three rounds and a final stage. Each match in the first three rounds involves 24 teams, with the top 12 qualifying for the next round. The final stage consists of two qualifier matches (Q1, Q2) and a 12-team Grand Final.</p>
              <p className="text-sm mt-2"><strong>Note</strong>: R = Round, G = Group</p>
            </div>

                    {/* Prize Pool */}
            <div className="bg-gray-800 p-4 rounded-lg mb-8">
              <h3 className="text-xl font-bold text-yellow-400 mb-2">Prize Pool</h3>
              <ul className="text-sm space-y-2">
                <li><strong>Total Prize Pool</strong>: ₹50,000 + Trophy + Certificate + Listing on ZELMU.com</li>
                <li>🏆 <strong>Winner (1 team)</strong>: ₹10,000 + Trophy + Certificate + Listing on ZELMU.com</li>
                <li>🥈 <strong>2nd Place (1 team)</strong>: ₹5,000</li>
                <li>🔫 <strong>Top Killed (MVP, 1 player)</strong>: ₹1,000</li>
                <li>⭐ <strong>Player of the Tournament (1 player)</strong>: ₹3,000</li>
                <li>🎖️ <strong>Player of the Match (15 matches)</strong>: ₹500 each (₹7,500 total)</li>
                <li>🎉 <strong>Participation Prize (192 teams)</strong>: ₹100 each (₹19,200 total)</li>
              </ul>
            </div>

        {/* Tournament Structure*/}
        <div className="mb-8">
            <h3 className="text-xl font-bold text-blue-400 mb-4 text-center">Tournament Structure</h3>
            <div className="space-y-6">
                {/* Round 1*/}
                <div className="bracket-box">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-lg font-bold text-blue-400">Round 1 (Aug 5–7, 2025) - COMPLETED ✅</h4>
                        <button
                            onClick={() => setRound1Expanded(!round1Expanded)}
                            className="flex items-center gap-2 text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors"
                        >
                            <span>{round1Expanded ? 'Hide Details' : 'Show Details'}</span>
                            <svg 
                                className={`w-4 h-4 transition-transform ${round1Expanded ? 'rotate-180' : ''}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                    <div className={`transition-all duration-300 ${round1Expanded ? 'max-h-none opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        <p className="text-sm"><strong>Teams</strong>: 192 teams (divided into 8 groups)</p>
                        <p className="text-sm"><strong>Matches</strong>: 8 online matches (24 teams each)</p>
                        <p className="text-sm"><strong>Schedule</strong>:</p>
                        <ul className="text-sm list-disc list-inside">
                            <li>Aug 5: 3 matches (8:00 PM, 9:00 PM, 10:00 PM IST)</li>
                            <li>Aug 6: 3 matches (8:00 PM, 9:00 PM, 10:00 PM IST)</li>
                            <li>Aug 7: 2 matches (8:00 PM, 9:00 PM IST)</li>
                        </ul>
                        <p className="text-sm"><strong>Map</strong>: Erangle (Advanced Mode)</p>
                        <p className="text-sm"><strong>Qualification</strong>: Top 12 teams per match (96 teams total) advance to Round 2</p>
                        <p className="text-sm"><strong>Scoring</strong>: 1st: 10 pts, 2nd: 6 pts, 3rd: 5 pts, 4th: 4 pts, 5th: 3 pts, 6th: 2 pts, 7th–8th: 1 pt</p>
                    </div>
                    <div className={`transition-all duration-300 ${round1Expanded ? 'max-h-none opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        {/* Group A*/}
                        <div className="mt-4">
                            <h5 className="text-md font-bold text-red-500 mb-2">Group A - August 5, 8:00 PM IST</h5>
                            <table className="group-table w-full text-sm">
                                <thead>
                                    <tr>
                                        <th>Slot</th>
                                        <th>Team Name</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td>2</td><td>Nabarun Songho</td></tr>
                                    <tr><td>3</td><td>Netaji Tarun Sangha</td></tr>
                                    <tr><td>4</td><td>Harishchandrapur Club</td></tr>
                                    <tr><td>5</td><td>Shantanir Sporting Club</td></tr>
                                    <tr><td>6</td><td>Panchasayar Club</td></tr>
                                    <tr><td>7</td><td>Yuba Sangha Club</td></tr>
                                    <tr><td>8</td><td>Ajitpur Club</td></tr>
                                    <tr><td>9</td><td>Bison Sangha</td></tr>
                                    <tr><td>10</td><td>Amra Sobai Club</td></tr>
                                    <tr><td>11</td><td>Club Angan</td></tr>
                                    <tr><td>12</td><td>Arambagh Club</td></tr>
                                    <tr><td>13</td><td>Yuva Kalyan Samiti</td></tr>
                                    <tr><td>14</td><td>Shahjahanpur Club</td></tr>
                                    <tr><td>15</td><td>Simulpur Runner Club</td></tr>
                                    <tr><td>16</td><td>Nayakamarga Spoting Club</td></tr>
                                    <tr><td>17</td><td>Ashariadaha Club</td></tr>
                                    <tr><td>18</td><td>Uttorpolli</td></tr>
                                    <tr><td>19</td><td>Sabuj Pally Naba Sammilani Song</td></tr>
                                    <tr><td>20</td><td>Arabpur Club</td></tr>
                                    <tr><td>21</td><td>Gopal Smriti Sangha</td></tr>
                                    <tr><td>22</td><td>Bansdroni Vevekananda Park Association</td></tr>
                                    <tr><td>23</td><td>Ranaghat Club Ten Star</td></tr>
                                    <tr><td>24</td><td>Sahebbari Church Club</td></tr>
                                    <tr><td>25</td><td>Bagnan Milan Sangha</td></tr>
                                </tbody>
                            </table>
                        </div>
                    {/* Group B*/}
                    <div className="mt-4">
                        <h5 className="text-md font-bold text-red-500 mb-2">Group B - August 5, 9:00 PM IST</h5>
                        <table className="group-table w-full text-sm">
                            <thead>
                                <tr>
                                    <th>Slot</th>
                                    <th>Team Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>2</td><td>Jagoroni Club</td></tr>
                                <tr><td>3</td><td>Murarai Amra Kajon Club</td></tr>
                                <tr><td>4</td><td>Baruipur Warriors</td></tr>
                                <tr><td>5</td><td>Achhipur Songho</td></tr>
                                <tr><td>6</td><td>Talbagan Yuba Sangha Club</td></tr>
                                <tr><td>7</td><td>Media Young Star Club</td></tr>
                                <tr><td>8</td><td>Tarun Sangha Club</td></tr>
                                <tr><td>9</td><td>Bagermore Club</td></tr>
                                <tr><td>10</td><td>Biswashri Club</td></tr>
                                <tr><td>11</td><td>Ghoshpur Adibasi Jubak Sangha</td></tr>
                                <tr><td>12</td><td>Ghoshpur Cultural Association</td></tr>
                                <tr><td>13</td><td>Gobardanga Club</td></tr>
                                <tr><td>14</td><td>Maniktala Pragati Sangha</td></tr>
                                <tr><td>15</td><td>Icchamohe Club</td></tr>
                                <tr><td>16</td><td>Subhas Sangha Club</td></tr>
                                <tr><td>17</td><td>Chalantika Club</td></tr>
                                <tr><td>18</td><td>Debigarh Club</td></tr>
                                <tr><td>19</td><td>Polli Union Songho Club</td></tr>
                                <tr><td>20</td><td>Archana Club</td></tr>
                                <tr><td>21</td><td>Kamar Danga Boys Club</td></tr>
                                <tr><td>22</td><td>Baghogra Association</td></tr>
                                <tr><td>23</td><td>Amra Sokole</td></tr>
                                <tr><td>24</td><td>East Udayrajpur Club</td></tr>
                                <tr><td>25</td><td>Arabpur Shongho</td></tr>
                            </tbody>
                        </table>
                    </div>
                    {/* Group C*/}
                    <div className="mt-4">
                        <h5 className="text-md font-bold text-red-500 mb-2">Group C - August 5, 10:00 PM IST</h5>
                        <table className="group-table w-full text-sm">
                            <thead>
                                <tr>
                                    <th>Slot</th>
                                    <th>Team Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>2</td><td>Jabalpur Club</td></tr>
                                <tr><td>3</td><td>Dahijuri Club</td></tr>
                                <tr><td>4</td><td>Dahijuri Association</td></tr>
                                <tr><td>5</td><td>Bamunmura Association Club</td></tr>
                                <tr><td>6</td><td>Sanmatinagar Club</td></tr>
                                <tr><td>7</td><td>Islampur Club</td></tr>
                                <tr><td>8</td><td>Bhatri Sangha</td></tr>
                                <tr><td>9</td><td>New Mahbir Club</td></tr>
                                <tr><td>10</td><td>Dindori Club</td></tr>
                                <tr><td>11</td><td>Milan Tritha Club</td></tr>
                                <tr><td>12</td><td>Bidhanpally Seba Sangha</td></tr>
                                <tr><td>13</td><td>Motijheel Young Star Club</td></tr>
                                <tr><td>14</td><td>We The Green Club</td></tr>
                                <tr><td>15</td><td>Bankura United</td></tr>
                                <tr><td>16</td><td>Ashoknagar Football Coaching Centre</td></tr>
                                <tr><td>17</td><td>Chabi Club</td></tr>
                                <tr><td>18</td><td>Banamalipur Five Star Club</td></tr>
                                <tr><td>19</td><td>Udayan Sangha</td></tr>
                                <tr><td>20</td><td>Gamila Nabin Sangha Rural Library</td></tr>
                                <tr><td>21</td><td>Dhandighi Welfare Association</td></tr>
                                <tr><td>22</td><td>Townhall Club</td></tr>
                                <tr><td>23</td><td>Basirhat. Dhaltitha.Aamra Sobay Club</td></tr>
                                <tr><td>24</td><td>Rajballavpur Agrani Sangha Club</td></tr>
                                <tr><td>25</td><td>Maslandapur United</td></tr>
                            </tbody>
                        </table>
                    </div>
                    {/* Group D*/}
                    <div className="mt-4">
                        <h5 className="text-md font-bold text-red-500 mb-2">Group D - August 6, 8:00 PM IST</h5>
                        <table className="group-table w-full text-sm">
                            <thead>
                                <tr>
                                    <th>Slot</th>
                                    <th>Team Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>2</td><td>Purbachal Club</td></tr>
                                <tr><td>3</td><td>Khar West Association</td></tr>
                                <tr><td>4</td><td>Kamarthuba Pragati Sangha (K.P.S)</td></tr>
                                <tr><td>5</td><td>Birnagar Sporting Club</td></tr>
                                <tr><td>6</td><td>Sinthi Peara Bagan Club</td></tr>
                                <tr><td>7</td><td>Pragatishil Nattaya Sangstha</td></tr>
                                <tr><td>8</td><td>Haroa Club</td></tr>
                                <tr><td>9</td><td>Vivekananda Sporting Club</td></tr>
                                <tr><td>10</td><td>Milan Sangha</td></tr>
                                <tr><td>11</td><td>Janata Club</td></tr>
                                <tr><td>12</td><td>Bergoom Morning Star Club</td></tr>
                                <tr><td>13</td><td>Bhaluka Shongho</td></tr>
                                <tr><td>14</td><td>Aghraduth Sangha</td></tr>
                                <tr><td>15</td><td>Pollishree Club</td></tr>
                                <tr><td>16</td><td>Jagrihi Club</td></tr>
                                <tr><td>17</td><td>Dhaltikuri Chetona Songho</td></tr>
                                <tr><td>18</td><td>Soneva Sports</td></tr>
                                <tr><td>19</td><td>Chakla Esports Club</td></tr>
                                <tr><td>20</td><td>Banni Sikha Sangha</td></tr>
                                <tr><td>21</td><td>Club Prantik</td></tr>
                                <tr><td>22</td><td>Sweet Club</td></tr>
                                <tr><td>23</td><td>Agnio Sangho</td></tr>
                                <tr><td>24</td><td>Arit Club</td></tr>
                                <tr><td>25</td><td>Bagpukur Purbapara New Ajad Sangha</td></tr>
                            </tbody>
                        </table>
                    </div>
                    {/* Group E*/}
                    <div className="mt-4">
                        <h5 className="text-md font-bold text-red-500 mb-2">Group E - August 6, 9:00 PM IST</h5>
                        <table className="group-table w-full text-sm">
                            <thead>
                                <tr>
                                    <th>Slot</th>
                                    <th>Team Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>2</td><td>Canning Swastika Sangha</td></tr>
                                <tr><td>3</td><td>Kaipukur Kalibattala</td></tr>
                                <tr><td>4</td><td>Asutosh Boys Club</td></tr>
                                <tr><td>5</td><td>Santipally Club</td></tr>
                                <tr><td>6</td><td>Pratap Nagar Morning Star Club</td></tr>
                                <tr><td>7</td><td>Dighi Shongho</td></tr>
                                <tr><td>8</td><td>Bibekananda Sporting Club</td></tr>
                                <tr><td>9</td><td>Baliadanga Vidyasagar Club</td></tr>
                                <tr><td>10</td><td>Dreamland Club</td></tr>
                                <tr><td>11</td><td>Sonarpur Club</td></tr>
                                <tr><td>12</td><td>Basudeb Pur Boys Club</td></tr>
                                <tr><td>13</td><td>Bijoy Nagar Club</td></tr>
                                <tr><td>14</td><td>Islampur Shongho</td></tr>
                                <tr><td>15</td><td>Amral Club</td></tr>
                                <tr><td>16</td><td>Dinabondhu Club</td></tr>
                                <tr><td>17</td><td>Amra Sobai Club</td></tr>
                                <tr><td>18</td><td>Bediapara Club</td></tr>
                                <tr><td>19</td><td>Agomoni Sangha</td></tr>
                                <tr><td>20</td><td>United Club Habra</td></tr>
                                <tr><td>21</td><td>Akra Club</td></tr>
                                <tr><td>22</td><td>Gandacherra Club</td></tr>
                                <tr><td>23</td><td>Nalkura Arobindo Sriti Sangha</td></tr>
                                <tr><td>24</td><td>Club Angan</td></tr>
                                <tr><td>25</td><td>Deshbondhu Park</td></tr>
                            </tbody>
                        </table>
                    </div>
                    {/* Group F*/}
                    <div className="mt-4">
                        <h5 className="text-md font-bold text-red-500 mb-2">Group F - August 6, 10:00 PM IST</h5>
                        <table className="group-table w-full text-sm">
                            <thead>
                                <tr>
                                    <th>Slot</th>
                                    <th>Team Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>2</td><td>Ferozpur United</td></tr>
                                <tr><td>3</td><td>Milan Sangha Club</td></tr>
                                <tr><td>4</td><td>Arunchal Rajas</td></tr>
                                <tr><td>5</td><td>Yuba Sanga Club</td></tr>
                                <tr><td>6</td><td>Keonjhar Club</td></tr>
                                <tr><td>7</td><td>Basirhat Association</td></tr>
                                <tr><td>8</td><td>Club Ranchi</td></tr>
                                <tr><td>9</td><td>Ratnagiri Maharashtra United</td></tr>
                                <tr><td>10</td><td>Basirhat Bhyabla</td></tr>
                                <tr><td>11</td><td>Puranpur Warriors</td></tr>
                                <tr><td>12</td><td>Gorakhpur Fighters</td></tr>
                                <tr><td>13</td><td>Surya Sangha</td></tr>
                                <tr><td>14</td><td>Pally Unnayan Sangha</td></tr>
                                <tr><td>15</td><td>Meerut Club</td></tr>
                                <tr><td>16</td><td>Mumbai Warriors</td></tr>
                                <tr><td>17</td><td>Sondalia Bandhob Sriti Songho Sporting Club</td></tr>
                                <tr><td>18</td><td>Shimla United</td></tr>
                                <tr><td>19</td><td>Navi Mumbai Kings</td></tr>
                                <tr><td>20</td><td>Madhay Pradesh Ujjain Kings</td></tr>
                                <tr><td>21</td><td>Yuva Kalyan Samiti</td></tr>
                                <tr><td>22</td><td>Team Goregaon</td></tr>
                                <tr><td>23</td><td>Team Howrah Hunterz</td></tr>
                                <tr><td>24</td><td>Aurangabad Maharashtra Club</td></tr>
                                <tr><td>25</td><td>Kamarthuba Pragati Sangha</td></tr>
                            </tbody>
                        </table>
                    </div>
                    {/* Group G*/}
                    <div className="mt-4">
                        <h5 className="text-md font-bold text-red-500 mb-2">Group G - August 7, 8:00 PM IST</h5>
                        <table className="group-table w-full text-sm">
                            <thead>
                                <tr>
                                    <th>Slot</th>
                                    <th>Team Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>2</td><td>Team Ankola</td></tr>
                                <tr><td>3</td><td>Madhyamgram Santi Sangram</td></tr>
                                <tr><td>4</td><td>Team Maharastra</td></tr>
                                <tr><td>5</td><td>Nagpur Zen1Ns</td></tr>
                                <tr><td>6</td><td>Bihar Bhagalpur Lions</td></tr>
                                <tr><td>7</td><td>Patancheru Club</td></tr>
                                <tr><td>8</td><td>Team Dallupura</td></tr>
                                <tr><td>9</td><td>Dinobondhu Club</td></tr>
                                <tr><td>10</td><td>Greater Noida Club</td></tr>
                                <tr><td>11</td><td>Club Delhi</td></tr>
                                <tr><td>12</td><td>Jaipur Club</td></tr>
                                <tr><td>13</td><td>Meghalaya Club</td></tr>
                                <tr><td>14</td><td>Jharkhand Club</td></tr>
                                <tr><td>15</td><td>Hyderabad Kings</td></tr>
                                <tr><td>16</td><td>Sirsa United</td></tr>
                                <tr><td>17</td><td>Kalyangarh Ramkrishna Seba Samity</td></tr>
                                <tr><td>18</td><td>Kalanchi Biplabi Sangha</td></tr>
                                <tr><td>19</td><td>Diamond Harbour Club</td></tr>
                                <tr><td>20</td><td>Haridwar Kings</td></tr>
                                <tr><td>21</td><td>Nashik Club</td></tr>
                                <tr><td>22</td><td>Borivali Group</td></tr>
                                <tr><td>23</td><td>Behala Songho</td></tr>
                                <tr><td>24</td><td>Madhya Pradesh United</td></tr>
                                <tr><td>25</td><td>Padgha Kings</td></tr>
                            </tbody>
                        </table>
                    </div>
                    {/* Group H*/}
                    <div className="mt-4">
                        <h5 className="text-md font-bold text-red-500 mb-2">Group H - August 7, 9:00 PM IST</h5>
                        <table className="group-table w-full text-sm">
                            <thead>
                                <tr>
                                    <th>Slot</th>
                                    <th>Team Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>2</td><td>Abdalpur Club</td></tr>
                                <tr><td>3</td><td>Maslandapur Akos Songho</td></tr>
                                <tr><td>4</td><td>Kamdevkati Dakshinpara Club</td></tr>
                                <tr><td>5</td><td>Dharavi Boys</td></tr>
                                <tr><td>6</td><td>Borivali Kings</td></tr>
                                <tr><td>7</td><td>Team Bhagalpur</td></tr>
                                <tr><td>8</td><td>Gujarat Sarkar'S</td></tr>
                                <tr><td>9</td><td>Thane Walkers</td></tr>
                                <tr><td>10</td><td>Ajmer Warriors</td></tr>
                                <tr><td>11</td><td>Meerut Falcon</td></tr>
                                <tr><td>12</td><td>New Delhi Viod</td></tr>
                                <tr><td>13</td><td>Shimpoli Fighters</td></tr>
                                <tr><td>14</td><td>Palghar Yodha</td></tr>
                                <tr><td>15</td><td>Team Telangana</td></tr>
                                <tr><td>16</td><td>Goat Ararka</td></tr>
                                <tr><td>17</td><td>Kalamboli Club</td></tr>
                                <tr><td>18</td><td>Pune Kings</td></tr>
                                <tr><td>19</td><td>Team Purkazi</td></tr>
                                <tr><td>20</td><td>Bhuj Warriors</td></tr>
                                <tr><td>21</td><td>Sopara Friends</td></tr>
                                <tr><td>22</td><td>Kanpur Lions</td></tr>
                                <tr><td>23</td><td>Meerut Legacy</td></tr>
                                <tr><td>24</td><td>Habra Kings</td></tr>
                                <tr><td>25</td><td>BIRBHUM United</td></tr>
                            </tbody>
                        </table>
                    </div>
                    </div>
                </div>

                {/* Round 2*/}
                <div className="bracket-box border-2 border-green-500 bg-green-900 bg-opacity-20">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-lg font-bold text-green-400">🎯 Round 2 (Aug 9–10, 2025) - COMPLETED ✅</h4>
                        <button
                            onClick={() => setRound2Expanded(!round2Expanded)}
                            className="flex items-center gap-2 text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors"
                        >
                            <span>{round2Expanded ? 'Hide Details' : 'Show Details'}</span>
                            <svg 
                                className={`w-4 h-4 transition-transform ${round2Expanded ? 'rotate-180' : ''}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                    <div className={`transition-all duration-300 ${round2Expanded ? 'max-h-none opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        <p className="text-sm"><strong>Teams</strong>: 96 teams (from Round 1, divided into 4 groups)</p>
                        <p className="text-sm"><strong>Matches</strong>: 4 online matches (24 teams each)</p>
                        <p className="text-sm"><strong>Schedule</strong>:</p>
                        <ul className="text-sm list-disc list-inside">
                            <li>Aug 9: 2 matches (8:00 PM, 9:00 PM IST)</li>
                            <li>Aug 10: 2 matches (8:00 PM, 9:00 PM IST)</li>
                        </ul>
                        <p className="text-sm"><strong>Map</strong>: Erangle (Advanced Mode)</p>
                        <p className="text-sm"><strong>Qualification</strong>: Top 12 teams per match (48 teams total) advance to Round 3</p>
                        <p className="text-sm"><strong>Scoring</strong>: Same as Round 1</p>
                    </div>
                    <div className={`transition-all duration-300 ${round2Expanded ? 'max-h-none opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        {/* Group W*/}
                        <div className="mt-4">
                            <h5 className="text-md font-bold text-red-500 mb-2">Group W - August 9, 8:00 PM IST</h5>
                            <table className="group-table w-full text-sm">
                                <thead>
                                    <tr>
                                        <th>Slot</th>
                                        <th>Team Name</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td>2</td><td>Arambagh Club</td></tr>
                                    <tr><td>3</td><td>Habra Amra Sobai Club</td></tr>
                                    <tr><td>4</td><td>Arabpur Club</td></tr>
                                    <tr><td>5</td><td>Naba Sammilani Songho</td></tr>
                                    <tr><td>6</td><td>Bagnan Milan Sangha</td></tr>
                                    <tr><td>7</td><td>Harishchandrapur Club</td></tr>
                                    <tr><td>8</td><td>Sahebbari Church Club</td></tr>
                                    <tr><td>9</td><td>Vivekanand Park Association</td></tr>
                                    <tr><td>10</td><td>Ashariadaha Club</td></tr>
                                    <tr><td>11</td><td>Uttorpolli Club</td></tr>
                                    <tr><td>12</td><td>Ranaghat Club Ten Star</td></tr>
                                    <tr><td>13</td><td>Nabarun Songho</td></tr>
                                    <tr><td>14</td><td>Baghogra Association</td></tr>
                                    <tr><td>15</td><td>Baruipur Warriors</td></tr>
                                    <tr><td>16</td><td>Murarai Amra Kojon Club</td></tr>
                                    <tr><td>17</td><td>Debigarh Club</td></tr>
                                    <tr><td>18</td><td>Tarun Sangha Club</td></tr>
                                    <tr><td>19</td><td>East Udayrajpur Club</td></tr>
                                    <tr><td>20</td><td>Talbagan Yuba Sangha Club</td></tr>
                                    <tr><td>21</td><td>Ghoshpur Cultural Association</td></tr>
                                    <tr><td>22</td><td>Subhas Sangha Club</td></tr>
                                    <tr><td>23</td><td>Jagoroni Club</td></tr>
                                    <tr><td>24</td><td>Gobardanga Club</td></tr>
                                    <tr><td>25</td><td>Ghoshpur Adibasi Jubak Sangha</td></tr>
                                </tbody>
                            </table>
                        </div>
                        {/* Group X*/}
                        <div className="mt-4">
                            <h5 className="text-md font-bold text-red-500 mb-2">Group X - August 9, 9:00 PM IST</h5>
                            <table className="group-table w-full text-sm">
                                <thead>
                                    <tr>
                                        <th>Slot</th>
                                        <th>Team Name</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td>2</td><td>Maslandapur United</td></tr>
                                    <tr><td>3</td><td>Bhatri Sangha</td></tr>
                                    <tr><td>4</td><td>Ashoknagar Football Coaching Centre</td></tr>
                                    <tr><td>5</td><td>Dhandighi Welfare Association</td></tr>
                                    <tr><td>6</td><td>Rajballavpur Agrani Sangha Club</td></tr>
                                    <tr><td>7</td><td>Banamalipur Five Star Club</td></tr>
                                    <tr><td>8</td><td>Milan Tritha Club</td></tr>
                                    <tr><td>9</td><td>Sanmatinagar Club</td></tr>
                                    <tr><td>10</td><td>Bashirhat Aamra Sobai Club</td></tr>
                                    <tr><td>11</td><td>Dindori Club</td></tr>
                                    <tr><td>12</td><td>Gamila Nabin Sangha Rural Library</td></tr>
                                    <tr><td>13</td><td>Dahijuri Club</td></tr>
                                    <tr><td>14</td><td>Aghraduth Sangha</td></tr>
                                    <tr><td>15</td><td>Kamarthuba Pragati Sangha (K.P.S)</td></tr>
                                    <tr><td>16</td><td>Birnagar Sporting Club</td></tr>
                                    <tr><td>17</td><td>Pragatishil Nattaya Sangstha</td></tr>
                                    <tr><td>18</td><td>Bergoom Morning Star Club</td></tr>
                                    <tr><td>19</td><td>Pollishree Club</td></tr>
                                    <tr><td>20</td><td>Sweet Club</td></tr>
                                    <tr><td>21</td><td>Arit Club</td></tr>
                                    <tr><td>22</td><td>Dhaltikuri Chetona Songho</td></tr>
                                    <tr><td>23</td><td>Chakla Esports Club</td></tr>
                                    <tr><td>24</td><td>Bhaluka Shongho</td></tr>
                                    <tr><td>25</td><td>Khar West Association</td></tr>
                                </tbody>
                            </table>
                        </div>
                        {/* Group Y*/}
                        <div className="mt-4">
                            <h5 className="text-md font-bold text-red-500 mb-2">Group Y - August 10, 8:00 PM IST</h5>
                            <table className="group-table w-full text-sm">
                                <thead>
                                    <tr>
                                        <th>Slot</th>
                                        <th>Team Name</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td>2</td><td>Akra Club</td></tr>
                                    <tr><td>3</td><td>Basudeb Pur Boys Club</td></tr>
                                    <tr><td>4</td><td>Bediapara Amra Sobai Club</td></tr>
                                    <tr><td>5</td><td>Club Angan</td></tr>
                                    <tr><td>6</td><td>Baliadanga Vidyasagar Club</td></tr>
                                    <tr><td>7</td><td>Canning Swastika Sangha</td></tr>
                                    <tr><td>8</td><td>Agomoni Sangha</td></tr>
                                    <tr><td>9</td><td>Dreamland Club</td></tr>
                                    <tr><td>10</td><td>Dinabondhu Club</td></tr>
                                    <tr><td>11</td><td>Kaipukur Kalibattala</td></tr>
                                    <tr><td>12</td><td>Dighi Shongho</td></tr>
                                    <tr><td>13</td><td>Amral Club</td></tr>
                                    <tr><td>14</td><td>Yuva Kalyan Samiti</td></tr>
                                    <tr><td>15</td><td>Team Goregaon</td></tr>
                                    <tr><td>16</td><td>Aurangabad Maharashtra Club</td></tr>
                                    <tr><td>17</td><td>Ferozpur United</td></tr>
                                    <tr><td>18</td><td>Gorakhpur Fighters</td></tr>
                                    <tr><td>19</td><td>Mumbai Warriors</td></tr>
                                    <tr><td>20</td><td>Navi Mumbai Kings</td></tr>
                                    <tr><td>21</td><td>Surya Sangha</td></tr>
                                    <tr><td>22</td><td>Milan Sangha Club</td></tr>
                                    <tr><td>23</td><td>Kamarthuba Pragati Sangha</td></tr>
                                    <tr><td>24</td><td>Madhay Pradesh Ujjain Kings</td></tr>
                                    <tr><td>25</td><td>Team Howrah Hunterz</td></tr>
                                </tbody>
                            </table>
                        </div>
                        {/* Group Z*/}
                        <div className="mt-4">
                            <h5 className="text-md font-bold text-red-500 mb-2">Group Z - August 10, 9:00 PM IST</h5>
                            <table className="group-table w-full text-sm">
                                <thead>
                                    <tr>
                                        <th>Slot</th>
                                        <th>Team Name</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td>2</td><td>Borivali Group</td></tr>
                                    <tr><td>3</td><td>Team Maharastra</td></tr>
                                    <tr><td>4</td><td>Sirsa United</td></tr>
                                    <tr><td>5</td><td>Nashik Club</td></tr>
                                    <tr><td>6</td><td>Jaipur Club</td></tr>
                                    <tr><td>7</td><td>Club Delhi</td></tr>
                                    <tr><td>8</td><td>Kalyangarh Ramkrishna Seba Samity</td></tr>
                                    <tr><td>9</td><td>Kalanchi Biplabi Sangha</td></tr>
                                    <tr><td>10</td><td>Dinobondhu Club</td></tr>
                                    <tr><td>11</td><td>Hyderabad Kings</td></tr>
                                    <tr><td>12</td><td>Team Dallupura</td></tr>
                                    <tr><td>13</td><td>Madhyamgram Santi Sangram</td></tr>
                                    <tr><td>14</td><td>Habra Kings</td></tr>
                                    <tr><td>15</td><td>United Club Habra</td></tr>
                                    <tr><td>16</td><td>Thane Walkers</td></tr>
                                    <tr><td>17</td><td>Shimpoli Fighters</td></tr>
                                    <tr><td>18</td><td>Borivali Kings</td></tr>
                                    <tr><td>19</td><td>Meerut Legacy</td></tr>
                                    <tr><td>20</td><td>Kanpur Lions</td></tr>
                                    <tr><td>21</td><td>Meerut Falcon</td></tr>
                                    <tr><td>22</td><td>Gujarat Sarkar'S</td></tr>
                                    <tr><td>23</td><td>Ajmer Warriors</td></tr>
                                    <tr><td>24</td><td>Team Telangana</td></tr>
                                    <tr><td>25</td><td>BIRBHUM United</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Round 3*/}
                <div className="bracket-box border-2 border-green-500 bg-green-900 bg-opacity-20">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-lg font-bold text-green-400">🎯 Round 3 (Aug 12, 2025) - COMPLETED ✅</h4>
                        <button
                            onClick={() => setRound3Expanded(!round3Expanded)}
                            className="flex items-center gap-2 text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors"
                        >
                            <span>{round3Expanded ? 'Hide Details' : 'Show Details'}</span>
                            <svg
                                className={`w-4 h-4 transition-transform ${round3Expanded ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                    <div className={`transition-all duration-300 ${round3Expanded ? 'max-h-none opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    <p className="text-sm"><strong>Teams</strong>: 48 teams (from Round 2, divided into 2 groups)</p>
                    <p className="text-sm"><strong>Matches</strong>: 2 online matches (24 teams each)</p>
                    <p className="text-sm"><strong>Schedule</strong>:</p>
                    <ul className="text-sm list-disc list-inside">
                        <li>Aug 12: 2 matches (8:00 PM, 9:00 PM IST)</li>
                    </ul>
                    <p className="text-sm"><strong>Map</strong>: Erangle (Advanced Mode)</p>
                                         <p className="text-sm"><strong>Qualification</strong>: Top 12 teams per match (25 teams total) advance to Final Stage</p>
                    <p className="text-sm"><strong>Scoring</strong>: Same as Round 1</p>
                    {/* Group M*/}
                    <div className="mt-4">
                        <h5 className="text-md font-bold text-red-500 mb-2">Group M - August 12, 8:00 PM IST</h5>
                        <table className="group-table w-full text-sm">
                            <thead>
                                <tr>
                                    <th>Slot</th>
                                    <th>Team Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>2</td><td>Baghogra Association</td></tr>
                                <tr><td>3</td><td>Nabarun Songho</td></tr>
                                <tr><td>4</td><td>Talbagan Yuba Sangha Club</td></tr>
                                <tr><td>5</td><td>Subhas Sangha Club</td></tr>
                                <tr><td>6</td><td>Ghoshpur Cultural Association</td></tr>
                                <tr><td>7</td><td>Uttorpolli Club</td></tr>
                                <tr><td>8</td><td>Murarai Amra Kojon Club</td></tr>
                                <tr><td>9</td><td>Naba Sammilani Songho</td></tr>
                                <tr><td>10</td><td>East Udayrajpur Club</td></tr>
                                <tr><td>11</td><td>Habra Amra Sobai Club</td></tr>
                                <tr><td>12</td><td>Ranaghat Club Ten Star</td></tr>
                                <tr><td>13</td><td>Tarun Sangha Club</td></tr>
                                <tr><td>14</td><td>Birnagar Sporting Club</td></tr>
                                <tr><td>15</td><td>Ashoknagar Football Coaching Centre</td></tr>
                                <tr><td>16</td><td>Aghraduth Sangha</td></tr>
                                <tr><td>17</td><td>Bergoom Morning Star Club</td></tr>
                                <tr><td>18</td><td>Dahijuri Club</td></tr>
                                <tr><td>19</td><td>Arit Club</td></tr>
                                <tr><td>20</td><td>Pollishree Club</td></tr>
                                <tr><td>21</td><td>Banamalipur Five Star Club</td></tr>
                                <tr><td>22</td><td>Kamarthuba Pragati Sangha (K.P.S)</td></tr>
                                <tr><td>23</td><td>Dhandighi Welfare Association</td></tr>
                                <tr><td>24</td><td>Sweet Club</td></tr>
                                <tr><td>25</td><td>Bashirhat Aamra Sobai Club</td></tr>
                            </tbody>
                        </table>
                    </div>
                    {/* Group N*/}
                    <div className="mt-4">
                        <h5 className="text-md font-bold text-red-500 mb-2">Group N - August 12, 9:00 PM IST</h5>
                        <table className="group-table w-full text-sm">
                            <thead>
                                <tr>
                                    <th>Slot</th>
                                    <th>Team Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>2</td><td>Akra Club</td></tr>
                                <tr><td>3</td><td>Deshbondhu Park</td></tr>
                                <tr><td>4</td><td>Team Goregaon</td></tr>
                                <tr><td>5</td><td>Canning Swastika Sangha</td></tr>
                                <tr><td>6</td><td>Surya Sangha</td></tr>
                                <tr><td>7</td><td>Amral Club</td></tr>
                                <tr><td>8</td><td>Baliadanga Vidyasagar Club</td></tr>
                                <tr><td>9</td><td>Kamarthuba Pragati Sangha</td></tr>
                                <tr><td>10</td><td>Navi Mumbai Kings</td></tr>
                                <tr><td>11</td><td>Yuva Kalyan Samiti</td></tr>
                                <tr><td>12</td><td>Team Howrah Hunterz</td></tr>
                                <tr><td>13</td><td>Club Angan</td></tr>
                                <tr><td>14</td><td>Kalyangarh Ramkrishna Seba Samity</td></tr>
                                <tr><td>15</td><td>Kalanchi Biplabi Sangha</td></tr>
                                <tr><td>16</td><td>Team Dallupura</td></tr>
                                <tr><td>17</td><td>Borivali Group</td></tr>
                                <tr><td>18</td><td>Ajmer Warriors</td></tr>
                                <tr><td>19</td><td>Dinobondhu Club</td></tr>
                                <tr><td>20</td><td>Borivali Kings</td></tr>
                                <tr><td>21</td><td>Thane Walkers</td></tr>
                                <tr><td>22</td><td>Gujarat Sarkar'S</td></tr>
                                <tr><td>23</td><td>Kanpur Lions</td></tr>
                                <tr><td>24</td><td>Sirsa United</td></tr>
                                <tr><td>25</td><td>Habra Kings</td></tr>
                            </tbody>
                        </table>
                    </div>
                    </div>
                </div>

                {/* Final Stage*/}
                <div className="bracket-box border-2 border-green-500 bg-green-900 bg-opacity-20">
                    <h4 className="text-lg font-bold text-green-400 mb-2">🏆 Final Stage (Aug 15, 2025) - COMPLETED 🎉</h4>
                    <p className="text-sm text-green-300 mb-2"><strong>Status</strong>: ✅ Tournament Completed - Akra Club is the Champion!</p>
                    <p className="text-sm"><strong>Teams</strong>: 25 teams (from Round 3)</p>
                    <p className="text-sm"><strong>Matches</strong>: 3 online matches (all teams play all 3 matches)</p>
                    <p className="text-sm"><strong>Schedule</strong>:</p>
                    <ul className="text-sm list-disc list-inside">
                        <li>8:00 PM IST: Match 1 - All 25 teams (Erangle map) ✅</li>
                        <li>9:00 PM IST: Match 2 - All 25 teams (Miramar map) ✅</li>
                        <li>10:00 PM IST: Match 3 - All 25 teams (Sanhok map) ✅</li>
                    </ul>
                    <p className="text-sm"><strong>Maps</strong>: Erangle → Miramar → Sanhok (Advanced Mode)</p>
                    <p className="text-sm"><strong>Scoring</strong>: Same as Round 1</p>
                    <p className="text-sm"><strong>Winner</strong>: 🥇 Akra Club 🥇</p>
                    {/* Final Group*/}
                    <div className="mt-4">
                        <h5 className="text-md font-bold text-green-500 mb-2">Final Group - Completed ✅</h5>
                        <p className="text-sm text-green-300 mb-2">All matches finished on August 15, 2025</p>


                        <table className="group-table w-full text-sm">
                            <thead>
                                <tr>
                                    <th>Slot</th>
                                    <th>Team Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                {finalTeams.map((team, index) => (
                                    <tr key={index}>
                                        <td>{team.slot}</td>
                                        <td>{team.name}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        </div>

        {/* Tournament Results & Highlights */}
        <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-green-500 mb-2">🏆 Tournament Completed - Results Available! 🏆</h3>
            <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 p-4 rounded-xl shadow-lg border-2 border-yellow-300 mb-4">
                <h4 className="text-2xl font-bold text-black mb-2">🥇 CHAMPION: AKRA CLUB 🥇</h4>
                <p className="text-lg text-black font-semibold">Season 1 Winners</p>
            </div>
            <p className="text-sm text-gray-300 mb-2">All matches completed on August 15, 2025</p>
            <p className="text-sm text-gray-400">Check the leaderboard for full results and standings</p>
        </div>

        {/* Streaming Platforms - Now for Highlights */}
        <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-blue-500 mb-2">📺 Watch Highlights & Replays</h3>
            <p className="text-sm">Catch all the action on:</p>
            <div className="flex justify-center space-x-4">
                <a href="https://www.youtube.com/@ZELMUESPORTS" target="_blank" className="text-blue-400 hover:underline">YouTube @ZELMUESPORTS</a>
                <a href="https://watch.jiogames.com/channels/?name=@zelmu&id=dfde15c1-fb32-4bcf-84e4-f45d64ac3fc5" target="_blank" className="text-blue-400 hover:underline">JioGames @zelmu</a>
            </div>
        </div>

      
        {/* Organizer Details*/}
        <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-blue-400 mb-2">Organized By</h3>
            <p className="text-sm">ZELMU MEDIATECH PRIVATE LIMITED</p>
            <p className="text-sm">CIN: U90001WB2025PTC281131</p>
        </div>

        {/* Footer*/}
        <div className="text-center text-sm text-gray-400">
            <p>Follow us on <a href="https://zelmu.com" target="_blank" className="text-blue-400 hover:underline">ZELMU.com</a> for updates!</p>
            <p>&copy; 2025 ZELMU BGMI CLUB Championship. All rights reserved.</p>
        </div>
          </div>
        </main>
      </div>
    );
} 