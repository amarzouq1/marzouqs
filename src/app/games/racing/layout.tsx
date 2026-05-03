import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Motorcycle Racing — Marzouq's Gaming Center",
  description: 'High-speed motorcycle racing with drift mechanics, nitro boosts, and AI opponents.',
};

export default function RacingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
