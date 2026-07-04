# ioUnfold Monorepo Architektur & Dokumentation

Dieses Repository verwaltet das gesamte Software-Ökosystem von **ioUnfold** als Node.js Monorepo. Es vereint Endnutzer-Anwendungen, zukunftssichere MCP-Server (Model Context Protocol) und gemeinsam genutzte Code-Pakete.

## 🛠 Tech Stack Core

- **Paketmanager:** pnpm (Workspaces)
- **Monorepo-Orchestrator:** Turborepo
- **Laufzeitumgebung:** Node.js (>= 20)
- **Sprache:** TypeScript

---

## 📂 Ordnerstruktur

- `apps/` — Deploybare Client-Anwendungen (Web-Frontends, Mobile Apps, Auth-Services).
- `mcp-servers/` — KI-native Backends, die über das Model Context Protocol kommunizieren.
  ├── mcp-floorball/ # NEU: MCP-Server für den Import der Swiss Unihockey API v2 in Neo4j
- `packages/` — Interne, wiederverwendbare npm-Module (Validierungs-Schemas, UI-Themes, Configs).

---

## 🏗 Setup & Initialisierung (Historie)

### Schritt 1: Repository initialisiert

Die Verzeichnisse wurden angelegt und Git wurde gestartet. Eine globale `.gitignore` wurde eingerichtet, um `node_modules` und `dist/`-Ordner strikt zu ignorieren.

### Schritt 2: Workspace Definition

Die `pnpm-workspace.yaml` wurde definiert, um pnpm mitzuteilen, wo sich ausführbare Einheiten und Pakete befinden.

### Schritt 3: Turborepo Pipeline

Die Datei `turbo.json` steuert die Build-Pipeline und sorgt für intelligentes Caching (Inkrementelle Builds).

---

## 🚀 Wichtige Befehle für die Entwicklung

Führe diese Befehle immer im **Wurzelverzeichnis (Root)** des Repositories aus:

- `pnpm install` — Installiert alle Abhängigkeiten über alle Workspaces hinweg.
- `pnpm dev` — Startet alle Apps und MCP-Server parallel im Entwicklungsmodus.
- `pnpm build` — Baut alle Anwendungen produktionsreif (inkl. Cache-Optimierung).

### Schritt 5: Swiss Unihockey & Neo4j MCP-Server (@iounfold/mcp-floorball)

Ein dedizierter MCP-Server wurde aufgesetzt, um Daten der offiziellen Swiss Unihockey API v2 zu konsumieren und in eine lokale Neo4j-Graphdatenbank zu transformieren. Der Server exponiert Tools wie `sync_swiss_unihockey_club`, die direkt von LLMs (z.B. in Cursor/Windsurf) oder dem Admin-Dashboard getriggert werden können.
