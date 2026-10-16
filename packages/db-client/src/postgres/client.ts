import { Pool } from 'pg';

// Initialisiert den Postgres Pool basierend auf Umgebungsvariablen oder den Standardwerten aus dem Docker-Setup
export const pgPool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgres://iounfold:iounfold_password@localhost:5432/iounfold_control'
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pgPool.query(text, params);
  const duration = Date.now() - start;
  console.log('📊 [DB Query]', { text, duration, rows: res.rowCount });
  return res;
}
