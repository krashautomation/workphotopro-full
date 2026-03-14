import * as dotenv from 'dotenv';
dotenv.config();
import { Client, Databases, Query } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const db = new Databases(client);
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;

async function check() {
  console.log('Checking database...');
  console.log('Database ID:', DATABASE_ID);
  
  // Show all jobs with their teamId and orgId
  const jobs = await db.listDocuments(
    DATABASE_ID,
    'jobchat',
    [Query.limit(10)]
  );
  
  console.log('\nJOBS IN DATABASE:');
  console.log('Total jobs:', jobs.documents.length);
  jobs.documents.forEach((j: any) => {
    console.log({
      id: j.$id,
      title: j.title,
      teamId: j.teamId,
      orgId: j.orgId,
      deletedAt: j.deletedAt
    });
  });

  // Show all teams
  const teams = await db.listDocuments(
    DATABASE_ID,
    'teams',
    [Query.limit(10)]
  );
  
  console.log('\nTEAMS IN DATABASE:');
  console.log('Total teams:', teams.documents.length);
  teams.documents.forEach((t: any) => {
    console.log({
      id: t.$id,
      teamName: t.teamName,
      orgId: t.orgId
    });
  });
}

check().catch(console.error);
