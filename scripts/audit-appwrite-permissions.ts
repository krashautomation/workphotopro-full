import { Client, Databases, Permission, Role } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

const ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY || process.env.EXPO_PUBLIC_APPWRITE_API_KEY;
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;

const COLLECTIONS = [
  'teams',
  'memberships', 
  'jobchat',
  'messages',
  'invitations',
  'organizations'
];

interface CollectionPermission {
  collectionId: string;
  name: string;
  documentSecurity: boolean;
  permissions: {
    read: string[];
    create: string[];
    update: string[];
    delete: string[];
  };
  hasGuestAccess: boolean;
  hasUnauthenticatedAccess: boolean;
}

async function auditPermissions(): Promise<void> {
  console.log('🔍 Starting Appwrite Permissions Audit...\n');
  
  if (!ENDPOINT || !PROJECT_ID || !API_KEY || !DATABASE_ID) {
    console.error('❌ Missing required environment variables:');
    console.error('  - EXPO_PUBLIC_APPWRITE_ENDPOINT');
    console.error('  - EXPO_PUBLIC_APPWRITE_PROJECT_ID');
    console.error('  - EXPO_PUBLIC_APPWRITE_API_KEY');
    console.error('  - EXPO_PUBLIC_APPWRITE_DATABASE_ID');
    process.exit(1);
  }

  const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

  const databases = new Databases(client);
  const results: CollectionPermission[] = [];

  for (const collectionId of COLLECTIONS) {
    try {
      console.log(`📋 Auditing collection: ${collectionId}...`);
      
      const collection = await databases.getCollection(DATABASE_ID, collectionId);
      
      const permissions = collection.$permissions || [];
      
      // Parse permissions
      const parsedPerms = {
        read: permissions.filter((p: string) => p.startsWith('read(')).map((p: string) => {
          const match = p.match(/read\(([^)]+)\)/);
          return match ? match[1] : p;
        }),
        create: permissions.filter((p: string) => p.startsWith('create(')).map((p: string) => {
          const match = p.match(/create\(([^)]+)\)/);
          return match ? match[1] : p;
        }),
        update: permissions.filter((p: string) => p.startsWith('update(')).map((p: string) => {
          const match = p.match(/update\(([^)]+)\)/);
          return match ? match[1] : p;
        }),
        delete: permissions.filter((p: string) => p.startsWith('delete(')).map((p: string) => {
          const match = p.match(/delete\(([^)]+)\)/);
          return match ? match[1] : p;
        })
      };

      // Check for guest/unauthenticated access
      const allPerms = [...parsedPerms.read, ...parsedPerms.create, ...parsedPerms.update, ...parsedPerms.delete];
      const hasGuestAccess = allPerms.some(p => p.includes('guests') || p.includes('any'));
      const hasUnauthenticatedAccess = allPerms.some(p => p === 'any' || p.includes('unauthenticated'));

      const result: CollectionPermission = {
        collectionId: collection.$id,
        name: collection.name,
        documentSecurity: collection.documentSecurity || false,
        permissions: parsedPerms,
        hasGuestAccess,
        hasUnauthenticatedAccess
      };

      results.push(result);
      
      console.log(`  ✅ Collection ID: ${result.collectionId}`);
      console.log(`  📛 Name: ${result.name}`);
      console.log(`  🔒 Document Security: ${result.documentSecurity}`);
      console.log(`  👥 Guest Access: ${result.hasGuestAccess ? 'YES ⚠️' : 'No'}`);
      console.log(`  🔓 Unauthenticated: ${result.hasUnauthenticatedAccess ? 'YES ⚠️' : 'No'}`);
      console.log('');

    } catch (error: any) {
      console.error(`  ❌ Error auditing ${collectionId}:`, error.message);
      results.push({
        collectionId,
        name: 'ERROR',
        documentSecurity: false,
        permissions: { read: [], create: [], update: [], delete: [] },
        hasGuestAccess: false,
        hasUnauthenticatedAccess: false
      });
    }
  }

  // Generate markdown report
  const report = generateMarkdownReport(results);
  
  // Ensure directory exists
  const reportDir = path.join(process.cwd(), 'docs', 'features');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  // Write report
  const reportPath = path.join(reportDir, 'APPWRITE_PERMISSIONS_AUDIT.md');
  fs.writeFileSync(reportPath, report);
  
  console.log(`\n✅ Report saved to: ${reportPath}`);
  console.log('\n📊 Summary:');
  
  const guestAccessCollections = results.filter(r => r.hasGuestAccess);
  const unauthAccessCollections = results.filter(r => r.hasUnauthenticatedAccess);
  
  if (guestAccessCollections.length > 0) {
    console.log(`  ⚠️  Collections with guest access: ${guestAccessCollections.map(r => r.collectionId).join(', ')}`);
  } else {
    console.log('  ✅ No collections have guest access');
  }
  
  if (unauthAccessCollections.length > 0) {
    console.log(`  ⚠️  Collections with unauthenticated access: ${unauthAccessCollections.map(r => r.collectionId).join(', ')}`);
  } else {
    console.log('  ✅ No collections have unauthenticated access');
  }
}

