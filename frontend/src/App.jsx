import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import HomePage from './pages/HomePage';
import HotelDetailPage from './pages/HotelDetailPage';
import BookingPage from './pages/BookingPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import LookupPage from './pages/LookupPage';
import AdminPortalPage from './pages/AdminPortalPage';

const GOOGLE_CLIENT_ID = "258416843143-n8u9hu9gpgoqes0navi3i5teao652s1n.apps.googleusercontent.com";

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-slate-50 text-neutral-900">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/hotels/:id" element={<HotelDetailPage />} />
                <Route path="/book/:id" element={<BookingPage />} />
                <Route path="/book/:hotelId/:roomId" element={<BookingPage />} />
                <Route path="/confirmation/:bookingId" element={<BookingConfirmationPage />} />
                <Route path="/lookup" element={<LookupPage />} />
                <Route path="/admin" element={<AdminPortalPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
