# 🏗️ Designing Flexible App Permissions & System Architecture

**From Small Teams to Enterprise Contractors**

---

## 🚀 Executive Summary

The core problem is designing an app that can handle different business operational models, from small, informal teams to large, structured organizations with complex projects. The solution involves implementing a **Discord-like permission system** based on `Workspaces`, `Job Chats`, and `Roles` to control member access at a granular level.

---

## 🌐 1. The Core Challenge

Building this app is difficult, especially when developing it in a vacuum.

Business structures vary significantly depending on company size, management levels, and how teams operate.

This affects how data, jobs, and communication should be organized in the app.

---

## 🏗️ 2. Understanding the Use Cases

### 🔹 A. General Contractors

- A general contractor may oversee multiple projects, each with its own subcontractors.
- Each subcontractor or specialty team (e.g., plumbing, electrical) should only see updates related to their specific job.
- They don't need visibility into unrelated projects, members, or tasks.
- Therefore, the app must support restricted access per job.

### 🔹 B. Small Businesses (Serenity Model)

- Everyone works on everything.
- Access control is less strict — all members can see all jobs.
- They often use one group chat for all updates and share photos informally via chat or SMS.
- The goal is to formalize this: track work, capture performance, and provide professional client updates.

### 🔹 C. Maintenance Contracts

- Focus is on regular updates, before/after photos, and monthly reports to prove contract fulfillment.
- This supports client retention and performance tracking.
- Maintenance workflows differ from project-based workflows (e.g., construction), where access and phases are critical.

---

## ⚙️ 3. The Structure Problem

You have several possible levels or entities to represent:

1. **Organization** — the company as a whole.
2. **Team / Workspace** — a department or project-level grouping.
3. **Job** — a specific work assignment or contract, often tied to a location.
4. **Task** — individual units of work within a job.

The challenge is defining what a "team" really means.

- For a small company: one team (everyone).
- For a contractor: multiple teams per project or per function.
- For a large organization: many teams across many projects.

---

## 🏗️ 4. Example: Construction Company

A construction project (e.g., "Oakridge Mall") involves multiple phases, each with its own teams:

1. Excavation
2. Shoring
3. Foundation (formwork, rebar, concrete)
4. Framing, etc.

Each phase (job) requires:

- Its own chat or thread
- A specialized team
- Access control so only relevant users (crew, foremen, subcontractors) can view it

---

## 🔐 5. Access and Permissions Model

The app should mimic Discord-style access:

- One workspace (like a server) per project or organization.
- Multiple job chats (like Discord channels).
- Roles (like Discord roles) define what each user can see or do.
- Permissions are applied at the job chat level using labels or tags.

### How it works:

- Each member belongs to a workspace/team.
- Job chats are tagged with one or more labels (e.g., "Foundation", "Plumbing", "Gardening").
- A user's labels/roles determine which job chats they can access.
- Managers have global access; regular members only see chats matching their labels.

### Example:

- **Workspace**: Oakridge Mall Construction
- **Job Chats**: Excavation, Foundation, Framing
- **Roles**: Excavation Team, Foundation Team, Manager
- A subcontractor with the "Foundation Team" label only sees the "Foundation" chat.

This system supports both:

- Simple setups (small businesses with one general chat)
- Complex setups (large contractors with phase-based permissions)

---

## 🏷️ 6. Labels, Roles, and Access

Roles and labels define permissions:

- A role can represent a position (Manager, Foreman, Member) or function (Gardener, Electrician).
- Users can have multiple roles.
- Job chats can require specific roles or labels to view or post.

When creating a new job chat:

1. Assign one or more labels to define who can access it.
2. Add users (searching within team members).
3. Optionally create new roles (e.g., "Gardening", "Excavation").

If a user doesn't have the required label, they cannot see the chat.

---

## 🧱 7. Managing Projects and Deletions

- Projects (Teams/Workspaces) can be created or archived.
- When a project ends, members can be removed, but their relationships should persist (e.g., remain in contact lists).
- Users exist at the organization level, so they can be reassigned to future projects easily.
- A subcontractor might also create their own organization with separate teams.

---

## 🌱 8. Simplified Small Business Workflow

For a small company:

- One workspace ("Team Serenity")
- One general chat for everyone
- Optional private chats with foremen
- Roles used only for minor access distinctions (e.g., "Manager", "Gardener")

Training and onboarding should explain how to:

- Create job chats
- Assign roles/labels
- Manage access

---

## 🏗️ 9. Architecture Summary

| Concept | Description | Analogy |
|---------|-------------|---------|
| Organization | The overall company | Discord "Server Owner" |
| Workspace / Team | A project or business unit | Discord "Server" |
| Job Chat | Discussion for a specific task, property, or phase | Discord "Channel" |
| Role / Label | Defines who can access which chats | Discord "Role" |
| Manager Role | Sees all chats by default | Admin privileges |
| Member Role | Sees only labeled chats | Restricted view |

---

## 🚀 10. Final Insight

This model — inspired by Discord's permissions system — can scale from small, informal companies to large, structured contractors.

It allows:

- Flexible team and job configurations
- Fine-grained access control
- Easy onboarding
- A unified architecture for both project-based and maintenance-based businesses

---

## 💡 Fundamental Insight

Access should be controlled at the **Job Chat level** using a **role-based system**.

This transforms the app from a rigid structure into a flexible, dynamic tool that reflects how real businesses operate — whether that's a small, tight-knit team or a large general contractor managing a complex network of subcontractors and projects.

---

## 🧩 Unexpected Day of Refactoring

Today went differently than expected — I ended up needing to refactor.

The refactor involves adopting the app's native permission schemes more effectively.

