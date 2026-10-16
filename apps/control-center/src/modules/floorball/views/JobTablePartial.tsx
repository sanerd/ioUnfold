import { jsx } from 'hono/jsx';
import { SyncJobRecord } from '@iounfold/db-client';
export type SyncJob = SyncJobRecord;

export const JobTablePartial = ({ jobs }: { jobs: SyncJobRecord[] }) => {
  // Prüfen, ob aktuell mindestens ein Job läuft
  const hasRunningJobs = jobs.some((job) => job.status === 'RUNNING');

  return (
    <div
      id='job-table-container'
      /* ⚡ AUTOMATISCHES POLLING: Pollt alle 2s den Status neu, solange ein Job auf RUNNING steht */
      {...(hasRunningJobs
        ? {
            'hx-get': '/admin/floorball/sync/jobs',
            'hx-trigger': 'every 2s',
            'hx-swap': 'outerHTML'
          }
        : {})}
    >
      {/* Aktive & Vergangene Pipelines als Pico article */}
      <article style='margin-bottom: 1.5rem;'>
        <header style='display: flex; justify-content: space-between; align-items: center;'>
          <strong>Aktive & Vergangene Pipelines</strong>
          <span style='font-family: monospace; font-size: 0.75rem; color: var(--pico-muted-color);'>
            Total: {jobs.length} Jobs {hasRunningJobs && '🔄 (Live Sync)'}
          </span>
        </header>

        {jobs.length === 0 ? (
          <p style='color: var(--pico-muted-color); text-align: center; padding: 2rem 0; margin: 0;'>
            Keine aktiven Jobs vorhanden. Starte einen Sync-Prozess über das
            Formular.
          </p>
        ) : (
          <div style='overflow-x: auto;'>
            <table role='grid' style='width: 100%; font-size: 0.85rem;'>
              <thead>
                <tr>
                  <th>Job-ID</th>
                  <th>Typ / Ziel</th>
                  <th>Status</th>
                  <th>Fortschritt</th>
                  <th>Details</th>
                  <th style='text-align: right;'>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td style='font-family: monospace; font-weight: 600;'>
                      {job.id}
                    </td>
                    <td>
                      <div style='font-weight: 500;'>{job.type}</div>
                      <small style='color: var(--pico-muted-color);'>
                        {job.target}
                      </small>
                    </td>
                    <td>
                      <span class={`badge badge-${job.status}`}>
                        {job.status}
                      </span>
                    </td>
                    <td style='width: 150px;'>
                      <div style='display: flex; align-items: center; gap: 0.5rem;'>
                        <div style='flex-grow: 1; background-color: var(--pico-background-color); height: 6px; border-radius: var(--pico-border-radius); overflow: hidden; border: 1px solid var(--pico-border-color);'>
                          <div
                            style={`width: ${job.progress}%; background-color: var(--pico-primary); height: 100%; transition: width 0.3s ease;`}
                          />
                        </div>
                        <span style='font-family: monospace; font-size: 0.75rem;'>
                          {job.progress}%
                        </span>
                      </div>
                    </td>
                    <td style='color: var(--pico-muted-color); font-size: 0.8rem;'>
                      {job.details || 'Keine Details'}
                    </td>
                    <td style='text-align: right;'>
                      <div style='display: flex; gap: 0.25rem; justify-content: flex-end; align-items: center;'>
                        {job.status === 'RUNNING' && (
                          <button
                            hx-post={`/admin/floorball/sync/pause/${job.id}`}
                            hx-target='#job-table-container'
                            class='secondary outline'
                            style='background: transparent; border: 1px solid #fbbf24; color: #fbbf24; padding: 0.2rem 0.4rem; font-size: 0.7rem; cursor: pointer;'
                          >
                            Pause
                          </button>
                        )}

                        {job.status === 'PAUSED' && (
                          <button
                            hx-post={`/admin/floorball/sync/resume/${job.id}`}
                            hx-target='#job-table-container'
                            class='contrast'
                            style='background: var(--pico-primary); color: #020617; padding: 0.2rem 0.4rem; font-size: 0.7rem; cursor: pointer; font-weight: bold; border: none;'
                          >
                            Fortsetzen
                          </button>
                        )}

                        {(job.status === 'RUNNING' ||
                          job.status === 'PAUSED') && (
                          <button
                            hx-post={`/admin/floorball/sync/cancel/${job.id}`}
                            hx-target='#job-table-container'
                            class='secondary outline'
                            style='background: transparent; border: 1px solid #ef4444; color: #ef4444; padding: 0.2rem 0.4rem; font-size: 0.7rem; cursor: pointer;'
                          >
                            Abbrechen
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      {/* Live Terminal Output */}
      {jobs.length > 0 && jobs[0].details && (
        <article>
          <header>
            <strong>Letzter Aktivitätsstatus</strong>
          </header>
          <div class='log-terminal'>
            <div class='log-line'>
              <span class='log-time'>
                [{new Date(jobs[0].created_at).toLocaleTimeString('de-CH')}]
              </span>
              <span class='log-info'>{jobs[0].details}</span>
            </div>
          </div>
        </article>
      )}
    </div>
  );
};
