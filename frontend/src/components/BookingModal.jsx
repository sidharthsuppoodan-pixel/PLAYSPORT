import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  Check, 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  CreditCard, 
  ShieldCheck, 
  Printer,
  ChevronRight
} from 'lucide-react';

const BookingModal = ({ booking, isOpen, onClose }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      // Trigger festive celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#16a34a', '#22c55e', '#4ade80', '#059669', '#10b981']
        });
      } catch (e) {
        // Fallback gracefully
      }
    }
  }, [isOpen]);

  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleNavigateToBookings = () => {
    onClose();
    navigate('/my-bookings');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden relative fade-in">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Body Matching Stitch UI Screenshot 3 */}
        <div className="p-6 sm:p-8 text-center">
          
          {/* Green Checkmark Circle Icon */}
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 shadow-sm border border-emerald-200">
            <Check className="w-7 h-7 stroke-[3]" />
          </div>

          <h3 className="text-xl font-extrabold text-slate-900 flex items-center justify-center gap-1.5">
            Booking Confirmed!
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Your turf has been successfully reserved.
          </p>

          {/* Details Slip Card Matching Exact Stitch Design */}
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-semibold text-slate-600">Booking ID</span>
              <span className="text-xs font-bold text-brand-600 tracking-wide">
                {booking.booking_reference || 'STC-78429'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 py-3 border-b border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Turf
                </span>
                <p className="font-bold text-slate-800 truncate">
                  {booking.ground_name || booking.turf_name || 'PlayZone Arena'}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Date
                </span>
                <p className="font-bold text-slate-800">
                  {booking.booking_date || 'Today'}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Time
                </span>
                <p className="font-bold text-slate-800">
                  {booking.start_time} - {booking.end_time}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Amount
                </span>
                <p className="font-bold text-slate-800">
                  ₹{booking.final_amount || booking.total_amount || 1200}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 text-xs">
              <span className="text-slate-600">Payment Status</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Paid (Verified)
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={handleNavigateToBookings}
              className="flex-1 py-2.5 px-4 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-lg shadow-sm shadow-brand-700/20 transition flex items-center justify-center gap-1.5"
            >
              View My Bookings
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handlePrint}
              className="py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              Print Slip
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BookingModal;
