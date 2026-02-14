import { ObjectId } from 'mongodb';

// NGO Resource Schema Extensions
export const NGOResourceSchema = {
  // Basic NGO information (existing fields)
  name: String,
  description: String,
  category: String,
  subcategory: String,
  
  // Contact information
  contact: {
    phone: String,
    email: String,
    website: String,
    address: String,
    city: String,
    state: String,
    zipCode: String
  },
  
  // Location information
  location: {
    national: Boolean,
    states: [String],
    address: String,
    city: String,
    state: String,
    zipCode: String
  },
  
  // Service eligibility
  serviceBranches: [String],
  veteranTypes: [String],
  
  // Verification and status indicators
  isVerified: Boolean,
  verified: Boolean, // Legacy field
  verificationSource: String, // 'va', 'dod', 'community'
  federalAgency: Boolean,
  nonProfit: Boolean,
  
  // Service and funding status (new fields)
  serviceAvailability: String, // 'accepting', 'waitlist', 'closed'
  fundingType: String, // 'government', 'private', 'hybrid'
  
  // Success stories and testimonials
  successStories: [
    {
      quote: String,
      veteran: String,
      date: Date
    }
  ],
  
  // Organization metadata
  focus: [String],
  tags: [String],
  rating: Number,
  reviewCount: Number,
  
  // Other metadata
  createdAt: Date,
  updatedAt: Date
};

// Community Question Schema (new)
export const CommunityQuestionSchema = {
  ngoId: String, // Reference to NGO
  question: String,
  askedBy: String,
  contactInfo: String,
  answers: [
    {
      text: String,
      answeredBy: String, // 'ngo', 'admin', 'verified_veteran'
      answererName: String,
      date: Date,
      verified: Boolean
    }
  ],
  createdAt: Date,
  status: String // 'pending', 'answered', 'verified'
};

// Resource Pathway Schema (new)
export const ResourcePathwaySchema = {
  title: String,
  description: String,
  category: String, // 'health', 'education', etc.
  tags: [String],
  steps: [
    {
      order: Number,
      title: String,
      description: String,
      ngoId: String, // Optional reference to NGO
      action: String, // What the veteran should do at this step
      requirements: [String], // What's needed for this step
      resources: [
        {
          type: String, // 'link', 'form', 'contact'
          title: String,
          url: String,
          description: String
        }
      ]
    }
  ],
  createdAt: Date,
  active: Boolean
};

// Info Request Schema (new)
export const InfoRequestSchema = {
  ngoId: String,
  ngoName: String,
  veteranName: String,
  email: String,
  phone: String,
  serviceStatus: String, // 'active', 'veteran', 'family'
  questions: [String],
  preferredContact: String, // 'email', 'phone'
  createdAt: Date,
  status: String, // 'pending', 'contacted', 'resolved'
  notes: [
    {
      text: String,
      date: Date,
      author: String
    }
  ]
};

// Helper function to convert string IDs to ObjectIds
export function convertToObjectId(id: string): ObjectId {
  return new ObjectId(id);
}

// Helper function to prepare NGO data for storing in MongoDB
export function prepareNGOForDB(ngo: any) {
  const preparedNGO = { ...ngo };
  
  // Add timestamps if not present
  if (!preparedNGO.createdAt) {
    preparedNGO.createdAt = new Date();
  }
  preparedNGO.updatedAt = new Date();
  
  return preparedNGO;
}

// Helper function to validate an NGO against the schema
export function validateNGO(ngo: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required fields
  if (!ngo.name) errors.push('Name is required');
  if (!ngo.description) errors.push('Description is required');
  
  return {
    valid: errors.length === 0,
    errors
  };
}
