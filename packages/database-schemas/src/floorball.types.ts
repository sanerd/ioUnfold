export interface SwissunihockeyApiSeason {
  id: string; // z.B. "2026"
  name: string; // z.B. "Saison 2026/27"
}

export interface Season {
  id: string; // z.B. "2026"
  name: string; // z.B. "Saison 2026/27"
}

export interface SwissunihockeyApiLeague {
  id: string; // Eindeutige ID der Liga
  leagueSetId: string; // Identifikator für das Liga-Set
  gameClassId: string; // Identifikator für die Spielklasse
  name: string; // z.B. "Herren L-UPL"
  seasonId: string; // Zugehörige Saison-ID (z.B. "2025")
}

export interface League {
  id: string; // Eindeutige ID der Liga
  leagueSetId: string; // Identifikator für das Liga-Set
  gameClassId: string; // Identifikator für die Spielklasse
  name: string; // z.B. "Herren L-UPL"
  seasonId: string; // Zugehörige Saison-ID (z.B. "2025")
}

export interface SwissunihockeyApiGroup {
  id: string; // Eindeutige ID der Gruppe
  name: string; // Name der Gruppe
  leagueId: string; // Zugehörige Liga-ID
  games: []; // Liste der Spiele in dieser Gruppe
}

export interface Group {
  id: string; // Eindeutige ID der Gruppe
  name: string; // Name der Gruppe
  leagueId: string; // Zugehörige Liga-ID
}

export interface SwissunihockeyApiClub {
  id: string; // Eindeutige ID des Vereins
  name: string; // Name des Vereins
  seasonId: string; // Zugehörige Saison-ID (z.B. "2025")
}

export interface Club {
  id: string; // Eindeutige ID des Vereins
  name: string; // Name des Vereins
  seasonId: string; // Zugehörige Saison-ID (z.B. "2025")
}

export interface SwissunihockeyApiTeam {
  id: string; // Eindeutige ID des Teams
  name: string; // Name des Teams
  clubId: string; // Zugehörige Vereins-ID
  groupId: string; // Zugehörige Gruppen-ID
  seasonId: string; // Zugehörige Saison-ID (z.B. "2025")
}

export interface Team {
  id: string; // Eindeutige ID des Teams
  name: string; // Name des Teams
  clubId: string; // Zugehörige Vereins-ID
  groupId: string; // Zugehörige Gruppen-ID
  seasonId: string; // Zugehörige Saison-ID (z.B. "2025")
}

export interface SwissunihockeyApiGame {
  id: string;
  seasonId: string; // Zugehörige Saison-ID (z.B. "2025")
  groupId: string; // Zugehörige Gruppen-ID
  datetime: string;
  venueName: string;
  venueLongitude: number;
  venueLatitude: number;
  homeTeam: string; // ID des Heimteams
  homeTeamLogo?: string; // Optionales Logo des Heimteams
  awayTeam: string; // ID des Auswärtsteams
  awayTeamLogo?: string; // Optionales Logo des Auswärtsteams
  scoreHome: number | null;
  scoreAway: number | null;
  referees: string[];
}

export interface Game {
  id: string;
  seasonId: string; // Zugehörige Saison-ID (z.B. "2025")
  groupId: string; // Zugehörige Gruppen-ID
  datetime: string;
  venueName: string;
  venueLongitude: number;
  venueLatitude: number;
  homeTeam: string; // ID des Heimteams
  homeTeamLogo?: string; // Optionales Logo des Heimteams
  awayTeam: string; // ID des Auswärtsteams
  awayTeamLogo?: string; // Optionales Logo des Auswärtsteams
  scoreHome: number | null;
  scoreAway: number | null;
  referees: string[];
}

export interface SwissunihockeyApiGameEvent {
  type: 'goal' | 'penalty';
  time: string;
  period: number;
  scorerId?: string;
  scorerName?: string;
  assistantId?: string;
  assistantName?: string;
}

export interface GameEvent {
  type: 'goal' | 'penalty';
  time: string;
  period: number;
  scorerId?: string;
  scorerName?: string;
  assistantId?: string;
  assistantName?: string;
}
