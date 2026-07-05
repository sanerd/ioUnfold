export interface ApiSeason {
  id: string; // z.B. "2026"
  name: string; // z.B. "Saison 2026/27"
}

export interface ApiLeague {
  leagueId: number; // Eindeutige ID (set_in_context.league)
  gameClassId: number; // Identifikator für die Spielklasse (set_in_context.game_class)
  name: string; // z.B. "Herren L-UPL"
  seasonId: string;
}

export interface ApiTeamSummary {
  id: string;
  name: string;
}

export interface ApiGameSummary {
  id: string;
  leagueId: number; // Mapping zur League
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
