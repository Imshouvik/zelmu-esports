import { NextResponse } from 'next/server';
import { getLiveStreams } from '@/utils/youtube';

export async function GET() {
  try {
    const liveStreams = await getLiveStreams();
    return NextResponse.json({ success: true, data: liveStreams });
  } catch (error) {
    console.error('Error fetching live streams:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch live streams' },
      { status: 500 }
    );
  }
} 