import { getNeo4jSession } from '../config/neo4j';
import { Season, Club, Team, League, Group } from '@iounfold/database-schemas';

export class CompetitionRepository {
  // Speichert eine Saison in der Neo4j-Datenbank
  async saveSeason(season: Season): Promise<void> {
    const session = getNeo4jSession();
    const query = `
      MERGE (s:Season { id: $id })
      ON CREATE SET s.name = $name
      ON MATCH SET s.name = $name
    `;
    try {
      await session.executeWrite((tx) => tx.run(query, season));
      console.log(` Saison "${season.name}" in Neo4j synchronisiert.`);
    } finally {
      await session.close();
    }
  }

  // Speichert eine Liga in der Neo4j-Datenbank und verknüpft sie mit der Saison
  async saveLeague(league: League): Promise<void> {
    const session = getNeo4jSession();
    const query = `
      MERGE (s:Season { id: $seasonId })
      MERGE (gc:GameClass { id: $gameClassId })
      MERGE (ls:LeagueSet { id: $leagueSetId })
      MERGE (l:League { id: $id })
      ON CREATE SET l.name = $name
      ON MATCH SET l.name = $name

      // Hierarchische Verknüpfung aufbauen
      MERGE (s)-[:HAS_GAME_CLASS]->(gc)
      MERGE (s)-[:HAS_LEAGUE_SET]->(ls)
      MERGE (ls)-[:CONTAINS_LEAGUE]->(l)
      MERGE (gc)-[:INCLUDES_LEAGUE]->(l)
    `;
    try {
      await session.executeWrite((tx) =>
        tx.run(query, {
          seasonId: league.seasonId,
          gameClassId: league.gameClassId,
          leagueSetId: league.leagueSetId,
          name: league.name,
          id: league.id
        })
      );
      console.log(
        ` Liga-Knoten "${league.name}" (ID: ${league.id}) verknüpft.`
      );
    } catch (error) {
      console.error(`Fehler beim Speichern der Liga ${league.id}:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }

  // Speichert einen Club in der Neo4j-Datenbank und verknüpft sie mit der Saison
  async saveClub(club: Club): Promise<void> {
    const session = getNeo4jSession();
    const query = `
      // 1. Der Club-Knoten bleibt zeitlos (KEINE seasonId im SET)
      MERGE (c:Club { id: $id })
      ON CREATE SET c.name = $name
      ON MATCH SET c.name = $name

      // 2. Die Saison existiert oder wird erstellt
      MERGE (s:Season { id: $seasonId })

      // 3. NUR die Beziehung speichert den Kontext der Saison
      MERGE (c)-[r:PARTICIPATES_IN { season: $seasonId }]->(s)
    `;

    try {
      await session.executeWrite((tx) =>
        tx.run(query, {
          id: club.id,
          name: club.name,
          seasonId: club.seasonId
        })
      );
      console.log(
        `Club "${club.name}" (ID: ${club.id}) für Saison ${club.seasonId} erfolgreich verknüpft.`
      );
    } catch (error) {
      console.error(`Fehler beim Speichern des Clubs ${club.id}:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }

  //Speichert ein Team in der Neo4j-Datenbank und verknüpft es mit dem Club, der Liga und der Saison
  async saveTeam(team: Team): Promise<void> {
    const session = getNeo4jSession();
    const query = `
      // 1. Team-Knoten anlegen oder aktualisieren (zeitlos)
      MERGE (t:Team { id: $id })
      ON CREATE SET t.name = $name
      ON MATCH SET t.name = $name

      // 2. Übergeordneten Club verknüpfen (zeitlos)
      MERGE (c:Club { id: $clubId })
      MERGE (t)-[:BELONGS_TO]->(c)

      // 3. Ziel-Gruppe sicherstellen
      MERGE (g:Group { id: $groupId })

      // 4. Saison-spezifische Teilnahme an der Gruppe festlegen
      MERGE (t)-[r:PLAYED_IN { season: $seasonId }]->(g)
    `;

    try {
      await session.executeWrite((tx) =>
        tx.run(query, {
          id: team.id,
          name: team.name,
          clubId: team.clubId,
          groupId: team.groupId,
          seasonId: team.seasonId
        })
      );
      console.log(
        `Team "${team.name}" (ID: ${team.id}) in Gruppe "${team.groupId}" für Saison ${team.seasonId} erfolgreich gespeichert.  `
      );
    } catch (error) {
      console.error(`Fehler beim Speichern des Teams ${team.id}:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }

  // Speichert eine Gruppe in der Neo4j-Datenbank und verknüpft sie mit der Liga, Spielklasse und Saison
  async saveGroup(group: Group): Promise<void> {
    const session = getNeo4jSession();
    const query = `
      // 1. Sicherstellen, dass die übergeordnete Liga existiert
      MERGE (l:League { id: $leagueId })

      // 2. Gruppe anlegen oder aktualisieren
      MERGE (g:Group { id: $id })
      ON CREATE SET g.name = $name
      ON MATCH SET g.name = $name

      // 3. Hierarchische Verbindung: Liga enthält Gruppe
      MERGE (l)-[:HAS_GROUP]->(g)
    `;
    try {
      await session.executeWrite((tx) =>
        tx.run(query, {
          id: group.id,
          name: group.name,
          leagueId: group.leagueId
        })
      );
      console.log(` Gruppe "${group.name}" (ID: ${group.id}) verknüpft.`);
    } catch (error) {
      console.error(`Fehler beim Speichern der Gruppe ${group.id}:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }
}
