import { getNeo4jSession } from '../config/neo4j';
import { ApiGameSummary } from '@iounfold/database-schemas';

export class GameRepository {
  async saveLiveGame(game: ApiGameSummary): Promise<void> {
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
  }
}