The main limitation: you can't soft delete teams — only hard delete.

But now that I understand the permission model more deeply, everything clicks:

- Teams can have their own permissions.
- Users can also have **labels** that define their permissions (e.g., **Premium User**).
- Roles exist within teams (e.g., Member, Admin).
- Each team has its own internal role hierarchy.

### So, within a team:

- Every user inherits base permissions.
- Admins or higher roles have extended permissions.
- Users can also hold global labels like "Premium" that apply across teams.

This creates a hybrid model:

- **Team-based roles** define hierarchy and access locally.
- **Labels** define global privileges and features.

---

## 🧠 The Emerging Architecture

This structure is becoming much clearer.

By layering team roles and user labels, the system can handle complex access requirements with ease.

It's flexible, scalable, and mirrors how organizations evolve in real life.

I'll need to revisit the **permissions matrix** to plan it out properly before finalizing the refactor.

---

## 🏗️ Contacts and Persistence

Here's a key design problem:

When a project (team) is deleted, the users on it disappear because the delete is hard — not soft.

But in reality, contractors want to maintain those relationships for future projects.

### ✅ The solution:

- Introduce a **Contacts Table**.
- When you invite a user to a team, they're also added to your contacts.
- Even if the team is deleted, the contact remains.

This means:

- You can re-invite the same person to a future project easily.
- Users remain in your network even after a project ends.

Contacts don't automatically have access to anything — they're just stored relationships.

But a company might create a general "workspace chat" (like a lobby) where all contacts can communicate or post jobs.

---

## 📩 Invitations and Notifications

When a contractor starts a new project:

1. They select from their contacts to add to the new team.
2. Each added user receives a notification — "You've been added to Project X."

This also raises the use case of one-on-one chats.

Currently, that can be implemented as a **special Job Chat** between two users with restricted access.

That chat would:

- Appear in both users' memberships.
- Allow direct communication.
- Trigger notifications on assignment or message events.

This avoids building a separate "messaging system" while still supporting one-on-one communication.

---

## 💬 Communication Layer

Essentially, the system blends:

- Discord's permission model (roles + channels).
- WhatsApp's chat model (group chats + DMs).

It's a unified communication system where:

- **Job Chats** = group or project discussions.
- **Direct Chats** = private one-on-one threads.
- **Notifications** = event alerts (invites, mentions, updates).

This structure keeps everything consistent — no separate messaging backend, just smartly permissioned chats.

---

## 🚀 Vision for WPP

The refactor sets the stage for a truly flexible, modern architecture:

- Role-based permissions at every level
- Persistent contact relationships across projects
- Hybrid chat system for both group and direct communication
- Unified notification layer

It's not just a refactor — it's the foundation of a scalable communication and collaboration platform built around real-world workflows and relationships.

---

## 🔄 Refactoring Discovery

Today's work took an unexpected turn toward significant refactoring to implement native permission schemes that provide ultimate flexibility.

### 🎯 Permission System Architecture

#### 🏷️ Dual Permission Layers

- **Team-Level Permissions**: Roles within teams (Admin, Member, etc.) with hierarchical access
- **User Labels**: Custom labels like "premium user" with associated permissions across tables
- **Table-Level Access**: Permissions assigned to specific tables (formerly documents)

#### ⚡ Current Limitation

Teams cannot be soft deleted - only hard deletion is available, which creates data preservation challenges.

### 👥 User Management Solution

#### 📋 The Contacts Table

To solve the hard deletion problem and maintain business relationships:

- When inviting users to a team, they're automatically added to a `contacts table`
- Contacts preserve relationships even when projects end and teams are deleted
- Future projects can easily re-invite contacts from the preserved list
- Each user has one organization but can be part of multiple teams over time

#### 🔔 Notification System

When adding contacts to new teams:

- Automatic notifications alert users when they're added to new projects
- One-to-one communication through specialized job chats with individual permissions
- Maintains communication history while preserving privacy boundaries

### 💬 Communication Architecture

#### 🤝 Hybrid Model

Combining the best of multiple platforms:

- **Discord-style permissions**: Granular role-based access control for job chats
- **WhatsApp-style messaging**: Direct one-on-one and group communication capabilities
- **Professional workflow**: Project-based organization with business context

#### 🛠️ Required Systems

- **Notification System**: Alerts for team assignments and updates
- **Direct Messaging**: One-on-one communication outside of job chats
- **Group Chats**: Flexible communication channels with customizable permissions

---

## 📝 Next Steps & Implementation

1. Create a comprehensive permission matrix to plan the refactoring
2. Implement the contacts table for persistent user relationships
3. Build notification system for team assignments and updates
4. Develop direct messaging capabilities alongside job chats
5. Refactor existing permission structure to support dual-layer access control

---

## 🎯 Summary

While complex, this refactoring creates a foundation that replicates proven social app patterns (notifications + direct messaging) while adding professional-grade permission controls. The result will be an extremely flexible system that can scale from small teams to enterprise contractors without compromising on security or usability.

---

## ✨ Benefits of This System

- **🎯 Flexibility**: Caters to both simple and complex organizational structures
- **🔒 Security & Privacy**: Ensures members only see information pertinent to their work
- **📊 Clarity**: Organizes communication into logical, dedicated streams
- **🚀 Scalability**: Easily accommodates business growth and more complex projects

---

## 🎉 Conclusion

The fundamental insight is that access should be controlled at the **Job Chat level** using a **role-based system**. This moves the app from a rigid structure to a flexible, powerful tool that can mirror the actual way businesses operate, whether they are a small, tight-knit team or a large general contractor managing a complex web of projects and subcontractors.

