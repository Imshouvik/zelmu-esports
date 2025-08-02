"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { Country, State, City } from "country-state-city";
import { FaSpinner, FaCheckCircle, FaTimesCircle, FaUserCircle, FaArrowLeft } from "react-icons/fa";
import PageGuard from '@/components/PageGuard';

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Profile fields
  const [name, setName] = useState("");
  const [zelmuname, setZelmuname] = useState("");
  const [zelmunameAvailable, setZelmunameAvailable] = useState<boolean | null>(null);
  const [checkingZelmuname, setCheckingZelmuname] = useState(false);
  const [zelmunameChanges, setZelmunameChanges] = useState(0);
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("IN");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [originalZelmuname, setOriginalZelmuname] = useState("");

  // Country/State/City lists
  const countries = Country.getAllCountries();
  const states = State.getStatesOfCountry(country);
  const cities = State.getStateByCodeAndCountry(state, country) ? City.getCitiesOfState(country, state) : [];

  useEffect(() => { setState(""); setCity(""); }, [country]);
  useEffect(() => { setCity(""); }, [state]);

  // Fetch user info
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError("");
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push("/login");
        return;
      }
      setUser(authUser);
      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("name, zelmuname, zelmuname_changes, phone, country, state, city, avatar_url")
        .eq("id", authUser.id)
        .single();
      if (userError) {
        setError("Failed to load user profile.");
        setLoading(false);
        return;
      }
      setName(userRow.name || "");
      setZelmuname(userRow.zelmuname || "");
      setOriginalZelmuname(userRow.zelmuname || "");
      setZelmunameChanges(userRow.zelmuname_changes || 0);
      setPhone(userRow.phone || "");
      setCountry(userRow.country || "IN");
      setState(userRow.state || "");
      setCity(userRow.city || "");
      setAvatarUrl(userRow.avatar_url || "");
      setLoading(false);
    };
    fetchUser();
  }, [router]);

  // Zelmu name uniqueness check
  useEffect(() => {
    if (!zelmuname || zelmuname === originalZelmuname) {
      setZelmunameAvailable(null);
      return;
    }
    setCheckingZelmuname(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-zelmuname?zelmuname=${encodeURIComponent(zelmuname)}`);
        const data = await res.json();
        setZelmunameAvailable(data.available);
      } catch {
        setZelmunameAvailable(null);
      } finally {
        setCheckingZelmuname(false);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [zelmuname, originalZelmuname]);

  // Save handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    // Validation
    if (!name.trim()) {
      setError("Name is required.");
      setSaving(false);
      return;
    }
    if (!country || !state || !city) {
      setError("Country, state, and city are required.");
      setSaving(false);
      return;
    }
    if (zelmuname !== originalZelmuname) {
      if (zelmunameChanges >= 2) {
        setError("You have reached the maximum number of Zelmu Name changes.");
        setSaving(false);
        return;
      }
      if (!zelmunameAvailable) {
        setError("Zelmu Name is not available.");
        setSaving(false);
        return;
      }
    }
    // Update user
    const updates: any = {
      name: name.trim(),
      phone: phone.trim(),
      country,
      state,
      city,
      avatar_url: avatarUrl,
    };
    if (zelmuname !== originalZelmuname) {
      updates.zelmuname = zelmuname;
      updates.zelmuname_changes = zelmunameChanges + 1;
    }
    const { error: updateError } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id);
    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }
    setSuccess("Profile updated successfully!");
    setOriginalZelmuname(zelmuname);
    if (zelmuname !== originalZelmuname) setZelmunameChanges(zelmunameChanges + 1);
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (deleteInput !== zelmuname) {
      setDeleteError('Zelmu Name does not match.');
      return;
    }
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const res = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        // Log out and redirect to home
        await supabase.auth.signOut();
        window.location.href = '/';
      } else {
        const data = await res.json();
        setDeleteError(data.error || 'Failed to delete account. Please try again.');
      }
    } catch {
      setDeleteError('Failed to delete account. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-3xl text-fuchsia-500" />
      </div>
    );
  }

  return (
    <PageGuard pageKey="edit_profile">
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f051d] via-[#18122b] to-[#232046] py-8 px-2">
        <div className="w-full max-w-lg bg-white/10 rounded-2xl shadow-2xl p-8 border border-fuchsia-700/30 relative">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute left-4 top-4 flex items-center gap-2 text-fuchsia-300 hover:text-fuchsia-100 font-semibold text-base focus:outline-none"
          >
            <FaArrowLeft className="inline-block" />
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-extrabold text-fuchsia-400 mb-6 text-center drop-shadow mt-2">Edit Profile</h1>
          <form className="flex flex-col gap-6" onSubmit={handleSave}>
            {/* Avatar (optional, just display for now) */}
            <div className="flex flex-col items-center gap-2">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-fuchsia-400" />
              ) : (
                <FaUserCircle className="w-20 h-20 text-fuchsia-300" />
              )}
              {/* Avatar upload can be added here */}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-fuchsia-200 text-sm mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-fuchsia-500/30 text-white placeholder-fuchsia-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 transition-all text-base shadow-inner backdrop-blur-md"
                required
                disabled={saving}
              />
            </div>
            {/* Zelmu Name with change limit */}
            <div className="flex flex-col gap-2 relative">
              <label className="text-fuchsia-200 text-sm mb-1">Zelmu Name (unique)</label>
              <div className="relative">
                <input
                  type="text"
                  value={zelmuname}
                  onChange={e => setZelmuname(e.target.value.replace(/\s/g, ''))}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border border-fuchsia-500/30 text-white placeholder-fuchsia-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 transition-all text-base shadow-inner backdrop-blur-md"
                  required
                  disabled={saving || zelmunameChanges >= 2}
                  minLength={3}
                  maxLength={20}
                  autoComplete="off"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checkingZelmuname && <FaSpinner className="animate-spin text-green-400 w-5 h-5" />}
                  {!checkingZelmuname && zelmuname && zelmuname !== originalZelmuname && zelmunameAvailable === true && <FaCheckCircle className="text-green-400 w-5 h-5" />}
                  {!checkingZelmuname && zelmuname && zelmuname !== originalZelmuname && zelmunameAvailable === false && <FaTimesCircle className="text-red-400 w-5 h-5" />}
                </span>
              </div>
              <span className="text-xs mt-1 text-fuchsia-300">
                {zelmunameChanges < 2
                  ? `You can change your Zelmu Name ${2 - zelmunameChanges} more time${2 - zelmunameChanges === 1 ? '' : 's'}.`
                  : "You have reached the maximum number of Zelmu Name changes."}
              </span>
              {zelmuname && zelmuname !== originalZelmuname && (
                <span className={`text-xs mt-1 ${zelmunameAvailable === null ? 'text-gray-400' : zelmunameAvailable ? 'text-green-400' : 'text-red-400'}`}>
                  {checkingZelmuname ? 'Checking availability...' : zelmunameAvailable === null ? '' : zelmunameAvailable ? 'Available!' : 'Not available'}
                </span>
              )}
            </div>
            {/* Phone */}
            <div className="flex flex-col gap-2">
              <label className="text-fuchsia-200 text-sm mb-1">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-fuchsia-500/30 text-white placeholder-fuchsia-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 transition-all text-base shadow-inner backdrop-blur-md"
                disabled={saving}
              />
            </div>
            {/* Country/State/City on a single line for desktop, stacked on mobile */}
            <div className="w-full flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <label className="block text-left text-fuchsia-200 text-sm mb-1">Country</label>
                <select
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-fuchsia-500/30 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 transition-all text-base shadow-inner backdrop-blur-md"
                  required
                  disabled={saving}
                >
                  {countries.map(c => (
                    <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-left text-fuchsia-200 text-sm mb-1">State</label>
                <select
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-fuchsia-500/30 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 transition-all text-base shadow-inner backdrop-blur-md"
                  required
                  disabled={saving || !country}
                >
                  <option value="" disabled>Select state</option>
                  {states.map(s => (
                    <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-left text-fuchsia-200 text-sm mb-1">City</label>
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-fuchsia-500/30 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 transition-all text-base shadow-inner backdrop-blur-md"
                  required
                  disabled={saving || !state}
                >
                  <option value="" disabled>Select city</option>
                  {cities.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Save button and feedback */}
            {error && <div className="text-red-400 text-sm font-semibold -mt-4 mb-2">{error}</div>}
            {success && <div className="text-green-400 text-sm font-semibold -mt-4 mb-2">{success}</div>}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-purple-600 hover:to-fuchsia-700 text-white font-bold py-3 rounded-lg shadow text-lg text-center transition-all duration-200 mt-2 mb-2"
            >
              {saving ? <span className="flex items-center justify-center gap-2"><FaSpinner className="animate-spin" /> Saving...</span> : "Save Changes"}
            </button>
            {/* Delete Account Button */}
            <div className="mt-8 border-t border-fuchsia-700/30 pt-6">
              <button
                type="button"
                onClick={() => setShowDeleteDialog(true)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg shadow text-lg text-center transition-all duration-200"
              >
                Delete Account
              </button>
            </div>
            {/* Delete Confirmation Dialog */}
            {showDeleteDialog && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-fuchsia-700/30 text-center">
                  <h2 className="text-xl font-bold text-red-600 mb-4">Confirm Account Deletion</h2>
                  <p className="mb-4 text-fuchsia-900">To confirm, please enter your Zelmu Name:</p>
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={e => setDeleteInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-fuchsia-400 mb-3 text-center"
                    placeholder="Enter your Zelmu Name"
                    disabled={deleting}
                  />
                  {deleteError && <div className="text-red-500 text-sm mb-2">{deleteError}</div>}
                  <div className="flex gap-4 justify-center mt-4">
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg shadow"
                      disabled={deleting}
                    >
                      {deleting ? <FaSpinner className="animate-spin inline-block mr-2" /> : null} Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowDeleteDialog(false); setDeleteInput(''); setDeleteError(''); }}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg shadow"
                      disabled={deleting}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </PageGuard>
  );
} 