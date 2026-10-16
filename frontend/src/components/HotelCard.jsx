import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Clock, ShieldCheck, CreditCard, Bed, ChevronRight } from 'lucide-react';

export default function HotelCard({ hotel }) {
  const images = hotel.images && hotel.images.length > 0 ? hotel.images : [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80"
  ];
  const primaryImage = images[0];

  const timings = hotel.timings || {
    standard_checkin: "14:00",
    cutoff_time: "20:00",
    allow_late_checkin: true
  };

  const cancellationPolicy = hotel.cancellation_policy || {
    free_cancellation_until_hours: 24,
    policy_text: "Free cancellation up to 24h before check-in date."
  };

  const startingPrice = hotel.min_price || hotel.starting_price || 3499;
  const availableSlots = hotel.total_available_slots !== undefined ? hotel.total_available_slots : 8;

  return (
    <div
      data-testid="hotel-card"
      className="group bg-white rounded-3xl border border-neutral-200/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-neutral-300 transition-all duration-300 flex flex-col"
    >
      {/* Hotel Image with Badges */}
      <div className="relative aspect-4/3 overflow-hidden bg-neutral-100">
        <img
          src={primaryImage}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Brand Tag */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-white rounded-full">
            {hotel.brand || 'Luxury Stay'}
          </span>
          {hotel.star_rating >= 5 && (
            <span className="px-2.5 py-1 text-xs font-bold bg-amber-400 text-amber-950 rounded-full shadow-sm">
              5-Star Luxury
            </span>
          )}
        </div>

        {/* Live Slot Counter Badge */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className="px-2.5 py-1 text-xs font-semibold bg-white/90 backdrop-blur-md text-neutral-800 rounded-full shadow-sm flex items-center space-x-1.5">
            <span className={`w-2 h-2 rounded-full ${availableSlots > 2 ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></span>
            <span>{availableSlots > 0 ? `${availableSlots} slots left` : 'Fully Booked'}</span>
          </span>
        </div>

        {/* Star Rating Badge */}
        <div 
          data-testid="star-rating"
          className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm flex items-center space-x-1 text-xs font-bold text-neutral-800"
        >
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>{hotel.star_rating}.0</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Location & City */}
          <div className="flex items-center text-xs font-medium text-neutral-500 space-x-1 mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-neutral-400" />
            <span data-testid="hotel-city">{hotel.city}</span>
            <span>•</span>
            <span className="truncate">{hotel.address.split(',')[0]}</span>
          </div>

          {/* Hotel Name */}
          <h3 
            data-testid="hotel-name"
            className="text-lg font-bold text-neutral-900 group-hover:text-sky-600 transition-colors line-clamp-1"
          >
            {hotel.name}
          </h3>

          {/* Machine-Readable Policy Badge (Vital for TinyFish crawler!) */}
          <div 
            data-testid="checkin-policy"
            className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-neutral-700 leading-snug space-y-1"
          >
            <div className="flex items-center space-x-1.5 font-semibold text-neutral-800">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span>Standard Check-in: {timings.standard_checkin} | Desk Cut-off: {timings.cutoff_time}</span>
            </div>
            <p className="text-[11px] text-neutral-500 line-clamp-2">
              {cancellationPolicy.policy_text || "Free cancellation up to 24h prior. Late arrival hold available."}
            </p>
          </div>

          {/* Amenities Pills */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {(hotel.amenities || []).slice(0, 3).map((amenity, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 text-[11px] font-medium">
                {amenity}
              </span>
            ))}
            {(hotel.amenities || []).length > 3 && (
              <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-500 text-[11px] font-medium">
                +{hotel.amenities.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Price & Action Button */}
        <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-neutral-400 block font-medium">From</span>
            <div className="flex items-baseline space-x-1">
              <span 
                data-testid="hotel-price"
                className="text-xl font-extrabold text-neutral-900"
              >
                ₹{startingPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-neutral-500 font-normal">/ night</span>
            </div>
          </div>

          <Link
            to={`/hotels/${hotel.id || hotel._id}`}
            data-testid="view-slots-btn"
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-neutral-900 hover:bg-sky-600 text-white text-xs font-bold transition-colors shadow-sm"
          >
            <span>View Slots</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
