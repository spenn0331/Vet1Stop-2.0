/**
 * Firebase Admin SDK Configuration
 * 
 * This module sets up Firebase Admin SDK for server-side operations
 * like authentication verification and Firestore access.
 * 
 * For local development, it uses a mock implementation.
 */

// Mock implementation for development
class MockAuth {
  async verifyIdToken(token: string) {
    console.log('Development mode: Mocking token verification for', token.substring(0, 10) + '...');
    
    // Return a mock decoded token with common properties
    return {
      uid: 'mock-user-id',
      email: 'veteran@example.com',
      name: 'Veteran User',
      admin: token.includes('admin'), // Simulate admin role if token contains 'admin'
      veteran: true,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };
  }
  
  // Add other Firebase Admin Auth methods as needed
  async getUser(uid: string) {
    return {
      uid,
      email: 'veteran@example.com',
      displayName: 'Veteran User',
      customClaims: {
        admin: uid === 'admin-user-id',
        veteran: true
      }
    };
  }
  
  async setCustomUserClaims(uid: string, claims: any) {
    console.log(`Development mode: Setting custom claims for ${uid}:`, claims);
    return;
  }
}

// Export a mock Firebase Admin SDK for development
export const auth = new MockAuth();

// Mock Firestore implementation if needed
class MockFirestore {
  collection(path: string) {
    return {
      doc: (id: string) => ({
        get: async () => ({
          exists: true,
          data: () => ({ 
            id,
            name: 'Mock Document',
            createdAt: new Date().toISOString()
          })
        }),
        set: async (data: any) => console.log(`Development mode: Writing to ${path}/${id}:`, data),
        update: async (data: any) => console.log(`Development mode: Updating ${path}/${id}:`, data),
        delete: async () => console.log(`Development mode: Deleting ${path}/${id}`)
      }),
      add: async (data: any) => {
        const id = `mock-${Date.now()}`;
        console.log(`Development mode: Adding to ${path} with ID ${id}:`, data);
        return { id };
      },
      where: () => ({
        get: async () => ({
          empty: false,
          docs: [
            {
              id: 'mock-doc-1',
              data: () => ({ 
                id: 'mock-doc-1',
                name: 'Mock Document 1',
                createdAt: new Date().toISOString()
              })
            }
          ]
        })
      })
    };
  }
}

export const firestore = new MockFirestore();
