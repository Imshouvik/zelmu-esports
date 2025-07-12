"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FaRegCommentDots, FaHeart, FaArrowLeft, FaSpinner } from "react-icons/fa";
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  avatar_url?: string;
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
  like_count?: number;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  users: User;
}

export default function PostDetailPage() {
  const params = useParams();
  const postId = typeof params?.postId === 'string' ? params.postId : Array.isArray(params?.postId) ? params.postId[0] : '';
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [error, setError] = useState("");
  const [likeCount, setLikeCount] = useState<number>(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const user = useSelector((state: any) => state.auth.user);
  const userId = user?.id;
  const [deletingPost, setDeletingPost] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const fetchPost = async () => {
    setLoading(true);
    const allRes = await fetch('/api/community/posts');
    const allPosts = await allRes.json();
    const found = allPosts.find((p: Post) => p.id === postId);
    setPost(found || null);
    // Fetch like count
    if (found) {
      const likesRes = await fetch(`/api/community/likes?post_id=${postId}`);
      if (likesRes.ok) {
        const likes = await likesRes.json();
        setLikeCount(likes.length || 0);
      } else {
        setLikeCount(0);
      }
    }
    setLoading(false);
  };

  const fetchComments = async () => {
    const res = await fetch(`/api/community/comments?post_id=${postId}`);
    if (!res.ok) return setComments([]);
    const data = await res.json();
    setComments(data || []);
  };

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
    }
  }, [postId]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error('You must be logged in to comment.');
      return;
    }
    if (!commentText.trim()) return;
    setCommentLoading(true);
    const res = await fetch('/api/community/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, user_id: userId, content: commentText })
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || 'Failed to post comment');
      setCommentLoading(false);
      return;
    }
    setCommentText("");
    setCommentLoading(false);
    fetchComments();
  };

  const handleLike = async () => {
    if (!userId) {
      toast.error('You must be logged in to like posts.');
      return;
    }
    setLikeLoading(true);
    const res = await fetch('/api/community/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, user_id: userId })
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || 'Failed to like post');
      setLikeLoading(false);
      return;
    }
    setLikeLoading(false);
    fetchPost();
  };

  const handleDeletePost = async () => {
    if (!user || !post) return;
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    setDeletingPost(true);
    try {
      const res = await fetch('/api/community/posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id, user_id: user.id, is_admin: user.role === 'admin' }),
      });
      if (res.ok) {
        toast.success('Post deleted');
        window.location.href = '/community';
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete post');
      }
    } catch (e) {
      toast.error('Failed to delete post');
    } finally {
      setDeletingPost(false);
    }
  };
  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    setDeletingCommentId(commentId);
    try {
      const res = await fetch('/api/community/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: commentId, user_id: user.id, is_admin: user.role === 'admin' }),
      });
      if (res.ok) {
        toast.success('Comment deleted');
        fetchComments();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete comment');
      }
    } catch (e) {
      toast.error('Failed to delete comment');
    } finally {
      setDeletingCommentId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-2">
      <div className="max-w-2xl mx-auto w-full">
        <Link href="/community" className="flex items-center gap-2 text-purple-600 hover:underline mb-6">
          <FaArrowLeft /> Back to Community
        </Link>
        {loading || !post ? (
          <div className="text-center text-gray-500 py-10">Loading post...</div>
        ) : (
          <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-2 mb-8 transition-transform duration-150 hover:shadow-lg hover:-translate-y-1">
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
                  className={`ml-2 text-xs text-red-500 hover:underline focus:outline-none focus:ring-2 focus:ring-red-400 rounded px-1 flex items-center gap-1 ${deletingPost ? 'opacity-60 pointer-events-none' : ''}`}
                  onClick={handleDeletePost}
                  aria-label="Delete post"
                  disabled={deletingPost}
                >
                  {deletingPost ? <FaSpinner className="animate-spin text-xs" /> : 'Delete'}
                </button>
              )}
            </div>
            <div className="text-gray-800 text-base mb-2 whitespace-pre-line">{post.content}</div>
            {post.image_url && (
              <img src={post.image_url} alt="Post image" className="rounded-lg max-h-60 object-cover border border-gray-100" />
            )}
            <div className="flex items-center gap-6 mt-2">
              <button
                className="flex items-center gap-1 text-gray-500 hover:text-fuchsia-500 transition-colors"
                onClick={handleLike}
                disabled={likeLoading}
              >
                <FaHeart className="text-lg" /> <span>Like</span>
                <span className="ml-1 text-xs">{likeCount}</span>
              </button>
              <span className="flex items-center gap-1 text-gray-500">
                <FaRegCommentDots className="text-lg" /> <span>{comments.length} Comments</span>
              </span>
            </div>
          </div>
        )}
        {/* Comments */}
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Comments</h3>
          <form className="flex gap-2 mb-6" onSubmit={handleComment}>
            <input
              type="text"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
              disabled={commentLoading}
            />
            <button
              type="submit"
              disabled={commentLoading || !commentText.trim()}
              className="bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:from-fuchsia-600 hover:to-purple-700 text-white font-bold px-4 py-2 rounded-lg shadow transition-all duration-200 disabled:opacity-60"
            >
              {commentLoading ? "Posting..." : "Post"}
            </button>
          </form>
          {comments.length === 0 ? (
            <div className="text-gray-400 text-center">No comments yet.</div>
          ) : (
            <div className="space-y-4">
              {comments.map((c, idx) => (
                <div key={c.id} className="flex items-start gap-3 border-b border-gray-100 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
                  <img
                    src={c.users?.avatar_url || "/app/images/esports%20bg.webp"}
                    alt={c.users?.name || "User"}
                    className="w-8 h-8 rounded-full object-cover border border-gray-200 mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{c.users?.name || "User"}</div>
                    <div className="text-gray-700 text-sm whitespace-pre-line">{c.content}</div>
                    <div className="text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleString()}</div>
                    {(user && (user.id === c.user_id || user.role === 'admin')) && (
                      <button
                        className={`mt-1 text-xs text-red-500 hover:underline focus:outline-none focus:ring-2 focus:ring-red-400 rounded px-1 flex items-center gap-1 ${deletingCommentId === c.id ? 'opacity-60 pointer-events-none' : ''}`}
                        onClick={() => handleDeleteComment(c.id)}
                        aria-label="Delete comment"
                        disabled={deletingCommentId === c.id}
                      >
                        {deletingCommentId === c.id ? <FaSpinner className="animate-spin text-xs" /> : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 