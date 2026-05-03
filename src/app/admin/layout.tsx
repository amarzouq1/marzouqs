import { Metadata } from 'next';
export const metadata: Metadata = {
  title: "Admin — Marzouq's Gaming Center",
  description: 'Admin dashboard for platform analytics.',
};
export default function AdminLayout({ children }: { children: React.ReactNode }) { return children; }
