import React, { useState, useEffect } from 'react';
import { equipmentAPI, turfsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PaymentModal from '../components/PaymentModal';
import BookingModal from '../components/BookingModal';
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  Check, 
  PackageCheck, 
  MapPin, 
  Building, 
  Clock, 
  Calendar,
  AlertCircle 
} from 'lucide-react';

const EquipmentPage = ({ onOpenAuth }) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [turfs, setTurfs] = useState([]);
  const [selectedTurfId, setSelectedTurfId] = useState('all');
  const [rentalHours, setRentalHours] = useState(1);
  const [rentalDate, setRentalDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  
  // Checkout & Receipt Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [confirmedRental, setConfirmedRental] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [turfRes, eqRes] = await Promise.all([
          turfsAPI.getAll().catch(() => ({ data: [] })),
          equipmentAPI.getAll().catch(() => ({ data: [] }))
        ]);
        setTurfs(turfRes.data || []);
        setItems(eqRes.data || []);
      } catch (err) {
        console.error("Equipment & Turfs fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleTurfChange = async (turfIdVal) => {
    setSelectedTurfId(turfIdVal);
    setCart({});
    setErrorMsg('');
    setLoading(true);
    try {
      if (turfIdVal === 'all') {
        const res = await equipmentAPI.getAll();
        setItems(res.data || []);
      } else {
        const res = await equipmentAPI.getAll(Number(turfIdVal));
        setItems(res.data || []);
      }
    } catch (err) {
      console.error("Filter equipment error", err);
    } finally {
      setLoading(false);
    }
  };

  const updateCart = (id, delta) => {
    setErrorMsg('');
    setCart(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      onOpenAuth('login');
      return;
    }

    if (cartItemCount === 0) {
      setErrorMsg('Please select at least one piece of equipment to rent.');
      return;
    }

    // Determine target turf
    let targetTurf = null;
    if (selectedTurfId !== 'all') {
      targetTurf = turfs.find(t => t.id === Number(selectedTurfId));
    } else {
      // Find turf from first item in cart
      const firstCartItemId = Number(Object.keys(cart)[0]);
      const firstItem = items.find(i => i.id === firstCartItemId);
      if (firstItem) {
        targetTurf = turfs.find(t => t.id === firstItem.turf_id);
      }
    }

    if (!targetTurf && turfs.length > 0) {
      targetTurf = turfs[0];
    }

    if (!targetTurf) {
      setErrorMsg('Please select a specific sports arena first to reserve equipment.');
      return;
    }

    setErrorMsg('');
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (bookingData) => {
    setConfirmedRental(bookingData);
    setShowReceiptModal(true);

    // Update equipment stock locally
    if (bookingData.equipment_rentals && bookingData.equipment_rentals.length > 0) {
      setItems(prev => prev.map(eq => {
        const rented = bookingData.equipment_rentals.find(r => r.equipment_id === eq.id);
        if (rented) {
          return { ...eq, available_quantity: Math.max(0, eq.available_quantity - rented.quantity) };
        }
        return eq;
      }));
    }
    setCart({});
  };

  const selectedTurfObj = turfs.find(t => t.id === Number(selectedTurfId));
  const cartItemCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const hourlyCartPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = items.find(i => i.id === Number(id));
    return sum + (item ? item.price_per_hour * qty : 0);
  }, 0);
  const totalRentalPrice = hourlyCartPrice * rentalHours;

  // Active target turf for order details
  let activeTurfForOrder = selectedTurfObj;
  if (!activeTurfForOrder && Object.keys(cart).length > 0) {
    const firstItem = items.find(i => i.id === Number(Object.keys(cart)[0]));
    if (firstItem) {
      activeTurfForOrder = turfs.find(t => t.id === firstItem.turf_id);
    }
  }

  const orderEquipmentItems = Object.entries(cart).map(([eqId, qty]) => {
    const item = items.find(i => i.id === Number(eqId));
    return {
      id: Number(eqId),
      equipment_id: Number(eqId),
      name: item?.name || 'Equipment',
      quantity: qty,
      totalPrice: (item?.price_per_hour || 0) * qty * rentalHours
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header & Controls Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-brand-600" />
            Sports Equipment Rental Inventory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Reserve professional footballs, cricket bats, bibs, and rackets with instant Razorpay online payment.
          </p>
        </div>

        {/* Action Controls: Facility, Date, Hours & Cart Button */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Turf Selector Dropdown */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 rounded-xl shadow-2xs">
            <Building className="w-4 h-4 text-brand-600 shrink-0" />
            <select
              value={selectedTurfId}
              onChange={(e) => handleTurfChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-2"
            >
              <option value="all">📍 All Sports Arenas ({turfs.length})</option>
              {turfs.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.city || 'Kochi'})
                </option>
              ))}
            </select>
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 rounded-xl shadow-2xs">
            <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
            <input
              type="date"
              value={rentalDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setRentalDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Rental Duration Stepper */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 rounded-xl shadow-2xs">
            <Clock className="w-4 h-4 text-brand-600 shrink-0" />
            <span className="text-xs text-slate-500">Duration:</span>
            <select
              value={rentalHours}
              onChange={(e) => setRentalHours(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value={1}>1 Hour</option>
              <option value={2}>2 Hours</option>
              <option value={3}>3 Hours</option>
              <option value={4}>4 Hours</option>
              <option value={5}>5 Hours</option>
            </select>
          </div>

          {/* Checkout Action Button */}
          {cartItemCount > 0 && (
            <button
              onClick={handleCheckout}
              className="py-2.5 px-5 bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white text-xs font-bold rounded-xl shadow-sm shadow-brand-700/20 transition flex items-center justify-center gap-2 shrink-0 animate-pulse"
            >
              <PackageCheck className="w-4 h-4" />
              Pay & Rent {cartItemCount} Items (₹{totalRentalPrice}) →
            </button>
          )}
        </div>
      </div>

      {/* Selected Turf Detail Banner */}
      {selectedTurfObj && (
        <div className="bg-brand-50/60 border border-brand-100 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white font-black text-sm flex items-center justify-center">
              🏟️
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">{selectedTurfObj.name}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {selectedTurfObj.address || selectedTurfObj.city}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-brand-800 bg-white px-3 py-1 rounded-full border border-brand-200 shadow-2xs">
            {items.length} Rental Items Available
          </span>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading equipment inventory...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((eq) => {
            const qtyInCart = cart[eq.id] || 0;
            const isOutOfStock = eq.available_quantity <= 0;

            return (
              <div
                key={eq.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="aspect-[16/10] rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center text-4xl">
                    {eq.category === 'Balls' ? '⚽' :
                     eq.category === 'Bats' ? '🏏' :
                     eq.category === 'Rackets' ? '🏸' :
                     eq.category === 'Shuttlecocks' ? '🏸' : '🦺'}
                  </div>

                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                        {eq.category}
                      </span>
                      <span className={`text-[11px] ${isOutOfStock ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                        {isOutOfStock ? 'Out of Stock' : `Stock: ${eq.available_quantity} units`}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-2">{eq.name}</h3>
                    {eq.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{eq.description}</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-extrabold text-slate-900">₹{eq.price_per_hour}</span>
                    <span className="text-[11px] text-slate-400"> / hr</span>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                    <button
                      onClick={() => updateCart(eq.id, -1)}
                      disabled={qtyInCart === 0}
                      className="w-6 h-6 rounded bg-white text-slate-700 font-bold flex items-center justify-center hover:bg-slate-100 disabled:opacity-30 shadow-2xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{qtyInCart}</span>
                    <button
                      onClick={() => updateCart(eq.id, 1)}
                      disabled={isOutOfStock || qtyInCart >= eq.available_quantity}
                      className="w-6 h-6 rounded bg-brand-700 text-white font-bold flex items-center justify-center hover:bg-brand-800 disabled:opacity-30 shadow-2xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {items.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
              <ShoppingBag className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">No Rental Equipment Listed</h3>
              <p className="text-xs text-slate-500">This facility currently has no rental sports gear listed for online reservation.</p>
            </div>
          )}
        </div>
      )}

      {/* Razorpay & Multi-method Checkout Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        type="equipment"
        orderDetails={{
          turfId: activeTurfForOrder?.id || 1,
          turfName: activeTurfForOrder?.name || 'PLAYSPORT Sports Arena',
          groundName: 'Equipment Reception Desk',
          rentalDate: rentalDate,
          hours: rentalHours,
          totalAmount: totalRentalPrice,
          items: Object.entries(cart).map(([eqId, qty]) => ({
            equipment_id: Number(eqId),
            quantity: Number(qty)
          })),
          equipmentItems: orderEquipmentItems
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Rental Confirmation Slip Modal */}
      <BookingModal
        isOpen={showReceiptModal}
        booking={confirmedRental}
        onClose={() => setShowReceiptModal(false)}
      />

    </div>
  );
};

export default EquipmentPage;
