import { jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { JobTablePartial } from './JobTablePartial.js';
import { SwissunihockeyApiService } from '@iounfold/domain-floorball';
export const FloorballDashboardView = async ({ jobs }) => {
    // Service-Instanz erstellen und Saisons abrufen
    const apiService = new SwissunihockeyApiService();
    let seasons = [];
    try {
        seasons = await apiService.getSeasons();
    }
    catch (error) {
        console.error('Konnte Saisons nicht laden:', error);
        // Fallback falls die API nicht erreichbar ist
        seasons = [{ id: '2026', name: '2026/2027' }];
    }
    return (_jsxs("div", { children: [_jsxs("header", { style: 'margin-bottom: 2rem;', children: [_jsx("h2", { children: "TotalFloorball Sync Control" }), _jsx("p", { style: 'color: var(--pico-muted-color); font-size: 0.9rem;', children: "ETL Pipeline Steuerung f\u00FCr Swiss Unihockey, Neo4j Graph & TimescaleDB" })] }), _jsxs("div", { class: 'grid', children: [_jsxs("article", { children: [_jsx("header", { children: _jsx("strong", { children: "Saison Initial-Sync" }) }), _jsxs("form", { "hx-post": '/admin/floorball/sync/season', "hx-target": '#job-table-container', children: [_jsx("label", { htmlFor: 'season', children: "Saison" }), _jsx("select", { id: 'season', name: 'season', required: true, children: seasons.map((season) => (_jsx("option", { value: season.id, children: season.name }, season.id))) }), _jsx("button", { type: 'submit', style: 'margin-top: 1rem;', children: "Saison-Sync Starten" })] })] }), _jsxs("article", { children: [_jsx("header", { children: _jsx("strong", { children: "Live-Spiel Sync" }) }), _jsxs("form", { "hx-post": '/admin/floorball/sync/live', "hx-target": '#job-table-container', children: [_jsx("label", { htmlFor: 'game_id', children: "Game ID" }), _jsx("input", { type: 'number', id: 'game_id', name: 'game_id', placeholder: '1045231', required: true }), _jsx("button", { type: 'submit', style: 'margin-top: 1rem;', children: "Live-Sync Starten" })] })] })] }), _jsxs("section", { style: 'margin-top: 2.5rem;', children: [_jsx("h3", { children: "Prozess-Monitoring" }), _jsx("div", { "hx-ext": 'sse', "sse-connect": '/admin/floorball/sync/stream', "sse-swap": 'message', children: _jsx(JobTablePartial, { jobs: jobs }) })] })] }));
};
