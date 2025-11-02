# 🔄 Database & Permissions Refactoring Plan

**Goal**: Refactor from duplicate storage model to native Appwrite Auth Users, Teams, and Permissions while adding a Contacts table to preserve relationships when teams are hard-deleted.

---

## 📊 Current State Analysis

### 🔴 Duplication & Redundancy Issues

1. **Teams Duplication**
   - **Appwrite Auth Teams** (native) - stores team name, roles
   - **Database `teams` collection** - stores duplicate team data (teamName, orgId, description, etc.)
   - **Problem**: Data sync issues, redundant storage, confusion about source of truth

2. **Memberships Duplication**
   - **Appwrite Team Memberships** (native) - stores userId, teamId, roles, confirm status
   - **Database `memberships` collection** - stores duplicate membership data (userId, teamId, role, userEmail, userName, profilePicture)
   - **Problem**: Data inconsistency, complex sync logic, maintenance burden

3. **Users Duplication**
   - **Appwrite Auth Users** (native) - stores user data automatically
   - **Database `users` collection** (optional/legacy) - may store duplicate user info
   - **Problem**: Unclear which source to use, potential inconsistencies

4. **Organizations Collection**
   - **Database `organizations` collection** - may be redundant if Appwrite Teams can represent projects/workspaces
   - **Current**: Organizations link to Teams, but Teams also exist independently
   - **Question**: Do we need both, or can Teams represent both organizations and projects?

5. **Permissions Redundancy**
   - **Current**: Simple `users` permission (all authenticated users)
   - **Available**: Appwrite native Team-based permissions, Role-based permissions, Label-based permissions
   - **Problem**: Not leveraging Appwrite's powerful permission system

---

## 🎯 Target Architecture

### Core Principles

1. **Single Source of Truth**
   - Use Appwrite Auth Users for all user data
   - Use Appwrite Teams as primary team storage
   - Use Appwrite Team Memberships for team membership
   - Database collections only for app-specific data (jobchat, messages, tags, etc.)

2. **Native Permissions**
   - Use Appwrite Team permissions for team-level access
   - Use Appwrite Roles for role-based access within teams
   - Use Appwrite Labels for global user privileges (e.g., "Premium User")
   - Control access at Job Chat level using Team + Role permissions

3. **Relationships Preservation**
   - Create `contacts` table to preserve user relationships
   - When user is invited to team → also add to contacts
   - When team is deleted → contacts remain for future projects

---

## 🚧 Key Challenges

### 1. **Appwrite Teams Hard Delete Limitation**
- **Issue**: Appwrite Teams can only be hard-deleted, not soft-deleted
- **Impact**: When team is deleted, all memberships are lost
- **Solution**: 
  - Before deleting team, extract all memberships and add to `contacts` table
  - Use `contacts` table to preserve relationships for future projects
  - Can't use Appwrite's `users.list()` for contacts (client SDK limitation)

### 2. **Data Migration Complexity**
- **Issue**: Need to migrate existing data from database collections to Appwrite native features
- **Challenges**:
  - Existing teams in database may not match Appwrite Teams
  - Existing memberships may be out of sync
  - Need to merge duplicate data
