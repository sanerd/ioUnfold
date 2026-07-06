import { UnihockeyApiService } from './services/floorball';
import { GameRepository } from './repositories/game.repository';
import { CompetitionRepository } from './repositories/competition.repository';
import { driver } from './config/neo4j';

const apiService = new UnihockeyApiService();
const gameRepository = new GameRepository();
const compRepository = new CompetitionRepository();

let schedulerTimeout: NodeJS.Timeout | null = null;

function getDynamicIntervalInMs(): number {
  const now = new Date();
  const day = now.getDay(); // 0=So, 6=Sa, 1-5=Mo-Fr
  const hour = now.getHours();
  const MINUTE = 60 * 1000;
  // Primetime Wochenende (Sa/So von 10:00 bis 22:59) -> High Frequency Polling
  if ((day === 0 || day === 6) && hour >= 10 && hour <= 22) {
    console.log(' [Modus] Wochenende-Live-Betrieb (1 Minute Intervall active)');
    return 1 * MINUTE;
  }
  // Abendspiele unter der Woche (Mo-Fr von 18:00 bis 22:59)
  if (day >= 1 && day <= 5 && hour >= 18 && hour <= 22) {
    console.log(' [Modus] Werktag-Abendspiele (5 Minuten Intervall active)');
    return 5 * MINUTE;
  }
  // Standard-Standby / Schonender Nachtbetrieb
  console.log(' [Modus] Standby-Betrieb (60 Minuten Intervall active)');
  return 60 * MINUTE;
}
async function runIngestionPipeline() {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`
[${timestamp}] Ingestion-Pipeline gestartet...`);
  try {
    const activeGames = await apiService.getLiveGames();
    for (const game of activeGames) {
      await gameRepository.saveLiveGame(game);
    }
    console.log(` [${timestamp}] Pipeline-Durchlauf erfolgreich.`);
  } catch (error) {
    console.error(` [${timestamp}] Kritischer Fehler in Pipeline:`, error);
  } finally {
    const nextInterval = getDynamicIntervalInMs();
    console.log(
      ` Nächster Durchlauf geplant in: ${nextInterval / 1000 / 60} Minuten.`
    );
    schedulerTimeout = setTimeout(runIngestionPipeline, nextInterval);
  }
}

async function initialSync() {
  console.log(
    '\n🏗️ [Startup] Starte historischen Deep-Import für Saison 2025/2026...'
  );

  const targetSeasonId = '2025'; // Entspricht Saison 2025/26 bei Swiss Unihockey

  try {
    // 1. Saisons synchronisieren
    const seasons = await apiService.getSeasons();
    const currentSeason = seasons.find((s) => s.id === targetSeasonId);

    if (!currentSeason) {
      console.error(
        `❌ Saison ${targetSeasonId} wurde auf der API nicht gefunden.`
      );
      return;
    }

    await compRepository.saveSeason(currentSeason);

    // 2. Alle Ligen dieser Saison holen und anlegen
    const leagues = await apiService.getLeagues(targetSeasonId);
    console.log(`✅ ${leagues.length} Ligen für die Saison gefunden.`);

    for (const league of leagues) {
      await compRepository.saveLeague(league);

      // 3. JEDES Spiel dieser Liga aus der Saison 2025/26 in den Graphen importieren
      try {
        const games = await apiService.getGamesByLeague(
          targetSeasonId,
          league.leagueId
        );
        console.log(
          `📡 [API-Service] Rufe ${games.length} Spiele ab für ${league.name}...`
        );

        for (const game of games) {
          await gameRepository.saveLiveGame(game);
        }
      } catch (gamesError) {
        // Wenn die Games-API zickt, loggen wir es, brechen aber die Ligen-Schleife NICHT ab
        console.error(
          `   └─ ❌ Fehler beim Spiele-Import für Liga ${league.name}:`
        );
      }
    }

    console.log(
      '\n🎯 [Startup] Historischer Daten-Import für 2025/26 erfolgreich abgeschlossen!'
    );
  } catch (error) {
    console.error('❌ Kritischer Fehler beim historischen Import:', error);
  }
}

// Graceful Shutdown
async function gracefulShutdown(signal: string) {
  console.log(`
${signal} empfangen. Schließe Treiber...`);
  if (schedulerTimeout) clearTimeout(schedulerTimeout);
  try {
    await driver.close();
    console.log(' Neo4j-Treiber erfolgreich getrennt.');
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
console.log(' ioUnfold Floorball Series - MCP Server Initialisierung.');
initialSync().then(() => {
  runIngestionPipeline();
});
