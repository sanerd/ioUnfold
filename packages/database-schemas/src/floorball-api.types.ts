export interface ApiSeason {
  id: string; // z.B. "2026"
  name: string; // z.B. "Saison 2026/27"
}

export interface ApiLeague {
  leagueId: string; // Eindeutige ID (set_in_context.league)
  gameClassId: string; // Identifikator für die Spielklasse (set_in_context.game_class)
  name: string; // z.B. "Herren L-UPL"
  seasonId: string; // Zugehörige Saison-ID (z.B. "2025")
}

export interface ApiClub {
  id: string; // Eindeutige ID des Vereins
  name: string; // Name des Vereins
  seasonId: string; // Zugehörige Saison-ID (z.B. "2025")
}

export interface ApiTeam {
  id: string; // Eindeutige ID des Teams
  name: string; // Name des Teams
  clubId: string; // Zugehörige Vereins-ID
  leagueId: string; // Zugehörige Liga-ID
  gameClassId: string; // Zugehörige Spielklasse-ID
  seasonId: string; // Zugehörige Saison-ID (z.B. "2025")
}

export interface ApiTeamSummary {
  id: string;
  name: string;
}

export interface ApiGameSummary {
  id: string;
  leagueId: string; // Zugehörige Liga-ID
  date: string;
  time: string;
  status: 'scheduled' | 'live' | 'played';
  scoreHome: number | null;
  scoreAway: number | null;
  homeTeam: ApiTeamSummary;
  awayTeam: ApiTeamSummary;
  events: ApiGameEvent[];
}

export interface ApiGameEvent {
  type: 'goal' | 'penalty';
  time: string;
  period: number;
  scorerId?: string;
  scorerName?: string;
  assistantId?: string;
  assistantName?: string;
}
