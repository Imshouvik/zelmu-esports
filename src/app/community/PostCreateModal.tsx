"use client";
import { useState } from "react";
import toast from 'react-hot-toast';
import { useEffect, useRef } from 'react';

interface PostCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

const POST_TYPES = [
  { value: "discussion", label: "Discussion" },
  { value: "team_requirement", label: "Team Requirement" },
  { value: "event", label: "Event" },
];

export default function PostCreateModal({ open, onClose, onSuccess, userId }: PostCreateModalProps) {
  const [type, setType] = useState("discussion");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  // Trap focus and close on Esc
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && modalRef.current) {
        const focusableEls = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusableEls[0];
        const last = focusableEls[focusableEls.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        content,
        type,
        image_url: imageUrl || undefined,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create post");
      toast.error(data.error || "Failed to create post");
      setLoading(false);
      return;
    }
    setLoading(false);
    setContent("");
    setImageUrl("");
    setType("discussion");
    toast.success("Post created!");
    onSuccess();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fadein"
      aria-modal="true"
      role="dialog"
      ref={modalRef}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-fadein"
        style={{ animation: 'fadein 0.2s' }}
      >
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4 text-gray-900">Create a Post</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
          >
            {POST_TYPES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={4}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 resize-none"
            required
          />
          <input
            type="url"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="Image URL (optional)"
            className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
          />
          {error && <div className="text-red-500 text-sm font-semibold">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:from-fuchsia-600 hover:to-purple-700 text-white font-bold py-2 rounded-lg shadow text-lg text-center transition-all duration-200 mt-2 disabled:opacity-60"
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </form>
      </div>
    </div>
  );
} 