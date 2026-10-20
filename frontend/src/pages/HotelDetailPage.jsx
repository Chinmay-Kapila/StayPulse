import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getHotelDetail } from '../services/api';
import { 
  Star, MapPin, Phone, Mail, Clock, ShieldCheck, 
  Bed, Users, Check, AlertCircle, ChevronLeft, Calendar, 
  Sparkles, Coffee, Wifi, Tv, Wind 
} from 'lucide-react';

export default function HotelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);

  // Default dates
  const today = new Date().toISOString().split('T')[0];
  const defaultCheckout = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  };

  const [checkinDate, setCheckinDate] = useState(today);
  const [checkoutDate, setCheckoutDate] = useState(defaultCheckout());

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const data = await getHotelDetail(id);
        setHotel(data);
      } catch (err) {
        console.error('Failed to load hotel detail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-8">
        <div className="h-6 bg-neutral-200 rounded w-1/4"></div>
        <div className="h-96 bg-neutral-200 rounded-3xl"></div>
        <div className="h-40 bg-neutral-200 rounded-3xl"></div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-neutral-800">Hotel listing not found</h2>
        <p className="text-sm text-neutral-500 mt-2">The requested hotel ID could not be loaded from MongoDB.</p>
        <Link to="/" className="mt-6 inline-flex items-center space-x-2 px-5 py-2.5 bg-neutral-900 text-white rounded-full text-xs font-bold">
          <ChevronLeft className="w-4 h-4" />
          <span>Return to Stays Directory</span>
        </Link>
      </div>
    );
  }

  const images = hotel.images && hotel.images.length > 0 ? hotel.images : [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop&q=80"
  ];

  const timings = hotel.timings || {
    standard_checkin: "14:00",
    standard_checkout: "12:00",
    cutoff_time: "20:00",
    allow_late_checkin: true
  };

  const policy = hotel.cancellation_policy || {
    free_cancellation_until_hours: 24,
    cancellation_fee: 1500,
    policy_text: "Free cancellation up to 24h before check-in date. Late arrival notice must be provided before cut-off to prevent room release."
  };

  const nights = Math.max(1, Math.round((new Date(checkoutDate) - new Date(checkinDate)) / (1000 * 60 * 60 * 24)) || 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Back button */}
      <div>
        <Link 
          to="/" 
          className="inline-flex items-center space-x-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 bg-white px-3 py-1.5 rounded-full border border-neutral-200 shadow-2xs"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to All Stays</span>
        </Link>
      </div>

      {/* Hotel Title & Badges Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="px-3 py-0.5 rounded-full bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider">
              {hotel.brand || 'Luxury Resort'}
            </span>
            <div className="flex items-center space-x-1 bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{hotel.star_rating}.0 Star Rated</span>
            </div>
            <span className="text-xs text-neutral-500 font-medium">Hotel ID: {hotel.id || hotel._id}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
            {hotel.name}
          </h1>

          <div className="flex items-center text-sm text-neutral-600 mt-2 space-x-2">
            <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
            <span>{hotel.address}</span>
          </div>
        </div>

        {/* Contact Desk Box */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs text-xs space-y-1.5 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Front Desk Inquiries</span>
          <div className="flex items-center space-x-2 text-neutral-700">
            <Phone className="w-3.5 h-3.5 text-sky-600" />
            <span className="font-semibold">{hotel.contact?.phone || '+91 22 6668 1234'}</span>
          </div>
          <div className="flex items-center space-x-2 text-neutral-700">
            <Mail className="w-3.5 h-3.5 text-teal-600" />
            <span>{hotel.contact?.email || 'concierge@staypulse.com'}</span>
          </div>
        </div>
      </div>

      {/* Photo Gallery Grid (Matching DemoHotel detail layout) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-3xl overflow-hidden aspect-2/1 max-h-[480px]">
        <div className="md:col-span-2 relative group overflow-hidden">
          <img
            src={images[0]}
            alt={hotel.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="hidden md:grid grid-rows-2 gap-3">
          <div className="relative group overflow-hidden">
            <img
              src={images[1] || images[0]}
              alt="Hotel Interior"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="relative group overflow-hidden">
            <img
              src={images[2] || images[0]}
              alt="Hotel Room"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
        <div className="hidden md:block relative group overflow-hidden">
          <img
            src={images[3] || images[1] || images[0]}
            alt="Hotel Amenity"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-neutral-900/40 hover:bg-neutral-900/20 transition-colors flex items-center justify-center">
            <span className="text-white text-xs font-bold bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30">
              View All Photos
            </span>
          </div>
        </div>
      </div>

      {/* Check-in Policy & Deadlines Banner (Essential for TinyFish crawler & TripSaathi recovery) */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center space-x-2 text-sky-800">
            <ShieldCheck className="w-5 h-5 text-sky-600" />
            <h2 className="text-base font-bold text-neutral-900">Hotel Check-in & Cancellation Policies</h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
            Machine Readable
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-neutral-400 font-bold uppercase tracking-wider text-[10px] block">Standard Check-in</span>
            <span className="text-sm font-bold text-neutral-800 mt-0.5 block">{timings.standard_checkin}</span>
            <span className="text-neutral-500 text-[11px]">Early check-in subject to availability</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-neutral-400 font-bold uppercase tracking-wider text-[10px] block">Standard Check-out</span>
            <span className="text-sm font-bold text-neutral-800 mt-0.5 block">{timings.standard_checkout}</span>
            <span className="text-neutral-500 text-[11px]">Late checkout up to 14:00 on request</span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
            <span className="text-amber-700 font-bold uppercase tracking-wider text-[10px] block">Front Desk Cut-off Deadline</span>
            <span className="text-sm font-bold text-amber-950 mt-0.5 block">{timings.cutoff_time}</span>
            <span className="text-amber-800 text-[11px] font-medium">Without hold notice, desk may release slots</span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
            <span className="text-emerald-700 font-bold uppercase tracking-wider text-[10px] block">Free Cancellation Window</span>
            <span className="text-sm font-bold text-emerald-950 mt-0.5 block">Up to {policy.free_cancellation_until_hours}h prior</span>
            <span className="text-emerald-800 text-[11px] font-medium">Zero penalty before deadline</span>
          </div>

        </div>

        <p className="text-xs text-neutral-600 bg-neutral-50 p-3 rounded-xl border border-neutral-100 leading-relaxed">
          <strong className="text-neutral-800">Policy Terms: </strong>
          {policy.policy_text}
        </p>
      </div>

      {/* Date Selector for Live Slot Verification */}
      <div className="bg-sky-50/70 p-4 rounded-2xl border border-sky-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-sky-600" />
          <div>
            <h3 className="text-sm font-bold text-sky-950">Select Stay Dates to Check Slot Availability</h3>
            <p className="text-xs text-sky-700">Calculates real-time nightly rates and inventory counts</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div>
            <label className="block text-[10px] font-bold text-sky-800 uppercase tracking-wider">Check-in</label>
            <input
              type="date"
              value={checkinDate}
              onChange={(e) => setCheckinDate(e.target.value)}
              className="bg-white px-3 py-1.5 rounded-lg border border-sky-200 text-xs font-bold text-neutral-800 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-sky-800 uppercase tracking-wider">Check-out</label>
            <input
              type="date"
              value={checkoutDate}
              onChange={(e) => setCheckoutDate(e.target.value)}
              className="bg-white px-3 py-1.5 rounded-lg border border-sky-200 text-xs font-bold text-neutral-800 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Available Room Slots Section */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">Available Room Slots</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Real-time MongoDB inventory. Locking a room automatically decrements the slot count.
          </p>
        </div>

        <div className="space-y-6">
          {(hotel.rooms || []).map((room) => {
            const roomSubtotal = room.price_per_night * nights;
            const roomTaxes = Math.round(roomSubtotal * 0.18);
            const roomTotal = roomSubtotal + roomTaxes;
            const isAvailable = (room.available_slots || 0) > 0;

            return (
              <div
                key={room.id || room._id}
                className="bg-white rounded-3xl border border-neutral-200/90 overflow-hidden shadow-xs hover:border-neutral-300 transition-all flex flex-col md:flex-row"
              >
                {/* Room Image */}
                <div className="md:w-72 relative shrink-0 aspect-4/3 md:aspect-auto">
                  <img
                    src={room.image || "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80"}
                    alt={room.room_type}
                    className="w-full h-full object-cover"
                  />
                  {/* Live Slot Counter Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 text-xs font-bold bg-white/95 backdrop-blur-md rounded-full text-neutral-900 shadow-sm flex items-center space-x-1.5">
                      <span className={`w-2 h-2 rounded-full ${room.available_slots > 2 ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></span>
                      <span>{isAvailable ? `Only ${room.available_slots} slots left` : 'Sold Out'}</span>
                    </span>
                  </div>
                </div>

                {/* Room Details */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-lg font-bold text-neutral-900">{room.room_type}</h3>
                      <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full">
                        <Users className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Up to {room.capacity?.adults || 2} Adults, {room.capacity?.children || 1} Child</span>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                      {room.description}
                    </p>

                    <div className="flex items-center space-x-4 text-xs font-medium text-neutral-500 mt-3">
                      <span>Bed: <strong className="text-neutral-800">{room.bed_type || '1 King Bed'}</strong></span>
                      <span>•</span>
                      <span>Room Size: <strong className="text-neutral-800">{room.room_size || '350 sq ft'}</strong></span>
                    </div>

                    {/* Amenities Included */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {(room.amenities || []).map((am, idx) => (
                        <span key={idx} className="flex items-center space-x-1 text-xs bg-slate-100 text-neutral-700 px-2.5 py-1 rounded-lg font-medium">
                          <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                          <span>{am}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Breakdown & Register Button */}
                  <div className="mt-6 pt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-extrabold text-neutral-900">
                          ₹{room.price_per_night.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-neutral-500 font-normal">/ night</span>
                      </div>
                      <span className="text-[11px] text-neutral-500 block">
                        Total for {nights} {nights > 1 ? 'nights' : 'night'}: <strong className="text-neutral-800">₹{roomTotal.toLocaleString('en-IN')}</strong> (incl. 18% GST)
                      </span>
                    </div>

                    <button
                      disabled={!isAvailable}
                      data-testid="select-slot-btn"
                      onClick={() => {
                        navigate(`/book/${room.id || room._id}?checkin=${checkinDate}&checkout=${checkoutDate}`);
                      }}
                      className="px-6 py-3 rounded-full bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <span>{isAvailable ? 'Select & Register Slot' : 'Slot Unavailable'}</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
