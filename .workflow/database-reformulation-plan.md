# Vet1Stop Database Reformulation Plan

## Overview

As of April 14, 2025, an analysis of the MongoDB cluster for Vet1Stop revealed that the health resources are stored in the 'test' database rather than the intended 'vet1stop' database. To ensure scalability, maintainability, and alignment with project goals, this plan outlines a reformulation of the database structure and a migration strategy.

## Current Database State

- **MongoDB Cluster**: Contains multiple databases including 'test', 'vet1stop', and sample databases.
- **'test' Database**: Contains a 'resources' collection with health-related resources.
- **'vet1stop' Database**: Nearly empty, currently used by the application but not containing the expected resources.

## Proposed Database Structure

### 1. Unified Database

- **Database Name**: 'vet1stop'
- **Reason**: Consolidate all Vet1Stop data into a single database to simplify access, management, and backups. Avoid confusion from having data split across 'test' and 'vet1stop'.

### 2. Collection Structure

To handle various resource types (Health, Education, Jobs, Life & Leisure), we will create separate collections for each major category. This improves query performance and data organization:

- **healthResources**: For health-related resources.
- **educationResources**: For education-related resources.
- **jobResources**: For career and job opportunities.
- **lifeLeisureResources**: For life and leisure resources.
- **users**: For user data, authentication, and personalization.
- **feedback**: For user feedback, ratings, and reviews on resources.

### 3. Standardized Resource Schema

All resource collections will follow a consistent schema to ensure uniformity in data handling:

```javascript
{
  _id: ObjectId,
  title: String,              // Name of the resource
  description: String,        // Detailed description
  category: String,           // Primary category (e.g., 'federal', 'state', 'ngo')
  subcategory: String,        // Sub-category for filtering (e.g., 'VA', 'mental health')
  url: String,                // Website or link to the resource
  sourceName: String,         // Source organization or provider
  dateAdded: Date,            // When the resource was added to the database
  dateUpdated: Date,          // Last update to the resource information
  featured: Boolean,          // Whether to highlight this resource
  isPremiumContent: Boolean,  // For future premium features
  tags: [String],             // Keywords for search and filtering
  rating: Number,             // Average user rating (0-5)
  reviews: Number,            // Total number of reviews
  location: String,           // Geographic relevance if applicable
  address: String,            // Physical address if relevant
  phone: String,              // Contact number if available
  eligibility: String,        // Who qualifies for this resource
  cost: String,               // Cost information if applicable
  imageUrl: String,           // Image for UI display
  veteranType: String,        // Specific veteran group if targeted
  branch: String              // Military branch if relevant
}
```

### 4. User Data Schema

The `users` collection will store data for authentication and personalization:

```javascript
{
  _id: ObjectId,
  firebaseId: String,         // Link to Firebase auth ID
  email: String,              // User email
  displayName: String,        // User display name
  photoURL: String,          // Profile picture URL
  preferences: Object,        // User preferences for resource filtering
  savedResources: [ObjectId], // References to saved resources
  militaryStatus: String,     // Veteran, active duty, family, etc.
  branch: String,             // Military branch if applicable
  serviceDuration: String,    // Length of service if relevant
  location: String,           // User location for localized resources
  createdAt: Date,            // Account creation date
  updatedAt: Date             // Last profile update
}
```

### 5. Feedback Schema

The `feedback` collection will store user ratings and reviews:

```javascript
{
  _id: ObjectId,
  resourceId: ObjectId,      // Reference to the resource being reviewed
  userId: ObjectId,          // Reference to the user providing feedback
  rating: Number,            // Rating from 1-5
  comment: String,           // User comment or review
  createdAt: Date,           // Date of feedback
  updatedAt: Date            // Date of last update if edited
}
```

### 6. Indexing for Performance

To ensure scalability, create indexes on frequently queried fields:

- For resource collections: Index on `category`, `subcategory`, `tags`, `location`
- For users: Index on `firebaseId`, `email`
- For feedback: Index on `resourceId`, `userId`

## Migration Strategy

To move data from the current 'test' database to the new structure in 'vet1stop', follow these steps:

1. **Backup Existing Data**:
   - Export all data from the 'test.resources' collection to a JSON file as a backup.
   - Command: `mongoexport --uri='mongodb+srv://spennyvet1stop:UMGaPUiLTI1cPRMy@cluster0.hpghrbe.mongodb.net/test' --collection=resources --out=backup-resources.json`

2. **Create New Collections**:
   - In the 'vet1stop' database, create the new collections (`healthResources`, `educationResources`, etc.).

3. **Data Mapping and Import**:
   - Write a script to categorize resources from the backup into the appropriate collections based on their `category` or other identifying fields.
   - Example script logic:
     ```javascript
     const fs = require('fs');
     const { MongoClient } = require('mongodb');
     async function migrateData() {
       const uri = 'mongodb+srv://spennyvet1stop:UMGaPUiLTI1cPRMy@cluster0.hpghrbe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
       const client = new MongoClient(uri);
       await client.connect();
       const db = client.db('vet1stop');
       const resources = JSON.parse(fs.readFileSync('backup-resources.json', 'utf8'));
       let healthCount = 0, eduCount = 0, jobCount = 0, lifeCount = 0;
       for(const res of resources) {
         if(res.category === 'health') {
           await db.collection('healthResources').insertOne(res);
           healthCount++;
         } else if(res.category === 'education') {
           await db.collection('educationResources').insertOne(res);
           eduCount++;
         } else if(res.category === 'jobs') {
           await db.collection('jobResources').insertOne(res);
           jobCount++;
         } else {
           await db.collection('lifeLeisureResources').insertOne(res);
           lifeCount++;
         }
       }
       console.log(`Migration complete: ${healthCount} health, ${eduCount} education, ${jobCount} jobs, ${lifeCount} life & leisure resources migrated.`);
       await client.close();
     }
     migrateData();
     ```

4. **Update Application Configuration**:
   - Update the application to use the 'vet1stop' database and the new collection names as per the migration.
   - Modify API endpoints to query the appropriate collections based on resource type.

5. **Testing**:
   - Thoroughly test the application to ensure all resources are accessible and displayed correctly on the respective pages (Health, Education, etc.).

6. **Clean Up**:
   - Once migration is confirmed successful, consider archiving or removing old data from the 'test' database to avoid confusion.

## Implementation Timeline

- **Week 1**: Backup data and finalize schema design.
- **Week 2**: Create new collections and execute migration script.
- **Week 3**: Update application code to use the new database structure.
- **Week 4**: Test extensively and resolve any issues.

## Conclusion

This reformulation plan aims to create a structured, scalable database for Vet1Stop that supports the project's goal of being a centralized hub for veteran resources. By consolidating data into a single 'vet1stop' database with categorized collections, we ensure better data management and performance. The migration strategy minimizes risks and ensures continuity of service during the transition.

**Next Steps**: Review this plan with stakeholders, allocate resources for implementation, and schedule the migration during a low-traffic period to minimize disruption.
