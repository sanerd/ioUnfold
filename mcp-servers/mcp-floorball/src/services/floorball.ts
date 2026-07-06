// mcp-servers/mcp-floorball/src/services/unihockey.ts
import {
  ApiGameSummary,
  ApiSeason,
  ApiLeague
} from '@iounfold/database-schemas';

export class UnihockeyApiService {
  private baseUrl = process.env.BASE_URL || 'https://api-v2.swissunihockey.ch';

  /**
   * Holt die verfügbaren Saisons vom Verband
   */
  async getSeasons(): Promise<ApiSeason[]> {
    console.log(`📡 [API-Service] Rufe Saisons von Swiss Unihockey ab...`);
    const response = await fetch(`${this.baseUrl}/api/seasons`);

    if (!response.ok) {
      throw new Error(
        `Swiss Unihockey API Fehler (Seasons): ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.entries) return [];

    return data.entries.map((entry: any) => {
      // Extrahiere die ID direkt aus set_in_context.season (z.B. 2025)
      const seasonId = entry.set_in_context?.season?.toString() || 'unknown';

      return {
        id: seasonId, // Wird "2025"
        name: `Saison ${entry.text}` // Wird "Saison 2025/26"
      };
    });
  }

  /**
   * Holt die Ligen einer spezifischen Saison
   */
  async getLeagues(seasonId: string): Promise<ApiLeague[]> {
    console.log(`📡 [API-Service] Rufe Ligen für Saison-ID ${seasonId} ab...`);

    // Die API erwartet die Saison-ID als Query-Parameter
    const response = await fetch(
      `${this.baseUrl}/api/leagues?season=${seasonId}`
    );

    if (!response.ok) {
      throw new Error(
        `Swiss Unihockey API Fehler (Leagues): ${response.statusText}`
      );
    }

    const data = await response.json();
    const leagues: ApiLeague[] = [];

    if (!data.entries) return [];

    for (const entry of data.entries) {
      const leagueId = entry.set_in_context.league;
      const gameClassId = entry.set_in_context.game_class;
      const name = entry.text; // "Herren NLB" etc.

      // Wir flachen die Struktur hier direkt ab, damit das Repository
      // glücklich ist und alle Felder wie 'seasonId' vorhanden sind.
      leagues.push({
        leagueId: leagueId,
        gameClassId: gameClassId,
        name: name,
        seasonId: seasonId // Garantiert, dass league.seasonId existiert!
      });
    }

    return leagues;
  }

  /**
   * Holt alle Spiele einer bestimmten Liga in einer Saison
   */
  async getGamesByLeague(
    seasonId: string,
    leagueId: number
  ): Promise<ApiGameSummary[]> {
    console.log(
      `📡 [API-Service] Rufe Spiele für Liga ${leagueId} (Saison ${seasonId}) ab...`
    );

    // Abfrage aller Spiele im vordefinierten Kontext der Liga
    const response = await fetch(
      `${this.baseUrl}/api/games?mode=by_context&season_id=${seasonId}&league_id=${leagueId}`
    );

    if (!response.ok) {
      throw new Error(
        `Swiss Unihockey API Fehler (Games): ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.entries) return [];

    return data.entries.map((entry: any) => {
      // Bestimme den Spielstatus
      let status: 'scheduled' | 'live' | 'played' = 'scheduled';
      if (entry.cells.status === 'Beendet') status = 'played';
      else if (entry.cells.status === 'Live') status = 'live';

      // Tore parsen (z.B. "5:3" -> [5, 3])
      const scoreRaw = entry.cells.result;
      let scoreHome: number | null = null;
      let scoreAway: number | null = null;

      if (scoreRaw && scoreRaw.includes(':')) {
        const parts = scoreRaw.split(':');
        scoreHome = parseInt(parts[0], 10);
        scoreAway = parseInt(parts[1], 10);
      }

      // Event-Liste initialisieren (wird später über Spieldetails oder Telegramm befüllt)
      // Für den Massen-Import füllen wir vorerst die Meta-Daten des Spiels ab.
      return {
        id: entry.id.toString(),
        leagueId: leagueId,
        date: entry.cells.date,
        time: entry.cells.start_time,
        status: status,
        scoreHome: scoreHome,
        scoreAway: scoreAway,
        homeTeam: {
          id: entry.links.home_team?.split('=')[1] || `team_h_${entry.id}`,
          name: entry.cells.home_team
        },
        awayTeam: {
          id: entry.links.away_team?.split('=')[1] || `team_a_${entry.id}`,
          name: entry.cells.away_team
        },
        events: [] // Kann in einer zweiten Stufe über das Spieltelegramm (/api/games/details) befüllt werden
      };
    });
  }

  /**
   * Fallback für das laufende Polling (Kompatibilität mit index.ts)
   */
  async getLiveGames(): Promise<ApiGameSummary[]> {
    // Da wir historische Daten holen, gibt es im Moment keine "Live"-Spiele.
    // Diese Methode bleibt für den Scheduler aktiv, liefert aber im historischen Kontext nichts zurück.
    return [];
  }
}
