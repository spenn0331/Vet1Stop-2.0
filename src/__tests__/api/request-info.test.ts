import { NextRequest } from 'next/server';
import { POST } from '@/app/api/request-info/route';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Mock the MongoDB connection and ObjectId
jest.mock('@/lib/mongodb', () => ({
  connectToDatabase: jest.fn()
}));

jest.mock('mongodb', () => ({
  ObjectId: jest.fn((id) => ({ toString: () => id }))
}));

describe('Request Info API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST endpoint', () => {
    test('returns 400 when required fields are missing', async () => {
      // Create a mock request with missing fields
      const req = new NextRequest(new URL('http://localhost:3000/api/request-info'), {
        method: 'POST',
        body: JSON.stringify({ 
          ngoId: '123',
          veteranName: 'John Doe',
          // Missing email and phone
          preferredContact: 'email'
        })
      });
      
      const response = await POST(req);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Required fields missing');
    });

    test('returns 404 when NGO is not found', async () => {
      // Mock the database connection to return null for findOne
      (connectToDatabase as jest.Mock).mockResolvedValue({
        db: {
          collection: jest.fn().mockReturnValue({
            findOne: jest.fn().mockResolvedValue(null)
          })
        }
      });

      // Create a mock request with valid data
      const reqData = {
        ngoId: '123',
        veteranName: 'John Doe',
        email: 'john@example.com',
        phone: '555-123-4567',
        serviceStatus: 'veteran',
        questions: ['What services do you offer?'],
        preferredContact: 'email'
      };
      
      const req = new NextRequest(new URL('http://localhost:3000/api/request-info'), {
        method: 'POST',
        body: JSON.stringify(reqData)
      });
      
      const response = await POST(req);
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.error).toBe('NGO not found');
    });

    test('successfully creates an info request with valid data', async () => {
      // Mock the database connection and operations
      const mockFindOne = jest.fn().mockResolvedValue({
        _id: '123',
        name: 'Test NGO'
      });
      
      const mockInsertOne = jest.fn().mockResolvedValue({
        insertedId: { toString: () => '456' }
      });

      (connectToDatabase as jest.Mock).mockResolvedValue({
        db: {
          collection: jest.fn().mockImplementation((name) => {
            if (name === 'ngos') {
              return { findOne: mockFindOne };
            }
            return { insertOne: mockInsertOne };
          })
        }
      });

      // Create a mock request with valid data
      const reqData = {
        ngoId: '123',
        veteranName: 'John Doe',
        email: 'john@example.com',
        phone: '555-123-4567',
        serviceStatus: 'veteran',
        questions: ['What services do you offer?'],
        preferredContact: 'email'
      };
      
      const req = new NextRequest(new URL('http://localhost:3000/api/request-info'), {
        method: 'POST',
        body: JSON.stringify(reqData)
      });
      
      const response = await POST(req);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.requestId).toBe('456');
      expect(mockInsertOne).toHaveBeenCalledWith(expect.objectContaining({
        ngoId: '123',
        ngoName: 'Test NGO',
        veteranName: 'John Doe',
        email: 'john@example.com',
        status: 'pending'
      }));
    });
  });
});
