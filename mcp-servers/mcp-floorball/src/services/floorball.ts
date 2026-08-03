import {
  ApiSeason,
  ApiClub,
  ApiTeam,
  ApiLeague,
  ApiGroup,
  ApiGame
} from '@iounfold/database-schemas';

export class UnihockeyApiService {
  private baseUrl = process.env.BASE_URL || 'https://api-v2.swissunihockey.ch';

  // Holt die verfügbaren Saisons vom Verband
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

    return data.entries.map((entry: any) => ({
      id: entry.set_in_context.season.toString(), // z.B. "2025"
      name: entry.text // z.B. "Saison 2025/26"
    }));
  }

  // Holt die verfügbaren Ligen einer spezifischen Saison
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

    if (!data.entries) return [];

    return data.entries.map((entry: any) => ({
      id:
        entry.set_in_context.league.toString() +
        '_' +
        entry.set_in_context.game_class.toString(),
      leagueSetId: entry.set_in_context.league.toString(),
      gameClassId: entry.set_in_context.game_class.toString(),
      name: entry.text,
      seasonId
    }));
  }

  // Holt die Clubs einer spezifischen Saison
  async getClubs(seasonId: string): Promise<ApiClub[]> {
    console.log(`📡 [API-Service] Rufe Clubs für Saison-ID ${seasonId} ab...`);

    // Die API erwartet die Saison-ID als Query-Parameter
    const response = await fetch(
      `${this.baseUrl}/api/clubs?season=${seasonId}`
    );

    if (!response.ok) {
      throw new Error(
        `Swiss Unihockey API Fehler (Clubs): ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.entries) return [];

    return data.entries.map((entry: any) => ({
      id: entry.set_in_context.club_id.toString(),
      name: entry.text,
      seasonId
    }));
  }

  // Holt die Teams eines spezifischen Clubs in einer spezifischen Saison
  async getTeams(seasonId: string, clubId: string): Promise<ApiTeam[]> {
    console.log(
      `📡 [API-Service] Rufe Teams für Club-ID ${clubId} in Saison-ID ${seasonId} ab...`
    );

    // Die API erwartet die Saison-ID und Club-ID als Query-Parameter
    const response = await fetch(
      `${this.baseUrl}/api/teams?mode=by_club&season=${seasonId}&club_id=${clubId}`
    );

    if (!response.ok) {
      throw new Error(
        `Swiss Unihockey API Fehler (Teams): ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.entries) return [];

    return data.entries.map((entry: any) => ({
      id: entry.set_in_context.team_id.toString(),
      name: entry.text,
      clubId,
      groupId: '', // Wird später über die Gruppen-API gesetzt
      seasonId
    }));
  }

  // Holt die Gruppen der Teams eines spezifischen Clubs einer spezifischen Saison
  async getGroups(seasonId: string, teamId: string): Promise<ApiGroup[]> {
    console.log(
      `📡 [API-Service] Rufe Gruppe für die Team-ID ${teamId} in Saison-ID ${seasonId} ab...`
    );

    // Die API erwartet die Saison-ID und Club-ID als Query-Parameter
    const response = await fetch(
      `${this.baseUrl}/api/games?mode=team&season=${seasonId}&team_id=${teamId}`
    );

    if (!response.ok) {
      throw new Error(
        `Swiss Unihockey API Fehler (Gruppen): ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.data.tabs[0]) return [];

    return [
      {
        id: data.data.tabs[0].link.ids[3].toString(),
        name: data.data.tabs[0].text,
        leagueId:
          data.data.tabs[0].link.ids[1].toString() +
          '_' +
          data.data.tabs[0].link.ids[2].toString()
      }
    ];
  }

  /* // Holt die Gruppen einer spezifischen Liga in einer Saison
  async getGroups(
    seasonId: string,
    leagueId: string,
    gameClassId: string
  ): Promise<ApiGroup[]> {
    console.log(
      `📡 [API-Service] Rufe Gruppen für Liga-ID ${leagueId} und der Spielklasse-ID ${gameClassId} ab...`
    );

    // Die API erwartet die Liga-ID und Spielklasse-ID als Query-Parameter
    const response = await fetch(
      `${this.baseUrl}/api/groups?season=${seasonId}&league=${leagueId}&game_class=${gameClassId}`
    );

    if (!response.ok) {
      throw new Error(
        `Swiss Unihockey API Fehler (Groups): ${response.statusText}`
      );
    }

    const data: any = await response.json();

    if (!data.entries) return [];

    return data.entries.map((entry: any) => ({
      id: entry.set_in_context.group.toString(),
      name: entry.text,
      leagueId,
      gameClassId,
      seasonId
    }));
  } */

  /**
   * Holt alle Spiele einer bestimmten Liga in einer Saison
   */
  /* 
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
  async getLiveGames(): Promise<ApiGame[]> {
    // Da wir historische Daten holen, gibt es im Moment keine "Live"-Spiele.
    // Diese Methode bleibt für den Scheduler aktiv, liefert aber im historischen Kontext nichts zurück.
    return [];
  }
}
