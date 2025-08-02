"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FaRegCommentDots, FaHeart, FaPlus, FaSpinner, FaRegPaperPlane } from "react-icons/fa";
import PostCreateModal from './PostCreateModal';
import { supabase } from '@/utils/supabaseClient';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useRouter } from "next/navigation";
import { useRef } from 'react';
import { FaCheckCircle, FaPlayCircle, FaUserCircle, FaArrowLeft } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

interface User {
  id: string;
  name: string;
  avatar_url?: string;
  role?: string;
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  type: string;
  image_url?: string;
  event_id?: string;
  created_at: string;
  users: User;
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true); // local loading for posts only
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [likeCounts, setLikeCounts] = useState<{ [postId: string]: number }>({});
  const [commentCounts, setCommentCounts] = useState<{ [postId: string]: number }>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reactions, setReactions] = useState<{ [postId: string]: Record<string, string[]> }>({});
  const [showReactionBar, setShowReactionBar] = useState<{ [postId: string]: boolean }>({});
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const reactionEmojis = ['👍', '❤️', '😂', '😮'];
  const [hoveredUser, setHoveredUser] = useState<User | null>(null);
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

  // Use Redux auth state
  const user = useSelector((state: RootState) => state.auth.user);
  const loadingAuth = useSelector((state: RootState) => state.auth.loading);
  const userId = user?.id;

  const router = useRouter();

  const fetchPosts = async () => {
    setPostsLoading(true);
    const res = await fetch("/api/community/posts");
    if (!res.ok) {
      setError("Failed to load posts");
      setPostsLoading(false);
      return;
    }
    const data = await res.json();
    setPosts(data || []);
    setPostsLoading(false);
  };

  // Fetch like counts for all posts
  const fetchLikeCounts = async (posts: Post[]) => {
    const counts: { [postId: string]: number } = {};
    await Promise.all(posts.map(async (post) => {
      const res = await fetch(`/api/community/likes?post_id=${post.id}`);
      if (res.ok) {
        const likes = await res.json();
        counts[post.id] = likes.length || 0;
      } else {
        counts[post.id] = 0;
      }
    }));
    setLikeCounts(counts);
  };

  // Fetch comment counts for all posts
  const fetchCommentCounts = async (posts: Post[]) => {
    const counts: { [postId: string]: number } = {};
    await Promise.all(posts.map(async (post) => {
      const res = await fetch(`/api/community/comments?post_id=${post.id}`);
      if (res.ok) {
        const comments = await res.json();
        counts[post.id] = comments.length || 0;
      } else {
        counts[post.id] = 0;
      }
    }));
    setCommentCounts(counts);
  };

  // Fetch reactions for all posts
  const fetchReactions = async (posts: Post[]) => {
    const all: { [postId: string]: Record<string, string[]> } = {};
    await Promise.all(posts.map(async (post) => {
      const res = await fetch(`/api/community/reactions?postId=${post.id}`);
      if (res.ok) {
        const data = await res.json();
        all[post.id] = data.reactions || {};
      } else {
        all[post.id] = {};
      }
    }));
    setReactions(all);
  };

  // Add/toggle emoji reaction for a post
  const handleEmojiReaction = async (postId: string, emoji: string) => {
    if (!userId) {
      toast.error('You must be logged in to react.');
      return;
    }
    if (!supabase) return;
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    await fetch('/api/community/reactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ postId, emoji }),
    });
    fetchReactions(posts);
    setShowReactionBar((prev) => ({ ...prev, [postId]: false }));
  };

  // Helper: get user's current reaction for a post
  const getUserReaction = (postId: string) => {
    const postReactions = reactions[postId] || {};
    return Object.entries(postReactions).find(([emoji, users]) => users.includes(userId || ''))?.[0] || null;
  };

  const handleDelete = async (postId: string) => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    setDeletingId(postId);
    try {
      const res = await fetch('/api/community/posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, user_id: user.id, is_admin: user.role === 'admin' }),
      });
      if (res.ok) {
        toast.success('Post deleted');
        fetchPosts();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete post');
      }
    } catch (e) {
      toast.error('Failed to delete post');
    } finally {
      setDeletingId(null);
    }
  };

  // 1. Add handleShare, handleCopyLink, handleWebShare
  type PostType = Post;
  const handleShare = (post: PostType) => {
    setSharePost(post);
    setShareModalOpen(true);
  };
  const handleCopyLink = () => {
    if (sharePost) {
      const url = `${window.location.origin}/community/${sharePost.id}`;
      navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
  };
  const handleWebShare = () => {
    if (sharePost && navigator.share) {
      navigator.share({
        title: 'Check out this post on Zelmu Esports',
        text: sharePost.content,
        url: `${window.location.origin}/community/${sharePost.id}`,
      });
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (posts.length > 0) {
      fetchLikeCounts(posts);
      fetchCommentCounts(posts);
      fetchReactions(posts);
    }
    // eslint-disable-next-line
  }, [posts]);

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-3xl text-fuchsia-500" />
      </div>
    );
  }

  // Redirect unauthenticated users to login with redirect param
  if (!userId) {
    if (typeof window !== 'undefined') {
      router.replace(`/login?redirect=/community`);
    }
    return null;
  }

  if (postsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-gray-100 py-10 px-2 flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-4 animate-pulse border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1 h-4 bg-gray-200 rounded" />
              </div>
              <div className="h-6 bg-gray-200 rounded w-3/4" />
              <div className="h-40 bg-gray-200 rounded-xl" />
              <div className="flex gap-4 mt-2">
                <div className="w-16 h-8 bg-gray-200 rounded-full" />
                <div className="w-16 h-8 bg-gray-200 rounded-full" />
                <div className="w-16 h-8 bg-gray-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-700 mb-4">You must be logged in to view the community feed.</div>
          <Link href="/login" className="text-purple-600 underline font-semibold">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-gray-100 py-10 px-2 font-sans">
      <div className="max-w-2xl mx-auto w-full">
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-purple-600 hover:underline mb-6 px-2 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 rounded"
          aria-label="Back"
        >
          <FaArrowLeft /> Back
        </button>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Community</h1>
          <button
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:from-fuchsia-600 hover:to-purple-700 text-white font-bold px-4 py-2 rounded-lg shadow transition-all duration-200 disabled:opacity-60"
            onClick={() => {
              if (!userId) {
                toast.error('You must be logged in to create a post.');
                return;
              }
              setShowCreate(true);
            }}
            disabled={!userId}
            title={!userId ? 'Login to create a post' : ''}
          >
            <FaPlus /> New Post
          </button>
        </div>
        {postsLoading ? (
          <div className="text-center text-gray-500 py-10">Loading posts...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-10">{error}</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-gray-400 py-10">No posts yet. Be the first to post!</div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => {
              const postReactions = reactions[post.id] || {};
              const userReaction = getUserReaction(post.id);
              const reactionLabels: Record<string, string> = { '👍': 'Like', '❤️': 'Love', '😂': 'Haha', '😮': 'Wow' };
              return (
                <motion.div
                  key={post.id}
                  className={`bg-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col gap-2 transition-transform duration-150 border ${user && user.id === post.user_id ? 'border-fuchsia-400' : 'border-gray-100'} hover:shadow-2xl hover:-translate-y-1 hover:border-fuchsia-300`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <div className="relative group">
                      <img
                        src={post.users?.avatar_url || "/app/images/esports%20bg.webp"}
                        alt={post.users?.name || "User"}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md group-hover:ring-2 group-hover:ring-fuchsia-400 transition-all duration-200 cursor-pointer"
                        aria-label="User avatar"
                        onMouseEnter={() => setHoveredUser(post.users)}
                        onMouseLeave={() => setHoveredUser(null)}
                      />
                      {post.users?.role === 'admin' && (
                        <FaCheckCircle className="absolute -bottom-1 -right-1 text-blue-500 bg-white rounded-full text-lg border border-white" title="Verified admin" />
                      )}
                      {/* Popover on avatar hover (desktop only) */}
                      {hoveredUser && hoveredUser.id === post.users?.id && (
                        <div className="absolute left-12 top-0 z-50 bg-white shadow-lg rounded-xl px-4 py-2 text-sm text-gray-800 border border-gray-200 min-w-[160px] hidden md:block">
                          <div className="font-bold text-base mb-1">{hoveredUser.name}</div>
                          <div className="text-xs text-gray-500">{hoveredUser.role === 'admin' ? 'Admin' : 'User'}</div>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-base sm:text-lg flex items-center gap-1">
                        {post.users?.name || "User"}
                        {post.users?.role === 'admin' && <FaCheckCircle className="text-blue-500 ml-1" title="Verified admin" />}
                      </div>
                      <div className="text-xs text-gray-400" title={new Date(post.created_at).toLocaleString()}>{dayjs(post.created_at).fromNow()}</div>
                    </div>
                    <span className="ml-auto px-2 py-1 text-xs rounded bg-gray-100 text-purple-600 font-semibold capitalize flex items-center gap-1">
                      {post.type.replace('_', ' ')}
                    </span>
                    {(user && (user.id === post.user_id || user.role === 'admin')) && (
                      <button
                        className={`ml-2 text-xs text-red-500 hover:underline focus:outline-none focus:ring-2 focus:ring-red-400 rounded px-1 flex items-center gap-1 ${deletingId === post.id ? 'opacity-60 pointer-events-none' : ''}`}
                        onClick={() => handleDelete(post.id)}
                        aria-label="Delete post"
                        disabled={deletingId === post.id}
                        title="Delete post"
                      >
                        {deletingId === post.id ? <FaSpinner className="animate-spin text-xs" /> : 'Delete'}
                      </button>
                    )}
                  </div>
                  <div className="text-gray-800 text-base sm:text-lg mb-2 whitespace-pre-line">{post.content}</div>
                  {/* Media display with lightbox/modal */}
                  {post.image_url && post.image_url.match(/\.(mp4|webm|ogg)$/i) ? (
                    <div className="relative group cursor-pointer" onClick={() => setLightboxMedia({ url: post.image_url || '', type: 'video' })}>
                      <video src={post.image_url} controls className="rounded-xl max-h-96 w-full object-contain border border-gray-100 my-2" style={{ width: '100%', height: 'auto' }} />
                      <FaPlayCircle className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-5xl drop-shadow-lg opacity-80 group-hover:scale-110 transition-transform duration-200 pointer-events-none" />
                    </div>
                  ) : post.image_url ? (
                    <div className="relative group cursor-pointer" onClick={() => setLightboxMedia({ url: post.image_url || '', type: 'image' })}>
                      <img src={post.image_url} alt="Post media" className="rounded-xl max-h-96 w-full object-contain border border-gray-100 my-2 transition-transform duration-200 group-hover:scale-105" style={{ width: '100%', height: 'auto' }} />
                    </div>
                  ) : null}
                  {/* Lightbox/modal for media */}
                  <AnimatePresence>
                    {lightboxMedia && (
                      <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setLightboxMedia(null)}
                      >
                        <div
                          className="relative max-w-3xl w-full flex items-center justify-center"
                          onClick={e => e.stopPropagation()}
                        >
                          {/* Close button */}
                          <button
                            className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white text-gray-900 rounded-full p-2 shadow-lg text-2xl font-bold focus:outline-none"
                            onClick={e => { e.stopPropagation(); setLightboxMedia(null); }}
                            aria-label="Close"
                          >
                            ×
                          </button>
                          {lightboxMedia.type === 'image' ? (
                            <img src={lightboxMedia.url || ''} alt="Full view" className="rounded-xl max-h-[80vh] w-auto object-contain shadow-2xl" onClick={e => e.stopPropagation()} />
                          ) : (
                            <video src={lightboxMedia.url || ''} controls autoPlay className="rounded-xl max-h-[80vh] w-auto object-contain shadow-2xl" onClick={e => e.stopPropagation()} />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {/* Facebook-style Reaction Summary Bar */}
                  <div className="flex items-center justify-between mt-2 mb-2">
                    {/* Reactions summary */}
                    <div className="flex items-center gap-0.5">
                      {/* Top 2 reactions, overlapping */}
                      {(() => {
                        const postReactions = reactions[post.id] || {};
                        // Sort emojis by count, descending
                        const sorted = Object.entries(postReactions).sort((a, b) => b[1].length - a[1].length);
                        const top = sorted.slice(0, 2);
                        return top.map(([emoji], i) => (
                          <span
                            key={emoji}
                            className={`relative z-${10-i} text-base border-2 border-white rounded-full bg-white -ml-2 first:ml-0`}
                            style={{
                              color: emoji === '👍' ? '#1877f2' : emoji === '❤️' ? '#f02849' : undefined,
                              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                              left: i * -6,
                              padding: '2px 4px',
                              display: 'inline-block',
                            }}
                          >
                            {emoji}
                          </span>
                        ));
                      })()}
                      {/* Total reactions count, animated */}
                      <AnimatePresence>
                        {Object.values(reactions[post.id] || {}).reduce((acc, users) => acc + users.length, 0) > 0 && (
                          <motion.span
                            className="ml-2 text-gray-700 font-medium text-xs sm:text-sm"
                            key={Object.values(reactions[post.id] || {}).reduce((acc, users) => acc + users.length, 0)}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {Object.values(reactions[post.id] || {}).reduce((acc, users) => acc + users.length, 0)}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    {/* Comments and Shares */}
                    <div className="text-gray-600 text-xs sm:text-sm">
                      {commentCounts[post.id] > 0 && `${commentCounts[post.id]} Comments`}
                      {commentCounts[post.id] > 0 && <span className="mx-1">·</span>}
                      0 Shares
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-2">
                    {/* Like, Comment, Share action bar */}
                    <div className="flex flex-1 items-center justify-around">
                      {/* Like button (animated) */}
                      <motion.div whileTap={{ scale: 0.9 }} className="relative">
                        <button
                          className={`flex items-center gap-1 px-3 py-2 rounded-full font-semibold border shadow-sm transition-colors text-base sm:text-lg ${userReaction ? 'bg-fuchsia-100 border-fuchsia-400 text-fuchsia-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-fuchsia-50 hover:border-fuchsia-300 active:scale-95'}`}
                          style={{ minWidth: 64, minHeight: 40 }}
                          onClick={e => {
                            if (!showReactionBar[post.id]) handleEmojiReaction(post.id, userReaction ? userReaction : '👍');
                          }}
                          onMouseDown={e => {
                            if (e.button === 0) {
                              const timeout = setTimeout(() => setShowReactionBar(prev => ({ ...prev, [post.id]: true })), 400);
                              (e.target as HTMLElement).setAttribute('data-reaction-timeout', String(timeout));
                            }
                          }}
                          onMouseUp={e => {
                            const timeout = (e.target as HTMLElement).getAttribute('data-reaction-timeout');
                            if (timeout) clearTimeout(Number(timeout));
                            (e.target as HTMLElement).removeAttribute('data-reaction-timeout');
                          }}
                          onMouseLeave={e => {
                            const timeout = (e.target as HTMLElement).getAttribute('data-reaction-timeout');
                            if (timeout) clearTimeout(Number(timeout));
                            (e.target as HTMLElement).removeAttribute('data-reaction-timeout');
                          }}
                          onTouchStart={e => {
                            const timeout = setTimeout(() => setShowReactionBar(prev => ({ ...prev, [post.id]: true })), 400);
                            (e.target as HTMLElement).setAttribute('data-reaction-timeout', String(timeout));
                          }}
                          onTouchEnd={e => {
                            const timeout = (e.target as HTMLElement).getAttribute('data-reaction-timeout');
                            if (timeout) clearTimeout(Number(timeout));
                            (e.target as HTMLElement).removeAttribute('data-reaction-timeout');
                            setTimeout(() => setShowReactionBar(prev => ({ ...prev, [post.id]: false })), 200);
                          }}
                          aria-label="Like"
                          title="Like"
                          disabled={!userId}
                          type="button"
                        >
                          <span className="text-lg sm:text-xl">
                            {userReaction || '👍'}
                          </span>
                          <span className="ml-1">{reactionLabels[userReaction || '👍']}</span>
                        </button>
                        {showReactionBar[post.id] && userId && (
                          <div
                            className="absolute left-0 top-12 flex gap-2 bg-white border border-gray-200 rounded-full shadow-lg px-3 py-2 z-50 animate-fade-in"
                            style={{minWidth:'200px', justifyContent:'center'}}
                            onMouseLeave={() => setShowReactionBar(prev => ({ ...prev, [post.id]: false }))}
                          >
                            {reactionEmojis.map((emoji) => (
                              <button
                                key={emoji}
                                className="text-2xl sm:text-3xl hover:scale-125 transition-transform focus:outline-none active:scale-110"
                                style={{padding:'4px'}}
                                onClick={() => { handleEmojiReaction(post.id, emoji); setShowReactionBar(prev => ({ ...prev, [post.id]: false })); }}
                                type="button"
                                aria-label={`React with ${reactionLabels[emoji]}`}
                                title={reactionLabels[emoji]}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </motion.div>
                      {/* Comment button */}
                      <Link href={`/community/${post.id}`} className="flex items-center gap-1 px-3 py-2 rounded-full font-semibold border shadow-sm transition-colors text-base sm:text-lg bg-white border-gray-300 text-gray-700 hover:bg-fuchsia-50 hover:border-fuchsia-300 active:scale-95" aria-label="Comment" title="Comment">
                        <FaRegCommentDots className="text-lg sm:text-xl" /> <span>Comment</span>
                      </Link>
                      {/* Share button (paper plane icon) */}
                      <button className="flex items-center gap-1 px-3 py-2 rounded-full font-semibold border shadow-sm transition-colors text-base sm:text-lg bg-white border-gray-300 text-gray-700 hover:bg-fuchsia-50 hover:border-fuchsia-300 active:scale-95" type="button" onClick={() => handleShare(post)} aria-label="Share" title="Share">
                        <FaRegPaperPlane className="text-lg sm:text-xl" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                  {/* View all comments link if more than 2 comments */}
                  {commentCounts[post.id] > 2 && (
                    <Link href={`/community/${post.id}`} className="text-xs text-purple-600 hover:underline mt-2" aria-label="View all comments" title="View all comments">
                      View all comments
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      {/* 2. Render PostCreateModal with required props */}
      {showCreate && (
        <PostCreateModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onSuccess={fetchPosts}
          userId={userId}
        />
      )}
      {/* 3. Add share modal rendering logic */}
      {shareModalOpen && sharePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Share Post</h3>
            <p className="text-gray-800 mb-4">{sharePost.content}</p>
            <div className="flex items-center justify-between text-gray-600 text-sm mb-4">
              <span>{dayjs(sharePost.created_at).fromNow()}</span>
              <span>{sharePost.users?.name || 'User'}</span>
            </div>
            <div className="flex flex-col gap-2">
              <button
                className="w-full py-2 rounded bg-gray-100 hover:bg-gray-200 font-semibold"
                onClick={handleCopyLink}
              >
                Copy Link
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(window.location.origin + '/community/' + String(sharePost.id))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 rounded bg-green-100 hover:bg-green-200 font-semibold text-green-700 text-center"
              >
                Share to WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.origin + '/community/' + String(sharePost.id))}&text=${encodeURIComponent(sharePost.content)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 rounded bg-blue-100 hover:bg-blue-200 font-semibold text-blue-700 text-center"
              >
                Share to Twitter
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/community/' + String(sharePost.id))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 rounded bg-blue-50 hover:bg-blue-100 font-semibold text-blue-900 text-center"
              >
                Share to Facebook
              </a>
              {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                <button
                  onClick={handleWebShare}
                  className="w-full py-2 rounded bg-purple-100 hover:bg-purple-200 font-semibold text-purple-700"
                >
                  Share via App...
                </button>
              )}
              <button
                onClick={() => setShareModalOpen(false)}
                className="w-full py-2 rounded bg-gray-200 hover:bg-gray-300 font-semibold mt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="fixed bottom-6 right-6 z-40 md:hidden">
        <button
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:from-fuchsia-600 hover:to-purple-700 text-white font-bold px-6 py-3 rounded-full shadow-lg transition-all duration-200 text-lg"
          onClick={() => {
            if (!userId) {
              toast.error('You must be logged in to create a post.');
              return;
            }
            setShowCreate(true);
          }}
          aria-label="New Post"
          title="New Post"
        >
          <FaPlus className="text-xl" /> New Post
        </button>
      </div>
    </div>
  );
}