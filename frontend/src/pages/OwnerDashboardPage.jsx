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
  Tag,
  Trash2
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

  const [showManageSlotsModal, setShowManageSlotsModal] = useState(false);
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  const [confirmDeleteMatch, setConfirmDeleteMatch] = useState(null);
  const [deletingMatchId, setDeletingMatchId] = useState(null);
  const [showCreateTournamentModal, setShowCreateTournamentModal] = useState(false);
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [showEditTurfModal, setShowEditTurfModal] = useState(false);
  const [showCreateTurfModal, setShowCreateTurfModal] = useState(false);
  const [newTurfData, setNewTurfData] = useState({
    name: '',
    city: 'Kochi',
    address: '',
    starting_price: 1200,
    sports_supported: 'Football (5v5), Box Cricket',
    image_url: '',
    description: ''
  });
  const [editingTurf, setEditingTurf] = useState({
    id: '',
    name: '',
    city: 'Ernakulam',
    address: '',
    starting_price: 1200,
    sports_supported: 'Football (5v5), Box Cricket',
    image_url: '',
    description: ''
  });

  const [slotGenData, setSlotGenData] = useState({
    turf_id: '',
    ground_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    start_time_hour: 6,
    end_time_hour: 23,
    hourly_price: 1200
  });

  const [newMatch, setNewMatch] = useState({
    turf_id: '',
    ground_id: '',
    title: '5v5 Football Open Match',
    sport_type: 'Football',
    match_format: '5v5',
    skill_level: 'Casual / Intermediate',
    match_date: new Date().toISOString().split('T')[0],
    start_time: '18:00',
    end_time: '19:00',
    max_players: 10,
    price_per_player: 150,
    rules: 'Friendly match. Bibs & ball provided.',
    description: 'Casual open game for sports enthusiasts.'
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
        turfsAPI.getMyTurfs().catch(() => ({ data: [] })),
        openMatchesAPI.getAll().catch(() => ({ data: [] })),
        tournamentsAPI.getAll().catch(() => ({ data: [] })),
        equipmentAPI.getAll().catch(() => ({ data: [] }))
      ]);

      const myTurfsList = turfsRes.data || [];
      const myTurfIds = new Set(myTurfsList.map(t => t.id));

      const filteredMatches = (matchesRes.data || []).filter(m => myTurfIds.has(m.turf_id));
      const filteredTournaments = (tournRes.data || []).filter(t => myTurfIds.has(t.turf_id));
      const filteredEquipment = (eqRes.data || []).filter(e => myTurfIds.has(e.turf_id));

      setMetrics(metRes.data);
      setRecentBookings(bookRes.data || []);
      setFacilityStatuses(facRes.data || []);
      setMyTurfs(myTurfsList);
      setOpenMatchesList(filteredMatches);
      setTournamentsList(filteredTournaments);
      setEquipmentList(filteredEquipment);

      if (myTurfsList.length > 0) {
        const firstTurf = myTurfsList[0];
        setSlotGenData(prev => ({
          ...prev,
          turf_id: firstTurf.id,
          hourly_price: firstTurf.starting_price || 1200
        }));
        setNewMatch(prev => ({ ...prev, turf_id: firstTurf.id }));
        setNewTournament(prev => ({ ...prev, turf_id: firstTurf.id }));
        setNewEquipment(prev => ({ ...prev, turf_id: firstTurf.id }));
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

  const handleGenerateSlotsSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      const selectedTurfId = Number(slotGenData.turf_id) || (myTurfs[0]?.id || 1);
      const payload = {
        turf_id: selectedTurfId,
        start_date: slotGenData.start_date,
        end_date: slotGenData.end_date,
        start_time_hour: Number(slotGenData.start_time_hour) || 6,
        end_time_hour: Number(slotGenData.end_time_hour) || 23,
        hourly_price: Number(slotGenData.hourly_price) || 1200
      };
      await slotsAPI.batchGenerate(payload);
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
    setModalSuccess('');
    try {
      const selectedTurfId = Number(newMatch.turf_id) || (myTurfs[0]?.id || 1);
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
        rules: newMatch.rules || 'Friendly match. Bibs & balls provided.',
        description: newMatch.description || 'Casual open match for sports lovers.'
      };

      await openMatchesAPI.create(payload);
      setModalSuccess("Open Match created & slot reserved successfully!");
      fetchDashboard();
      setTimeout(() => {
        setModalSuccess('');
        setShowCreateMatchModal(false);
      }, 1400);
    } catch (err) {
      console.error("Create match submit error:", err);
      setModalError(err.response?.data?.detail || "Failed to create match.");
    }
  };

  const handleConfirmDeleteMatch = async () => {
    if (!confirmDeleteMatch) return;
    const matchId = confirmDeleteMatch.id;
    setDeletingMatchId(matchId);
    setModalError('');
    setModalSuccess('');
    try {
      await openMatchesAPI.delete(matchId);
      setModalSuccess("Open match deleted successfully and slot released!");
      fetchDashboard();
      setTimeout(() => setModalSuccess(''), 3000);
    } catch (err) {
      console.error("Delete match error", err);
      setModalError(err.response?.data?.detail || "Could not delete open match.");
      setTimeout(() => setModalError(''), 3000);
    } finally {
      setDeletingMatchId(null);
      setConfirmDeleteMatch(null);
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

  const handleSaveTurfDetails = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      const payload = {
        name: editingTurf.name,
        city: editingTurf.city,
        address: editingTurf.address,
        starting_price: Number(editingTurf.starting_price) || 1200,
        sports_supported: editingTurf.sports_supported,
        description: editingTurf.description,
        facilities: ["Free Parking", "Changing Rooms", "LED Floodlights", "Drinking Water"],
        images: editingTurf.image_url ? [editingTurf.image_url] : ["https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80"]
      };
      await turfsAPI.update(editingTurf.id, payload);
      setModalSuccess("Turf photo and details updated successfully!");
      fetchDashboard();
      setTimeout(() => {
        setModalSuccess('');
        setShowEditTurfModal(false);
      }, 1200);
    } catch (err) {
      setModalError(err.response?.data?.detail || "Failed to update turf details.");
    }
  };

  const handleCreateTurfSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');
    try {
      const payload = {
        name: newTurfData.name,
        description: newTurfData.description || `Premier sports turf arena located in ${newTurfData.city}.`,
        address: newTurfData.address,
        city: newTurfData.city,
        state: "Kerala",
        pincode: "682001",
        starting_price: Number(newTurfData.starting_price) || 1200,
        dimension_text: "6000 sq ft",
        sports_supported: newTurfData.sports_supported || "Football (5v5), Box Cricket",
        opening_time: "06:00 AM",
        closing_time: "11:00 PM",
        facilities: ["Free Parking", "Changing Rooms", "LED Floodlights", "Drinking Water"],
        images: newTurfData.image_url ? [newTurfData.image_url] : ["https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80"]
      };
      await turfsAPI.create(payload);
      setModalSuccess("New turf registered & published successfully!");
      fetchDashboard();
      setTimeout(() => {
        setModalSuccess('');
        setShowCreateTurfModal(false);
        setNewTurfData({
          name: '',
          city: 'Kochi',
          address: '',
          starting_price: 1200,
          sports_supported: 'Football (5v5), Box Cricket',
          image_url: '',
          description: ''
        });
      }, 1400);
    } catch (err) {
      console.error("Create turf error:", err);
      setModalError(err.response?.data?.detail || "Failed to create turf.");
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
              My Turfs
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
              <p className="text-[10px] text-brand-700 font-bold truncate">🏢 {myTurfs.map(t => t.name).join(', ') || user?.business_name || 'Sports Arena'}</p>
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
              {activeTab === 'turfs' && 'Turf Management'}
              {activeTab === 'slots' && 'Slot Manager'}
              {activeTab === 'bookings' && 'Customer Bookings'}
              {activeTab === 'matches' && 'Open Match Host'}
              {activeTab === 'tournaments' && 'Tournament Manager'}
              {activeTab === 'equipment' && 'Equipment Rental Inventory'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Welcome back, <strong>{user?.full_name}</strong>. Managing Turf: <span className="text-brand-700 font-bold">{myTurfs.map(t => t.name).join(', ') || user?.business_name || 'My Turf'}</span>
            </p>
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

        {/* ─── TAB 2: MY TURFS ────────────────────────────────────────── */}
        {activeTab === 'turfs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Your Listed Turfs ({myTurfs.length})</h2>
                <p className="text-xs text-slate-500">Manage your existing sports venues or register a new turf pitch.</p>
              </div>
              <button
                onClick={() => setShowCreateTurfModal(true)}
                className="py-2.5 px-4 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-sm shadow-brand-700/20 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Register New Turf
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myTurfs.map((turf) => (
                <div key={turf.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="h-40 bg-slate-100 relative">
                    <img src={turf.images?.[0] || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80'} alt={turf.name} className="w-full h-full object-cover" />
                    <span className="absolute top-3 right-3 bg-white/90 px-2 py-0.5 rounded text-xs font-bold text-slate-800">
                      ₹{turf.starting_price}/hr
                    </span>
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-slate-900 text-base">{turf.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">📍 {turf.address || turf.city}</p>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                      <button
                        onClick={() => {
                          setEditingTurf({
                            id: turf.id,
                            name: turf.name,
                            city: turf.city || 'Kochi',
                            address: turf.address || '',
                            starting_price: turf.starting_price || 1200,
                            sports_supported: turf.sports_supported || 'Football (5v5), Box Cricket',
                            image_url: turf.images?.[0] || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
                            description: turf.description || ''
                          });
                          setShowEditTurfModal(true);
                        }}
                        className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition flex items-center gap-1"
                      >
                        ✏️ Edit Photo & Details
                      </button>
                      <button onClick={() => { setSlotGenData(s => ({ ...s, turf_id: turf.id })); setShowManageSlotsModal(true); }} className="text-brand-700 font-bold hover:underline text-xs">
                        + Manage Slots
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {openMatchesList.map((m) => {
                const isCricket = m.sport_type?.toLowerCase().includes('cricket');
                return (
                  <div key={m.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <h3 className="font-bold text-slate-900 text-sm">{m.title}</h3>
                          <p className="text-[11px] font-semibold text-brand-700">📍 {m.turf_name || 'My Turf'} ({m.turf_city || 'Kerala'})</p>
                        </div>
                        {isCricket ? (
                          <div className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 shrink-0">
                            <img src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=120&q=80" alt="Cricket" className="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
                            <span>Cricket</span>
                          </div>
                        ) : (
                          <div className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 shrink-0">
                            <img src="https://images.unsplash.com/photo-1614632537190-23e4146777db?auto=format&fit=crop&w=120&q=80" alt="Football" className="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
                            <span>Football</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="font-semibold">📅 {m.match_date}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">⏰ {m.start_time} - {m.end_time}</span>
                      </div>

                      {/* Registered Player Names List */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-brand-600" />
                            Registered Players ({m.participants?.length || 0} / {m.max_players}):
                          </span>
                          <span className="font-extrabold text-emerald-600">₹{m.price_per_player}/player</span>
                        </div>

                        {m.participants && m.participants.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {m.participants.map((p, idx) => (
                              <div
                                key={p.id || idx}
                                className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
                              >
                                <div className="w-7 h-7 rounded-full bg-brand-700 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                  {p.full_name?.charAt(0) || 'P'}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-slate-900 truncate text-xs flex items-center gap-1">
                                    <span className="truncate">{p.full_name}</span>
                                    {p.user_id === m.creator_id && (
                                      <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-bold shrink-0">Host</span>
                                    )}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    Slot: <span className="text-slate-600 font-semibold">{p.team_slot || 'Team A'}</span>
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic py-1 text-center bg-slate-50 rounded-lg">No players registered yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">{m.slots_left} open spots remaining</span>
                      <button
                        onClick={() => setConfirmDeleteMatch(m)}
                        className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold rounded-lg border border-rose-200 transition flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Open Match
                      </button>
                    </div>
                  </div>
                );
              })}
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



      {/* ─── MODAL 3: BATCH GENERATE SLOTS ───────────────────────────────────── */}
      {showManageSlotsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 w-full max-w-md relative fade-in">
            <button onClick={() => setShowManageSlotsModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-bold text-slate-900 mb-1">Batch Generate Slots</h3>
            <p className="text-xs text-slate-500 mb-4">Publish available booking slots across selected dates.</p>
            {modalSuccess && <div className="p-3 mb-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold">{modalSuccess}</div>}
            {modalError && <div className="p-3 mb-3 rounded-lg bg-rose-50 text-rose-800 text-xs font-bold">{modalError}</div>}
            <form onSubmit={handleGenerateSlotsSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Turf</label>
                <select
                  value={slotGenData.turf_id}
                  onChange={(e) => {
                    const tId = Number(e.target.value);
                    const selTurf = myTurfs.find(t => t.id === tId);
                    setSlotGenData(prev => ({
                      ...prev,
                      turf_id: tId,
                      hourly_price: selTurf?.starting_price || 1200
                    }));
                  }}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-medium text-slate-800"
                >
                  {myTurfs.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.city})
                    </option>
                  ))}
                  {myTurfs.length === 0 && <option value="">No Turfs Available</option>}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={slotGenData.start_date}
                    onChange={(e) => setSlotGenData({ ...slotGenData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    min={slotGenData.start_date || new Date().toISOString().split('T')[0]}
                    value={slotGenData.end_date}
                    onChange={(e) => setSlotGenData({ ...slotGenData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Opening Hour</label>
                  <select
                    value={slotGenData.start_time_hour}
                    onChange={(e) => setSlotGenData({ ...slotGenData, start_time_hour: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-medium"
                  >
                    {[...Array(24)].map((_, h) => {
                      const isToday = slotGenData.start_date === new Date().toISOString().split('T')[0];
                      const curHr = new Date().getHours();
                      const isPast = isToday && h <= curHr;
                      return (
                        <option key={h} value={h} disabled={isPast}>
                          {h === 0 ? '12 AM (Midnight)' : h < 12 ? `${h} AM` : h === 12 ? '12 PM (Noon)' : `${h-12} PM`} {isPast ? '(Passed)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Closing Hour</label>
                  <select
                    value={slotGenData.end_time_hour}
                    onChange={(e) => setSlotGenData({ ...slotGenData, end_time_hour: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-medium"
                  >
                    {[...Array(25)].slice(1).map((_, idx) => {
                      const h = idx + 1;
                      const isToday = slotGenData.start_date === new Date().toISOString().split('T')[0];
                      const curHr = new Date().getHours();
                      const isPast = isToday && h <= curHr;
                      return (
                        <option key={h} value={h} disabled={isPast}>
                          {h === 24 ? '12 AM (End of day)' : h < 12 ? `${h} AM` : h === 12 ? '12 PM (Noon)' : `${h-12} PM`} {isPast ? '(Passed)' : ''}
                        </option>
                      );
                    })}
                  </select>
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
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 w-full max-w-md relative fade-in max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowCreateMatchModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-bold text-slate-900 mb-1">Create Open Pick-up Match</h3>
            <p className="text-xs text-slate-500 mb-4">Host a match for individual players. Creating reserves the time slot.</p>
            
            {modalSuccess && <div className="p-3 mb-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold">{modalSuccess}</div>}
            {modalError && <div className="p-3 mb-3 rounded-lg bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200">{modalError}</div>}
            
            <form onSubmit={handleCreateMatchSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Turf</label>
                <select
                  value={newMatch.turf_id || (myTurfs[0]?.id || '')}
                  onChange={(e) => {
                    const tId = Number(e.target.value);
                    setNewMatch(prev => ({ ...prev, turf_id: tId }));
                  }}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-medium text-slate-800"
                >
                  {myTurfs.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.city})
                    </option>
                  ))}
                  {myTurfs.length === 0 && <option value="">No Turfs Owned</option>}
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
                  placeholder="e.g. 5v5 Evening Football Match"
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
                    required
                    min="2"
                    max="50"
                    value={newMatch.max_players}
                    onChange={(e) => setNewMatch({ ...newMatch, max_players: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price / Player (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
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

              <button type="submit" className="w-full mt-3 py-2.5 bg-teal-700 text-white font-bold rounded-lg hover:bg-teal-800">
                Publish Open Match & Reserve Slot
              </button>
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
                <label className="block font-semibold text-slate-700 mb-1">Select Turf</label>
                <select
                  value={newTournament.turf_id}
                  onChange={(e) => setNewTournament(prev => ({ ...prev, turf_id: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-medium text-slate-800"
                >
                  {myTurfs.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.city})
                    </option>
                  ))}
                  {myTurfs.length === 0 && <option value="">No Turfs Owned</option>}
                </select>
              </div>

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
                <label className="block font-semibold text-slate-700 mb-1">Select Turf</label>
                <select
                  value={newEquipment.turf_id}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, turf_id: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-medium text-slate-800"
                >
                  {myTurfs.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.city})
                    </option>
                  ))}
                  {myTurfs.length === 0 && <option value="">No Turfs Owned</option>}
                </select>
              </div>


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

      {/* ─── MODAL 7: EDIT TURF DETAILS & PHOTO ────────────────────────────── */}
      {showEditTurfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 w-full max-w-md relative fade-in max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowEditTurfModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-bold text-slate-900 mb-1">Edit Turf Details & Photo</h3>
            <p className="text-xs text-slate-500 mb-4">Update your turf name, location, and upload facility photo for customer bookings.</p>
            {modalSuccess && <div className="p-3 mb-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold">{modalSuccess}</div>}
            {modalError && <div className="p-3 mb-3 rounded-lg bg-rose-50 text-rose-800 text-xs font-bold">{modalError}</div>}
            
            <form onSubmit={handleSaveTurfDetails} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Turf Name</label>
                <input
                  type="text"
                  required
                  value={editingTurf.name}
                  onChange={(e) => setEditingTurf({ ...editingTurf, name: e.target.value })}
                  placeholder="e.g. Azteca Sports Arena"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City / District</label>
                  <select
                    value={editingTurf.city}
                    onChange={(e) => setEditingTurf({ ...editingTurf, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-medium text-slate-800"
                  >
                    <option value="Ernakulam">Ernakulam</option>
                    <option value="Kochi">Kochi</option>
                    <option value="Thiruvananthapuram">Thiruvananthapuram</option>
                    <option value="Kozhikode">Kozhikode</option>
                    <option value="Malappuram">Malappuram</option>
                    <option value="Thrissur">Thrissur</option>
                    <option value="Kannur">Kannur</option>
                    <option value="Kottayam">Kottayam</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Starting Price (₹/hr)</label>
                  <input
                    type="number"
                    required
                    value={editingTurf.starting_price}
                    onChange={(e) => setEditingTurf({ ...editingTurf, starting_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Address / Landmark</label>
                <input
                  type="text"
                  value={editingTurf.address}
                  onChange={(e) => setEditingTurf({ ...editingTurf, address: e.target.value })}
                  placeholder="e.g. Kaloor Stadium Road, Ernakulam"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Turf Photo URL</label>
                <input
                  type="url"
                  required
                  value={editingTurf.image_url}
                  onChange={(e) => setEditingTurf({ ...editingTurf, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 border rounded-lg font-mono text-[11px]"
                />
                
                {/* Photo Preview & Presets */}
                <div className="mt-2 space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-600">Quick Photo Presets:</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { lbl: 'Floodlight Pitch', url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80' },
                      { lbl: 'FIFA Astro Turf', url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80' },
                      { lbl: 'Box Cricket Pitch', url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80' },
                      { lbl: 'Night Stadium', url: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=800&q=80' }
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditingTurf({ ...editingTurf, image_url: p.url })}
                        className={`h-12 rounded-lg border overflow-hidden relative transition ${editingTurf.image_url === p.url ? 'ring-2 ring-brand-500 border-brand-500' : 'border-slate-200 opacity-70 hover:opacity-100'}`}
                      >
                        <img src={p.url} alt={p.lbl} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {editingTurf.image_url && (
                  <div className="mt-2">
                    <p className="text-[11px] font-semibold text-slate-600 mb-1">Live Photo Preview:</p>
                    <div className="h-28 rounded-xl border border-slate-200 overflow-hidden relative">
                      <img src={editingTurf.image_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={editingTurf.description}
                  onChange={(e) => setEditingTurf({ ...editingTurf, description: e.target.value })}
                  placeholder="Describe your sports facility features..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <button type="submit" className="w-full mt-3 py-2.5 bg-brand-700 text-white font-bold rounded-lg hover:bg-brand-800">
                Save Turf Photo & Details
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 8: DELETE OPEN MATCH CONFIRMATION ──────────────────────────── */}
      {confirmDeleteMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 w-full max-w-md relative fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-500" /> Delete Open Match
              </h3>
              <button onClick={() => setConfirmDeleteMatch(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50 p-4 rounded-xl border border-rose-200/80 text-xs space-y-1">
              <p className="font-bold text-rose-900">Are you sure you want to delete this open match?</p>
              <p className="text-rose-700">
                Match: <strong className="font-bold">{confirmDeleteMatch.title}</strong> ({confirmDeleteMatch.match_date} at {confirmDeleteMatch.start_time})
              </p>
              <p className="text-rose-600 text-[11px] pt-1">
                This will cancel the match, remove all player registrations, and release the time slot back to available for customer booking.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setConfirmDeleteMatch(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteMatch}
                disabled={deletingMatchId === confirmDeleteMatch.id}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {deletingMatchId === confirmDeleteMatch.id ? 'Deleting...' : 'Yes, Delete Match'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 9: REGISTER NEW TURF ───────────────────────────────────────── */}
      {showCreateTurfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 w-full max-w-md relative fade-in max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateTurfModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">Register New Turf Venue</h3>
            <p className="text-xs text-slate-500 mb-4">Add a new sports turf facility to list for public booking.</p>

            {modalSuccess && (
              <div className="mb-3 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{modalSuccess}</span>
              </div>
            )}

            {modalError && (
              <div className="mb-3 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold flex items-center gap-2 border border-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTurfSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Turf / Facility Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Arena & Sports Turf"
                  value={newTurfData.name}
                  onChange={(e) => setNewTurfData({ ...newTurfData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City *</label>
                  <select
                    value={newTurfData.city}
                    onChange={(e) => setNewTurfData({ ...newTurfData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium"
                  >
                    <option value="Kochi">Kochi</option>
                    <option value="Ernakulam">Ernakulam</option>
                    <option value="Thiruvananthapuram">Thiruvananthapuram</option>
                    <option value="Kozhikode">Kozhikode</option>
                    <option value="Malappuram">Malappuram</option>
                    <option value="Thrissur">Thrissur</option>
                    <option value="Kannur">Kannur</option>
                    <option value="Kottayam">Kottayam</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Starting Price / Hr (₹) *</label>
                  <input
                    type="number"
                    required
                    min="100"
                    placeholder="1200"
                    value={newTurfData.starting_price}
                    onChange={(e) => setNewTurfData({ ...newTurfData, starting_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Near Stadium Junction, Palarivattom, Kochi"
                  value={newTurfData.address}
                  onChange={(e) => setNewTurfData({ ...newTurfData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sports Supported</label>
                <input
                  type="text"
                  placeholder="e.g. Football (5v5), Box Cricket, Badminton"
                  value={newTurfData.sports_supported}
                  onChange={(e) => setNewTurfData({ ...newTurfData, sports_supported: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Turf Cover Photo URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newTurfData.image_url}
                  onChange={(e) => setNewTurfData({ ...newTurfData, image_url: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium text-slate-700"
                />
                <p className="text-[10px] text-slate-400 mt-1">Leave empty to use default high quality sports turf photo.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Facility Description</label>
                <textarea
                  rows="2"
                  placeholder="Brief description of pitch quality, floodlights, parking, etc."
                  value={newTurfData.description}
                  onChange={(e) => setNewTurfData({ ...newTurfData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full mt-3 py-2.5 bg-brand-700 hover:bg-brand-800 text-white font-bold rounded-xl shadow-sm transition"
              >
                Publish & List Turf
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default OwnerDashboardPage;
