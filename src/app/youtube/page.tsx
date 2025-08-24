"use client";

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { YouTubeVideo, YouTubeLiveStream, formatDuration, formatViewCount, formatDate } from '@/utils/youtube';

export default function YouTubePage() {
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth);
  const [liveStreams, setLiveStreams] = useState<YouTubeLiveStream[]>([]);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loadingLive, setLoadingLive] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Fetch live streams
  const fetchLiveStreams = async () => {
    try {
      const response = await fetch('/api/youtube/live');
      const data = await response.json();
      if (data.success) {
        setLiveStreams(data.data);
      }
    } catch (error) {
      console.error('Error fetching live streams:', error);
    } finally {
      setLoadingLive(false);
    }
  };

  // Fetch recent videos
  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/youtube/videos?maxResults=20');
      const data = await response.json();
      if (data.success) {
        setVideos(data.data);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoadingVideos(false);
    }
  };

  // Auto-refresh live streams every 30 seconds
  useEffect(() => {
    fetchLiveStreams();
    fetchVideos();

    const interval = setInterval(fetchLiveStreams, 30000);
    return () => clearInterval(interval);
  }, []);

  const openVideo = (video: YouTubeVideo) => {
    setSelectedVideo(video);
    setShowVideoModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Please log in to view ZELMU content</div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      
      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              ZELMU YouTube
            </h1>
            <p className="text-gray-400">
              Watch live streams and browse our latest videos
            </p>
          </div>

          {/* Live Streams Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-red-500">🔴</span>
              Live Streams
            </h2>
            
            {loadingLive ? (
              <div className="flex justify-center py-8">
                <div className="text-white">Loading live streams...</div>
              </div>
            ) : liveStreams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveStreams.map((stream) => (
                  <div
                    key={stream.id}
                    className="bg-gray-800 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => openVideo({
                      ...stream,
                      duration: '',
                      viewCount: stream.concurrentViewers || '0',
                      publishedAt: stream.actualStartTime || stream.scheduledStartTime
                    })}
                  >
                    <div className="relative">
                      <img
                        src={stream.thumbnail}
                        alt={stream.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-sm font-semibold">
                        LIVE
                      </div>
                      {stream.concurrentViewers && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                          {formatViewCount(stream.concurrentViewers)} watching
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-semibold mb-2 line-clamp-2">
                        {stream.title}
                      </h3>
                      <p className="text-gray-400 text-sm line-clamp-2">
                        {stream.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <div className="text-gray-400 text-lg mb-2">No live streams at the moment</div>
                <p className="text-gray-500">
                  Check back later for live ZELMU content!
                </p>
              </div>
            )}
          </div>

          {/* Recent Videos Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-blue-500">📺</span>
              Recent Videos
            </h2>
            
            {loadingVideos ? (
              <div className="flex justify-center py-8">
                <div className="text-white">Loading videos...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className="bg-gray-800 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => openVideo(video)}
                  >
                    <div className="relative">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-32 object-cover"
                      />
                      {video.duration && (
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-1 py-0.5 rounded text-xs">
                          {formatDuration(video.duration)}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-white font-semibold mb-1 line-clamp-2 text-sm">
                        {video.title}
                      </h3>
                      <div className="flex justify-between items-center text-gray-400 text-xs">
                        <span>{formatViewCount(video.viewCount)} views</span>
                        <span>{formatDate(video.publishedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* External Links */}
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <h3 className="text-white font-semibold mb-4">Follow ZELMU</h3>
            <div className="flex justify-center gap-4">
              <a
                href="https://www.youtube.com/@ZELMUESPORTS"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <span>YouTube</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {showVideoModal && selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-white font-semibold">ZELMU Video</h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="aspect-video mb-4">
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideo.id}`}
                  title={selectedVideo.title}
                  className="w-full h-full rounded"
                  allowFullScreen
                />
              </div>
              <h4 className="text-white font-semibold mb-2">{selectedVideo.title}</h4>
              <div className="flex justify-between items-center text-gray-400 text-sm mb-3">
                <span>{formatViewCount(selectedVideo.viewCount)} views</span>
                <span>{formatDate(selectedVideo.publishedAt)}</span>
                {selectedVideo.duration && (
                  <span>{formatDuration(selectedVideo.duration)}</span>
                )}
              </div>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">
                {selectedVideo.description}
              </p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
} 