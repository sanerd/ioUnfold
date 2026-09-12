import { UnihockeyApiService } from './services/floorball';
import { GameRepository } from './repositories/game.repository';
import { CompetitionRepository } from './repositories/competition.repository';
import { removeDuplicatesById } from '@iounfold/utils';
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
      //await gameRepository.saveLiveGame(game);
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

/* async function initialSync() {
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
    }

    // 3. Alle Clubs dieser Saison holen und anlegen
    const clubs = await apiService.getClubs(targetSeasonId);
    console.log(`✅ ${clubs.length} Clubs für die Saison gefunden.`);

    const duplicateGames: any[] = [];
    const duplicateGroups: any[] = [];

    for (const club of clubs) {
      await compRepository.saveClub(club);

      // 3. Alle Teams dieses Clubs in dieser Saison holen und anlegen
      try {
        const teams = await apiService.getTeams(targetSeasonId, club.id);
        console.log(
          `✅ ${teams.length} Teams für den Club ${club.name} in der Saison gefunden.`
        );

        for (const team of teams) {
          // 4. Alle Gruppen dieser Liga in dieser Saison holen und anlegen
          try {
            const groups = await apiService.getGroups(targetSeasonId, team.id);

            team.groupId = groups.length > 0 ? groups[0].id : ''; // Setze die groupId des Teams, falls Gruppen vorhanden sind

            duplicateGames.push(...groups.flatMap((group) => group.games));
            duplicateGroups.push(...groups);
          } catch (groupsError) {
            // Wenn die Groups-API zickt, loggen wir es, brechen aber die Ligen-Schleife NICHT ab
            console.error(
              `   └─ ❌ Fehler beim Gruppen-Import für Team ${team.name}:`,
              groupsError
            );
          }
          await compRepository.saveTeam(team);
        }
      } catch (teamsError) {
        // Wenn die Teams-API zickt, loggen wir es, brechen aber die Clubs-Schleife NICHT ab
        console.error(
          `   └─ ❌ Fehler beim Team-Import für Club ${club.name}:`,
          teamsError
        );
      }
    }

    const uniqueGroups = removeDuplicatesById(duplicateGroups);
    console.log(
      `✅ ${uniqueGroups.length} Gruppen für die Saison ${targetSeasonId} gefunden.`
    );

    for (const group of uniqueGroups) {
      await compRepository.saveGroup(group);
    }

    console.log(duplicateGames);
    const uniqueGames = removeDuplicatesById(duplicateGames);
    console.log(uniqueGames);
    console.log(
      `✅ ${uniqueGames.length} Spiele in ${uniqueGroups.length} Gruppen für die Saison ${targetSeasonId} gefunden.`
    );

    console.log(
      '\n🎯 [Startup] Historischer Daten-Import für 2025/26 erfolgreich abgeschlossen!'
    );
  } catch (error) {
    console.error('❌ Kritischer Fehler beim historischen Import:', error);
  }
} */

async function initialSync() {
  console.log(
    '\n🏗️ [Startup] Starte historischen Deep-Import für Saison 2025/2026...'
  );

  const targetSeasonId = '2025'; // Entspricht Saison 2025/26 bei Swiss Unihockey

  try {
    // ==========================================
    // 1. EXTRACTION & TRANSFORMATION
    // ==========================================

    // 1.1 Season extrahieren
    const seasons = await apiService.getSeasons();
    const currentSeason = seasons.find((s) => s.id === targetSeasonId);

    if (!currentSeason) {
      console.error(
        `❌ Saison ${targetSeasonId} wurde auf der API nicht gefunden.`
      );
      return;
    }

    // 1.2 Leagues extrahieren
    const leagues = await apiService.getLeagues(targetSeasonId);
    console.log(`✅ ${leagues.length} Ligen für die Saison gefunden.`);

    // 1.3 Clubs, Teams, Groups & Games extrahieren
    const clubs = await apiService.getClubs(targetSeasonId);
    console.log(`✅ ${clubs.length} Clubs für die Saison gefunden.`);

    const extractedTeams: any[] = [];
    const rawGroups: any[] = [];
    const rawGames: any[] = [];
    const extractedGameDetails: any[] = [];

    for (const club of clubs) {
      try {
        const teams = await apiService.getTeams(targetSeasonId, club.id);
        console.log(
          `✅ ${teams.length} Teams für den Club ${club.name} in der Saison gefunden.`
        );

        for (const team of teams) {
          try {
            const groups = await apiService.getGroups(targetSeasonId, team.id);

            // Transformation: Group-ID am Team setzen
            team.groupId = groups.length > 0 ? groups[0].id : '';

            rawGroups.push(...groups);
            rawGames.push(...groups.flatMap((group) => group.games));
          } catch (groupsError) {
            console.error(
              `   └─ ❌ Fehler beim Gruppen-Import für Team ${team.name}:`,
              groupsError
            );
          }
          extractedTeams.push(team);
        }
      } catch (teamsError) {
        console.error(
          `   └─ ❌ Fehler beim Team-Import für Club ${club.name}:`,
          teamsError
        );
      }
    }

    // Transformation: Duplikate entfernen
    const uniqueGroups = removeDuplicatesById(rawGroups);
    console.log(
      `✅ ${uniqueGroups.length} Gruppen für die Saison ${targetSeasonId} gefunden.`
    );

    const uniqueGames = removeDuplicatesById(rawGames);
    console.log(
      `✅ ${uniqueGames.length} Spiele in ${uniqueGroups.length} Gruppen für die Saison ${targetSeasonId} gefunden.`
    );
    for (const game of uniqueGames) {
      try {
        const gameDetails = await apiService.getGame(
          game.id,
          game.groupId,
          targetSeasonId
        );
        extractedGameDetails.push(gameDetails);
      } catch (gameError) {
        console.error(
          `   └─ ❌ Fehler beim Abrufen der Spiel-Details für Spiel-ID ${game.id}:`,
          gameError
        );
      }
    }

    // ==========================================
    // 2. LOAD (In Datenbank schreiben)
    // ==========================================
    console.log('\n💾 Starte Speichervorgang in die Datenbank...');

    // 2.1 Season speichern
    await compRepository.saveSeason(currentSeason);

    // 2.2 Leagues speichern
    for (const league of leagues) {
      await compRepository.saveLeague(league);
    }

    // 2.3 Clubs speichern
    for (const club of clubs) {
      await compRepository.saveClub(club);
    }

    // 2.4 Teams speichern
    for (const team of extractedTeams) {
      await compRepository.saveTeam(team);
    }

    // 2.5 Groups speichern
    for (const group of uniqueGroups) {
      await compRepository.saveGroup(group);
    }

    // 2.6 Games speichern
    for (const game of extractedGameDetails) {
      await gameRepository.saveGame(game);
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
