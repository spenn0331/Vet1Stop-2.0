import { ObjectId } from "mongodb";

export interface Resource {
  _id: ObjectId;
  title: string;
  description: string;
  url: string;
  category: string;
  subcategory: string;
  source: string;
  sourceName: string;
  dateAdded: Date;
  dateUpdated: Date;
  featured: boolean;
  isPremiumContent: boolean;
  tags: string[];
  rating?: number;
  reviews?: number;
}

export interface ResourceFilter {
  category?: string;
  subcategory?: string;
  source?: string;
  featured?: boolean;
  isPremiumContent?: boolean;
  tags?: string[];
  query?: string;
  limit?: number;
}

export interface ResourceSortOptions {
  field: 'dateAdded' | 'dateUpdated' | 'rating' | 'title';
  direction: 'asc' | 'desc';
}
