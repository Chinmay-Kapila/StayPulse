import React, { useState, useEffect } from 'react';
import HeroSearch from '../components/HeroSearch';
import HotelCard from '../components/HotelCard';
import { getHotels, getChains } from '../services/api';
import { Filter, Star, Sparkles, Building, ShieldCheck, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';

export default function HomePage() {
  const [hotels, setHotels] = useState([]);
  const [chains, setChains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: '',
    checkin: '',
    checkout: '',
    guests: 2,
    star_rating: null,
    min_price: null,
    max_price: null,
    brand: '',
    sort: 'recommended',
  });

  const fetchHotels = async (searchParams = {}) => {
    setLoading(true);
    try {
      const merged = { ...filters, ...searchParams };
      setFilters(merged);
      const data = await getHotels(merged);
      setHotels(data);
    } catch (err) {
      console.error('Error fetching hotels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
    getChains().then(setChains).catch(console.error);
  }, []);

  const handleSearch = (searchParams) => {
    fetchHotels(searchParams);
  };

  return (
    <div className="min-h-screen">
      
      {/* Hero Section */}
      <HeroSearch
        onSearch={handleSearch}
        initialCity={filters.city}
        initialCheckin={filters.checkin}
        initialCheckout={filters.checkout}
        initialGuests={filters.guests}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
        
        {/* Filter & Sort Bar */}
        <div className="bg-white p-4 rounded-3xl border border-neutral-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
          
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center space-x-1 mr-2">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </span>

            {/* Star Rating Filters */}
            <button
              onClick={() => fetchHotels({ star_rating: filters.star_rating === 5 ? null : 5 })}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center space-x-1 ${
                filters.star_rating === 5 
                  ? 'bg-amber-500 text-white shadow-xs' 
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>5-Star Luxury</span>
            </button>

            <button
              onClick={() => fetchHotels({ star_rating: filters.star_rating === 4 ? null : 4 })}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center space-x-1 ${
                filters.star_rating === 4 
                  ? 'bg-sky-600 text-white shadow-xs' 
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <span>4+ Stars</span>
            </button>

            {/* Price Filter */}
            <button
              onClick={() => fetchHotels({ max_price: filters.max_price === 6000 ? null : 6000 })}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filters.max_price === 6000 
                  ? 'bg-teal-600 text-white shadow-xs' 
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <span>Under ₹6,000 / night</span>
            </button>

            {/* Reset Filter */}
            {(filters.star_rating || filters.max_price || filters.city || filters.brand) && (
              <button
                onClick={() => fetchHotels({ star_rating: null, min_price: null, max_price: null, city: '', brand: '' })}
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-neutral-500">Sort by:</span>
            <select
              value={filters.sort}
              onChange={(e) => fetchHotels({ sort: e.target.value })}
              className="text-xs font-bold text-neutral-800 bg-neutral-100 rounded-full px-3 py-1.5 border-none focus:outline-none cursor-pointer"
            >
              <option value="recommended">Recommended & Star Rating</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating_desc">Highest Rated</option>
            </select>
          </div>

        </div>

        {/* Featured Hotels Grid */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                Featured Places to Stay
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                {hotels.length} verified hotels available for slot locking & TinyFish crawler testing
              </p>
            </div>
            <button
              onClick={() => fetchHotels()}
              className="p-2 rounded-full hover:bg-neutral-100 text-neutral-500 transition-colors"
              title="Refresh Listings"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white rounded-3xl p-4 border border-neutral-200 animate-pulse space-y-4">
                  <div className="aspect-4/3 bg-neutral-200 rounded-2xl"></div>
                  <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                  <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                  <div className="h-8 bg-neutral-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : hotels.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200">
              <Building className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-neutral-800">No hotels matched your criteria</h3>
              <p className="text-sm text-neutral-500 mt-1">Try clearing destination or price filters to see available hotels.</p>
              <button
                onClick={() => fetchHotels({ city: '', star_rating: null, min_price: null, max_price: null, brand: '' })}
                className="mt-4 px-5 py-2.5 rounded-full bg-neutral-900 text-white text-xs font-bold"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {hotels.map((hotel) => (
                <HotelCard key={hotel.id || hotel._id} hotel={hotel} />
              ))}
            </div>
          )}
        </div>

        {/* Hotel Chains Showcase */}
        {chains.length > 0 && (
          <div className="pt-8 border-t border-neutral-200">
            <h3 className="text-xl font-bold text-neutral-900 tracking-tight mb-6">
              Featured Luxury Chains & Brands
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {chains.map((chain, idx) => (
                <button
                  key={idx}
                  onClick={() => fetchHotels({ brand: chain.name })}
                  className="p-4 rounded-2xl bg-white border border-neutral-200/80 hover:border-sky-500 hover:shadow-md transition-all text-left flex items-center space-x-3 group"
                >
                  <img
                    src={chain.logo}
                    alt={chain.name}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 group-hover:text-sky-600 transition-colors">
                      {chain.name}
                    </h4>
                    <span className="text-[10px] text-neutral-500 block">{chain.tier}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Features / Why StayPulse (Matching DemoHotel benefits) */}
        <div className="pt-8 border-t border-neutral-200">
          <div className="max-w-2xl mb-10">
            <span className="uppercase text-xs font-bold text-sky-600 tracking-widest">WHY STAYPULSE</span>
            <h2 className="text-3xl font-bold text-neutral-900 mt-2">Engineered for Seamless Stays & Disruption Recovery</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="p-6 rounded-3xl bg-sky-50/60 border border-sky-100 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="text-lg font-bold text-neutral-900">Guaranteed Late Check-in Hold</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Provide flight delay numbers to lock your room past standard cut-off hours (e.g. 20:00). Prevents hotels releasing your room slot to walk-in guests.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-teal-50/60 border border-teal-100 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="text-lg font-bold text-neutral-900">Zero Upfront "Pay at Hotel"</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Lock your reservation slot instantly without upfront card charges, or choose live Razorpay sandbox integration with verified signature tokens.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-indigo-50/60 border border-indigo-100 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="text-lg font-bold text-neutral-900">Autonomous Crawler Verification</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                All elements carry semantic <code className="text-xs bg-indigo-100 text-indigo-900 px-1 py-0.5 rounded">data-testid</code> tags designed for headless AI browser agents like TinyFish.
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
