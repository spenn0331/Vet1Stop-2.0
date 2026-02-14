# API Routes Blueprint

## Overview
This document outlines the API structure for the Vet1Stop Next.js application, focusing primarily on routes required for the MVP phase while indicating which enhancements will be implemented post-funding.

## API Design Principles for MVP

- RESTful API design patterns for consistency and scalability
- Focused on resource data retrieval and basic user operations
- Minimal middleware for the MVP phase
- Clear separation between public and protected routes
- Stateless authentication using Firebase JWT tokens

## Route Structure

### Core Routes (MVP Priority)

#### Resource Routes

```plaintext
# Resource Routes - MVP Priority
GET /api/resources                      # Get all resources with optional filtering
GET /api/resources/[category]           # Get resources by category (education, health, etc.)
GET /api/resources/[category]/[id]      # Get specific resource details
GET /api/search                         # Search across all resources
```

#### User Routes (Basic MVP Implementation)

```plaintext
# User Routes - Basic Implementation for MVP
POST /api/users/signup                  # Create a new user account
POST /api/users/login                   # Login with email/password
GET /api/users/me                       # Get current user profile
PATCH /api/users/me                     # Update basic profile information
```

#### Firebase/Firestore Integration (MVP Implementation)

The MVP will use Firebase Admin SDK in API routes to authenticate users and access Firestore data:

```javascript
// Example of a Firebase-authenticated API route for MVP
// /app/api/resources/route.js

import { NextResponse } from 'next/server';
import admin from '@/lib/firebase/admin';
import { getFirestore } from 'firebase-admin/firestore';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') || '20');
  
  try {
    const db = getFirestore();
    let query = db.collection('resources');
    
    if (category) {
      query = query.where('category', '==', category);
    }
    
    const snapshot = await query.limit(limit).get();
    const resources = [];
    
    snapshot.forEach(doc => {
      resources.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return NextResponse.json({ resources });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}
```

#### MongoDB Integration (MVP Implementation)

```javascript
// Example of MongoDB API route for MVP
// /app/api/resources/education/route.js

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source'); // 'federal', 'state', 'ngo'
  const limit = parseInt(searchParams.get('limit') || '20');
  
  try {
    const { db } = await connectToDatabase();
    
    let query = { category: 'education' };
    
    if (source) {
      query.source = source;
    }
    
    const resources = await db
      .collection('resources')
      .find(query)
      .limit(limit)
      .toArray();
    
    return NextResponse.json({ 
      resources: resources.map(resource => ({
        ...resource,
        _id: resource._id.toString(),
      }))
    });
  } catch (error) {
    console.error('Error fetching education resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch education resources' },
      { status: 500 }
    );
  }
}
```

### Future API Enhancements (Post-Funding)

The following API routes will be implemented by the professional development team after funding. For the MVP, these can be stubbed or mocked as needed:

```plaintext
# Authentication & Verification - Future Enhancement
POST /api/auth/military-verification       # Submit verification documents
GET /api/auth/verification-status          # Check verification status
POST /api/auth/request-verification        # Request new verification

# Premium Features - Future Enhancement
POST /api/subscriptions/create             # Create a subscription
GET /api/subscriptions/status              # Get subscription status
POST /api/subscriptions/cancel             # Cancel subscription

# User Preferences - Future Enhancement
GET /api/preferences                       # Get user preferences
PUT /api/preferences                       # Update user preferences

# Saved Resources - Future Enhancement
GET /api/saved-resources                   # Get user's saved resources
POST /api/saved-resources                  # Save a resource
DELETE /api/saved-resources/[id]           # Remove a saved resource

# Community Features - Future Enhancement
GET /api/forums                            # Get forum categories
GET /api/forums/[category]/threads         # Get threads in a category
POST /api/forums/threads                   # Create a new thread
POST /api/forums/threads/[id]/replies      # Reply to a thread

# Business Directory - Future Enhancement
GET /api/businesses                        # Get veteran businesses
GET /api/businesses/[id]                   # Get specific business
POST /api/businesses                       # Register a business
PUT /api/businesses/[id]                   # Update business info
```

## Implementation for MVP

### API Routes Directory Structure

```
app/
├── api/
│   ├── resources/
│   │   ├── route.js                # Get all resources
│   │   ├── [category]/
│   │   │   ├── route.js            # Get resources by category
│   │   │   ├── [id]/
│   │   │   │   └── route.js        # Get specific resource
│   ├── search/
│   │   └── route.js                # Search functionality
│   ├── users/
│   │   ├── signup/
│   │   │   └── route.js            # Create user
│   │   ├── login/
│   │   │   └── route.js            # Login user
│   │   └── me/
│   │       └── route.js            # Get/update current user
```

