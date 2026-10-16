import { createNeo4jDriver } from '@iounfold/db-client';

export const floorballNeo4j = createNeo4jDriver(
  process.env.FLOORBALL_NEO4J_URI || 'bolt://localhost:7687',
  process.env.FLOORBALL_NEO4J_USER || 'neo4j',
  process.env.FLOORBALL_NEO4J_PASSWORD || 'secret'
);
