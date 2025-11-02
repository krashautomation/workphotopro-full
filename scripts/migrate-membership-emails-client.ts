/**
 * Client-side Migration Script: Update membership documents with userEmail
 * 
 * LIMITATIONS:
 * - Can only get email for the CURRENT user (logged in)
 * - Cannot access other users' emails from client SDK
 * - Use this for testing or single-user updates
 * 
 * HOW TO USE:
 * 1. Import this function in your app
 * 2. Call it when user is logged in
 * 3. It will update only the current user's memberships
 */

import { databaseService } from '@/lib/appwrite/database';
import { account } from '@/lib/appwrite/client';
import { Query } from 'react-native-appwrite';

/**
 * Update current user's memberships with their email
 * This only works for the logged-in user
 */
export async function migrateCurrentUserMembershipEmails(): Promise<void> {
  try {
    console.log('🚀 Starting membership email migration for current user...');
    
    // Get current user
    const currentUser = await account.get();
    if (!currentUser || !currentUser.$id || !currentUser.email) {
      throw new Error('No user logged in or user has no email');
    }

    const userEmail = currentUser.email;
    const userId = currentUser.$id;

    console.log(`📋 Current user: ${userEmail} (${userId})`);

    // Get all memberships for this user
    const memberships = await databaseService.listDocuments('memberships', [
      Query.equal('userId', userId),
      Query.limit(100)
    ]);

    console.log(`📋 Found ${memberships.documents.length} membership documents for current user`);

    let updated = 0;
    let skipped = 0;

    // Update each membership
    for (const membership of memberships.documents) {
      try {
        // Skip if email already exists and matches
        if (membership.userEmail === userEmail) {
          console.log(`⏭️  Skipping ${membership.$id} - already has correct email`);
          skipped++;
          continue;
        }

        // Update membership document with email
        await databaseService.updateDocument('memberships', membership.$id, {
          userEmail: userEmail
        });

        console.log(`✅ Updated ${membership.$id} with email: ${userEmail}`);
        updated++;

      } catch (error: any) {
        console.error(`❌ Error updating membership ${membership.$id}:`, error.message);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log('🎉 Migration complete for current user!');

  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

