import { Schema } from 'mongoose';

// Use dynamic import to prevent SSR issues with mongoose
let mongoose: any;
if (typeof window === 'undefined') {
  // Server-side only
  import('mongoose').then((module) => {
    mongoose = module.default;
  });
} else {
  // Client-side
  mongoose = { models: {} };
}

// Define interfaces for NGO resource metrics
export interface NGOMetrics {
  impactScore: number;          // Overall impact score out of 100
  engagementRate: number;       // Percentage (0-1) of user engagement
  veteransSupportedCount?: number; // Number of veterans supported by the NGO
  fundingEfficiency?: number;   // Percentage (0-1) of funds going to programs vs overhead
  yearlyGrowth?: number;        // Annual growth rate of impact
}

// Define interfaces for NGO resource contact information
export interface NGOContact {
  phone?: string;
  email?: string;
  website: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

// Define the NGO resource schema
export interface NGOResource {
  id: string;                   // Unique identifier
  name: string;                 // Name of the NGO
  description: string;          // Detailed description
  shortDescription: string;     // Brief description for cards
  establishedYear: number;      // Year the NGO was established
  category: string;             // Primary category
  subcategories: string[];      // Subcategories
  resourceType: string;         // Type of resource (NGO/non-profit)
  veteranFounded: boolean;      // Whether founded by veterans
  tags: string[];               // Tags for filtering
  achievements: string[];       // Notable achievements
  metrics: NGOMetrics;          // Impact metrics
  contact: NGOContact;          // Contact information
  socialMedia?: {               // Social media links
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  isFeaturedSpotlight: boolean; // Whether this is a premium featured NGO
  isNGOOfTheMonth: boolean;     // Whether this is the NGO of the month
  monthYear?: string;           // Month/year when featured as NGO of the month
  featuredReason?: string;      // Reason why this NGO is featured
  featuredStartDate?: Date;     // Start date of feature period
  featuredEndDate?: Date;       // End date of feature period
  logo?: string;                // Logo URL
  images?: string[];            // Additional images
  link: string;                 // Website link
  rating: number;               // Average user rating
  reviewCount: number;          // Number of reviews
  reviews?: {                   // User reviews
    userId: string;
    userName: string;
    rating: number;
    comment: string;
    date: Date;
  }[];
  lastUpdated: Date;            // Last update date
  dateAdded: Date;              // When the NGO was added to the system
  veteranTypes: string[];       // Types of veterans served
  serviceBranches: string[];    // Service branches supported
  status: string;               // Active, inactive, etc.
}

// Create the Mongoose schema
const NGOResourceSchema = new Schema<NGOResource>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  shortDescription: { type: String, required: true },
  establishedYear: { type: Number, required: true },
  category: { type: String, required: true },
  subcategories: [{ type: String }],
  resourceType: { type: String, required: true, default: 'ngo' },
  veteranFounded: { type: Boolean, default: false },
  tags: [{ type: String }],
  achievements: [{ type: String }],
  metrics: {
    impactScore: { type: Number, required: true },
    engagementRate: { type: Number, required: true },
    veteransSupportedCount: { type: Number },
    fundingEfficiency: { type: Number },
    yearlyGrowth: { type: Number }
  },
  contact: {
    phone: { type: String },
    email: { type: String },
    website: { type: String, required: true },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String }
  },
  socialMedia: {
    facebook: { type: String },
    twitter: { type: String },
    instagram: { type: String },
    linkedin: { type: String }
  },
  isFeaturedSpotlight: { type: Boolean, default: false },
  isNGOOfTheMonth: { type: Boolean, default: false },
  monthYear: { type: String },
  featuredReason: { type: String },
  featuredStartDate: { type: Date },
  featuredEndDate: { type: Date },
  logo: { type: String },
  images: [{ type: String }],
  link: { type: String, required: true },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  reviews: [{
    userId: { type: String },
    userName: { type: String },
    rating: { type: Number },
    comment: { type: String },
    date: { type: Date, default: Date.now }
  }],
  lastUpdated: { type: Date, default: Date.now },
  dateAdded: { type: Date, default: Date.now },
  veteranTypes: [{ type: String }],
  serviceBranches: [{ type: String }],
  status: { type: String, default: 'active' }
}, {
  timestamps: true
});

// Create indexes for better query performance
NGOResourceSchema.index({ name: 'text', description: 'text', tags: 'text' });
NGOResourceSchema.index({ isFeaturedSpotlight: 1 });
NGOResourceSchema.index({ isNGOOfTheMonth: 1 });
NGOResourceSchema.index({ category: 1 });
NGOResourceSchema.index({ 'metrics.impactScore': -1 });

// Create a Mongoose model using the schema
let NGOResourceModel: any;

// Only create model on server-side
if (typeof window === 'undefined') {
  try {
    // Check if model already exists to prevent duplicate model error
    // Use 'ngos' as the collection name to match existing database
    NGOResourceModel = mongoose.models?.NGOResource || 
      mongoose.model<NGOResource>('NGOResource', NGOResourceSchema, 'ngos');
  } catch (error) {
    console.error('Error creating NGO Resource model:', error);
    // Fallback if model creation fails
    NGOResourceModel = { findById: () => null, find: () => [] };
  }
} else {
  // Client-side mock for type safety
  NGOResourceModel = { findById: () => null, find: () => [] };
}

export default NGOResourceModel;
