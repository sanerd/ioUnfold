// packages/db-client/src/index.ts
import neo4j, { Driver, Config as Neo4jConfig } from 'neo4j-driver';
import { Pool, PoolConfig } from 'pg';

export function createNeo4jDriver(
  uri: string,
  user: string,
  pass: string,
  config?: Neo4jConfig
): Driver {
  return neo4j.driver(uri, neo4j.auth.basic(user, pass), {
    maxConnectionPoolSize: 50,
    ...config
  });
}

export function createTimescalePool(
  connectionString: string,
  config?: PoolConfig
): Pool {
  return new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    ...config
  });
}

// Export des Job-Repositories und der Typen
export * from './postgres/jobRepository.js';
