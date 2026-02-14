/**
 * Image Helper Utility
 * 
 * This utility helps manage placeholder images and serves as fallback
 * when actual images aren't available yet.
 */

/**
 * Get a placeholder image URL with specified dimensions and text
 */
export function getPlaceholderImage(width: number, height: number, text?: string): string {
  // Ensure width and height are valid
  const w = Math.max(50, Math.min(1200, width));
  const h = Math.max(50, Math.min(1200, height));
  
  // Create placeholder text (default to dimensions if not provided)
  const placeholderText = text || `${w}x${h}`;
  
  // Generate placeholder URL (using placehold.co)
  return `https://placehold.co/${w}x${h}/1A2C5B/FFFFFF?text=${encodeURIComponent(placeholderText)}`;
}

/**
 * Get a patriotic-themed placeholder image
 */
export function getPatrioticPlaceholder(width: number, height: number, type?: string): string {
  const imageType = type || 'general';
  const w = Math.max(50, Math.min(1200, width));
  const h = Math.max(50, Math.min(1200, height));
  
  // Different text based on image type
  let text = '';
  
  switch (imageType) {
    case 'va-hospital':
      text = 'VA Hospital';
      break;
    case 'va-pharmacy':
      text = 'VA Pharmacy';
      break;
    case 'physical-care':
      text = 'VA Physical Care';
      break;
    case 'caregiver-support':
      text = 'Caregiver Support';
      break;
    case 'veteran-community':
      text = 'Veteran Community';
      break;
    case 'health-weight-management':
      text = 'Weight Management';
      break;
    case 'health-diabetes':
      text = 'Diabetes Prevention';
      break;
    case 'health-tobacco':
      text = 'Tobacco Cessation';
      break;
    case 'education-thumbnail':
      text = 'Education Resources';
      break;
    case 'careers-thumbnail':
      text = 'Career Resources';
      break;
    case 'life-leisure-thumbnail':
      text = 'Life & Leisure';
      break;
    case 'local-thumbnail':
      text = 'Local Resources';
      break;
    case 'testimonial':
      text = 'Veteran Testimonial';
      break;
    default:
      text = 'Vet1Stop';
  }
  
  // Color scheme variations based on type
  let bgColor = '1A2C5B'; // Default navy blue
  let textColor = 'FFFFFF'; // White text
  
  if (imageType.includes('health')) {
    bgColor = 'B22234'; // Red for health-related images
  } else if (imageType === 'caregiver-support' || imageType.includes('testimonial')) {
    bgColor = '4A5568'; // Slate for caregiver/testimonial images
  }
  
  return `https://placehold.co/${w}x${h}/${bgColor}/${textColor}?text=${encodeURIComponent(text)}`;
}

/**
 * Testimonial image placeholders
 */
export function getTestimonialPlaceholder(index: number): string {
  const size = 200;
  return getPatrioticPlaceholder(size, size, `testimonial-${index}`);
}

/**
 * Image fallback handler for Next.js Image component
 */
export function handleImageError(event: React.SyntheticEvent<HTMLImageElement>): void {
  const target = event.target as HTMLImageElement;
  const width = target.width || 300;
  const height = target.height || 200;
  
  // Replace with placeholder
  target.src = getPlaceholderImage(width, height, 'Image Not Found');
  target.onerror = null; // Prevent infinite loop
}
