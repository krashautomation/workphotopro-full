/**
 * Script: migrate-manager-roles
 *
 * Converts legacy "manager" roles to "member" across Appwrite Teams and the memberships collection.
 *
 * Usage:
 *   node scripts/migrate-manager-roles.js
 *
 * Requirements:
 *   APPWRITE_ENDPOINT
 *   APPWRITE_PROJECT_ID
 *   APPWRITE_API_KEY         // needs teams.write, documents.read, documents.write
 *   APPWRITE_DATABASE_ID
 */

const { Client, Databases, Teams, Query } = require('node-appwrite');

try {
  require('dotenv').config();
} catch (error) {
  // optional
}

const APPWRITE_ENDPOINT =
  process.env.APPWRITE_ENDPOINT ||
  process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ||
  'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID =
  process.env.APPWRITE_PROJECT_ID || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || '';
const APPWRITE_DATABASE_ID =
  process.env.APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '';
const MEMBERSHIPS_COLLECTION_ID = 'memberships';

if (!APPWRITE_PROJECT_ID || !APPWRITE_API_KEY || !APPWRITE_DATABASE_ID) {
  console.error('❌ Missing required environment variables for Appwrite access.');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);
const teams = new Teams(client);

async function listAllTeams() {
  const teamsAccumulator = [];
  let offset = 0;

  while (true) {
    const response = await teams.list(undefined, 100, offset);
    teamsAccumulator.push(...response.teams);

    if (offset + response.teams.length >= response.total) {
      break;
    }

    offset += response.teams.length;
  }

  return teamsAccumulator;
}

async function listMembershipsForTeam(teamId) {
  const memberships = [];
  let offset = 0;

  while (true) {
    const response = await teams.listMemberships(teamId, undefined, 100, offset);
    memberships.push(...response.memberships);

    if (offset + response.memberships.length >= response.total) {
      break;
    }

    offset += response.memberships.length;
  }

  return memberships;
}

async function migrateTeamRoles() {
  console.log('🔄 Updating Appwrite Team memberships…');
  const allTeams = await listAllTeams();

  let updated = 0;
  let skipped = 0;

  for (const team of allTeams) {
    const memberships = await listMembershipsForTeam(team.$id);

    for (const membership of memberships) {
      const hasManagerRole = membership.roles?.includes('manager');

      if (!hasManagerRole) {
        skipped += 1;
        continue;
      }

      try {
        await teams.updateMembership(team.$id, membership.$id, ['member']);
        updated += 1;
        console.log(
          `✅ Updated team ${team.name} membership ${membership.$id} (${membership.userEmail || membership.userId}) to member`
        );
      } catch (error) {
        console.error(
          `❌ Failed to update membership ${membership.$id} in team ${team.name}:`,
          error.message || error
        );
      }
    }
  }

  console.log(`Appwrite Teams migration complete. Updated: ${updated}, skipped: ${skipped}`);
}

async function migrateMembershipDocuments() {
  console.log('🔄 Updating membership documents in database…');
  let cursor = null;
  let updated = 0;

  while (true) {
    const queries = [Query.equal('role', 'manager'), Query.limit(100)];

    if (cursor) {
      queries.push(Query.cursorAfter(cursor));
    }

    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      MEMBERSHIPS_COLLECTION_ID,
      queries
    );

    if (!response.documents.length) {
      break;
    }

    for (const document of response.documents) {
      try {
        await databases.updateDocument(APPWRITE_DATABASE_ID, MEMBERSHIPS_COLLECTION_ID, document.$id, {
          role: 'member',
        });
        updated += 1;
        console.log(`✅ Updated membership document ${document.$id} to role "member"`);
      } catch (error) {
        console.error(
          `❌ Failed to update membership document ${document.$id}:`,
          error.message || error
        );
      }
    }

    cursor = response.documents[response.documents.length - 1].$id;

    if (response.documents.length < 100) {
      break;
    }
  }

  if (updated === 0) {
    console.log('No membership documents required updates.');
  } else {
    console.log(`Database migration complete. Updated ${updated} documents.`);
  }
}

async function main() {
  console.log('🚀 Starting manager→member migration');

  await migrateTeamRoles();
  await migrateMembershipDocuments();

  console.log('✅ Migration finished');
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});

