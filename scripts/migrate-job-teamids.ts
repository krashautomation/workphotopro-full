import * as dotenv from 'dotenv';
dotenv.config();
import { Client, Databases, Query } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const db = new Databases(client);
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;

// Paginated list helper
async function paginatedList(
  collectionId: string,
  queries: any[] = [],
  limit: number = 100
): Promise<any[]> {
  const allDocuments: any[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await db.listDocuments(
      DATABASE_ID,
      collectionId,
      [...queries, Query.limit(limit), Query.offset(offset)]
    );

    allDocuments.push(...response.documents);
    
    if (response.documents.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
    }
  }

  return allDocuments;
}

async function migrateJobTeamIds() {
  console.log('🔄 Starting job teamId migration...\n');
  
  const stats = {
    totalJobs: 0,
    updated: 0,
    skipped: 0,
    warnings: [] as string[]
  };

  try {
    // Step 1: Build mapping of appwriteTeamId → team.$id
    console.log('📊 Step 1: Building team ID mapping...');
    const teams = await paginatedList('teams');
    const teamIdMap = new Map<string, string>();
    
    for (const team of teams) {
      if (team.appwriteTeamId) {
        teamIdMap.set(team.appwriteTeamId, team.$id);
        console.log(`   ${team.appwriteTeamId} → ${team.$id} (${team.teamName})`);
      }
    }
    
    console.log(`\n✅ Built mapping with ${teamIdMap.size} teams\n`);

    // Step 2: Get all jobs
    console.log('📊 Step 2: Fetching all jobs...');
    const jobs = await paginatedList('jobchat');
    stats.totalJobs = jobs.length;
    console.log(`✅ Found ${jobs.length} jobs\n`);

    // Step 3: Process each job
    console.log('📊 Step 3: Processing jobs...');
    for (const job of jobs) {
      const oldTeamId = job.teamId;
      
      if (!oldTeamId) {
        stats.warnings.push(`Job ${job.$id} (${job.title}) has no teamId`);
        stats.skipped++;
        continue;
      }

      // Check if this teamId needs migration
      if (teamIdMap.has(oldTeamId)) {
        const newTeamId = teamIdMap.get(oldTeamId);
        
        // Update the job
        await db.updateDocument(
          DATABASE_ID,
          'jobchat',
          job.$id,
          { teamId: newTeamId }
        );
        
        console.log(`   ✅ Updated job ${job.$id}: ${oldTeamId} → ${newTeamId}`);
        stats.updated++;
      } else {
        // Check if the teamId is already a valid DB team ID
        const isValidDbTeamId = teams.some((t: any) => t.$id === oldTeamId);
        
        if (isValidDbTeamId) {
          console.log(`   ⏭️  Job ${job.$id} already has correct teamId: ${oldTeamId}`);
          stats.skipped++;
        } else {
          stats.warnings.push(`Job ${job.$id} (${job.title}) has unknown teamId: ${oldTeamId}`);
          stats.skipped++;
        }
      }
    }

    // Step 4: Report results
    console.log('\n=== MIGRATION REPORT ===');
    console.log(`Total jobs processed: ${stats.totalJobs}`);
    console.log(`Updated: ${stats.updated}`);
    console.log(`Skipped: ${stats.skipped}`);
    
    if (stats.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${stats.warnings.length}):`);
      stats.warnings.forEach(w => console.log(`   - ${w}`));
    }
    
    console.log('\n✅ Migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

migrateJobTeamIds().catch(console.error);
