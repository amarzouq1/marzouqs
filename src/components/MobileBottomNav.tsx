'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gamepad2, Crown, BookOpen, Zap, User, Trophy } from 'lucide-react';

const tabs = [
  { href: '/',                       icon: Gamepad2,  label: 'Hub'      },
  { href: '/games/chess',            icon: Crown,     label: 'Chess'    },
  { href: '/games/academy',          icon: BookOpen,  label: 'Academy'  },
  { href: '/leaderboard',            icon: Trophy,    label: 'Scores'   },
  { href: '/profile',                icon: User,      label: 'Profile'  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden mobile-nav-safe"
      aria-label="Mobile navigation"
    >
      <div className="glass-dark border-t border-white/10 px-2 pt-2" style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
        <ul className="flex items-center justify-around">
          {tabs.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  className={`flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'text-cobalt-light'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div
                    className={`p-1.5 rounded-lg transition-all duration-200 ${
                      isActive ? 'bg-cobalt/20 shadow-cobalt' : ''
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <span className="text-[10px] font-medium">{label}</span>
                  {isActive && (
                    <span className="w-1 h-1 rounded-full bg-cobalt-light" aria-hidden="true" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
