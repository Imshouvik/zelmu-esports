"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageGuard from "@/components/PageGuard";
import { supabase } from '@/utils/supabaseClient';

interface Tournament {
  id: string;
  title: string;
}

interface PointsRule {
  id: string;
  tournament_id: string;
  win_points: number;
  draw_points: number;
  loss_points: number;
  custom_rules: any;
}

export default function AdminPointsRulesPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [rules, setRules] = useState<PointsRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<PointsRule | null>(null);
  const [form, setForm] = useState<{ win_points: number; draw_points: number; loss_points: number; custom_rules: string }>({ win_points: 3, draw_points: 1, loss_points: 0, custom_rules: "" });
  const [saving, setSaving] = useState(false);

  // Fetch tournaments for selection
  const fetchTournaments = async () => {
    try {
      const { data: { session } } = await supabase!.auth.getSession();
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

  // Fetch points rules for selected tournament
  const fetchRules = async (tournament_id: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase!.auth.getSession();
      const accessToken = session?.access_token;
      const res = await fetch(`/api/points-rules?tournament_id=${tournament_id}`, {
        headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setRules(data);
      } else if (data && data.error) {
        toast.error(data.error);
        setRules([]);
      } else {
        toast.error("Unexpected response from server");
        setRules([]);
      }
    } catch (err) {
      toast.error("Failed to fetch points rules");
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) fetchRules(selectedTournament);
    else setRules([]);
  }, [selectedTournament]);

  // Open modal for add/edit
  const openModal = (rule?: PointsRule) => {
    if (rule) {
      setEditingRule(rule);
      setForm({
        win_points: rule.win_points,
        draw_points: rule.draw_points,
        loss_points: rule.loss_points,
        custom_rules: JSON.stringify(rule.custom_rules, null, 2),
      });
    } else {
      setEditingRule(null);
      setForm({ win_points: 3, draw_points: 1, loss_points: 0, custom_rules: "" });
    }
    setShowModal(true);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { session } } = await supabase!.auth.getSession();
      const accessToken = session?.access_token;
      const method = editingRule ? "PUT" : "POST";
      const body = {
        ...(editingRule ? { id: editingRule.id } : { tournament_id: selectedTournament }),
        win_points: form.win_points,
        draw_points: form.draw_points,
        loss_points: form.loss_points,
        custom_rules: form.custom_rules ? JSON.parse(form.custom_rules) : [],
      };
      const res = await fetch("/api/points-rules", {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save points rule");
      }
      toast.success(editingRule ? "Points rule updated" : "Points rule added");
      setShowModal(false);
      fetchRules(selectedTournament);
    } catch (err: any) {
      toast.error(err.message || "Failed to save points rule");
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this points rule?")) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase!.auth.getSession();
      const accessToken = session?.access_token;
      const res = await fetch("/api/points-rules", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete points rule");
      }
      toast.success("Points rule deleted");
      fetchRules(selectedTournament);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete points rule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageGuard pageKey="admin-points-rules">
      <div className="min-h-screen bg-gradient-to-br from-[#0f051d] via-[#18122b] to-[#232046] py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-fuchsia-400 drop-shadow-[0_2px_24px_rgba(236,72,153,0.5)]">Manage Points Rules</h1>
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
                + Add Points Rule
              </button>
              {loading ? (
                <div className="text-fuchsia-200">Loading points rules...</div>
              ) : (
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl overflow-x-auto">
                  <table className="w-full text-white">
                    <thead>
                      <tr className="bg-fuchsia-900/30">
                        <th className="p-3 text-left">Win</th>
                        <th className="p-3 text-left">Draw</th>
                        <th className="p-3 text-left">Loss</th>
                        <th className="p-3 text-left">Custom Rules</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.map((rule) => (
                        <tr key={rule.id} className="border-b border-fuchsia-700/20">
                          <td className="p-3">{rule.win_points}</td>
                          <td className="p-3">{rule.draw_points}</td>
                          <td className="p-3">{rule.loss_points}</td>
                          <td className="p-3 text-xs whitespace-pre-wrap max-w-xs">{JSON.stringify(rule.custom_rules, null, 2)}</td>
                          <td className="p-3 flex gap-2">
                            <button
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded shadow"
                              onClick={() => openModal(rule)}
                            >
                              Edit
                            </button>
                            <button
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded shadow"
                              onClick={() => handleDelete(rule.id)}
                              disabled={saving}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {rules.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-3 text-center text-fuchsia-200">No points rules found.</td>
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
                    <h2 className="text-xl font-bold mb-4 text-fuchsia-400">{editingRule ? "Edit Points Rule" : "Add Points Rule"}</h2>
                    <form onSubmit={handleSubmit}>
                      <div className="mb-4">
                        <label className="block mb-1 font-medium text-white">Win Points</label>
                        <input
                          type="number"
                          className="w-full border border-fuchsia-500/30 px-3 py-2 rounded bg-white/10 text-white"
                          value={form.win_points}
                          onChange={e => setForm(f => ({ ...f, win_points: Number(e.target.value) }))}
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block mb-1 font-medium text-white">Draw Points</label>
                        <input
                          type="number"
                          className="w-full border border-fuchsia-500/30 px-3 py-2 rounded bg-white/10 text-white"
                          value={form.draw_points}
                          onChange={e => setForm(f => ({ ...f, draw_points: Number(e.target.value) }))}
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block mb-1 font-medium text-white">Loss Points</label>
                        <input
                          type="number"
                          className="w-full border border-fuchsia-500/30 px-3 py-2 rounded bg-white/10 text-white"
                          value={form.loss_points}
                          onChange={e => setForm(f => ({ ...f, loss_points: Number(e.target.value) }))}
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block mb-1 font-medium text-white">Custom Rules (JSON)</label>
                        <textarea
                          className="w-full border border-fuchsia-500/30 px-3 py-2 rounded font-mono text-xs bg-white/10 text-white"
                          rows={4}
                          value={form.custom_rules}
                          onChange={e => setForm(f => ({ ...f, custom_rules: e.target.value }))}
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
                          {saving ? 'Saving...' : (editingRule ? 'Save Changes' : 'Add Points Rule')}
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