- **Solution**: 
  - Phase migration (don't break existing functionality)
  - Create migration scripts to sync data
  - Validate data integrity at each step

### 3. **Permission Model Understanding**
- **Issue**: Need to fully understand Appwrite's permission system
- **Questions to Answer**:
  - How do Team permissions work at collection level?
  - How do Roles within teams affect permissions?
  - How do Labels work for global privileges?
  - How to grant Job Chat access based on roles/labels?
- **Solution**: 
  - Research Appwrite permission documentation
  - Create permission matrix before implementation
  - Test permission scenarios in development

### 4. **Code Refactoring Scope**
- **Issue**: Large codebase that references both Appwrite Teams and database collections
- **Impact**: 
  - Multiple files need updates
  - Risk of breaking existing features
  - Need comprehensive testing
- **Solution**: 
  - Refactor incrementally
  - Maintain backward compatibility during transition
  - Create abstraction layer if needed

### 5. **Contacts Table Design**
- **Issue**: Need to preserve relationships without duplicating Appwrite functionality
- **Questions**:
  - What data to store in contacts? (userId, email, name, relationship metadata)
  - How to handle contacts who haven't accepted invitations?
  - Should contacts be organization-scoped or global?
- **Solution**: 
  - Store minimal necessary data (userId, email, name, lastInteraction)
  - Organization-scoped contacts (each org has its own contacts)
  - Track invitation status if needed

---

## 📋 Refactoring Steps

### Phase 1: Research & Planning (No Code Changes)

**Duration**: 1-2 days

1. **Research Appwrite Permissions**
   - Study Team-based permissions
   - Understand Role system within teams
   - Understand Label system for global privileges
   - Document permission patterns

2. **Create Permission Matrix**
   - Define who can do what at each level
   - Map current permissions to new model
   - Plan Job Chat access control

3. **Design Contacts Table**
   - Define schema (fields, indexes, relationships)
   - Define when contacts are created/updated
   - Define how contacts are used

4. **Audit Current Code**
   - List all files using teams/memberships
   - Document current data flow
   - Identify dependencies

5. **Migration Strategy**
   - Plan data migration approach
   - Identify what can be migrated vs. what needs manual cleanup
   - Plan rollback strategy

---

### Phase 2: Contacts Table Implementation

**Duration**: 1-2 days

1. **Create Contacts Collection**
   - Define schema in Appwrite Console
   - Set up indexes (userId, orgId, etc.)
   - Configure permissions (team-based or users)

2. **Implement Contacts Service**
   - Create `contactService` in `lib/appwrite/database.ts`
   - Functions: `createContact`, `listContacts`, `getContact`, `updateContact`
   - Integration with team invitation flow

3. **Integrate with Team Invitation**
   - Modify `teamService.createMembership()` to also create contact
   - Ensure contact is created when user accepts invitation
   - Handle edge cases (user already in contacts, etc.)

4. **Create Migration Script**
   - Extract existing memberships from database
   - Create contacts from existing relationships
   - Preserve historical data if needed

5. **Test Contacts Functionality**
   - Test contact creation
   - Test contact listing
   - Test team deletion → contacts preserved
   - Test re-inviting from contacts

---

### Phase 3: Permission System Refactoring

**Duration**: 3-5 days

1. **Set Up Team Permissions**
   - Configure collection permissions to use Team IDs
   - Test team-based access control
   - Update permission documentation

2. **Implement Role-Based Access**
   - Define roles in Appwrite Teams (owner, admin, member, etc.)
   - Set up role-based permissions for collections
   - Test role hierarchy and access levels

3. **Implement Label-Based Privileges**
   - Create labels in Appwrite (e.g., "Premium User")
   - Set up label-based permissions for collections
   - Test label assignment and access control

4. **Job Chat Access Control**
   - Design Job Chat permission model
   - Implement role/label-based filtering
   - Test Job Chat visibility based on permissions

5. **Update Code References**
   - Update all permission checks to use new system
   - Remove old permission logic
   - Update UI to respect new permissions

---

### Phase 4: Database Cleanup

**Duration**: 2-3 days

1. **Migrate Teams Data**
   - Identify data in `teams` collection that should stay (app-specific metadata)
   - Remove redundant team data (name, etc. - already in Appwrite Teams)
   - Update code to use Appwrite Teams as source of truth
   - Keep only app-specific fields in database (if needed)

2. **Migrate Memberships Data**
   - Identify necessary membership data (roles already in Appwrite)
   - Keep only app-specific metadata in database
   - Update code to use Appwrite Memberships as source of truth
   - Remove duplicate membership queries

3. **Clean Up Organizations**
   - Decide: Keep organizations collection or use Teams only?
   - If keeping: Simplify to only app-specific data
   - If removing: Migrate data to Teams metadata

4. **Remove Optional Users Collection**
   - If `users` collection exists but is optional/legacy
   - Migrate any necessary data to Appwrite Users preferences
   - Remove collection or mark as deprecated

5. **Update Service Layer**
   - Refactor `teamService` to primarily use Appwrite Teams
   - Refactor `organizationService` if still needed
   - Update all queries to use new data sources

---

### Phase 5: Code Refactoring

**Duration**: 3-5 days

1. **Update Type Definitions**
   - Update `utils/types.ts` to reflect new structure
   - Remove duplicate type definitions
   - Add contact types

2. **Refactor Team Service**
   - Simplify `teamService` to use Appwrite Teams directly
   - Remove complex sync logic
   - Use database only for app-specific metadata

3. **Refactor Membership Service**
   - Simplify membership queries
   - Use Appwrite Memberships as primary source
   - Remove duplicate membership data storage

4. **Update Context Providers**
   - Update `OrganizationContext` to use new structure
   - Update `AuthContext` if needed
   - Ensure state management aligns with new architecture

5. **Update UI Components**
   - Update team listing components
   - Update membership display
   - Update permission-based UI visibility

6. **Update Job Chat Logic**
   - Implement permission-based filtering
   - Update Job Chat creation/access logic
   - Test Job Chat visibility rules

---

### Phase 6: Testing & Validation

**Duration**: 2-3 days

1. **Unit Tests**
   - Test all service functions
   - Test permission checks
   - Test contact operations

2. **Integration Tests**
   - Test team creation/invitation flow
   - Test team deletion → contacts preserved
   - Test permission-based access

3. **User Acceptance Testing**
   - Test with small teams
   - Test with large teams
   - Test edge cases (team deletion, permission changes, etc.)

4. **Data Integrity Validation**
   - Verify all data migrated correctly
   - Verify no data loss
   - Verify relationships preserved

5. **Performance Testing**
   - Test query performance
   - Test permission check performance
   - Optimize if needed

---

### Phase 7: Documentation & Cleanup

**Duration**: 1-2 days

1. **Update Documentation**
   - Update architecture documentation
   - Update API documentation
   - Update permission documentation

2. **Code Cleanup**
   - Remove deprecated code
   - Remove unused imports
   - Update comments

3. **Migration Guide**
   - Create guide for migrating existing deployments
   - Document breaking changes
   - Provide migration scripts

---

## 📐 Contacts Table Design

### Schema

```typescript
interface Contact {
  $id: string;
  userId: string; // Appwrite User ID
  orgId: string; // Organization ID (scopes contacts per organization)
  email: string; // User email (for display/invitation)
  name: string; // User name (cached for display)
  profilePicture?: string; // Cached profile picture URL
  relationship: 'team_member' | 'invited' | 'past_member'; // Relationship type
  lastInteraction?: string; // ISO date string
  teamsCount?: number; // Number of teams user was in
  createdBy: string; // User who added this contact
  createdAt: string;
  updatedAt: string;
}
```

### Key Design Decisions

1. **Organization-Scoped**: Contacts are per-organization, not global
   - Reason: Different organizations may have different contact lists
   - Allows for privacy and organization boundaries

2. **Minimal Data**: Store only necessary data
   - userId (for linking to Appwrite Users)
   - email (for display/invitation)
   - name (cached for quick display)
   - relationship metadata

3. **Auto-Population**: Contacts created automatically
   - When user is invited to team → create contact
   - When user accepts invitation → update contact relationship
   - When team is deleted → preserve contact, update relationship

4. **No Duplicate Contacts**: One contact per userId per orgId
   - Use unique index on (userId, orgId)
   - Update existing contact if user is re-invited

---

## 🔐 Permission Model Design

### Permission Levels

1. **Team-Level Permissions**
   - Collections can have Team-based read/write permissions
   - Example: `team:{teamId}` can read/write Job Chats

2. **Role-Based Permissions**
   - Roles within teams: `owner`, `admin`, `member`, `viewer`
   - Collections can require specific roles
   - Example: Only `owner` and `admin` can delete Job Chats

3. **Label-Based Permissions**
   - Global user labels: `premium`, `beta_tester`, etc.
   - Collections can require specific labels
   - Example: Only `premium` users can create unlimited Job Chats

4. **Job Chat Access Control**
   - Job Chats can require specific roles or labels
   - Access is checked at query time
   - Filter Job Chats based on user's roles/labels

### Permission Matrix (Example)

| Resource | Owner | Admin | Member | Viewer |
|----------|-------|-------|--------|--------|
| Create Job Chat | ✅ | ✅ | ✅ | ❌ |
| Read Job Chat | ✅ | ✅ | ✅ | ✅ |
| Update Job Chat | ✅ | ✅ | ❌ | ❌ |
| Delete Job Chat | ✅ | ❌ | ❌ | ❌ |
| Invite Members | ✅ | ✅ | ❌ | ❌ |
| Manage Team | ✅ | ❌ | ❌ | ❌ |

---

## 🚀 Migration Strategy

### Option 1: Big Bang Migration
- **Approach**: Migrate everything at once
- **Pros**: Clean break, no dual systems
- **Cons**: High risk, harder to rollback
- **Use Case**: If you can afford downtime, have comprehensive tests

### Option 2: Gradual Migration (Recommended)
- **Approach**: Migrate incrementally, maintain backward compatibility
- **Pros**: Lower risk, can rollback easily, test as you go
- **Cons**: More complex, temporary dual systems
- **Use Case**: Production system, can't afford downtime

### Migration Order (Gradual Approach)

1. **Add Contacts Table** (doesn't break existing functionality)
2. **Implement New Permission System** (alongside old one)
3. **Migrate New Features** (use new system)
4. **Gradually Migrate Existing Features** (one at a time)
5. **Remove Old System** (once all migrated)

---

## ⚠️ Risks & Mitigations

### Risk 1: Data Loss During Migration
- **Mitigation**: 
  - Back up all data before migration
  - Test migration on staging environment first
  - Have rollback plan ready

### Risk 2: Permission Issues
- **Mitigation**:
  - Thoroughly test permission scenarios
  - Start with permissive permissions, then tighten
  - Monitor error logs during migration

### Risk 3: Breaking Existing Features
- **Mitigation**:
  - Maintain backward compatibility during transition
  - Test each feature after migration
  - Have feature flags to enable/disable new system

### Risk 4: Performance Degradation
- **Mitigation**:
  - Test query performance
  - Add indexes where needed
  - Monitor performance metrics

---

## 📝 Next Steps

1. **Review and Approve Plan** (This document)
2. **Research Appwrite Permissions** (Phase 1)
3. **Create Detailed Permission Matrix** (Phase 1)
4. **Design Contacts Table Schema** (Phase 1)
5. **Begin Implementation** (Phase 2)

---

## ❓ Questions to Resolve

1. **Organizations Collection**: Keep or remove?
   - If keeping: What's its role vs. Teams?
   - If removing: How to represent organization-level data?

2. **Teams Metadata**: What app-specific data needs to be stored?
   - Only in database collection?
   - Or use Teams metadata fields?

3. **Job Chat Permissions**: How granular should access control be?
   - Team-based only?
   - Role-based per Job Chat?
   - Label-based filtering?

4. **Contacts Scope**: Global or organization-scoped?
   - Recommendation: Organization-scoped for privacy
   - But could be global if needed

5. **Migration Timeline**: How aggressive should we be?
   - Recommendation: Gradual migration over 2-3 weeks
   - But can adjust based on priorities

---

**Status**: 📋 Planning Phase - Ready for Discussion

**Last Updated**: [Current Date]

