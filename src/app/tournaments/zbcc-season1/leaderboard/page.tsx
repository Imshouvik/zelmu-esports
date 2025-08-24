"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import DashboardSidebar from '@/components/DashboardSidebar';
import AdminNotificationBell from '@/components/AdminNotificationBell';
import NotificationBell from '@/components/NotificationBell';
import MusicControl from '@/components/MusicControl';
import { FaBars } from 'react-icons/fa';


interface Team {
  id: number;
  name: string;
  kills: number;
  position: number;
  positionPoints: number;
  totalPoints: number;
  matchPoints?: number;
}

interface GroupInfo {
  status: string;
  scheduledTime: string;
  matchTime: string;
  teams: Team[];
  map?: string;
  matchNumber?: number;
  description?: string;
}

interface LeaderboardData {
  tournament: string;
  tournamentFullName: string;
  subtitle: string;
  lastUpdated: string;
  overview: {
    description: string;
    note: string;
  };
  prizePool: {
    total: string;
    breakdown: string[];
  };
  streamingPlatforms: Array<{
    name: string;
    url: string;
    handle: string;
  }>;
  organizer: {
    name: string;
    cin: string;
    website: string;
  };
  groups: Record<string, GroupInfo>;
  positionPoints: Record<string, number>;
  tournamentStructure: {
    round1: any;
    round2: any;
    round3: any;
    finalStage: any;
  };
  matchResults: any[];
  positionTracking?: {
    finalBaselinePositions: Record<string, number>;
    lastUpdated: string;
    description: string;
  };
}

