// YouTube API utility for ZELMU app
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const ZELMU_CHANNEL_ID = 'UC0PkRdLd6NiVt3AHdzoLGsw'; // Replace with actual ZELMU channel ID

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
  isLive: boolean;
  liveViewers?: string;
  scheduledStartTime?: string;
}

export interface YouTubeLiveStream {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  scheduledStartTime: string;
  actualStartTime?: string;
  concurrentViewers?: string;
  isLive: boolean;
}

// Get live streams from ZELMU channel
export async function getLiveStreams(): Promise<YouTubeLiveStream[]> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&channelId=${ZELMU_CHANNEL_ID}&eventType=live&type=video&key=${YOUTUBE_API_KEY}`
    );
    
    if (!response.ok) throw new Error('Failed to fetch live streams');
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return [];
    }

    // Get additional details for live streams
    const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
    const detailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?` +
      `part=liveStreamingDetails,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );
    
    if (!detailsResponse.ok) throw new Error('Failed to fetch video details');
    
    const detailsData = await detailsResponse.json();
    
    return data.items.map((item: any, index: number) => {
      const details = detailsData.items[index];
      return {
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.high.url,
        scheduledStartTime: details?.liveStreamingDetails?.scheduledStartTime || '',
        actualStartTime: details?.liveStreamingDetails?.actualStartTime || '',
        concurrentViewers: details?.liveStreamingDetails?.concurrentViewers || '0',
        isLive: true
      };
    });
  } catch (error) {
    console.error('Error fetching live streams:', error);
    return [];
  }
}

// Get recent videos from ZELMU channel
export async function getRecentVideos(maxResults: number = 20): Promise<YouTubeVideo[]> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&channelId=${ZELMU_CHANNEL_ID}&order=date&type=video&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`
    );
    
    if (!response.ok) throw new Error('Failed to fetch videos');
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return [];
    }

    // Get additional details for videos
    const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
    const detailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?` +
      `part=contentDetails,statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );
    
    if (!detailsResponse.ok) throw new Error('Failed to fetch video details');
    
    const detailsData = await detailsResponse.json();
    
    return data.items.map((item: any, index: number) => {
      const details = detailsData.items[index];
      return {
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.high.url,
        publishedAt: item.snippet.publishedAt,
        duration: details?.contentDetails?.duration || '',
        viewCount: details?.statistics?.viewCount || '0',
        isLive: false
      };
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return [];
  }
}

// Get video by ID
export async function getVideoById(videoId: string): Promise<YouTubeVideo | null> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?` +
      `part=snippet,contentDetails,statistics,liveStreamingDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`
    );
    
    if (!response.ok) throw new Error('Failed to fetch video');
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return null;
    }

    const item = data.items[0];
    return {
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high.url,
      publishedAt: item.snippet.publishedAt,
      duration: item.contentDetails?.duration || '',
      viewCount: item.statistics?.viewCount || '0',
      isLive: !!item.liveStreamingDetails?.actualStartTime,
      liveViewers: item.liveStreamingDetails?.concurrentViewers || '0',
      scheduledStartTime: item.liveStreamingDetails?.scheduledStartTime || ''
    };
  } catch (error) {
    console.error('Error fetching video:', error);
    return null;
  }
}

// Format duration from ISO 8601 to readable format
export function formatDuration(duration: string): string {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '0:00';
  
  const hours = (match[1] || '').replace('H', '');
  const minutes = (match[2] || '').replace('M', '');
  const seconds = (match[3] || '').replace('S', '');
  
  if (hours) {
    return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
  }
  return `${minutes || '0'}:${seconds.padStart(2, '0')}`;
}

// Format view count
export function formatViewCount(count: string): string {
  const num = parseInt(count);
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

// Format date
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
} 