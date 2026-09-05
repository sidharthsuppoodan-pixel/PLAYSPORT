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
  Building
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
          turfsAPI.getPopular(3),
          openMatchesAPI.getAll()
        ]);
        setPopularTurfs(turfsRes.data);
        setOpenMatches(matchesRes.data.slice(0, 2));
      } catch (err) {
        console.error("Error fetching homepage data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin, isOwner, navigate]);

  return (
    <div className="space-y-10 pb-16">
      
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14">
        <div className="text-center space-y-5 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
            <Flame className="w-3.5 h-3.5" /> India's #1 Sports Facility Platform
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
            Find. Book. <span className="text-brand-600">Play.</span>
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            Discover premium sports turfs across India. Easily book slots, join open matches, and manage your schedule. Experience professional-grade facility management.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <Link
              to="/turfs"
              className="py-3 px-6 bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm shadow-brand-700/20 transition-all"
            >
              Book Now
            </Link>
            <Link
              to="/open-matches"
              className="py-3 px-6 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs sm:text-sm font-semibold rounded-lg transition-all"
            >
              Explore Matches
            </Link>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-center gap-8 pt-4 border-t border-slate-100 mt-6">
            {[['500+', 'Turfs Listed'], ['50K+', 'Bookings Made'], ['4.8★', 'Avg Rating'], ['25+', 'Cities']].map(([val, label]) => (
              <div key={label} className="text-center">
                <p className="text-lg font-extrabold text-slate-900">{val}</p>
                <p className="text-[11px] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Quick Search Card Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <QuickSearch />
      </section>

      {/* Popular Turfs Section Matching Stitch Screenshot 2 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Popular Turfs</h2>
          <Link
            to="/turfs"
            className="text-xs font-semibold text-brand-700 hover:text-brand-800 flex items-center gap-1 group"
          >
            View All
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {popularTurfs.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
            <Building className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">No Turfs Available Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All demo turfs were removed when resetting seeded accounts. Registered turf owners can add new facilities from their Turf Manager console.
            </p>
            <Link to="/turfs" className="inline-block px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-lg transition">
              Explore Turf Directory
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularTurfs.map((turf) => (
              <div
                key={turf.id}
                className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md transition-all group flex flex-col"
              >
                {/* Image with Rating Badge Overlay */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img
                    src={turf.images?.[0] || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80'}
                    alt={turf.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded text-[11px] font-bold text-slate-800 shadow-xs flex items-center gap-1 border border-slate-100">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>{turf.rating}</span>
                    <span className="text-slate-400 font-normal">({turf.review_count})</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-brand-700 transition">
                      {turf.name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{turf.address || turf.city}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100">
                    <div className="text-xs">
                      <span className="font-extrabold text-slate-900 text-sm">₹{turf.starting_price}</span>
                      <span className="text-slate-500 text-[11px]"> /hr</span>
                    </div>
                    <Link
                      to={`/turfs/${turf.slug || turf.id}`}
                      className="text-xs font-bold text-brand-700 hover:text-brand-800 transition"
                    >
                      Book
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Lower Split Section: Open Matches & How It Works Matching Stitch Screenshot 2 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Open Matches Live Feed */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Open Matches</h2>
              <Link
                to="/open-matches"
                className="text-xs font-semibold text-brand-700 hover:text-brand-800"
              >
                See All
              </Link>
            </div>

            {openMatches.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-center space-y-2">
                <Trophy className="w-6 h-6 text-slate-400 mx-auto" />
                <h4 className="text-xs font-bold text-slate-900">No Open Matches Scheduled</h4>
                <p className="text-[11px] text-slate-500">
                  There are currently no active open matches listed.
                </p>
                <Link to="/open-matches" className="inline-block px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition">
                  Browse Open Matches Page
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {openMatches.map((m) => (
                  <div
                    key={m.id}
                    className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs hover:border-slate-300 transition flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                      {m.sport_type?.toLowerCase().includes('cricket') ? '🏏' : '⚽'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{m.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {m.turf_name}, {m.turf_city} • {m.match_date}, {m.start_time}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-800 block">
                        {m.slots_left}/{m.max_players}
                      </span>
                      <span className="text-[10px] text-slate-400 block">Slots Left</span>
                    </div>

                    <Link
                      to="/open-matches"
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-2xs transition"
                    >
                      Join (₹{m.price_per_player})
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>

          {/* Right Column: How it Works Vertical Timeline Card Matching Stitch */}
          <div className="lg:col-span-5">
            <div className="bg-[#f8fafc] rounded-xl p-6 border border-slate-200 shadow-2xs relative">
              <h3 className="text-base font-bold text-slate-900 mb-6">How it Works</h3>
              
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                
                {/* Step 1 */}
                <div className="relative flex items-start gap-4">
                  <div className="absolute -left-[27px] w-6 h-6 rounded-full bg-white border-2 border-brand-600 flex items-center justify-center text-brand-600">
                    <Search className="w-3 h-3" />
                  </div>
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex-1">
                    <h4 className="text-xs font-bold text-slate-900">1. Search</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Find nearby turfs by sport, location, and real-time availability.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative flex items-start gap-4">
                  <div className="absolute -left-[27px] w-6 h-6 rounded-full bg-white border-2 border-slate-400 flex items-center justify-center text-slate-600">
                    <Calendar className="w-3 h-3" />
                  </div>
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex-1">
                    <h4 className="text-xs font-bold text-slate-900">2. Book</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Select your slot and pay securely online to instantly confirm.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative flex items-start gap-4">
                  <div className="absolute -left-[27px] w-6 h-6 rounded-full bg-white border-2 border-slate-400 flex items-center justify-center text-slate-600">
                    <Trophy className="w-3 h-3" />
                  </div>
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex-1">
                    <h4 className="text-xs font-bold text-slate-900">3. Play</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Show up at the venue with friends and enjoy your game!
                    </p>
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
