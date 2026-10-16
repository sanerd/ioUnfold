import neo4j, { Driver, Config } from 'neo4j-driver';

export function createNeo4jDriver(
  uri: string,
  user: string,
  pass: string,
  config?: Config
): Driver {
  // Hier kannst du globale Policies (z. B. Logging, Timeouts, Auth-Handling) zentral erzwingen
  return neo4j.driver(uri, neo4j.auth.basic(user, pass), {
    maxConnectionPoolSize: 50,
    ...config
  });
}
