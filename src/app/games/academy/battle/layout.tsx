import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Math Battle Arena — Marzouq's Gaming Center",
  description: 'PvP math battles against AI opponents. Solve equations fast to deal damage and win.',
};

export default function BattleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
