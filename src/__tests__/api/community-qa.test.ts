import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/community-qa/route';
import { connectToDatabase } from '@/lib/mongodb';

// Mock the MongoDB connection
jest.mock('@/lib/mongodb', () => ({
  connectToDatabase: jest.fn()
}));

describe('Community Q&A API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET endpoint', () => {
    test('returns 400 when ngoId is missing', async () => {
      // Create a mock request without ngoId
      const req = new NextRequest(new URL('http://localhost:3000/api/community-qa'));
      
      const response = await GET(req);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('NGO ID is required');
    });

    test('returns questions when valid ngoId is provided', async () => {
      // Mock the database connection and find operation
      const mockFind = jest.fn().mockReturnThis();
      const mockSort = jest.fn().mockReturnThis();
      const mockToArray = jest.fn().mockResolvedValue([
        { 
          question: 'Test question 1',
          answers: []
        },
        {
          question: 'Test question 2',
          answers: [{ text: 'Test answer' }]
        }
      ]);

      (connectToDatabase as jest.Mock).mockResolvedValue({
        db: {
          collection: jest.fn().mockReturnValue({
            find: mockFind,
            sort: mockSort,
            toArray: mockToArray
          })
        }
      });

      // Create a mock request with ngoId
      const req = new NextRequest(new URL('http://localhost:3000/api/community-qa?ngoId=123'));
      
      const response = await GET(req);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.questions).toHaveLength(2);
      expect(mockFind).toHaveBeenCalledWith({ ngoId: '123' });
    });
  });

  describe('POST endpoint', () => {
    test('returns 400 when required fields are missing', async () => {
      // Create a mock request with missing fields
      const req = new NextRequest(new URL('http://localhost:3000/api/community-qa'), {
        method: 'POST',
        body: JSON.stringify({ askedBy: 'Test User' })
      });
      
      const response = await POST(req);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('NGO ID and question are required');
    });

    test('successfully creates a question with valid data', async () => {
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
        ngoId: '123',
        question: 'Test question',
        askedBy: 'Test User',
        contactInfo: 'test@example.com'
      };
      
      const req = new NextRequest(new URL('http://localhost:3000/api/community-qa'), {
        method: 'POST',
        body: JSON.stringify(reqData)
      });
      
      const response = await POST(req);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.questionId).toBe('456');
      expect(mockInsertOne).toHaveBeenCalledWith(expect.objectContaining({
        ngoId: '123',
        question: 'Test question',
        askedBy: 'Test User'
      }));
    });
  });
});
