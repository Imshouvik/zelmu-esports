"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FaRegCommentDots, FaHeart, FaArrowLeft, FaSpinner, FaRegPaperPlane } from "react-icons/fa";
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Picker from '@emoji-mart/react';
import { supabase } from '@/utils/supabaseClient';
import { useRouter } from "next/navigation";

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
  const [reactions, setReactions] = useState<Record<string, string[]>>({});
  const [showReactionBar, setShowReactionBar] = useState(false);
  const reactionEmojis = ['👍', '❤️', '😂', '😮'];
  const reactionLabels: Record<string, string> = { '👍': 'Like', '❤️': 'Love', '😂': 'Haha', '😮': 'Wow' };
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState<string>("");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);

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

  // Helper: get user's current reaction
  const userReaction = Object.entries(reactions).find(([emoji, users]) => users.includes(userId))?.[0] || null;

  // Fetch reactions for the post
  const fetchReactions = async () => {
    const res = await fetch(`/api/community/reactions?postId=${postId}`);
    if (res.ok) {
      const data = await res.json();
      setReactions(data.reactions || {});
    } else {
      setReactions({});
    }
  };

  useEffect(() => {
    if (postId) {
      fetchPost();
      fetchComments();
      fetchReactions();
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
      setShowLoginModal(true);
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

  // Add/toggle emoji reaction (fixed token logic)
  const handleEmojiReaction = async (emoji: string) => {
    if (!userId) {
      setShowLoginModal(true);
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
    fetchReactions();
    setShowReactionBar(false);
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

  const handleEditComment = (commentId: string, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(currentContent);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editingCommentText.trim()) return;
    try {
      const res = await fetch('/api/community/comments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: commentId,
          content: editingCommentText,
          user_id: user.id,
          is_admin: user.role === 'admin'
        })
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to update comment');
        return;
      }
      setEditingCommentId(null);
      setEditingCommentText("");
      fetchComments();
      toast.success('Comment updated');
    } catch (e) {
      toast.error('Failed to update comment');
    }
  };

  const handleShare = () => {
    setShareModalOpen(true);
  };
  const handleCopyLink = () => {
    if (post) {
      const url = `${window.location.origin}/community/${post.id}`;
      navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
  };
  const handleWebShare = () => {
    if (post && navigator.share) {
      navigator.share({
        title: 'Check out this post on Zelmu Esports',
        text: post.content,
        url: `${window.location.origin}/community/${post.id}`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-0 sm:px-2">
      <div className="w-full sm:max-w-2xl sm:mx-auto">
        {/* Back to Community Button */}
        <button
          onClick={() => router.push('/community')}
          className="flex items-center gap-2 text-purple-600 hover:underline mb-6 px-4 sm:px-0 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 rounded"
          aria-label="Back to Community"
        >
          <FaArrowLeft /> Back to Community
        </button>
        {loading || !post ? (
          <div className="text-center text-gray-500 py-10">Loading post...</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col gap-2 mb-8 transition-transform duration-150 hover:shadow-xl hover:-translate-y-1 border border-gray-100">
            <div className="flex items-center gap-3 mb-1">
              <img
                src={post.users?.avatar_url || "/app/images/esports%20bg.webp"}
                alt={post.users?.name || "User"}
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
              />
              <div>
                <div className="font-bold text-gray-900 text-base sm:text-lg">{post.users?.name || "User"}</div>
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
            <div className="text-gray-800 text-base sm:text-lg mb-2 whitespace-pre-line">{post.content}</div>
            {/* Media display with lightbox/modal */}
            {post.image_url && post.image_url.match(/\.(mp4|webm|ogg)$/i) ? (
              <div className="relative group cursor-pointer" onClick={() => setLightboxMedia({ url: String(post.image_url || ''), type: 'video' })}>
                <video src={String(post.image_url || '')} controls className="rounded-xl max-h-96 w-full object-contain border border-gray-100 my-2" style={{ width: '100%', height: 'auto' }} />
              </div>
            ) : post.image_url ? (
              <div className="relative group cursor-pointer" onClick={() => setLightboxMedia({ url: String(post.image_url || ''), type: 'image' })}>
                <img src={String(post.image_url || '')} alt="Post media" className="rounded-xl max-h-96 w-full object-contain border border-gray-100 my-2 transition-transform duration-200 group-hover:scale-105" style={{ width: '100%', height: 'auto' }} />
              </div>
            ) : null}
            {/* Lightbox/modal for media */}
            {lightboxMedia && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setLightboxMedia(null)}>
                <div className="relative max-w-3xl w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                  {/* Close button */}
                  <button
                    className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white text-gray-900 rounded-full p-2 shadow-lg text-2xl font-bold focus:outline-none"
                    onClick={e => { e.stopPropagation(); setLightboxMedia(null); }}
                    aria-label="Close"
                  >
                    ×
                  </button>
                  {lightboxMedia.type === 'image' ? (
                    <img src={String(lightboxMedia.url || '')} alt="Full view" className="rounded-xl max-h-[80vh] w-auto object-contain shadow-2xl" onClick={e => e.stopPropagation()} />
                  ) : (
                    <video src={String(lightboxMedia.url || '')} controls autoPlay className="rounded-xl max-h-[80vh] w-auto object-contain shadow-2xl" onClick={e => e.stopPropagation()} />
                  )}
                </div>
              </div>
            )}
            {/* Facebook-style Reaction Summary Bar */}
            <div className="flex items-center justify-between mt-2 mb-2 px-1 sm:px-0">
              {/* Reactions summary */}
              <div className="flex items-center gap-0.5">
                {/* Top 2 reactions, overlapping */}
                {(() => {
                  const sorted = Object.entries(reactions).sort((a, b) => b[1].length - a[1].length);
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
                {/* Total reactions count (hide if zero) */}
                {Object.values(reactions || {}).reduce((acc, users) => acc + users.length, 0) > 0 && (
                  <span className="ml-2 text-gray-700 font-medium text-xs sm:text-sm">
                    {Object.values(reactions || {}).reduce((acc, users) => acc + users.length, 0)}
                  </span>
                )}
              </div>
              {/* Comments and Shares - removed comments count/label for post page */}
              <div className="text-gray-600 text-xs sm:text-sm">
                0 Shares
              </div>
            </div>
            {/* Like/Reaction Button with Facebook-style bar */}
            <div className="flex items-center justify-between gap-2 mt-2 px-1 sm:px-0">
              {/* Like, Comment, Share action bar */}
              <div className="flex flex-1 items-center justify-around">
                {/* Like button */}
                <div className="relative">
                  <button
                    className={`flex items-center gap-1 px-3 py-2 rounded-full font-semibold border shadow-sm transition-colors text-base sm:text-lg ${userReaction ? 'bg-fuchsia-100 border-fuchsia-400 text-fuchsia-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-fuchsia-50 hover:border-fuchsia-300 active:scale-95'}`}
                    style={{ minWidth: 64, minHeight: 40 }}
                    onClick={e => {
                      if (!userId) return;
                      if (!showReactionBar) handleEmojiReaction(userReaction ? userReaction : '👍');
                    }}
                    onMouseDown={e => {
                      if (!userId) return;
                      if (e.button === 0) {
                        const timeout = setTimeout(() => setShowReactionBar(true), 400);
                        (e.target as HTMLElement).setAttribute('data-reaction-timeout', String((timeout as unknown as number)));
                      }
                    }}
                    onMouseUp={e => {
                      if (!userId) return;
                      const timeout = (e.target as HTMLElement).getAttribute('data-reaction-timeout');
                      if (timeout) clearTimeout(Number(timeout));
                      (e.target as HTMLElement).removeAttribute('data-reaction-timeout');
                    }}
                    onMouseLeave={e => {
                      if (!userId) return;
                      const timeout = (e.target as HTMLElement).getAttribute('data-reaction-timeout');
                      if (timeout) clearTimeout(Number(timeout));
                      (e.target as HTMLElement).removeAttribute('data-reaction-timeout');
                    }}
                    onTouchStart={e => {
                      if (!userId) return;
                      const timeout = setTimeout(() => setShowReactionBar(true), 400);
                      (e.target as HTMLElement).setAttribute('data-reaction-timeout', String((timeout as unknown as number)));
                    }}
                    onTouchEnd={e => {
                      if (!userId) return;
                      const timeout = (e.target as HTMLElement).getAttribute('data-reaction-timeout');
                      if (timeout) clearTimeout(Number(timeout));
                      (e.target as HTMLElement).removeAttribute('data-reaction-timeout');
                      setTimeout(() => setShowReactionBar(false), 200);
                    }}
                    disabled={!userId}
                    type="button"
                  >
                    <span className="text-lg sm:text-xl">
                      {userReaction || '👍'}
                    </span>
                    <span className="ml-1">{reactionLabels[userReaction || '👍']}</span>
                  </button>
                  {/* Reaction bar on hard click/long-press only */}
                  {showReactionBar && userId && (
                    <div
                      className="absolute left-0 top-12 flex gap-2 bg-white border border-gray-200 rounded-full shadow-lg px-3 py-2 z-50 animate-fade-in"
                      style={{minWidth:'200px', justifyContent:'center'}}
                      onMouseLeave={() => setShowReactionBar(false)}
                    >
                      {reactionEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          className="text-2xl sm:text-3xl hover:scale-125 transition-transform focus:outline-none active:scale-110"
                          style={{padding:'4px'}}
                          onClick={() => { handleEmojiReaction(emoji); setShowReactionBar(false); }}
                          type="button"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Share button (paper plane icon) */}
                <button className="flex items-center gap-1 px-3 py-2 rounded-full font-semibold border shadow-sm transition-colors text-base sm:text-lg bg-white border-gray-300 text-gray-700 hover:bg-fuchsia-50 hover:border-fuchsia-300 active:scale-95" type="button" onClick={handleShare}>
                  <FaRegPaperPlane className="text-lg sm:text-xl" />
                  <span>Share</span>
                </button>
              </div>
            </div>
            {/* Unified login prompt for like, react, and comment */}
            {!userId && (
              <div className="flex flex-col items-center gap-2 my-4">
                <div className="text-gray-500">You must be logged in to like, react, or comment.</div>
                <Link href={`/login?redirect=/community/${postId}`} className="text-purple-600 underline font-semibold">Login or Register</Link>
              </div>
            )}
            {/* Comments */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Comments</h3>
              {userId ? (
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
              ) : null}
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
                        {editingCommentId === c.id ? (
                          <div className="flex flex-col gap-2 mt-1">
                            <input
                              type="text"
                              value={editingCommentText}
                              onChange={e => setEditingCommentText(e.target.value)}
                              className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                className="bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white font-bold px-3 py-1 rounded shadow hover:from-fuchsia-600 hover:to-purple-700"
                                onClick={() => handleSaveEdit(c.id)}
                                type="button"
                              >
                                Save
                              </button>
                              <button
                                className="bg-gray-200 text-gray-700 font-bold px-3 py-1 rounded shadow hover:bg-gray-300"
                                onClick={handleCancelEdit}
                                type="button"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-700 text-sm whitespace-pre-line">{c.content}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleString()}</div>
                        {(user && (user.id === c.user_id || user.role === 'admin')) && (
                          <div className="flex gap-2 mt-1">
                            <button
                              className={`text-xs text-blue-500 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-1 flex items-center gap-1`}
                              onClick={() => handleEditComment(c.id, c.content)}
                              aria-label="Edit comment"
                              disabled={editingCommentId === c.id}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className={`text-xs text-red-500 hover:underline focus:outline-none focus:ring-2 focus:ring-red-400 rounded px-1 flex items-center gap-1 ${deletingCommentId === c.id ? 'opacity-60 pointer-events-none' : ''}`}
                              onClick={() => handleDeleteComment(c.id)}
                              aria-label="Delete comment"
                              disabled={deletingCommentId === c.id}
                              type="button"
                            >
                              {deletingCommentId === c.id ? <FaSpinner className="animate-spin text-xs" /> : 'Delete'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {shareModalOpen && post && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-6 w-80 flex flex-col gap-4">
            <div className="font-bold text-lg mb-2">Share Post</div>
            <button onClick={handleCopyLink} className="w-full py-2 rounded bg-gray-100 hover:bg-gray-200 font-semibold">Copy Link</button>
            <a href={`https://wa.me/?text=${encodeURIComponent(window.location.origin + '/community/' + post.id)}`} target="_blank" rel="noopener noreferrer" className="w-full py-2 rounded bg-green-100 hover:bg-green-200 font-semibold text-green-700 text-center">Share to WhatsApp</a>
            <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.origin + '/community/' + post.id)}&text=${encodeURIComponent(post.content)}`} target="_blank" rel="noopener noreferrer" className="w-full py-2 rounded bg-blue-100 hover:bg-blue-200 font-semibold text-blue-700 text-center">Share to Twitter</a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/community/' + post.id)}`} target="_blank" rel="noopener noreferrer" className="w-full py-2 rounded bg-blue-50 hover:bg-blue-100 font-semibold text-blue-900 text-center">Share to Facebook</a>
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button onClick={handleWebShare} className="w-full py-2 rounded bg-purple-100 hover:bg-purple-200 font-semibold text-purple-700">Share via App...</button>
            )}
            <button onClick={() => setShareModalOpen(false)} className="w-full py-2 rounded bg-gray-200 hover:bg-gray-300 font-semibold mt-2">Cancel</button>
          </div>
        </div>
      )}
      {/* Login required modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-6 w-80 flex flex-col gap-4 items-center">
            <div className="font-bold text-lg mb-2 text-center">You must be logged in to like or react to posts.</div>
            <button
              className="w-full py-2 rounded bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:from-fuchsia-600 hover:to-purple-700 text-white font-semibold text-lg"
              onClick={() => router.push(`/login?redirect=/community/${postId}`)}
            >
              Go to Login
            </button>
            <button
              className="w-full py-2 rounded bg-gray-200 hover:bg-gray-300 font-semibold mt-2 text-gray-700"
              onClick={() => setShowLoginModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 