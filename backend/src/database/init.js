import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const initDatabase = async () => {
  // First, connect to default 'postgres' database to create our database
  const adminClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await adminClient.connect();
    console.log('Connected to PostgreSQL');

    // Check if database exists
    const dbName = process.env.DB_NAME || 'ecommerce_db';
    const result = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (result.rows.length === 0) {
      // Create database
      await adminClient.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database '${dbName}' created successfully`);
    } else {
      console.log(`Database '${dbName}' already exists`);
    }

  } catch (error) {
    if (error.code === '42P04') {
      console.log('Database already exists');
    } else {
      console.error('Error:', error.message);
      process.exit(1);
    }
  } finally {
    await adminClient.end();
  }
};

initDatabase();
