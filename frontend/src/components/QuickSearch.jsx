import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Calendar, MapPin } from 'lucide-react';

const QuickSearch = () => {
  const navigate = useNavigate();
  const [sport, setSport] = useState('Football (5v5)');
  const [location, setLocation] = useState('Kochi');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (sport && sport !== 'All Sports') params.append('sport', sport);
    if (location && location !== 'All Locations') params.append('city', location);
    if (date) params.append('date', date);
    navigate(`/turfs?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 lg:p-6">
      <h2 className="text-base font-bold text-slate-900 mb-3.5">Quick Search</h2>
      
      <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end">
        {/* Sport Selector */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Sport
          </label>
          <div className="relative">
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition cursor-pointer"
            >
              <option value="Football (5v5)">Football (5v5)</option>
              <option value="Cricket">Box Cricket</option>
              <option value="Badminton">Badminton</option>
              <option value="Tennis">Tennis</option>
              <option value="All Sports">All Sports</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Location Selector */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Location
          </label>
          <div className="relative">
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition cursor-pointer"
            >
              <option value="Kochi">Kochi</option>
              <option value="Thiruvananthapuram">Thiruvananthapuram</option>
              <option value="Kozhikode">Kozhikode</option>
              <option value="Malappuram">Malappuram</option>
              <option value="Thrissur">Thrissur</option>
              <option value="Kannur">Kannur</option>
              <option value="Kottayam">Kottayam</option>
              <option value="Ernakulam">Ernakulam</option>
              <option value="All Locations">All Locations</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Date Selector */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition cursor-pointer"
            />
          </div>
        </div>

        {/* Search Submit Button */}
        <div>
          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white text-xs font-bold rounded-lg shadow-sm shadow-brand-700/20 transition flex items-center justify-center gap-2 h-[38px]"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuickSearch;
