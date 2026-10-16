import { jsx as _jsx } from "hono/jsx/jsx-runtime";
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { exec } from 'node:child_process';
import { createTimescalePool, JobRepository } from '@iounfold/db-client';
import { createFloorballModule } from './modules/floorball/index.js';
import { Layout } from './core/layout.js';
import { ADMIN_MODULES } from './core/modules.js';
import { FloorballDashboardView } from './modules/floorball/views/DashboardView.js';
const app = new Hono();
// --- DOCKER COMPOSE AUTO-START ---
function ensureInfrastructureRunning() {
    // Führt 'docker compose up -d' aus.
    // Falls deine docker-compose.yml in einem übergeordneten Ordner liegt,
    // kannst du den Pfad anpassen, z.B. 'docker compose -f ../../docker-compose.yml up -d'
    exec('docker compose up -d', (err, stdout, stderr) => {
        if (err) {
            console.warn('⚠️ Konnte Docker Compose Container nicht starten. Läuft Docker? (Fehler: Ignoriert)');
            if (stderr)
                console.error(stderr);
        }
        else {
            console.log('🚀 Alle Docker-Infrastruktur-Container erfolgreich hochgefahren / geprüft.');
            if (stdout)
                console.log(stdout.trim());
        }
    });
}
// Beim Server-Start ausführen (non-blocking)
ensureInfrastructureRunning();
// 1. PostgreSQL Verbindung aubauen und JobRepository initialisieren
const pgPool = createTimescalePool(process.env.DATABASE_URL ||
    'postgres://iounfold:iounfold_password@localhost:5432/iounfold_control');
export const jobRepo = new JobRepository(pgPool);
jobRepo.ensureTableExists().catch(console.error);
// 2. Floorball-Modul dynamisch mit dem Repository erzeugen
const floorballModule = createFloorballModule(jobRepo);
// --- ZENTRALE ROUTEN & TAB-NAVIGATION ---
app.get('/', (c) => c.redirect('/admin/floorball'));
// 3. Floorball-Modul Hauptansicht (Integriert in das Core-Layout)
app.get('/admin/floorball', async (c) => {
    const isHtmx = c.req.header('HX-Request') === 'true';
    const jobs = await jobRepo.getJobs(); // Echte Jobs aus Postgres laden
    if (isHtmx) {
        return c.html(_jsx(FloorballDashboardView, { jobs: jobs }));
    }
    return c.html(_jsx(Layout, { currentModuleId: 'floorball', modules: ADMIN_MODULES, children: _jsx(FloorballDashboardView, { jobs: jobs }) }));
});
// 4. Alle weiteren Routen des Floorball-Moduls einbinden
app.route('/admin/floorball', floorballModule);
// 5. Server starten
const port = Number(process.env.PORT) || 3000;
console.log(`🚀 Control Center läuft auf http://localhost:${port}`);
serve({
    fetch: app.fetch,
    port
});
