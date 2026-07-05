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
  console.log('[Startup] Führe Initial-Sync der Strukturdaten aus...');
  const seasons = await apiService.getSeasons();
  for (const season of seasons) {
    await compRepository.saveSeason(season);
    const leagues = await apiService.getLeagues(season.id);
    for (const league of leagues) {
      await compRepository.saveLeague(league);
    }
  }
  console.log(' [Startup] Strukturdaten erfolgreich geladen.');
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
