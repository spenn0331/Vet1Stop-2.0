import React from 'react';
import { ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface PremiumFeatureCardProps {
  icon: React.ComponentType<{ className: string }>;
  title: string;
  description: string;
  colorScheme: 'blue' | 'amber';
}

export default function PremiumFeatureCard({
  icon: Icon,
  title,
  description,
  colorScheme = 'blue'
}: PremiumFeatureCardProps) {
  const bgGradient = colorScheme === 'blue' 
    ? 'from-blue-800 to-indigo-900' 
    : 'from-amber-600 to-amber-800';
  
  const borderColor = colorScheme === 'blue' 
    ? 'border-blue-700' 
    : 'border-amber-600';
  
  const badgeBg = colorScheme === 'blue' 
    ? 'bg-blue-700' 
    : 'bg-amber-700';

  return (
    <div 
      className={`relative bg-gradient-to-br ${bgGradient} rounded-xl shadow-xl overflow-hidden border ${borderColor} group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300`}
    >
      {/* Premium badge */}
      <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs font-semibold flex items-center">
        <SparklesIcon className="h-3 w-3 mr-1 text-yellow-400" />
        Premium
      </div>
      
      <div className="p-6 text-white">
        <div className={`w-12 h-12 ${badgeBg} rounded-lg flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        
        <h3 className="text-xl font-bold mb-2 group-hover:text-yellow-400 transition-colors">{title}</h3>
        
        <p className="text-gray-300 mb-6">
          {description}
        </p>
        
        <button
          onClick={() => alert('This premium feature will be available soon!')}
          className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm text-white font-medium rounded-md hover:bg-white/20 transition-all inline-flex items-center justify-center border border-white/20 focus:ring-4 focus:ring-white/20 focus:outline-none"
        >
          Learn More
          <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
