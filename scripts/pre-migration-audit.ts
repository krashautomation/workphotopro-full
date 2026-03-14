/**
 * Pre-Migration Data Audit
 * 
 * Run this script BEFORE touching any schema or code.
 * It compares Appwrite Teams data with your custom DB to find inconsistencies.
 * 
 * Usage: npx tsx scripts/pre-migration-audit.ts
 * 
 * Save output to: /docs/refactor/pre-migration-audit-results.json
 */

import 'dotenv/config';
import { Client, Databases, Query, Teams } from 'node-appwrite';
import * as fs from 'fs';
import * as path from 'path';

// Configuration - update these with your actual values
const CONFIG = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || '',
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '',
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '',
  apiKey: process.env.APPWRITE_API_KEY || '', // Need a server-side API key
};

// Validate config
if (!CONFIG.endpoint || !CONFIG.projectId || !CONFIG.databaseId || !CONFIG.apiKey) {
  console.error('❌ Missing required environment variables:');
  console.error('  - EXPO_PUBLIC_APPWRITE_ENDPOINT');
  console.error('  - EXPO_PUBLIC_APPWRITE_PROJECT_ID');
  console.error('  - EXPO_PUBLIC_APPWRITE_DATABASE_ID');
  console.error('  - APPWRITE_API_KEY (server key with read access)');
  process.exit(1);
}

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(CONFIG.endpoint)
  .setProject(CONFIG.projectId)
  .setKey(CONFIG.apiKey);

const databases = new Databases(client);
const teams = new Teams(client);

interface AuditReport {
  appwriteTeamCount: number;
  dbTeamCount: number;
  orphanedDbTeams: Array<{ dbId: string; appwriteTeamId: string; name: string }>;
  orphanedAppwriteTeams: Array<{ appwriteId: string; name: string }>;
  membershipsWithoutOrgId: Array<{ id: string; teamId: string; userId: string }>;
  membershipsWithoutTeam: Array<{ id: string; teamId: string }>;
  jobsWithoutTeam: Array<{ id: string; title: string }>;
  jobsWithoutOrg: Array<{ id: string; title: string }>;
  teamsWithoutCreatedBy: Array<{ id: string; name: string }>;
}

/**
 * Paginated list helper for node-appwrite
 */
async function paginatedList(
  collectionId: string,
  queries: string[] = [],
  batchSize: number = 100
): Promise<any[]> {
  const all: any[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const result = await databases.listDocuments(
      CONFIG.databaseId,
      collectionId,
      [
        ...queries,
        Query.limit(batchSize),
        Query.offset(offset)
      ]
    );

    all.push(...result.documents);
    offset += result.documents.length;
    hasMore = result.documents.length === batchSize;
    
    if (offset > 100000) {
      console.warn(`Pagination safety limit reached for ${collectionId}. Stopping at ${offset} records.`);
      break;
    }
  }

  return all;
}

