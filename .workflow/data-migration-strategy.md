# Data Migration Strategy

## Overview

This document outlines the comprehensive strategy for migrating existing Vet1Stop data to the new Next.js implementation. Following your project rules, this plan emphasizes preserving all resource data while transitioning to a more structured and scalable data architecture.

## Guiding Principles

1. **Zero Data Loss**: Preserve 100% of existing resource content during migration
2. **Data Enrichment**: Enhance data structure without altering core content
3. **Validation**: Ensure data integrity throughout the migration process
4. **Backward Compatibility**: Maintain support for existing data formats during transition
5. **Phased Approach**: Migrate data in logical segments to minimize risk

## Current Data Sources

### Primary Sources
- Text files (`*.txt`) in `/data/resources/` directories
- JavaScript data files (`*.js`) with exported objects
- JSON files (`*.json`) with structured data
- MongoDB Atlas collections (already integrated)

### Structure Assessment
- Resource data organized by category (education, health, etc.)
- Nested directory structure indicating subcategories
- Mixture of structured and unstructured data formats
- Limited metadata and relationship modeling
- Critical text files that must be preserved

## Target Data Architecture

### MongoDB Collections Design

#### Resources Collection
```javascript
{
  _id: ObjectId,
  type: String,           // "education", "health", "careers", etc.
  subtype: String,        // "federal", "nonprofit", "state", etc.
  title: String,
  description: String,
  content: String,        // Rich content or original text file content
  url: String,            // External link if applicable
  metadata: {
    sourceFile: String,   // Original file reference for traceability
    importDate: Date,
    lastUpdated: Date,
    tags: [String],
    importance: Number    // Priority ranking
  },
  eligibility: {          // Optional eligibility criteria
    branches: [String],
    serviceStatus: [String],
    disabilityRequired: Boolean,
    // Other eligibility factors
  },
  displayOptions: {       // UI display preferences
    featured: Boolean,
    icon: String,
    color: String
  }
}
```

#### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,
  passwordHash: String,   // Securely stored
  profile: {
    firstName: String,
    lastName: String,
    branch: String,       // Military branch
    serviceYears: {
      start: Number,
      end: Number
    },
    location: {
      city: String,
      state: String,
      zip: String
    },
    // Other profile details
  },
  verification: {
    status: String,       // "pending", "verified", "rejected"
    documents: [String],  // References to secure document storage
    verifiedDate: Date
  },
  preferences: {
    // User preferences
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Businesses Collection (Local)
```javascript
{
  _id: ObjectId,
  name: String,
  owner: {
    userId: ObjectId,     // Reference to Users collection
    veteranStatus: String // "veteran", "service-disabled-veteran"
  },
  description: String,
  business: {
    type: String,
    subtype: String,
    ein: String,          // Employer Identification Number
    foundingDate: Date
  },
  contact: {
    phone: String,
    email: String,
    website: String,
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String,
      linkedin: String
    }
  },
  location: {
    address: {
      street: String,
      city: String,
      state: String,
      zip: String
    },
    coordinates: {
      lat: Number,
      lng: Number
    },
    serviceArea: [String] // ZIP codes or regions served
  },
  details: {
    hours: Object,        // Operating hours
    features: [String],   // Business features
    photos: [String],     // Photo URLs
    veteranDiscount: Boolean,
    accessibilityOptions: [String]
  },
  verification: {
    status: String,       // Verification status
    verifiedDate: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Products Collection (Shop)
```javascript
{
  _id: ObjectId,
  businessId: ObjectId,   // Reference to Business collection
  name: String,
  description: String,
  details: {
    price: Number,
    salePrice: Number,
    inventory: Number,
    sku: String,
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    shippingOptions: [String]
  },
  categories: [String],
  tags: [String],
  photos: [String],       // Photo URLs
  featured: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Additional Collections
- Events (for Social page)
- Posts (for Social page)
- Groups (for Social page)
- Comments (for Social discussions)

## Migration Process

### Phase 1: Discovery & Mapping

1. **Comprehensive Inventory**
   - Script to catalog all `.txt`, `.js`, and `.json` files in `/data/resources/`
   - Document file counts, sizes, and types by category
   - Identify critical data files that require special handling

2. **Schema Mapping**
   - Create mapping documents for each data type
   - Define transformation rules for each source format
   - Document field mappings between source and target schemas

3. **Sample Transformations**
   - Test transformation of representative sample data
   - Validate output schema and content accuracy
   - Adjust mapping rules based on sample results

### Phase 2: Extraction Tools

1. **Text File Parser**
   ```javascript
   // Text file parser for resource content
   const extractFromTextFile = async (filePath) => {
     // Read file content
     const content = await fs.readFile(filePath, 'utf8');
     
     // Extract metadata from filename and path
     const pathParts = filePath.split('/');
     const fileName = pathParts.pop();
     const category = pathParts[pathParts.length - 2];
     const subcategory = pathParts[pathParts.length - 1];
     
     // Create structured document
     return {
       type: category,
       subtype: subcategory,
       title: fileName.replace('.txt', '').replace(/-/g, ' '),
       description: extractDescriptionFromContent(content),
       content: content,
       metadata: {
         sourceFile: filePath,
         importDate: new Date(),
         tags: extractTagsFromContent(content),
       }
     };
   };
   ```

2. **JavaScript/JSON Extractors**
   ```javascript
   // JS file parser for structured data
   const extractFromJsFile = async (filePath) => {
     // Import the JS module
     const data = require(filePath);
     
     // Map to target schema
     return {
       // Transformed fields based on mapping rules
     };
   };
   
   // JSON parser for structured data
   const extractFromJsonFile = async (filePath) => {
     // Read and parse JSON
     const content = await fs.readFile(filePath, 'utf8');
     const data = JSON.parse(content);
     
     // Map to target schema
     return {
       // Transformed fields based on mapping rules
     };
   };
   ```

3. **MongoDB Direct Migration**
   - Scripts for direct migration between MongoDB collections
   - Schema transformation during migration
   - Validation of migrated documents

### Phase 3: Transformation Pipeline

1. **Extraction Stage**
   - Read from source files/database
   - Initial content parsing
   - Source validation

2. **Transformation Stage**
   - Apply schema mappings
   - Enrich data with additional metadata
   - Data normalization and cleaning
   - Relationship mapping

3. **Loading Stage**
   - Validation against target schema
   - Database insertion
   - Relationship verification
   - Error handling and logging

4. **Verification Stage**
   - Count verification
   - Content sampling
   - Relationship integrity checking
   - Performance testing

### Phase 4: Implementation & Testing

1. **Development Environment Testing**
   - Full migration against development database
   - Application verification with migrated data
   - Performance assessment
   - UI rendering validation

2. **Staging Environment Validation**
   - Migration rehearsal in staging environment
   - End-to-end testing with migrated data
   - User acceptance testing with sample data

3. **Production Migration Plan**
   - Detailed step-by-step execution plan
   - Rollback procedures
   - Timeline and dependencies
   - Resource requirements and responsibilities

## Data Preservation Strategy

### Original Data Backup
- Multiple backup copies of all source data before migration
- Version-controlled repository of data migration scripts
- Snapshot of original MongoDB data (if applicable)

### Preservation of Text Files
- Original text files maintained in the new project structure
- Reference mapping between original files and new database records
- Capability to regenerate text files from database if needed

### Fallback Mechanisms
- Dual-reading capability during transition (read from both old and new sources)
- Feature flag to switch between data sources
- Monitoring for data access patterns and errors

## Migration Timeline

1. **Planning & Development** (1-2 weeks)
   - Finalize schema design
   - Develop migration scripts
   - Create validation tools

2. **Testing & Validation** (1 week)
   - Test migration with sample data
   - Refine transformation rules
   - Validate output quality

3. **Execution** (1-2 days)
   - Perform full migration
   - Verify data integrity
   - Enable new data sources in application

4. **Monitoring & Optimization** (1 week)
   - Monitor application performance
   - Address any data quality issues
   - Optimize database indexes and queries

## Risk Management

### Identified Risks
- Incomplete data extraction from complex text formats
- Schema mismatches during transformation
- Performance issues with large dataset migration
- Data integrity issues in relationship mapping

### Mitigation Strategies
- Comprehensive pre-migration data analysis
- Progressive validation throughout the pipeline
- Extensive logging and error tracking
- Phased approach with incremental verification
- Multiple migration dry runs before production

## Post-Migration

### Data Governance
- Documentation of new data architecture
- Data quality monitoring procedures
- Update and maintenance protocols
- Access control and security implementation

### Future-Proofing
- API-based access to facilitate future migrations
- Schema versioning strategy
- Documentation of data relationships and dependencies
- Exportability requirements for all data

This data migration strategy ensures the safe transition of all Vet1Stop resource data to the new Next.js implementation while preserving critical information and enhancing the data structure for future scalability and feature development.
