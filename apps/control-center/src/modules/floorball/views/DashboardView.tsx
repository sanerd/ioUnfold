import { JobTablePartial, SyncJob } from './JobTablePartial.js';
import { SwissunihockeyApiService } from '@iounfold/domain-floorball';

export const FloorballDashboardView = async ({ jobs }: { jobs: SyncJob[] }) => {
  // Service-Instanz erstellen und Saisons abrufen
  const apiService = new SwissunihockeyApiService();
  let seasons: { id: string; name: string }[] = [];

  try {
    seasons = await apiService.getSeasons();
  } catch (error) {
    console.error('Konnte Saisons nicht laden:', error);
    // Fallback falls die API nicht erreichbar ist
    seasons = [{ id: '2026', name: '2026/2027' }];
  }
  return (
    <div>
      <header style='margin-bottom: 2rem;'>
        <h2>TotalFloorball Sync Control</h2>
        <p style='color: var(--pico-muted-color); font-size: 0.9rem;'>
          ETL Pipeline Steuerung für Swiss Unihockey, Neo4j Graph & TimescaleDB
        </p>
      </header>

      {/* Forms Grid (Natives Pico .grid) */}
      <div class='grid'>
        {/* Card 1: Season Sync */}
        <article>
          <header>
            <strong>Saison Initial-Sync</strong>
          </header>
          <form
            hx-post='/admin/floorball/sync/season'
            hx-target='#job-table-container'
          >
            <label htmlFor='season'>Saison</label>
            <select id='season' name='season' required>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name}
                </option>
              ))}
            </select>

            <button type='submit' style='margin-top: 1rem;'>
              Saison-Sync Starten
            </button>
          </form>
        </article>

        {/* Card 2: Live Sync */}
        <article>
          <header>
            <strong>Live-Spiel Sync</strong>
          </header>
          <form
            hx-post='/admin/floorball/sync/live'
            hx-target='#job-table-container'
          >
            <label htmlFor='game_id'>Game ID</label>
            <input
              type='number'
              id='game_id'
              name='game_id'
              placeholder='1045231'
              required
            />

            <button type='submit' style='margin-top: 1rem;'>
              Live-Sync Starten
            </button>
          </form>
        </article>
      </div>

      {/* Monitoring Section */}
      <section style='margin-top: 2.5rem;'>
        <h3>Prozess-Monitoring</h3>
        <div
          hx-ext='sse'
          sse-connect='/admin/floorball/sync/stream'
          sse-swap='message'
        >
          <JobTablePartial jobs={jobs} />
        </div>
      </section>
    </div>
  );
};
