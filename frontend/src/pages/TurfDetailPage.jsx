import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { turfsAPI, slotsAPI, reviewsAPI, bookingsAPI, equipmentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BookingModal from '../components/BookingModal';
import { 
  Star, 
  MapPin, 
  Car, 
  Users, 
  Droplet, 
  Lightbulb, 
  Armchair, 
  PlusCircle, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Dumbbell
} from 'lucide-react';

const TurfDetailPage = ({ onOpenAuth }) => {
  const { idOrSlug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [turf, setTurf] = useState(null);
  const [dateGroups, setDateGroups] = useState([]);
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedSlotIds, setSelectedSlotIds] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch Turf details & slots
  useEffect(() => {
    const fetchTurfData = async () => {
      setLoading(true);
      try {
        const slugParam = idOrSlug || 'playzone-arena';
        const res = await turfsAPI.getByIdOrSlug(slugParam);
        setTurf(res.data);

        // Fetch slots for first ground
        if (res.data.grounds && res.data.grounds.length > 0) {
          const groundId = res.data.grounds[0].id;
          const slotsRes = await slotsAPI.getByGround(groundId, 7);
          setDateGroups(slotsRes.data);
        }

        // Fetch reviews & rental equipment
        const [revRes, eqRes] = await Promise.all([
          reviewsAPI.getByTurf(res.data.id).catch(() => ({ data: [] })),
          equipmentAPI.getAll(res.data.id).catch(() => ({ data: [] }))
        ]);
        setReviews(revRes.data || []);
        setEquipmentList(eqRes.data || []);
      } catch (err) {
        console.error("Error loading turf details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTurfData();
  }, [idOrSlug]);

  const activeDateGroup = dateGroups[selectedDateIdx] || null;

  const toggleSlotSelection = (slot) => {
    if (slot.status === 'BOOKED' || slot.status === 'BLOCKED') return;

    if (selectedSlotIds.includes(slot.id)) {
      setSelectedSlotIds(selectedSlotIds.filter(id => id !== slot.id));
    } else {
      setSelectedSlotIds([...selectedSlotIds, slot.id]);
    }
  };

  const calculateTotalPrice = () => {
    if (!activeDateGroup) return 0;
    const selectedSlots = activeDateGroup.slots.filter(s => selectedSlotIds.includes(s.id));
    return selectedSlots.reduce((sum, s) => sum + s.price, 0);
  };

  const handleProceedBooking = async () => {
    if (!isAuthenticated) {
      onOpenAuth('login');
      return;
    }

    if (selectedSlotIds.length === 0) {
      setErrorMessage("Please select at least one time slot to book.");
      return;
    }

    setBookingLoading(true);
    setErrorMessage('');

    try {
      const groundId = turf.grounds[0].id;
      const payload = {
        turf_id: turf.id,
        ground_id: groundId,
        booking_date: activeDateGroup.date,
        slot_ids: selectedSlotIds,
        payment_method: 'UPI',
        customer_notes: 'Booked via PLAYSPORT web portal'
      };

      const res = await bookingsAPI.create(payload);
      setConfirmedBooking(res.data);
      setShowConfirmModal(true);
      
      // Update slots status locally
      if (activeDateGroup) {
        activeDateGroup.slots.forEach(s => {
          if (selectedSlotIds.includes(s.id)) {
            s.status = 'BOOKED';
          }
        });
      }
      setSelectedSlotIds([]);
    } catch (err) {
      console.error("Booking failed", err);
      setErrorMessage(err.response?.data?.detail || "Booking failed. Slot may have been taken.");
    } finally {
      setBookingLoading(false);
    }
  };

  const getFacilityIcon = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('park')) return <Car className="w-5 h-5 text-emerald-700" />;
    if (lower.includes('room') || lower.includes('locker')) return <Users className="w-5 h-5 text-emerald-700" />;
    if (lower.includes('water')) return <Droplet className="w-5 h-5 text-emerald-700" />;
    if (lower.includes('light')) return <Lightbulb className="w-5 h-5 text-emerald-700" />;
    if (lower.includes('seat')) return <Armchair className="w-5 h-5 text-emerald-700" />;
    return <PlusCircle className="w-5 h-5 text-emerald-700" />;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand-600 border-t-transparent"></div>
        <p className="text-xs text-slate-500 mt-2">Loading facility details...</p>
      </div>
    );
  }

  if (!turf) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-lg font-bold text-slate-800">Turf not found</h2>
        <button onClick={() => navigate('/turfs')} className="mt-4 px-4 py-2 bg-brand-700 text-white text-xs rounded-lg">
          Browse All Turfs
        </button>
      </div>
    );
  }

  const selectedCount = selectedSlotIds.length;
  const totalPrice = calculateTotalPrice();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      
      {/* Title & Badges Header Matching Stitch Screenshot 1 */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {turf.name}
        </h1>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
          <span>{turf.address}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
              ))}
            </div>
            <span className="text-slate-700 ml-1">({turf.review_count} Reviews)</span>
          </div>

          <div className="h-3 w-px bg-slate-300 mx-1 hidden sm:block" />

          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 flex items-center gap-1">
            ⚽ 5v5 Football
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 flex items-center gap-1">
            🏏 Cricket
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 flex items-center gap-1">
            🥅 {turf.dimension_text || '6000 sq ft'}
          </span>
        </div>
      </div>

      {/* Main Turf Cover Image Banner */}
      <div className="w-full rounded-3xl overflow-hidden shadow-md border border-slate-200 bg-slate-100 h-64 sm:h-80 md:h-[420px] relative">
        <img
          src={turf.images?.[0] || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80'}
          alt={turf.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Main Content Grid: Left Details & Right Sticky Booking Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: About, Facilities, Reviews */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* About Section */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">About the Turf</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {turf.description || 'PlayZone Arena is Kochi\'s premier sporting destination, offering state-of-the-art FIFA approved artificial turf. Ideal for 5-a-side football and box cricket. The facility is equipped with high-intensity LED floodlights ensuring excellent visibility for evening and night matches. We provide a clean, safe, and highly professional environment for both casual games and competitive tournaments.'}
            </p>
          </div>

          {/* Facilities Grid */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Facilities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(turf.facilities || [
                "Free Parking", "Changing Rooms", "Drinking Water",
                "LED Floodlights", "Spectator Seating", "First Aid Kit"
              ]).map((fac, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3 hover:border-slate-300 transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    {getFacilityIcon(fac)}
                  </div>
                  <span className="text-xs font-bold text-slate-800">{fac}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Available Rental Equipment Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-brand-600" />
                Available Rental Equipment at this Turf
              </h2>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {equipmentList.length} Items Available
              </span>
            </div>

            {equipmentList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {equipmentList.map((eq) => (
                  <div key={eq.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-lg shrink-0">
                        {eq.category === 'Balls' ? '⚽' :
                         eq.category === 'Bats' ? '🏏' :
                         eq.category === 'Rackets' ? '🏸' : '🦺'}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{eq.name}</h4>
                        <span className="text-[11px] text-slate-500">In Stock: {eq.available_quantity} units</span>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                      ₹{eq.price_per_hour}/hr
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                No rental equipment listed for this turf.
              </div>
            )}
          </div>

          {/* Customer Reviews Matching Stitch Screenshot 1 */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Customer Reviews</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 text-xs font-extrabold flex items-center justify-center border border-emerald-200">
                          {rev.user_initials || 'AJ'}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{rev.user_name}</h4>
                          <span className="text-[10px] text-slate-400">{rev.formatted_date}</span>
                        </div>
                      </div>
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed pt-1">
                      {rev.comment}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Sticky Sidebar: Slot Booking Wizard Matching Stitch Screenshot 1 */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            
            {/* Price Header */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                PRICE STARTING FROM
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-brand-700">₹{turf.starting_price}</span>
                <span className="text-slate-500 text-xs">/ hr</span>
              </div>
            </div>

            {/* Select Date Horizontal Carousel Matching Stitch */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2.5">
                Select Date
              </label>
              <div className="grid grid-cols-4 gap-2">
                {dateGroups.slice(0, 4).map((dg, idx) => {
                  const isSelected = idx === selectedDateIdx;
                  return (
                    <button
                      key={dg.date}
                      onClick={() => {
                        setSelectedDateIdx(idx);
                        setSelectedSlotIds([]);
                      }}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className={`text-[10px] font-bold uppercase ${
                        isSelected ? 'text-brand-700 font-extrabold' : 'text-slate-600'
                      }`}>
                        {dg.day_name}
                      </span>
                      <span className="text-base font-extrabold text-slate-900 my-0.5">
                        {dg.display_date.split(' ')[0]}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {dg.display_date.split(' ')[1]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slot Legend Matching Stitch */}
            <div className="flex items-center justify-start gap-4 text-[11px] text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border border-slate-300 bg-white inline-block" />
                Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block" />
                Booked
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-600 inline-block" />
                Selected
              </span>
            </div>

            {/* Select Slots 3-Column Grid Matching Stitch */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2.5">
                Select Slots
              </label>
              
              {activeDateGroup && activeDateGroup.slots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {activeDateGroup.slots.map((slot) => {
                    const isBooked = slot.status === 'BOOKED' || slot.status === 'BLOCKED';
                    const isSelected = selectedSlotIds.includes(slot.id);

                    return (
                      <button
                        key={slot.id}
                        disabled={isBooked}
                        onClick={() => toggleSlotSelection(slot)}
                        className={`py-2 px-1 text-xs rounded-lg font-medium transition text-center border ${
                          isBooked
                            ? 'bg-slate-100/90 text-slate-400 border-slate-200 cursor-not-allowed'
                            : isSelected
                            ? 'border-brand-600 bg-brand-50 text-brand-800 font-bold shadow-2xs ring-1 ring-brand-600'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {slot.start_time}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-4 text-center">No upcoming available slots for this date.</div>
              )}
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Summary Price & Action Button Matching Stitch Screenshot 1 */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600">Selected Slots ({selectedCount})</span>
                <span className="text-slate-900 text-sm font-extrabold">₹{totalPrice}</span>
              </div>

              <button
                onClick={handleProceedBooking}
                disabled={bookingLoading}
                className="w-full py-3 px-4 bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm shadow-brand-700/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {bookingLoading ? 'Reserving...' : 'Proceed to Booking →'}
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Booking Confirmation Receipt Modal */}
      <BookingModal
        isOpen={showConfirmModal}
        booking={confirmedBooking}
        onClose={() => setShowConfirmModal(false)}
      />

    </div>
  );
};

export default TurfDetailPage;
