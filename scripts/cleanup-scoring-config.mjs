import { MongoClient } from 'mongodb';
import 'dotenv/config';

const client = new MongoClient(process.env.DATABASE_URL || '');

async function cleanup() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    const db = client.db();
    const collection = db.collection('ScoringConfig');
    
    // Get all configs
    const configs = await collection.find({}).toArray();
    console.log(`Found ${configs.length} scoring configs`);
    
    if (configs.length > 1) {
      // Find the one with id "default_scoring_config" or keep the first one
      let keepConfig = configs.find(c => c._id === 'default_scoring_config') || configs[0];
      const deleteIds = configs
        .filter(c => c._id !== keepConfig._id)
        .map(c => c._id);
      
      console.log('Keeping config:', keepConfig._id);
      console.log('Deleting configs:', deleteIds);
      
      if (deleteIds.length > 0) {
        await collection.deleteMany({ _id: { $in: deleteIds } });
        console.log('✓ Deleted duplicate configs');
      }
      
      // Update the kept config to ensure it's active and has correct structure
      await collection.updateOne(
        { _id: keepConfig._id },
        {
          $set: {
            active: true,
            pointsPerKm: 2,
            minDistanceKm: 3,
            requireAtLeastOnePlace: true,
            placeTypePoints: {
              PEAK: 1,
              TOWER: 1,
              TREE: 1,
              OTHER: 0
            }
          }
        }
      );
      
      console.log('✓ Cleanup complete. Now only 1 config exists.');
    } else if (configs.length === 1) {
      console.log('✓ Already clean - only 1 config exists');
      
      // Update it to ensure correct structure
      await collection.updateOne(
        { _id: configs[0]._id },
        {
          $set: {
            active: true,
            pointsPerKm: 2,
            minDistanceKm: 3,
            requireAtLeastOnePlace: true,
            placeTypePoints: {
              PEAK: 1,
              TOWER: 1,
              TREE: 1,
              OTHER: 0
            }
          }
        }
      );
      console.log('✓ Updated config structure');
    } else {
      console.log('No configs found, creating default...');
      await collection.insertOne({
        _id: 'default_scoring_config',
        pointsPerKm: 2,
        minDistanceKm: 3,
        requireAtLeastOnePlace: true,
        placeTypePoints: {
          PEAK: 1,
          TOWER: 1,
          TREE: 1,
          OTHER: 0
        },
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✓ Created default config');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

cleanup();
