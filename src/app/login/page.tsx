'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff, Gamepad2, ArrowRight, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ADMIN_PIN = 'admin2024';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [mode, setMode] = useState<'player' | 'admin'>('player');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // If already logged in, redirect
    const stored = localStorage.getItem('mgc_username');
    if (stored) router.replace('/profile');
  }, [router]);

  const handlePlayerLogin = () => {
    if (!username.trim()) { setError('Enter a username to continue.'); return; }
    if (username.trim().length < 2) { setError('Username must be at least 2 characters.'); return; }
    localStorage.setItem('mgc_username', username.trim());
    setSuccess('Welcome, ' + username.trim() + '!');
    setTimeout(() => router.push('/profile'), 800);
  };

  const handleAdminLogin = () => {
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem('mgc_admin_auth', pin);
      setSuccess('Admin access granted!');
      setTimeout(() => router.push('/admin'), 800);
    } else {
      setError('Wrong PIN. Hint: admin2024');
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center relative overflow-hidden px-4">
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cobalt/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cobalt-bright/10 rounded-full blur-[80px]" style={{ animationDelay: '1s' }} />
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />
      </div>

      {/* 3D card wrapper */}
      <motion.div
        initial={{ opacity: 0, y: 40, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 80 }}
        className="w-full max-w-md relative z-10"
        style={{ perspective: '1000px' }}
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cobalt-gradient shadow-cobalt mb-4 relative">
            <Gamepad2 size={28} className="text-white" />
            <div className="absolute inset-0 rounded-2xl bg-cobalt/30 blur-xl -z-10 scale-150" />
          </div>
          <h1 className="text-2xl font-black text-white mb-1">
            <span className="text-cobalt-gradient">{"Marzouq's"}</span> Gaming
          </h1>
          <p className="text-white/40 text-sm">Enter the arena</p>
        </motion.div>

        {/* Mode toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex gap-2 mb-6 glass p-1 rounded-xl"
        >
          <button
            onClick={() => { setMode('player'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === 'player' ? 'bg-cobalt-gradient text-white shadow-cobalt' : 'text-white/50 hover:text-white/80'
            }`}
          >
            <User size={15} /> Player Login
          </button>
          <button
            onClick={() => { setMode('admin'); setError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mode === 'admin' ? 'bg-cobalt-gradient text-white shadow-cobalt' : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Shield size={15} /> Admin
          </button>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-dark rounded-2xl p-6 border border-cobalt/20 relative overflow-hidden"
        >
          {/* Shimmer border */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
            background: 'linear-gradient(135deg, rgba(0,71,255,0.1) 0%, transparent 50%, rgba(0,170,255,0.05) 100%)'
          }} />

          {mode === 'player' ? (
            <div className="relative space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                  Username
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => { setUsername(e.target.value); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handlePlayerLogin()}
                    placeholder="Enter your name..."
                    maxLength={24}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-cobalt/50 focus:bg-white/10 transition-all text-sm"
                  />
                </div>
                <p className="text-white/30 text-xs mt-1.5">Your name will appear on the leaderboard</p>
              </div>

              <button
                onClick={handlePlayerLogin}
                className="btn-cobalt w-full justify-center text-sm"
              >
                Enter the Arena <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="relative space-y-4">
              <div className="text-center pb-2">
                <div className="w-12 h-12 rounded-xl bg-cobalt/20 flex items-center justify-center mx-auto mb-3 border border-cobalt/30">
                  <Shield size={22} className="text-cobalt-light" />
                </div>
                <p className="text-white/50 text-sm">Admin access requires the master PIN</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                  Admin PIN
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={e => { setPin(e.target.value); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
                    placeholder="Enter admin PIN..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-white placeholder-white/25 focus:outline-none focus:border-cobalt/50 transition-all text-sm tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleAdminLogin}
                className="btn-cobalt w-full justify-center text-sm"
              >
                Access Dashboard <Shield size={16} />
              </button>
            </div>
          )}

          {/* Error / success */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg py-2 px-3"
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-green-400 text-sm text-center bg-green-500/10 border border-green-500/20 rounded-lg py-2 px-3"
            >
              {success}
            </motion.div>
          )}
        </motion.div>

        {/* Footer links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-5 flex justify-center gap-6 text-sm"
        >
          <Link href="/" className="text-white/30 hover:text-white/60 transition-colors">← Back to Hub</Link>
          <Link href="/profile" className="text-white/30 hover:text-white/60 transition-colors">Profile</Link>
          <Link href="/leaderboard" className="text-white/30 hover:text-white/60 transition-colors">Leaderboard</Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
