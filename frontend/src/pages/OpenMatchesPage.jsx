import React, { useState, useEffect } from 'react';
import { openMatchesAPI, turfsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Trophy, 
  Users, 
  Clock, 
  MapPin, 
  Plus, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Flame,
  UserX
} from 'lucide-react';

const OpenMatchesPage = ({ onOpenAuth }) => {
  const { user, isAuthenticated, isOwner, isAdmin } = useAuth();
  const [matches, setMatches] = useState([]);
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [joiningId, setJoiningId] = useState(null);
  const [leavingId, setLeavingId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [confirmJoinMatch, setConfirmJoinMatch] = useState(null);
  const [confirmLeaveMatch, setConfirmLeaveMatch] = useState(null);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const canHostMatch = isOwner || isAdmin;

  const [newMatch, setNewMatch] = useState({
    turf_id: 1,
    title: '5v5 Football Open Match',
    sport_type: 'Football',
    match_format: '5v5',
    skill_level: 'Casual / Intermediate',
    match_date: new Date().toISOString().split('T')[0],
    start_time: '18:00',
    end_time: '19:00',
    max_players: 10,
    price_per_player: 150,
    rules: 'Bring turf shoes. Water provided. Fair play expected.'
  });

  const fetchMatches = async () => {
    try {
      const [mRes, tRes] = await Promise.all([
        openMatchesAPI.getAll(),
        turfsAPI.getAll()
      ]);
      setMatches(mRes.data);
      setTurfs(tRes.data);
      if (tRes.data?.length > 0 && !newMatch.turf_id) {
        setNewMatch(prev => ({ ...prev, turf_id: tRes.data[0].id }));
      }
    } catch (err) {
      console.error("Fetch matches error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const openJoinConfirmation = (match) => {
    if (!isAuthenticated) {
      onOpenAuth('login');
      return;
    }
    setConfirmJoinMatch(match);
  };

  const handleConfirmJoin = async () => {
    if (!confirmJoinMatch) return;
    const matchId = confirmJoinMatch.id;
    setJoiningId(matchId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await openMatchesAPI.join(matchId);
      setSuccessMsg(res.data.message);
      fetchMatches();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error("Join match error", err);
      setErrorMsg(err.response?.data?.detail || "Could not join match.");
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setJoiningId(null);
      setConfirmJoinMatch(null);
    }
  };

  const openLeaveConfirmation = (match) => {
    setConfirmLeaveMatch(match);
  };

  const handleConfirmLeave = async () => {
    if (!confirmLeaveMatch) return;
    const matchId = confirmLeaveMatch.id;
    setLeavingId(matchId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await openMatchesAPI.leave(matchId);
      setSuccessMsg(res.data.message);
      fetchMatches();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error("Leave match error", err);
      setErrorMsg(err.response?.data?.detail || "Could not cancel match participation.");
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setLeavingId(null);
      setConfirmLeaveMatch(null);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onOpenAuth('login');
      return;
    }

    try {
      const selectedTurfId = Number(newMatch.turf_id) || (turfs[0]?.id || 1);
      const sportName = newMatch.sport_type || 'Football';
      const formatVariant = newMatch.match_format || (sportName === 'Cricket' ? 'Box Cricket' : '5v5');

      const payload = {
        turf_id: selectedTurfId,
        title: newMatch.title || `${formatVariant} ${sportName} Open Match`,
        sport_type: `${sportName} (${formatVariant})`,
        skill_level: newMatch.skill_level || 'Casual / Intermediate',
        match_date: newMatch.match_date,
        start_time: newMatch.start_time,
        end_time: newMatch.end_time,
        max_players: Number(newMatch.max_players) || 10,
        price_per_player: Number(newMatch.price_per_player) || 150,
        rules: newMatch.rules || 'Bring turf shoes. Water provided.',
        description: 'Casual open match.'
      };

      await openMatchesAPI.create(payload);
      setShowCreateModal(false);
      setSuccessMsg("Open match created & time slot reserved successfully!");
      fetchMatches();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error("Create match error", err);
      setErrorMsg(err.response?.data?.detail || "Failed to create match.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-500" />
            Open Match Arena
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Join casual & competitive games with other local sports enthusiasts. No team needed.
          </p>
        </div>

        {canHostMatch ? (
          <button
            onClick={() => setShowCreateModal(true)}
            className="py-2.5 px-4 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-sm shadow-brand-700/20 transition flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Host an Open Match
          </button>
        ) : (
          <div className="text-xs text-slate-500 bg-slate-100 px-3 py-2 rounded-xl font-medium border border-slate-200/80 shrink-0">
            🏟️ Open matches are hosted by verified Turf Owners
          </div>
        )}
      </div>

      {/* Banner Messages */}
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

      {/* Matches Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading open matches...</div>
      ) : matches.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200 p-8 space-y-2">
          <p className="text-sm font-bold text-slate-700">No active open matches currently.</p>
          <p className="text-xs text-slate-400">
            {canHostMatch ? 'Be the first to host a match above!' : 'Check back soon for upcoming open matches.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matches.map((m) => {
            const isFull = m.current_players >= m.max_players || m.status === 'FULL';
            const alreadyJoined = user && m.participants?.some(p => p.user_id === user.id);
            const isCreator = user && m.creator_id === user.id;
            const isCricket = m.sport_type?.toLowerCase().includes('cricket');

            return (
              <div
                key={m.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative">
                        <img
                          src={m.turf_image || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80'}
                          alt={m.turf_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{m.title}</h3>
                        <p className="text-[11px] font-semibold text-brand-700 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-brand-600" />
                          {m.turf_name} ({m.turf_city})
                        </p>
                      </div>
                    </div>

                    {/* Small Sport Image Badge */}
                    {isCricket ? (
                      <div className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 shrink-0">
                        <img
                          src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=120&q=80"
                          alt="Cricket"
                          className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                        />
                        <span>Cricket</span>
                      </div>
                    ) : (
                      <div className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 shrink-0">
                        <img
                          src="https://images.unsplash.com/photo-1614632537190-23e4146777db?auto=format&fit=crop&w=120&q=80"
                          alt="Football"
                          className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                        />
                        <span>Football</span>
                      </div>
                    )}
                  </div>

                  {/* Date & Time pill */}
                  <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                    <span className="font-semibold">{m.match_date}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {m.start_time} - {m.end_time}
                    </span>
                  </div>

                  {/* Player Capacity Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        Players Registered
                      </span>
                      <span className="font-bold text-slate-900">
                        {m.current_players} / {m.max_players}
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull ? 'bg-rose-500' : 'bg-brand-600'
                        }`}
                        style={{ width: `${Math.min(100, (m.current_players / m.max_players) * 100)}%` }}
                      />
                    </div>
                    
                    <span className="text-[10px] text-slate-400 block text-right">
                      {isFull ? 'Match Full' : `${m.slots_left} slots remaining`}
                    </span>
                  </div>

                  {/* Participant Avatars */}
                  {m.participants && m.participants.length > 0 && (
                    <div className="pt-2 flex items-center gap-1.5 overflow-x-auto">
                      {m.participants.slice(0, 6).map((p, i) => (
                        <div
                          key={p.id || i}
                          title={p.full_name}
                          className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 text-[10px] font-extrabold flex items-center justify-center border-2 border-white shadow-2xs shrink-0"
                        >
                          {p.full_name?.charAt(0) || 'P'}
                        </div>
                      ))}
                      {m.participants.length > 6 && (
                        <span className="text-[10px] text-slate-400 font-semibold">
                          +{m.participants.length - 6} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-extrabold text-slate-900">₹{m.price_per_player}</span>
                    <span className="text-[11px] text-slate-400"> / player</span>
                  </div>

                  {alreadyJoined ? (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Joined
                      </span>
                      {!isCreator && (
                        <button
                          onClick={() => openLeaveConfirmation(m)}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold border border-rose-200 transition"
                        >
                          Cancel Participation
                        </button>
                      )}
                    </div>
                  ) : isFull ? (
                    <button
                      disabled
                      className="px-4 py-2 bg-slate-100 text-slate-400 text-xs font-bold rounded-lg cursor-not-allowed"
                    >
                      Match Full
                    </button>
                  ) : (
                    <button
                      onClick={() => openJoinConfirmation(m)}
                      className="px-5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-sm transition"
                    >
                      Join Match (₹{m.price_per_player})
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Double Confirmation Modal for Joining */}
      {confirmJoinMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 w-full max-w-md relative fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" /> Confirm Match Registration
              </h3>
              <button onClick={() => setConfirmJoinMatch(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200/80 text-xs">
              <p className="font-bold text-slate-900 text-sm">{confirmJoinMatch.title}</p>
              <p className="text-slate-600 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {confirmJoinMatch.turf_name}, {confirmJoinMatch.turf_city}
              </p>
              <p className="text-slate-600 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {confirmJoinMatch.match_date} ({confirmJoinMatch.start_time} - {confirmJoinMatch.end_time})
              </p>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-extrabold text-slate-900">
                <span>Fee per Player:</span>
                <span className="text-base text-brand-700">₹{confirmJoinMatch.price_per_player}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Are you sure you want to register for this open match? Your team slot will be confirmed immediately.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmJoinMatch(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmJoin}
                disabled={joiningId === confirmJoinMatch.id}
                className="flex-1 py-2.5 px-4 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-sm shadow-brand-700/20 transition disabled:opacity-50"
              >
                {joiningId === confirmJoinMatch.id ? 'Joining...' : `Confirm & Join (₹${confirmJoinMatch.price_per_player})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Leaving / Cancelling Participation */}
      {confirmLeaveMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 w-full max-w-md relative fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserX className="w-5 h-5 text-rose-500" /> Cancel Participation
              </h3>
              <button onClick={() => setConfirmLeaveMatch(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50 p-4 rounded-xl border border-rose-200/80 text-xs space-y-1">
              <p className="font-bold text-rose-900">Are you sure you want to cancel your spot?</p>
              <p className="text-rose-700">
                Match: <strong className="font-bold">{confirmLeaveMatch.title}</strong>
              </p>
              <p className="text-rose-600 text-[11px] pt-1">
                Your spot will be released and made available for other players on the platform.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmLeaveMatch(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Keep My Spot
              </button>
              <button
                onClick={handleConfirmLeave}
                disabled={leavingId === confirmLeaveMatch.id}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {leavingId === confirmLeaveMatch.id ? 'Cancelling...' : 'Yes, Cancel Spot'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Host Match Modal (Turf Owners Only) */}
      {showCreateModal && canHostMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 w-full max-w-md relative fade-in max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">Host an Open Match</h3>
            <p className="text-xs text-slate-500 mb-4">Host a match for individual players. Creating reserves the time slot.</p>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Turf Venue</label>
                <select
                  value={newMatch.turf_id || (turfs[0]?.id || '')}
                  onChange={(e) => setNewMatch(prev => ({ ...prev, turf_id: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-medium text-slate-800"
                >
                  {turfs.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.city})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sport Facility</label>
                  <select
                    value={newMatch.sport_type}
                    onChange={(e) => {
                      const sport = e.target.value;
                      const defaultFmt = sport === 'Cricket' ? 'Box Cricket' : '5v5';
                      const defaultCap = sport === 'Cricket' ? 12 : 10;
                      setNewMatch(prev => ({
                        ...prev,
                        sport_type: sport,
                        match_format: defaultFmt,
                        max_players: defaultCap,
                        title: `${defaultFmt} ${sport} Open Match`
                      }));
                    }}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-semibold text-slate-800"
                  >
                    <option value="Football">⚽ Football</option>
                    <option value="Cricket">🏏 Cricket</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Match Format / Size</label>
                  <select
                    value={newMatch.match_format || '5v5'}
                    onChange={(e) => {
                      const fmt = e.target.value;
                      let cap = 10;
                      if (fmt === '5v5') cap = 10;
                      else if (fmt === '7v7') cap = 14;
                      else if (fmt === '11v11') cap = 22;
                      else if (fmt === 'Box Cricket' || fmt === '6v6') cap = 12;
                      else if (fmt === '8v8') cap = 16;
                      
                      setNewMatch(prev => ({
                        ...prev,
                        match_format: fmt,
                        max_players: cap,
                        title: `${fmt} ${prev.sport_type} Open Match`
                      }));
                    }}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-medium text-slate-800"
                  >
                    {newMatch.sport_type === 'Cricket' ? (
                      <>
                        <option value="Box Cricket">Box Cricket (12 Players)</option>
                        <option value="6v6">6v6 Cricket (12 Players)</option>
                        <option value="8v8">8v8 Cricket (16 Players)</option>
                        <option value="11v11">11v11 Full Pitch Cricket (22 Players)</option>
                      </>
                    ) : (
                      <>
                        <option value="5v5">5v5 Football (10 Players)</option>
                        <option value="7v7">7v7 Football (14 Players)</option>
                        <option value="11v11">11v11 Full Pitch Football (22 Players)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Match Title</label>
                <input
                  type="text"
                  required
                  value={newMatch.title}
                  onChange={(e) => setNewMatch({ ...newMatch, title: e.target.value })}
                  placeholder="e.g. 5v5 Friday Night Kickoff"
                  className="w-full px-3 py-2 border rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Match Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={newMatch.match_date}
                    onChange={(e) => setNewMatch({ ...newMatch, match_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time Slot (1 Hour)</label>
                  <select
                    value={newMatch.start_time}
                    onChange={(e) => {
                      const st = e.target.value;
                      const hr = parseInt(st.split(':')[0], 10);
                      const nextHr = (hr + 1) % 24;
                      const endStr = `${nextHr < 10 ? '0' : ''}${nextHr}:00`;
                      setNewMatch(prev => ({ ...prev, start_time: st, end_time: endStr }));
                    }}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-medium"
                  >
                    {[...Array(18)].map((_, idx) => {
                      const h = idx + 6; // 6 AM to 11 PM
                      const stStr = `${h < 10 ? '0' : ''}${h}:00`;
                      const endH = h + 1;
                      const dispStr = `${h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h-12} PM`} - ${endH < 12 ? `${endH} AM` : endH === 12 ? '12 PM' : `${endH-12} PM`}`;

                      const isToday = newMatch.match_date === new Date().toISOString().split('T')[0];
                      const curHr = new Date().getHours();
                      const isPast = isToday && h <= curHr;

                      return (
                        <option key={h} value={stStr} disabled={isPast}>
                          {dispStr} {isPast ? '(Passed)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Players Capacity</label>
                  <input
                    type="number"
                    min="2"
                    max="50"
                    required
                    value={newMatch.max_players}
                    onChange={(e) => setNewMatch({ ...newMatch, max_players: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price/Player (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newMatch.price_per_player}
                    onChange={(e) => setNewMatch({ ...newMatch, price_per_player: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-800 flex items-center gap-1">
                  📌 Automatic Slot Reservation:
                </p>
                <p>Creating this match will set slot status to <strong className="text-rose-600">BOOKED</strong> so regular customers cannot double-book this time.</p>
              </div>

              <button
                type="submit"
                className="w-full mt-3 py-2.5 bg-brand-700 text-white font-bold rounded-lg hover:bg-brand-800"
              >
                Create & Publish Match
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default OpenMatchesPage;

