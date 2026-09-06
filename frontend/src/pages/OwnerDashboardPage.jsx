import React, { useState, useEffect } from 'react';
import { reportsAPI, slotsAPI, turfsAPI, groundsAPI, openMatchesAPI, tournamentsAPI, equipmentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Building,
  Calendar,
  BookOpen,
  Trophy,
  BarChart3,
  Settings,
  HelpCircle,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  X,
  Dumbbell,
  Users,
  Award,
  Layers,
  Phone,
  MapPin,
  Tag
} from 'lucide-react';

const PRESET_SPORTS_GEAR = [
  { name: "FIFA Match Football (Size 5)", category: "Balls", defaultPrice: 100 },
  { name: "Futsal Low-Bounce Ball (Size 4)", category: "Balls", defaultPrice: 80 },
  { name: "Kashmir Willow Cricket Bat", category: "Bats", defaultPrice: 120 },
  { name: "English Willow Premium Bat", category: "Bats", defaultPrice: 200 },
  { name: "Heavy Tennis / Leather Cricket Balls (Pack of 3)", category: "Balls", defaultPrice: 50 },
  { name: "Cricket Stumps & Bails Wooden Set", category: "Cricket Accessories", defaultPrice: 100 },
  { name: "Cricket Batting Pads & Gloves Set", category: "Cricket Accessories", defaultPrice: 150 },
  { name: "Team Training Bibs / Vests (Set of 10)", category: "Bibs & Vests", defaultPrice: 150 },
  { name: "Professional Goalkeeper Gloves", category: "Protective Gear", defaultPrice: 100 },
  { name: "Badminton Rackets Pair (Yonex Pro)", category: "Rackets", defaultPrice: 120 },
  { name: "Badminton Feather Shuttlecocks (Tube)", category: "Shuttlecocks", defaultPrice: 80 },
  { name: "Tennis Rackets Pair", category: "Rackets", defaultPrice: 150 },
  { name: "Official Match Volleyball", category: "Balls", defaultPrice: 100 },
  { name: "Agility Training Cones & Markers Set", category: "Training Gear", defaultPrice: 80 },
  { name: "Corner Flags & Net Pegs Set", category: "Turf Essentials", defaultPrice: 60 },
  { name: "First Aid & Ice Pack Kit", category: "Safety", defaultPrice: 50 },
  { name: "Custom Sports Gear Item...", category: "Other", defaultPrice: 100 }
];

