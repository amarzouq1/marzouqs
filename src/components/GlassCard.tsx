import { cn } from '@/lib/utils';
import type { ReactNode, HTMLAttributes } from 'react';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'dark' | 'cobalt' | 'gold';
  glow?: boolean;
  hover?: boolean;
  children: ReactNode;
}

export default function GlassCard({
  variant = 'default',
  glow = false,
  hover = false,
  className,
  children,
  ...props
}: GlassCardProps) {
  const base = 'relative overflow-hidden rounded-2xl transition-all duration-300';
  const variants = {
    default: 'glass',
    dark: 'glass-dark',
    cobalt: 'glass-cobalt',
    gold: 'bg-[rgba(255,215,0,0.05)] border border-[rgba(255,215,0,0.15)] backdrop-blur-glass rounded-2xl',
  };
  const glowClass = glow ? 'shadow-cobalt' : '';
  const hoverClass = hover
    ? 'hover:border-cobalt/30 hover:shadow-cobalt-lg hover:-translate-y-1 cursor-pointer'
    : '';

  return (
    <div
      className={cn(base, variants[variant], glowClass, hoverClass, className)}
      {...props}
    >
      {/* Shimmer overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background:
            'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%)',
          backgroundSize: '200% 100%',
        }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
