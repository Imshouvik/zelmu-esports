"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageGuard from "@/components/PageGuard";
import { supabase } from '@/utils/supabaseClient';

interface Game {
  id: string;
  name: string;
  rules: any;
}

export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [form, setForm] = useState<{ name: string; rules: string }>({ name: "", rules: "" });
  const [saving, setSaving] = useState(false);

  // Fetch all games
  const fetchGames = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const res = await fetch("/api/games", {
        headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setGames(data);
      } else if (data && data.error) {
        toast.error(data.error);
        setGames([]);
      } else {
        toast.error("Unexpected response from server");
        setGames([]);
      }
    } catch (err) {
      toast.error("Failed to fetch games");
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  // Open modal for add/edit
  const openModal = (game?: Game) => {
    if (game) {
      setEditingGame(game);
      setForm({ name: game.name, rules: JSON.stringify(game.rules, null, 2) });
    } else {
      setEditingGame(null);
      setForm({ name: "", rules: "" });
    }
    setShowModal(true);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const method = editingGame ? "PUT" : "POST";
      const body = {
        ...(editingGame ? { id: editingGame.id } : {}),
        name: form.name,
        rules: form.rules ? JSON.parse(form.rules) : [],
      };
      const res = await fetch("/api/games", {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save game");
      }
      toast.success(editingGame ? "Game updated" : "Game added");
      setShowModal(false);
      fetchGames();
    } catch (err: any) {
      toast.error(err.message || "Failed to save game");
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this game?")) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const res = await fetch("/api/games", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete game");
      }
      toast.success("Game deleted");
      fetchGames();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete game");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageGuard pageKey="admin-games">
      <div className="min-h-screen bg-gradient-to-br from-[#0f051d] via-[#18122b] to-[#232046] py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-fuchsia-400 drop-shadow-[0_2px_24px_rgba(236,72,153,0.5)]">Manage Games</h1>
          <button
            className="mb-6 px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white rounded-xl font-bold shadow hover:scale-105 transition-all duration-300"
            onClick={() => openModal()}
          >
            + Add Game
          </button>
          {loading ? (
            <div className="text-fuchsia-200">Loading games...</div>
          ) : (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="bg-fuchsia-900/30">
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Rules (JSON)</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((game) => (
                    <tr key={game.id} className="border-b border-fuchsia-700/20">
                      <td className="p-3">{game.name}</td>
                      <td className="p-3 text-xs whitespace-pre-wrap max-w-xs">{JSON.stringify(game.rules, null, 2)}</td>
                      <td className="p-3 flex gap-2">
                        <button
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded shadow"
                          onClick={() => openModal(game)}
                        >
                          Edit
                        </button>
                        <button
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded shadow"
                          onClick={() => handleDelete(game.id)}
                          disabled={saving}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {games.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-3 text-center text-fuchsia-200">No games found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal for add/edit */}
          {showModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-8 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 text-fuchsia-400">{editingGame ? "Edit Game" : "Add Game"}</h2>
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block mb-1 font-medium text-white">Name</label>
                    <input
                      type="text"
                      className="w-full border border-fuchsia-500/30 px-3 py-2 rounded bg-white/10 text-white"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-1 font-medium text-white">Rules (JSON)</label>
                    <textarea
                      className="w-full border border-fuchsia-500/30 px-3 py-2 rounded font-mono text-xs bg-white/10 text-white"
                      rows={6}
                      value={form.rules}
                      onChange={e => setForm(f => ({ ...f, rules: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-6 py-2 rounded-lg font-bold shadow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving...' : (editingGame ? 'Save Changes' : 'Add Game')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageGuard>
  );
} 