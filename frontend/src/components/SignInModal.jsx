import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { X, Mail, ShieldCheck, UserCheck, AlertCircle, Sparkles } from 'lucide-react';

export default function SignInModal({ isOpen, onClose, defaultEmail = '' }) {
  const { loginWithGoogle, loginWithEmail } = useAuth();
  const [email, setEmail] = useState(defaultEmail);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [freezeSeconds, setFreezeSeconds] = useState(0);

  useEffect(() => {
    if (defaultEmail) {
      setEmail(defaultEmail);
    }
  }, [defaultEmail]);

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

  if (!isOpen) return null;

  const handleGoogleSuccess = async (response) => {
    setError('');
    setLoading(true);
    try {
      const user = await loginWithGoogle(response.credential);
      setSuccessMsg(`Welcome back, ${user.name}! ${user.role === 'admin' ? '(Admin Mode Active)' : ''}`);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (freezeSeconds > 0) return;
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address');
      return;
    }

    setFreezeSeconds(10);
    setError('');
    setLoading(true);

    try {
      const user = await loginWithEmail(email, name || null);
      setSuccessMsg(`Welcome, ${user.name}! ${user.role === 'admin' ? '(Administrator Privileges Enabled)' : 'Account Connected'}`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-3xl max-w-md w-full p-7 shadow-2xl border border-neutral-200 relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-md shadow-sky-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Sign in to StayPulse</h2>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto">
            Manage your hotel slots, download tax invoices, or access verified administrator operations.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. Official Google GIS One-Tap Button */}
        <div className="flex flex-col items-center justify-center py-2">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google popup was closed or origin was rejected')}
            shape="pill"
            size="large"
            text="signin_with"
            width="320"
          />
        </div>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-neutral-400 font-bold tracking-wider">or sign in with Google email</span>
          </div>
        </div>

        {/* 2. Direct Google Email Input */}
        <form onSubmit={handleEmailSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-neutral-700 mb-1">
              Google / Gmail Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jesusfromrehab@gmail.com or yourname@gmail.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 font-medium focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
              />
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-1">
              Display Name <span className="text-neutral-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Arnesh Sharma"
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 font-medium focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading || freezeSeconds > 0}
            className="w-full py-3 rounded-full bg-neutral-900 hover:bg-sky-600 text-white font-bold text-xs transition-all shadow-md shadow-neutral-900/10 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer mt-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : freezeSeconds > 0 ? (
              <span>Cooldown Locked ({freezeSeconds}s)</span>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Continue with Account</span>
              </>
            )}
          </button>
        </form>

        <p className="text-[11px] text-neutral-400 text-center mt-5">
          Admin account <span className="font-semibold text-neutral-600">jesusfromrehab@gmail.com</span> will automatically unlock administrator control.
        </p>
      </div>
    </div>
  );
}
