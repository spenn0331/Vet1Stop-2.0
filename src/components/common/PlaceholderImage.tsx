"use client";

import Image from 'next/image';
import { getPatrioticPlaceholder } from '@/utils/imageHelper';

interface PlaceholderImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  type?: string;
  fill?: boolean;
}

/**
 * PlaceholderImage component that uses Next.js Image with fallback to placeholder images
 */
export default function PlaceholderImage({
  src,
  alt,
  width,
  height,
  className = "",
  sizes,
  priority = false,
  type = "general",
  fill = false
}: PlaceholderImageProps) {
  // Generate a patriotic placeholder as fallback
  const placeholderUrl = getPatrioticPlaceholder(width, height, type);
  
  // For external URLs or when the file might not exist, use placeholder
  const shouldUsePlaceholder = !src || src.startsWith('http') || !src.startsWith('/');
  const imageSrc = shouldUsePlaceholder ? placeholderUrl : src;

  if (fill) {
    return (
      <div className={`relative ${className}`} style={{ width: '100%', height: '100%' }}>
        <Image
          src={imageSrc}
          alt={alt}
          fill
          sizes={sizes || "(max-width: 768px) 100vw, 50vw"}
          className="object-cover"
          priority={priority}
        />
      </div>
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      priority={priority}
    />
  );
}
