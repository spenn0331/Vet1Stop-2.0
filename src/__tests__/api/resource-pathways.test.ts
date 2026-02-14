import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/resource-pathways/route';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Mock the MongoDB connection and ObjectId
jest.mock('@/lib/mongodb', () => ({
  connectToDatabase: jest.fn()
}));

jest.mock('mongodb', () => ({
  ObjectId: jest.fn((id) => ({ toString: () => id }))
}));

describe('Resource Pathways API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET endpoint', () => {
    test('returns pathways without filters', async () => {
      // Mock the database connection and operations
      const mockFind = jest.fn().mockReturnThis();
      const mockSort = jest.fn().mockReturnThis();
      const mockToArray = jest.fn().mockResolvedValue([
        { 
          _id: '1',
          title: 'Test Pathway 1',
          steps: [{ title: 'Step 1' }]
        },
        {
          _id: '2',
          title: 'Test Pathway 2',
          steps: [{ title: 'Step 1', ngoId: '123' }]
        }
      ]);

      const mockFindOne = jest.fn().mockResolvedValue({
        _id: '123',
        name: 'Test NGO'
      });

      (connectToDatabase as jest.Mock).mockResolvedValue({
        db: {
          collection: jest.fn().mockImplementation((name) => {
            if (name === 'resourcePathways') {
              return {
                find: mockFind,
                sort: mockSort,
                toArray: mockToArray
              };
            }
            return {
              findOne: mockFindOne
            };
          })
        }
      });

      // Create a mock request
      const req = new NextRequest(new URL('http://localhost:3000/api/resource-pathways'));
      
      const response = await GET(req);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.pathways).toHaveLength(2);
      expect(mockFind).toHaveBeenCalledWith({});
    });

    test('returns pathways with category filter', async () => {
      // Mock the database connection and operations
      const mockFind = jest.fn().mockReturnThis();
      const mockSort = jest.fn().mockReturnThis();
      const mockToArray = jest.fn().mockResolvedValue([
        { 
          _id: '1',
          title: 'Test Health Pathway',
          category: 'health',
          steps: []
        }
      ]);

      (connectToDatabase as jest.Mock).mockResolvedValue({
        db: {
          collection: jest.fn().mockImplementation((name) => {
            if (name === 'resourcePathways') {
              return {
                find: mockFind,
                sort: mockSort,
                toArray: mockToArray
              };
            }
            return {
              findOne: jest.fn().mockResolvedValue(null)
            };
          })
        }
      });

      // Create a mock request with category filter
      const req = new NextRequest(new URL('http://localhost:3000/api/resource-pathways?category=health'));
      
      const response = await GET(req);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(mockFind).toHaveBeenCalledWith({ category: 'health' });
    });
  });

  describe('POST endpoint', () => {
    test('returns 400 when required fields are missing', async () => {
      // Create a mock request with missing fields
      const req = new NextRequest(new URL('http://localhost:3000/api/resource-pathways'), {
        method: 'POST',
        body: JSON.stringify({ title: 'Test Pathway' })
      });
      
      const response = await POST(req);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Title and steps are required');
    });

    test('successfully creates a pathway with valid data', async () => {
      // Mock the database connection and insertOne operation
      const mockInsertOne = jest.fn().mockResolvedValue({
        insertedId: { toString: () => '456' }
      });

      (connectToDatabase as jest.Mock).mockResolvedValue({
        db: {
          collection: jest.fn().mockReturnValue({
            insertOne: mockInsertOne
          })
        }
      });

      // Create a mock request with valid data
      const reqData = {
        title: 'Test Pathway',
        description: 'Test Description',
        category: 'health',
        tags: ['mental', 'support'],
        steps: [
          {
            title: 'Step 1',
            description: 'First step',
            action: 'Contact the NGO'
          }
        ]
      };
      
      const req = new NextRequest(new URL('http://localhost:3000/api/resource-pathways'), {
        method: 'POST',
        body: JSON.stringify(reqData)
      });
      
      const response = await POST(req);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.pathwayId).toBe('456');
      expect(mockInsertOne).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Test Pathway',
        category: 'health',
        steps: [expect.objectContaining({
          title: 'Step 1',
          order: 1
        })]
      }));
    });
  });
});
