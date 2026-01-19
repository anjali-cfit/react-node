import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'ecommerce_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log('Running migration: Add pending_payment status to orders table...');

    // Drop existing constraint
    await client.query(`
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check
    `);
    console.log('Dropped existing constraint');

    // Add new constraint with pending_payment
    await client.query(`
      ALTER TABLE orders ADD CONSTRAINT orders_status_check
      CHECK (status IN ('pending_payment', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'))
    `);
    console.log('Added new constraint with pending_payment status');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
