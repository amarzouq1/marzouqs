import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apex Platformer — Legendary Icons',
  description: 'Precision platforming with tight controls, enemies to stomp, coins to collect, and stages to conquer. 60 FPS Canvas2D action.',
};

export default function PlatformerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
