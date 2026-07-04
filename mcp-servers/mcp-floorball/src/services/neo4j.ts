import neo4j, { Driver } from 'neo4j-driver';

let driver: Driver;

export const initNeo4j = () => {
  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const user = process.env.NEO4J_USER || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || 'password';

  driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
};

export const getSession = () => {
  return driver.session();
};

export const closeNeo4j = async () => {
  if (driver) await driver.close();
};
