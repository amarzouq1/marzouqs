import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Velocity Runner — Legendary Icons',
  description: 'High-speed momentum platformer. Build speed with spin dashes, collect rings, stomp enemies, and blaze through handcrafted zones at 60 FPS.',
};

export default function SonicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
