"use client";
import { useState } from "react";
import toast from 'react-hot-toast';
import { useEffect, useRef } from 'react';
// @ts-ignore
import imageCompression from 'browser-image-compression';
import { supabase } from '@/utils/supabaseClient';

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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Compress and resize image
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: 0.8,
    };
    const compressedFile = await imageCompression(file, options);
    setSelectedImage(compressedFile);
    setSelectedVideo(null);
    setMediaPreview(URL.createObjectURL(compressedFile));
  };
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Check video duration
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(url);
      if (video.duration > 30) {
        setSelectedVideo(null);
        setMediaPreview(null);
        toast.error('Video must be 30 seconds or less.');
      } else {
        setSelectedVideo(file);
        setSelectedImage(null);
        setMediaPreview(url);
      }
    };
    video.src = url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    let uploadedUrl = imageUrl;
    if (selectedImage && supabase) {
      const { data, error } = await supabase.storage.from('community-media').upload(`images/${Date.now()}_${selectedImage.name}`, selectedImage, { cacheControl: '3600', upsert: false });
      if (error) {
        setError('Failed to upload image');
        toast.error('Failed to upload image');
        setLoading(false);
        return;
      }
      uploadedUrl = supabase.storage.from('community-media').getPublicUrl(data.path).data.publicUrl;
    } else if (selectedVideo && supabase) {
      const { data, error } = await supabase.storage.from('community-media').upload(`videos/${Date.now()}_${selectedVideo.name}`, selectedVideo, { cacheControl: '3600', upsert: false });
      if (error) {
        setError('Failed to upload video');
        toast.error('Failed to upload video');
        setLoading(false);
        return;
      }
      uploadedUrl = supabase.storage.from('community-media').getPublicUrl(data.path).data.publicUrl;
    }
    const res = await fetch("/api/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        content,
        type,
        image_url: uploadedUrl || undefined,
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
    setSelectedImage(null);
    setSelectedVideo(null);
    setMediaPreview(null);
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
          <div className="flex flex-col gap-2 mb-4">
            <label className="font-semibold">Attach Image</label>
            <input type="file" accept="image/*" onChange={handleImageChange} disabled={loading || !!selectedVideo} />
            <label className="font-semibold mt-2">Attach Video (max 30s)</label>
            <input type="file" accept="video/*" onChange={handleVideoChange} disabled={loading || !!selectedImage} />
            {mediaPreview && selectedImage && (
              <img src={mediaPreview} alt="Preview" className="rounded-lg max-h-48 mt-2 object-contain" style={{ width: '100%', height: 'auto' }} />
            )}
            {mediaPreview && selectedVideo && (
              <video src={mediaPreview} controls className="rounded-lg max-h-48 mt-2 object-contain" style={{ width: '100%', height: 'auto' }} />
            )}
          </div>
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