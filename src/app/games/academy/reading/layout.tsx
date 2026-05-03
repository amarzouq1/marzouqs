import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Reading Challenge — Marzouq's Gaming Center",
  description: 'Test your reading comprehension across science, history, physics, and more.',
};

export default function ReadingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
