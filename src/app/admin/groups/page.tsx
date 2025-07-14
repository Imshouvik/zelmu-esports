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
  name: string;
  tournament_id: string;
}

interface Group {
  id: string;
  tournament_id: string;
  stage_id: string;
  name: string;
  group_order: number;
  time_slot?: string;
  max_teams?: number;
  current_teams?: number;
}

export default function AdminGroupsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [stages, setStages] = useState<Stage[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  // Update form state to include time_slot, current_teams, max_teams
  const [form, setForm] = useState<{ name: string; group_order: number; time_slot?: string; current_teams?: number; max_teams?: number }>({ name: "", group_order: 1, time_slot: "", current_teams: 0, max_teams: 24 });
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

  // Fetch stages for selected tournament
  const fetchStages = async (tournament_id: string) => {
    try {
      const { data: { session } } = await supabase!.auth.getSession();
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
    }
  };

  // Fetch groups for selected stage
  const fetchGroups = async (stage_id: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase!.auth.getSession();
      const accessToken = session?.access_token;
      const res = await fetch(`/api/groups?stage_id=${stage_id}`, {
        headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setGroups(data);
      } else if (data && data.error) {
        toast.error(data.error);
        setGroups([]);
      } else {
        toast.error("Unexpected response from server");
        setGroups([]);
      }
    } catch (err) {
      toast.error("Failed to fetch groups");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchStages(selectedTournament);
      setSelectedStage("");
      setGroups([]);
    } else {
      setStages([]);
      setSelectedStage("");
      setGroups([]);
    }
  }, [selectedTournament]);

  useEffect(() => {
    if (selectedStage) fetchGroups(selectedStage);
    else setGroups([]);
  }, [selectedStage]);

  // Open modal for add/edit
  const openModal = (group?: Group) => {
    if (group) {
      setEditingGroup(group);
      setForm({
        name: group.name,
        group_order: group.group_order || 1,
        time_slot: group.time_slot || "",
        current_teams: group.current_teams || 0,
        max_teams: group.max_teams || 24,
      });
    } else {
      setEditingGroup(null);
      setForm({ name: "", group_order: 1, time_slot: "", current_teams: 0, max_teams: 24 });
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
      const method = editingGroup ? "PUT" : "POST";
      const body = {
        ...(editingGroup ? { id: editingGroup.id } : { tournament_id: selectedTournament, stage_id: selectedStage }),
        name: form.name,
        group_order: form.group_order,
        time_slot: form.time_slot,
        current_teams: editingGroup ? form.current_teams : 0,
        max_teams: form.max_teams,
      };
      const res = await fetch("/api/groups", {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save group");
      }
      toast.success(editingGroup ? "Group updated" : "Group added");
      setShowModal(false);
      fetchGroups(selectedStage);
    } catch (err: any) {
      toast.error(err.message || "Failed to save group");
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this group?")) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase!.auth.getSession();
      const accessToken = session?.access_token;
      const res = await fetch("/api/groups", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete group");
      }
      toast.success("Group deleted");
      fetchGroups(selectedStage);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete group");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageGuard pageKey="admin-groups">
      <div className="min-h-screen bg-gradient-to-br from-[#0f051d] via-[#18122b] to-[#232046] py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-fuchsia-400 drop-shadow-[0_2px_24px_rgba(236,72,153,0.5)]">Manage Groups</h1>
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
          <div className="mb-6">
            <label className="block mb-1 font-medium text-white">Select Stage</label>
            <select
              className="w-full border border-fuchsia-500/30 px-3 py-2 rounded bg-white/10 text-white"
              value={selectedStage}
              onChange={e => setSelectedStage(e.target.value)}
            >
              <option value="">-- Select --</option>
              {stages.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          {selectedStage && (
            <>
              <button
                className="mb-6 px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white rounded-xl font-bold shadow hover:scale-105 transition-all duration-300"
                onClick={() => openModal()}
              >
                + Add Group
              </button>
              {loading ? (
                <div className="text-fuchsia-200">Loading groups...</div>
              ) : (
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl overflow-x-auto">
                  <table className="w-full text-white">
                    <thead>
                      <tr className="bg-fuchsia-900/30">
                        <th className="p-3 text-left">Name</th>
                        <th className="p-3 text-left">Order</th>
                        <th className="p-3 text-left">Time Slot</th>
                        <th className="p-3 text-left">Teams</th>
                        <th className="p-3 text-left">Max Teams</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map((group) => (
                        <tr key={group.id} className="border-b border-fuchsia-700/20">
                          <td className="p-3">{group.name}</td>
                          <td className="p-3">{group.group_order}</td>
                          <td className="p-3">{group.time_slot ? group.time_slot.slice(0,5) : '-'}</td>
                          <td className="p-3">{typeof group.current_teams === 'number' ? group.current_teams : '-'}</td>
                          <td className="p-3">{typeof group.max_teams === 'number' ? group.max_teams : '-'}</td>
                          <td className="p-3 flex gap-2">
                            <button
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded shadow"
                              onClick={() => openModal(group)}
                            >
                              Edit
                            </button>
                            <button
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded shadow"
                              onClick={() => handleDelete(group.id)}
                              disabled={saving}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {groups.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-3 text-center text-fuchsia-200">No groups found.</td>
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
                    <h2 className="text-xl font-bold mb-4 text-fuchsia-400">{editingGroup ? "Edit Group" : "Add Group"}</h2>
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
                        <label className="block mb-1 font-medium text-white">Order</label>
                        <input
                          type="number"
                          className="w-full border border-fuchsia-500/30 px-3 py-2 rounded bg-white/10 text-white"
                          value={form.group_order}
                          onChange={e => setForm(f => ({ ...f, group_order: Number(e.target.value) }))}
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-fuchsia-200 text-sm mb-1">Time Slot</label>
                        <input
                          type="time"
                          value={form.time_slot}
                          onChange={e => setForm(f => ({ ...f, time_slot: e.target.value }))}
                          className="w-full px-3 py-2 bg-white/10 border border-fuchsia-500/30 rounded text-white text-sm"
                        />
                      </div>
                      {editingGroup && (
                        <div className="mb-4">
                          <label className="block text-fuchsia-200 text-sm mb-1">Teams</label>
                          <input
                            type="number"
                            value={form.current_teams}
                            min={0}
                            onChange={e => setForm(f => ({ ...f, current_teams: Number(e.target.value) }))}
                            className="w-full px-3 py-2 bg-white/10 border border-fuchsia-500/30 rounded text-white text-sm"
                          />
                        </div>
                      )}
                      <div className="mb-4">
                        <label className="block text-fuchsia-200 text-sm mb-1">Max Teams</label>
                        <input
                          type="number"
                          value={form.max_teams}
                          min={1}
                          onChange={e => setForm(f => ({ ...f, max_teams: Number(e.target.value) }))}
                          className="w-full px-3 py-2 bg-white/10 border border-fuchsia-500/30 rounded text-white text-sm"
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
                          {saving ? 'Saving...' : (editingGroup ? 'Save Changes' : 'Add Group')}
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