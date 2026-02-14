"use client";

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import AILayoutWrapper from '@/components/ai/AILayoutWrapper';

// Load Inter font
const inter = Inter({ subsets: ['latin'] });

// Metadata for SEO - Commented out because metadata cannot be exported from a client component
// export const metadata: Metadata = {
//   title: 'Vet1Stop - Resources for Veterans',
//   description: 'The premier hub for U.S. veterans, providing seamless access to resources, opportunities, and community connections.',
//   keywords: 'veterans, military, resources, education, health, careers, community',
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
              <AILayoutWrapper />
            </div>
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
