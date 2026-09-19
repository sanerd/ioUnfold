import {
  SwissunihockeyApiSeason,
  SwissunihockeyApiClub,
  SwissunihockeyApiTeam,
  SwissunihockeyApiLeague,
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

    if (!Array.isArray(data?.entries)) return [];

    return data.entries
      .filter((entry: any) => entry?.set_in_context?.season != null)
      .map((entry: any) => ({
        id: String(entry.set_in_context.season),
        name: entry.text ?? ''
      }));
  }

  // Holt die verfügbaren Ligen einer spezifischen Saison
  async getLeagues(seasonId: string): Promise<SwissunihockeyApiLeague[]> {
    console.log(`📡 [API-Service] Rufe Ligen für Saison-ID ${seasonId} ab...`);

    const response = await fetch(
      `${this.baseUrl}/api/leagues?season=${seasonId}`
    );

    if (!response.ok) {
      throw new Error(
        `Swiss Unihockey API Fehler (Leagues): ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!Array.isArray(data?.entries)) return [];

    return data.entries
      .filter(
        (entry: any) =>
          entry?.set_in_context?.league != null &&
          entry?.set_in_context?.game_class != null
      )
      .map((entry: any) => ({
        id: `${entry.set_in_context.league}_${entry.set_in_context.game_class}`,
        leagueSetId: String(entry.set_in_context.league),
        gameClassId: String(entry.set_in_context.game_class),
        name: entry.text ?? '',
        seasonId
      }));
  }

  // Holt die Clubs einer spezifischen Saison
  async getClubs(seasonId: string): Promise<SwissunihockeyApiClub[]> {
    console.log(`📡 [API-Service] Rufe Clubs für Saison-ID ${seasonId} ab...`);

    const response = await fetch(
      `${this.baseUrl}/api/clubs?season=${seasonId}`
    );

    if (!response.ok) {
      throw new Error(
        `Swiss Unihockey API Fehler (Clubs): ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!Array.isArray(data?.entries)) return [];

    return data.entries
      .filter((entry: any) => entry?.set_in_context?.club_id != null)
      .map((entry: any) => ({
        id: String(entry.set_in_context.club_id),
        name: entry.text ?? '',
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

    const response = await fetch(
      `${this.baseUrl}/api/teams?mode=by_club&season=${seasonId}&club_id=${clubId}`
    );

    if (!response.ok) {
      throw new Error(
        `Swiss Unihockey API Fehler (Teams): ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!Array.isArray(data?.entries)) return [];

    return data.entries
      .filter((entry: any) => entry?.set_in_context?.team_id != null)
      .map((entry: any) => ({
        id: String(entry.set_in_context.team_id),
        name: entry.text ?? '',
        clubId,
        groupId: '',
        seasonId
      }));
  }

  // Holt die Gruppen der Teams eines spezifischen Clubs einer spezifischen Saison
  async getGroups(
    seasonId: string,
    teamId: string
  ): Promise<SwissunihockeyApiGroup[]> {
    console.log(
      `📡 [API-Service] Rufe Gruppen und Spiele für die Team-ID ${teamId} in Saison-ID ${seasonId} ab...`
    );

    const response = await fetch(
      `${this.baseUrl}/api/games?mode=team&season=${seasonId}&team_id=${teamId}&page=1&games_per_page=100`
    );

    if (!response.ok) {
      throw new Error(
        `Swiss Unihockey API Fehler (Gruppen): ${response.statusText}`
      );
    }

    const data = await response.json();

    if (
      !Array.isArray(data?.data?.tabs) ||
      !Array.isArray(data?.data?.regions)
    ) {
      return [];
    }

    const groups: SwissunihockeyApiGroup[] = data.data.tabs
      .filter(
        (tab: any) => Array.isArray(tab?.link?.ids) && tab.link.ids.length >= 4
      )
      .map((tab: any) => ({
        id: String(tab.link.ids[3]),
        name: tab.text ?? '',
        leagueId: `${tab.link.ids[1]}_${tab.link.ids[2]}`,
        games: []
      }));

    const games = data.data.regions.map((region: any, index: number) => {
      if (!Array.isArray(region?.rows)) return [];
      const currentGroupId = groups[index]?.id ?? '';

      return region.rows
        .filter((game: any) => game?.link?.ids?.[0] != null)
        .map((game: any) => ({
          id: String(game.link.ids[0]),
          groupId: currentGroupId
        }));
    });

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

    const response = await fetch(`${this.baseUrl}/api/games/${gameId}`);

    if (!response.ok) {
      throw new Error(
        `Swiss Unihockey API Fehler (Spiele): ${response.statusText}`
      );
    }

    const data = await response.json();

    const rows = data?.data?.regions?.[0]?.rows;
    if (!Array.isArray(rows)) return [];

    return rows.map((entry: any) => {
      const cells = entry?.cells || [];

      // Helper für sicheres Auslesen von Zelltexten
      const getCellText = (idx: number): string => cells[idx]?.text?.[0] ?? '';

      // 1. Datum & Zeit sicher parsen
      const rawDate = getCellText(5);
      const rawTime = getCellText(6);
      let datetime = new Date().toISOString();

      if (rawDate.includes('.')) {
        const parts = rawDate.split('.');
        if (parts.length === 3) {
          const parsed = new Date(
            `${parts[2]}-${parts[1]}-${parts[0]}T${rawTime || '00:00'}:00`
          );
          if (!isNaN(parsed.getTime())) {
            datetime = parsed.toISOString();
          }
        }
      }

      // 2. Team-IDs sicher auslesen
      const homeTeamRaw = cells[0]?.link?.ids?.[0];
      const awayTeamRaw = cells[2]?.link?.ids?.[0];

      // 3. Tore parsen
      const rawScore = getCellText(4);
      let scoreHome: number | null = null;
      let scoreAway: number | null = null;

      if (rawScore.includes(':')) {
        const parts = rawScore.split(':');
        const h = Math.floor(parseInt(parts[0], 10));
        const a = Math.floor(parseInt(parts[1], 10));
        scoreHome = isNaN(h) ? null : h;
        scoreAway = isNaN(a) ? null : a;
      }

      // 4. Schiedsrichter (leere oder undefined Strings herausfiltern)
      const ref1 = getCellText(8);
      const ref2 = getCellText(9);
      const referees = [ref1, ref2].filter((r): r is string =>
        Boolean(r && r.trim())
      );

      return {
        id: gameId,
        seasonId,
        groupId,
        datetime,
        venueName: getCellText(7),
        // Koordinaten müssen 'number' sein -> Fallback 0 oder 0.0
        venueLongitude:
          typeof cells[7]?.link?.x === 'number' ? cells[7].link.x : 0,
        venueLatitude:
          typeof cells[7]?.link?.y === 'number' ? cells[7].link.y : 0,
        // String-Felder dürfen nicht null sein -> Fallback ''
        homeTeam: homeTeamRaw != null ? String(homeTeamRaw) : '',
        homeTeamLogo: cells[0]?.image?.url || undefined,
        awayTeam: awayTeamRaw != null ? String(awayTeamRaw) : '',
        awayTeamLogo: cells[2]?.image?.url || undefined,
        scoreHome,
        scoreAway,
        referees
      };
    });
  }

  /**
   * Fallback für das laufende Polling (Kompatibilität mit index.ts)
   */
  async getLiveGames(): Promise<SwissunihockeyApiGame[]> {
    return [];
  }
}
