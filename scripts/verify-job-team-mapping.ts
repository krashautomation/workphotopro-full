import * as dotenv from 'dotenv';
dotenv.config();

import { Client, Databases, Query } from 'node-appwrite';

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;

if (!endpoint || !projectId || !apiKey || !databaseId) {
  throw new Error('Missing required Appwrite environment variables.');
}

const DATABASE_ID = databaseId;

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const databases = new Databases(client);

async function paginatedList(collectionId: string, queries: string[] = [], batchSize = 100): Promise<any[]> {
  const limit = Math.min(batchSize, 100);
  const all: any[] = [];
  let offset = 0;

  while (true) {
    const page = await databases.listDocuments(DATABASE_ID, collectionId, [
      ...queries,
      Query.limit(limit),
      Query.offset(offset),
    ]);

    all.push(...page.documents);

    if (page.documents.length < limit) {
      break;
    }

    offset += page.documents.length;

    if (offset > 100000) {
      console.warn(`Pagination safety stop for ${collectionId} at ${offset} records.`);
      break;
    }
  }

  return all;
}

async function verifyJobTeamMapping() {
  const teams = await paginatedList('teams', [Query.orderAsc('teamName')]);

  console.log(`Found ${teams.length} teams. Verifying job mapping...\n`);

  for (const team of teams) {
    const teamId = team.$id;
    const teamName = team.teamName || 'Unnamed Team';
    const orgId = team.orgId;

    const jobs = await paginatedList('jobchat', [
      Query.equal('teamId', teamId),
      Query.equal('orgId', orgId),
      Query.orderAsc('title'),
    ]);

    const titles = jobs
      .map((job: any) => job.title)
      .filter((title: unknown): title is string => typeof title === 'string' && title.trim().length > 0);

    console.log(`${teamName} (${teamId} / orgId: ${orgId}):`);
    console.log(`  - ${jobs.length} jobs found`);
    if (titles.length > 0) {
      console.log(`  - ${titles.join(', ')}`);
    }
    console.log('');
  }
}

verifyJobTeamMapping().catch((error) => {
  console.error('Verification failed:', error);
  process.exit(1);
});
