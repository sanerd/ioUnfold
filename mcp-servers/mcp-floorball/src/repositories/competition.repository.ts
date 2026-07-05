import { getNeo4jSession } from '../config/neo4j';
import { ApiSeason, ApiLeague } from '@iounfold/database-schemas';

export class CompetitionRepository {
  async saveSeason(season: ApiSeason): Promise<void> {
    const session = getNeo4jSession();
    const query = `
MERGE (s:Season { id: $id })
SET s.name = $name
`;
    try {
      await session.executeWrite((tx) => tx.run(query, season));
      console.log(` Saison "${season.name}" in Neo4j synchronisiert.`);
    } finally {
      await session.close();
    }
  }
  async saveLeague(league: ApiLeague): Promise<void> {
    const session = getNeo4jSession();
    const query = `
MATCH (s:Season { id: $seasonId })
MERGE (gc:GameClass { id: $gameClassId })
MERGE (s)-[:HAS_GAME_CLASS]->(gc)
MERGE (l:League { id: $leagueId })
SET l.name = $name
MERGE (gc)-[:HAS_LEAGUE]->(l)
`;
    try {
      await session.executeWrite((tx) =>
        tx.run(query, {
          seasonId: league.seasonId,
          gameClassId: league.gameClassId,
          leagueId: league.leagueId,
          name: league.name
        })
      );
      console.log(
        ` Liga-Knoten "${league.name}" (ID: ${league.leagueId}) verknüpft.`
      );
    } finally {
      await session.close();
    }
  }
}
