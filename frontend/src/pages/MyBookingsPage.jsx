import React, { useState, useEffect } from 'react';
import { bookingsAPI, reviewsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  CalendarCheck, 
  Clock, 
  MapPin, 
  Printer, 
  Star, 
  X, 
  AlertCircle, 
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

const MyBookingsPage = ({ onOpenAuth }) => {
  const { isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('Schedule change');

  const fetchBookings = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await bookingsAPI.getMyBookings();
      setBookings(res.data);
    } catch (err) {
      console.error("Fetch my bookings error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      onOpenAuth('login');
    } else {
      fetchBookings();
    }
  }, [isAuthenticated]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await reviewsAPI.submit({
        turf_id: selectedBookingForReview.turf_id,
        booking_id: selectedBookingForReview.id,
        rating: reviewRating,
        comment: reviewComment
      });
      setReviewSuccess("Review submitted successfully! Thank you for your feedback.");
      setSelectedBookingForReview(null);
      setReviewComment('');
      setTimeout(() => setReviewSuccess(''), 4000);
    } catch (err) {
      console.error("Review submit failed", err);
    }
  };

  const handleCancelBooking = async () => {
    try {
      await bookingsAPI.cancel(cancelModalBooking.id, cancelReason);
      setCancelModalBooking(null);
      fetchBookings();
    } catch (err) {
      console.error("Cancel booking error", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <CalendarCheck className="w-7 h-7 text-brand-600" />
          My Reservations & History
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your upcoming turf sessions, download printable receipts, or leave verified facility reviews.
        </p>
      </div>

      {reviewSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-brand-200 text-xs font-bold text-brand-800 flex items-center gap-2 fade-in">
          <CheckCircle2 className="w-4 h-4 text-brand-600" />
          <span>{reviewSuccess}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading your reservations...</div>
      ) : bookings.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No turf reservations yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Ready to hit the pitch? Browse available turf slots and book your preferred match timing.
          </p>
          <button
            onClick={() => window.location.href = '/turfs'}
            className="mt-2 py-2 px-5 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold rounded-lg shadow-sm transition"
          >
            Explore Turfs
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookings.map((bk) => (
            <div
              key={bk.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-brand-700">
                      {bk.booking_reference}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      bk.status === 'CONFIRMED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : bk.status === 'CANCELLED'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {bk.status}
                    </span>
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium flex items-center gap-1 transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Receipt</span>
                  </button>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{bk.turf_name}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{bk.ground_name}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Date</span>
                    <span className="font-bold text-slate-800">{bk.booking_date}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Time Slot</span>
                    <span className="font-bold text-slate-800">{bk.start_time} - {bk.end_time}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-600">Total Paid:</span>
                  <span className="text-sm font-extrabold text-slate-900">₹{bk.final_amount}</span>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center gap-2">
                {bk.status === 'CONFIRMED' && (
                  <>
                    <button
                      onClick={() => setSelectedBookingForReview(bk)}
                      className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-brand-800 text-xs font-bold rounded-lg border border-brand-200 transition flex items-center justify-center gap-1.5"
                    >
                      <Star className="w-3.5 h-3.5 fill-brand-600 text-brand-600" />
                      Leave Review
                    </button>
                    <button
                      onClick={() => setCancelModalBooking(bk)}
                      className="py-2 px-3 bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold rounded-lg border border-slate-200 hover:border-rose-200 transition"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedBookingForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 w-full max-w-md relative fade-in">
            <button
              onClick={() => setSelectedBookingForReview(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">Rate Your Turf Experience</h3>
            <p className="text-xs text-slate-500 mb-4">{selectedBookingForReview.turf_name}</p>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= reviewRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Your Review</label>
                <textarea
                  required
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details about turf grass quality, floodlights, parking, or amenities..."
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-brand-700 text-white font-bold rounded-lg hover:bg-brand-800"
              >
                Submit Verified Review
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 w-full max-w-md relative fade-in">
            <button
              onClick={() => setCancelModalBooking(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1">Cancel Reservation?</h3>
            <p className="text-xs text-slate-500 mb-4">
              Booking {cancelModalBooking.booking_reference} ({cancelModalBooking.booking_date}). Slots will be released back to the schedule.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for cancellation</label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalBooking(null)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200"
                >
                  Keep Booking
                </button>
                <button
                  type="button"
                  onClick={handleCancelBooking}
                  className="flex-1 py-2.5 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700"
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyBookingsPage;