const OwnerDashboardPage = () => {
  const { user } = useAuth();
  
  // Dashboard states
  const [metrics, setMetrics] = useState({
    total_turfs: 0,
    todays_bookings: 0,
    revenue_today_display: '₹0',
    revenue_projected_display: 'Total Rev: ₹0',
    active_matches: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [facilityStatuses, setFacilityStatuses] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Entity data states
  const [myTurfs, setMyTurfs] = useState([]);
  const [openMatchesList, setOpenMatchesList] = useState([]);
  const [tournamentsList, setTournamentsList] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalError, setModalError] = useState('');

  // Modal display controls
  const [showAddGroundModal, setShowAddGroundModal] = useState(false);
  const [showManageSlotsModal, setShowManageSlotsModal] = useState(false);
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  const [showCreateTournamentModal, setShowCreateTournamentModal] = useState(false);
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);

  const [newGround, setNewGround] = useState({
    turf_id: '',
    name: 'Turf A (5v5)',
    sport_type: 'Football',
    ground_size: '5v5',
    hourly_rate: 1200,
  });

  const [slotGenData, setSlotGenData] = useState({
    ground_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    hourly_price: 1200
  });

  const [newMatch, setNewMatch] = useState({
    turf_id: '',
    ground_id: '',
    title: '',
    sport_type: 'Football',
    skill_level: 'Casual / Intermediate',
    match_date: new Date().toISOString().split('T')[0],
    start_time: '18:00',
    end_time: '19:00',
    max_players: 10,
    price_per_player: 150,
    rules: 'Friendly match. Bibs & ball provided.',
    description: 'Casual game open for all players.'
  });

  const [newTournament, setNewTournament] = useState({
    turf_id: '',
    title: '',
    sport: 'Football',
    format: 'Knockout',
    start_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    registration_deadline: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    max_teams: 16,
    entry_fee: 2000,
    prize_pool: 25000,
    rules: 'Official tournament rules. Trophies & cash prize for winners.'
  });

  const [newEquipment, setNewEquipment] = useState({
    turf_id: '',
    name: '',
    category: 'Balls',
    total_quantity: 10,
    price_per_hour: 100
  });

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [metRes, bookRes, facRes, turfsRes, matchesRes, tournRes, eqRes] = await Promise.all([
        reportsAPI.getOwnerDashboard().catch(() => ({ data: metrics })),
        reportsAPI.getRecentBookings().catch(() => ({ data: [] })),
        reportsAPI.getFacilityStatus().catch(() => ({ data: [] })),
        turfsAPI.getAll().catch(() => ({ data: [] })),
        openMatchesAPI.getAll().catch(() => ({ data: [] })),
        tournamentsAPI.getAll().catch(() => ({ data: [] })),
        equipmentAPI.getAll().catch(() => ({ data: [] }))
      ]);

      setMetrics(metRes.data);
      setRecentBookings(bookRes.data || []);
      setFacilityStatuses(facRes.data || []);
      setMyTurfs(turfsRes.data || []);
      setOpenMatchesList(matchesRes.data || []);
      setTournamentsList(tournRes.data || []);
      setEquipmentList(eqRes.data || []);

      if (turfsRes.data && turfsRes.data.length > 0) {
        const firstTurfId = turfsRes.data[0].id;
        setNewGround(prev => ({ ...prev, turf_id: firstTurfId }));
        setNewMatch(prev => ({ ...prev, turf_id: firstTurfId }));
        setNewTournament(prev => ({ ...prev, turf_id: firstTurfId }));
        setNewEquipment(prev => ({ ...prev, turf_id: firstTurfId }));
      }
    } catch (err) {
      console.error("Owner dashboard fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Form submit handlers

  const handleCreateGroundSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      await groundsAPI.create(newGround);
      setModalSuccess("Ground added successfully!");
      fetchDashboard();
      setTimeout(() => {
        setModalSuccess('');
        setShowAddGroundModal(false);
      }, 1200);
    } catch (err) {
      setModalError(err.response?.data?.detail || "Failed to add ground.");
    }
  };

  const handleGenerateSlotsSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      await slotsAPI.batchGenerate(slotGenData);
      setModalSuccess("Slots generated and published successfully!");
      fetchDashboard();
      setTimeout(() => {
        setModalSuccess('');
        setShowManageSlotsModal(false);
      }, 1200);
    } catch (err) {
      setModalError(err.response?.data?.detail || "Failed to generate slots.");
    }
  };

  const handleCreateMatchSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      await openMatchesAPI.create(newMatch);
      setModalSuccess("Open Match created successfully!");
      fetchDashboard();
      setTimeout(() => {
        setModalSuccess('');
        setShowCreateMatchModal(false);
      }, 1200);
    } catch (err) {
      setModalError(err.response?.data?.detail || "Failed to create match.");
    }
  };

  const handleCreateTournamentSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      await tournamentsAPI.create(newTournament);
      setModalSuccess("Tournament created successfully!");
      fetchDashboard();
      setTimeout(() => {
        setModalSuccess('');
        setShowCreateTournamentModal(false);
      }, 1200);
    } catch (err) {
      setModalError(err.response?.data?.detail || "Failed to create tournament.");
    }
  };

  const handleAddEquipmentSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      await equipmentAPI.create({
        ...newEquipment,
        available_quantity: newEquipment.total_quantity
      });
      setModalSuccess("Equipment added to rental inventory!");
      fetchDashboard();
      setTimeout(() => {
        setModalSuccess('');
        setShowAddEquipmentModal(false);
      }, 1200);
    } catch (err) {
      setModalError(err.response?.data?.detail || "Failed to add equipment.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      
      {/* Left Sidebar for Turf Owner */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between py-6 px-4 shrink-0">
        <div className="space-y-6">
          <div className="px-2">
            <h3 className="text-sm font-extrabold text-brand-700">Turf Owner Console</h3>
            <p className="text-[11px] text-slate-400">Facility & Management Portal</p>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'dashboard' ? 'bg-blue-50/80 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-blue-600" />
              Overview
            </button>

            <button
              onClick={() => setActiveTab('turfs')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeTab === 'turfs' ? 'bg-blue-50/80 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Building className="w-4 h-4 text-slate-400" />
              My Turfs & Grounds
            </button>

            <button
              onClick={() => setActiveTab('slots')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeTab === 'slots' ? 'bg-blue-50/80 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4 text-slate-400" />
              Slot Manager
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeTab === 'bookings' ? 'bg-blue-50/80 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4 text-slate-400" />
              Bookings
            </button>

            <button
              onClick={() => setActiveTab('matches')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeTab === 'matches' ? 'bg-blue-50/80 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Trophy className="w-4 h-4 text-slate-400" />
              Open Matches
            </button>

            <button
              onClick={() => setActiveTab('tournaments')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeTab === 'tournaments' ? 'bg-blue-50/80 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Award className="w-4 h-4 text-slate-400" />
              Tournaments
            </button>

            <button
              onClick={() => setActiveTab('equipment')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeTab === 'equipment' ? 'bg-blue-50/80 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Dumbbell className="w-4 h-4 text-slate-400" />
              Equipment Rentals
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2.5 px-3 pt-2">
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
              {user?.full_name?.charAt(0) || 'O'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name || 'Turf Owner'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.business_name || 'Sports Arena'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-8 max-w-7xl">
        
        {/* Header & Quick Action Trigger Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {activeTab === 'dashboard' && 'Owner Dashboard'}
              {activeTab === 'turfs' && 'Turf & Ground Management'}
              {activeTab === 'slots' && 'Slot Manager'}
              {activeTab === 'bookings' && 'Customer Bookings'}
              {activeTab === 'matches' && 'Open Match Host'}
              {activeTab === 'tournaments' && 'Tournament Manager'}
              {activeTab === 'equipment' && 'Equipment Rental Inventory'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Welcome back, {user?.full_name}. Manage your facilities & bookings.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowManageSlotsModal(true)}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-2xs transition flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" /> Add Slots
            </button>
            <button
              onClick={() => setShowCreateMatchModal(true)}
              className="py-2 px-3 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg shadow-2xs transition flex items-center gap-1.5"
            >
              <Trophy className="w-3.5 h-3.5" /> Host Match
            </button>
          </div>
        </div>

        {/* ─── TAB 1: OVERVIEW DASHBOARD ────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Total Turfs</span>
                  <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Building className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-black text-slate-900">{metrics.total_turfs}</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Total Bookings</span>
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-black text-slate-900">{metrics.todays_bookings}</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Total Revenue</span>
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-brand-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-black text-slate-900">{metrics.revenue_today_display}</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Open Matches</span>
                  <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Trophy className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-black text-slate-900">{metrics.active_matches}</p>
              </div>
            </div>

            {/* Split Content: Bookings & Facilities */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-slate-900">Recent Customer Bookings</h2>
                  <button onClick={() => setActiveTab('bookings')} className="text-xs font-bold text-brand-700 hover:underline">
                    View All
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px]">
                        <th className="pb-3 font-semibold">Reference</th>
                        <th className="pb-3 font-semibold">Customer</th>
                        <th className="pb-3 font-semibold">Facility</th>
                        <th className="pb-3 font-semibold">Time</th>
                        <th className="pb-3 font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentBookings.map((bk) => (
                        <tr key={bk.id} className="hover:bg-slate-50/80">
                          <td className="py-3 font-mono font-bold text-brand-700">{bk.booking_reference}</td>
                          <td className="py-3 font-semibold text-slate-800">{bk.customer_name}</td>
                          <td className="py-3 text-slate-600">{bk.ground_name || bk.turf_name}</td>
                          <td className="py-3 text-slate-500">{bk.time_display}</td>
                          <td className="py-3 text-right">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {bk.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {recentBookings.length === 0 && (
                        <tr><td colSpan="5" className="py-6 text-center text-slate-400">No bookings yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                <h2 className="text-sm font-bold text-slate-900 mb-4">Live Facility Utilization</h2>
                <div className="space-y-3">
                  {facilityStatuses.map((fac) => (
                    <div key={fac.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{fac.name}</h4>
                        <span className="text-[11px] text-slate-500">{fac.status_text}</span>
                      </div>
                      <div className={`w-2.5 h-2.5 rounded-full ${fac.is_available ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    </div>
                  ))}
                  {facilityStatuses.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">No ground statuses available.</p>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ─── TAB 2: MY TURFS & GROUNDS ────────────────────────────────────────── */}
        {activeTab === 'turfs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Your Listed Turfs ({myTurfs.length})</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddGroundModal(true)}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Ground
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myTurfs.map((turf) => (
                <div key={turf.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="h-40 bg-slate-100 relative">
                    <img src={turf.images?.[0] || 'https://images.unsplash.com/photo-1529900245534-47fbf028b18a?auto=format&fit=crop&w=800&q=80'} alt={turf.name} className="w-full h-full object-cover" />
                    <span className="absolute top-3 right-3 bg-white/90 px-2 py-0.5 rounded text-xs font-bold text-slate-800">
                      ₹{turf.starting_price}/hr
                    </span>
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-slate-900 text-base">{turf.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">📍 {turf.address || turf.city}</p>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">{turf.sports_supported || 'Football'}</span>
                      <button onClick={() => { setNewGround(g => ({ ...g, turf_id: turf.id })); setShowAddGroundModal(true); }} className="text-brand-700 font-bold hover:underline">
                        + Add Ground
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {myTurfs.length === 0 && (
                <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
                  <Building className="w-8 h-8 text-slate-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-900">No Turfs Assigned</h3>
                  <p className="text-xs text-slate-500">Contact platform admin to assign or manage turfs for your account.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 3: SLOT MANAGER ─────────────────────────────────────────────── */}
        {activeTab === 'slots' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Slot Manager</h2>
                <p className="text-xs text-slate-500">Batch generate and manage hourly available slots.</p>
              </div>
              <button onClick={() => setShowManageSlotsModal(true)} className="py-2 px-4 bg-brand-700 text-white text-xs font-bold rounded-lg flex items-center gap-2">
                <Plus className="w-4 h-4" /> Batch Generate Slots
              </button>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
              <p className="font-bold text-slate-900">💡 Quick Tip for Turf Owners:</p>
              <p>Generate slots in advance for the upcoming week. Players will be able to view and book these slots in real time.</p>
            </div>
          </div>
        )}

        {/* ─── TAB 4: BOOKINGS ─────────────────────────────────────────────────── */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Customer Bookings</h2>
              <p className="text-xs text-slate-500">All bookings reserved across your turfs.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                  <tr>
                    <th className="px-6 py-4">Reference</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Facility</th>
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-mono font-bold text-brand-700">{b.booking_reference}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{b.customer_name}</td>
                      <td className="px-6 py-4 text-slate-700">{b.ground_name || b.turf_name}</td>
                      <td className="px-6 py-4 text-slate-600">{b.time_display}</td>
                      <td className="px-6 py-4 font-bold text-emerald-600">₹{b.amount}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentBookings.length === 0 && (
                    <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-400">No customer bookings recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── TAB 5: OPEN MATCHES ─────────────────────────────────────────────── */}
        {activeTab === 'matches' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Hosted Open Matches</h2>
                <p className="text-xs text-slate-500">Organize pick-up games and casual matches at your turfs.</p>
              </div>
              <button onClick={() => setShowCreateMatchModal(true)} className="py-2 px-4 bg-teal-700 text-white text-xs font-bold rounded-lg flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Open Match
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {openMatchesList.map((m) => (
                <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-900 text-sm">{m.title}</h3>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold">{m.sport_type}</span>
                  </div>
                  <p className="text-xs text-slate-500">📅 {m.match_date} • ⏰ {m.start_time} - {m.end_time}</p>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                    <span className="font-semibold text-slate-700">Slots: {m.slots_left}/{m.max_players}</span>
                    <span className="font-bold text-emerald-600">₹{m.price_per_player}/player</span>
                  </div>
                </div>
              ))}
              {openMatchesList.length === 0 && (
                <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                  <Trophy className="w-8 h-8 text-slate-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-900">No Open Matches Created</h3>
                  <p className="text-xs text-slate-500">Host casual games for players to join online.</p>
                  <button onClick={() => setShowCreateMatchModal(true)} className="px-4 py-2 bg-teal-700 text-white text-xs font-bold rounded-lg">
                    Host Match Now
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 6: TOURNAMENTS ──────────────────────────────────────────────── */}
        {activeTab === 'tournaments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Tournaments & Cups</h2>
                <p className="text-xs text-slate-500">Host competitive tournaments and manage team registrations.</p>
              </div>
              <button onClick={() => setShowCreateTournamentModal(true)} className="py-2 px-4 bg-purple-700 text-white text-xs font-bold rounded-lg flex items-center gap-2">
                <Plus className="w-4 h-4" /> Host Tournament
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tournamentsList.map((t) => (
                <div key={t.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-900 text-sm">{t.title}</h3>
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-bold">{t.format}</span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p>🏆 Prize Pool: <strong className="text-emerald-600">₹{t.prize_pool}</strong></p>
                    <p>🎟️ Entry Fee: ₹{t.entry_fee} per team</p>
                    <p>📅 Dates: {t.start_date} to {t.end_date}</p>
                  </div>
                </div>
              ))}
              {tournamentsList.length === 0 && (
                <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                  <Award className="w-8 h-8 text-slate-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-900">No Tournaments Hosted</h3>
                  <p className="text-xs text-slate-500">Organize tournament cups to attract local sports teams.</p>
                  <button onClick={() => setShowCreateTournamentModal(true)} className="px-4 py-2 bg-purple-700 text-white text-xs font-bold rounded-lg">
                    Create Tournament
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 7: EQUIPMENT RENTALS ────────────────────────────────────────── */}
        {activeTab === 'equipment' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Equipment Rental Inventory</h2>
                <p className="text-xs text-slate-500">Rent balls, bats, rackets, and protective gear to players.</p>
              </div>
              <button onClick={() => setShowAddEquipmentModal(true)} className="py-2 px-4 bg-brand-700 text-white text-xs font-bold rounded-lg flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Equipment
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipmentList.map((eq) => (
                <div key={eq.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <h3 className="font-bold text-slate-900 text-sm">{eq.name}</h3>
                  <p className="text-xs text-slate-500">Category: {eq.category}</p>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                    <span className="font-semibold text-slate-700">Available: {eq.available_quantity}/{eq.total_quantity}</span>
                    <span className="font-bold text-emerald-600">₹{eq.price_per_hour}/hr</span>
                  </div>
                </div>
              ))}
              {equipmentList.length === 0 && (
                <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                  <Dumbbell className="w-8 h-8 text-slate-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-900">No Rental Equipment Added</h3>
                  <p className="text-xs text-slate-500">List sports gear available for hourly player rentals.</p>
                  <button onClick={() => setShowAddEquipmentModal(true)} className="px-4 py-2 bg-brand-700 text-white text-xs font-bold rounded-lg">
                    Add Gear Item
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </main>



      {/* ─── MODAL 2: ADD GROUND ─────────────────────────────────────────────── */}
      {showAddGroundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 w-full max-w-md relative fade-in">
            <button onClick={() => setShowAddGroundModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-bold text-slate-900 mb-1">Add Pitch / Ground</h3>
            <p className="text-xs text-slate-500 mb-4">Add a specific court or pitch to one of your turfs.</p>
            {modalSuccess && <div className="p-3 mb-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold">{modalSuccess}</div>}
            {modalError && <div className="p-3 mb-3 rounded-lg bg-rose-50 text-rose-800 text-xs font-bold">{modalError}</div>}
            <form onSubmit={handleCreateGroundSubmit} className="space-y-3 text-xs">

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ground Name</label>
                <input type="text" required value={newGround.name} onChange={(e) => setNewGround({ ...newGround, name: e.target.value })} placeholder="e.g. Court A (Box Cricket)" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sport</label>
                  <select value={newGround.sport_type} onChange={(e) => setNewGround({ ...newGround, sport_type: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="Football">Football</option>
                    <option value="Cricket">Cricket</option>
                    <option value="Badminton">Badminton</option>
                    <option value="Tennis">Tennis</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hourly Rate (₹)</label>
                  <input type="number" required value={newGround.hourly_rate} onChange={(e) => setNewGround({ ...newGround, hourly_rate: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <button type="submit" className="w-full mt-3 py-2.5 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900">Add Pitch / Ground</button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: BATCH GENERATE SLOTS ───────────────────────────────────── */}
      {showManageSlotsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 w-full max-w-md relative fade-in">
            <button onClick={() => setShowManageSlotsModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-bold text-slate-900 mb-1">Batch Generate Slots</h3>
            <p className="text-xs text-slate-500 mb-4">Publish available booking slots across dates.</p>
            {modalSuccess && <div className="p-3 mb-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold">{modalSuccess}</div>}
            {modalError && <div className="p-3 mb-3 rounded-lg bg-rose-50 text-rose-800 text-xs font-bold">{modalError}</div>}
            <form onSubmit={handleGenerateSlotsSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input type="date" required value={slotGenData.start_date} onChange={(e) => setSlotGenData({ ...slotGenData, start_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                  <input type="date" required value={slotGenData.end_date} onChange={(e) => setSlotGenData({ ...slotGenData, end_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hourly Price (₹)</label>
                <input type="number" required value={slotGenData.hourly_price} onChange={(e) => setSlotGenData({ ...slotGenData, hourly_price: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <button type="submit" className="w-full mt-3 py-2.5 bg-brand-700 text-white font-bold rounded-lg hover:bg-brand-800">Generate & Publish Slots</button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: CREATE OPEN MATCH ─────────────────────────────────────── */}
      {showCreateMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 w-full max-w-md relative fade-in">
            <button onClick={() => setShowCreateMatchModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-bold text-slate-900 mb-1">Create Open Pick-up Match</h3>
            <p className="text-xs text-slate-500 mb-4">Host a match for individual players to join online.</p>
            {modalSuccess && <div className="p-3 mb-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold">{modalSuccess}</div>}
            {modalError && <div className="p-3 mb-3 rounded-lg bg-rose-50 text-rose-800 text-xs font-bold">{modalError}</div>}
            <form onSubmit={handleCreateMatchSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Match Title</label>
                <input type="text" required value={newMatch.title} onChange={(e) => setNewMatch({ ...newMatch, title: e.target.value })} placeholder="e.g. 5v5 Weekend Football Knockout" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input type="date" required value={newMatch.match_date} onChange={(e) => setNewMatch({ ...newMatch, match_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price / Player (₹)</label>
                  <input type="number" required value={newMatch.price_per_player} onChange={(e) => setNewMatch({ ...newMatch, price_per_player: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <button type="submit" className="w-full mt-3 py-2.5 bg-teal-700 text-white font-bold rounded-lg hover:bg-teal-800">Publish Open Match</button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: CREATE TOURNAMENT ─────────────────────────────────────── */}
      {showCreateTournamentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 w-full max-w-md relative fade-in">
            <button onClick={() => setShowCreateTournamentModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-bold text-slate-900 mb-1">Host Tournament / Cup</h3>
            <p className="text-xs text-slate-500 mb-4">Create a team tournament at your sports arena.</p>
            {modalSuccess && <div className="p-3 mb-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold">{modalSuccess}</div>}
            {modalError && <div className="p-3 mb-3 rounded-lg bg-rose-50 text-rose-800 text-xs font-bold">{modalError}</div>}
            <form onSubmit={handleCreateTournamentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tournament Title</label>
                <input type="text" required value={newTournament.title} onChange={(e) => setNewTournament({ ...newTournament, title: e.target.value })} placeholder="e.g. City Champions Trophy 2026" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Entry Fee (₹)</label>
                  <input type="number" required value={newTournament.entry_fee} onChange={(e) => setNewTournament({ ...newTournament, entry_fee: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prize Pool (₹)</label>
                  <input type="number" required value={newTournament.prize_pool} onChange={(e) => setNewTournament({ ...newTournament, prize_pool: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <button type="submit" className="w-full mt-3 py-2.5 bg-purple-700 text-white font-bold rounded-lg hover:bg-purple-800">Publish Tournament</button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 6: ADD EQUIPMENT ─────────────────────────────────────────── */}
      {showAddEquipmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 w-full max-w-md relative fade-in">
            <button onClick={() => setShowAddEquipmentModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-bold text-slate-900 mb-1">Add Rental Equipment</h3>
            <p className="text-xs text-slate-500 mb-4">Select essential sports gear from preset menu to add to rental inventory.</p>
            {modalSuccess && <div className="p-3 mb-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold">{modalSuccess}</div>}
            {modalError && <div className="p-3 mb-3 rounded-lg bg-rose-50 text-rose-800 text-xs font-bold">{modalError}</div>}
            <form onSubmit={handleAddEquipmentSubmit} className="space-y-3 text-xs">


              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Turf Sports Gear</label>
                <select
                  value={newEquipment.name}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    const preset = PRESET_SPORTS_GEAR.find(g => g.name === selectedName);
                    if (preset) {
                      setNewEquipment(prev => ({
                        ...prev,
                        name: preset.name,
                        category: preset.category,
                        price_per_hour: preset.defaultPrice
                      }));
                    } else {
                      setNewEquipment(prev => ({ ...prev, name: selectedName }));
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-medium text-slate-800"
                >
                  <option value="">-- Select Gear Item --</option>
                  {PRESET_SPORTS_GEAR.map((item, idx) => (
                    <option key={idx} value={item.name}>
                      {item.name} ({item.category})
                    </option>
                  ))}
                </select>
              </div>

              {newEquipment.name === "Custom Sports Gear Item..." && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Custom Item Name</label>
                  <input
                    type="text"
                    required
                    onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                    placeholder="Enter gear name..."
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Stock Quantity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newEquipment.total_quantity}
                    onChange={(e) => setNewEquipment({ ...newEquipment, total_quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rental Rate (₹/hr)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newEquipment.price_per_hour}
                    onChange={(e) => setNewEquipment({ ...newEquipment, price_per_hour: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              
              {newEquipment.category && (
                <div className="p-2 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex justify-between">
                  <span>Category Tag: <strong className="text-slate-800">{newEquipment.category}</strong></span>
                  <span>Suggested Rate: <strong className="text-emerald-600">₹{newEquipment.price_per_hour}/hr</strong></span>
                </div>
              )}

              <button type="submit" className="w-full mt-3 py-2.5 bg-brand-700 text-white font-bold rounded-lg hover:bg-brand-800">Add to Rental Inventory</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default OwnerDashboardPage;
