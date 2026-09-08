import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { turfsAPI, openMatchesAPI } from '../services/api';
import QuickSearch from '../components/QuickSearch';
import { 
  Star, 
  MapPin, 
  ArrowRight, 
  Search, 
  Calendar, 
  Trophy, 
  ChevronRight,
  Flame,
  Building,
  CheckCircle2,
  Zap,
  ShieldCheck
} from 'lucide-react';

const HomePage = ({ onOpenAuth }) => {
  const navigate = useNavigate();
  const { user, isAdmin, isOwner } = useAuth();
  const [popularTurfs, setPopularTurfs] = useState([]);
  const [openMatches, setOpenMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      navigate('/admin/dashboard', { replace: true });
      return;
    }
    if (isOwner) {
      navigate('/owner/dashboard', { replace: true });
      return;
    }

    const fetchData = async () => {
      try {
        const [turfsRes, matchesRes] = await Promise.all([
          turfsAPI.getPopular(6),
          openMatchesAPI.getAll()
        ]);
        setPopularTurfs(turfsRes.data);
        setOpenMatches(matchesRes.data.slice(0, 3));
      } catch (err) {
        console.error("Error fetching homepage data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin, isOwner, navigate]);

  return (
    <div className="space-y-12 pb-20 bg-slate-50/50">
      
      {/* ─── Hero Section with Premium Emerald Gradient ──────────────────────── */}
      <section className="relative overflow-hidden bg-slate-900 text-white pt-16 pb-20 lg:pt-20 lg:pb-24">
        {/* Subtle Background Glow Elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Instant Online Turf Booking Platform · Kerala</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Book Your Turf. <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
                Play Without Delay.
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-normal">
              Explore FIFA-approved astro turfs, box cricket stadiums, and indoor courts across Kerala. View live hourly slot availability and reserve instantly.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                to="/turfs"
                className="py-3.5 px-7 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-brand-600/30 hover:shadow-brand-500/40 transition-all flex items-center gap-2 group"
              >
                <span>Browse Turfs & Slots</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/open-matches"
                className="py-3.5 px-7 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Join Open Matches</span>
              </Link>
            </div>

            {/* Stats Ticker */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-slate-800/80 mt-8 max-w-2xl mx-auto">
              {[
                ['50+', 'Turf Arenas'],
                ['14', 'Kerala Districts'],
                ['4.9★', 'Top Rated'],
                ['100%', 'Instant Confirmation']
              ].map(([val, label]) => (
                <div key={label} className="text-center p-2 rounded-lg bg-slate-800/40 border border-slate-700/40">
                  <p className="text-lg font-extrabold text-white">{val}</p>
                  <p className="text-[11px] text-slate-400 font-medium">{label}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ─── Quick Search Card Section (Overlapping Hero) ────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="shadow-xl rounded-2xl overflow-hidden border border-slate-200">
          <QuickSearch />
        </div>
      </section>

      {/* ─── Featured Sports Turfs Section ──────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Popular Turfs in Kerala</h2>
            <p className="text-xs text-slate-500 mt-0.5">Top-rated sports arenas with real-time slot scheduling.</p>
          </div>
          <Link
            to="/turfs"
            className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1 group bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-200 transition"
          >
            <span>View All Turfs</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading sports facilities...</div>
        ) : popularTurfs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
            <Building className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">No Turfs Listed Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Explore our full directory or log in as a Turf Owner to manage facility listings.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularTurfs.map((turf) => (
              <div
                key={turf.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-lg hover:border-brand-300 transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  {/* Turf Photo Banner with Star Overlay */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                    <img
                      src={turf.images?.[0] || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80'}
                      alt={turf.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-xs flex items-center gap-1.5 border border-white/20">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>{turf.rating || '4.8'}</span>
                      <span className="text-slate-300 font-normal">({turf.review_count || 12})</span>
                    </div>
                    <div className="absolute bottom-3 left-3 bg-brand-700/90 text-white backdrop-blur-md px-2.5 py-0.5 rounded text-[11px] font-bold">
                      📍 {turf.city || 'Kerala'}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-brand-700 transition">
                      {turf.name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{turf.address || turf.city}</span>
                    </p>

                    {/* Facility Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {['Free Parking', 'LED Floodlights', 'Changing Rooms'].map((f) => (
                        <span key={f} className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Starting Rate</span>
                    <span className="font-extrabold text-slate-900 text-base">₹{turf.starting_price || 1200}</span>
                    <span className="text-slate-500 text-xs">/hr</span>
                  </div>
                  <Link
                    to={`/turfs/${turf.slug || turf.id}`}
                    className="py-2 px-4 bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1"
                  >
                    <span>Book Slot</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── Lower Section: Open Matches & How It Works ─────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Open Matches Feed */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Open Pick-up Matches</h2>
                <p className="text-xs text-slate-500">Join ongoing public matches hosted at verified turfs.</p>
              </div>
              <Link
                to="/open-matches"
                className="text-xs font-bold text-brand-700 hover:text-brand-800"
              >
                View All Matches →
              </Link>
            </div>

            {openMatches.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-2">
                <Trophy className="w-6 h-6 text-slate-400 mx-auto" />
                <h4 className="text-xs font-bold text-slate-900">No Open Matches Listed</h4>
                <p className="text-[11px] text-slate-500">
                  Check back soon for active pick-up games hosted by turf owners.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {openMatches.map((m) => (
                  <div
                    key={m.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-brand-300 transition flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative">
                        <img
                          src={m.turf_image || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80'}
                          alt={m.turf_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{m.title}</h4>
                          {m.sport_type?.toLowerCase().includes('cricket') ? (
                            <img
                              src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=120&q=80"
                              alt="Cricket"
                              className="w-3.5 h-3.5 rounded-full object-cover shrink-0 border border-amber-300"
                              title="Cricket"
                            />
                          ) : (
                            <img
                              src="https://images.unsplash.com/photo-1614632537190-23e4146777db?auto=format&fit=crop&w=120&q=80"
                              alt="Football"
                              className="w-3.5 h-3.5 rounded-full object-cover shrink-0 border border-emerald-300"
                              title="Football"
                            />
                          )}
                        </div>
                        <p className="text-[11px] font-semibold text-brand-700 mt-0.5 truncate">
                          📍 {m.turf_name} ({m.turf_city})
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          📅 {m.match_date} · {m.start_time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-slate-900 block">
                          {m.slots_left}/{m.max_players}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-medium">Slots Left</span>
                      </div>

                      <Link
                        to="/open-matches"
                        className="px-3.5 py-2 bg-slate-900 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                      >
                        Join (₹{m.price_per_player})
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: How It Works Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs relative space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">How PLAYSPORT Works</h3>
                <span className="text-xs text-brand-700 font-bold bg-brand-50 px-2 py-0.5 rounded">3 Simple Steps</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-brand-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Choose District & Sport</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Filter by district in Kerala to find certified FIFA-standard turfs and cricket boxes.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-brand-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Select Hourly Slot</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">View real-time open slots and reserve instant hourly booking slots online.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-brand-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Play & Enjoy</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Show up at the venue with your team. LED floodlights and changing facilities ready.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};

export default HomePage;

