# 🧱 Gamification Backend — Step 6: Database Schema Design

Given this reward matrix:

[PASTE CSV OR JSON HERE]

## 🧩 Instructions

Design a normalized schema for PostgreSQL (or Supabase) with:

- Tables for actions, quests, achievements, rewards, user_progress, user_streaks, user_inventory
- Foreign key relationships
- Datatypes, constraints, and indexing suggestions

## 📤 Output Format

Output as **JSON** in this format:

```json
{
  "tables": [
    {
      "name": "actions",
      "columns": [
        {"name": "id", "type": "uuid", "constraints": "primary key"},
        {"name": "name", "type": "text", "constraints": "not null"},
        {"name": "event_trigger", "type": "text", "constraints": "unique"}
      ],
      "relationships": [
        {"target": "user_progress", "type": "one-to-many"}
      ],
      "notes": "Tracks all base user actions"
    }
  ]
}
```



