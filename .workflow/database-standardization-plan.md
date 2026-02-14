# MongoDB Data Standardization Plan

## Overview
This document outlines the approach for standardizing the data structure in the MongoDB collections for Vet1Stop resources. The goal is to ensure consistent field names and data formats across all resource types (Health, Education, Life and Leisure) to improve filtering, searching, and overall user experience.

## Current Challenges
- Inconsistent field names (e.g., `category`, `healthType`, `resourceType`)
- Inconsistent data formats (some fields are strings, others are arrays)
- Difficulty filtering resources due to data structure variations
- Resource finder components need complex logic to handle data inconsistencies

## Standardized Schema
```javascript
{
  _id: ObjectId,                   // MongoDB's default ID
  id: String,                      // Secondary ID for backwards compatibility
  
  // Core Resource Information
  title: String,                   // Primary display name
  description: String,             // Full description
  summary: String,                 // Optional shorter description
  
  // Categorization
  category: String,                // Primary category (Health, Education, etc.)
  subcategory: String,             // Secondary categorization
  resourceType: String,            // Type of resource (e.g., Government, NGO, etc.)
  
  // Contact & Location
  link: String,                    // Primary web URL
  contact: {                       // Consolidated contact info
    phone: String,
    email: String,
    website: String
  },
  location: {                      // Standardized location info
    state: String,                 // State or "National"
    city: String,                  // Optional city
    address: String                // Optional full address
  },
  
  // Eligibility & Tags
  eligibility: [String],           // Array of eligibility criteria
  veteranType: [String],           // Array of veteran types
  serviceBranch: [String],         // Array of service branches
  tags: [String],                  // Standardized, lowercase tags
  
  // Metadata
  featured: Boolean,               // Is this a featured resource?
  rating: Number,                  // Optional rating (0-5)
  reviewCount: Number,             // Optional number of reviews
  createdAt: Date,                 // When was this added
  updatedAt: Date,                 // When was this last updated
  sourceOrganization: String       // Source organization name
}
```

## Implementation Process

### Phase 1: Backup
- Backup all MongoDB collections to JSON files before making any changes
- Store backups in a safe location with timestamps
- Create a rollback plan in case of issues

### Phase 2: Migration Script
- Run the `standardize-resources.js` script to transform data
- Script will convert all resources to the new schema
- Validation will be performed during and after migration

### Phase 3: Frontend Updates
- Update resource finder components to use standardized fields
- Simplify filtering logic now that data structure is consistent
- Test on all resource pages (Health, Education, Life and Leisure)

### Phase 4: API Updates
- Update API endpoints to leverage the standardized schema
- Ensure consistent query parameters across all resource types
- Improve search functionality with standardized fields

## Resources
- **Standardization Script**: `scripts/standardize-resources.js`
- **Backup Script**: `scripts/backup-mongodb.js`
- **Validation Script**: Part of standardization script

## Timeline
- **Backup**: April 16, 2025
- **Migration**: April 16-17, 2025
- **Frontend Updates**: April 17-18, 2025
- **API Updates**: April 18-19, 2025
- **Testing and Verification**: April 19-20, 2025

## Success Criteria
- All resources successfully migrated to the new schema
- No data loss during migration
- Resource finder components display all resources correctly
- Filtering works consistently across all resource types
- Improved search functionality and user experience
