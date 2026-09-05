import React, { useState, useEffect } from 'react';
import { equipmentAPI, turfsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Plus, Minus, Check, PackageCheck, MapPin, Building } from 'lucide-react';

const EquipmentPage = ({ onOpenAuth }) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [turfs, setTurfs] = useState([]);
  const [selectedTurfId, setSelectedTurfId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({});
  const [rentSuccess, setRentSuccess] = useState(false);

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
    setRentSuccess(true);
    setCart({});
    setTimeout(() => setRentSuccess(false), 4000);
  };

  const selectedTurfObj = turfs.find(t => t.id === Number(selectedTurfId));
  const cartItemCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalCartPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = items.find(i => i.id === Number(id));
    return sum + (item ? item.price_per_hour * qty : 0);
  }, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header & Turf Selector Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-brand-600" />
            Sports Equipment Rental Inventory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Select a specific turf facility to browse and reserve gear for your next match.
          </p>
        </div>

        {/* Turf Selector Dropdown Menu */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 rounded-xl shadow-2xs">
            <Building className="w-4 h-4 text-brand-600 shrink-0" />
            <select
              value={selectedTurfId}
              onChange={(e) => handleTurfChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-4"
            >
              <option value="all">📍 All Sports Arenas ({turfs.length})</option>
              {turfs.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.city || 'Kochi'})
                </option>
              ))}
            </select>
          </div>

          {cartItemCount > 0 && (
            <button
              onClick={handleCheckout}
              className="py-2.5 px-4 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 shrink-0"
            >
              <PackageCheck className="w-4 h-4" />
              Rent {cartItemCount} Items (₹{totalCartPrice}/hr)
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

      {rentSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-brand-200 text-xs font-bold text-brand-800 flex items-center gap-2 fade-in">
          <Check className="w-4 h-4 text-brand-600" />
          <span>Equipment rental request confirmed! Gear will be ready at the turf reception desk.</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading equipment inventory...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((eq) => {
            const qtyInCart = cart[eq.id] || 0;
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
                      <span className="text-[11px] text-slate-400">Stock: {eq.available_quantity} available</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-2">{eq.name}</h3>
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
                      className="w-6 h-6 rounded bg-white text-slate-700 font-bold flex items-center justify-center hover:bg-slate-100 disabled:opacity-30"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{qtyInCart}</span>
                    <button
                      onClick={() => updateCart(eq.id, 1)}
                      disabled={qtyInCart >= eq.available_quantity}
                      className="w-6 h-6 rounded bg-brand-700 text-white font-bold flex items-center justify-center hover:bg-brand-800 disabled:opacity-30"
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
    </div>
  );
};

export default EquipmentPage;
