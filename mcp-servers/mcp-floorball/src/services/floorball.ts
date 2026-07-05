// mcp-servers/mcp-floorball/src/services/unihockey.ts
import {
  ApiGameSummary,
  ApiSeason,
  ApiLeague
} from '@iounfold/database-schemas';

export class UnihockeyApiService {
  private baseUrl = 'https://api-v2.swissunihockey.ch'; // Für den späteren HTTP-Ausbau vorbereitet

  /**
   * Holt die verfügbaren Saisons vom Verband
   */
  async getSeasons(): Promise<ApiSeason[]> {
    return [{ id: '2026', name: 'Saison 2026/27' }];
  }

  /**
   * Holt die Ligen einer Saison und trennt sauber nach leagueId und gameClassId
   */
  async getLeagues(seasonId: string): Promise<ApiLeague[]> {
    console.log(`📡 [API-Service] Rufe Ligen für Saison ${seasonId} ab...`);
    return [
      {
        leagueId: 24,
        gameClassId: 11,
        name: 'Herren L-UPL',
        seasonId: seasonId
      },
      {
        leagueId: 25,
        gameClassId: 11,
        name: 'Supercup Herren',
        seasonId: seasonId
      }
    ];
  }

  /**
   * Holt die aktuell laufenden oder kürzlich gespielten Live-Spiele
   */
  async getLiveGames(): Promise<ApiGameSummary[]> {
    const today = new Date().toISOString().split('T')[0];

    return [
      {
        id: '104321',
        leagueId: 24, // Verknüpfung zur eindeutigen League-ID von "Herren L-UPL"
        date: today,
        time: '19:30',
        status: 'live',
        scoreHome: 3,
        scoreAway: 2,
        homeTeam: { id: 'club_wiler', name: 'SV Wiler-Ersigen' },
        awayTeam: { id: 'club_malans', name: 'UHC Alligator Malans' },
        events: [
          {
            type: 'goal',
            time: '12:34',
            period: 1,
            scorerId: 'p_bürki',
            scorerName: 'J. Bürki',
            assistantId: 'p_louhi',
            assistantName: 'A. Louhi'
          }
        ]
      }
    ];
  }
}
