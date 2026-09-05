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
  const [teamForm, setTeamForm] = useState({
    team_name: '',
    contact_phone: '',
    members_count: 7,
  });
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

  const handleRegisterTeamSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onOpenAuth('login');
      return;
    }

    try {
      const res = await tournamentsAPI.registerTeam(registeringTourn.id, teamForm);
      setSuccessMsg(res.data.message);
      setRegisteringTourn(null);
      fetchTournaments();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error("Tournament registration error", err);
      setErrorMsg(err.response?.data?.detail || "Registration failed.");
      setTimeout(() => setErrorMsg(''), 4000);
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
                  onClick={() => {
                    if (!isAuthenticated) {
                      onOpenAuth('login');
                    } else {
                      setRegisteringTourn(t);
                    }
                  }}
                  className="w-full py-2.5 bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  Register Team (₹{t.entry_fee})
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
              onClick={() => setRegisteringTourn(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">Register Team for {registeringTourn.title}</h3>
            <p className="text-xs text-slate-500 mb-4">Captain: {user?.full_name}</p>

            <form onSubmit={handleRegisterTeamSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Team Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cochin Strikers FC"
                  value={teamForm.team_name}
                  onChange={(e) => setTeamForm({ ...teamForm, team_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Captain Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  value={teamForm.contact_phone}
                  onChange={(e) => setTeamForm({ ...teamForm, contact_phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Number of Squad Members</label>
                <input
                  type="number"
                  min="5"
                  max="15"
                  required
                  value={teamForm.members_count}
                  onChange={(e) => setTeamForm({ ...teamForm, members_count: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs">
                <span className="font-semibold block text-slate-800">Registration Fee: ₹{registeringTourn.entry_fee}</span>
                <span className="text-[11px] text-slate-500">Includes referee fees, hydration pack, and official match balls.</span>
              </div>

              <button
                type="submit"
                className="w-full mt-3 py-2.5 bg-brand-700 text-white font-bold rounded-lg hover:bg-brand-800"
              >
                Confirm Team Registration
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TournamentsPage;
