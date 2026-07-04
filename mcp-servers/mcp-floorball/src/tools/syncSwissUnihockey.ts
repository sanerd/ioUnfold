import axios from 'axios';
import { getSession } from '../services/neo4j';

interface SwissUnihockeyClub {
  id: string;
  text: string; // Name des Vereins
}

export const syncClubData = async (clubId: string): Promise<string> => {
  const session = getSession();
  try {
    // 1. Daten von Swiss Unihockey API abfragen
    // Beispiel-Endpunkt für Club-Details gemäss Dokumentation
    const response = await axios.get(
      `https://api-v2.swissunihockey.ch/api/clubs/${clubId}`
    );
    const clubData = response.data.data as SwissUnihockeyClub;

    if (!clubData) throw new Error('Keine Daten von API erhalten');

    // 2. In Neo4j mittels Cypher-Query wegschreiben (Idempotent via MERGE)
    await session.executeWrite((tx) =>
      tx.run(
        `
        MERGE (c:Club { id: $id })
        ON CREATE SET c.name = $name, c.lastSync = datetime()
        ON MATCH SET c.name = $name, c.lastSync = datetime()
        RETURN c
        `,
        { id: clubId, name: clubData.text }
      )
    );

    return `Verein mit ID ${clubId} ("${clubData.text}") erfolgreich in Neo4j synchronisiert.`;
  } catch (error: any) {
    return `Fehler beim Sync: ${error.message}`;
  } finally {
    await session.close();
  }
};
