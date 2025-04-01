import { Client } from 'pg';

export const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

client.connect();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query(text: string, params?: any[]) {
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
} 