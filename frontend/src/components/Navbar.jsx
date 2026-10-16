import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Hotel, Clock, ShieldCheck, LogOut, ChevronDown } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import SignInModal from './SignInModal';

export default function Navbar() {
  const { user, isAdmin, loginWithGoogle, logout } = useAuth();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);

  const handleGoogleSuccess = async (response) => {
    try {
      await loginWithGoogle(response.credential);
    } catch (err) {
      alert("Sign-in error: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <Hotel className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-bold tracking-tight text-neutral-900">StayPulse</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-sky-100 text-sky-700 rounded-md">HOTELS</span>
              </div>
              <span className="text-xs text-neutral-500 block -mt-0.5">Hotel Directory & Slot Portal</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-8">
            <Link 
              to="/" 
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/' ? 'text-sky-600 font-semibold' : 'text-neutral-700 hover:text-neutral-900'
              }`}
            >
              Explore Stays
            </Link>

            <Link 
              to="/lookup" 
              className={`text-sm font-medium flex items-center space-x-1.5 transition-colors ${
                location.pathname === '/lookup' ? 'text-sky-600 font-semibold' : 'text-neutral-700 hover:text-neutral-900'
              }`}
            >
              <Clock className="w-4 h-4 text-sky-500" />
              <span>Reservation Lookup</span>
            </Link>

            {/* Admin Portal is STRICTLY HIDDEN unless user is signed in as an Admin */}
            {isAdmin && (
              <Link 
                to="/admin" 
                className={`text-sm font-medium flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all ${
                  location.pathname.startsWith('/admin') 
                    ? 'bg-amber-100 text-amber-900 font-semibold' 
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Admin Operations</span>
              </Link>
            )}
          </nav>

          {/* User Profile or Google Sign In */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 p-1.5 pr-3 rounded-full hover:bg-neutral-100 transition-colors border border-neutral-200 cursor-pointer"
                >
                  <img
                    src={user.profile_pic || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80"}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-sky-500/30"
                  />
                  <div className="text-left hidden sm:block">
                    <span className="block text-xs font-semibold text-neutral-900 max-w-[120px] truncate">{user.name}</span>
                    <span className={`block text-[10px] font-bold uppercase ${isAdmin ? 'text-amber-600' : 'text-neutral-400'}`}>
                      {isAdmin ? 'Administrator' : 'Guest Account'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-neutral-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-neutral-100">
                      <p className="text-xs font-medium text-neutral-500">Signed in as</p>
                      <p className="text-sm font-bold text-neutral-900 truncate">{user.name}</p>
                      <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/lookup"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      Lookup Booking Status
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-amber-700 font-semibold hover:bg-amber-50"
                      >
                        Admin Desk & Inventory
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center space-x-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="scale-95 origin-right">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setShowSignInModal(true)}
                    shape="pill"
                    size="medium"
                    text="signin"
                  />
                </div>
                <button
                  onClick={() => setShowSignInModal(true)}
                  className="px-3.5 py-1.5 rounded-full border border-neutral-300 hover:border-neutral-900 text-xs font-bold text-neutral-700 hover:bg-neutral-100 transition-all cursor-pointer flex items-center space-x-1"
                  title="Sign in with Email or Admin Account"
                >
                  <span>Sign In</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      <SignInModal 
        isOpen={showSignInModal} 
        onClose={() => setShowSignInModal(false)} 
      />
    </header>
  );
}
