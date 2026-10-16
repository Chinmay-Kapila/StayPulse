import React from 'react';
import { Hotel, Shield, RefreshCw, CreditCard, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-sm">
                <Hotel className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-neutral-900">StayPulse</span>
            </div>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Standalone hotel directory, room slot inventory, and guest registration portal engineered for live multi-modal travel recovery tests with TinyFish & TripSaathi.
            </p>
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Test Sandbox Live (Razorpay + MongoDB)</span>
            </div>
          </div>

          {/* Quick Hubs */}
          <div>
            <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4">Travel Hubs</h4>
            <ul className="space-y-2.5 text-sm text-neutral-600">
              <li><Link to="/?city=Mumbai" className="hover:text-sky-600 transition-colors">Mumbai (Bandra & Airport T2)</Link></li>
              <li><Link to="/?city=New Delhi" className="hover:text-sky-600 transition-colors">New Delhi (Chanakyapuri & CP)</Link></li>
              <li><Link to="/?city=Bangalore" className="hover:text-sky-600 transition-colors">Bangalore (Residency Rd & Ulsoor)</Link></li>
              <li><Link to="/?city=Goa" className="hover:text-sky-600 transition-colors">Goa (Vagator & Candolim Beach)</Link></li>
            </ul>
          </div>

          {/* Recovery Testing Features */}
          <div>
            <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4">Crawler & Testing Features</h4>
            <ul className="space-y-2.5 text-sm text-neutral-600">
              <li className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-sky-500" />
                <span>Machine-Readable Check-in Badges</span>
              </li>
              <li className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 text-teal-500" />
                <span>Guaranteed Late Arrival Hold</span>
              </li>
              <li className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-amber-500" />
                <span>Zero Upfront "Pay at Hotel"</span>
              </li>
              <li className="flex items-center space-x-2">
                <ExternalLink className="w-4 h-4 text-purple-500" />
                <span>Admin Disruption Conflict Triggers</span>
              </li>
            </ul>
          </div>

          {/* Direct Portals */}
          <div>
            <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4">Direct Portals</h4>
            <ul className="space-y-2.5 text-sm text-neutral-600">
              <li><Link to="/lookup" className="hover:text-sky-600 transition-colors font-medium">Lookup Reservation & Hold Room</Link></li>
              <li><Link to="/admin" className="hover:text-amber-600 transition-colors font-medium">Admin Conflict Simulator</Link></li>
              <li><a href="http://localhost:9000/docs" target="_blank" rel="noreferrer" className="hover:text-sky-600 transition-colors font-medium">FastAPI Swagger Docs (Port 9000)</a></li>
              <li><span className="text-xs text-neutral-400">Razorpay Test Mode Verified</span></li>
            </ul>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-neutral-100 flex flex-col sm:flex-row justify-between items-center text-xs text-neutral-400">
          <p>© 2026 StayPulse Hotels Portal. Built for TinyFish Crawler & TripSaathi Pair Programming.</p>
          <p className="mt-2 sm:mt-0">Frontend Port 5000 | Backend Port 9000</p>
        </div>
      </div>
    </footer>
  );
}
