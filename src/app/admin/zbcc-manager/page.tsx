"use client";

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import PageGuard from '@/components/PageGuard';

interface Team {
  id: number;
  name: string;
  kills: number;
  position: number;
  positionPoints: number;
  totalPoints: number;
}

interface GroupInfo {
  status: string;
  scheduledTime: string;
  matchTime: string;
  teams: Team[];
}

interface LeaderboardData {
  tournament: string;
  lastUpdated: string;
  groups: Record<string, GroupInfo>;
  positionPoints: Record<string, number>;
  matchResults: any[];
}

export default function ZBCCManagerPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("FINAL");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');

  // Load data from JSON file
  const loadLeaderboardData = async () => {
    try {
      const response = await fetch('/api/zbcc-leaderboard');
      const data = await response.json();
      setLeaderboardData(data);
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
    }
  };

  // Update team score
  const updateTeamScore = async (teamName: string, kills: number, position: number) => {
    setIsUpdating(true);
    setUpdateMessage('');
    try {
      const response = await fetch('/api/zbcc-leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateTeamScore',
          groupName: selectedGroup,
          teamName,
          kills,
          position
        })
      });
      
      if (response.ok) {
        await loadLeaderboardData();
        setUpdateMessage(`Updated ${teamName} - Kills: ${kills}, Position: ${position}`);
        setTimeout(() => setUpdateMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating team score:', error);
      setUpdateMessage('Error updating team score');
    } finally {
      setIsUpdating(false);
    }
  };

  // Update group status
  const updateGroupStatus = async (status: string) => {
    try {
      const response = await fetch('/api/zbcc-leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateGroupStatus',
          groupName: selectedGroup,
          groupStatus: status
        })
      });
      
      if (response.ok) {
        await loadLeaderboardData();
        setUpdateMessage(`Updated ${selectedGroup} status to ${status}`);
        setTimeout(() => setUpdateMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating group status:', error);
      setUpdateMessage('Error updating group status');
    }
  };

  // Reset all scores
  const resetAllScores = async () => {
    if (confirm('Are you sure you want to reset all scores? This cannot be undone.')) {
      try {
        const response = await fetch('/api/zbcc-leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'resetAll' })
        });
        
        if (response.ok) {
          await loadLeaderboardData();
          setUpdateMessage('All scores have been reset');
          setTimeout(() => setUpdateMessage(''), 3000);
        }
      } catch (error) {
        console.error('Error resetting scores:', error);
        setUpdateMessage('Error resetting scores');
      }
    }
  };

  // Recalculate cumulative FINAL leaderboard
  const recalculateFinal = async () => {
    try {
      const response = await fetch('/api/zbcc-leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'recalculateFinal' })
      });
      
      if (response.ok) {
        await loadLeaderboardData();
        setUpdateMessage('FINAL leaderboard recalculated successfully!');
        setTimeout(() => setUpdateMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error recalculating FINAL leaderboard:', error);
      setUpdateMessage('Error recalculating FINAL leaderboard');
    }
  };

  // Download data file
  const handleDownloadData = () => {
    // Create a blob with the current leaderboard data
    const dataStr = JSON.stringify(leaderboardData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    // Create download link
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zbcc-teams-${new Date().toISOString().split('T')[0]}.json`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setUpdateMessage('Data file downloaded successfully!');
    setTimeout(() => setUpdateMessage(''), 3000);
  };

  // Load data on component mount
  useEffect(() => {
    loadLeaderboardData();
  }, []);

  if (!leaderboardData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const currentGroup = leaderboardData.groups[selectedGroup];

  return (
    <PageGuard pageKey="adminPanel">
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              ZBCC Tournament Manager
            </h1>
            <p className="text-gray-400">
              Manage tournament data and scores
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Last Updated: {new Date(leaderboardData.lastUpdated).toLocaleString()}
            </p>
          </div>

          {/* Update Message */}
          {updateMessage && (
            <div className="mb-6 p-4 bg-blue-600 text-white rounded-lg">
              {updateMessage}
            </div>
          )}

                     {/* Group Selection and Status */}
           <div className="bg-gray-800 p-6 rounded-lg mb-6">
             {/* Auto-Calculation Info */}
             <div className="mb-4 p-3 bg-blue-900 bg-opacity-20 border border-blue-500 rounded">
               <h4 className="text-blue-300 font-semibold mb-2">🔄 Auto-Calculation System</h4>
               <p className="text-blue-200 text-sm">
                 When you update scores for FINAL-Erangle, FINAL-Miramar, or FINAL-Sanhok, 
                 the cumulative FINAL leaderboard automatically updates in the background.
               </p>
               <p className="text-blue-200 text-sm mt-1">
                 Use "Recalculate Final" button if you need to manually refresh the cumulative scores.
               </p>
             </div>
             
             <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="block text-white mb-2">Select Group:</label>
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
                                     <optgroup label="FINAL Stage - Map Specific (Admin Only)">
                     {Object.keys(leaderboardData.groups)
                       .filter(group => group.startsWith('FINAL-'))
                       .map(group => {
                         const mapName = group.split('-')[1];
                         const matchTime = leaderboardData.groups[group]?.matchTime || '';
                         return (
                           <option key={group} value={group}>
                             {group} - {mapName} ({matchTime})
                           </option>
                         );
                       })}
                   </optgroup>
                   <optgroup label="FINAL Stage - Cumulative (Users See)">
                     {Object.keys(leaderboardData.groups)
                       .filter(group => group === 'FINAL')
                       .map(group => (
                         <option key={group} value={group}>{group} - Cumulative</option>
                       ))}
                   </optgroup>
                </select>
              </div>
              
              <div>
                <label className="block text-white mb-2">Group Status:</label>
                <select
                  value={currentGroup.status}
                  onChange={(e) => updateGroupStatus(e.target.value)}
                  className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="calculating">Calculating</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

                             <div className="ml-auto flex gap-2">
                 <button
                   onClick={handleDownloadData}
                   className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
                 >
                   Download Data
                 </button>
                 <button
                   onClick={recalculateFinal}
                   className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                 >
                   Recalculate Final
                 </button>
                 <button
                   onClick={resetAllScores}
                   className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
                 >
                   Reset All Scores
                 </button>
               </div>
            </div>
          </div>

          {/* Teams Table */}
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">{selectedGroup} Teams</h2>
              <p className="text-gray-400 text-sm">
                Click on kills or position to update team scores
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-white font-semibold">Team Name</th>
                    <th className="px-4 py-3 text-center text-white font-semibold">Kills</th>
                    <th className="px-4 py-3 text-center text-white font-semibold">Position</th>
                    <th className="px-4 py-3 text-center text-white font-semibold">Position Points</th>
                    <th className="px-4 py-3 text-center text-white font-semibold">Total Points</th>
                    <th className="px-4 py-3 text-center text-white font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentGroup.teams.map((team) => (
                    <tr key={team.id} className="border-b border-gray-700 hover:bg-gray-700">
                      <td className="px-4 py-3 text-white font-semibold">
                        {team.name}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => updateTeamScore(team.name, Math.max(0, team.kills - 1), team.position)}
                            disabled={isUpdating}
                            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm disabled:opacity-50"
                          >
                            -
                          </button>
                          <span className="text-white font-mono min-w-[3rem]">{team.kills}</span>
                          <button
                            onClick={() => updateTeamScore(team.name, team.kills + 1, team.position)}
                            disabled={isUpdating}
                            className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-sm disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => updateTeamScore(team.name, team.kills, Math.max(1, team.position - 1))}
                            disabled={isUpdating}
                            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm disabled:opacity-50"
                          >
                            -
                          </button>
                          <span className="text-white font-mono min-w-[3rem]">{team.position || '-'}</span>
                          <button
                            onClick={() => updateTeamScore(team.name, team.kills, Math.min(24, (team.position || 0) + 1))}
                            disabled={isUpdating}
                            className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-sm disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-white">
                        {team.positionPoints}
                      </td>
                      <td className="px-4 py-3 text-center text-white font-bold">
                        {team.totalPoints}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => updateTeamScore(team.name, 0, 0)}
                          disabled={isUpdating}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                        >
                          Reset
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => updateGroupStatus('live')}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
              >
                Set Group Live
              </button>
              <button
                onClick={() => updateGroupStatus('calculating')}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded transition-colors"
              >
                Set Calculating
              </button>
              <button
                onClick={() => updateGroupStatus('completed')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
              >
                Set Completed
              </button>
            </div>
          </div>

          {/* Match Results History */}
          {leaderboardData.matchResults.length > 0 && (
            <div className="mt-6 bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">Recent Match Results</h3>
              <div className="max-h-60 overflow-y-auto">
                {leaderboardData.matchResults.slice(-20).reverse().map((result, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700">
                    <span className="text-white">
                      {result.teamName} ({result.groupName}) - Kills: {result.kills}, Position: {result.position}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageGuard>
  );
} 