'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, BookOpen, BookOpenCheck, Zap, User, Menu, X, Gamepad2, Trophy, Medal, Shield, LogIn } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Hub', icon: Gamepad2 },
  { href: '/games/chess', label: 'Chess', icon: Crown },
  {
    href: '/games/academy',
    label: 'Academy',
    icon: BookOpen,
    children: [
      { href: '/games/academy', label: '🏫 Academy Hub' },
      { href: '/games/academy/math', label: '🔢 Math Arena' },
      { href: '/games/academy/battle', label: '⚔️ Math Battle' },
      { href: '/games/academy/physics', label: '⚛️ Physics Lab' },
      { href: '/games/academy/language', label: '🗣️ Language Dojo' },
      { href: '/games/academy/reading', label: '📖 Reading Challenge' },
      { href: '/games/academy/mathdog', label: '🐶 Math Dog' },
      { href: '/games/academy/speak', label: '🎤 How to Speak' },
      { href: '/games/academy/signs', label: '🤟 Sign Language' },
      { href: '/games/academy/arabic', label: '🇸🇦 Arabic' },
      { href: '/games/academy/russian', label: '🇷🇺 Russian' },
      { href: '/games/academy/chinese', label: '🇨🇳 Chinese' },
    ],
  },
  {
    href: '/games/sonic',
    label: 'Arcade',
    icon: Zap,
    children: [
      { href: '/games/sonic', label: '🏃 Velocity Runner' },
      { href: '/games/platformer', label: '🦅 Apex Platformer' },
      { href: '/games/racing', label: '🏍️ Motorcycle Racing' },
      { href: '/games/train', label: '🚂 Train Surf' },
    ],
  },
  { href: '/curriculum', label: 'Curriculum', icon: BookOpenCheck },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/rewards', label: 'Rewards', icon: Medal },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/admin', label: 'Admin', icon: Shield },
];

export default function Navigation() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    setUsername(localStorage.getItem('mgc_username'));
    const handler = () => setUsername(localStorage.getItem('mgc_username'));
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 hidden md:block transition-all duration-300 ${
          scrolled ? 'py-2' : 'py-4'
        }`}
      >
        <div
          className={`fluid-container transition-all duration-300 ${
            scrolled ? 'glass-dark rounded-2xl border border-white/5 shadow-xl' : ''
          }`}
        >
          <nav className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group" aria-label="Marzouq's Gaming Center Home">
              <div className="w-9 h-9 rounded-xl bg-cobalt-gradient flex items-center justify-center shadow-cobalt group-hover:shadow-cobalt-lg transition-shadow duration-300">
                <Gamepad2 size={18} className="text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">
                <span className="text-cobalt-gradient">Marzouq&apos;s</span>
                <span className="text-white/80 ml-1">Gaming</span>
              </span>
            </Link>

            {/* Nav links */}
            <ul className="flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                const Icon = link.icon;

                return (
                  <li
                    key={link.href}
                    className="relative"
                    onMouseEnter={() => link.children && setActiveDropdown(link.href)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <Link
                      href={link.href}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-cobalt/20 text-cobalt-light border border-cobalt/30'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon size={14} />
                      {link.label}
                    </Link>

                    {/* Dropdown */}
                    {link.children && (
                      <AnimatePresence>
                        {activeDropdown === link.href && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.97 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 mt-2 w-48 glass-dark rounded-xl overflow-hidden shadow-xl border border-white/10 z-50"
                          >
                            {link.children.map((child) => (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={`block px-4 py-2.5 text-sm transition-colors duration-150 ${
                                  pathname === child.href
                                    ? 'text-cobalt-light bg-cobalt/10'
                                    : 'text-white/70 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                {child.label}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* CTA */}
            {username ? (
              <Link href="/profile" className="btn-cobalt text-sm px-4 py-2">
                {username}
              </Link>
            ) : (
              <Link href="/login" className="btn-cobalt text-sm px-4 py-2">
                <LogIn size={14} /> Sign In
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50 md:hidden">
        <div className="flex items-center justify-between px-4 py-3 glass-dark border-b border-white/5">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cobalt-gradient flex items-center justify-center">
              <Gamepad2 size={15} className="text-white" />
            </div>
            <span className="font-bold text-sm text-cobalt-gradient">Marzouq&apos;s Gaming</span>
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl glass text-white/70 hover:text-white transition-colors"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="glass-dark border-b border-white/5 overflow-hidden"
            >
              <nav className="px-4 py-3 space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <div key={link.href}>
                      <Link
                        href={link.href}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Icon size={16} className="text-cobalt-light" />
                        {link.label}
                      </Link>
                      {link.children && (
                        <div className="ml-9 mt-0.5 space-y-0.5">
                          {link.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="block px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/80 transition-colors"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
