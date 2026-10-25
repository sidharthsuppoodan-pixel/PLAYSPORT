import React, { useState, useEffect } from 'react';
import { tournamentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Trophy, 
  Calendar, 
  Users, 
  MapPin, 
  ShieldCheck, 
  Award, 
  CheckCircle2, 
  AlertCircle,
  X 
} from 'lucide-react';

const TournamentsPage = ({ onOpenAuth }) => {
  const { user, isAuthenticated } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeringTourn, setRegisteringTourn] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [teamForm, setTeamForm] = useState({
    team_name: '',
    captain_name: '',
    contact_phone: '',
    members_count: 7,
  });
  const [formErrors, setFormErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchTournaments = async () => {
    try {
      const res = await tournamentsAPI.getAll();
      setTournaments(res.data);
    } catch (err) {
      console.error("Error loading tournaments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const validatePhone = (phone) => {
    if (!phone) return "Phone number is required.";
    const clean = phone.trim().replace(/\D/g, '');
    if (clean.length !== 10) {
      return "Phone number must be exactly 10 digits.";
    }
    if (!/^[6-9]/.test(clean)) {
      return "10-digit mobile number must start with 6, 7, 8, or 9.";
    }
    if (/^(\d)\1{6}/.test(clean)) {
      return "The first 7 digits cannot be the same number.";
    }
    return "";
  };

  const validateCaptain = (name) => {
    if (!name || !name.trim()) return "Captain's name is required.";
    const trimmed = name.trim();
    if (trimmed.length < 2) return "Captain's name must be at least 2 characters.";
    if (trimmed.length > 100) return "Captain's name cannot exceed 100 characters.";
    if (!/^[A-Za-z\s.'-]+$/.test(trimmed)) {
      return "Captain's name should only contain letters and standard characters.";
    }
    return "";
  };

  const validateTeamName = (name) => {
    if (!name || !name.trim()) return "Team name is required.";
    const trimmed = name.trim();
    if (trimmed.length < 2) return "Team name must be at least 2 characters.";
    if (trimmed.length > 100) return "Team name cannot exceed 100 characters.";
    if (/^[\d\W]+$/.test(trimmed)) {
      return "Team name cannot consist solely of numbers or symbols.";
    }
    return "";
  };

  const handleRegisterTeamSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onOpenAuth('login');
      return;
    }

    const phoneErr = validatePhone(teamForm.contact_phone);
    const captainErr = validateCaptain(teamForm.captain_name);
    const teamErr = validateTeamName(teamForm.team_name);
    let membersErr = "";
    if (!teamForm.members_count || teamForm.members_count < 5 || teamForm.members_count > 25) {
      membersErr = "Squad size must be between 5 and 25 players.";
    }

    const errors = {};
    if (phoneErr) errors.contact_phone = phoneErr;
    if (captainErr) errors.captain_name = captainErr;
    if (teamErr) errors.team_name = teamErr;
    if (membersErr) errors.members_count = membersErr;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setErrorMsg(phoneErr || captainErr || teamErr || membersErr);
      setTimeout(() => setErrorMsg(''), 5000);
      return;
    }

    setSubmitting(true);
    setFormErrors({});
    setErrorMsg('');

    try {
      const payload = {
        team_name: teamForm.team_name.trim(),
        captain_name: teamForm.captain_name.trim(),
        contact_phone: teamForm.contact_phone.trim().replace(/[\s\-()]/g, ''),
        members_count: Number(teamForm.members_count) || 7,
      };
      const res = await tournamentsAPI.registerTeam(registeringTourn.id, payload);
      setSuccessMsg(res.data.message || "Team registered successfully!");
      setRegisteringTourn(null);
      fetchTournaments();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error("Tournament registration error", err);
      let detailMsg = "Registration failed.";
      if (err.response?.data?.detail) {
        const d = err.response.data.detail;
        if (typeof d === 'string') {
          detailMsg = d;
        } else if (Array.isArray(d)) {
          detailMsg = d.map(item => item.msg?.replace(/^Value error,\s*/i, '') || item.msg).join('. ');
        }
      }
      setErrorMsg(detailMsg);
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Award className="w-7 h-7 text-amber-500" />
          Tournaments & Leagues
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Compete in knockout championships, box cricket cups, and regional football tournaments.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-brand-200 text-xs font-bold text-brand-800 flex items-center gap-2 fade-in">
          <CheckCircle2 className="w-4 h-4 text-brand-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2 fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading tournaments...</div>
      ) : tournaments.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200 p-8 space-y-2">
          <p className="text-sm font-bold text-slate-700">No active tournaments scheduled.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/8] bg-slate-900 overflow-hidden">
                  <img
                    src={t.banner_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80'}
                    alt={t.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  <div className="absolute bottom-3 left-4 right-4 text-white flex items-end justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
                        {t.sport} • {t.format}
                      </span>
                      <h3 className="text-base font-extrabold">{t.title}</h3>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase text-slate-300 block">Prize Pool</span>
                      <span className="text-lg font-black text-amber-400">₹{t.prize_pool?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{t.turf_name}, {t.turf_city}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{t.start_date}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Registered Teams</span>
                      <span className="font-bold text-slate-900">{t.current_teams} / {t.max_teams} Teams</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Entry Fee</span>
                      <span className="font-bold text-brand-700">₹{t.entry_fee} / team</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2">{t.rules}</p>
                </div>
              </div>

              <div className="p-5 pt-0">
                <button
                  disabled={t.current_teams >= t.max_teams}
                  onClick={() => {
                    if (!isAuthenticated) {
                      onOpenAuth('login');
                    } else {
                      setTeamForm({
                        team_name: '',
                        captain_name: '',
                        contact_phone: '',
                        members_count: 7,
                      });
                      setFormErrors({});
                      setErrorMsg('');
                      setRegisteringTourn(t);
                    }
                  }}
                  className={`w-full py-2.5 text-xs font-bold rounded-xl shadow-sm transition ${
                    t.current_teams >= t.max_teams
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white'
                  }`}
                >
                  {t.current_teams >= t.max_teams ? 'Registration Closed (Full)' : `Register Team (₹${t.entry_fee})`}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Team Registration Modal */}
      {registeringTourn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 w-full max-w-md relative fade-in">
            <button
              onClick={() => {
                setRegisteringTourn(null);
                setFormErrors({});
                setErrorMsg('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">Register Team for {registeringTourn.title}</h3>
            <p className="text-xs text-slate-500 mb-4">Complete team details to secure tournament entry.</p>

            {errorMsg && (
              <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleRegisterTeamSubmit} className="space-y-3.5 text-xs">
              {/* Team Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Team Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cochin Strikers FC"
                  value={teamForm.team_name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTeamForm({ ...teamForm, team_name: val });
                    const err = validateTeamName(val);
                    setFormErrors(prev => ({ ...prev, team_name: err }));
                  }}
                  className={`w-full px-3 py-2 border rounded-lg transition ${
                    formErrors.team_name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-brand-500'
                  }`}
                />
                {formErrors.team_name ? (
                  <span className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" /> {formErrors.team_name}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Official club or squad name</span>
                )}
              </div>

              {/* Captain Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Captain's Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter Captain's Full Name (e.g. Alex Johnson)"
                  value={teamForm.captain_name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTeamForm({ ...teamForm, captain_name: val });
                    const err = validateCaptain(val);
                    setFormErrors(prev => ({ ...prev, captain_name: err }));
                  }}
                  className={`w-full px-3 py-2 border rounded-lg transition ${
                    formErrors.captain_name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-brand-500'
                  }`}
                />
                {formErrors.captain_name ? (
                  <span className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" /> {formErrors.captain_name}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Full name of the team captain</span>
                )}
              </div>

              {/* Captain Phone Number */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Captain Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10-digit mobile number (e.g. 9847123456)"
                  value={teamForm.contact_phone}
                  onChange={(e) => {
                    // Only allow digits and cap at exactly 10 characters
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setTeamForm({ ...teamForm, contact_phone: val });
                    const err = validatePhone(val);
                    setFormErrors(prev => ({ ...prev, contact_phone: err }));
                  }}
                  className={`w-full px-3 py-2 border rounded-lg transition ${
                    formErrors.contact_phone ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-brand-500'
                  }`}
                />
                {formErrors.contact_phone ? (
                  <span className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" /> {formErrors.contact_phone}
                  </span>
                ) : teamForm.contact_phone && teamForm.contact_phone.length === 10 && !validatePhone(teamForm.contact_phone) ? (
                  <span className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 shrink-0" /> Looks good! Valid 10-digit mobile number
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Must be exactly 10 digits starting with 6, 7, 8, or 9 ({teamForm.contact_phone.length}/10)
                  </span>
                )}
              </div>

              {/* Number of Squad Members */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Squad Size (5 to 25 players) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="5"
                  max="25"
                  required
                  value={teamForm.members_count}
                  onChange={(e) => {
                    const count = Number(e.target.value);
                    setTeamForm({ ...teamForm, members_count: count });
                    if (count < 5 || count > 25) {
                      setFormErrors(prev => ({ ...prev, members_count: "Squad size must be between 5 and 25 players." }));
                    } else {
                      setFormErrors(prev => ({ ...prev, members_count: "" }));
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg transition ${
                    formErrors.members_count ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 focus:border-brand-500'
                  }`}
                />
                {formErrors.members_count ? (
                  <span className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" /> {formErrors.members_count}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Standard format squad size</span>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs">
                <span className="font-semibold block text-slate-800">Registration Fee: ₹{registeringTourn.entry_fee}</span>
                <span className="text-[11px] text-slate-500">Includes referee fees, hydration pack, and official match balls.</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-3 py-2.5 bg-brand-700 text-white font-bold rounded-lg hover:bg-brand-800 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {submitting ? 'Registering Squad...' : 'Confirm Team Registration'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TournamentsPage;
