import { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Curriculum Hub — Marzouq's Gaming Center",
  description: 'Grade 5-12 curriculum roadmap. Find the right games and lessons for your grade level.',
};
export default function CurriculumLayout({ children }: { children: React.ReactNode }) { return children; }
