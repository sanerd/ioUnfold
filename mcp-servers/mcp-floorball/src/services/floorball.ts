import {
  SwissunihockeyApiSeason,
  Season,
  SwissunihockeyApiClub,
  SwissunihockeyApiTeam,
  SwissunihockeyApiLeague,
  League,
  SwissunihockeyApiGroup,
  SwissunihockeyApiGame
} from '@iounfold/database-schemas';

export class UnihockeyApiService {
  private baseUrl = process.env.BASE_URL || 'https://api-v2.swissunihockey.ch';

  // Holt die verfügbaren Saisons vom Verband
  async getSeasons(): Promise<SwissunihockeyApiSeason[]> {
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
  async getLeagues(seasonId: string): Promise<SwissunihockeyApiLeague[]> {
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
  async getClubs(seasonId: string): Promise<SwissunihockeyApiClub[]> {
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
  async getTeams(
    seasonId: string,
    clubId: string
  ): Promise<SwissunihockeyApiTeam[]> {
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
      groupId: '', // Wird später beim Abrufen der Gruppen gesetzt
      seasonId
    }));
  }

  // Holt die Gruppen der Teams eines spezifischen Clubs einer spezifischen Saison
  async getGroups(
    seasonId: string,
    teamId: string
  ): Promise<SwissunihockeyApiGroup[]> {
    console.log(
      `📡 [API-Service] Rufe Gruppen für die Team-ID ${teamId} in Saison-ID ${seasonId} ab...`
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

    if (!data.data.tabs || !data.data.regions) return [];

    /* const games = data.data.regions[0].rows.map((game: any) => ({
      gameId: game.link.ids[0].toString()
    }));

    return [
      {
        id: data.data.tabs[0].link.ids[3].toString(),
        name: data.data.tabs[0].text,
        leagueId:
          data.data.tabs[0].link.ids[1].toString() +
          '_' +
          data.data.tabs[0].link.ids[2].toString(),
        games: games
      }
    ]; */

    const groups = data.data.tabs.map((tab: any) => ({
      id: tab.link.ids[3].toString(),
      name: tab.text,
      leagueId: tab.link.ids[1].toString() + '_' + tab.link.ids[2].toString()
    }));

    const games = data.data.regions.map((region: any, index: number) =>
      region.rows.map((game: any) => ({
        id: game.link.ids[0].toString(),
        groupId: groups[index].id
      }))
    );

    groups.forEach((group: SwissunihockeyApiGroup, index: number) => {
      group.games = games[index] || [];
    });

    return groups;
  }

  // Holt die Spiele eines Teams eines spezifischen Clubs einer spezifischen Saison
  async getGame(
    gameId: string,
    groupId: string,
    seasonId: string
  ): Promise<SwissunihockeyApiGame[]> {
    console.log(
      `📡 [API-Service] Rufe Spiel mit ID ${gameId} in Gruppe ${groupId} ab...`
    );

    // Die API erwartet die Saison-ID und Club-ID als Query-Parameter
    const response = await fetch(`${this.baseUrl}/api/games/${gameId}`);

    if (!response.ok) {
      throw new Error(
        `Swiss Unihockey API Fehler (Spiele): ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.data.regions[0]) return [];

    return data.data.regions[0].rows.map((entry: any) => ({
      id: gameId,
      seasonId,
      groupId,
      datetime: new Date(
        `${entry.cells[5].text[0].split('.')[2]}-${entry.cells[5].text[0].split('.')[1]}-${entry.cells[5].text[0].split('.')[0]}T${entry.cells[6].text[0]}:00`
      ).toISOString(),
      venueName: entry.cells[7].text[0] || '', // Optional, falls verfügbar
      venueCoordinates: [entry.cells[7].link.x, entry.cells[7].link.y],
      homeTeam: String(entry.cells[0].link.ids[0]) || '', // Optional, falls verfügbar
      homeTeamLogo: entry.cells[0].image.url || '', // Optional, falls verfügbar
      awayTeam: String(entry.cells[2].link.ids[0]) || '', // Optional, falls verfügbar
      awayTeamLogo: entry.cells[2].image.url || '', // Optional, falls verfügbar
      scoreHome:
        entry.cells[4].text[0] && entry.cells[4].text[0].includes(':')
          ? parseInt(entry.cells[4].text[0].split(':')[0], 10)
          : null,
      scoreAway:
        entry.cells[4].text[0] && entry.cells[4].text[0].includes(':')
          ? parseInt(entry.cells[4].text[0].split(':')[1], 10)
          : null,
      referees: [entry.cells[8].text[0] || '', entry.cells[9].text[0] || ''] // Optional, falls verfügbar
    }));
  }

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
  async getLiveGames(): Promise<SwissunihockeyApiGame[]> {
    // Da wir historische Daten holen, gibt es im Moment keine "Live"-Spiele.
    // Diese Methode bleibt für den Scheduler aktiv, liefert aber im historischen Kontext nichts zurück.
    return [];
  }
}
