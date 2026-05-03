'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Gamepad2 } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-cobalt/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* Glitchy 404 */}
        <div className="relative mb-6 inline-block">
          <div className="text-[120px] font-black leading-none select-none">
            <span className="text-cobalt-gradient">4</span>
            <span className="text-white/10">0</span>
            <span className="text-cobalt-gradient">4</span>
          </div>
          {/* Scanline effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,71,255,0.15) 2px, rgba(0,71,255,0.15) 4px)' }} />
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">Stage Not Found</h1>
        <p className="text-white/50 mb-8 leading-relaxed">
          {"This level doesn't exist in our world. Maybe it's still being built, or you took a wrong turn at the flagpole."}
        </p>

        <div className="flex gap-3 justify-center">
          <Link href="/" className="btn-cobalt flex items-center gap-2">
            <Home size={15} /> Back to Hub
          </Link>
          <Link href="/games/chess" className="btn-glass flex items-center gap-2">
            <Gamepad2 size={15} /> Play Chess
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
