import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chess Arena — Grandmaster Suite',
  description: 'Play chess with full ELO tracking and AI analysis. Castling, en passant, promotion — all rules enforced. Difficulty from Novice to Grandmaster.',
};

export default function ChessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
