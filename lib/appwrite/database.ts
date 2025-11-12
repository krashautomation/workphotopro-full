import { databases } from './client';
import { ID, Query } from 'react-native-appwrite';
import { TagTemplate, JobTagAssignment, JobChatWithTags, UserPreferences, ResolutionPreference, TimestampPreference } from '@/utils/types';

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '';

// Simple database service for basic CRUD operations
export const databaseService = {
  /**
   * Create a new document in a collection
   */
  async createDocument(collectionId: string, data: any, documentId?: string) {
    try {
      return await databases.createDocument(
        DATABASE_ID,
        collectionId,
        documentId || ID.unique(),
        data
      );
    } catch (error) {
      console.error('Create document error:', error);
      throw error;
    }
  },

  /**
   * Get a document by ID
   */
  async getDocument(collectionId: string, documentId: string) {
    try {
      return await databases.getDocument(DATABASE_ID, collectionId, documentId);
    } catch (error) {
      console.error('Get document error:', error);
      throw error;
    }
  },

  /**
   * List documents with optional queries
   */
  async listDocuments(collectionId: string, queries: string[] = []) {
    try {
      return await databases.listDocuments(DATABASE_ID, collectionId, queries);
    } catch (error: any) {
      // Check if this is a "collection not found" error (expected for optional collections)
      const isCollectionNotFound = 
        error?.message?.includes('Collection with the requested ID could not be found') ||
        error?.code === 404 ||
        error?.type === 'general_not_found';
      
      // For "users" collection specifically, log at debug level since it's optional
      // For other collections, still log as error but less verbosely
      if (isCollectionNotFound && collectionId === 'users') {
        // Users collection is optional - only log at debug level
        console.debug(`Collection "${collectionId}" not found (expected)`);
      } else if (isCollectionNotFound) {
        // Other collections not found - log as warning
        console.warn(`Collection "${collectionId}" not found:`, error?.message || error);
      } else {
        // Other errors - log as error
        console.error('List documents error:', error);
      }
      throw error;
    }
  },

  /**
   * Update a document
   */
  async updateDocument(collectionId: string, documentId: string, data: any) {
    try {
      return await databases.updateDocument(
        DATABASE_ID,
        collectionId,
        documentId,
        data
      );
    } catch (error) {
      console.error('Update document error:', error);
      throw error;
    }
  },

  /**
   * Delete a document
   */
  async deleteDocument(collectionId: string, documentId: string) {
    try {
      return await databases.deleteDocument(DATABASE_ID, collectionId, documentId);
    } catch (error) {
      console.error('Delete document error:', error);
      throw error;
    }
  },
};

// Multi-tenant JobChat service
export const jobChatService = {
  COLLECTION_ID: 'jobchat', // Collection name in Appwrite

  async createJobChat(data: any, teamId: string, orgId: string) {
    const jobData = {
      ...data,
      teamId,
      orgId,
      status: 'active',
      createdBy: data.createdBy || data.userId,
      createdByName: data.createdByName || data.userName,
    };
    return databaseService.createDocument(this.COLLECTION_ID, jobData);
  },

  async getJobChat(jobChatId: string) {
    return databaseService.getDocument(this.COLLECTION_ID, jobChatId);
  },

  async listJobChats(teamId?: string, orgId?: string) {
    const queries = [
      Query.limit(100),
      Query.orderDesc('$createdAt') // Order by creation date to get latest jobs first
    ];

    // Filter by team if provided
    if (teamId) {
      queries.push(Query.equal('teamId', teamId));
    }

    // Filter by organization if provided
    if (orgId) {
      queries.push(Query.equal('orgId', orgId));
    }

    const response = await databaseService.listDocuments(this.COLLECTION_ID, queries);
    
    console.log('🔍 Database Service: Raw jobs response:', response.documents.length, 'jobs');
    
    // Filter out soft-deleted jobs in the application
    const activeJobs = response.documents.filter((job: any) => 
      !job.deletedAt || job.deletedAt === null
    );
    
    console.log('🔍 Database Service: Active jobs after filtering:', activeJobs.length, 'jobs');
    
    return {
      ...response,
      documents: activeJobs,
      total: activeJobs.length
    };
  },

  async updateJobChat(jobChatId: string, data: any) {
    return databaseService.updateDocument(this.COLLECTION_ID, jobChatId, data);
  },

  async deleteJobChat(jobChatId: string) {
    return databaseService.deleteDocument(this.COLLECTION_ID, jobChatId);
  },

  async restoreJobChat(jobChatId: string) {
    // Restore a soft-deleted job by removing the deletedAt field
    return databaseService.updateDocument(this.COLLECTION_ID, jobChatId, {
      deletedAt: null,
    });
  },

  async listDeletedJobChats() {
    // Get all jobs and filter for soft-deleted ones in the application
    const response = await databaseService.listDocuments(this.COLLECTION_ID, [
      Query.limit(100)
    ]);
    
    // Filter for soft-deleted jobs only
    const deletedJobs = response.documents.filter((job: any) => 
      job.deletedAt && job.deletedAt !== null
    );
    
    return {
      ...response,
      documents: deletedJobs,
      total: deletedJobs.length
    };
  },

  async listJobChatsByStatus(status: string, teamId?: string, orgId?: string) {
    const queries = [
      Query.equal('status', status),
      Query.limit(100),
      Query.orderDesc('$createdAt')
    ];

    // Filter by team if provided
    if (teamId) {
      queries.push(Query.equal('teamId', teamId));
    }

    // Filter by organization if provided
    if (orgId) {
      queries.push(Query.equal('orgId', orgId));
    }

    const response = await databaseService.listDocuments(this.COLLECTION_ID, queries);
    
    // Filter out soft-deleted jobs in the application
    const activeJobs = response.documents.filter((job: any) => 
      !job.deletedAt || job.deletedAt === null
    );
    
    return {
      ...response,
      documents: activeJobs,
      total: activeJobs.length
    };
  },
};

