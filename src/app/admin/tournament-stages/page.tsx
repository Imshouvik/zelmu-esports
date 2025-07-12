"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageGuard from "@/components/PageGuard";
import { supabase } from '@/utils/supabaseClient';

interface Tournament {
  id: string;
  title: string;
}

interface Stage {
  id: string;
  tournament_id: string;
  name: string;
  type: string;
  stage_order: number;
}

export default function AdminTournamentStagesPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [form, setForm] = useState<{ name: string; type: string; stage_order: number }>({ name: "", type: "", stage_order: 1 });
  const [saving, setSaving] = useState(false);

  // Fetch tournaments for selection
  const fetchTournaments = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const res = await fetch("/api/tournaments", {
        headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setTournaments(data);
      } else if (data && data.error) {
        toast.error(data.error);
        setTournaments([]);
      } else {
        toast.error("Unexpected response from server");
        setTournaments([]);
      }
    } catch (err) {
      toast.error("Failed to fetch tournaments");
      setTournaments([]);
    }
  };

  // Fetch stages for selected tournament
  const fetchStages = async (tournament_id: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const res = await fetch(`/api/tournament-stages?tournament_id=${tournament_id}`, {
        headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setStages(data);
      } else if (data && data.error) {
        toast.error(data.error);
        setStages([]);
      } else {
        toast.error("Unexpected response from server");
        setStages([]);
      }
    } catch (err) {
      toast.error("Failed to fetch stages");
      setStages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) fetchStages(selectedTournament);
    else setStages([]);
  }, [selectedTournament]);

  // Open modal for add/edit
  const openModal = (stage?: Stage) => {
    if (stage) {
      setEditingStage(stage);
      setForm({ name: stage.name, type: stage.type || "", stage_order: stage.stage_order || 1 });
    } else {
      setEditingStage(null);
      setForm({ name: "", type: "", stage_order: 1 });
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
      const method = editingStage ? "PUT" : "POST";
      const body = {
        ...(editingStage ? { id: editingStage.id } : { tournament_id: selectedTournament }),
        name: form.name,
        type: form.type,
        stage_order: form.stage_order,
      };
      const res = await fetch("/api/tournament-stages", {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save stage");
      }
      toast.success(editingStage ? "Stage updated" : "Stage added");
      setShowModal(false);
      fetchStages(selectedTournament);
    } catch (err: any) {
      toast.error(err.message || "Failed to save stage");
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this stage?")) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const res = await fetch("/api/tournament-stages", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete stage");
      }
      toast.success("Stage deleted");
      fetchStages(selectedTournament);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete stage");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageGuard pageKey="admin-tournament-stages">
      <div className="min-h-screen bg-gradient-to-br from-[#0f051d] via-[#18122b] to-[#232046] py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-fuchsia-400 drop-shadow-[0_2px_24px_rgba(236,72,153,0.5)]">Manage Tournament Stages</h1>
          <div className="mb-6">
            <label className="block mb-1 font-medium text-white">Select Tournament</label>
            <select
              className="w-full border border-fuchsia-500/30 px-3 py-2 rounded bg-white/10 text-white"
              value={selectedTournament}
              onChange={e => setSelectedTournament(e.target.value)}
            >
              <option value="">-- Select --</option>
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
          {selectedTournament && (
            <>
              <button
                className="mb-6 px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white rounded-xl font-bold shadow hover:scale-105 transition-all duration-300"
                onClick={() => openModal()}
              >
                + Add Stage
              </button>
              {loading ? (
                <div className="text-fuchsia-200">Loading stages...</div>
              ) : (
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl overflow-x-auto">
                  <table className="w-full text-white">
                    <thead>
                      <tr className="bg-fuchsia-900/30">
                        <th className="p-3 text-left">Name</th>
                        <th className="p-3 text-left">Type</th>
                        <th className="p-3 text-left">Order</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stages.map((stage) => (
                        <tr key={stage.id} className="border-b border-fuchsia-700/20">
                          <td className="p-3">{stage.name}</td>
                          <td className="p-3">{stage.type}</td>
                          <td className="p-3">{stage.stage_order}</td>
                          <td className="p-3 flex gap-2">
                            <button
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded shadow"
                              onClick={() => openModal(stage)}
                            >
                              Edit
                            </button>
                            <button
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded shadow"
                              onClick={() => handleDelete(stage.id)}
                              disabled={saving}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {stages.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-3 text-center text-fuchsia-200">No stages found.</td>
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
                    <h2 className="text-xl font-bold mb-4 text-fuchsia-400">{editingStage ? "Edit Stage" : "Add Stage"}</h2>
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
                        <label className="block mb-1 font-medium text-white">Type</label>
                        <input
                          type="text"
                          className="w-full border border-fuchsia-500/30 px-3 py-2 rounded bg-white/10 text-white"
                          value={form.type}
                          onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block mb-1 font-medium text-white">Order</label>
                        <input
                          type="number"
                          className="w-full border border-fuchsia-500/30 px-3 py-2 rounded bg-white/10 text-white"
                          value={form.stage_order}
                          onChange={e => setForm(f => ({ ...f, stage_order: Number(e.target.value) }))}
                          required
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
                          {saving ? 'Saving...' : (editingStage ? 'Save Changes' : 'Add Stage')}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageGuard>
  );
} 