import { getNeo4jSession } from '../config/neo4j';
import {
  ApiSeason,
  ApiClub,
  ApiTeam,
  ApiLeague,
  ApiGroup
} from '@iounfold/database-schemas';

export class CompetitionRepository {
  // Speichert eine Saison in der Neo4j-Datenbank
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

  // Speichert einen Club in der Neo4j-Datenbank und verknüpft sie mit der Saison
  async saveClub(club: ApiClub): Promise<void> {
    const session = getNeo4jSession();
    const query = `
MATCH (s:Season { id: $seasonId })
MERGE (c:Club { id: $id })
SET c.name = $name
MERGE (s)-[:HAS_CLUB]->(c)
`;
    try {
      await session.executeWrite((tx) =>
        tx.run(query, { ...club, seasonId: club.seasonId })
      );
      console.log(` Club "${club.name}" (ID: ${club.id}) verknüpft.`);
    } finally {
      await session.close();
    }
  }

  //Speichert ein Team in der Neo4j-Datenbank und verknüpft es mit dem Club, der Liga und der Saison
  async saveTeam(team: ApiTeam): Promise<void> {
    const session = getNeo4jSession();
    const query = `
MATCH (s:Season { id: $seasonId })
MATCH (c:Club { id: $clubId })
MERGE (t:Team { id: $id })
SET t.name = $name
MERGE (c)-[:HAS_TEAM]->(t)
MERGE (t)-[:PARTICIPATES_IN]->(s)
`;
    try {
      await session.executeWrite((tx) =>
        tx.run(query, {
          ...team,
          seasonId: team.seasonId,
          clubId: team.clubId,
          leagueId: team.leagueId
        })
      );
      console.log(` Team "${team.name}" (ID: ${team.id}) verknüpft.`);
    } finally {
      await session.close();
    }
  }

  // Speichert eine Liga in der Neo4j-Datenbank und verknüpft sie mit der Saison
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

  // Speichert eine Gruppe in der Neo4j-Datenbank und verknüpft sie mit der Liga, Spielklasse und Saison
  async saveGroup(group: ApiGroup): Promise<void> {
    const session = getNeo4jSession();
    const query = `
MATCH (s:Season { id: $seasonId })
MATCH (gc:GameClass { id: $gameClassId })
MATCH (l:League { id: $leagueId })
MERGE (g:Group { id: $id })
SET g.name = $name
MERGE (l)-[:HAS_GROUP]->(g)
MERGE (gc)-[:HAS_GROUP]->(g)
MERGE (s)-[:HAS_GROUP]->(g)
`;
    try {
      await session.executeWrite((tx) =>
        tx.run(query, {
          ...group,
          seasonId: group.seasonId,
          gameClassId: group.gameClassId,
          leagueId: group.leagueId
        })
      );
      console.log(` Gruppe "${group.name}" (ID: ${group.id}) verknüpft.`);
    } finally {
      await session.close();
    }
  }
}
