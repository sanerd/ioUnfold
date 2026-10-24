import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { exec } from 'node:child_process';
import {
  createTimescalePool,
  JobRepository,
  createNeo4jDriver
} from '@iounfold/db-client';
import { createFloorballModule } from './modules/floorball/index.js';
import { Layout } from './core/layout.js';
import { ADMIN_MODULES } from './core/modules.js';
import { FloorballDashboardView } from './modules/floorball/views/DashboardView.js';

const app = new Hono();

app.use('/*', serveStatic({ root: './public' }));

// --- DOCKER COMPOSE AUTO-START ---
function ensureInfrastructureRunning() {
  exec('docker compose up -d', (err, stdout, stderr) => {
    if (err) {
      console.warn(
        '⚠️ Konnte Docker Compose Container nicht starten. Läuft Docker? (Fehler: Ignoriert)'
      );
      if (stderr) console.error(stderr);
    } else {
      console.log(
        '🚀 Alle Docker-Infrastruktur-Container erfolgreich hochgefahren / geprüft.'
      );
      if (stdout) console.log(stdout.trim());
    }
  });
}
ensureInfrastructureRunning();

// --- 1. DATENBANKVERBINDUNGEN ZENTRAL AUFBAUEN ---

// A. PostgreSQL / TimescaleDB
const pgPool = createTimescalePool(
  process.env.POSTGRES_CONTROL_CENTER_URL ||
    'postgres://iounfold:iounfold_password@localhost:5432/iounfold_control'
);
export const jobRepo = new JobRepository(pgPool);
jobRepo.ensureTableExists().catch(console.error);

// B. Neo4j Treiber zentral instanziieren
const neo4jUri = process.env.NEO4J_URI;
const neo4jUser = process.env.NEO4J_USER;
const neo4jPassword = process.env.NEO4J_PASSWORD;

// Fail-Fast, falls essenzielle Configs fehlen (ohne Hardcoding im Code)
if (!neo4jUri || !neo4jUser || !neo4jPassword) {
  console.error(
    '❌ Kritischer Fehler: Neo4j Umgebungsvariablen (URI, User, Password) sind nicht in der .env definiert!'
  );
  process.exit(1);
}

export const neo4jDriver = createNeo4jDriver(
  neo4jUri,
  neo4jUser,
  neo4jPassword
);

// Healthcheck beim Anwendungsstart für Neo4j durchführen
neo4jDriver
  .verifyConnectivity()
  .then(() => console.log('✅ Neo4j Verbindung erfolgreich hergestellt.'))
  .catch((err) =>
    console.error('❌ Neo4j Verbindungsfehler beim App-Start:', err.message)
  );

// --- 2. MODUL MIT BEIDEN REPOSITORIES / TREIBERN INITIALISIEREN ---
const floorballModule = createFloorballModule(jobRepo, neo4jDriver);

// --- 3. ROUTEN & SERVER ---
app.get('/', (c) => c.redirect('/admin/floorball'));

// Floorball-Modul Hauptansicht (Integriert in das Core-Layout)
app.get('/admin/floorball', async (c) => {
  const isHtmx = c.req.header('HX-Request') === 'true';
  const jobs = await jobRepo.getJobs();
  if (isHtmx) {
    return c.html(<FloorballDashboardView jobs={jobs} />);
  }

  return c.html(
    <Layout currentModuleId='floorball' modules={ADMIN_MODULES}>
      <FloorballDashboardView jobs={jobs} />
    </Layout>
  );
});

app.route('/admin/floorball', floorballModule);

const port = Number(process.env.PORT) || 3000;
console.log(`🚀 Control Center läuft auf http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});
