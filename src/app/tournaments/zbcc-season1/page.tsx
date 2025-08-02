"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function ZBCCSeason1Page() {
  const router = useRouter();
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth);

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
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-900">
        <div className="bg-gray-900 rounded-lg shadow-2xl p-6 max-w-5xl w-full mx-auto text-white">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <div className="w-24 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center text-white font-bold text-sm">
              ZELMU
            </div>
            <div className="w-36 h-36 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              BGMI
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4" style={{
            textShadow: '0 0 10px #00D1FF, 0 0 20px #00D1FF, 0 0 30px #FF3333',
            color: '#60A5FA'
          }}>
            ZELMU BGMI CLUB Championship - Season 1
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-red-500 mb-6">
            India's First & Biggest Club Championship for Esports
          </h2>

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

          {/* Tournament Structure */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-blue-400 mb-4 text-center">Tournament Structure</h3>
            <div className="space-y-6">
              {/* Round 1 */}
              <div className="bg-gray-800 border-2 border-blue-400 rounded-lg p-4 relative">
                <h4 className="text-lg font-bold text-blue-400 mb-2">Round 1 (Aug 5–7, 2025)</h4>
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
                
                {/* Group A */}
                <div className="mt-4">
                  <h5 className="text-md font-bold text-red-500 mb-2">Group A - August 5, 8:00 PM IST</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border border-blue-400">
                          <th className="border border-blue-400 p-2 text-left">#</th>
                          <th className="border border-blue-400 p-2 text-left">Team Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border border-blue-400"><td className="border border-blue-400 p-2">2</td><td className="border border-blue-400 p-2">Nabarun Songho</td></tr>
                        <tr className="border border-blue-400"><td className="border border-blue-400 p-2">3</td><td className="border border-blue-400 p-2">Netaji Tarun Sangha</td></tr>
                        <tr className="border border-blue-400"><td className="border border-blue-400 p-2">4</td><td className="border border-blue-400 p-2">Harishchandrapur Club</td></tr>
                        <tr className="border border-blue-400"><td className="border border-blue-400 p-2">5</td><td className="border border-blue-400 p-2">Shantanir Sporting Club</td></tr>
                        <tr className="border border-blue-400"><td className="border border-blue-400 p-2">6</td><td className="border border-blue-400 p-2">Panchasayar Club</td></tr>
                        <tr className="border border-blue-400"><td className="border border-blue-400 p-2">7</td><td className="border border-blue-400 p-2">Yuba Sangha Club</td></tr>
                        <tr className="border border-blue-400"><td className="border border-blue-400 p-2">8</td><td className="border border-blue-400 p-2">Ajitpur Club</td></tr>
                        <tr className="border border-blue-400"><td className="border border-blue-400 p-2">9</td><td className="border border-blue-400 p-2">Bison Sangha</td></tr>
                        <tr className="border border-blue-400"><td className="border border-blue-400 p-2">10</td><td className="border border-blue-400 p-2">Amra Sobai Club</td></tr>
                        <tr className="border border-blue-400"><td className="border border-blue-400 p-2">11</td><td className="border border-blue-400 p-2">Club Angan</td></tr>
                        <tr className="border border-blue-400"><td className="border border-blue-400 p-2">12</td><td className="border border-blue-400 p-2">Arambagh Club</td></tr>
                        <tr className="border border-blue-400"><td className="border border-blue-400 p-2">13</td><td className="border border-blue-400 p-2">Yuva Kalyan Samiti</td></tr>
                        <tr className="border border-blue-400"><td className="border border-blue-400 p-2">14</td><td className="border border-blue-400 p-2">Shahjahanpur Club</td></tr>
                        <tr className="border border-blue-400"><td className="border border-blue-400 p-2">15</td><td className="border border-blue-400 p-2">Simulpur Runner Club</td></tr>
                        <tr className="border border-blue-400"><td className="border border-blue-400 p-2">16</td><td className="border border-blue-400 p-2">Nayakamarga Spoting Club</td></tr>
                        <tr className="border border-blue-400"><td className="border border-blue-400 p-2">17</td><td className="border border-blue-400 p-2">Ashariadaha Club</td></tr>
                        <tr className="border border-blue-400"><td className="border border-blue-400 p-2">18</td><td className="border border-blue-400 p-2">Uttorpolli</td></tr>
                        <tr className="border border-blue-400"><td className="border border-blue-400 p-2">19</td><td className="border border-blue-400 p-2">Sabuj Pally Naba Sammilani Song</td></tr>
                        <tr className="border border-blue-400"><td className="border border-blue-400 p-2">20</td><td className="border border-blue-400 p-2">Arabpur Club</td></tr>
                        <tr className="border border-blue-400"><td className="border border-blue-400 p-2">21</td><td className="border border-blue-400 p-2">Gopal Smriti Sangha</td></tr>
                        <tr className="border border-blue-400"><td className="border border-blue-400 p-2">22</td><td className="border border-blue-400 p-2">Bansdroni Vevekananda Park Association</td></tr>
                        <tr className="border border-blue-400"><td className="border border-blue-400 p-2">23</td><td className="border border-blue-400 p-2">Ranaghat Club Ten Star</td></tr>
                        <tr className="border border-blue-400"><td className="border border-blue-400 p-2">24</td><td className="border border-blue-400 p-2">Sahebbari Church Club</td></tr>
                        <tr className="border border-blue-400"><td className="border border-blue-400 p-2">25</td><td className="border border-blue-400 p-2">Bagnan Milan Sangha</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Additional Groups - Collapsible for space */}
                <div className="mt-4">
                  <details className="group">
                    <summary className="cursor-pointer text-red-500 font-bold hover:text-red-400">
                      View All Groups (B-H) ▼
                    </summary>
                    <div className="mt-2 space-y-4">
                      {/* Group B */}
                      <div>
                        <h6 className="text-sm font-bold text-red-500 mb-2">Group B - August 5, 9:00 PM IST</h6>
                        <p className="text-xs text-gray-300">Jagoroni Club, Murarai Amra Kajon Club, Baruipur Warriors, Achhipur Songho, Talbagan Yuba Sangha Club, Media Young Star Club, Tarun Sangha Club, Bagermore Club, Biswashri Club, Ghoshpur Adibasi Jubak Sangha, Ghoshpur Cultural Association, Gobardanga Club, Maniktala Pragati Sangha, Icchamohe Club, Subhas Sangha Club, Chalantika Club, Debigarh Club, Polli Union Songho Club, Archana Club, Kamar Danga Boys Club, Baghogra Association, Amra Sokole, East Udayrajpur Club, Arabpur Shongho</p>
                      </div>
                      
                      {/* Group C */}
                      <div>
                        <h6 className="text-sm font-bold text-red-500 mb-2">Group C - August 5, 10:00 PM IST</h6>
                        <p className="text-xs text-gray-300">Jabalpur Club, Dahijuri Club, Dahijuri Association, Bamunmura Association Club, Sanmatinagar Club, Islampur Club, Bhatri Sangha, New Mahbir Club, Dindori Club, Milan Tritha Club, Ashariadaha Club, Motijheel Young Star Club, We The Green Club, Bankura United, Ashoknagar Football Coaching Centre, Chabi Club, Banamalipur Five Star Club, Udayan Sangha, Gamila Nabin Sangha Rural Library, Dhandighi Welfare Association, Townhall Club, Basirhat. Dhaltitha.Aamra Sobay Club, Rajballavpur Agrani Sangha Club, Maslandapur United</p>
                      </div>

                      {/* Groups D-H similar structure */}
                      <div>
                        <h6 className="text-sm font-bold text-red-500 mb-2">Groups D-H</h6>
                        <p className="text-xs text-gray-300">Groups D-H follow the same structure with 24 teams each, scheduled across August 6-7 at 8:00 PM, 9:00 PM, and 10:00 PM IST.</p>
                      </div>
                    </div>
                  </details>
                </div>
              </div>

              {/* Round 2 */}
              <div className="bg-gray-800 border-2 border-blue-400 rounded-lg p-4 relative">
                <h4 className="text-lg font-bold text-blue-400 mb-2">Round 2 (Aug 9–10, 2025)</h4>
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
                
                <div className="mt-4">
                  <details className="group">
                    <summary className="cursor-pointer text-red-500 font-bold hover:text-red-400">
                      View Round 2 Groups (W-Z) ▼
                    </summary>
                    <div className="mt-2 space-y-4">
                      <div>
                        <h6 className="text-sm font-bold text-red-500 mb-2">Group W - August 9, 8:00 PM IST</h6>
                        <p className="text-xs text-gray-300">Top 12 teams from Round 1 Groups A & B</p>
                      </div>
                      <div>
                        <h6 className="text-sm font-bold text-red-500 mb-2">Group X - August 9, 9:00 PM IST</h6>
                        <p className="text-xs text-gray-300">Top 12 teams from Round 1 Groups C & D</p>
                      </div>
                      <div>
                        <h6 className="text-sm font-bold text-red-500 mb-2">Group Y - August 10, 8:00 PM IST</h6>
                        <p className="text-xs text-gray-300">Top 12 teams from Round 1 Groups E & F</p>
                      </div>
                      <div>
                        <h6 className="text-sm font-bold text-red-500 mb-2">Group Z - August 10, 9:00 PM IST</h6>
                        <p className="text-xs text-gray-300">Top 12 teams from Round 1 Groups G & H</p>
                      </div>
                    </div>
                  </details>
                </div>
              </div>

              {/* Round 3 */}
              <div className="bg-gray-800 border-2 border-blue-400 rounded-lg p-4 relative">
                <h4 className="text-lg font-bold text-blue-400 mb-2">Round 3 (Aug 12, 2025)</h4>
                <p className="text-sm"><strong>Teams</strong>: 48 teams (from Round 2, divided into 2 groups)</p>
                <p className="text-sm"><strong>Matches</strong>: 2 online matches (24 teams each)</p>
                <p className="text-sm"><strong>Schedule</strong>:</p>
                <ul className="text-sm list-disc list-inside">
                  <li>Aug 12: 2 matches (8:00 PM, 9:00 PM IST)</li>
                </ul>
                <p className="text-sm"><strong>Map</strong>: Erangle (Advanced Mode)</p>
                <p className="text-sm"><strong>Qualification</strong>: Top 12 teams per match (24 teams total) advance to Final Stage</p>
                <p className="text-sm"><strong>Scoring</strong>: Same as Round 1</p>
                
                <div className="mt-4">
                  <details className="group">
                    <summary className="cursor-pointer text-red-500 font-bold hover:text-red-400">
                      View Round 3 Groups (M-N) ▼
                    </summary>
                    <div className="mt-2 space-y-4">
                      <div>
                        <h6 className="text-sm font-bold text-red-500 mb-2">Group M - August 12, 8:00 PM IST</h6>
                        <p className="text-xs text-gray-300">Top 12 teams from Round 2 Groups W & X</p>
                      </div>
                      <div>
                        <h6 className="text-sm font-bold text-red-500 mb-2">Group N - August 12, 9:00 PM IST</h6>
                        <p className="text-xs text-gray-300">Top 12 teams from Round 2 Groups Y & Z</p>
                      </div>
                    </div>
                  </details>
                </div>
              </div>

              {/* Final Stage */}
              <div className="bg-gray-800 border-2 border-blue-400 rounded-lg p-4 relative">
                <h4 className="text-lg font-bold text-blue-400 mb-2">Final Stage (Aug 15, 2025)</h4>
                <p className="text-sm"><strong>Teams</strong>: 24 teams (from Round 3)</p>
                <p className="text-sm"><strong>Matches</strong>: 3 online matches</p>
                <p className="text-sm"><strong>Schedule</strong>:</p>
                <ul className="text-sm list-disc list-inside">
                  <li>8:00 PM IST: Q1 Match (12 teams, top 6 qualify)</li>
                  <li>9:00 PM IST: Q2 Match (12 teams, top 6 qualify)</li>
                  <li>10:00 PM IST: Grand Final (12 teams: top 6 from Q1 + top 6 from Q2)</li>
                </ul>
                <p className="text-sm"><strong>Map</strong>: Erangle (Advanced Mode)</p>
                <p className="text-sm"><strong>Scoring</strong>: Same as Round 1</p>
                
                <div className="mt-4">
                  <details className="group">
                    <summary className="cursor-pointer text-red-500 font-bold hover:text-red-400">
                      View Final Stage Details ▼
                    </summary>
                    <div className="mt-2 space-y-4">
                      <div>
                        <h6 className="text-sm font-bold text-red-500 mb-2">Qualifier 1 - August 15, 8:00 PM IST</h6>
                        <p className="text-xs text-gray-300">Top 12 teams from Round 3 Group M, top 6 qualify for Grand Final</p>
                      </div>
                      <div>
                        <h6 className="text-sm font-bold text-red-500 mb-2">Qualifier 2 - August 15, 9:00 PM IST</h6>
                        <p className="text-xs text-gray-300">Top 12 teams from Round 3 Group N, top 6 qualify for Grand Final</p>
                      </div>
                      <div>
                        <h6 className="text-sm font-bold text-red-500 mb-2">Grand Final - August 15, 10:00 PM IST</h6>
                        <p className="text-xs text-gray-300">12 teams: top 6 from Q1 + top 6 from Q2 compete for the championship</p>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>

          {/* Streaming Platforms */}
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-red-500 mb-2">Watch Live</h3>
            <p className="text-sm">Catch all the action on:</p>
            <div className="flex justify-center space-x-4">
              <a href="https://www.youtube.com/@ZELMUESPORTS" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">YouTube @ZELMUESPORTS</a>
              <a href="https://watch.jiogames.com/channels/?name=@zelmu&id=dfde15c1-fb32-4bcf-84e4-f45d64ac3fc5" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">JioGames @zelmu</a>
            </div>
          </div>

          {/* Collab Call-to-Action */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-yellow-400 mb-4 animate-pulse">Ready to Collab? 🙏</h3>
            <p className="text-sm mb-4">Join us for the ultimate BGMI showdown! 192 teams, 960 players, 17 epic matches. Let's make esports history together!</p>
            <p className="text-sm mb-4"><strong>Preferred Time Slots</strong>: 8:00 PM, 9:00 PM, 10:00 PM IST</p>
            <button 
              onClick={() => window.open('mailto:contact@zelmu.com?subject=ZBCC Season 1 Collaboration', '_blank')}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
            >
              Collab with Us
            </button>
          </div>

          {/* Organizer Details */}
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-blue-400 mb-2">Organized By</h3>
            <p className="text-sm">ZELMU MEDIATECH PRIVATE LIMITED</p>
            <p className="text-sm">CIN: U90001WB2025PTC281131</p>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-400">
            <p>Follow us on <a href="https://zelmu.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">ZELMU.com</a> for updates!</p>
            <p>&copy; 2025 ZELMU BGMI CLUB Championship. All rights reserved.</p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
} 