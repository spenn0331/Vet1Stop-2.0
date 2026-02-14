import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Admin Dashboard - Vet1Stop',
  description: 'Manage NGO resources, pathways, and community engagement',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-[#1A2C5B] text-white">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        </div>
        <nav className="mt-4">
          <ul>
            <li>
              <Link href="/admin" className="block px-4 py-2 hover:bg-blue-800">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/admin/pathways" className="block px-4 py-2 hover:bg-blue-800">
                Resource Pathways
              </Link>
            </li>
            <li>
              <Link href="/admin/community-qa" className="block px-4 py-2 hover:bg-blue-800">
                Community Q&A
              </Link>
            </li>
            <li>
              <Link href="/admin/ngos" className="block px-4 py-2 hover:bg-blue-800">
                NGO Management
              </Link>
            </li>
            <li>
              <Link href="/" className="block px-4 py-2 hover:bg-blue-800">
                Back to Site
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1">
        <header className="bg-white shadow">
          <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
        </header>
        <main>
          <div className="py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
