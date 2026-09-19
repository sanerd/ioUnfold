import { getNeo4jSession } from '../config/neo4j';
import { SwissunihockeyApiGame } from '@iounfold/database-schemas';

export class GameRepository {
  // Falls die Methode ein einzelnes Spiel oder ein Array entgegennimmt:
  async saveGame(
    game: SwissunihockeyApiGame | SwissunihockeyApiGame[]
  ): Promise<void> {
    const session = getNeo4jSession();
    const query = `UNWIND $games AS gameData

// 1. Spiel erstellen oder aktualisieren
MERGE (g:Game {id: gameData.id})
SET g.datetime = datetime(gameData.datetime),
    g.scoreHome = gameData.scoreHome,
    g.scoreAway = gameData.scoreAway,
    g.referees = gameData.referees

// 2. Saison verknüpfen
MERGE (s:Season {id: gameData.seasonId})
MERGE (g)-[:IN_SEASON]->(s)

// 3. Gruppe verknüpfen
MERGE (grp:Group {id: gameData.groupId})
MERGE (g)-[:IN_GROUP]->(grp)

// 4. Heimteam verknüpfen & optionales Logo setzen
MERGE (home:Team {id: gameData.homeTeam})
ON CREATE SET home.logo = gameData.homeTeamLogo
ON MATCH SET home.logo = COALESCE(gameData.homeTeamLogo, home.logo)
MERGE (g)-[:HOME_TEAM]->(home)

// 5. Auswärtsteam verknüpfen & optionales Logo setzen
MERGE (away:Team {id: gameData.awayTeam})
ON CREATE SET away.logo = gameData.awayTeamLogo
ON MATCH SET away.logo = COALESCE(gameData.awayTeamLogo, away.logo)
MERGE (g)-[:AWAY_TEAM]->(away)

// 6. Austragungsort (Venue) verknüpfen (Spatial Point für Koordinaten)
WITH g, gameData
WHERE gameData.venueName IS NOT NULL AND gameData.venueName <> ''
MERGE (v:Venue {name: gameData.venueName})
ON CREATE SET v.location = point({
  latitude: gameData.venueLatitude, 
  longitude: gameData.venueLongitude
})
MERGE (g)-[:PLAYED_AT]->(v)`;

    try {
      // Stellen sicher, dass wir immer ein Array an $games übergeben:
      const gamesArray = Array.isArray(game) ? game : [game];

      // HIER DIE ÄNDERUNG: { games: gamesArray } statt game
      await session.executeWrite((tx) => tx.run(query, { games: gamesArray }));

      const logId = Array.isArray(game) ? `${game.length} Spiele` : game.id;
      console.log(` Spiel-Knoten "${logId}" verknüpft.`);
    } catch (error) {
      const logId = Array.isArray(game) ? 'Array' : game.id;
      console.error(`Fehler beim Speichern des Spiels ${logId}:`, error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /* async saveLiveGame(game: Game): Promise<void> {
    const session = getNeo4jSession();
    const baseGameQuery = `
MATCH (l:League { id: $leagueId })
MERGE (h:Team { id: $homeTeam.id }) ON CREATE SET h.name = $homeTeam.name
MERGE (a:Team { id: $awayTeam.id }) ON CREATE SET a.name = $awayTeam.name
MERGE (g:Game { id: $gameId })
SET g.scoreHome = $scoreHome, g.scoreAway = $scoreAway, g.status = $status, g.date =
$date
MERGE (g)-[:HOME_TEAM]->(h)
MERGE (g)-[:AWAY_TEAM]->(a)
MERGE (g)-[:IN_LEAGUE]->(l)
`;
    try {
      await session.executeWrite((tx) =>
        tx.run(baseGameQuery, {
          leagueId: game.leagueId,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          gameId: game.id,
          scoreHome: game.scoreHome,
          scoreAway: game.scoreAway,
          status: game.status,
          date: game.date
        })
      );
      const goals = game.events.filter((e) => e.type === 'goal');
      for (const goal of goals) {
        const cleanTime = goal.time.replace(':', '');
        const goalNodeId = `${game.id}_${goal.period}_${cleanTime}`;
        let goalQuery = `
MATCH (g:Game { id: $gameId })
MERGE (scorer:Player { id: $scorerId }) ON CREATE SET scorer.name = $scorerName
MERGE (goal:Goal { id: $goalNodeId })
SET goal.time = $time, goal.period = $period
MERGE (goal)-[:IN_GAME]->(g)
MERGE (scorer)-[:SCORED]->(goal)
`;
        const params: any = {
          gameId: game.id,
          goalNodeId,
          scorerId: goal.scorerId,
          scorerName: goal.scorerName,
          time: goal.time,
          period: goal.period
        };
        if (goal.assistantId && goal.assistantName) {
          goalQuery += `
MERGE (assistant:Player { id: $assistantId }) ON CREATE SET assistant.name =
$assistantName
MERGE (assistant)-[:ASSISTED]->(goal)
`;
          params.assistantId = goal.assistantId;
          params.assistantName = goal.assistantName;
        }
        await session.executeWrite((tx) => tx.run(goalQuery, params));
      }
      console.log(` Spiel ${game.id} inklusive ${goals.length} Tore erfolgreich in Neo4j
verarbeitet.`);
    } finally {
      await session.close();
    }
  }*/
}
