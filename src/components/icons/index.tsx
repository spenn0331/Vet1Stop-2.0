// icons/index.tsx
import {
  MagnifyingGlassIcon as SearchIcon,
  FunnelIcon as FilterIcon,
  MapPinIcon as MapPin,
  HeartIcon as Heart,
  BuildingLibraryIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

import { HeartIcon as HeartFilledIcon } from '@heroicons/react/24/solid';

// Custom circle chevron right icon
export const CircleChevronRight = ({ className = "" }) => (
  <div className={`relative rounded-full bg-blue-100 p-1 ${className}`}>
    <ChevronRightIcon className="h-4 w-4 text-blue-700" />
  </div>
);

export {
  SearchIcon,
  FilterIcon,
  MapPin,
  Heart,
  HeartFilledIcon,
  BuildingLibraryIcon,
};
