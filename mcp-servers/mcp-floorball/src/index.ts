import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { initNeo4j, closeNeo4j } from './services/neo4j';
import { syncClubData } from './tools/syncSwissUnihockey';
import * as dotenv from 'dotenv';

dotenv.config();

// 1. MCP Server initialisieren
const server = new Server(
  { name: 'mcp-totalfloorball', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// 2. Verfügbare Tools auflisten (für das LLM sichtbar)
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'sync_swiss_unihockey_club',
        description:
          'Lädt Vereins- und Teamdaten aus der Swiss Unihockey API v2 und überführt sie in die Neo4j Graphdatenbank.',
        inputSchema: {
          type: 'object',
          properties: {
            clubId: {
              type: 'string',
              description:
                'Die offizielle ID des Vereins bei Swiss Unihockey (z.B. 431137 für SV Wiler-Ersigen).'
            }
          },
          required: ['clubId']
        }
      }
    ]
  };
});

// 3. Tool-Ausführung handhaben
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'sync_swiss_unihockey_club') {
    const clubId = args?.clubId as string;
    const result = await syncClubData(clubId);
    return { content: [{ type: 'text', text: result }] };
  }

  throw new Error(`Tool ${name} nicht gefunden.`);
});

// 4. Server starten
const main = async () => {
  initNeo4j();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('TotalFloorball MCP Server läuft auf Stdio');
};

main().catch((err) => {
  console.error('Server-Fehler:', err);
  process.exit(1);
});

// Clean-up bei Beendigung
process.on('SIGINT', async () => {
  await closeNeo4j();
  process.exit(0);
});
