"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { YouTubeLiveStream, formatViewCount } from '@/utils/youtube';

export default function LiveStreamIndicator() {
  const [liveStreams, setLiveStreams] = useState<YouTubeLiveStream[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkLiveStreams = async () => {
      try {
        const response = await fetch('/api/youtube/live');
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          setLiveStreams(data.data);
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      } catch (error) {
        console.error('Error checking live streams:', error);
        setIsVisible(false);
      }
    };

    checkLiveStreams();
    const interval = setInterval(checkLiveStreams, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (!isVisible || liveStreams.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 left-4 z-40 animate-pulse">
      <Link
        href="/youtube"
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-200"
      >
        <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
        <span className="font-semibold">🔴 LIVE</span>
        {liveStreams[0]?.concurrentViewers && (
          <span className="text-xs opacity-90">
            {formatViewCount(liveStreams[0].concurrentViewers)} watching
          </span>
        )}
      </Link>
    </div>
  );
} 