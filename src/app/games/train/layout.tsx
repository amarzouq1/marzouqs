import { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Train Surf Runner — Marzouq's Gaming Center",
  description: 'Endless lane-runner on top of a speeding train. Dodge obstacles, collect coins, survive.',
};
export default function TrainLayout({ children }: { children: React.ReactNode }) { return children; }
