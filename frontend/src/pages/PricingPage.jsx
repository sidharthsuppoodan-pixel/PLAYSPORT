import React from 'react';
import { Check, Zap, Building2, Trophy, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const PricingPage = ({ onOpenAuth }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold tracking-wider text-brand-700 uppercase px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200">
          Transparent Sports Pricing
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Simple Plans for Athletes & Facility Owners
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Zero hidden fees. Secure instant payment gateways, live slot concurrency locking, and full refund protection.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Tier 1: Casual Player */}
        <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-2xs hover:shadow-md transition flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              ⚽
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Casual Player</h3>
              <p className="text-xs text-slate-500 mt-1">For weekend sports enthusiasts</p>
            </div>

            <div className="py-2">
              <span className="text-3xl font-black text-slate-900">₹0</span>
              <span className="text-xs text-slate-400"> / platform fee</span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Pay only for booked slots
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Instant booking confirmation & PDF receipt
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Join unlimited Open Matches
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Free equipment rental add-ons
              </li>
            </ul>
          </div>

          <Link
            to="/turfs"
            className="w-full mt-6 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl text-center shadow-2xs transition"
          >
            Find a Turf
          </Link>
        </div>

        {/* Tier 2: Turf Facility Owner (Featured) */}
        <div className="bg-white rounded-2xl p-7 border-2 border-brand-600 shadow-md relative flex flex-col justify-between">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-700 text-white text-[10px] font-extrabold uppercase tracking-wider py-1 px-3 rounded-full shadow-sm">
            Most Popular for Facilities
          </div>

          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              🏟️
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Turf Facility Owner</h3>
              <p className="text-xs text-slate-500 mt-1">Full-suite slot & revenue management</p>
            </div>

            <div className="py-2">
              <span className="text-3xl font-black text-brand-700">3.5%</span>
              <span className="text-xs text-slate-400"> / per online booking</span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Automatic double-booking collision protection
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Real-time Facility Utilization indicator lights
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Host Open Matches & Tournaments
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Daily/Monthly Revenue Analytics Chart
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Equipment inventory tracking
              </li>
            </ul>
          </div>

          <button
            onClick={() => onOpenAuth('owner_register')}
            className="w-full mt-6 py-2.5 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-xl text-center shadow-sm shadow-brand-700/20 transition"
          >
            Register Facility
          </button>
        </div>

        {/* Tier 3: Tournament Organizer */}
        <div className="bg-white rounded-2xl p-7 border border-slate-200 shadow-2xs hover:shadow-md transition flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              🏆
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Tournament Organizer</h3>
              <p className="text-xs text-slate-500 mt-1">For leagues, cups, and corporate events</p>
            </div>

            <div className="py-2">
              <span className="text-3xl font-black text-slate-900">₹499</span>
              <span className="text-xs text-slate-400"> / hosted tournament</span>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Automated team roster & fee collection
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Knockout & Round Robin bracket builder
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Player verification & match scorekeeper
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Dedicated public tournament landing page
              </li>
            </ul>
          </div>

          <Link
            to="/tournaments"
            className="w-full mt-6 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl text-center shadow-2xs transition"
          >
            Explore Tournaments
          </Link>
        </div>

      </div>

    </div>
  );
};

export default PricingPage;
