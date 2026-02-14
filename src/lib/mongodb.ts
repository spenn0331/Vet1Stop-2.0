import { MongoClient, MongoClientOptions, ServerApiVersion, Db } from 'mongodb';

// More robust check for MongoDB URI with fallback for local development
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://spennyvet1stop:UMGaPUiLTI1cPRMy@cluster0.hpghrbe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

console.log('MongoDB URI is configured');

const options: MongoClientOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

// Global is used to maintain the connection across hot reloads in development
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Database instance to be reused
let cachedDb: Db | null = null;

declare global {
  var _mongoClientPromise: Promise<MongoClient>;
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  console.log('Running in development mode, using global MongoDB client');

  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    console.log('Creating new MongoDB client connection in development mode');
    client = new MongoClient(MONGODB_URI, options);
    globalWithMongo._mongoClientPromise = client.connect()
      .then(client => {
        console.log('MongoDB connected successfully in development mode');
        return client;
      })
      .catch(err => {
        console.error('Failed to connect to MongoDB in development mode:', err);
        throw err;
      });
  } else {
    console.log('Using existing MongoDB client connection from global variable');
  }

  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  console.log('Running in production mode, creating new MongoDB client');
  client = new MongoClient(MONGODB_URI, options);
  clientPromise = client.connect()
    .then(client => {
      console.log('MongoDB connected successfully in production mode');
      return client;
    })
    .catch(err => {
      console.error('Failed to connect to MongoDB in production mode:', err);
      throw err;
    });
}

// Default database name
const DEFAULT_DB_NAME = 'vet1stop';

// Function to connect to the database and return an object with a db property
export async function connectToDatabase(dbName = DEFAULT_DB_NAME): Promise<{ db: Db }> {
  // Add connection tracing
  console.log(`[MongoDB] Connecting to database: ${dbName}`);

  // Use the cached db if available
  if (cachedDb) {
    console.log('[MongoDB] Using cached database connection');
    return { db: cachedDb };
  }

  // Connection retry logic
  const MAX_RETRIES = 3;
  let retryCount = 0;
  let lastError = null;

  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`[MongoDB] Attempt ${retryCount + 1}/${MAX_RETRIES} to connect to database`);

      // Create a new client and connect to the server
      const client = await clientPromise;
      console.log('[MongoDB] Client connection established');

      // Try specific database name
      const db = client.db(dbName);
      console.log(`[MongoDB] Connected to database: ${dbName}`);

      // List collections for debugging
      try {
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name).join(', ');
        console.log(`[MongoDB] Available collections: ${collectionNames}`);

        // Check for symptomResources collection specifically
        if (collections.some(c => c.name === 'symptomResources')) {
          console.log('[MongoDB] Found symptomResources collection');

          // Check document count for diagnostics
          try {
            const count = await db.collection('symptomResources').countDocuments();
            console.log(`[MongoDB] Found ${count} documents in symptomResources collection`);
          } catch (countError) {
            console.warn('[MongoDB] Could not count documents:', countError);
          }
        } else {
          console.warn('[MongoDB] symptomResources collection not found!');
        }
      } catch (listError) {
        console.warn('[MongoDB] Error listing collections:', listError);
      }

      // Cache the database connection
      cachedDb = db;
      return { db };
    } catch (error) {
      console.error(`[MongoDB] Connection attempt ${retryCount + 1} failed:`, error);
      lastError = error;
      retryCount++;

      // Only wait if we're going to retry
      if (retryCount < MAX_RETRIES) {
        console.log(`[MongoDB] Waiting before retry attempt ${retryCount + 1}...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between retries
      }
    }
  }

  // If we've exhausted retries, log and throw the last error
  console.error(`[MongoDB] All ${MAX_RETRIES} connection attempts failed`);
  throw lastError || new Error('Failed to connect to MongoDB after multiple attempts');
}

/**
 * Helper function to get a database instance
 */
export async function getDatabase(dbName = DEFAULT_DB_NAME) {
  try {
    console.log(`Getting database: ${dbName}`);
    const db = await connectToDatabase(dbName);
    return db;
  } catch (error) {
    console.error(`Error getting database ${dbName}:`, error);
    throw error;
  }
}

/**
 * Helper function to get a collection instance
 */
export async function getCollection(collectionName: string, dbName = DEFAULT_DB_NAME) {
  try {
    console.log(`Getting collection: ${collectionName} from database: ${dbName}`);
    const { db } = await getDatabase(dbName);
    return db.collection(collectionName);
  } catch (error) {
    console.error(`Error getting collection ${collectionName} from database ${dbName}:`, error);
    throw error;
  }
}

export { clientPromise };