export default function ZBCCLeaderboardPage() {
  const router = useRouter();
  const { isAuthenticated, loading, user } = useSelector((state: RootState) => state.auth);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("FINAL");
  const [previousPositions, setPreviousPositions] = useState<Record<string, number>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Component lifecycle tracking
  useEffect(() => {
    return () => {
      // Cleanup
    };
  }, []);


  // Load data from JSON file
  const loadLeaderboardData = async () => {
    try {
      const response = await fetch('/api/zbcc-leaderboard');
      const data = await response.json();
      
      // Only update state if data has actually changed to prevent unnecessary re-renders
      setLeaderboardData(prevData => {
        if (JSON.stringify(prevData) === JSON.stringify(data)) {
          return prevData; // Return previous data to prevent re-render
        }
        return data;
      });
    } catch (error) {
      // Silent error handling
    }
  };



  // Load data on component mount - only once
  useEffect(() => {
    loadLeaderboardData();
  }, []); // Empty dependency array ensures this runs only once

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);







 

  // Auto-refresh FINAL leaderboard every 30 seconds for position tracking after map completion
  // TEMPORARILY DISABLED to fix audio restart issue
  /*
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (selectedGroup === 'FINAL') {
      interval = setInterval(() => {
        // Only refresh if user is actively viewing the page and not causing audio issues
        if (document.visibilityState === 'visible') {
          loadLeaderboardData();
        }
      }, 30000); // Refresh every 30 seconds (only after map completion)
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [selectedGroup]);
  */

  // Track position changes when data updates
  useEffect(() => {
    if (leaderboardData && selectedGroup) {
      const currentGroup = leaderboardData.groups[selectedGroup];
      if (currentGroup) {
        const sortedTeams = sortTeamsByPoints(currentGroup.teams);
        const newPositions: Record<string, number> = {};
        
        sortedTeams.forEach((team, index) => {
          newPositions[team.name] = index + 1;
        });
        
        setPreviousPositions(prev => {
          // Store previous positions for comparison
          const currentPositions = { ...prev };
          
          // If this is the first load, just set current positions
          if (Object.keys(prev).length === 0) {
            return newPositions;
          }
          
          // Otherwise, keep previous positions for comparison
          return currentPositions;
        });
      }
    }
  }, [leaderboardData, selectedGroup]);



  // Persistent position tracking for FINAL group only (stored in JSON file)
  useEffect(() => {
    if (leaderboardData && selectedGroup === 'FINAL') {
      const mapGroups = Object.keys(leaderboardData.groups).filter(key => key.startsWith('FINAL-'));
      const completedMaps = mapGroups.filter(key => leaderboardData.groups[key].status === 'completed').length;
      
      // After 2nd match completion, start position tracking
      if (completedMaps >= 2) {
        const currentGroup = leaderboardData.groups[selectedGroup];
        if (currentGroup) {
          const sortedTeams = sortTeamsByPoints(currentGroup.teams);
          const currentPositions: Record<string, number> = {};
          
          sortedTeams.forEach((team, index) => {
            currentPositions[team.name] = index + 1;
          });
          
          // Load stored positions from JSON file
          const baselinePositions = leaderboardData.positionTracking?.finalBaselinePositions || {};
          
          // If no stored positions, use current as baseline and save to JSON
          if (Object.keys(baselinePositions).length === 0) {
            // Save baseline positions to JSON file
            fetch('/api/zbcc-leaderboard', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'updatePositionTracking',
                baselinePositions: currentPositions
              })
            });
            
            // After 2nd match: Set baseline positions and show them immediately
            setPreviousPositions(currentPositions);
          } else {
            // After 3rd+ match: Check for position changes and show arrows
            let hasChanges = false;
            Object.keys(currentPositions).forEach(teamName => {
              if (baselinePositions[teamName] && baselinePositions[teamName] !== currentPositions[teamName]) {
                hasChanges = true;
              }
            });
            
            // If there are changes, show arrows and update after delay
            if (hasChanges) {
              setPreviousPositions(baselinePositions);
              
              const timer = setTimeout(() => {
                // Update baseline positions in JSON file
                fetch('/api/zbcc-leaderboard', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'updatePositionTracking',
                    baselinePositions: currentPositions
                  })
                });
                
                setPreviousPositions(currentPositions);
              }, 60000); // 60 second delay to show position changes
              
              return () => clearTimeout(timer);
            } else {
              setPreviousPositions(baselinePositions);
            }
          }
        }
      }
      
      // Reset if less than 2 matches completed
      if (completedMaps < 2) {
        // Clear position tracking data from JSON file
        fetch('/api/zbcc-leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'updatePositionTracking',
            baselinePositions: {}
          })
        });
        
        setPreviousPositions({});
      }
    }
  }, [leaderboardData, selectedGroup]);

  // Separate effect to handle 2nd match completion specifically
  useEffect(() => {
    if (leaderboardData && selectedGroup === 'FINAL') {
      const mapGroups = Object.keys(leaderboardData.groups).filter(key => key.startsWith('FINAL-'));
      const completedMaps = mapGroups.filter(key => leaderboardData.groups[key].status === 'completed').length;
      
      // After 2nd match completion: Show arrows comparing 1st vs 2nd match
      if (completedMaps === 2) {
        const currentGroup = leaderboardData.groups[selectedGroup];
        if (currentGroup) {
          const sortedTeams = sortTeamsByPoints(currentGroup.teams);
          const currentPositions: Record<string, number> = {};
          
          sortedTeams.forEach((team, index) => {
            currentPositions[team.name] = index + 1;
          });
          
          // Save baseline positions to JSON file
          fetch('/api/zbcc-leaderboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'updatePositionTracking',
              baselinePositions: currentPositions
            })
          });
          
          // For 2nd match: Set previous positions to show arrows comparing to 1st match
          // We need to calculate positions after 1st match only
          const firstMatchGroup = leaderboardData.groups['FINAL-Erangle'];
          if (firstMatchGroup && firstMatchGroup.status === 'completed') {
            const firstMatchTeams = [...firstMatchGroup.teams].sort((a, b) => {
              if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
              if (b.positionPoints !== a.positionPoints) return b.positionPoints - a.positionPoints;
              if (b.kills !== a.kills) return b.kills - a.kills;
              return a.position - b.position;
            });
            
            const firstMatchPositions: Record<string, number> = {};
            firstMatchTeams.forEach((team, index) => {
              firstMatchPositions[team.name] = index + 1;
            });
            
            setPreviousPositions(firstMatchPositions);
          }
        }
      }
      
      // After 3rd match completion: Show arrows comparing 2nd match baseline vs 3rd match
      if (completedMaps === 3) {
        const baselinePositions = leaderboardData.positionTracking?.finalBaselinePositions || {};
        if (Object.keys(baselinePositions).length > 0) {
          setPreviousPositions(baselinePositions);
        }
      }
    }
  }, [leaderboardData, selectedGroup]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/tournaments/zbcc-season1/leaderboard');
    }
  }, [isAuthenticated, loading, router]);

  // Sort teams by total points (descending) with improved tie-breaking
  const sortTeamsByPoints = (teams: Team[]) => {
    return [...teams].sort((a, b) => {
      // Primary: Total Points (highest first)
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      
      // Secondary: Position Points (highest first) - Better tournament finishes
      if (b.positionPoints !== a.positionPoints) {
        return b.positionPoints - a.positionPoints;
      }
      
      // Tertiary: Kills (highest first) - More aggressive gameplay
      if (b.kills !== a.kills) {
        return b.kills - a.kills;
      }
      
      // Quaternary: Best Position (lowest number first) - Better match finishes
      return a.position - b.position;
    });
  };

  // Get status color (no animation)
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'text-gray-400';
      case 'live': return 'text-red-500';
      case 'calculating': return 'text-yellow-500';
      case 'completed': return 'text-green-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return '⏰';
      case 'live': return '🔴';
      case 'calculating': return '⚡';
      case 'completed': return '✅';
      default: return '⏰';
    }
  };

  // Check if team should show qualification (only if they have points)
  const shouldShowQualification = (team: Team, index: number) => {
    return index < 12 && team.totalPoints > 0;
  };

  // Get position change indicator (ONLY for FINAL group)
  const getPositionChange = (teamName: string, currentPosition: number) => {
    // Only show position changes for FINAL group
    if (selectedGroup !== 'FINAL') {
      return { arrow: '', color: '', text: '' };
    }
    
    const previousPosition = previousPositions[teamName];
    
    // No previous position data or same position
    if (!previousPosition || previousPosition === currentPosition) {
      return { arrow: '', color: '', text: '' };
    }
    
    // Team moved UP in rankings (better position = lower number)
    if (currentPosition < previousPosition) {
      const positionsGained = previousPosition - currentPosition;
      return { 
        arrow: '↗️', 
        color: 'text-green-500', 
        text: `+${positionsGained}` 
      };
    } 
    // Team moved DOWN in rankings (worse position = higher number)
    else {
      const positionsLost = currentPosition - previousPosition;
      return { 
        arrow: '↘️', 
        color: 'text-red-500', 
        text: `-${positionsLost}` 
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!leaderboardData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading leaderboard data...</div>
      </div>
    );
  }

  const currentGroupTeams = sortTeamsByPoints(leaderboardData.groups[selectedGroup]?.teams || []);

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
          <NotificationBell userId={user?.id || "user"} />
        </div>
      </div>
      
              {/* Mobile Z-logo and Bar - Centered Group */}
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
      {/* Header */}
      <div className="container mx-auto px-4 pt-6">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.push('/tournaments/zbcc-season1')}
            className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-semibold">Back to Tournament</span>
          </button>
          
          {/* Last Updated */}
          <div className="text-gray-400 text-sm">
            Last Updated: {new Date(leaderboardData.lastUpdated).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            ZBCC Season 1 Leaderboard
          </h1>
          <p className="text-gray-400">
            Tournament standings and final results
          </p>
        </div>

        {/* Winner Announcement */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 p-6 rounded-2xl shadow-2xl border-4 border-yellow-300">
            <h2 className="text-2xl sm:text-3xl font-bold text-black mb-4">
              🏆 SEASON 1 CHAMPION ANNOUNCED! 🏆
            </h2>
            <div className="text-3xl sm:text-4xl font-bold text-black mb-2">
              🥇 AKRA CLUB 🥇
            </div>
            <p className="text-lg text-black font-semibold mb-2">
              Congratulations to the Season 1 Champions!
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">👑</span>
              <span className="text-xl text-black font-bold">Tournament Completed - August 15, 2025</span>
              <span className="text-2xl">👑</span>
            </div>
          </div>
        </div>

                {/* Group Status Overview - Compact */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-white mb-4">Tournament Status</h3>
          
          {/* Round 1 Summary */}
          <div className="bg-gray-700 border border-gray-600 p-4 rounded-lg mb-4">
            <h4 className="text-white font-semibold mb-2">Round 1 (Completed) ✅</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {Object.entries(leaderboardData.groups)
                .filter(([groupName]) => groupName.startsWith('Group A') || groupName.startsWith('Group B') || 
                                        groupName.startsWith('Group C') || groupName.startsWith('Group D') ||
                                        groupName.startsWith('Group E') || groupName.startsWith('Group F') ||
                                        groupName.startsWith('Group G') || groupName.startsWith('Group H'))
                .map(([groupName, groupInfo]) => (
                  <div key={groupName} className="flex justify-between items-center bg-gray-800 px-2 py-1 rounded">
                    <span className="text-gray-300">{groupName}</span>
                    <span className={`text-xs ${getStatusColor(groupInfo.status)}`}>
                      {getStatusIcon(groupInfo.status)}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Round 2 Summary */}
          <div className="bg-gray-700 border border-gray-600 p-4 rounded-lg mb-4">
            <h4 className="text-white font-semibold mb-2">Round 2 (Completed) ✅</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {Object.entries(leaderboardData.groups)
                .filter(([groupName]) => groupName.startsWith('Group W') || groupName.startsWith('Group X') ||
                                        groupName.startsWith('Group Y') || groupName.startsWith('Group Z'))
                .map(([groupName, groupInfo]) => (
                  <div key={groupName} className="flex justify-between items-center bg-gray-800 px-2 py-1 rounded">
                    <span className="text-gray-300">{groupName}</span>
                    <span className={`text-xs ${getStatusColor(groupInfo.status)}`}>
                      {getStatusIcon(groupInfo.status)}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Round 3 Summary */}
          <div className="bg-gray-700 border border-gray-600 p-4 rounded-lg mb-4">
            <h4 className="text-white font-semibold mb-2">Round 3 (Completed) ✅</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {Object.entries(leaderboardData.groups)
                .filter(([groupName]) => groupName === 'Group M' || groupName === 'Group N')
                .map(([groupName, groupInfo]) => (
                  <div key={groupName} className="flex justify-between items-center bg-gray-800 px-2 py-1 rounded">
                    <span className="text-gray-300">{groupName}</span>
                    <span className={`text-xs ${getStatusColor(groupInfo.status)}`}>
                      {getStatusIcon(groupInfo.status)}
                    </span>
                  </div>
                ))}
            </div>
          </div>

                     {/* FINAL Stage Summary */}
           <div className="bg-purple-900 bg-opacity-20 border border-purple-500 p-4 rounded-lg">
             <h4 className="text-purple-400 font-semibold mb-2">FINAL Stage (Current) 🏆</h4>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
               {Object.entries(leaderboardData.groups)
                 .filter(([groupName]) => groupName === 'FINAL')
                 .map(([groupName, groupInfo]) => (
                   <div key={groupName} className="flex justify-between items-center bg-gray-800 px-2 py-1 rounded">
                     <span className="text-gray-300">{groupName}</span>
                     <span className={`text-xs ${getStatusColor(groupInfo.status)}`}>
                       {getStatusIcon(groupInfo.status)}
                     </span>
                   </div>
                 ))}
             </div>
             
             {/* Match Status */}
             <div className="border-t border-purple-600 pt-3">
               <h5 className="text-purple-300 text-sm font-semibold mb-2">Match Progress:</h5>
               <div className="grid grid-cols-3 gap-2 text-xs">
                 {Object.entries(leaderboardData.groups)
                   .filter(([groupName]) => groupName.startsWith('FINAL-'))
                   .sort(([,a], [,b]) => (a.matchNumber || 0) - (b.matchNumber || 0))
                   .map(([groupName, groupInfo]) => (
                     <div key={groupName} className={`text-center p-2 rounded ${
                       groupInfo.status === 'completed' ? 'bg-green-800 text-green-200' :
                       groupInfo.status === 'live' ? 'bg-red-800 text-red-200' :
                       'bg-gray-700 text-gray-300'
                     }`}>
                       <div className="font-semibold">{groupInfo.map}</div>
                       <div>{groupInfo.matchTime}</div>
                       <div className={`text-xs ${getStatusColor(groupInfo.status)}`}>
                         {getStatusIcon(groupInfo.status)}
                       </div>
                     </div>
                   ))}
               </div>
             </div>
           </div>
        </div>



        {/* Group Selection for Viewing */}
        <div className="mb-6">
          <label className="block text-white mb-2">View Group:</label>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
          >
            <optgroup label="Round 1 (Completed)">
              {Object.keys(leaderboardData.groups)
                .filter(group => group.startsWith('Group A') || group.startsWith('Group B') || 
                                group.startsWith('Group C') || group.startsWith('Group D') ||
                                group.startsWith('Group E') || group.startsWith('Group F') ||
                                group.startsWith('Group G') || group.startsWith('Group H'))
                .map(group => (
                  <option key={group} value={group}>{group} - Round 1</option>
                ))}
            </optgroup>
            <optgroup label="Round 2 (Completed)">
              {Object.keys(leaderboardData.groups)
                .filter(group => group.startsWith('Group W') || group.startsWith('Group X') ||
                                group.startsWith('Group Y') || group.startsWith('Group Z'))
                .map(group => (
                  <option key={group} value={group}>{group} - Round 2</option>
                ))}
            </optgroup>
            <optgroup label="Round 3 (Completed)">
              {Object.keys(leaderboardData.groups)
                .filter(group => group === 'Group M' || group === 'Group N')
                .map(group => (
                  <option key={group} value={group}>{group} - Round 3</option>
                ))}
            </optgroup>
                         <optgroup label="FINAL Stage (Current)">
               {Object.keys(leaderboardData.groups)
                 .filter(group => group === 'FINAL' && !group.startsWith('FINAL-'))
                 .map(group => (
                   <option key={group} value={group}>{group} - FINAL (Cumulative)</option>
                 ))}
             </optgroup>
          </select>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
                     <div className="p-4 border-b border-gray-700">
             <h2 className="text-2xl font-bold text-white">{selectedGroup} Leaderboard</h2>
             <p className="text-gray-400 text-sm">
               Position Points: 1st(10), 2nd(6), 3rd(5), 4th(4), 5th(3), 6th(2), 7th-8th(1)
             </p>
             <p className="text-gray-500 text-xs mt-1">
               💡 Tie-breaking: Total Points → Position Points → Kills → Best Position
             </p>
           </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
                             <thead className="bg-gray-700">
                 <tr>
                   <th className="px-4 py-3 text-left text-white font-semibold">Rank</th>
                   <th className="px-4 py-3 text-left text-white font-semibold">Team Name</th>
                   <th className="px-4 py-3 text-center text-white font-semibold">Kills</th>
                   {selectedGroup !== 'FINAL' && (
                     <th className="px-4 py-3 text-center text-white font-semibold">Position</th>
                   )}
                   <th className="px-4 py-3 text-center text-white font-semibold">Position Points</th>
                   <th className="px-4 py-3 text-center text-white font-semibold">Total Points</th>
                 </tr>
               </thead>
              <tbody>
                {currentGroupTeams.map((team, index) => (
                                                        <tr 
                     key={team.id} 
                     className={`border-b border-gray-700 hover:bg-gray-700 ${
                       // Show qualification indicators for all rounds EXCEPT FINAL
                       selectedGroup !== 'FINAL' && shouldShowQualification(team, index) ? 'bg-green-900 bg-opacity-20 border-l-4 border-l-green-500' : ''
                     } ${
                       // Show position change highlights for FINAL group
                       selectedGroup === 'FINAL' && getPositionChange(team.name, index + 1).arrow ? 'bg-opacity-80' : ''
                     }`}
                   >
                     <td className="px-4 py-3 text-white font-semibold">
                       <div className="flex items-center gap-2">
                         <span>{index + 1}</span>
                         {(() => {
                           const change = getPositionChange(team.name, index + 1);
                           return change.arrow ? (
                             <div className={`flex items-center gap-1 ${change.color} animate-pulse`}>
                               <span className="text-lg">{change.arrow}</span>
                               <span className="text-xs font-medium font-bold">{change.text}</span>
                             </div>
                           ) : null;
                         })()}
                       </div>
                       {/* Show qualification badge for all rounds EXCEPT FINAL */}
                       {selectedGroup !== 'FINAL' && shouldShowQualification(team, index) && (
                         <span className="ml-2 text-green-400 text-xs">🏆</span>
                       )}
                     </td>
                     <td className="px-4 py-3 text-white">
                       {team.name}
                       {/* Show qualification text for all rounds EXCEPT FINAL */}
                       {selectedGroup !== 'FINAL' && shouldShowQualification(team, index) && (
                         <span className="ml-2 text-green-400 text-xs font-medium">QUALIFIED</span>
                       )}
                       {/* Show chicken dinner count for FINAL group teams that won matches */}
                       {selectedGroup === 'FINAL' && (() => {
                         // Count how many times this team got 1st position (10 points) across all maps
                         let chickenCount = 0;
                         if (leaderboardData) {
                           const mapGroups = Object.keys(leaderboardData.groups).filter(key => key.startsWith('FINAL-'));
                           mapGroups.forEach(mapKey => {
                             const mapGroup = leaderboardData.groups[mapKey];
                             if (mapGroup && mapGroup.status === 'completed') {
                               const mapTeam = mapGroup.teams.find((t: any) => t.name === team.name);
                               // Check if they got 1st position (10 points)
                               if (mapTeam && mapTeam.position === 1) {
                                 chickenCount++;
                               }
                             }
                           });
                         }
                         return chickenCount > 0 ? (
                           <span className="ml-2 text-yellow-400 text-lg">
                             🍗 x{chickenCount}
                           </span>
                         ) : null;
                       })()}
                     </td>
                                         <td className="px-4 py-3 text-center text-white">
                       {team.kills}
                     </td>
                     {selectedGroup !== 'FINAL' && (
                       <td className="px-4 py-3 text-center text-white">
                         {team.position || '-'}
                       </td>
                     )}
                     <td className="px-4 py-3 text-center text-white">
                       {team.positionPoints}
                     </td>
                    <td className="px-4 py-3 text-center text-white font-bold">
                      {team.totalPoints}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tournament Structure */}
        <div className="mt-6 bg-gray-800 p-4 rounded-lg">
          <h3 className="text-white font-semibold mb-4">Tournament Structure</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300">
            <div className="border border-gray-600 p-3 rounded">
              <h4 className="text-blue-400 font-semibold mb-2">{leaderboardData.tournamentStructure.round1.name}</h4>
              <p><strong>Dates:</strong> {leaderboardData.tournamentStructure.round1.dates}</p>
              <p><strong>Teams:</strong> {leaderboardData.tournamentStructure.round1.teams}</p>
              <p><strong>Matches:</strong> {leaderboardData.tournamentStructure.round1.matches}</p>
              <p><strong>Map:</strong> {leaderboardData.tournamentStructure.round1.map}</p>
            </div>
            <div className="border border-gray-600 p-3 rounded">
              <h4 className="text-blue-400 font-semibold mb-2">{leaderboardData.tournamentStructure.round2.name}</h4>
              <p><strong>Dates:</strong> {leaderboardData.tournamentStructure.round2.dates}</p>
              <p><strong>Teams:</strong> {leaderboardData.tournamentStructure.round2.teams}</p>
              <p><strong>Matches:</strong> {leaderboardData.tournamentStructure.round2.matches}</p>
              <p><strong>Map:</strong> {leaderboardData.tournamentStructure.round2.map}</p>
            </div>
            <div className="border border-gray-600 p-3 rounded">
              <h4 className="text-blue-400 font-semibold mb-2">{leaderboardData.tournamentStructure.round3.name}</h4>
              <p><strong>Dates:</strong> {leaderboardData.tournamentStructure.round3.dates}</p>
              <p><strong>Teams:</strong> {leaderboardData.tournamentStructure.round3.teams}</p>
              <p><strong>Matches:</strong> {leaderboardData.tournamentStructure.round3.matches}</p>
              <p><strong>Map:</strong> {leaderboardData.tournamentStructure.round3.map}</p>
            </div>
            <div className="border border-gray-600 p-3 rounded">
              <h4 className="text-blue-400 font-semibold mb-2">{leaderboardData.tournamentStructure.finalStage.name}</h4>
              <p><strong>Dates:</strong> {leaderboardData.tournamentStructure.finalStage.dates}</p>
              <p><strong>Teams:</strong> {leaderboardData.tournamentStructure.finalStage.teams}</p>
              <p><strong>Matches:</strong> {leaderboardData.tournamentStructure.finalStage.matches}</p>
              <p><strong>Map:</strong> {leaderboardData.tournamentStructure.finalStage.map}</p>
            </div>
          </div>
        </div>
        </div>
        </div>

                 {/* Legend */}
         <div className="mt-6 bg-gray-800 p-4 rounded-lg">
           <h3 className="text-white font-semibold mb-2">Tournament Scoring & Information:</h3>
           
           {/* Qualification Legend for Rounds 1-3 */}
           {selectedGroup !== 'FINAL' && (
             <div className="mb-4 p-3 bg-green-900 bg-opacity-20 border border-green-500 rounded">
               <h4 className="text-green-300 font-semibold mb-2">🏆 Qualification System:</h4>
               <p className="text-green-200 text-sm">
                 Top 12 teams from each match qualify for the next round. 
                 Qualified teams are highlighted with green borders and 🏆 badges.
               </p>
             </div>
           )}
           
                        {/* Position Change Legend for FINAL */}
             {selectedGroup === 'FINAL' && (
               <div className="mb-4 p-3 bg-purple-900 bg-opacity-20 border border-purple-500 rounded">
                 <h4 className="text-purple-300 font-semibold mb-2">🎯 FINAL Stage Position Tracking:</h4>
                 <div className="flex items-center gap-4 text-sm">
                   <div className="flex items-center gap-2">
                     <span className="text-lg animate-pulse">↗️</span>
                     <span className="text-purple-300">Green Arrow: Team moved UP in rankings</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="text-lg animate-pulse">↘️</span>
                     <span className="text-purple-300">Red Arrow: Team moved DOWN in rankings</span>
                   </div>
                 </div>
                 <p className="text-xs text-purple-300 mt-2">
                   💡 Position tracking starts after 2nd match completion (Miramar)
                 </p>
                 <p className="text-xs text-purple-300 mt-1">
                   🍗 x1, 🍗 x2: Shows chicken dinner count for teams that got 1st position (10 points)
                 </p>
                 <p className="text-xs text-purple-300 mt-1">
                   📊 Arrows stay visible to show position changes between matches
                 </p>
               </div>
             )}
           
                      <h3 className="text-white font-semibold mb-2">Scoring System & Tie-Breaking:</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
             <div>
               <p><strong>Position Points:</strong></p>
               <ul className="list-disc list-inside">
                 <li>1st Place: 10 points</li>
                 <li>2nd Place: 6 points</li>
                 <li>3rd Place: 5 points</li>
                 <li>4th Place: 4 points</li>
                 <li>5th Place: 3 points</li>
                 <li>6th Place: 2 points</li>
                 <li>7th-8th Place: 1 point each</li>
               </ul>
             </div>
             <div>
               <p><strong>Kill Points:</strong></p>
               <ul className="list-disc list-inside">
                 <li>Each kill: 1 point</li>
                 <li>No limit on kills</li>
               </ul>
               <p className="mt-2"><strong>Total Points = Position Points + Kill Points</strong></p>
             </div>
           </div>
           
           {/* Tie-Breaking Rules */}
           <div className="mt-4 p-3 bg-gray-700 rounded">
             <h4 className="text-gray-300 font-semibold mb-2">Tie-Breaking Priority:</h4>
             <ol className="list-decimal list-inside text-sm text-gray-300 space-y-1">
               <li><strong>Total Points</strong> - Highest total points rank first</li>
               <li><strong>Position Points</strong> - Better tournament finishes (1st, 2nd, 3rd places)</li>
               <li><strong>Kills</strong> - More aggressive gameplay and eliminations</li>
               <li><strong>Best Position</strong> - Better individual match finishes</li>
             </ol>
             <p className="text-xs text-gray-400 mt-2">
               💡 This ensures teams with better tournament performance rank higher even with equal total points
             </p>
           </div>
        </div>
      </main>
    </div>
  );
} 