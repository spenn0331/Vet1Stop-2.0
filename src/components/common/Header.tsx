'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  // Navigation links
  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Education', href: '/education' },
    { name: 'Health', href: '/health' },
    { name: 'Life & Leisure', href: '/life-leisure' },
    { name: 'Careers', href: '/careers' },
    { name: 'Local', href: '/local' },
    { name: 'Shop', href: '/shop' },
    { name: 'Social', href: '/social' },
  ];

  // Toggle mobile menu
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              {/* Replace with your logo */}
              <div className="h-10 w-10 relative">
                <Image
                  src="/logo.png"
                  alt="Vet1Stop Logo"
                  fill
                  sizes="(max-width: 768px) 40px, 40px"
                  className="object-contain"
                  priority
                />
              </div>
              <span className="ml-2 text-xl font-bold text-blue-800">Vet1Stop</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:ml-6 md:flex md:space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${pathname === link.href
                    ? 'border-blue-600 text-blue-800'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center">
            {user ? (
              <div className="ml-4 relative flex items-center space-x-4">
                <span className="text-sm text-gray-700 truncate">
                  {user.displayName || user.email}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-700 hover:text-blue-800"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="ml-4 flex items-center space-x-4">
                <Link
                  href="/signin"
                  className="text-sm text-blue-800 hover:text-blue-900"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 text-sm rounded-md text-white bg-blue-700 hover:bg-blue-800"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
              onClick={toggleMenu}
            >
              <span className="sr-only">{isMenuOpen ? 'Close menu' : 'Open menu'}</span>
              {isMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${pathname === link.href
                    ? 'border-blue-600 text-blue-800 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {user ? (
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <UserCircleIcon className="h-10 w-10 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    {user.displayName || 'User'}
                  </div>
                  <div className="text-sm font-medium text-gray-500">{user.email}</div>
                </div>
                <button
                  onClick={() => {
                    signOut();
                    setIsMenuOpen(false);
                  }}
                  className="ml-auto bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span className="sr-only">Sign out</span>
                  <span className="text-sm text-red-600">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="space-y-1 px-4">
                <Link
                  href="/signin"
                  className="block text-base font-medium text-gray-500 hover:text-gray-900"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="block text-base font-medium text-blue-600 hover:text-blue-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
