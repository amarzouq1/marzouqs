import { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Sign Language — Marzouq's Gaming Center",
  description: 'Learn ASL through interactive sign recognition, fingerspelling, and phrase games.',
};
export default function SignsLayout({ children }: { children: React.ReactNode }) { return children; }