// Multi-tenant Message service
export const messageService = {
  COLLECTION_ID: 'messages',

  async createMessage(data: any, teamId: string, orgId: string) {
    const messageData = {
      ...data,
      // Keep existing senderId field - no need to add userId
      teamId,
      orgId,
    };
    return databaseService.createDocument(this.COLLECTION_ID, messageData);
  },

  async getMessage(messageId: string) {
    return databaseService.getDocument(this.COLLECTION_ID, messageId);
  },

  async listMessages(jobId: string, teamId?: string, orgId?: string) {
    const queries = [
      Query.equal('jobId', jobId),
      Query.orderAsc('$createdAt'),
      Query.limit(100)
    ];

    // Add team and org filters if provided
    if (teamId) {
      queries.push(Query.equal('teamId', teamId));
    }
    if (orgId) {
      queries.push(Query.equal('orgId', orgId));
    }

    return databaseService.listDocuments(this.COLLECTION_ID, queries);
  },

  async updateMessage(messageId: string, data: any) {
    return databaseService.updateDocument(this.COLLECTION_ID, messageId, data);
  },

  async deleteMessage(messageId: string) {
    return databaseService.deleteDocument(this.COLLECTION_ID, messageId);
  },
};

// Tag management services
export const tagService = {
  /**
   * Get all active tag templates
   */
  async getActiveTagTemplates() {
    try {
      return await databases.listDocuments(
        DATABASE_ID,
        'tag_templates',
        [
          Query.equal('isActive', true),
          Query.orderAsc('sortOrder')
        ]
      );
    } catch (error) {
      console.error('Get active tag templates error:', error);
      throw error;
    }
  },

  /**
   * Create a new tag template
   */
  async createTagTemplate(data: Omit<TagTemplate, '$id' | '$createdAt' | '$updatedAt'>) {
    try {
      return await databases.createDocument(
        DATABASE_ID,
        'tag_templates',
        ID.unique(),
        data
      );
    } catch (error) {
      console.error('Create tag template error:', error);
      throw error;
    }
  },

  /**
   * Update a tag template
   */
  async updateTagTemplate(templateId: string, data: Partial<TagTemplate>) {
    try {
      return await databases.updateDocument(
        DATABASE_ID,
        'tag_templates',
        templateId,
        data
      );
    } catch (error) {
      console.error('Update tag template error:', error);
      throw error;
    }
  },

  /**
   * Delete a tag template (soft delete by setting isActive to false)
   */
  async deleteTagTemplate(templateId: string) {
    try {
      return await databases.updateDocument(
        DATABASE_ID,
        'tag_templates',
        templateId,
        {
          isActive: false,
        }
      );
    } catch (error) {
      console.error('Delete tag template error:', error);
      throw error;
    }
  },

  /**
   * Get tag assignments for a specific job
   */
  async getJobTagAssignments(jobId: string) {
    try {
      console.log('🔍 TagService: Getting job tag assignments for jobId:', jobId, 'type:', typeof jobId);
      console.log('🔍 TagService: Database ID:', DATABASE_ID);
      console.log('🔍 TagService: Collection: job_tag_assignments');
      
      return await databases.listDocuments(
        DATABASE_ID,
        'job_tag_assignments',
        [Query.equal('jobId', jobId)]
      );
    } catch (error) {
      console.error('🔍 TagService: Get job tag assignments error:', error);
      throw error;
    }
  },

  /**
   * Assign a tag to a job
   */
  async assignTagToJob(jobId: string, tagTemplateId: string, assignedBy: string) {
    try {
      // Check if tag is already assigned
      const existingAssignments = await databases.listDocuments(
        DATABASE_ID,
        'job_tag_assignments',
        [
          Query.equal('jobId', jobId),
          Query.equal('tagTemplateId', tagTemplateId)
        ]
      );

      if (existingAssignments.documents.length > 0) {
        throw new Error('Tag is already assigned to this job');
      }

      return await databases.createDocument(
        DATABASE_ID,
        'job_tag_assignments',
        ID.unique(),
        {
          jobId,
          tagTemplateId,
          assignedBy,
          assignedAt: new Date().toISOString(),
          isActive: true,
        }
      );
    } catch (error) {
      console.error('Assign tag to job error:', error);
      throw error;
    }
  },

  /**
   * Remove a tag assignment from a job
   */
  async removeTagFromJob(jobId: string, tagTemplateId: string) {
    try {
      // Find the assignment
      const assignments = await databases.listDocuments(
        DATABASE_ID,
        'job_tag_assignments',
        [
          Query.equal('jobId', jobId),
          Query.equal('tagTemplateId', tagTemplateId)
        ]
      );

      if (assignments.documents.length === 0) {
        throw new Error('Tag assignment not found');
      }

      return await databases.deleteDocument(
        DATABASE_ID,
        'job_tag_assignments',
        assignments.documents[0].$id
      );
    } catch (error) {
      console.error('Remove tag from job error:', error);
      throw error;
    }
  },

  /**
   * Get job with all assigned tags and their templates
   */
  async getJobWithTags(jobId: string): Promise<JobChatWithTags | null> {
    try {
      // Get the job
      const job = await databases.getDocument(DATABASE_ID, 'jobchat', jobId) as any;
      
      // Get tag assignments for this job
      const assignments = await this.getJobTagAssignments(jobId);
      
      // Get tag templates for the assignments
      const tagTemplateIds = assignments.documents.map((assignment: any) => assignment.tagTemplateId);
      const tagTemplates = tagTemplateIds.length > 0 
        ? await databases.listDocuments(
            DATABASE_ID,
            'tag_templates',
            [Query.equal('$id', tagTemplateIds)]
          )
        : { documents: [] };

      return {
        ...job,
        assignedTags: assignments.documents,
        tagTemplates: tagTemplates.documents,
      } as JobChatWithTags;
    } catch (error) {
      console.error('Get job with tags error:', error);
      throw error;
    }
  },

  /**
   * Initialize default tag templates (Yellow, Blue, Red)
   */
  async initializeDefaultTags(createdBy: string) {
    try {
      // First, check if default tags already exist
      const existingTags = await this.getActiveTagTemplates();
      const existingNames = existingTags.documents.map(tag => tag.name.toLowerCase());
      
      const defaultTags = [
        {
          name: 'High priority',
          color: '#FFD700', // Yellow
          icon: 'circle',
          description: 'High priority tag',
          isActive: true,
          sortOrder: 1,
          createdBy,
        },
        {
          name: 'Awaiting info',
          color: '#9ACD32', // Yellow-green
          icon: 'circle',
          description: 'Awaiting info tag',
          isActive: true,
          sortOrder: 2,
          createdBy,
        },
        {
          name: 'Client facing',
          color: '#22C55E', // Green
          icon: 'circle',
          description: 'Client facing tag',
          isActive: true,
          sortOrder: 3,
          createdBy,
        },
      ];

      const results = [];
      for (const tag of defaultTags) {
        // Only create if it doesn't already exist
        if (!existingNames.includes(tag.name.toLowerCase())) {
          try {
            const result = await this.createTagTemplate(tag);
            results.push(result);
            console.log(`Created default tag: ${tag.name}`);
          } catch (error) {
            console.warn('Error creating default tag:', tag.name, error);
          }
        } else {
          console.log(`Default tag already exists: ${tag.name}`);
        }
      }

      return results;
    } catch (error) {
      console.error('Initialize default tags error:', error);
      throw error;
    }
  },
};

