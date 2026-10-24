import { Pool } from 'pg';

export interface SyncJobRecord {
  id: string;
  type: string;
  target: string;
  status: 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  cursor_position?: string;
  details?: string;
  created_at: Date;
}

export class JobRepository {
  constructor(private pool: Pool) {}

  // Initialisiert die Tabelle für Jobs falls nicht vorhanden
  async ensureTableExists(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS sync_jobs (
        id VARCHAR(64) PRIMARY KEY,
        type VARCHAR(64) NOT NULL,
        target VARCHAR(255) NOT NULL,
        status VARCHAR(32) NOT NULL,
        progress INT DEFAULT 0,
        cursor_position TEXT,
        details TEXT,
        payload JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  async getJobs(): Promise<SyncJobRecord[]> {
    await this.ensureTableExists();
    const res = await this.pool.query(
      'SELECT * FROM sync_jobs ORDER BY created_at DESC LIMIT 50'
    );
    return res.rows;
  }

  async upsertJob(
    job: Partial<SyncJobRecord> & {
      id: string;
      type: string;
      target: string;
      status: string;
    }
  ): Promise<void> {
    await this.ensureTableExists();
    await this.pool.query(
      `
      INSERT INTO sync_jobs (id, type, target, status, progress, cursor_position, details)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) 
      DO UPDATE SET 
        status = EXCLUDED.status,
        progress = EXCLUDED.progress,
        cursor_position = COALESCE(EXCLUDED.cursor_position, sync_jobs.cursor_position),
        details = EXCLUDED.details;
    `,
      [
        job.id,
        job.type,
        job.target,
        job.status,
        job.progress ?? 0,
        job.cursor_position ?? null,
        job.details ?? ''
      ]
    );
  }

  async deleteJob(id: string): Promise<void> {
    await this.ensureTableExists();
    await this.pool.query('DELETE FROM sync_jobs WHERE id = $1', [id]);
  }

  async updateStatusAndCursor(
    id: string,
    status: string,
    cursorPosition?: string
  ): Promise<void> {
    if (cursorPosition !== undefined) {
      await this.pool.query(
        'UPDATE sync_jobs SET status = $1, cursor_position = $2 WHERE id = $3',
        [status, cursorPosition, id]
      );
    } else {
      await this.pool.query('UPDATE sync_jobs SET status = $1 WHERE id = $2', [
        status,
        id
      ]);
    }
  }

  async saveJobPayload(id: string, payload: any): Promise<void> {
    await this.ensureTableExists();
    await this.pool.query(`UPDATE sync_jobs SET payload = $1 WHERE id = $2`, [
      payload,
      id
    ]);
  }

  async getJobPayload(id: string): Promise<any> {
    await this.ensureTableExists();
    const res = await this.pool.query(
      `SELECT payload FROM sync_jobs WHERE id = $1`,
      [id]
    );
    return res.rows[0]?.payload || null;
  }
}
