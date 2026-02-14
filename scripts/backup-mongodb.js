// backup-mongodb.js

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Connection URI
const uri = process.env.MONGODB_URI || 'mongodb+srv://spennyvet1stop:UMGaPUiLTI1cPRMy@cluster0.hpghrbe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Backup directory
const backupDir = path.join(__dirname, 'backup');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupDir, `backup-${timestamp}`);

async function backupDatabase() {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    const databases = await client.db().admin().listDatabases();
    console.log('Databases to backup:', databases.databases.map(db => db.name));

    for (const dbInfo of databases.databases) {
      const dbName = dbInfo.name;
      const db = client.db(dbName);
      const collections = await db.listCollections().toArray();
      console.log(`Backing up database: ${dbName}`);

      const dbBackupPath = path.join(backupPath, dbName);
      if (!fs.existsSync(dbBackupPath)) {
        fs.mkdirSync(dbBackupPath, { recursive: true });
      }

      for (const collectionInfo of collections) {
        const collectionName = collectionInfo.name;
        console.log(`  Backing up collection: ${collectionName}`);
        const collection = db.collection(collectionName);
        const documents = await collection.find().toArray();

        if (documents.length > 0) {
          const filePath = path.join(dbBackupPath, `${collectionName}.json`);
          fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));
          console.log(`    Saved ${documents.length} documents to ${filePath}`);
        } else {
          console.log(`    No documents found in ${collectionName}, skipping...`);
        }
      }
    }

    console.log('Backup completed successfully.');
  } catch (error) {
    console.error('Error during backup:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed.');
  }
}

backupDatabase();
