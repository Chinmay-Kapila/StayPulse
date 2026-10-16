import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getReservation, requestLateHold, cancelReservation } from '../services/api';
import { jsPDF } from 'jspdf';
import { 
  CheckCircle2, Clock, Calendar, MapPin, Phone, Mail, 
  CreditCard, ShieldCheck, AlertTriangle, ArrowRight, 
  RefreshCw, FileText, ChevronLeft, X, Download, Printer, QrCode
} from 'lucide-react';

export default function BookingConfirmationPage() {
  const { bookingId } = useParams();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Late Hold form state
  const [newArrivalTime, setNewArrivalTime] = useState('Late Arrival: After 20:00');
  const [flightReason, setFlightReason] = useState('Connecting flight AI-804 delayed by 2 hours');
  const [submittingHold, setSubmittingHold] = useState(false);

  // Cancel form state
  const [cancelReason, setCancelReason] = useState('Flight cancelled / Trip schedule changed');
  const [submittingCancel, setSubmittingCancel] = useState(false);

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

  const fetchBooking = async () => {
    setLoading(true);
    try {
      const data = await getReservation(bookingId);
      setReservation(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load booking details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const handleUpdateHold = async (e) => {
    e.preventDefault();
    if (freezeSeconds > 0 || submittingHold) return;

    setFreezeSeconds(10);
    setSubmittingHold(true);
    try {
      const updated = await requestLateHold(bookingId, {
        expected_arrival_time: newArrivalTime,
        special_requests: flightReason,
        reason: 'Travel delay notification'
      });
      setReservation(updated);
      setShowHoldModal(false);
    } catch (err) {
      alert("Error requesting hold: " + (err.response?.data?.detail || err.message));
    } finally {
      setSubmittingHold(false);
    }
  };

  const handleExecuteCancel = async (e) => {
    e.preventDefault();
    if (freezeSeconds > 0 || submittingCancel) return;

    setFreezeSeconds(10);
    setSubmittingCancel(true);
    try {
      const updated = await cancelReservation(bookingId, cancelReason);
      setReservation(updated);
      setShowCancelModal(false);
    } catch (err) {
      alert("Cancellation error: " + (err.response?.data?.detail || err.message));
    } finally {
      setSubmittingCancel(false);
    }
  };

  // Generate and Download PDF Receipt
  const handleDownloadPDF = () => {
    if (!reservation) return;

    const doc = new jsPDF();
    const totalFee = reservation.pricing?.total_fee || reservation.payment?.total_fee || 0;
    const subtotal = reservation.pricing?.subtotal || Math.round(totalFee / 1.18);
    const taxes = Math.round(totalFee - subtotal);
    const cgst = Math.round(taxes / 2);
    const sgst = taxes - cgst;

    // Header Branding
    doc.setFontSize(22);
    doc.setTextColor(2, 132, 199); // Sky blue
    doc.text("StayPulse Hotels", 20, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("Official Tax Invoice & Slot Confirmation Receipt", 20, 28);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 33);

    // Invoice Meta Box
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(20, 38, 170, 24, 3, 3, "FD");

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(`Booking Reference: ${reservation.booking_id}`, 25, 47);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Invoice Status: ${reservation.status}`, 25, 55);
    doc.text(`Payment: ${reservation.payment?.mode === 'PAY_AT_PROPERTY' ? 'Pay at Hotel' : 'Paid Online'} (${reservation.payment?.status})`, 110, 55);

    // Section 1: Hotel & Stay Details
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Hotel Property & Stay Details", 20, 72);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(`Hotel: ${reservation.hotel_name}`, 20, 80);
    doc.text(`Address: ${reservation.hotel_address}`, 20, 86);
    doc.text(`Room Slot: ${reservation.room_type}`, 20, 92);
    doc.text(`Dates: ${reservation.checkin_date} to ${reservation.checkout_date} (${reservation.nights} nights)`, 20, 98);
    doc.text(`Expected Arrival: ${reservation.expected_arrival_time}`, 20, 104);

    // Section 2: Guest Information
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Guest Details", 20, 118);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(`Primary Guest: ${reservation.guest?.name}`, 20, 126);
    doc.text(`Email: ${reservation.guest?.email}`, 20, 132);
    doc.text(`Phone: ${reservation.guest?.phone}`, 20, 138);
    doc.text(`Total Guests: ${reservation.guest?.number_of_guests || 2}`, 20, 144);

    // Section 3: Tariff & Tax Breakdown Table
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Itemized Tariff Breakdown", 20, 158);

    doc.setDrawColor(203, 213, 225);
    doc.line(20, 162, 190, 162);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Description", 25, 168);
    doc.text("Qty / Nights", 120, 168);
    doc.text("Amount (INR)", 160, 168);
    doc.line(20, 172, 190, 172);

    doc.setFont("helvetica", "normal");
    doc.text(`Room Accommodation (${reservation.room_type})`, 25, 180);
    doc.text(`${reservation.nights} nights`, 120, 180);
    doc.text(`${subtotal.toLocaleString('en-IN')}`, 160, 180);

    doc.text("Central GST (CGST 9%)", 25, 188);
    doc.text("9%", 120, 188);
    doc.text(`${cgst.toLocaleString('en-IN')}`, 160, 188);

    doc.text("State GST (SGST 9%)", 25, 196);
    doc.text("9%", 120, 196);
    doc.text(`${sgst.toLocaleString('en-IN')}`, 160, 196);

    doc.line(20, 202, 190, 202);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Total Amount Payable:", 25, 210);
    doc.text(`INR ${totalFee.toLocaleString('en-IN')}`, 155, 210);

    // Terms & Footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Terms & Conditions: Standard check-in 14:00. Free cancellation up to 24h before check-in.", 20, 235);
    doc.text("Late check-in hold protected under TripSaathi & TinyFish Autonomous Reservation Protocol.", 20, 240);
    doc.text("Thank you for choosing StayPulse Hotels.", 20, 245);

    doc.save(`StayPulse_Receipt_${reservation.booking_id}.pdf`);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 animate-pulse space-y-6">
        <div className="h-12 bg-neutral-200 rounded-2xl w-1/3"></div>
        <div className="h-64 bg-neutral-200 rounded-3xl"></div>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-neutral-800">Booking Not Found</h2>
        <p className="text-sm text-neutral-500 mt-2">{error || `No reservation found for Booking ID '${bookingId}'`}</p>
        <Link to="/" className="mt-6 inline-flex items-center space-x-2 px-5 py-2.5 bg-neutral-900 text-white rounded-full text-xs font-bold">
          <ChevronLeft className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    );
  }

  const isCancelled = reservation.status === 'CANCELLED';
  const isPaid = reservation.payment?.status === 'PAID';
  const hasLateHold = reservation.late_checkin_hold_requested || reservation.status === 'LATE_ARRIVAL_APPROVED';
  const totalFee = reservation.pricing?.total_fee || reservation.payment?.total_fee || 0;
  const subtotal = reservation.pricing?.subtotal || Math.round(totalFee / 1.18);
  const taxes = Math.round(totalFee - subtotal);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Success / Status Banner */}
      <div className={`p-6 rounded-3xl border ${
        isCancelled 
          ? 'bg-rose-50 border-rose-200 text-rose-900' 
          : 'bg-emerald-50 border-emerald-200 text-emerald-900'
      } flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
        
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-2xl ${isCancelled ? 'bg-rose-500 text-white' : 'bg-emerald-600 text-white'}`}>
            {isCancelled ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider block">
              {isCancelled ? 'Reservation Status: Cancelled' : 'Reservation Status: Confirmed & Locked'}
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {isCancelled ? 'Booking Cancelled & Inventory Restored' : 'Room Slot Successfully Confirmed!'}
            </h1>
            <p className="text-xs opacity-80 mt-0.5">
              Registration code saved in database and ready for check-in.
            </p>
          </div>
        </div>

        {/* Booking ID Badge */}
        <div className="bg-white/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-black/10 text-center shrink-0">
          <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Booking ID</span>
          <span 
            data-testid="booking-id"
            className="text-xl font-extrabold text-neutral-900 tracking-wider font-mono"
          >
            {reservation.booking_id}
          </span>
        </div>

      </div>

      {/* Guaranteed Late Check-in Hold Badge */}
      {hasLateHold && !isCancelled && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Guaranteed Late Arrival Hold Active
              </h4>
              <p className="text-xs text-amber-700">
                Desk check-in guaranteed until <strong className="text-amber-950 font-bold">23:59</strong>. Your room slot will not be released for walk-in arrivals.
              </p>
            </div>
          </div>
          <span className="hidden sm:block text-[11px] font-bold px-3 py-1 bg-amber-200/80 text-amber-950 rounded-full">
            Desk Protected
          </span>
        </div>
      )}

      {/* Action Bar: Download PDF, Print, View Receipt */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
        <div className="flex items-center space-x-2 text-xs font-bold text-neutral-700">
          <FileText className="w-4 h-4 text-sky-600" />
          <span>Official Tax Invoice & Receipt</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Download PDF button using jsPDF */}
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 rounded-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF Receipt</span>
          </button>

          {/* Print button using window.print() */}
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Reservation & Itemized Receipt Card */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
        
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900">Reservation Details & Receipt</h3>
            <span className="text-xs text-neutral-500">Booking Reference: {reservation.booking_id}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Status</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {reservation.status}
            </span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Hotel & Room Information */}
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600">Hotel Property</span>
              <h4 className="text-lg font-bold text-neutral-900 mt-0.5">{reservation.hotel_name}</h4>
              <p className="text-xs text-neutral-500 flex items-center space-x-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>{reservation.hotel_address}</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-neutral-700">Room Category:</span>
                <span className="font-bold text-neutral-900">{reservation.room_type}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Check-in:</span>
                <span className="font-semibold text-neutral-800">{reservation.checkin_date} (14:00 onwards)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Check-out:</span>
                <span className="font-semibold text-neutral-800">{reservation.checkout_date} (12:00)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Duration:</span>
                <span className="font-semibold text-neutral-800">{reservation.nights} {reservation.nights > 1 ? 'nights' : 'night'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Expected Arrival Time:</span>
                <span className="font-bold text-sky-700">{reservation.expected_arrival_time}</span>
              </div>
            </div>

            {reservation.special_requests && (
              <div className="text-xs p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900">
                <strong>Arrival Notes / Flight Details: </strong>
                {reservation.special_requests}
              </div>
            )}
          </div>

          {/* Guest & Itemized Price Breakdown */}
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Guest Information</span>
              <h4 className="text-base font-bold text-neutral-900 mt-0.5">{reservation.guest?.name}</h4>
              <p className="text-xs text-neutral-500 mt-0.5">{reservation.guest?.email} • {reservation.guest?.phone}</p>
              <span className="text-xs text-neutral-500 block mt-1">Occupancy: {reservation.guest?.number_of_guests || 2} Guests</span>
            </div>

            {/* Price Table */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Itemized Charges</span>
              
              <div className="flex justify-between items-center pt-1">
                <span className="text-neutral-600">Base Room Charges ({reservation.nights} nights):</span>
                <span className="font-semibold text-neutral-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Central GST (CGST 9%):</span>
                <span className="text-neutral-700">₹{Math.round(taxes / 2).toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-neutral-600">State GST (SGST 9%):</span>
                <span className="text-neutral-700">₹{Math.round(taxes / 2).toLocaleString('en-IN')}</span>
              </div>

              <div className="pt-2 border-t border-neutral-200 flex justify-between items-center text-sm font-extrabold text-neutral-900">
                <span>Total Amount:</span>
                <span className="text-lg text-sky-700">₹{totalFee.toLocaleString('en-IN')}</span>
              </div>

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px]">
                <span className="text-neutral-500">Payment Mode:</span>
                <span className="font-bold text-neutral-800">
                  {reservation.payment?.mode === 'PAY_AT_PROPERTY' ? 'Pay at Hotel upon Check-in' : 'Online Razorpay'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-neutral-500">Payment Status:</span>
                <span className={`px-2 py-0.5 rounded font-bold ${
                  isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {reservation.payment?.status}
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* Action Buttons Bar */}
        {!isCancelled && (
          <div className="px-6 py-4 bg-neutral-50/80 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-neutral-500">
              Need to modify flight delay arrival or cancel?
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowHoldModal(true)}
                className="px-4 py-2 rounded-full bg-white hover:bg-neutral-100 border border-neutral-300 text-xs font-bold text-neutral-800 transition-colors shadow-2xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Request Late Check-in Hold</span>
              </button>

              <button
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-300 text-xs font-bold text-rose-700 transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel Reservation</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Return to Stays Link */}
      <div className="flex justify-between items-center text-xs text-neutral-500 pt-4">
        <Link to="/" className="inline-flex items-center space-x-1 font-semibold text-sky-600 hover:text-sky-800">
          <ChevronLeft className="w-4 h-4" />
          <span>Browse More Hotels</span>
        </Link>
        <Link to="/lookup" className="font-semibold text-neutral-700 hover:text-neutral-900">
          Lookup Another Booking ID →
        </Link>
      </div>

      {/* Late Hold Modal (With 10-Second Submit Lock) */}
      {showHoldModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-5">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <h3 className="text-base font-bold text-neutral-900">Request Late Check-in Hold</h3>
              <button onClick={() => setShowHoldModal(false)} className="p-1 rounded-full text-neutral-400 hover:text-neutral-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Notify the front desk of your delayed flight or transit so your room slot remains held until 23:59.
            </p>

            <form onSubmit={handleUpdateHold} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">New Estimated Arrival Slot</label>
                <select
                  value={newArrivalTime}
                  onChange={(e) => setNewArrivalTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-medium cursor-pointer"
                >
                  <option value="18:00 - 20:00">18:00 - 20:00</option>
                  <option value="Late Arrival: 20:00 - 22:00">Late Arrival: 20:00 - 22:00</option>
                  <option value="Late Arrival: After 22:00">Late Arrival: After 22:00 (Midnight transit)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Flight Number & Delay Reason</label>
                <textarea
                  rows={3}
                  value={flightReason}
                  onChange={(e) => setFlightReason(e.target.value)}
                  placeholder="e.g. Flight 6E-204 from Delhi delayed due to weather, arriving around 21:30"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-medium"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowHoldModal(false)}
                  className="flex-1 py-2.5 rounded-full border border-neutral-300 text-xs font-bold text-neutral-700 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submittingHold || freezeSeconds > 0}
                  className="flex-1 py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {freezeSeconds > 0
                    ? `Please wait (${freezeSeconds}s)...`
                    : submittingHold
                    ? 'Updating Hold...'
                    : 'Confirm Hold Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal (With 10-Second Submit Lock) */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-5">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <h3 className="text-base font-bold text-rose-900">Cancel Reservation</h3>
              <button onClick={() => setShowCancelModal(false)} className="p-1 rounded-full text-neutral-400 hover:text-neutral-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 leading-relaxed">
              <p>
                <strong>Cancellation Policy Check: </strong>
                According to the hotel terms, free cancellation is valid up to 24 hours prior to check-in. If eligible, your refund will be computed automatically and the room slot released.
              </p>
            </div>

            <form onSubmit={handleExecuteCancel} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Reason for Cancellation</label>
                <input
                  type="text"
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-2.5 rounded-full border border-neutral-300 text-xs font-bold text-neutral-700 cursor-pointer"
                >
                  Keep Booking
                </button>
                <button
                  type="submit"
                  disabled={submittingCancel || freezeSeconds > 0}
                  className="flex-1 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {freezeSeconds > 0
                    ? `Please wait (${freezeSeconds}s)...`
                    : submittingCancel
                    ? 'Processing...'
                    : 'Confirm & Cancel Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
