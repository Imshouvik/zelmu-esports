import { NextRequest, NextResponse } from 'next/server';
import { getRecentVideos } from '@/utils/youtube';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const maxResults = parseInt(searchParams.get('maxResults') || '20');
    
    const videos = await getRecentVideos(maxResults);
    return NextResponse.json({ success: true, data: videos });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
} 