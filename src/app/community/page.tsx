"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FaRegCommentDots, FaHeart, FaPlus, FaSpinner } from "react-icons/fa";
import PostCreateModal from './PostCreateModal';
import { supabase } from '@/utils/supabaseClient';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

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

  // Use Redux auth state
  const user = useSelector((state: RootState) => state.auth.user);
  const loadingAuth = useSelector((state: RootState) => state.auth.loading);
  const userId = user?.id;

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

  const handleLike = async (postId: string) => {
    if (!userId) {
      toast.error('You must be logged in to like posts.');
      return;
    }
    const res = await fetch('/api/community/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, user_id: userId })
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || 'Failed to like post');
      return;
    }
    fetchLikeCounts(posts);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (posts.length > 0) {
      fetchLikeCounts(posts);
      fetchCommentCounts(posts);
    }
  }, [posts]);

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-3xl text-fuchsia-500" />
      </div>
    );
  }
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-700 mb-4">You must be logged in to use the community features.</div>
          <Link href="/login" className="text-purple-600 underline font-semibold">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-2">
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Community</h1>
          <button
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:from-fuchsia-600 hover:to-purple-700 text-white font-bold px-4 py-2 rounded-lg shadow transition-all duration-200 disabled:opacity-60"
            onClick={() => setShowCreate(true)}
            disabled={!userId}
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
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow p-5 flex flex-col gap-2 transition-transform duration-150 hover:shadow-lg hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-1">
                  <img
                    src={post.users?.avatar_url || "/app/images/esports%20bg.webp"}
                    alt={post.users?.name || "User"}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                  />
                  <div>
                    <div className="font-bold text-gray-900">{post.users?.name || "User"}</div>
                    <div className="text-xs text-gray-400">{new Date(post.created_at).toLocaleString()}</div>
                  </div>
                  <span className="ml-auto px-2 py-1 text-xs rounded bg-gray-100 text-purple-600 font-semibold capitalize">{post.type.replace('_', ' ')}</span>
                  {(user && (user.id === post.user_id || user.role === 'admin')) && (
                    <button
                      className={`ml-2 text-xs text-red-500 hover:underline focus:outline-none focus:ring-2 focus:ring-red-400 rounded px-1 flex items-center gap-1 ${deletingId === post.id ? 'opacity-60 pointer-events-none' : ''}`}
                      onClick={() => handleDelete(post.id)}
                      aria-label="Delete post"
                      disabled={deletingId === post.id}
                    >
                      {deletingId === post.id ? <FaSpinner className="animate-spin text-xs" /> : 'Delete'}
                    </button>
                  )}
                </div>
                <div className="text-gray-800 text-base mb-2 whitespace-pre-line">{post.content}</div>
                {post.image_url && (
                  <img src={post.image_url} alt="Post image" className="rounded-lg max-h-60 object-cover border border-gray-100" />
                )}
                <div className="flex items-center gap-6 mt-2">
                  <button className="flex items-center gap-1 text-gray-500 hover:text-fuchsia-500 transition-colors" onClick={() => handleLike(post.id)}>
                    <FaHeart className="text-lg" /> <span>Like</span>
                    <span className="ml-1 text-xs">{likeCounts[post.id] || 0}</span>
                  </button>
                  <Link href={`/community/${post.id}`} className="flex items-center gap-1 text-gray-500 hover:text-purple-600 transition-colors">
                    <FaRegCommentDots className="text-lg" /> <span>Comment</span>
                    <span className="ml-1 text-xs">{commentCounts[post.id] || 0}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        <PostCreateModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onSuccess={fetchPosts}
          userId={userId || ''}
        />
      </div>
    </div>
  );
} 