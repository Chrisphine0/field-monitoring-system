import dotenv from 'dotenv';
import { initDb, resetDb } from '../server/db.ts';

dotenv.config();

async function runSetup() {
  if (process.env.NODE_ENV === 'production' && process.env.FORCE_SETUP !== 'true') {
    console.error('❌ DISASTER PREVENTION: Database setup cannot run in production without FORCE_SETUP=true');
    console.log('This script is destructive and will drop all tables.');
    process.exit(1);
  }

  console.log('🚀 Starting Database Setup...');
  
  try {
    // 1. Reset the database (Drop tables)
    await resetDb();
    
    // 2. Initialize the database (Create tables and Seed data)
    await initDb();
    
    console.log('✅ Database Setup Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database Setup Failed:', error);
    process.exit(1);
  }
}

runSetup();