// User preferences service for watermark and timestamp settings
export const userPreferencesService = {
  COLLECTION_ID: 'user_preferences',

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        this.COLLECTION_ID,
        [Query.equal('userId', userId)]
      );

      if (result.documents.length > 0) {
        const prefs = result.documents[0] as any as UserPreferences;
        const hdPreferences = parseHdPreferences(prefs.hdPreferencesRaw);
        const timestampPreferences = parseTimestampPreferences((prefs as any).timestampPreferences);
        return {
          ...prefs,
          hdPreferences,
          timestampPreferences,
        };
      }

      // Return default preferences if none exist
      return {
        userId,
        watermarkEnabled: true,
        timestampEnabled: true,
        timestampFormat: 'short',
        hdPreferences: {},
        timestampPreferences: {},
      };
    } catch (error: any) {
      console.warn('Collection not found or not accessible. Returning default preferences.', error.message);
      // Return defaults on error (collection doesn't exist yet)
      return {
        userId,
        watermarkEnabled: true,
        timestampEnabled: true,
        timestampFormat: 'short',
        hdPreferences: {},
        timestampPreferences: {},
      };
    }
  },

  async createUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences | null> {
    try {
      const defaultPreferences: Omit<UserPreferences, '$id' | '$createdAt' | '$updatedAt'> = {
        userId,
        watermarkEnabled: true,
        timestampEnabled: true,
        timestampFormat: 'short',
        hdPreferencesRaw: '{}',
        timestampPreferences: {},
      };

      const userPreferences = {
        ...defaultPreferences,
        ...preferences,
      };

      return await databaseService.createDocument(this.COLLECTION_ID, serializePreferences(userPreferences)) as any;
    } catch (error: any) {
      console.warn('Cannot create user preferences. Collection may not exist.', error.message);
      // Return null or defaults if collection doesn't exist
      return {
        userId,
        watermarkEnabled: true,
        timestampEnabled: true,
        timestampFormat: 'short',
        hdPreferences: {},
        timestampPreferences: {},
      };
    }
  },

  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences | null> {
    try {
      const existing = await this.getUserPreferences(userId);
      
      if (existing && existing.$id) {
        return await databaseService.updateDocument(
          this.COLLECTION_ID,
          existing.$id,
          serializePreferences(preferences)
        ) as any as UserPreferences;
      } else {
        return await this.createUserPreferences(userId, preferences);
      }
    } catch (error: any) {
      console.warn('Cannot update user preferences.', error.message);
      // Return defaults on error
      return {
        userId,
        watermarkEnabled: true,
        timestampEnabled: true,
        timestampFormat: 'short',
        hdPreferences: {},
        timestampPreferences: {},
      };
    }
  },
};

function parseHdPreferences(raw?: string | Record<string, ResolutionPreference> | null | undefined) {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, ResolutionPreference>;
      }
    } catch (error) {
      console.warn('Failed to parse hdPreferencesRaw:', error);
    }
    return {};
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, ResolutionPreference>;
  }
  return {};
}

function parseTimestampPreferences(
  raw?: string | Record<string, TimestampPreference> | null | undefined
) {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, TimestampPreference>;
      }
    } catch (error) {
      console.warn('Failed to parse timestampPreferences:', error);
    }
    return {};
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, TimestampPreference>;
  }
  return {};
}

function serializePreferences(preferences: Partial<UserPreferences>) {
  const serialized = { ...preferences } as any;
  if (preferences.hdPreferences) {
    serialized.hdPreferencesRaw = JSON.stringify(preferences.hdPreferences);
    delete serialized.hdPreferences;
  }
  if (preferences.timestampPreferences) {
    serialized.timestampPreferences = JSON.stringify(preferences.timestampPreferences);
  }
  return serialized;
}