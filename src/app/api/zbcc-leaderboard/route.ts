import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const JSON_FILE_PATH = path.join(process.cwd(), 'public', 'data', 'zbcc-teams.json');

// Function to automatically calculate cumulative FINAL leaderboard
async function updateCumulativeFinalLeaderboard(leaderboardData: any) {
  try {
    const finalGroup = leaderboardData.groups['FINAL'];
    if (!finalGroup) return;

    // Get all map-specific FINAL groups
    const mapGroups = Object.keys(leaderboardData.groups).filter(key => key.startsWith('FINAL-'));
    
    // Reset cumulative scores
    finalGroup.teams.forEach((team: any) => {
      team.kills = 0;
      team.position = 0;
      team.positionPoints = 0;
      team.totalPoints = 0;
      team.matchPoints = 0;
    });

    // Calculate cumulative scores from all map matches
    mapGroups.forEach(mapGroupKey => {
      const mapGroup = leaderboardData.groups[mapGroupKey];
      if (mapGroup && mapGroup.status === 'completed') {
        mapGroup.teams.forEach((mapTeam: any) => {
          const finalTeam = finalGroup.teams.find((t: any) => t.name === mapTeam.name);
          if (finalTeam) {
            finalTeam.kills += mapTeam.kills || 0;
            finalTeam.positionPoints += mapTeam.positionPoints || 0;
            finalTeam.totalPoints += mapTeam.totalPoints || 0;
            finalTeam.matchPoints += mapTeam.totalPoints || 0;
          }
        });
      }
    });

    // Update FINAL group status based on map completion
    const completedMaps = mapGroups.filter(key => leaderboardData.groups[key].status === 'completed').length;
    if (completedMaps === 0) {
      finalGroup.status = 'upcoming';
    } else if (completedMaps === mapGroups.length) {
      finalGroup.status = 'completed';
    } else {
      finalGroup.status = 'live';
    }


  } catch (error) {
    console.error('Error updating cumulative FINAL leaderboard:', error);
  }
}

// GET - Read the leaderboard data
export async function GET() {
  try {
    const data = await fs.readFile(JSON_FILE_PATH, 'utf8');
    const leaderboardData = JSON.parse(data);
    return NextResponse.json(leaderboardData);
  } catch (error) {
    console.error('Error reading leaderboard data:', error);
    return NextResponse.json({ error: 'Failed to read leaderboard data' }, { status: 500 });
  }
}

// POST - Update the leaderboard data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, groupName, teamName, kills, position, groupStatus } = body;

    // Read current data
    const data = await fs.readFile(JSON_FILE_PATH, 'utf8');
    const leaderboardData = JSON.parse(data);

    switch (action) {
      case 'updateTeamScore':
        if (groupName && teamName && kills !== undefined && position !== undefined) {
          const group = leaderboardData.groups[groupName];
          if (group) {
            const team = group.teams.find((t: any) => t.name === teamName);
            if (team) {
              const positionPoints = leaderboardData.positionPoints[position] || 0;
              const totalPoints = kills + positionPoints;
              
              team.kills = kills;
              team.position = position;
              team.positionPoints = positionPoints;
              team.totalPoints = totalPoints;

              // Add to match results
              leaderboardData.matchResults.push({
                teamName,
                groupName,
                kills,
                position,
                timestamp: new Date().toISOString()
              });

              // AUTO-CALCULATE: If updating a map-specific FINAL group, update cumulative FINAL
              if (groupName.startsWith('FINAL-')) {
                await updateCumulativeFinalLeaderboard(leaderboardData);
              }

              // Update last updated timestamp
              leaderboardData.lastUpdated = new Date().toISOString();
            }
          }
        }
        break;

      case 'updateGroupStatus':
        if (groupName && groupStatus) {
          const group = leaderboardData.groups[groupName];
          if (group) {
            group.status = groupStatus;
            
            // AUTO-CALCULATE: If marking a map-specific FINAL group as completed, update cumulative FINAL
            if (groupName.startsWith('FINAL-') && groupStatus === 'completed') {
              await updateCumulativeFinalLeaderboard(leaderboardData);
            }
            
            leaderboardData.lastUpdated = new Date().toISOString();
          }
        }
        break;

      case 'resetAll':
        // Reset all teams to 0 points
        Object.keys(leaderboardData.groups).forEach(groupKey => {
          leaderboardData.groups[groupKey].teams.forEach((team: any) => {
            team.kills = 0;
            team.position = 0;
            team.positionPoints = 0;
            team.totalPoints = 0;
          });
          leaderboardData.groups[groupKey].status = 'upcoming';
        });
        leaderboardData.matchResults = [];
        leaderboardData.lastUpdated = new Date().toISOString();
        break;

      case 'recalculateFinal':
        // Manually recalculate cumulative FINAL leaderboard
        await updateCumulativeFinalLeaderboard(leaderboardData);
        leaderboardData.lastUpdated = new Date().toISOString();
        break;

      case 'resetFinalMatches':
        // Reset only FINAL match scores (keep round data intact)
        Object.keys(leaderboardData.groups).forEach(groupKey => {
          if (groupKey.startsWith('FINAL-')) {
            leaderboardData.groups[groupKey].teams.forEach((team: any) => {
              team.kills = 0;
              team.position = 0;
              team.positionPoints = 0;
              team.totalPoints = 0;
            });
            leaderboardData.groups[groupKey].status = 'upcoming';
          }
        });
        
        // Reset main FINAL group scores
        if (leaderboardData.groups['FINAL']) {
          leaderboardData.groups['FINAL'].teams.forEach((team: any) => {
            team.kills = 0;
            team.position = 0;
            team.positionPoints = 0;
            team.totalPoints = 0;
            team.matchPoints = 0;
          });
          leaderboardData.groups['FINAL'].status = 'upcoming';
        }
        
        // Clear position tracking data
        if (leaderboardData.positionTracking) {
          leaderboardData.positionTracking.finalBaselinePositions = {};
          leaderboardData.positionTracking.lastUpdated = new Date().toISOString();
        }
        
        leaderboardData.lastUpdated = new Date().toISOString();
        
        break;

      case 'updatePositionTracking':
        // Update position tracking data for FINAL leaderboard
        if (leaderboardData.positionTracking) {
          const { baselinePositions } = body;
          if (baselinePositions) {
            leaderboardData.positionTracking.finalBaselinePositions = baselinePositions;
            leaderboardData.positionTracking.lastUpdated = new Date().toISOString();
  
          }
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Write updated data back to file
    await fs.writeFile(JSON_FILE_PATH, JSON.stringify(leaderboardData, null, 2));
    
    return NextResponse.json({ success: true, data: leaderboardData });
  } catch (error) {
    console.error('Error updating leaderboard data:', error);
    return NextResponse.json({ error: 'Failed to update leaderboard data' }, { status: 500 });
  }
} 