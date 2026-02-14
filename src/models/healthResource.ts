export interface HealthResource {
  id?: string;
  _id?: string;
  title?: string;
  name?: string; // Some resources might use name instead of title
  description?: string;
  category?: string;
  healthType?: string; // Alternative to category in some database entries
  tags?: string[];
  location?: string;
  link?: string;
  url?: string; // Alternative to link in some database entries
  website?: string; // Alternative to link in some database entries
  rating?: number;
  imageUrl?: string;
  isPremiumContent?: boolean;
  eligibility?: string[];
  veteranType?: string[] | string;
  source?: string;
  sourceName?: string;
  createdAt?: string;
  dateAdded?: string;
  keywords?: string[] | string;
  subcategory?: string;
  phone?: string;
  email?: string;
  address?: string;
  serviceType?: string;
  costType?: string;
  branch?: string | string[];
  organizationType?: 'VA' | 'NGO' | 'State' | 'Other';
  popularity?: number;
  relevance?: number;
  thumbnail?: string;
  updatedAt?: string;
  date?: string | Date;
  [key: string]: any; // Allow for additional fields to avoid data loss
}
