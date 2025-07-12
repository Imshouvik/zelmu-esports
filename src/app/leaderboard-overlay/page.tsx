'use client';

import React, { useEffect, useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

function getQueryParam(param: string): string | null {
  if (typeof window === 'undefined') return null;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

const defaultColors = {
  tableStart: '#000000',
  tableEnd: '#323232',
  cardStart: '#141414',
  cardEnd: '#464646',
  rowStart: '#000000',
  rowEnd: '#323232',
};

const teamRoles = ['Sniper', 'Assaulter', 'Support', 'IGL'];

export default function LeaderboardOverlay() {
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  useEffect(() => {
    setTournamentId(getQueryParam('tournamentId'));
  }, []);

  // Fetch leaderboard data
  const { data: teams, error } = useSWR(
    tournamentId ? `/api/leaderboard?tournamentId=${tournamentId}` : null,
    fetcher,
    { refreshInterval: 5000, revalidateOnFocus: true }
  );

  // Fetch overlay state (colors, active_team_card)
  const { data: overlayState } = useSWR(
    tournamentId ? `/api/overlay-state?tournamentId=${tournamentId}` : null,
    fetcher,
    { refreshInterval: 5000, revalidateOnFocus: true }
  );

  const colors = overlayState?.colors || defaultColors;
  const activeTeamCard = overlayState?.active_team_card || null;

  // After fetching teams, log their status arrays for debugging
  useEffect(() => {
    if (teams) {
      console.log('Overlay teams status:', teams.map((t: any) => ({ name: t.name, status: t.status })));
    }
  }, [teams]);

  // Helper to get RGBA from hex
  function getRgbaFromHex(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, 0.7)`;
  }

  // Points calculation (example: position points + kills)
  const positionPoints = [10, 6, 5, 4, 3, 2, 1, 1, 0, 0, 0, 0];
  function calculatePoints(idx: number, kills: number) {
    const base = idx < positionPoints.length ? positionPoints[idx] : 0;
    return base + (kills || 0);
  }

  return (
    <div style={{ display: 'flex', width: '1920px', height: '1080px', background: 'transparent', overflow: 'hidden', fontFamily: 'Inter, Arial, sans-serif', color: '#fff' }}>
      {/* Overlay (top right, BMPS style) */}
      <div className="overlay" style={{ position: 'absolute', right: 40, top: 40, width: 440, pointerEvents: 'none', zIndex: 10 }}>
        {/* Team Card (Player Toggle) */}
        {teams && teams.map((team: any) => (
          <div
            key={team.id}
            className={`user-card${activeTeamCard === team.id ? ' active' : ''}`}
            style={{
              position: 'fixed',
              left: '50%',
              bottom: activeTeamCard === team.id ? 60 : -400,
              transform: 'translateX(-50%)',
              width: 440,
              borderRadius: 16,
              padding: 18,
              background: `linear-gradient(135deg, ${getRgbaFromHex(colors.cardStart)}, ${getRgbaFromHex(colors.cardEnd)})`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              backdropFilter: 'blur(8px)',
              opacity: activeTeamCard === team.id ? 1 : 0,
              transition: 'bottom 0.5s, opacity 0.5s',
              pointerEvents: activeTeamCard === team.id ? 'auto' : 'none',
              display: activeTeamCard === team.id ? 'block' : 'none',
              zIndex: 2000,
            }}
          >
            <h3 style={{ color: '#00ffcc', textAlign: 'left', margin: '0 0 14px', fontSize: 24, fontWeight: 800, letterSpacing: 1.5, textShadow: '0 2px 12px #000' }}>{team.name}</h3>
            {team.players && team.players.map((player: any, i: number) => (
              <div key={i} className="player" style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <img src={player.avatar_url || team.logo_url || `https://placehold.co/50x50?text=${team.name[0]}`} alt={`${team.name} Player ${i+1}`} style={{ width: 48, height: 48, borderRadius: '50%', marginRight: 12, border: '2px solid #00ffcc', objectFit: 'cover', background: '#222' }} />
                <div className="player-info">
                  <p className="name" style={{ fontWeight: 600, color: '#fff', margin: 0, fontSize: 17 }}>{player.player_name || `Player ${i+1}`}</p>
                </div>
              </div>
            ))}
          </div>
        ))}
        {/* Kills Table */}
        <div className="kills-table active" style={{
          position: 'relative',
          width: '100%',
          borderRadius: 18,
          padding: '14px 18px 10px 18px',
          background: `linear-gradient(135deg, ${getRgbaFromHex(colors.tableStart)}, ${getRgbaFromHex(colors.tableEnd)})`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          backdropFilter: 'blur(8px)',
          marginBottom: 18,
          border: '2.5px solid #00ffcc',
          transition: 'opacity 0.5s',
          opacity: 1,
        }}>
          <h2 style={{ color: '#00ffcc', textAlign: 'left', margin: '0 0 10px 2px', fontSize: 22, fontWeight: 800, letterSpacing: 1.5, textShadow: '0 2px 12px #000' }}>Kills Table</h2>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 15, background: 'transparent' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.18)', borderBottom: '2px solid #00ffcc' }}>
                <th style={{ padding: '8px 0' }}>#</th>
                <th style={{ padding: '8px 0' }}>Logo</th>
                <th style={{ padding: '8px 0' }}>Team</th>
                <th style={{ padding: '8px 0' }}>Status</th>
                <th style={{ padding: '8px 0' }}>Kills</th>
                <th style={{ padding: '8px 0' }}>Points</th>
              </tr>
            </thead>
            <tbody>
              {error && (
                <tr><td colSpan={6}>Failed to load leaderboard</td></tr>
              )}
              {!teams && !error && (
                <tr><td colSpan={6}>Loading...</td></tr>
              )}
              {teams && teams.length === 0 && (
                <tr><td colSpan={6}>No teams found</td></tr>
              )}
              {teams && teams.map((team: any, idx: number) => (
                <tr key={team.id || team.name} style={{ background: idx % 2 === 0 ? 'rgba(0,0,0,0.10)' : 'rgba(0,0,0,0.18)', borderBottom: '1.5px solid #222' }}>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                  <td style={{ textAlign: 'center' }}>{team.logo_url ? <img src={team.logo_url} alt={team.name} style={{ width: 32, height: 32, borderRadius: '50%' }} /> : null}</td>
                  <td style={{ fontWeight: 600 }}>{team.name}</td>
                  <td style={{ textAlign: 'center' }}>
                    {Array.isArray(team.status) && team.status.length === 4 ? (
                      [0,1,2,3].map(i => (
                        <span key={i} className={`status-box ${team.status[i] ? 'status-live' : 'status-dead'}`} style={{
                          width: 16, height: 16, display: 'inline-block', margin: '0 2px', background: team.status[i] ? '#00ff00' : '#ff0000', borderRadius: 4, border: '1.5px solid #222', boxShadow: team.status[i] ? '0 0 6px #00ff00' : '0 0 6px #ff0000'
                        }}></span>
                      ))
                    ) : (
                      <span style={{ color: 'yellow', fontWeight: 'bold' }}>No status</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{team.kills ?? 0}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{calculatePoints(idx, team.kills)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 