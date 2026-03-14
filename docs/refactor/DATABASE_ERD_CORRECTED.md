erDiagram
    organizations ||--o{ teams : contains
    organizations ||--o{ subscriptions : has
    organizations ||--o{ revenuecat_events : tracks

    teams ||--o{ jobchat : contains
    teams ||--o{ memberships : has
    teams ||--o{ messages : contains

    jobchat ||--o{ messages : contains
    jobchat ||--o{ job_tag_assignments : tagged

    tag_templates ||--o{ job_tag_assignments : assigns

    memberships }o--|| users : references
    memberships }o--|| teams : belongs_to

    messages }o--|| users : sent_by
    messages }o--|| jobchat : belongs_to

    users ||--o{ user_contacts : has
    users ||--o{ contact_matches : matched
    users ||--o{ notifications : receives
    users ||--o{ user_push_tokens : has
    users ||--o{ user_preferences : has
    users ||--o{ user_contact_sync : tracks

    %% Missing orgId references
    memberships }o..o{ organizations : "MISSING orgId"
    notifications }o..o{ organizations : "MISSING orgId"
    tag_templates }o..o{ organizations : "MISSING orgId"
    job_tag_assignments }o..o{ organizations : "MISSING orgId"

    %% Disappearing jobs issue
    memberships ||--|{ jobchat : "REMOVAL = lost access"

    %% Hybrid architecture dependency
    teams }o..o{ appwrite_teams : "HYBRID: appwriteTeamId"
    memberships }o..o{ appwrite_memberships : "HYBRID: sync required"

    organizations {
        string id PK
        string orgName
        string ownerId
        string description
        string logoUrl
        boolean isActive
        string settings
        string premiumTier
        string currentProductId
        string subscriptionId
        string subscriptionExpiryDate
        string revenueCatCustomerId
        boolean hdCaptureEnabled
        boolean timestampEnabled
        boolean watermarkEnabled
        boolean videoRecordingEnabled
        boolean hdVideoEnabled
        datetime createdAt
        datetime updatedAt
    }

    users {
        string id PK "Appwrite Auth"
        string email
        string name
    }

    user_contacts {
        string id PK
        string userId FK
        string phoneHash
        string emailHash
        string contactHash
        string contactType
        datetime syncedAt
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    contact_matches {
        string id PK
        string userId FK
        string matchedUserId FK
        string contactHash
        string matchType
        datetime matchedAt
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    user_preferences {
        string id PK
        string userId FK
        boolean timestampEnabled
        string timestampFormat
        object hdPreferences
        string hdPreferencesRaw
        object timestampPreferences
        datetime createdAt
        datetime updatedAt
    }

    user_push_tokens {
        string id PK
        string userId FK
        string token
        string platform
        datetime createdAt
        datetime updatedAt
    }

    user_contact_sync {
        string id PK
        string userId FK
        datetime lastSyncedAt
        number contactsCount
        number matchesCount
        string syncStatus
        number syncVersion
        datetime createdAt
        datetime updatedAt
    }

    revenuecat_events {
        string id PK
        string eventId
        string eventType
        string eventCategory
        string customerId
        string userId FK
        string orgId FK
        string productId
        string eventData
        number attemptNumber
        string processedStatus
        datetime processedAt
        string errorMessage
        datetime createdAt
        datetime updatedAt
    }
