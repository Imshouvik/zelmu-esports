"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import Image from "next/image";
import PageGuard from '@/components/PageGuard';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface Tournament {
  id: string;
  title: string;
  status: string;
  start_date: string;
  end_date: string;
}

interface Team {
  id: string;
  name: string;
  logo_url?: string;
  status: boolean[]; // Changed to boolean[] for player status
  kills: number;
  players?: Array<{
    id: string;
    team_id: string;
    player_name: string;
    player_email?: string;
    player_phone?: string;
    game_id?: string;
    player_position?: string;
    player_index: number;
  }>;
}

export default function LeaderboardAdminPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  // Assume tournamentId is available in state or props, or from the URL
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  const [overlayUpdating, setOverlayUpdating] = useState(false);
  const [overlayError, setOverlayError] = useState('');
  const [overlayColors, setOverlayColors] = useState<any>(null);
  const [overlayActiveTeamCard, setOverlayActiveTeamCard] = useState<string | null>(null);

  // Fetch tournaments list
  useEffect(() => {
    fetch('/api/tournaments-list')
      .then(res => res.json())
      .then(data => {
        setTournaments(data);
        if (data.length > 0 && !selectedTournament) {
          setSelectedTournament(data[0].id);
        }
      });
  }, []);

  // Fetch overlay state
  const { data: overlayState, mutate: mutateOverlayState } = useSWR(
    selectedTournament ? `/api/overlay-state?tournamentId=${selectedTournament}` : null,
    fetcher,
    { refreshInterval: 5000, revalidateOnFocus: true }
  );

  useEffect(() => {
    if (overlayState) {
      setOverlayColors(overlayState.colors || {
        tableStart: '#000000',
        tableEnd: '#323232',
        cardStart: '#141414',
        cardEnd: '#464646',
        rowStart: '#000000',
        rowEnd: '#323232',
      });
      setOverlayActiveTeamCard(overlayState.active_team_card || null);
    }
  }, [overlayState]);

  // Fetch leaderboard data
  useEffect(() => {
    if (!selectedTournament) return;
    setLoading(true);
    fetch(`/api/leaderboard?tournamentId=${selectedTournament}`)
      .then(res => res.json())
      .then(data => {
        setLeaderboard(data);
        setLoading(false);
      });
  }, [selectedTournament]);

  // Try to get tournamentId from URL or state
  useEffect(() => {
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    setTournamentId(urlParams ? urlParams.get('tournamentId') : null);
  }, []);

  function updateTeamKills(tournamentId: string, teamId: string, kills: number) {
    return fetch('/api/team-kills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournamentId, teamId, kills }),
    }).then(res => res.json());
  }

  // Helper to update overlay state via API
  async function updateOverlayState(newState: any) {
    setOverlayUpdating(true);
    setOverlayError('');
    try {
      const { data: { session } } = await supabase!.auth.getSession();
      const accessToken = session?.access_token;
      const res = await fetch('/api/overlay-state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          tournamentId: selectedTournament,
          colors: newState.colors,
          active_team_card: newState.active_team_card,
        })
      });
      if (!res.ok) throw new Error('Failed to update overlay state');
      mutateOverlayState();
    } catch (err: any) {
      setOverlayError(err.message || 'Failed to update overlay state');
    } finally {
      setOverlayUpdating(false);
    }
  }

  // Color change handler
  const handleColorChange = (key: string, value: string) => {
    const newColors = { ...overlayColors, [key]: value };
    setOverlayColors(newColors);
    updateOverlayState({ colors: newColors, active_team_card: overlayActiveTeamCard });
  };

  // Team card toggle handler
  const handleTeamCardToggle = (teamId: string) => {
    const newActive = overlayActiveTeamCard === teamId ? null : teamId;
    setOverlayActiveTeamCard(newActive);
    updateOverlayState({ colors: overlayColors, active_team_card: newActive });
  };

  return (
    <PageGuard pageKey="adminPanel">
      <div className="min-h-screen bg-gradient-to-br from-[#0f051d] via-[#18122b] to-[#232046] py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-fuchsia-400 drop-shadow-[0_2px_24px_rgba(236,72,153,0.5)]">Tournament Leaderboard</h1>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <label htmlFor="tournament-select" style={{ fontWeight: 600, marginRight: 8 }}>Select Tournament:</label>
              <select
                id="tournament-select"
                value={selectedTournament || ''}
                onChange={e => setSelectedTournament(e.target.value)}
                style={{ padding: '8px 16px', borderRadius: 6, fontSize: 16 }}
              >
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
            <Link
              href={selectedTournament ? `/leaderboard-overlay?tournamentId=${selectedTournament}` : '/leaderboard-overlay'}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              🎥 Open Live Overlay for Stream/OBS
            </Link>
          </div>
          {/* Overlay Control Panel */}
          {selectedTournament && (
            <div className="mb-8 p-4 rounded-xl bg-white/10 border border-fuchsia-700/30">
              <h2 className="text-xl font-bold mb-4 text-cyan-400">BGMI Overlay Control</h2>
              {overlayError && <div className="text-red-400 mb-2">{overlayError}</div>}
              <div className="mb-4">
                <label className="mr-2">Points Table Start: <input type="color" value={overlayColors?.tableStart || '#000000'} onChange={e => handleColorChange('tableStart', e.target.value)} /></label>
                <label className="mr-2">Points Table End: <input type="color" value={overlayColors?.tableEnd || '#323232'} onChange={e => handleColorChange('tableEnd', e.target.value)} /></label>
                <label className="mr-2">Player Card Start: <input type="color" value={overlayColors?.cardStart || '#141414'} onChange={e => handleColorChange('cardStart', e.target.value)} /></label>
                <label className="mr-2">Player Card End: <input type="color" value={overlayColors?.cardEnd || '#464646'} onChange={e => handleColorChange('cardEnd', e.target.value)} /></label>
                <label className="mr-2">Team Row Start: <input type="color" value={overlayColors?.rowStart || '#000000'} onChange={e => handleColorChange('rowStart', e.target.value)} /></label>
                <label className="mr-2">Team Row End: <input type="color" value={overlayColors?.rowEnd || '#323232'} onChange={e => handleColorChange('rowEnd', e.target.value)} /></label>
              </div>
              <div className="mb-4">
                <span className="font-semibold text-cyan-300">Toggle Team Cards:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(Array.isArray(leaderboard) ? leaderboard : []).map(team => (
                    <button
                      key={team.id}
                      className={`px-4 py-2 rounded ${overlayActiveTeamCard === team.id ? 'bg-cyan-400 text-black' : 'bg-fuchsia-700 text-white'}`}
                      onClick={() => handleTeamCardToggle(team.id)}
                      disabled={overlayUpdating}
                    >
                      Toggle {team.name}
                    </button>
                  ))}
                </div>
              </div>
              {overlayUpdating && <div className="text-cyan-300">Updating overlay...</div>}
            </div>
          )}
          {loading ? (
            <div className="text-center text-fuchsia-200">Loading leaderboard...</div>
          ) : (
            leaderboard.length > 0 ? (
              <div className="overflow-x-auto rounded-xl shadow-lg bg-white/10 border border-fuchsia-700/30">
                <table className="min-w-full text-sm text-white">
                  <thead>
                    <tr className="bg-fuchsia-700/30">
                      <th className="px-4 py-2">Position</th>
                      <th className="px-4 py-2">Logo</th>
                      <th className="px-4 py-2">Team</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Kills</th>
                      <th className="px-4 py-2">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((team, idx) => (
                      <tr key={team.id} className="border-b border-fuchsia-700/10 hover:bg-fuchsia-900/10 transition">
                        <td className="px-4 py-2 font-bold">{idx + 1}</td>
                        <td className="px-4 py-2">
                          {team.logo_url ? (
                            <img src={team.logo_url} alt={team.name} className="w-8 h-8 rounded-full inline-block" />
                          ) : (
                            <span className="w-8 h-8 inline-block bg-fuchsia-700/30 rounded-full"></span>
                          )}
                        </td>
                        <td className="px-4 py-2">{team.name}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${team.status && team.status.every(s => s) ? 'bg-green-400' : 'bg-red-400'}`}></span>
                          {team.status && team.status.every(s => s) ? 'All Alive' : 'Mixed Status'}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            className="bg-fuchsia-700 text-white px-2 py-1 rounded mr-2 hover:bg-fuchsia-800"
                            onClick={async () => {
                              const newKills = team.kills + 1;
                              await updateTeamKills(selectedTournament!, team.id, newKills);
                              setLeaderboard(prev => prev.map(t => t.id === team.id ? { ...t, kills: newKills } : t));
                            }}
                          >
                            +
                          </button>
                          <span className="mx-2 font-mono">{team.kills}</span>
                          <button
                            className="bg-fuchsia-700 text-white px-2 py-1 rounded ml-2 hover:bg-fuchsia-800"
                            onClick={async () => {
                              const newKills = Math.max(0, team.kills - 1);
                              await updateTeamKills(selectedTournament!, team.id, newKills);
                              setLeaderboard(prev => prev.map(t => t.id === team.id ? { ...t, kills: newKills } : t));
                            }}
                          >
                            -
                          </button>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {[0,1,2,3].map(i => {
                              const player = Array.isArray(team.players) && team.players[i] ? team.players[i] : null;
                              const playerName = player ? player.player_name : `Player ${i+1}`;
                              const playerIndex = player ? player.player_index : i;
                              return (
                                <button
                                  key={i}
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${team.status && team.status[i] ? 'bg-green-500 border-green-700 text-white' : 'bg-red-500 border-red-700 text-white'}`}
                                  title={`${playerName} (${team.status && team.status[i] ? 'Alive' : 'Dead'})`}
                                  onClick={async () => {
                                    const newStatus = !(team.status && team.status[i]);
                                    await fetch('/api/team-player-status', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        tournamentId: selectedTournament,
                                        teamId: team.id,
                                        playerIndex: playerIndex,
                                        playerName: playerName,
                                        isAlive: newStatus
                                      }),
                                    });
                                    setLeaderboard(prev => prev.map(t => t.id === team.id ? {
                                      ...t,
                                      status: t.status.map((s, idx) => idx === i ? newStatus : s)
                                    } : t));
                                  }}
                                >
                                  {playerName}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : selectedTournament ? (
              <div className="text-center text-fuchsia-200">No teams found for this tournament.</div>
            ) : null
          )}
        </div>
      </div>
    </PageGuard>
  );
} 