async function runPreMigrationAudit(): Promise<AuditReport> {
  console.log('\n🔍 Running Pre-Migration Data Audit...\n');

  const report: AuditReport = {
    appwriteTeamCount: 0,
    dbTeamCount: 0,
    orphanedDbTeams: [],
    orphanedAppwriteTeams: [],
    membershipsWithoutOrgId: [],
    membershipsWithoutTeam: [],
    jobsWithoutTeam: [],
    jobsWithoutOrg: [],
    teamsWithoutCreatedBy: [],
  };

  // 1. Compare Appwrite Teams vs DB teams
  console.log('📊 Step 1: Comparing Appwrite Teams vs Database teams...');
  const appwriteTeamsList = await teams.list();
  report.appwriteTeamCount = appwriteTeamsList.total;

  const dbTeams = await paginatedList('teams');
  report.dbTeamCount = dbTeams.length;

  const appwriteTeamIds = new Set(appwriteTeamsList.teams.map((t: any) => t.$id));
  const dbAppwriteIds = new Set(dbTeams.map((t: any) => t.appwriteTeamId).filter(Boolean));

  // Teams in DB that have no matching Appwrite Team
  report.orphanedDbTeams = dbTeams
    .filter((t: any) => t.appwriteTeamId && !appwriteTeamIds.has(t.appwriteTeamId))
    .map((t: any) => ({ dbId: t.$id, appwriteTeamId: t.appwriteTeamId, name: t.teamName }));

  // Appwrite Teams with no matching DB record
  report.orphanedAppwriteTeams = appwriteTeamsList.teams
    .filter((t: any) => !dbAppwriteIds.has(t.$id))
    .map((t: any) => ({ appwriteId: t.$id, name: t.name }));

  console.log(`   Appwrite Teams: ${report.appwriteTeamCount}`);
  console.log(`   Database Teams: ${report.dbTeamCount}`);
  console.log(`   Orphaned DB teams: ${report.orphanedDbTeams.length}`);
  console.log(`   Orphaned Appwrite teams: ${report.orphanedAppwriteTeams.length}`);

  // 2. Memberships missing orgId
  console.log('\n📊 Step 2: Checking memberships for orgId...');
  const memberships = await paginatedList('memberships');
  report.membershipsWithoutOrgId = memberships
    .filter((m: any) => !m.orgId)
    .map((m: any) => ({ id: m.$id, teamId: m.teamId, userId: m.userId }));
  console.log(`   Memberships missing orgId: ${report.membershipsWithoutOrgId.length}`);

  // 3. Memberships pointing to non-existent teams
  console.log('\n📊 Step 3: Checking for orphaned memberships...');
  const dbTeamIds = new Set(dbTeams.map((t: any) => t.$id));
  report.membershipsWithoutTeam = memberships
    .filter((m: any) => !dbTeamIds.has(m.teamId))
    .map((m: any) => ({ id: m.$id, teamId: m.teamId }));
  console.log(`   Memberships with invalid teamId: ${report.membershipsWithoutTeam.length}`);

  // 4. Jobs missing team or org
  console.log('\n📊 Step 4: Checking jobs for teamId and orgId...');
  const jobs = await paginatedList('jobchat');
  report.jobsWithoutTeam = jobs
    .filter((j: any) => !j.teamId)
    .map((j: any) => ({ id: j.$id, title: j.title }));
  report.jobsWithoutOrg = jobs
    .filter((j: any) => !j.orgId)
    .map((j: any) => ({ id: j.$id, title: j.title }));
  console.log(`   Jobs missing teamId: ${report.jobsWithoutTeam.length}`);
  console.log(`   Jobs missing orgId: ${report.jobsWithoutOrg.length}`);

  // 5. Teams missing createdBy
  console.log('\n📊 Step 5: Checking teams for createdBy...');
  report.teamsWithoutCreatedBy = dbTeams
    .filter((t: any) => !t.createdBy)
    .map((t: any) => ({ id: t.$id, name: t.teamName }));
  console.log(`   Teams missing createdBy: ${report.teamsWithoutCreatedBy.length}`);

  // Output Summary
  console.log('\n=== PRE-MIGRATION AUDIT REPORT ===\n');
  console.log(`Appwrite Teams: ${report.appwriteTeamCount}`);
  console.log(`DB Teams: ${report.dbTeamCount}`);
  console.log(`Orphaned DB teams: ${report.orphanedDbTeams.length}`);
  console.log(`Orphaned Appwrite teams: ${report.orphanedAppwriteTeams.length}`);
  console.log(`Memberships missing orgId: ${report.membershipsWithoutOrgId.length}`);
  console.log(`Memberships with invalid teamId: ${report.membershipsWithoutTeam.length}`);
  console.log(`Jobs missing teamId: ${report.jobsWithoutTeam.length}`);
  console.log(`Jobs missing orgId: ${report.jobsWithoutOrg.length}`);
  console.log(`Teams missing createdBy: ${report.teamsWithoutCreatedBy.length}`);

  // Save report to file
  const reportPath = path.join(process.cwd(), 'docs', 'refactor', 'pre-migration-audit-results.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);

  // Check for blocking issues
  const hasBlockingIssues = 
    report.orphanedDbTeams.length > 0 ||
    report.orphanedAppwriteTeams.length > 0 ||
    report.membershipsWithoutTeam.length > 0;

  if (hasBlockingIssues) {
    console.log('\n❌ DATA INCONSISTENCIES FOUND. Resolve before proceeding.\n');
    console.log('Blocking issues:');
    if (report.orphanedDbTeams.length > 0) {
      console.log('  - Orphaned DB teams (have appwriteTeamId but no matching Appwrite team)');
      report.orphanedDbTeams.forEach(t => console.log(`    * ${t.name} (${t.dbId})`));
    }
    if (report.orphanedAppwriteTeams.length > 0) {
      console.log('  - Orphaned Appwrite teams (no matching DB record)');
      report.orphanedAppwriteTeams.forEach(t => console.log(`    * ${t.name} (${t.appwriteId})`));
    }
    if (report.membershipsWithoutTeam.length > 0) {
      console.log('  - Memberships referencing non-existent teams');
      console.log(`    * ${report.membershipsWithoutTeam.length} memberships affected`);
    }
    console.log('\n👉 Fix these manually before running migrations.\n');
    process.exit(1);
  } else {
    console.log('\n✅ Data looks consistent. Safe to proceed with migration.\n');
    console.log('Note: Memberships/orgId and teams/createdBy will be populated during migration.');
  }

  return report;
}

// Run the audit
runPreMigrationAudit().catch(err => {
  console.error('❌ Audit failed:', err);
  process.exit(1);
});
