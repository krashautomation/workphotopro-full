/**
 * Paginated List Helper
 * 
 * Appwrite returns a maximum of 100 documents per request.
 * Any script that does not paginate will silently miss records.
 * 
 * Use this helper in EVERY migration loop.
 * 
 * @example
 * ```typescript
 * // Instead of:
 * const result = await databases.listDocuments('memberships'); // Only gets 25-100!
 * 
 * // Use:
 * const allMemberships = await paginatedList('memberships'); // Gets ALL records
 * ```
 */

import { Query } from 'react-native-appwrite';
import { databases } from '../lib/appwrite/client';

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '';

/**
 * Fetch all documents from a collection with automatic pagination
 * 
 * @param collectionId - The collection to query
 * @param queries - Additional query filters (optional)
 * @param batchSize - Number of documents per request (max 100, default 100)
 * @returns Array of all documents
 */
export async function paginatedList(
  collectionId: string,
  queries: string[] = [],
  batchSize: number = 100
): Promise<any[]> {
  // Ensure batch size doesn't exceed Appwrite's limit
  const limit = Math.min(batchSize, 100);
  
  const all: any[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const result = await databases.listDocuments(DATABASE_ID, collectionId, [
      ...queries,
      Query.limit(limit),
      Query.offset(offset)
    ]);

    all.push(...result.documents);
    offset += result.documents.length;
    hasMore = result.documents.length === limit;
    
    // Safety check - prevent infinite loops
    if (offset > 100000) {
      console.warn(`Pagination safety limit reached for ${collectionId}. Stopping at ${offset} records.`);
      break;
    }
  }

  return all;
}

/**
 * Paginated list with progress callback for long-running operations
 * 
 * @param collectionId - The collection to query
 * @param queries - Additional query filters (optional)
 * @param onProgress - Callback fired after each batch (batchCount, totalCount)
 * @param batchSize - Number of documents per request
 * @returns Array of all documents
 */
export async function paginatedListWithProgress(
  collectionId: string,
  queries: string[] = [],
  onProgress: (batchCount: number, totalCount: number) => void,
  batchSize: number = 100
): Promise<any[]> {
  const limit = Math.min(batchSize, 100);
  
  const all: any[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const result = await databases.listDocuments(DATABASE_ID, collectionId, [
      ...queries,
      Query.limit(limit),
      Query.offset(offset)
    ]);

    all.push(...result.documents);
    offset += result.documents.length;
    hasMore = result.documents.length === limit;
    
    onProgress(result.documents.length, all.length);
    
    if (offset > 100000) {
      console.warn(`Pagination safety limit reached for ${collectionId}.`);
      break;
    }
  }

  return all;
}

export default paginatedList;
