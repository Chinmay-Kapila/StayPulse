import React, { useState } from 'react';
import { Search, MapPin, Calendar, Users, ChevronDown } from 'lucide-react';

export default function HeroSearch({ onSearch, initialCity = '', initialCheckin = '', initialCheckout = '', initialGuests = 2 }) {
  const [city, setCity] = useState(initialCity);
  const [checkin, setCheckin] = useState(initialCheckin || new Date().toISOString().split('T')[0]);
  
  // Default checkout to +2 days
  const defaultCheckout = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  };
  const [checkout, setCheckout] = useState(initialCheckout || defaultCheckout());
  const [guests, setGuests] = useState(initialGuests);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('stays');

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    onSearch({
      city,
      checkin,
      checkout,
      guests,
    });
  };

  const quickCities = [
    { name: 'All Hubs', value: '' },
    { name: 'Mumbai', value: 'Mumbai' },
    { name: 'New Delhi', value: 'New Delhi' },
    { name: 'Bangalore', value: 'Bangalore' },
    { name: 'Goa', value: 'Goa' },
  ];

  return (
    <div className="relative pt-6 pb-12 lg:pt-12 lg:pb-16 overflow-hidden">
      
      {/* Background blobs matching DemoHotel glassmorphism */}
      <div className="bg-glassmorphism">
        <span className="bg-glass-blob-1"></span>
        <span className="bg-glass-blob-2"></span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Hero Title */}
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200/80 text-sky-800 text-xs font-semibold mb-4">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping"></span>
            <span>Live Inventory & Autonomous Crawler Ready</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-neutral-900 tracking-tight leading-[1.15]">
            Hotel slots, verified policies & seamless <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-teal-600 to-indigo-600">travel recovery</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-neutral-600 leading-relaxed">
            Search top hotels across India, inspect late arrival cut-off deadlines, reserve real-time room slots with Pay-at-Hotel or Razorpay, and trigger automated travel recovery tests.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-6 mb-4 ml-2">
          <button
            onClick={() => setActiveTab('stays')}
            className={`flex items-center space-x-2 text-sm font-semibold transition-colors pb-1 border-b-2 ${
              activeTab === 'stays' ? 'border-sky-600 text-sky-600' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-600"></span>
            <span>Hotel Stays</span>
          </button>

          <button
            onClick={() => { setActiveTab('chains'); onSearch({ brand: 'IHCL' }); }}
            className={`flex items-center space-x-2 text-sm font-semibold transition-colors pb-1 border-b-2 ${
              activeTab === 'chains' ? 'border-sky-600 text-sky-600' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <span>Luxury Chains (Taj, Leela, Marriott)</span>
          </button>

          <button
            onClick={() => { setActiveTab('late'); onSearch({ sort: 'rating_desc' }); }}
            className={`flex items-center space-x-2 text-sm font-semibold transition-colors pb-1 border-b-2 ${
              activeTab === 'late' ? 'border-sky-600 text-sky-600' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <span>Late Check-in Friendly</span>
          </button>
        </div>

        {/* Floating Search Bar (Matching DemoHotel form) */}
        <form
          onSubmit={handleSearchSubmit}
          className="bg-white rounded-3xl lg:rounded-full shadow-xl shadow-slate-200/60 border border-neutral-200/90 p-2 lg:p-2.5 flex flex-col lg:flex-row items-stretch lg:items-center space-y-3 lg:space-y-0"
        >
          
          {/* Destination City */}
          <div className="flex-1 px-4 py-2 hover:bg-slate-50 lg:rounded-full transition-colors flex items-center space-x-3 cursor-pointer">
            <div className="p-2.5 bg-sky-50 rounded-full text-sky-600">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <label htmlFor="search-city-input" className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">Destination</label>
              <select
                id="search-city-input"
                data-testid="search-city-input"
                aria-label="Destination City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-transparent border-none text-base font-bold text-neutral-900 focus:outline-none cursor-pointer"
              >
                <option value="">All Destinations</option>
                <option value="Mumbai">Mumbai (Bandra / Airport T2)</option>
                <option value="New Delhi">New Delhi (Chanakyapuri / Janpath)</option>
                <option value="Bangalore">Bangalore (Residency Rd / Ulsoor)</option>
                <option value="Goa">Goa (Vagator Beach / Sinquerim)</option>
              </select>
            </div>
          </div>

          <div className="hidden lg:block w-px h-10 bg-neutral-200"></div>

          {/* Check-in Date */}
          <div className="flex-1 px-4 py-2 hover:bg-slate-50 lg:rounded-full transition-colors flex items-center space-x-3">
            <div className="p-2.5 bg-teal-50 rounded-full text-teal-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <label htmlFor="search-checkin-date" className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">Check-in</label>
              <input
                id="search-checkin-date"
                type="date"
                data-testid="search-checkin-date"
                aria-label="Check-in Date"
                value={checkin}
                onChange={(e) => setCheckin(e.target.value)}
                className="w-full bg-transparent border-none text-sm font-bold text-neutral-900 focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          <div className="hidden lg:block w-px h-10 bg-neutral-200"></div>

          {/* Check-out Date */}
          <div className="flex-1 px-4 py-2 hover:bg-slate-50 lg:rounded-full transition-colors flex items-center space-x-3">
            <div className="p-2.5 bg-teal-50 rounded-full text-teal-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <label htmlFor="search-checkout-date" className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">Check-out</label>
              <input
                id="search-checkout-date"
                type="date"
                data-testid="search-checkout-date"
                aria-label="Check-out Date"
                value={checkout}
                onChange={(e) => setCheckout(e.target.value)}
                className="w-full bg-transparent border-none text-sm font-bold text-neutral-900 focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          <div className="hidden lg:block w-px h-10 bg-neutral-200"></div>

          {/* Guests */}
          <div className="relative flex-1 px-4 py-2 hover:bg-slate-50 lg:rounded-full transition-colors flex items-center space-x-3">
            <div className="p-2.5 bg-amber-50 rounded-full text-amber-600">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <label htmlFor="search-guests-input" className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">Guests</label>
              <select
                id="search-guests-input"
                data-testid="search-guests-input"
                aria-label="Number of Guests"
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full bg-transparent border-none text-base font-bold text-neutral-900 focus:outline-none cursor-pointer"
              >
                <option value={1}>1 Guest (Solo)</option>
                <option value={2}>2 Guests (Couple)</option>
                <option value={3}>3 Guests (Family)</option>
                <option value={4}>4+ Guests (Group)</option>
              </select>
            </div>
          </div>

          {/* Search Button */}
          <div className="p-1">
            <button
              type="submit"
              data-testid="search-submit-btn"
              aria-label="Search Hotels"
              className="w-full lg:w-16 h-14 lg:h-16 rounded-2xl lg:rounded-full bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white flex items-center justify-center space-x-2 font-bold shadow-lg shadow-sky-600/30 transition-all cursor-pointer"
            >
              <Search className="w-6 h-6 stroke-[2.5]" />
              <span className="lg:hidden text-base">Search Available Slots</span>
            </button>
          </div>

        </form>

        {/* Quick City Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-6">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mr-2">Top Destinations:</span>
          {quickCities.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                setCity(item.value);
                onSearch({ city: item.value, checkin, checkout, guests });
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                city === item.value
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
