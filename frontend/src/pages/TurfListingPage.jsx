import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { turfsAPI } from '../services/api';
import { Star, MapPin, Search, Filter, ArrowRight } from 'lucide-react';

const TurfListingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedSport, setSelectedSport] = useState(searchParams.get('sport') || 'All');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || 'All');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const fetchTurfs = async () => {
      setLoading(true);
      try {
        const params = {};
        if (selectedSport && selectedSport !== 'All') params.sport = selectedSport;
        if (selectedCity && selectedCity !== 'All') params.city = selectedCity;
        if (searchTerm) params.search = searchTerm;
        
        const res = await turfsAPI.getAll(params);
        setTurfs(res.data);
      } catch (err) {
        console.error("Error fetching turfs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTurfs();
  }, [selectedSport, selectedCity, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Find Sports Turfs & Grounds
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Explore artificial turf pitches, box cricket stadiums, and multipurpose arenas.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search turf or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Sport Filter */}
        <div>
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 cursor-pointer"
          >
            <option value="All">All Sports</option>
            <option value="Football">Football</option>
            <option value="Cricket">Box Cricket</option>
            <option value="Badminton">Badminton</option>
            <option value="Tennis">Tennis</option>
          </select>
        </div>

        {/* City Filter */}
        <div>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50 cursor-pointer"
          >
            <option value="All">All Cities</option>
            <option value="Kochi">Kochi</option>
            <option value="Thiruvananthapuram">Thiruvananthapuram</option>
            <option value="Kozhikode">Kozhikode</option>
            <option value="Malappuram">Malappuram</option>
            <option value="Thrissur">Thrissur</option>
            <option value="Kannur">Kannur</option>
            <option value="Kottayam">Kottayam</option>
            <option value="Ernakulam">Ernakulam</option>
          </select>
        </div>

        {/* Reset Filter Button */}
        <div>
          <button
            onClick={() => {
              setSelectedSport('All');
              setSelectedCity('All');
              setSearchTerm('');
            }}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Turf Results Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading sports facilities...</div>
      ) : turfs.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200 p-8 space-y-2">
          <p className="text-sm font-bold text-slate-700">No sports facilities match your search filters.</p>
          <p className="text-xs text-slate-400">Try selecting "All Cities" or "All Sports".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {turfs.map((turf) => (
            <div
              key={turf.id}
              className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img
                    src={turf.images?.[0] || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80'}
                    alt={turf.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded text-[11px] font-bold text-slate-800 shadow-xs flex items-center gap-1 border border-slate-100">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>{turf.rating}</span>
                    <span className="text-slate-400 font-normal">({turf.review_count})</span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-brand-700 transition">
                    {turf.name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{turf.address}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(turf.facilities || []).slice(0, 3).map((f, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs">
                  <span className="font-extrabold text-slate-900 text-sm">₹{turf.starting_price}</span>
                  <span className="text-slate-500 text-[11px]"> /hr</span>
                </div>
                <Link
                  to={`/turfs/${turf.slug || turf.id}`}
                  className="py-1.5 px-3 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-lg shadow-2xs transition flex items-center gap-1"
                >
                  Book Slot
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TurfListingPage;
