export interface ApiSeason {
  id: string; // z.B. "2026"
  name: string; // z.B. "Saison 2026/27"
}

export interface ApiLeague {
  id: string; // Eindeutige ID der Liga
  leagueSetId: string; // Identifikator für das Liga-Set
  gameClassId: string; // Identifikator für die Spielklasse
  name: string; // z.B. "Herren L-UPL"
  seasonId: string; // Zugehörige Saison-ID (z.B. "2025")
}

export interface ApiGroup {
  id: string; // Eindeutige ID der Gruppe
  name: string; // Name der Gruppe
  leagueId: string; // Zugehörige Liga-ID
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
  groupId: string; // Zugehörige Gruppen-ID
  seasonId: string; // Zugehörige Saison-ID (z.B. "2025")
}

export interface ApiGame {
  id: string;
  seasonId: string; // Zugehörige Saison-ID (z.B. "2025")
  leagueId: string; // Zugehörige Liga-ID
  gameClassId: string; // Zugehörige Spielklasse-ID
  groupId: string; // Zugehörige Gruppen-ID
  date: string;
  time: string;
  status: 'scheduled' | 'live' | 'played';
  scoreHome: number | null;
  scoreAway: number | null;
  homeTeam: ApiTeam;
  awayTeam: ApiTeam;
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
