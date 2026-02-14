import { ArrowRightIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface ResourceCardProps {
  icon: React.ComponentType<{ className: string }>;
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  colorScheme: 'blue' | 'amber';
}

export default function ResourceCard({
  icon: Icon,
  title,
  description,
  ctaText,
  ctaLink,
  colorScheme = 'blue'
}: ResourceCardProps) {
  const bgColor = colorScheme === 'blue' ? 'bg-blue-100' : 'bg-amber-100';
  const textColor = colorScheme === 'blue' ? 'text-blue-700' : 'text-amber-700';
  const hoverTextColor = colorScheme === 'blue' ? 'hover:text-blue-800' : 'hover:text-amber-800';

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center mb-4`}>
          <Icon className="h-6 w-6 text-[#1A2C5B]" />
        </div>
        <h3 className="text-xl font-bold text-[#1A2C5B] mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">
          {description}
        </p>
        <a href={ctaLink} className={`inline-flex items-center ${textColor} font-medium ${hoverTextColor}`}>
          {ctaText}
          <ArrowRightIcon className="ml-2 h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
