import { SwissunihockeyApiService } from '../services/swissunihockey-api.service.js';
import { CompetitionWriter } from '../writers/competition.writer.js';
import { GameWriter } from '../writers/game.writer.js';
import { removeDuplicatesById } from '@iounfold/utils';

export interface PipelineProgressCallback {
  (progress: number, details: string, cursor?: string): void | Promise<void>;
}

export class SeasonSyncPipeline {
  private isCancelled = false;
  private isPaused = false;

  constructor(
    private apiService: SwissunihockeyApiService,
    private compWriter: CompetitionWriter,
    private gameWriter: GameWriter,
    private jobRepository?: any // Verwaltet den Job-Zustand und Payload in PostgreSQL
  ) {}

  public cancel(): void {
    this.isCancelled = true;
    console.log('🛑 [Pipeline] Abbruchsignal empfangen.');
  }

  public pause(): void {
    this.isPaused = true;
    console.log('⏸️ [Pipeline] Pausierungssignal empfangen.');
  }

  public async run(
    targetSeasonId = '2025',
    onProgress?: PipelineProgressCallback,
    startCursor?: string,
    jobId?: string
  ): Promise<void> {
    this.isCancelled = false;
    this.isPaused = false;

    const updateProgress = async (p: number, msg: string, cursor?: string) => {
      console.log(
        `[Progress ${p}%] ${msg} ${cursor ? `(Cursor: ${cursor})` : ''}`
      );
      if (onProgress) await onProgress(p, msg, cursor);
    };

    const isResumingGamePhase = startCursor?.startsWith('GAME_');

    await updateProgress(
      isResumingGamePhase ? 50 : 5,
      isResumingGamePhase
        ? `Setze Spiel-Import fort (Cursor: ${startCursor})...`
        : `Starte Daten-Import für Saison ${targetSeasonId}...`,
      startCursor
    );

    try {
      if (this.isCancelled) throw new Error('JOB_CANCELLED');

      const seasons = await this.apiService.getSeasons();
      const currentSeason = seasons.find((s: any) => s.id === targetSeasonId);

      if (!currentSeason) {
        throw new Error(
          `Saison ${targetSeasonId} wurde auf der API nicht gefunden.`
        );
      }

      let leagues: any[] = [];
      let clubs: any[] = [];
      let extractedTeams: any[] = [];
      let uniqueGroups: any[] = [];
      let uniqueGames: any[] = [];

      // --- 1. VERSUCH: VERSUCHE BESTEHENDEN PAYLOAD AUS POSTGRES ZU LADEN ---
      let jobPayload: any = null;
      if (jobId && this.jobRepository) {
        jobPayload = await this.jobRepository.getJobPayload(jobId);
      }

      // Wenn im Payload bereits fertige Spiele liegen (z.B. nach Abschluss von Phase 1),
      // können wir Phase 1 komplett überspringen, egal welcher Cursor gesetzt war!
      if (
        jobPayload &&
        jobPayload.uniqueGames &&
        jobPayload.uniqueGames.length > 0
      ) {
        console.log(
          `⚡ [Pipeline] Lade ${jobPayload.uniqueGames.length} Spiele direkt aus Postgres-Payload...`
        );
        await updateProgress(
          isResumingGamePhase ? 52 : 50,
          `Struktur aus Datenbank geladen. Spiele bereit.`,
          startCursor
        );

        leagues = jobPayload.leagues || [];
        clubs = jobPayload.clubs || [];
        extractedTeams = jobPayload.extractedTeams || [];
        uniqueGroups = jobPayload.uniqueGroups || [];
        uniqueGames = jobPayload.uniqueGames || [];
      }

      // --- PHASE 2: FALLS KEINE SPIELE IM PAYLOAD, STRUKTUR ÜBER CLUBS AUFBAUEN ---
      if (uniqueGames.length === 0) {
        leagues = await this.apiService.getLeagues(targetSeasonId);
        clubs = await this.apiService.getClubs(targetSeasonId);

        const rawGroups: any[] = [];
        const rawGames: any[] = [];
        extractedTeams.length = 0;

        let startIndex = 0;
        if (
          startCursor &&
          !isResumingGamePhase &&
          startCursor.startsWith('CLUB_')
        ) {
          const cleanClubId = startCursor.replace('CLUB_', '');
          const foundIndex = clubs.findIndex((c) => c.id === cleanClubId);
          if (foundIndex !== -1) {
            startIndex = foundIndex;
            console.log(
              `🔄 [Pipeline] Setze Club-Fortsetzung bei Index ${startIndex} (ID: ${cleanClubId}) fort.`
            );
          }
        }

        let processedClubs = startIndex;
        for (let i = startIndex; i < clubs.length; i++) {
          if (this.isCancelled) throw new Error('JOB_CANCELLED');
          if (this.isPaused) throw new Error('JOB_PAUSED');

          const club = clubs[i];

          try {
            const teams = await this.apiService.getTeams(
              targetSeasonId,
              club.id
            );
            for (const team of teams) {
              if (this.isCancelled) throw new Error('JOB_CANCELLED');
              if (this.isPaused) throw new Error('JOB_PAUSED');

              const groups = await this.apiService.getGroups(
                targetSeasonId,
                team.id
              );
              team.groupId = groups.length > 0 ? groups[0].id : '';
              rawGroups.push(...groups);
              rawGames.push(...groups.flatMap((group: any) => group.games));
              extractedTeams.push(team);
            }
          } catch (teamsError) {
            console.error(`   └─ ❌ Fehler bei Club ${club.name}:`, teamsError);
          }

          processedClubs++;
          const clubProgress =
            5 + Math.floor((processedClubs / clubs.length) * 45);

          const currentCursor = `CLUB_${club.id}`;
          await updateProgress(
            clubProgress,
            `Verarbeite Club ${processedClubs}/${clubs.length}: ${club.name}`,
            currentCursor
          );

          // Regelmäßiges Sichern des Zwischenstands in Postgres (alle 5 Clubs)
          if (jobId && this.jobRepository && processedClubs % 5 === 0) {
            await this.jobRepository.saveJobPayload(jobId, {
              leagues,
              clubs,
              extractedTeams,
              uniqueGroups: removeDuplicatesById(rawGroups),
              uniqueGames: removeDuplicatesById(rawGames)
            });
          }
        }

        uniqueGroups = removeDuplicatesById(rawGroups);
        uniqueGames = removeDuplicatesById(rawGames);

        // --- AM ENDE VON PHASE 1 (NUR HIER SPEICHERN, WENN DATEN DA SIND!) ---
        if (jobId && this.jobRepository && uniqueGames.length > 0) {
          await this.jobRepository.saveJobPayload(jobId, {
            leagues,
            clubs,
            extractedTeams,
            uniqueGroups,
            uniqueGames
          });
          console.log(
            `💾 [Pipeline] Payload erfolgreich in Postgres gespeichert (${uniqueGames.length} Spiele).`
          );
        }
      }

      await updateProgress(
        55,
        `${uniqueGames.length} Spiele in ${uniqueGroups.length} Gruppen ermittelt.`
      );

      // --- PHASE 3: SPIEL-DETAILS ABRUFEN MIT SOFORTIGER STOPP-PRÜFUNG ---
      const extractedGameDetails: any[] = [];
      let gameStartIndex = 0;

      // Prüfen ob wir im Spiel-Cursor weitermachen
      const effectiveCursor = startCursor || (jobPayload && jobPayload.cursor);
      if (effectiveCursor && effectiveCursor.startsWith('GAME_')) {
        const targetGameId = effectiveCursor.replace('GAME_', '');
        const foundGameIndex = uniqueGames.findIndex(
          (g) => g.id === targetGameId
        );
        if (foundGameIndex !== -1) {
          gameStartIndex = foundGameIndex;
          console.log(
            `🔄 [Pipeline] Exakter Startpunkt bei Spiel-Index ${gameStartIndex} (ID: ${targetGameId}) gefunden.`
          );
        }
      }

      let processedGames = gameStartIndex;
      for (let i = gameStartIndex; i < uniqueGames.length; i++) {
        if (this.isCancelled) throw new Error('JOB_CANCELLED');
        if (this.isPaused) throw new Error('JOB_PAUSED');

        const game = uniqueGames[i];

        try {
          const gameDetails = await this.apiService.getGame(
            game.id,
            game.groupId,
            targetSeasonId
          );
          extractedGameDetails.push(gameDetails);
        } catch (gameError: any) {
          console.error(`   └─ ❌ Fehler bei Spiel-ID ${game.id}:`, gameError);
        }

        processedGames++;

        const gameProgress =
          55 + Math.floor((processedGames / uniqueGames.length) * 25);
        await updateProgress(
          gameProgress,
          `Lade Spieldetails ${processedGames}/${uniqueGames.length}`,
          `GAME_${game.id}`
        );
      }

      // --- PHASE 4: GESAMTER NEO4J-BULK-UPLOAD AM SCHLUSS ---
      if (this.isCancelled) throw new Error('JOB_CANCELLED');
      if (this.isPaused) throw new Error('JOB_PAUSED');

      await updateProgress(80, 'Speichere alle Daten gesammelt in Neo4j...');

      await this.compWriter.saveSeason(currentSeason);
      for (const league of leagues) {
        await this.compWriter.saveLeague(league);
      }
      for (const club of clubs) {
        await this.compWriter.saveClub(club);
      }
      for (const team of extractedTeams) {
        await this.compWriter.saveTeam(team);
      }
      for (const group of uniqueGroups) {
        await this.compWriter.saveGroup(group);
      }

      await updateProgress(
        90,
        `Schreibe ${extractedGameDetails.length} Spiel-Batches in Neo4j...`
      );
      for (const gameArray of extractedGameDetails) {
        await this.gameWriter.saveGame(gameArray as any);
      }

      await updateProgress(
        100,
        `Initialer Daten-Import für ${currentSeason.name} erfolgreich abgeschlossen!`
      );
    } catch (error: any) {
      if (this.isCancelled || error.message === 'JOB_CANCELLED') {
        await updateProgress(0, 'Job wurde manuell abgebrochen.');
        throw new Error('JOB_CANCELLED');
      }
      if (this.isPaused || error.message === 'JOB_PAUSED') {
        console.log(
          '⏸️ [Pipeline] Job erfolgreich pausiert und Zustand gesichert.'
        );
        throw new Error('JOB_PAUSED');
      }
      console.error(`❌ Kritischer Fehler beim Import:`, error);
      throw error;
    }
  }

  public async resume(
    targetSeasonId = '2025',
    cursor?: string,
    onProgress?: PipelineProgressCallback,
    jobId?: string
  ): Promise<void> {
    return this.run(targetSeasonId, onProgress, cursor, jobId);
  }
}