### MongoDB Connection Utility (MVP Implementation)

```javascript
// lib/mongodb.js

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

if (!MONGODB_DB) {
  throw new Error('Please define the MONGODB_DB environment variable');
}

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  // If we have cached values, use them
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Set the connection options
  const opts = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  // Connect to the MongoDB server
  const client = await MongoClient.connect(MONGODB_URI, opts);
  const db = client.db(MONGODB_DB);

  // Cache the client and db for reuse
  cachedClient = client;
  cachedDb = db;

  return { client, db };
}
```

### Firebase Admin Utility (MVP Implementation)

```javascript
// lib/firebase/admin.js

import admin from 'firebase-admin';

// Check if Firebase admin is already initialized
if (!admin.apps.length) {
  // Check if we're using credentials or service account JSON
  if (process.env.FIREBASE_PRIVATE_KEY) {
    // Initialize with environment variables
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace newline characters in the private key
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  } else {
    // Initialize with default config or service account in Vercel
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
}

export default admin;
```

## Authentication Middleware (MVP Version)

For the MVP, a simplified authentication middleware will verify Firebase tokens:

```javascript
// middleware.js

import { NextResponse } from 'next/server';
import admin from './lib/firebase/admin';

export async function middleware(request) {
  // Paths that require authentication
  const authPaths = [
    '/api/users/me',
    // Add other protected paths here
  ];
  
  const { pathname } = request.nextUrl;
  
  // Check if the path requires authentication
  if (authPaths.some(path => pathname.startsWith(path))) {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      // Verify the token with Firebase Admin
      await admin.auth().verifyIdToken(token);
      
      // Token is valid, proceed with the request
      return NextResponse.next();
    } catch (error) {
      console.error('Error verifying token:', error);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }
  
  // Not an auth path, proceed normally
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

## Error Handling (MVP Approach)

For the MVP, use a simple error handling pattern:

```javascript
// utils/api-error.js

export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

export function handleApiError(error) {
  console.error('API Error:', error);
  
  if (error instanceof ApiError) {
    return {
      error: error.message,
      status: error.statusCode
    };
  }
  
  // Default server error
  return {
    error: 'Internal Server Error',
    status: 500
  };
}
```

## Rate Limiting (Future Enhancement)

Rate limiting will be implemented post-funding by the professional development team. For MVP, include a placeholder comment:

```javascript
// TODO: Implement rate limiting post-funding
// This will protect the API from abuse and DOS attacks
```

## API Documentation (Future Enhancement)

Full API documentation using Swagger/OpenAPI will be implemented post-funding. For MVP, include simple JSDoc comments:

```javascript
/**
 * @description Get all resources with optional filtering
 * @route GET /api/resources
 * @query {string} category - Filter by category
 * @query {string} source - Filter by source (federal, state, ngo)
 * @query {number} limit - Limit number of results
 * @returns {Object} JSON object with resources array
 */
```

## Security Considerations for MVP

For the MVP phase, implement these basic security measures:

1. **Input Validation**: Validate all inputs using a library like Zod
2. **CORS Configuration**: Restrict API access to known domains
3. **Environment Variables**: Secure all credentials in environment variables
4. **No Sensitive Data Exposure**: Don't expose sensitive data in responses

Example CORS configuration for MVP:

```javascript
// next.config.js

module.exports = {
  async headers() {
    return [
      {
        // Apply these headers to all API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? 'https://vet1stop.vercel.app' 
              : 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};
```

## Implementation Notes for MVP Phase

1. Focus on core resource API routes first
2. Implement basic authentication for user accounts
3. Ensure proper error handling for improved debugging
4. Add simple filtering for resources by category and source
5. Create stubs for future premium features
6. Document APIs with simple comments for developer reference
7. Test all routes with Postman or similar tools

## Post-Funding Enhancements

The professional development team will implement these API enhancements after funding:

1. Comprehensive API security with JWT validation
2. Military verification API endpoints
3. Rate limiting and throttling
4. Complete Swagger/OpenAPI documentation
5. Advanced filtering and search capabilities
6. Community and social API endpoints
7. Business directory API endpoints
8. Payment processing integration
9. Enhanced error handling and monitoring

This API Routes blueprint provides a clear pathway for developing the necessary endpoints for the MVP investor pitch while indicating which advanced features will be implemented by a professional development team post-funding.
