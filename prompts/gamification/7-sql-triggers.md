# 💾 Gamification Backend — Step 7: Generate SQL + Triggers

Using this schema:

[PASTE SCHEMA JSON HERE]

## 🧩 Instructions

Generate:

1. SQL `CREATE TABLE` statements
2. Triggers & functions for:
   - Awarding XP on event trigger
   - Tracking streaks (daily logins or completions)
   - Updating quest progress
   - Unlocking achievements

Include clear section comments and use PostgreSQL conventions (compatible with Supabase).

## 📤 Output Format

Output as SQL script, for example:

```sql
-- TABLES
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL
);

CREATE TABLE user_xp (
  user_id uuid REFERENCES users(id),
  total_xp integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- FUNCTION: award_xp
CREATE OR REPLACE FUNCTION award_xp(user_id uuid, event text) RETURNS void AS $$
BEGIN
  UPDATE user_xp
  SET total_xp = total_xp + (SELECT xp FROM actions WHERE event_trigger = event)
  WHERE user_id = user_id;
END;
$$ LANGUAGE plpgsql;
```



