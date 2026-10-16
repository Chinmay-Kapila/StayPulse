import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReservation, requestLateHold, cancelReservation } from '../services/api';
import { 
  Search, Clock, ShieldCheck, AlertCircle, CheckCircle2, 
  XCircle, Hourglass, CalendarX, FileText, ChevronRight, AlertTriangle 
} from 'lucide-react';

export default function LookupPage() {
  const navigate = useNavigate();
  const [bookingId, setBookingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [reservation, setReservation] = useState(null);
  const [statusType, setStatusType] = useState(null); // 'APPROVED', 'WAITING', 'CANCELLED', 'EXPIRED', 'DOES_NOT_EXIST', 'CHECKIN_AT_RISK', 'LATE_ARRIVAL_APPROVED'
  const [actionMessage, setActionMessage] = useState('');
  
  // 10-Second Submit Button Lock
  const [freezeSeconds, setFreezeSeconds] = useState(0);

  useEffect(() => {
    let timer = null;
    if (freezeSeconds > 0) {
      timer = setInterval(() => {
        setFreezeSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [freezeSeconds]);

  const handleLookup = async (e) => {
    if (e) e.preventDefault();
    if (freezeSeconds > 0 || loading) return;

    const cleanId = bookingId.trim().toUpperCase();
    if (!cleanId) {
      setStatusType('DOES_NOT_EXIST');
      setReservation(null);
      return;
    }

    setFreezeSeconds(10);
    setLoading(true);
    setActionMessage('');
    setStatusType(null);

    try {
      const data = await getReservation(cleanId);
      setReservation(data);
      
      const st = (data.status || '').toUpperCase();
      if (st === 'CONFIRMED') {
        setStatusType('APPROVED');
      } else {
        setStatusType(st);
      }
    } catch (err) {
      setReservation(null);
      setStatusType('DOES_NOT_EXIST');
    } finally {
      setLoading(false);
    }
  };

  const handleSendLateHold = async () => {
    if (freezeSeconds > 0 || !reservation) return;
    setFreezeSeconds(10);
    try {
      const updated = await requestLateHold(reservation.booking_id, {
        expected_arrival_time: 'Late Arrival: After 20:00 (Flight Delay)',
        special_requests: 'Emergency late arrival notice dispatched to hotel front desk.',
        reason: 'Travel delay notification'
      });
      setReservation(updated);
      setStatusType('LATE_ARRIVAL_APPROVED');
      setActionMessage('Emergency Late Check-in Hold registered! Guaranteed until 23:59.');
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleCancelBooking = async () => {
    if (freezeSeconds > 0 || !reservation) return;
    if (!window.confirm("Cancel this reservation according to hotel policy?")) return;
    
    setFreezeSeconds(10);
    try {
      const updated = await cancelReservation(reservation.booking_id, "Cancelled via self-service lookup portal");
      setReservation(updated);
      setStatusType('CANCELLED');
      setActionMessage(`Reservation cancelled. Refund: ₹${updated.cancellation?.refund_amount || 0}`);
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Title */}
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-bold mb-3">
          <Clock className="w-3.5 h-3.5" />
          <span>Universal Status & Recovery Portal</span>
        </div>
        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
          Reservation Status Lookup
        </h1>
        <p className="text-sm text-neutral-500 mt-2">
          Enter your Booking ID to inspect real-time status: <strong>WAITING</strong>, <strong>APPROVED</strong>, <strong>CANCELLED</strong>, or <strong>EXPIRED</strong>.
        </p>
      </div>

      {/* Lookup Card - Booking ID ONLY */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm max-w-xl mx-auto">
        <form onSubmit={handleLookup} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Enter Booking ID
            </label>
            <input
              type="text"
              required
              data-testid="lookup-booking-id-input"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value.toUpperCase())}
              placeholder="e.g. STAY-90412B"
              className="w-full px-4 py-3 rounded-2xl border border-neutral-300 font-mono text-lg font-extrabold text-neutral-900 tracking-wider focus:ring-2 focus:ring-sky-500 focus:outline-none uppercase"
            />
          </div>

          <button
            type="submit"
            disabled={loading || freezeSeconds > 0}
            data-testid="lookup-submit-btn"
            className="w-full py-3.5 rounded-full bg-neutral-900 hover:bg-sky-600 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>
              {freezeSeconds > 0
                ? `Please wait (${freezeSeconds}s)...`
                : loading
                ? 'Searching Registry...'
                : 'Lookup Status'}
            </span>
          </button>
        </form>

        <p className="text-[11px] text-neutral-400 text-center mt-3">
          Submissions are locked for 10 seconds after click to prevent duplicate lookups.
        </p>
      </div>

      {/* Action Notice Message */}
      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2 max-w-xl mx-auto">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* STATUS 1: DOES NOT EXIST */}
      {statusType === 'DOES_NOT_EXIST' && (
        <div className="max-w-xl mx-auto p-6 rounded-3xl bg-rose-50 border border-rose-200 text-rose-900 space-y-3 text-center animate-in fade-in">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-lg font-bold">Status: DOES NOT EXIST</h3>
          <p className="text-xs text-rose-700 leading-relaxed">
            No active or historical reservation was found for Booking ID <strong className="font-mono">"{bookingId}"</strong> in the database. Please verify the code or check your confirmation email.
          </p>
        </div>
      )}

      {/* STATUS 2: EXPIRED */}
      {statusType === 'EXPIRED' && reservation && (
        <div className="max-w-2xl mx-auto p-6 rounded-3xl bg-slate-100 border border-slate-300 text-slate-900 space-y-4 animate-in fade-in">
          <div className="flex items-center space-x-3">
            <CalendarX className="w-8 h-8 text-slate-600" />
            <div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-800">
                Status: EXPIRED
              </span>
              <h3 className="text-xl font-bold mt-1">Stay Expired / Concluded</h3>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            This reservation for <strong>{reservation.hotel_name}</strong> was scheduled from <strong>{reservation.checkin_date}</strong> to <strong>{reservation.checkout_date}</strong>. The checkout deadline has elapsed.
          </p>
          <div className="pt-2 border-t border-slate-200 flex justify-between text-xs text-slate-500">
            <span>Booking ID: <strong className="font-mono text-slate-800">{reservation.booking_id}</strong></span>
            <span>Guest: {reservation.guest?.name}</span>
          </div>
        </div>
      )}

      {/* STATUS 3: WAITING / PENDING */}
      {statusType === 'WAITING' && reservation && (
        <div className="max-w-2xl mx-auto p-6 rounded-3xl bg-amber-50 border border-amber-200 text-amber-950 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Hourglass className="w-8 h-8 text-amber-600" />
              <div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-200 text-amber-900">
                  Status: WAITING
                </span>
                <h3 className="text-xl font-bold mt-1">Pending Front Desk Allocation</h3>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-white px-3 py-1 rounded-full border border-amber-300">
              {reservation.booking_id}
            </span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Your room slot at <strong>{reservation.hotel_name}</strong> has been secured in the inventory. Front desk verification and key allocation are currently in progress.
          </p>
          <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between text-xs">
            <span>Expected Arrival: <strong>{reservation.expected_arrival_time}</strong></span>
            <button
              onClick={() => navigate(`/confirmation/${reservation.booking_id}`)}
              className="text-amber-900 font-bold hover:underline"
            >
              View Receipt →
            </button>
          </div>
        </div>
      )}

      {/* STATUS 4: CANCELLED */}
      {statusType === 'CANCELLED' && reservation && (
        <div className="max-w-2xl mx-auto p-6 rounded-3xl bg-rose-50 border border-rose-200 text-rose-950 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <XCircle className="w-8 h-8 text-rose-600" />
              <div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-200 text-rose-900">
                  Status: CANCELLED
                </span>
                <h3 className="text-xl font-bold mt-1">Reservation Cancelled</h3>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-white px-3 py-1 rounded-full border border-rose-300">
              {reservation.booking_id}
            </span>
          </div>
          <p className="text-xs text-rose-800 leading-relaxed">
            This booking at <strong>{reservation.hotel_name}</strong> was cancelled and the room inventory was released.
            {reservation.cancellation?.refund_amount > 0 && ` A refund of ₹${reservation.cancellation.refund_amount} was calculated.`}
          </p>
          {reservation.cancellation?.reason && (
            <div className="text-xs bg-white/70 p-3 rounded-xl border border-rose-200">
              <strong>Cancellation Reason: </strong>{reservation.cancellation.reason}
            </div>
          )}
        </div>
      )}

      {/* STATUS 5: APPROVED / CONFIRMED / LATE APPROVED / AT RISK */}
      {(statusType === 'APPROVED' || statusType === 'CONFIRMED' || statusType === 'LATE_ARRIVAL_APPROVED' || statusType === 'CHECKIN_AT_RISK') && reservation && (
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-md p-6 sm:p-8 space-y-6 animate-in fade-in">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-3">
            <div>
              <span className="text-[11px] font-mono font-bold text-sky-600 uppercase tracking-wider">{reservation.booking_id}</span>
              <h3 className="text-xl font-bold text-neutral-900 mt-0.5">{reservation.hotel_name}</h3>
              <p className="text-xs text-neutral-500">{reservation.room_type} • {reservation.checkin_date} to {reservation.checkout_date}</p>
            </div>
            
            <div>
              {statusType === 'CHECKIN_AT_RISK' ? (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                  Status: CHECK-IN AT RISK (Past Cut-off)
                </span>
              ) : statusType === 'LATE_ARRIVAL_APPROVED' ? (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-900 border border-indigo-200">
                  Status: LATE ARRIVAL APPROVED (Hold to 23:59)
                </span>
              ) : (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Status: APPROVED & CONFIRMED</span>
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-neutral-400 block font-bold uppercase tracking-wider text-[10px]">Primary Guest</span>
              <span className="text-sm font-bold text-neutral-900 mt-0.5 block">{reservation.guest?.name}</span>
              <span className="text-neutral-500">{reservation.guest?.phone}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-neutral-400 block font-bold uppercase tracking-wider text-[10px]">Expected Arrival Time</span>
              <span className="text-sm font-bold text-neutral-900 mt-0.5 block">{reservation.expected_arrival_time}</span>
              <span className="text-neutral-500">{reservation.late_checkin_hold_requested ? 'Late Hold Active' : 'Standard arrival'}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-neutral-400 block font-bold uppercase tracking-wider text-[10px]">Payment Summary</span>
              <span className="text-sm font-bold text-neutral-900 mt-0.5 block">₹{(reservation.pricing?.total_fee || reservation.payment?.total_fee || 0).toLocaleString('en-IN')}</span>
              <span className="text-neutral-500">{reservation.payment?.mode === 'PAY_AT_PROPERTY' ? 'Pay at Hotel' : 'Paid Online'}</span>
            </div>
          </div>

          {/* Action Buttons with 10s Lock */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleSendLateHold}
              disabled={freezeSeconds > 0}
              className="px-5 py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{freezeSeconds > 0 ? `Please wait (${freezeSeconds}s)...` : 'Send Late Arrival Notice'}</span>
            </button>

            <button
              onClick={handleCancelBooking}
              disabled={freezeSeconds > 0}
              className="px-5 py-2.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Cancel Booking</span>
            </button>

            <button
              onClick={() => navigate(`/confirmation/${reservation.booking_id}`)}
              className="px-5 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-colors ml-auto flex items-center space-x-1"
            >
              <span>Download Receipt & Invoice</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
