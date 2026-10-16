import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  adminListHotels, adminCreateHotel, adminUpdateHotel, adminDeleteHotel,
  adminCreateRoom, adminDeleteRoom, adminListReservations,
  adminUpdateReservationStatus, adminCancelReservation, adminResetSeed 
} from '../services/api';
import { 
  ShieldCheck, ShieldAlert, Hotel, Calendar, AlertTriangle, Clock, 
  CheckCircle2, Plus, Trash2, RefreshCw, Layers, Edit3, X, XCircle, LogIn 
} from 'lucide-react';
import SignInModal from '../components/SignInModal';

export default function AdminPortalPage() {
  const { user, isAdmin, loginWithGoogle } = useAuth();
  const [showSignInModal, setShowSignInModal] = useState(false);
  
  const [activeTab, setActiveTab] = useState('reservations');
  const [reservations, setReservations] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionSuccess, setActionSuccess] = useState('');

  // 10-Second Submit Freeze Lock
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

  // New Hotel Form State
  const [showAddHotelModal, setShowAddHotelModal] = useState(false);
  const [newHotelName, setNewHotelName] = useState('');
  const [newHotelBrand, setNewHotelBrand] = useState('StayPulse Luxury');
  const [newHotelCity, setNewHotelCity] = useState('Mumbai');
  const [newHotelAddress, setNewHotelAddress] = useState('');
  const [newHotelStarRating, setNewHotelStarRating] = useState(5);
  const [newHotelStartingPrice, setNewHotelStartingPrice] = useState(6999);
  const [newHotelCutoff, setNewHotelCutoff] = useState('20:00');

  // New Room Form State
  const [selectedHotelForRoom, setSelectedHotelForRoom] = useState(null);
  const [newRoomType, setNewRoomType] = useState('Deluxe King Room');
  const [newRoomPrice, setNewRoomPrice] = useState(5499);
  const [newRoomSlots, setNewRoomSlots] = useState(10);

  const fetchData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const [resData, hotelData] = await Promise.all([
        adminListReservations(statusFilter === 'ALL' ? null : statusFilter),
        adminListHotels(),
      ]);
      setReservations(resData);
      setHotels(hotelData);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [statusFilter, isAdmin]);

  // Protect Admin Access - Hidden from regular users
  if (!user || !isAdmin) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl border border-neutral-200 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-9 h-9" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Access Restricted</h2>
          <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
            This management console is restricted to authorized StayPulse administrators (<strong>jesusfromrehab@gmail.com</strong>).
          </p>
        </div>

        {!user ? (
          <div className="pt-2 flex flex-col items-center space-y-3">
            <span className="text-xs text-neutral-600 font-medium">Please sign in with your authorized administrator account:</span>
            <button
              onClick={() => setShowSignInModal(true)}
              className="px-6 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 shadow-md shadow-neutral-900/10"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In with Administrator Account</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-neutral-100 text-xs text-neutral-600">
              Current account: <strong className="text-neutral-900">{user.email}</strong> does not possess administrator privileges in MongoDB.
            </div>
            <button
              onClick={() => setShowSignInModal(true)}
              className="px-4 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Switch to Admin Account
            </button>
          </div>
        )}

        <SignInModal
          isOpen={showSignInModal}
          onClose={() => setShowSignInModal(false)}
          defaultEmail="jesusfromrehab@gmail.com"
        />
      </div>
    );
  }

  const handleStatusChange = async (resId, newStatus) => {
    if (freezeSeconds > 0) return;
    setFreezeSeconds(10);
    try {
      await adminUpdateReservationStatus(resId, newStatus, `Status updated to ${newStatus} by Administrator`);
      setActionSuccess(`Booking status updated to ${newStatus}!`);
      fetchData();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      alert("Status update failed: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleAdminCancelBooking = async (res) => {
    if (freezeSeconds > 0) return;
    const reason = window.prompt(`Confirm cancellation for Booking ${res.booking_id}:`, "Cancelled by Administrator");
    if (!reason) return;

    setFreezeSeconds(10);
    try {
      await adminCancelReservation(res.id || res._id, reason);
      setActionSuccess(`Booking ${res.booking_id} cancelled and room slot restored!`);
      fetchData();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      alert("Cancellation failed: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteHotel = async (hotel) => {
    if (freezeSeconds > 0) return;
    const confirmMsg = `WARNING: Are you sure you want to delete '${hotel.name}'?\n\nPer StayPulse compliance rules, all active user reservations for this hotel will NOT be deleted, but will automatically be transitioned to CANCELLED status with full refunds authorized.`;
    if (!window.confirm(confirmMsg)) return;

    setFreezeSeconds(10);
    try {
      const res = await adminDeleteHotel(hotel.id || hotel._id);
      setActionSuccess(res.message || "Hotel deleted and associated user bookings cancelled.");
      fetchData();
      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err) {
      alert("Error deleting hotel: " + err.message);
    }
  };

  const handleResetDatabase = async () => {
    if (freezeSeconds > 0) return;
    if (!window.confirm("Reset MongoDB staypulse_db to pristine initial state (8 hotels, 16 room slots)?")) return;
    setFreezeSeconds(10);
    try {
      await adminResetSeed();
      setActionSuccess("Database reset to initial state!");
      fetchData();
    } catch (err) {
      alert("Reset failed: " + err.message);
    }
  };

  const handleAddHotel = async (e) => {
    e.preventDefault();
    if (freezeSeconds > 0) return;
    setFreezeSeconds(10);
    try {
      await adminCreateHotel({
        name: newHotelName,
        brand: newHotelBrand,
        city: newHotelCity,
        address: newHotelAddress,
        star_rating: Number(newHotelStarRating),
        starting_price: Number(newHotelStartingPrice),
        images: [
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop&q=80"
        ],
        contact: {
          phone: "+91 22 8888 9999",
          email: `concierge.${newHotelCity.toLowerCase()}@staypulse.com`
        },
        timings: {
          standard_checkin: "14:00",
          standard_checkout: "12:00",
          cutoff_time: newHotelCutoff,
          allow_late_checkin: true
        },
        cancellation_policy: {
          free_cancellation_until_hours: 24,
          cancellation_fee: 1000,
          policy_text: "Free cancellation up to 24h before arrival. Late arrival notice recommended."
        },
        amenities: ["Free WiFi", "24/7 Front Desk", "Air Conditioning", "Restaurant"]
      });
      setShowAddHotelModal(false);
      setActionSuccess(`Hotel '${newHotelName}' created successfully!`);
      fetchData();
    } catch (err) {
      alert("Error adding hotel: " + err.message);
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (freezeSeconds > 0) return;
    setFreezeSeconds(10);
    try {
      await adminCreateRoom(selectedHotelForRoom.id || selectedHotelForRoom._id, {
        hotel_id: selectedHotelForRoom.id || selectedHotelForRoom._id,
        room_type: newRoomType,
        description: `Spacious luxury contemporary room with plush posturepedic bedding and modern bath.`,
        capacity: { adults: 2, children: 1 },
        price_per_night: Number(newRoomPrice),
        total_slots: Number(newRoomSlots),
        available_slots: Number(newRoomSlots),
        amenities: ["Free High-Speed WiFi", "Breakfast Included", "Work Desk", "Air Conditioning"],
        image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80"
      });
      setSelectedHotelForRoom(null);
      setActionSuccess(`Room slot '${newRoomType}' added!`);
      fetchData();
    } catch (err) {
      alert("Error adding room: " + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-neutral-200 shadow-xs">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">StayPulse Administration Console</h1>
              <span className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-xs">
                Admin: {user.email}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Manage live inventory, cancel any reservation, and set multi-purpose statuses (WAITING, APPROVED, CANCELLED, EXPIRED)
            </p>
          </div>
        </div>

        {/* Global Reset Button with 10s countdown */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleResetDatabase}
            disabled={freezeSeconds > 0}
            className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            title="Reset DB to initial seed"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{freezeSeconds > 0 ? `Lock (${freezeSeconds}s)` : 'Reset Seed Data'}</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">Total Hotels</span>
          <span className="text-2xl font-extrabold text-neutral-900 mt-1 block">{hotels.length}</span>
          <span className="text-xs text-neutral-500">Across Indian travel hubs</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">Total Bookings</span>
          <span className="text-2xl font-extrabold text-sky-600 mt-1 block">{reservations.length}</span>
          <span className="text-xs text-neutral-500">In staypulse_db</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">Approved / Confirmed</span>
          <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
            {reservations.filter(r => r.status === 'CONFIRMED' || r.status === 'APPROVED' || r.status === 'LATE_ARRIVAL_APPROVED').length}
          </span>
          <span className="text-xs text-emerald-700">Active checked/confirmed</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">Cancelled Bookings</span>
          <span className="text-2xl font-extrabold text-rose-600 mt-1 block">
            {reservations.filter(r => r.status === 'CANCELLED').length}
          </span>
          <span className="text-xs text-rose-700">Preserved in registry</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-neutral-200 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('reservations')}
          className={`pb-3 transition-colors border-b-2 flex items-center space-x-2 cursor-pointer ${
            activeTab === 'reservations' 
              ? 'border-neutral-900 text-neutral-900 font-bold' 
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>All User Bookings & Status Control ({reservations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('hotels')}
          className={`pb-3 transition-colors border-b-2 flex items-center space-x-2 cursor-pointer ${
            activeTab === 'hotels' 
              ? 'border-neutral-900 text-neutral-900 font-bold' 
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Hotel className="w-4 h-4" />
          <span>Hotels & Room Inventory ({hotels.length})</span>
        </button>
      </div>

      {/* TAB 1: ALL USER BOOKINGS & STATUS CONTROL */}
      {activeTab === 'reservations' && (
        <div className="space-y-4">
          
          {/* Status Filter Bar */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2 text-xs flex-wrap gap-y-1">
              <span className="font-bold text-neutral-400 uppercase tracking-wider">Filter:</span>
              {['ALL', 'APPROVED', 'CONFIRMED', 'WAITING', 'CANCELLED', 'EXPIRED', 'CHECKIN_AT_RISK', 'LATE_ARRIVAL_APPROVED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                    statusFilter === st 
                      ? 'bg-neutral-900 text-white' 
                      : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              onClick={fetchData}
              className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Bookings Table */}
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Booking ID</th>
                    <th className="px-5 py-3.5">Hotel & Room</th>
                    <th className="px-5 py-3.5">Guest Info</th>
                    <th className="px-5 py-3.5">Dates / Arrival</th>
                    <th className="px-5 py-3.5">Fee / Payment</th>
                    <th className="px-5 py-3.5">Current Status</th>
                    <th className="px-5 py-3.5 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium">
                  {reservations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-neutral-500">
                        No registrations found in this category.
                      </td>
                    </tr>
                  ) : (
                    reservations.map((res) => (
                      <tr key={res.id || res._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4 font-mono font-bold text-sky-700">
                          {res.booking_id}
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-bold text-neutral-900 block">{res.hotel_name}</span>
                          <span className="text-neutral-500">{res.room_type}</span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-bold text-neutral-900 block">{res.guest?.name}</span>
                          <span className="text-neutral-500">{res.guest?.email}</span>
                          <span className="text-neutral-400 block text-[11px]">{res.guest?.phone}</span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-neutral-800 block">{res.checkin_date} to {res.checkout_date}</span>
                          <span className="text-sky-700 font-bold block mt-0.5">{res.expected_arrival_time}</span>
                          {res.special_requests && (
                            <span className="block text-[10px] text-neutral-500 mt-0.5 max-w-[140px] truncate" title={res.special_requests}>
                              {res.special_requests}
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-bold text-neutral-900 block">
                            ₹{(res.pricing?.total_fee || res.payment?.total_fee || 0).toLocaleString('en-IN')}
                          </span>
                          <span className="text-neutral-500">{res.payment?.mode === 'PAY_AT_PROPERTY' ? 'Pay at Hotel' : 'Online Paid'}</span>
                        </td>

                        {/* Status Dropdown/Selector */}
                        <td className="px-5 py-4">
                          <select
                            disabled={freezeSeconds > 0}
                            value={res.status}
                            onChange={(e) => handleStatusChange(res.id || res._id, e.target.value)}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold border cursor-pointer focus:outline-none ${
                              res.status === 'CONFIRMED' || res.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                              res.status === 'WAITING' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                              res.status === 'CANCELLED' ? 'bg-rose-50 text-rose-800 border-rose-300' :
                              res.status === 'EXPIRED' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                              res.status === 'CHECKIN_AT_RISK' ? 'bg-rose-100 text-rose-900 border-rose-300 animate-pulse' :
                              'bg-indigo-50 text-indigo-800 border-indigo-300'
                            }`}
                          >
                            <option value="APPROVED">APPROVED</option>
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="WAITING">WAITING</option>
                            <option value="CHECKIN_AT_RISK">CHECKIN_AT_RISK</option>
                            <option value="LATE_ARRIVAL_APPROVED">LATE_ARRIVAL_APPROVED</option>
                            <option value="CHECKED_IN">CHECKED_IN</option>
                            <option value="EXPIRED">EXPIRED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </td>

                        {/* Direct Cancel Booking for User */}
                        <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                          {res.status !== 'CANCELLED' ? (
                            <button
                              disabled={freezeSeconds > 0}
                              onClick={() => handleAdminCancelBooking(res)}
                              className="px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 transition-colors disabled:opacity-50 cursor-pointer"
                              title="Cancel this user's reservation and restore slot"
                            >
                              Cancel Booking
                            </button>
                          ) : (
                            <span className="text-[11px] text-neutral-400 italic">Cancelled</span>
                          )}
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HOTELS & ROOM INVENTORY */}
      {activeTab === 'hotels' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Registered Hotels & Slot Inventory</h2>
              <p className="text-xs text-neutral-500">Live database properties</p>
            </div>

            <button
              disabled={freezeSeconds > 0}
              onClick={() => setShowAddHotelModal(true)}
              className="px-4 py-2 rounded-full bg-neutral-900 hover:bg-sky-600 text-white text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Add Hotel Listing</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hotels.map((hotel) => (
              <div key={hotel.id || hotel._id} className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-2xs space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{hotel.brand} • {hotel.city}</span>
                    <h3 className="text-lg font-bold text-neutral-900 mt-0.5">{hotel.name}</h3>
                    <p className="text-xs text-neutral-500">{hotel.address}</p>
                  </div>

                  {/* Hotel Delete Button with Cascading User Cancellation */}
                  <button
                    disabled={freezeSeconds > 0}
                    onClick={() => handleDeleteHotel(hotel)}
                    className="p-2 text-neutral-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors disabled:opacity-50 cursor-pointer"
                    title="Delete Hotel (Cascades cancellation to active user bookings)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-neutral-500 block">Cut-off Deadline</span>
                    <strong className="text-neutral-800">{hotel.timings?.cutoff_time || '20:00'}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Starting Rate</span>
                    <strong className="text-neutral-800">₹{(hotel.starting_price || 3499).toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Free Cancellation</span>
                    <strong className="text-neutral-800">{hotel.cancellation_policy?.free_cancellation_until_hours || 24}h prior</strong>
                  </div>
                </div>

                {/* Rooms List */}
                <div className="space-y-2 pt-2 border-t border-neutral-100">
                  <div className="flex items-center justify-between text-xs font-bold text-neutral-700">
                    <span>Room Slots ({hotel.rooms?.length || 0})</span>
                    <button
                      onClick={() => setSelectedHotelForRoom(hotel)}
                      className="text-sky-600 hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Room Slot</span>
                    </button>
                  </div>

                  {(hotel.rooms || []).map((r) => (
                    <div key={r.id || r._id} className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-neutral-900">{r.room_type}</span>
                        <span className="text-neutral-500 block text-[11px]">₹{r.price_per_night?.toLocaleString('en-IN')} / night</span>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          {r.available_slots} / {r.total_slots} slots left
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Hotel Modal */}
      {showAddHotelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <h3 className="text-base font-bold text-neutral-900">Add New Hotel Listing</h3>
              <button onClick={() => setShowAddHotelModal(false)} className="p-1 rounded-full text-neutral-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddHotel} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Hotel Name *</label>
                <input
                  type="text"
                  required
                  value={newHotelName}
                  onChange={(e) => setNewHotelName(e.target.value)}
                  placeholder="e.g. Grand Hyatt Mumbai"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Brand / Chain</label>
                  <input
                    type="text"
                    value={newHotelBrand}
                    onChange={(e) => setNewHotelBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Destination City *</label>
                  <select
                    value={newHotelCity}
                    onChange={(e) => setNewHotelCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-medium cursor-pointer"
                  >
                    <option value="Mumbai">Mumbai</option>
                    <option value="New Delhi">New Delhi</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Goa">Goa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Address *</label>
                <input
                  type="text"
                  required
                  value={newHotelAddress}
                  onChange={(e) => setNewHotelAddress(e.target.value)}
                  placeholder="Street, Area, City"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Star Rating</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={newHotelStarRating}
                    onChange={(e) => setNewHotelStarRating(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Starting Price (₹)</label>
                  <input
                    type="number"
                    value={newHotelStartingPrice}
                    onChange={(e) => setNewHotelStartingPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Cut-off Deadline</label>
                  <input
                    type="text"
                    value={newHotelCutoff}
                    onChange={(e) => setNewHotelCutoff(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddHotelModal(false)}
                  className="flex-1 py-2.5 rounded-full border border-neutral-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={freezeSeconds > 0}
                  className="flex-1 py-2.5 rounded-full bg-neutral-900 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {freezeSeconds > 0 ? `Lock (${freezeSeconds}s)` : 'Save Hotel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {selectedHotelForRoom && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-neutral-900">Add Room Slot</h3>
                <p className="text-xs text-neutral-500">For {selectedHotelForRoom.name}</p>
              </div>
              <button onClick={() => setSelectedHotelForRoom(null)} className="p-1 rounded-full text-neutral-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRoom} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Room Slot Type *</label>
                <input
                  type="text"
                  required
                  value={newRoomType}
                  onChange={(e) => setNewRoomType(e.target.value)}
                  placeholder="e.g. Deluxe Sea-View King Room"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Price per Night (₹)</label>
                  <input
                    type="number"
                    value={newRoomPrice}
                    onChange={(e) => setNewRoomPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Total Inventory Slots</label>
                  <input
                    type="number"
                    value={newRoomSlots}
                    onChange={(e) => setNewRoomSlots(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedHotelForRoom(null)}
                  className="flex-1 py-2.5 rounded-full border border-neutral-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={freezeSeconds > 0}
                  className="flex-1 py-2.5 rounded-full bg-neutral-900 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {freezeSeconds > 0 ? `Lock (${freezeSeconds}s)` : 'Add Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