function generateMarkdownReport(results: CollectionPermission[]): string {
  const timestamp = new Date().toISOString();
  
  let markdown = `# Appwrite Collection Permissions Audit

**Date:** ${timestamp}
**Database ID:** ${DATABASE_ID}

## Summary

| Collection | Document Security | Guest Access | Unauthenticated |
|------------|------------------|--------------|-----------------|
`;

  for (const result of results) {
    const guestBadge = result.hasGuestAccess ? '⚠️ YES' : '✅ No';
    const unauthBadge = result.hasUnauthenticatedAccess ? '⚠️ YES' : '✅ No';
    markdown += `| ${result.collectionId} | ${result.documentSecurity ? '✅ Enabled' : '❌ Disabled'} | ${guestBadge} | ${unauthBadge} |\n`;
  }

  markdown += `\n## Detailed Permissions\n\n`;

  for (const result of results) {
    markdown += `### ${result.collectionId}\n\n`;
    markdown += `- **Name:** ${result.name}\n`;
    markdown += `- **Collection ID:** ${result.collectionId}\n`;
    markdown += `- **Document Security:** ${result.documentSecurity ? '✅ Enabled' : '❌ Disabled'}\n`;
    markdown += `- **Guest Access:** ${result.hasGuestAccess ? '⚠️ YES' : '✅ No'}\n`;
    markdown += `- **Unauthenticated Access:** ${result.hasUnauthenticatedAccess ? '⚠️ YES' : '✅ No'}\n\n`;
    
    markdown += `**Permissions:**\n\n`;
    markdown += `- **Read:** ${result.permissions.read.length > 0 ? result.permissions.read.map(p => `\`${p}\``).join(', ') : '*None*'}\n`;
    markdown += `- **Create:** ${result.permissions.create.length > 0 ? result.permissions.create.map(p => `\`${p}\``).join(', ') : '*None*'}\n`;
    markdown += `- **Update:** ${result.permissions.update.length > 0 ? result.permissions.update.map(p => `\`${p}\``).join(', ') : '*None*'}\n`;
    markdown += `- **Delete:** ${result.permissions.delete.length > 0 ? result.permissions.delete.map(p => `\`${p}\``).join(', ') : '*None*'}\n\n`;
    
    markdown += `---\n\n`;
  }

  markdown += `## Security Recommendations\n\n`;
  
  const problematic = results.filter(r => r.hasGuestAccess || r.hasUnauthenticatedAccess);
  
  if (problematic.length > 0) {
    markdown += `⚠️ **Attention Required:** The following collections have guest or unauthenticated access:\n\n`;
    for (const result of problematic) {
      markdown += `- \`${result.collectionId}\`: ${result.hasGuestAccess ? 'Guest access enabled' : ''}${result.hasUnauthenticatedAccess ? 'Unauthenticated access enabled' : ''}\n`;
    }
    markdown += `\nConsider reviewing these permissions to ensure they align with your security requirements.\n`;
  } else {
    markdown += `✅ **All collections are properly secured.** No guest or unauthenticated access detected.\n`;
  }

  markdown += `\n---\n*Generated by scripts/audit-appwrite-permissions.ts*\n`;

  return markdown;
}

// Run the audit
auditPermissions().catch(console.error);
