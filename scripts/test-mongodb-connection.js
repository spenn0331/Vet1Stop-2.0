const { MongoClient } = require('mongodb');

// MongoDB URI from environment or fallback to the hardcoded one in mongodb.ts
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://spennyvet1stop:UMGaPUiLTI1cPRMy@cluster0.hpghrbe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const dbName = 'vet1stop';

async function main() {
    console.log('Testing MongoDB connection...');
    console.log(`URI: ${MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`); // Hide password in logs

    const client = new MongoClient(MONGODB_URI, {
        connectTimeoutMS: 10000, // 10 seconds
        socketTimeoutMS: 45000,   // 45 seconds
    });

    try {
        console.log('Connecting to MongoDB...');
        await client.connect();
        console.log('Connected to MongoDB successfully');

        // Get database
        const db = client.db(dbName);
        console.log(`Connected to database: ${dbName}`);

        // List collections
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        console.log('Available collections:', collectionNames);

        // Check specifically for symptomResources collection
        const hasSymptomResources = collectionNames.includes('symptomResources');

        if (hasSymptomResources) {
            console.log('symptomResources collection exists');

            // Count documents
            const count = await db.collection('symptomResources').countDocuments();
            console.log(`Found ${count} documents in symptomResources collection`);

            // Get a sample document
            const sampleDoc = await db.collection('symptomResources').findOne({});
            console.log('Sample document:', JSON.stringify(sampleDoc, null, 2).substring(0, 500) + '...');
        } else {
            console.log('symptomResources collection does NOT exist');
        }

    } catch (err) {
        console.error('MongoDB connection test failed:', err);
    } finally {
        await client.close();
        console.log('MongoDB connection closed');
    }
}

main().catch(console.error); 