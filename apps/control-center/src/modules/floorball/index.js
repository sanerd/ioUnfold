import { jsx as _jsx } from "hono/jsx/jsx-runtime";
import { Hono } from 'hono';
import { FloorballDashboardView } from './views/DashboardView.js';
import { JobTablePartial } from './views/JobTablePartial.js';
import { SwissunihockeyApiService, SeasonSyncPipeline, CompetitionWriter, GameWriter } from '@iounfold/domain-floorball';
import { createNeo4jDriver } from '@iounfold/db-client';
export const floorballManifest = {
    id: 'floorball',
    title: 'TotalFloorball',
    icon: '🥅',
    path: '/admin/floorball'
};
// In-Memory-Referenzen für laufende Pipelines im Node-Prozess
const activePipelines = new Map();
// Globaler Neo4j-Treiber für Schreib-Operationen
const neo4jDriver = createNeo4jDriver(process.env.NEO4J_URI || 'bolt://localhost:7687', process.env.NEO4J_USER || 'neo4j', process.env.NEO4J_PASSWORD || 'secret');
/**
 * Factory-Funktion für das Floorball-Hono-Modul mit injiziertem JobRepository (PostgreSQL) und Neo4j-Treiber
 */
export const createFloorballModule = (jobRepo, neo4jDriver) => {
    const app = new Hono();
    // 1. Hauptansicht: Lädt alle Jobs aus PostgreSQL
    app.get('/', async (c) => {
        const jobs = await jobRepo.getJobs();
        return c.html(_jsx(FloorballDashboardView, { jobs: jobs }));
    });
    // 2. Saison-Sync Starten
    app.post('/sync/season', async (c) => {
        const body = await c.req.parseBody();
        const season = body['season'] || '2025';
        const jobId = `SEASON-${season}`;
        // Alten Job-Zustand für einen echten Neustart komplett entfernen
        await jobRepo.deleteJob(jobId);
        // Job in PostgreSQL anlegen/aktualisieren
        await jobRepo.upsertJob({
            id: jobId,
            type: 'SEASON',
            target: `Saison ${season}`,
            status: 'RUNNING',
            progress: 0,
            details: 'Initialisiere Pipeline & Datenbanken...'
        });
        const apiService = new SwissunihockeyApiService();
        const compWriter = new CompetitionWriter(neo4jDriver);
        const gameWriter = new GameWriter(neo4jDriver);
        const pipeline = new SeasonSyncPipeline(apiService, compWriter, gameWriter, jobRepo);
        activePipelines.set(jobId, pipeline);
        // Asynchroner Pipeline-Lauf mit PostgreSQL-Persistenz
        pipeline
            .run(season, async (progress, details, cursor) => {
            // Zwischenstand & Cursor in Postgres sichern
            await jobRepo.upsertJob({
                id: jobId,
                type: 'SEASON',
                target: `Saison ${season}`,
                status: 'RUNNING',
                progress,
                cursor_position: cursor,
                details
            });
        }, undefined, jobId)
            .then(async () => {
            await jobRepo.upsertJob({
                id: jobId,
                type: 'SEASON',
                target: `Saison ${season}`,
                status: 'COMPLETED',
                progress: 100,
                details: 'Import erfolgreich abgeschlossen.'
            });
            activePipelines.delete(jobId);
        })
            .catch(async (err) => {
            const isCancelled = err.message === 'JOB_CANCELLED';
            const isPaused = err.message === 'JOB_PAUSED';
            const finalStatus = isCancelled
                ? 'CANCELLED'
                : isPaused
                    ? 'PAUSED'
                    : 'FAILED';
            await jobRepo.updateStatusAndCursor(jobId, finalStatus);
            activePipelines.delete(jobId);
        });
        const jobs = await jobRepo.getJobs();
        return c.html(_jsx(JobTablePartial, { jobs: jobs }));
    });
    // 3. Job Pausieren
    app.post('/sync/pause/:id', async (c) => {
        const jobId = c.req.param('id');
        const pipeline = activePipelines.get(jobId);
        if (pipeline) {
            // Bricht den aktuellen Durchlauf ab, behält aber den Cursor in der Pipeline
            pipeline.pause();
        }
        await jobRepo.updateStatusAndCursor(jobId, 'PAUSED');
        const jobs = await jobRepo.getJobs();
        return c.html(_jsx(JobTablePartial, { jobs: jobs }));
    });
    // 4. Job Fortsetzen (Resume)
    app.post('/sync/resume/:id', async (c) => {
        const jobId = c.req.param('id');
        const allJobs = await jobRepo.getJobs();
        const existingJob = allJobs.find((j) => j.id === jobId);
        if (existingJob) {
            // Vor dem Fortsetzen Neo4j-Verbindung testen, aber PAYLOAD UNBERÜHRT LASSEN!
            try {
                await neo4jDriver.verifyConnectivity();
            }
            catch (neo4jErr) {
                console.error('❌ Neo4j Verbindungstest beim Resume fehlgeschlagen:', neo4jErr.message);
                // Status auf PAUSED belassen, damit der Payload erhalten bleibt
                await jobRepo.upsertJob({
                    id: jobId,
                    type: existingJob.type,
                    target: existingJob.target,
                    status: 'PAUSED',
                    progress: existingJob.progress,
                    cursor_position: existingJob.cursor_position,
                    details: `Neo4j Verbindungsfehler beim Fortsetzen: ${neo4jErr.message}`
                });
                const jobs = await jobRepo.getJobs();
                return c.html(_jsx(JobTablePartial, { jobs: jobs }));
            }
            // Status auf RUNNING setzen, aber progress & details aus dem bestehenden Job behalten!
            await jobRepo.upsertJob({
                id: jobId,
                type: existingJob.type,
                target: existingJob.target,
                status: 'RUNNING',
                progress: existingJob.progress, // <--- Behält den alten Prozentwert
                cursor_position: existingJob.cursor_position,
                details: `Setze Fortsetzung fort... (${existingJob.details})` // <--- Angepasste Info
            });
            const apiService = new SwissunihockeyApiService();
            const compWriter = new CompetitionWriter(neo4jDriver);
            const gameWriter = new GameWriter(neo4jDriver);
            const pipeline = new SeasonSyncPipeline(apiService, compWriter, gameWriter, jobRepo);
            activePipelines.set(jobId, pipeline);
            const season = existingJob.target.replace('Saison ', '');
            pipeline
                .resume(season, existingJob.cursor_position, async (progress, details, cursor) => {
                await jobRepo.upsertJob({
                    id: jobId,
                    type: existingJob.type,
                    target: existingJob.target,
                    status: 'RUNNING',
                    progress,
                    cursor_position: cursor,
                    details
                });
            }, jobId)
                .then(async () => {
                await jobRepo.updateStatusAndCursor(jobId, 'COMPLETED');
                activePipelines.delete(jobId);
            })
                .catch(async (err) => {
                const finalStatus = err.message === 'JOB_PAUSED' ? 'PAUSED' : 'FAILED';
                await jobRepo.updateStatusAndCursor(jobId, finalStatus);
                activePipelines.delete(jobId);
            });
        }
        const jobs = await jobRepo.getJobs();
        return c.html(_jsx(JobTablePartial, { jobs: jobs }));
    });
    // 5. Job Abbrechen
    app.post('/sync/cancel/:id', async (c) => {
        const jobId = c.req.param('id');
        const pipeline = activePipelines.get(jobId);
        if (pipeline) {
            pipeline.cancel();
        }
        await jobRepo.updateStatusAndCursor(jobId, 'CANCELLED');
        const jobs = await jobRepo.getJobs();
        return c.html(_jsx(JobTablePartial, { jobs: jobs }));
    });
    // Endpunkt für das automatische Polling des HTMX-Table-Partials
    app.get('/sync/jobs', async (c) => {
        const jobs = await jobRepo.getJobs();
        return c.html(_jsx(JobTablePartial, { jobs: jobs }));
    });
    return app;
};
