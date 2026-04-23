import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

let db: any;

class NeonDb {
  private sql: any;

  constructor(url: string) {
    this.sql = neon(url);
  }

  private convertQuery(query: string) {
    let count = 1;
    return query.replace(/\?/g, () => `$${count++}`);
  }

  // Use sql.query() — the conventional function-call API for dynamic queries
  private async executeQuery(q: string, p: any[] = []) {
    return await this.sql.query(q, p);
  }

  async all(query: string, params: any[] = []) {
    try {
      const result = await this.executeQuery(this.convertQuery(query), params);
      // sql.query returns a pg-style result object: { rows: [...] }
      return result.rows ?? result;
    } catch (error) {
      console.error('Database Error (all):', error);
      throw error;
    }
  }

  async get(query: string, params: any[] = []) {
    try {
      const result = await this.executeQuery(this.convertQuery(query), params);
      const rows = result.rows ?? result;
      return rows[0] || null;
    } catch (error) {
      console.error('Database Error (get):', error);
      throw error;
    }
  }

  async run(query: string, params: any[] = []) {
    try {
      let q = this.convertQuery(query).trim();

      if (q.endsWith(';')) {
        q = q.slice(0, -1);
      }

      if (q.toUpperCase().startsWith('INSERT')) {
        if (!q.toUpperCase().includes('RETURNING')) {
          q += ' RETURNING id';
        }
        const result = await this.executeQuery(q, params);
        const rows = result.rows ?? result;
        return { lastID: rows[0]?.id ?? null };
      }

      await this.executeQuery(q, params);
      return { changes: 1 };
    } catch (error) {
      console.error('Database Error (run):', error);
      throw error;
    }
  }

  async exec(query: string) {
    try {
      const statements = query
        .split(';')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);

      for (const s of statements) {
        await this.executeQuery(s);
      }
    } catch (error) {
      console.error('Database Error (exec):', error);
      throw error;
    }
  }
}

export async function resetDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL environment variable is missing');

  const tempDb = new NeonDb(url);
  console.log('Dropping tables...');
  await tempDb.exec('DROP TABLE IF EXISTS field_updates');
  await tempDb.exec('DROP TABLE IF EXISTS assignments');
  await tempDb.exec('DROP TABLE IF EXISTS fields');
  await tempDb.exec('DROP TABLE IF EXISTS users');
  console.log('Tables dropped successfully');
}

export async function initDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn('⚠️ DATABASE_URL environment variable is missing. Database functionality will be unavailable.');
    return;
  }

  try {
    db = new NeonDb(url);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin', 'agent')) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS fields (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        crop_type TEXT NOT NULL,
        planting_date DATE NOT NULL,
        current_stage TEXT NOT NULL,
        status TEXT CHECK(status IN ('Active', 'At Risk', 'Completed')) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS assignments (
        id SERIAL PRIMARY KEY,
        field_id INTEGER NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
        agent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(field_id, agent_id)
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS field_updates (
        id SERIAL PRIMARY KEY,
        field_id INTEGER NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
        agent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        stage TEXT NOT NULL,
        notes TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed only if empty
    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    if (parseInt(userCount.count) === 0) {
      const adminPass = await bcrypt.hash('admin123', 10);
      const agentPass = await bcrypt.hash('agent123', 10);

      await db.run(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        ['Admin User', 'admin@example.com', adminPass, 'admin']
      );

      const agents = [];
      const agentNames = [
        'Sarah Cooper', 'Michael Chen', 'Elena Rodriguez',
        'David Smith', 'Amara Okafor', 'James Wilson'
      ];

      for (let i = 0; i < agentNames.length; i++) {
        const email = `agent${i + 1}@example.com`;
        const res = await db.run(
          'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
          [agentNames[i], email, agentPass, 'agent']
        );
        agents.push({ id: res.lastID, name: agentNames[i] });
      }

      const fieldData = [
        ['North Valley Corn', 'Corn', '2024-03-15', 'Vegetative', 'Active'],
        ['East Ridge Soybeans', 'Soybeans', '2024-04-01', 'Germination', 'Active'],
        ['South Plain Wheat', 'Wheat', '2023-11-20', 'Flowering', 'At Risk'],
        ['West Hill Barley', 'Barley', '2024-02-10', 'Ripening', 'Active'],
        ['Central Potato Bank', 'Potato', '2024-03-20', 'Tuber Formation', 'Active'],
        ['Oak Creek Rice', 'Rice', '2024-05-01', 'Seedling', 'Active'],
        ['Sunny Slope Sunflowers', 'Sunflowers', '2024-04-10', 'Vegetative', 'Active'],
        ['River Delta Cotton', 'Cotton', '2024-03-05', 'Boll Development', 'At Risk'],
        ['Highland Coffee', 'Coffee', '2023-10-15', 'Harvesting', 'Completed'],
        ['Desert Oasis Dates', 'Dates', '2022-01-01', 'Fruiting', 'Active'],
        ['Prairie Land Oats', 'Oats', '2024-03-25', 'Heading', 'Active'],
        ['Misty Mountain Tea', 'Tea', '2021-06-01', 'Plucking', 'Active'],
        ['Golden Field Sugarcane', 'Sugarcane', '2023-08-12', 'Maturation', 'Active'],
        ['Emerald Vineyard', 'Grapes', '2024-02-28', 'Leaf Development', 'Active']
      ];

      const fieldIds = [];
      for (const data of fieldData) {
        const res = await db.run(
          'INSERT INTO fields (name, crop_type, planting_date, current_stage, status) VALUES (?, ?, ?, ?, ?)',
          data
        );
        fieldIds.push(res.lastID);
      }

      for (let i = 0; i < fieldIds.length; i++) {
        const agent = agents[i % agents.length];
        await db.run(
          'INSERT INTO assignments (field_id, agent_id) VALUES (?, ?)',
          [fieldIds[i], agent.id]
        );
      }

      for (let i = 0; i < 5; i++) {
        await db.run(
          'INSERT INTO field_updates (field_id, agent_id, stage, notes) VALUES (?, ?, ?, ?)',
          [fieldIds[i], agents[i % agents.length].id, 'Vegetative', 'Initial report. Growth looks healthy and consistent across the sector.']
        );
      }
    }

    console.log('✅ PostgreSQL (Neon) initialized');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

export function getDb() {
  if (!db) throw new Error('Database not initialized. Ensure initDb() has been called.');
  return db;
}