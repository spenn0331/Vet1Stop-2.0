import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  className = '',
}) => {
  return (
    <div className={`max-w-4xl mx-auto text-center ${className}`}>
      <h2 className="text-2xl sm:text-3xl font-bold text-[#1A2C5B] mb-2">{title}</h2>
      {subtitle && (
        <p className="text-gray-600 text-base sm:text-lg">
          {subtitle}
        </p>
      )}
    </div>
  );
};
