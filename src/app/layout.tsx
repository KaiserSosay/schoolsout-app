import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });

export const metadata: Metadata = {
  title: "School's Out",
  description: "Never miss another school closure.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="min-h-screen bg-gradient-to-br from-purple-deep via-purple-mid to-blue-deep text-white font-display">
        {children}
      </body>
    </html>
  );
}
