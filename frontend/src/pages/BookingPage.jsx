import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoomDetail, createReservation, verifyPayment, mockPayment } from '../services/api';
import { 
  ChevronLeft, ShieldCheck, Clock, CreditCard, Calendar, 
  MapPin, Star, Bed, Users, Check, AlertCircle, Sparkles, 
  CheckCircle2, ArrowRight, Lock, Phone, Mail, Building, Copy, ExternalLink, Share2
} from 'lucide-react';

export default function BookingPage() {
  const { id, hotelId, roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const effectiveId = roomId || id;

  // Loading & State
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null); // { room, hotel }
  const [fetchError, setFetchError] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Default dates calculation
  const today = new Date().toISOString().split('T')[0];
  const defaultCheckout = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  };

  // Helper resolver functions for query parameters
  const resolveArrival = (val) => {
    if (!val) return '18:00 - 20:00';
    const lower = String(val).toLowerCase();
    if (lower.includes('14') || lower.includes('afternoon')) return '14:00 - 16:00';
    if (lower.includes('16')) return '16:00 - 18:00';
    if (lower.includes('18')) return '18:00 - 20:00';
    if (lower.includes('late') || lower.includes('20') || lower.includes('after') || lower.includes('night')) {
      return 'Late Arrival: After 20:00';
    }
    return val;
  };

  const resolvePayment = (val) => {
    if (!val) return 'PAY_AT_PROPERTY';
    const lower = String(val).toLowerCase();
    if (lower.includes('online') || lower.includes('razorpay') || lower.includes('card') || lower.includes('upi')) {
      return 'ONLINE_RAZORPAY';
    }
    return 'PAY_AT_PROPERTY';
  };

  const resolveHold = (val) => {
    if (val !== null && val !== undefined) {
      return ['true', '1', 'yes', 'on', 'required'].includes(String(val).toLowerCase());
    }
    return true; // Default to true for disruption recovery
  };

  const resolveSpecialRequests = (flight, requests) => {
    if (requests) return requests;
    if (flight) return `Holding check-in due to flight delay ${flight.toUpperCase()} arriving late`;
    return 'Holding check-in due to flight delay AI-804 arriving at 20:30';
  };

  // Extract query parameters with flexible aliases
  const qCheckin = searchParams.get('checkin') || searchParams.get('checkin_date') || today;
  const qCheckout = searchParams.get('checkout') || searchParams.get('checkout_date') || defaultCheckout();
  const qGuests = Number(searchParams.get('guests') || searchParams.get('adults')) || 2;
  const qName = searchParams.get('name') || searchParams.get('guest_name') || '';
  const qEmail = searchParams.get('email') || searchParams.get('guest_email') || '';
  const qPhone = searchParams.get('phone') || searchParams.get('guest_phone') || '';
  const qArrival = searchParams.get('arrival') || searchParams.get('arrival_time') || searchParams.get('expected_arrival');
  const qHold = searchParams.get('hold') || searchParams.get('late_hold');
  const qFlight = searchParams.get('flight') || searchParams.get('flight_no') || searchParams.get('flight_number') || '';
  const qRequests = searchParams.get('special_requests') || searchParams.get('request') || searchParams.get('notes');
  const qPayment = searchParams.get('payment') || searchParams.get('payment_mode') || searchParams.get('pay');

  const hasAutofillParams = Boolean(
    qName || qEmail || qPhone || qFlight || qRequests || 
    qArrival || searchParams.get('checkin') || searchParams.get('checkout') || qPayment
  );

  // Form states
  const [checkinDate, setCheckinDate] = useState(qCheckin);
  const [checkoutDate, setCheckoutDate] = useState(qCheckout);
  const [guestsCount, setGuestsCount] = useState(qGuests);

  const [name, setName] = useState(qName || user?.name || '');
  const [email, setEmail] = useState(qEmail || user?.email || '');
  const [phone, setPhone] = useState(qPhone || '+91 9876543210');

  const [expectedArrival, setExpectedArrival] = useState(() => resolveArrival(qArrival));
  const [lateHoldRequested, setLateHoldRequested] = useState(() => resolveHold(qHold));
  const [specialRequests, setSpecialRequests] = useState(() => resolveSpecialRequests(qFlight, qRequests));
  const [paymentMode, setPaymentMode] = useState(() => resolvePayment(qPayment));

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [freezeSeconds, setFreezeSeconds] = useState(0);

  // Sync state if searchParams update
  useEffect(() => {
    if (qName) setName(qName);
    if (qEmail) setEmail(qEmail);
    if (qPhone) setPhone(qPhone);
    if (qGuests) setGuestsCount(qGuests);
    if (searchParams.get('checkin')) setCheckinDate(qCheckin);
    if (searchParams.get('checkout')) setCheckoutDate(qCheckout);
    if (qArrival) setExpectedArrival(resolveArrival(qArrival));
    if (qHold !== null && qHold !== undefined) setLateHoldRequested(resolveHold(qHold));
    if (qRequests || qFlight) setSpecialRequests(resolveSpecialRequests(qFlight, qRequests));
    if (qPayment) setPaymentMode(resolvePayment(qPayment));
  }, [searchParams]);

  // Auto-populate when user signs in (if fields empty)
  useEffect(() => {
    if (user) {
      if (!name && !qName) setName(user.name || '');
      if (!email && !qEmail) setEmail(user.email || '');
    }
  }, [user]);

  // Countdown timer effect for freezing submit button for 10 seconds
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

  // Fetch Room & Hotel data
  useEffect(() => {
    const loadBookingData = async () => {
      setLoading(true);
      setFetchError('');
      try {
        const result = await getRoomDetail(effectiveId);
        setData(result);
        if (result?.room?.capacity?.adults && !searchParams.get('guests') && !searchParams.get('adults')) {
          setGuestsCount(result.room.capacity.adults);
        }
      } catch (err) {
        console.error('Failed to load room details for checkout:', err);
        setFetchError(err.response?.data?.detail || err.message || 'Room slot details could not be retrieved.');
      } finally {
        setLoading(false);
      }
    };

    if (effectiveId) {
      loadBookingData();
    }
  }, [effectiveId]);

  // Helper to generate and copy current autofill link for TinyFish or sharing
  const handleCopyAutofillLink = () => {
    const origin = window.location.origin;
    const path = `/book/${effectiveId}`;
    const params = new URLSearchParams();

    if (name) params.set('name', name);
    if (email) params.set('email', email);
    if (phone) params.set('phone', phone);
    if (guestsCount) params.set('guests', guestsCount);
    if (checkinDate) params.set('checkin', checkinDate);
    if (checkoutDate) params.set('checkout', checkoutDate);
    if (expectedArrival) params.set('arrival', expectedArrival);
    params.set('hold', lateHoldRequested ? 'true' : 'false');
    if (specialRequests) params.set('special_requests', specialRequests);
    params.set('payment', paymentMode === 'ONLINE_RAZORPAY' ? 'online' : 'pay_at_property');

    const fullUrl = `${origin}${path}?${params.toString()}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-8">
        <div className="h-6 bg-neutral-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-neutral-200 rounded-3xl"></div>
          <div className="h-96 bg-neutral-200 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (fetchError || !data || !data.room) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-800">Room Slot Not Available</h2>
        <p className="text-sm text-neutral-500 max-w-md mx-auto">
          {fetchError || `Unable to load room slot ID '${effectiveId}'. The slot may have been released or booked.`}
        </p>
        <div className="pt-4 flex justify-center space-x-3">
          <Link 
            to="/" 
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-neutral-900 text-white rounded-full text-xs font-bold hover:bg-neutral-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Return to Stays Directory</span>
          </Link>
        </div>
      </div>
    );
  }

  const { room, hotel } = data;

  // Calculate pricing breakdown
  const nights = Math.max(1, Math.round((new Date(checkoutDate) - new Date(checkinDate)) / (1000 * 60 * 60 * 24)) || 1);
  const basePrice = room?.price_per_night || 7499;
  const subtotal = basePrice * nights;
  const taxes = Math.round(subtotal * 0.18);
  const totalFee = subtotal + taxes;

  const timings = hotel?.timings || {
    standard_checkin: "14:00",
    standard_checkout: "12:00",
    cutoff_time: "20:00",
    allow_late_checkin: true
  };

  const policy = hotel?.cancellation_policy || {
    free_cancellation_until_hours: 24,
    cancellation_fee: 1500,
    policy_text: "Free cancellation up to 24h before check-in date. Late arrival notice must be provided before cut-off to prevent room release."
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (freezeSeconds > 0 || submitting) return;

    setFreezeSeconds(10);
    setSubmitting(true);
    setErrorMessage('');

    if (!name.trim() || !email.trim() || !phone.trim()) {
      setErrorMessage('Please fill in all guest contact details.');
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        hotel_id: hotel.id || hotel._id,
        room_id: room.id || room._id,
        guest: {
          name,
          email,
          phone,
          number_of_guests: Number(guestsCount)
        },
        booking_type: user ? 'user' : 'guest',
        user_id: user?.id || user?._id || null,
        checkin_date: checkinDate,
        checkout_date: checkoutDate,
        nights,
        expected_arrival_time: expectedArrival,
        late_checkin_hold_requested: lateHoldRequested,
        special_requests: specialRequests,
        payment_mode: paymentMode
      };

      const res = await createReservation(payload);
      const bookingId = res.booking_id;

      // Handle Razorpay Online Payment Flow
      if (paymentMode === 'ONLINE_RAZORPAY') {
        const orderId = res.payment?.razorpay_order_id;
        const razorpayKey = res.razorpay_key_id || 'rzp_test_ToCDACAiFNsKep';

        if (window.Razorpay && orderId && !orderId.startsWith('order_mock_')) {
          const options = {
            key: razorpayKey,
            amount: Math.round(totalFee * 100),
            currency: 'INR',
            name: 'StayPulse Hotels',
            description: `${room.room_type} at ${hotel.name}`,
            order_id: orderId,
            prefill: {
              name,
              email,
              contact: phone
            },
            theme: {
              color: '#0284c7'
            },
            handler: async function (response) {
              try {
                await verifyPayment({
                  booking_id: bookingId,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                });
                navigate(`/confirmation/${bookingId}`);
              } catch (verifyErr) {
                console.error("Signature verification error:", verifyErr);
                navigate(`/confirmation/${bookingId}`);
              }
            },
            modal: {
              ondismiss: function () {
                setSubmitting(false);
                navigate(`/confirmation/${bookingId}`);
              }
            }
          };

          const rzpInstance = new window.Razorpay(options);
          rzpInstance.open();
          return;
        } else {
          // Instant mock sandbox payment
          await mockPayment(bookingId);
          navigate(`/confirmation/${bookingId}`);
          return;
        }
      }

      // Pay at property flow (instant zero-fee lock)
      navigate(`/confirmation/${bookingId}`);

    } catch (err) {
      console.error('Reservation creation failed:', err);
      setErrorMessage(err.response?.data?.detail || err.message || 'Failed to complete registration.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div className="flex items-center space-x-2 text-xs font-medium text-neutral-500">
          <Link to="/" className="hover:text-neutral-900 transition-colors">Explore Stays</Link>
          <span>/</span>
          {hotel?.id && (
            <>
              <Link to={`/hotels/${hotel.id || hotel._id}`} className="hover:text-neutral-900 transition-colors">
                {hotel.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-neutral-900 font-bold">Secure Slot Reservation</span>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleCopyAutofillLink}
            data-testid="copy-autofill-link-btn"
            className="flex items-center space-x-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer border border-neutral-200"
            title="Copy shareable autofill URL for TinyFish or trip partners"
          >
            {linkCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-neutral-500" />
                <span>Share / Copy Autofill Link</span>
              </>
            )}
          </button>

          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-Bit SSL Encrypted Slot Lock</span>
          </div>
        </div>
      </div>

      {/* Smart Autofill Notification Banner */}
      {hasAutofillParams && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-teal-50 to-indigo-50 border border-sky-200/90 text-sky-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-neutral-900 block text-xs">Smart Autofill Active</span>
              <span className="text-neutral-600 text-[11px]">
                Guest details, arrival window, and flight disruption notice were pre-populated automatically via your booking link.
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-600 text-white px-2.5 py-1 rounded-full shadow-xs">
              TinyFish / TripSaathi Linked
            </span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main 2-Column Checkout Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Guest Information, Recovery & Payment Forms (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Section 1: Guest Contact Details */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-neutral-200/90 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-full bg-sky-100 text-sky-800 font-bold text-xs flex items-center justify-center">1</span>
                  <div>
                    <h2 className="text-base font-bold text-neutral-900">Guest Contact Details</h2>
                    <p className="text-xs text-neutral-500">No account required • Instant confirmation receipt</p>
                  </div>
                </div>
                {user ? (
                  <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full">
                    Signed in as {user.name}
                  </span>
                ) : (
                  <span className="text-[11px] text-neutral-400 font-medium">Guest Checkout</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Primary Guest Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    data-testid="guest-name-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Arnesh Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    data-testid="guest-email-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. arnesh@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    data-testid="guest-phone-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Total Guests
                  </label>
                  <select
                    data-testid="guest-count-select"
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium cursor-pointer"
                  >
                    <option value={1}>1 Adult</option>
                    <option value={2}>2 Adults</option>
                    <option value={3}>3 Adults</option>
                    <option value={4}>4 Adults</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Expected Arrival & TripSaathi Disruption Recovery Parameters */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-neutral-200/90 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">2</span>
                  <div>
                    <h2 className="text-base font-bold text-neutral-900">Expected Arrival & Check-in Hold</h2>
                    <p className="text-xs text-neutral-500">Autonomous recovery parameters for flight delays</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-md">
                  TripSaathi Recovery
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                    Expected Arrival Time Slot
                  </label>
                  <select
                    data-testid="arrival-time-select"
                    value={expectedArrival}
                    onChange={(e) => setExpectedArrival(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-semibold text-neutral-900 cursor-pointer"
                  >
                    <option value="14:00 - 16:00">14:00 - 16:00 (Standard Afternoon)</option>
                    <option value="16:00 - 18:00">16:00 - 18:00 (Evening)</option>
                    <option value="18:00 - 20:00">18:00 - 20:00 (Late Evening)</option>
                    <option value="Late Arrival: After 20:00">Late Arrival: After 20:00 (Requires Front Desk Hold)</option>
                  </select>
                </div>

                <div className="flex items-center pt-2 sm:pt-6">
                  <label className="flex items-center space-x-2.5 text-xs font-semibold text-neutral-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lateHoldRequested}
                      onChange={(e) => setLateHoldRequested(e.target.checked)}
                      className="w-4 h-4 text-sky-600 rounded border-neutral-300 focus:ring-sky-500 cursor-pointer"
                    />
                    <span>Request Guaranteed Check-in Hold until 23:59</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Special Request / Connecting Flight Delay Notice
                </label>
                <input
                  type="text"
                  data-testid="special-requests-input"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="e.g. Holding check-in due to flight delay AI-804 arriving at 20:30"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs font-medium text-neutral-900"
                />
              </div>

              <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-xs text-amber-900 flex items-start space-x-2">
                <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Front Desk Policy: </strong>
                  Standard check-in is {timings.standard_checkin}. Rooms without a late arrival notice may be subject to release past {timings.cutoff_time}. Your hold request is transmitted to the front desk automatically.
                </span>
              </div>
            </div>

            {/* Section 3: Payment Method Selection */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-neutral-200/90 shadow-xs space-y-5">
              <div className="flex items-center space-x-3 border-b border-neutral-100 pb-4">
                <span className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center">3</span>
                <div>
                  <h2 className="text-base font-bold text-neutral-900">Payment Method</h2>
                  <p className="text-xs text-neutral-500">Choose Pay at Property or Online Checkout</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Option 1: Pay at Property */}
                <label 
                  data-testid="payment-method-pay-at-property"
                  className={`p-4 rounded-2xl border-2 flex flex-col justify-between cursor-pointer transition-all ${
                    paymentMode === 'PAY_AT_PROPERTY' 
                      ? 'border-sky-600 bg-sky-50/50 shadow-sm' 
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="block text-sm font-bold text-neutral-900">Pay at Property</span>
                      <span className="block text-xs text-neutral-500 mt-1">Zero upfront fee today. Pay at front desk upon check-in.</span>
                    </div>
                    <input
                      type="radio"
                      name="paymentMode"
                      value="PAY_AT_PROPERTY"
                      checked={paymentMode === 'PAY_AT_PROPERTY'}
                      onChange={() => setPaymentMode('PAY_AT_PROPERTY')}
                      className="mt-1 w-4 h-4 text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />
                  </div>
                  <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-700">₹0 Due Today</span>
                    <span className="text-neutral-500">Reserves Slot Instantly</span>
                  </div>
                </label>

                {/* Option 2: Pay Online with Razorpay */}
                <label 
                  data-testid="payment-method-razorpay"
                  className={`p-4 rounded-2xl border-2 flex flex-col justify-between cursor-pointer transition-all ${
                    paymentMode === 'ONLINE_RAZORPAY' 
                      ? 'border-sky-600 bg-sky-50/50 shadow-sm' 
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="block text-sm font-bold text-neutral-900">Pay Online</span>
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-sky-100 text-sky-800 rounded">Razorpay</span>
                      </div>
                      <span className="block text-xs text-neutral-500 mt-1">UPI, Credit/Debit Cards, NetBanking sandbox.</span>
                    </div>
                    <input
                      type="radio"
                      name="paymentMode"
                      value="ONLINE_RAZORPAY"
                      checked={paymentMode === 'ONLINE_RAZORPAY'}
                      onChange={() => setPaymentMode('ONLINE_RAZORPAY')}
                      className="mt-1 w-4 h-4 text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />
                  </div>
                  <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-sky-700">₹{totalFee.toLocaleString('en-IN')} Total</span>
                    <span className="text-emerald-600 font-semibold">Instant Guarantee</span>
                  </div>
                </label>

              </div>
            </div>

            {/* Section 4: Cancellation Guarantee Notice */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-neutral-600 flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="text-neutral-900">Free Cancellation Protected: </strong>
                Cancel free of charge up to {policy.free_cancellation_until_hours} hours prior to arrival day. In case of disruption or plan changes, you can cancel or update your arrival time self-service using your Booking ID.
              </div>
            </div>

            {/* Submit Button & 10s Lockout */}
            <div className="pt-2 flex items-center space-x-4">
              <button
                type="submit"
                disabled={submitting || freezeSeconds > 0}
                data-testid="confirm-booking-btn"
                className="w-full py-4 px-8 rounded-full bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white text-sm font-bold shadow-xl shadow-sky-600/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {freezeSeconds > 0 ? (
                  <span>Locking Submission ({freezeSeconds}s cooldown)...</span>
                ) : submitting ? (
                  <span>Reserving Room Slot & Generating Booking ID...</span>
                ) : (
                  <>
                    <span>{paymentMode === 'PAY_AT_PROPERTY' ? 'Confirm Reservation & Lock Slot (Pay ₹0)' : `Pay ₹${totalFee.toLocaleString('en-IN')} with Razorpay`}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>

        </div>

        {/* RIGHT COLUMN: Sticky Order Summary Card (5 cols) */}
        <div className="lg:col-span-5 sticky top-24 space-y-6">
          
          <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-sm overflow-hidden">
            
            {/* Hotel Thumbnail & Name */}
            <div className="relative aspect-16/9 overflow-hidden">
              <img
                src={room.image || hotel.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80"}
                alt={hotel.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-neutral-900/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {hotel.brand || 'StayPulse'}
              </div>
              <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md text-neutral-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center space-x-1">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{hotel.star_rating}.0 Star</span>
              </div>
            </div>

            <div className="p-6 space-y-5">
              
              <div>
                <h3 className="text-xl font-extrabold text-neutral-900 tracking-tight">{hotel.name}</h3>
                <div className="flex items-center text-xs text-neutral-500 mt-1 space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>{hotel.address || hotel.city}</span>
                </div>
              </div>

              {/* Room Details Box */}
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900">{room.room_type}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    {room.available_slots || 3} slots left
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-[11px] text-neutral-500">
                  <span>{room.bed_type || '1 King Bed'}</span>
                  <span>•</span>
                  <span>{room.room_size || '350 sq ft'}</span>
                </div>
              </div>

              {/* Stay Dates Modifier */}
              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Stay Schedule</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-neutral-600 mb-0.5">Check-in</label>
                    <input
                      type="date"
                      value={checkinDate}
                      onChange={(e) => setCheckinDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs font-bold text-neutral-800 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-neutral-600 mb-0.5">Check-out</label>
                    <input
                      type="date"
                      value={checkoutDate}
                      onChange={(e) => setCheckoutDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs font-bold text-neutral-800 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-600 pt-1">
                  <span>Duration:</span>
                  <strong className="text-neutral-900">{nights} {nights > 1 ? 'nights' : 'night'}</strong>
                </div>
              </div>

              {/* Inclusions */}
              <div className="space-y-1.5 pt-2 border-t border-neutral-100 text-xs text-neutral-600">
                <div className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Buffet Breakfast Included</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Free Cancellation up to {policy.free_cancellation_until_hours}h</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Front Desk Hold Guarantee Past {timings.cutoff_time}</span>
                </div>
              </div>

              {/* Price Calculation Summary */}
              <div className="pt-4 border-t border-neutral-100 space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-600">
                  <span>₹{basePrice.toLocaleString('en-IN')} x {nights} nights</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-600">
                  <span>Taxes & Hotel GST (18%)</span>
                  <span>₹{taxes.toLocaleString('en-IN')}</span>
                </div>

                <div className="pt-3 border-t border-neutral-200 flex items-baseline justify-between">
                  <div>
                    <span className="text-base font-extrabold text-neutral-900 block">Total Price</span>
                    <span className="text-[10px] text-neutral-400">Includes all taxes and fees</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-sky-700">₹{totalFee.toLocaleString('en-IN')}</span>
                    {paymentMode === 'PAY_AT_PROPERTY' && (
                      <span className="block text-[11px] font-bold text-emerald-600">Pay ₹0 today</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Front Desk Phone Help */}
              {hotel?.contact?.phone && (
                <div className="pt-2 flex items-center justify-center space-x-1.5 text-xs text-neutral-500">
                  <Phone className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Concierge Desk: <strong>{hotel.contact.phone}</strong></span>
                </div>
              )}

            </div>

          </div>

          {/* TinyFish / TripSaathi Integration Box */}
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white rounded-3xl p-5 shadow-lg space-y-3.5 border border-neutral-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold tracking-wide uppercase text-sky-400">Agent Autofill Link</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-neutral-300">
                TinyFish Ready
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Generate and copy a direct autofill URL with the current guest details, stay dates, and flight delay hold to feed into TinyFish browser automation.
            </p>
            <button
              type="button"
              onClick={handleCopyAutofillLink}
              data-testid="sidebar-copy-autofill-btn"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md"
            >
              {linkCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Autofill Link Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Autofill URL</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
