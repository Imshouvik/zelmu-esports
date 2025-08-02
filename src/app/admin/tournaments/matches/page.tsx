"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import toast from "react-hot-toast";
import { istLocalStringToUtcIso, utcIsoToIstDisplay, utcIsoToIstLocalInput } from '@/utils/timezone';

export default function AdminMatchesPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [groups, setGroups] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    group_id: "",
    scheduled_at: "",
    map_name: "",
    room_id: "",
    room_password: "",
    show_credentials_from: "",
  });
  const [editingMatch, setEditingMatch] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchGroups(selectedTournament);
      fetchStages(selectedTournament);
      fetchMatches(selectedTournament);
    } else {
      setGroups([]);
      setStages([]);
      setMatches([]);
    }
  }, [selectedTournament]);

  const fetchTournaments = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("tournaments").select("id, title").order("created_at", { ascending: false });
    if (!error) setTournaments(data || []);
    setLoading(false);
  };

  const fetchGroups = async (tournamentId: string) => {
    const { data, error } = await supabase.from("groups").select("id, name, scheduled_at").eq("tournament_id", tournamentId);
    if (!error) setGroups(data || []);
  };

  const fetchStages = async (tournamentId: string) => {
    const { data, error } = await supabase.from("tournament_stages").select("id, name").eq("tournament_id", tournamentId);
    if (!error) setStages(data || []);
  };

  const fetchMatches = async (tournamentId: string) => {
    setLoading(true);
    const { data, error } = await supabase.from("matches").select("*,grp:groups(id,name)").eq("tournament_id", tournamentId);
    if (!error) setMatches(data || []);
    setLoading(false);
  };

  const openEdit = (match: any) => {
    setEditingMatch(match);
    setShowForm(true);
    setForm({
      group_id: match.group_id || "",
      scheduled_at: match.scheduled_at ? utcIsoToIstLocalInput(match.scheduled_at) : "",
      map_name: match.map_name || "",
      room_id: match.room_id || "",
      room_password: match.room_password || "",
      show_credentials_from: match.show_credentials_from ? utcIsoToIstLocalInput(match.show_credentials_from) : "",
    });
  };

  const openCreate = () => {
    setEditingMatch(null);
    setShowForm(true);
    setForm({ group_id: "", scheduled_at: "", map_name: "", room_id: "", room_password: "", show_credentials_from: "" });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formToSave = {
        ...form,
        scheduled_at: istLocalStringToUtcIso(form.scheduled_at),
        show_credentials_from: istLocalStringToUtcIso(form.show_credentials_from),
      };
      if (editingMatch) {
        // Update
        const { error } = await supabase.from("matches").update({
          group_id: formToSave.group_id,
          scheduled_at: formToSave.scheduled_at,
          map_name: formToSave.map_name,
          room_id: formToSave.room_id,
          room_password: formToSave.room_password,
          show_credentials_from: formToSave.show_credentials_from,
        }).eq("id", editingMatch.id);
        if (error) toast.error("Failed to update match");
        else toast.success("Match updated");
      } else {
        // Create
        const { error } = await supabase.from("matches").insert({
          tournament_id: selectedTournament,
          group_id: formToSave.group_id,
          scheduled_at: formToSave.scheduled_at,
          map_name: formToSave.map_name,
          room_id: formToSave.room_id,
          room_password: formToSave.room_password,
          show_credentials_from: formToSave.show_credentials_from,
        });
        if (error) toast.error("Failed to create match");
        else toast.success("Match created");
      }
      fetchMatches(selectedTournament);
      setEditingMatch(null);
      setForm({ group_id: "", scheduled_at: "", map_name: "", room_id: "", room_password: "", show_credentials_from: "" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f051d] via-[#18122b] to-[#232046] py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-extrabold text-fuchsia-400 mb-8 text-center drop-shadow">Manage Matches</h1>
        <div className="mb-6">
          <label className="block text-fuchsia-200 text-sm mb-1">Tournament</label>
          <select
            value={selectedTournament}
            onChange={e => setSelectedTournament(e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-fuchsia-500/30 rounded text-white text-sm"
          >
            <option value="">Select a tournament</option>
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>
        {selectedTournament && (
          <>
            <button
              className="mb-4 bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-6 py-2 rounded-lg font-bold shadow"
              onClick={openCreate}
            >
              + Create Match
            </button>
            <div className="bg-white/10 rounded-2xl p-6 mb-8 border border-fuchsia-700/30">
              <h2 className="text-xl font-bold text-fuchsia-300 mb-4">Matches</h2>
              {loading ? <div className="text-white">Loading...</div> : (
                <table className="w-full text-white">
                  <thead>
                    <tr>
                      <th className="p-2">Group</th>
                      <th className="p-2">Scheduled Date/Time</th>
                      <th className="p-2">Map Name</th>
                      <th className="p-2">Room ID</th>
                      <th className="p-2">Room Password</th>
                      <th className="p-2">Show Credentials From</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map(match => (
                      <tr key={match.id}>
                        <td className="p-2">{match.grp?.name || "-"}</td>
                        <td className="p-2">{match.scheduled_at ? utcIsoToIstDisplay(match.scheduled_at) : '-'}</td>
                        <td className="p-2">{match.map_name || "-"}</td>
                        <td className="p-2">{match.room_id || "-"}</td>
                        <td className="p-2">{match.room_password || "-"}</td>
                        <td className="p-2">{match.show_credentials_from ? utcIsoToIstDisplay(match.show_credentials_from) : '-'}</td>
                        <td className="p-2">
                          <button className="text-blue-400 hover:underline mr-2" onClick={() => openEdit(match)}>Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {showForm && (
              <div className="bg-white/10 rounded-2xl p-6 mb-8 border border-fuchsia-700/30">
                <h2 className="text-xl font-bold text-fuchsia-300 mb-4">{editingMatch ? "Edit Match" : "Create Match"}</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-fuchsia-200 text-sm mb-1">Group</label>
                    <select
                      value={form.group_id}
                      onChange={e => {
                        const groupId = e.target.value;
                        setForm((f: any) => {
                          const group = groups.find((g: any) => g.id === groupId);
                          return {
                            ...f,
                            group_id: groupId,
                            scheduled_at: group ? (group.scheduled_at ? utcIsoToIstLocalInput(group.scheduled_at) : "") : ""
                          };
                        });
                      }}
                      className="w-full px-3 py-2 bg-white/10 border border-fuchsia-500/30 rounded text-white text-sm"
                      required
                    >
                      <option value="">Select group</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-fuchsia-200 text-sm mb-1">Scheduled Date/Time (from group)</label>
                    <input
                      type="datetime-local"
                      value={form.scheduled_at}
                      readOnly
                      className="w-full px-3 py-2 bg-white/10 border border-fuchsia-500/30 rounded text-white text-sm cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-fuchsia-200 text-sm mb-1">Map Name</label>
                    <input
                      type="text"
                      value={form.map_name}
                      onChange={e => setForm((f: any) => ({ ...f, map_name: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-fuchsia-500/30 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-fuchsia-200 text-sm mb-1">Room ID</label>
                    <input
                      type="text"
                      value={form.room_id}
                      onChange={e => setForm((f: any) => ({ ...f, room_id: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-fuchsia-500/30 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-fuchsia-200 text-sm mb-1">Room Password</label>
                    <input
                      type="text"
                      value={form.room_password}
                      onChange={e => setForm((f: any) => ({ ...f, room_password: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-fuchsia-500/30 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-fuchsia-200 text-sm mb-1">Show Credentials From</label>
                    <input
                      type="datetime-local"
                      value={form.show_credentials_from}
                      onChange={e => setForm((f: any) => ({ ...f, show_credentials_from: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-fuchsia-500/30 rounded text-white text-sm"
                    />
                  </div>
                  <div className="col-span-2 flex gap-3 mt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-6 py-2 rounded-lg font-bold shadow disabled:opacity-50"
                    >
                      {saving ? "Saving..." : editingMatch ? "Update Match" : "Create Match"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingMatch(null); setShowForm(false); setForm({ group_id: "", scheduled_at: "", map_name: "", room_id: "", room_password: "", show_credentials_from: "" }); }}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-bold shadow"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 