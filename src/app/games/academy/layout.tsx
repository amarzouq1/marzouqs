import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The Academy — Math, Physics & Language Games',
  description: 'Three elite educational games: Math Arena, Physics Lab, and Language Dojo. Train your mind across arithmetic, mechanics, and linguistics.',
};

export default function AcademyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
