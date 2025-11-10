# 🧠 GAMIFICATION BUILDER — META PROMPT

You are a full-stack game design assistant inside Cursor.

Your task: run through all 7 steps of gamification design automatically, generating clean structured data for each stage.

---

## 🏗 App Description

[PASTE YOUR APP DESCRIPTION HERE]

---

## 🎯 Objectives

Design a complete gamification framework that:

- Rewards users for exploring and using features
- Encourages streaks, consistency, and mastery
- Produces CSV/JSON output ready for import into spreadsheets or databases
- Ends with SQL-ready schema & triggers

---

## 🔁 Workflow Steps

### Step 1: Identify Core App Actions

Generate a CSV with:

```
Action,Frequency,Effort,ValueToUser,ValueToApp,EventTrigger
```

→ Limit to 10–20 key user actions.

---

### Step 2: Assign XP / Points

For each action:

- Base XP = 10 × ValueToUser  
- Multiply by 1.2 if Effort = Medium, 1.5 if High  
- Round to nearest 10  
- Assign Coins (XP ÷ 5) and Category (core, social, learning, exploration)

Output as CSV:

```
Action,EventTrigger,XP,Coins,Category,Notes
```

---

### Step 3: Create Quests

Design 3 daily, 3 weekly, and 3 milestone quests.

Output as JSON:

```json
[
  {
    "name": "",
    "type": "daily|weekly|milestone",
    "description": "",
    "goal": 0,
    "xpReward": 0,
    "coinsReward": 0,
    "dependentActions": []
  }
]
```

---

### Step 4: Define Achievements

Generate 6–10 achievements (tiered where applicable) that reward mastery, consistency, or exploration.

Output as JSON:

```json
[
  {
    "id": "",
    "name": "",
    "category": "progression|skill|consistency|exploration|social|secret",
    "criteria": "",
    "xpReward": 0,
    "coinReward": 0,
    "badgeImage": "",
    "tier": "bronze|silver|gold|null"
  }
]
```

---

### Step 5: Build Reward Matrix

Combine all actions, quests, and achievements into one CSV:

```
ActionOrQuest,EventTrigger,Type,XP,Coins,RelatedAchievement,Notes
```

---

### Step 6: Suggest Database Schema

Design a normalized PostgreSQL/Supabase schema with:

- actions
- quests
- achievements
- rewards
- user_progress
- user_streaks
- user_inventory

Output as JSON:

```json
{
  "tables": [
    {
      "name": "",
      "columns": [
        {"name": "", "type": "", "constraints": ""}
      ],
      "relationships": [],
      "notes": ""
    }
  ]
}
```

---

### Step 7: Generate SQL Schema + Triggers

Using the schema from Step 6:

- Generate `CREATE TABLE` statements
- Include triggers/functions for:
  - XP awards
  - Quest progress
  - Streak tracking
  - Achievement unlocks

Output as SQL script.

---

## 📤 Final Deliverables

At the end, return:

1. **Step summaries**
2. **All structured data (CSV/JSON)**
3. **Final SQL schema**
4. **Brief explanation of how each layer connects**

All content should be cleanly separated like:

```
===== STEP 1: CORE ACTIONS (CSV) =====
<CSV data>

===== STEP 2: XP ASSIGNMENTS (CSV) =====
<CSV data>

===== STEP 3: QUESTS (JSON) =====
<JSON data>

===== STEP 4: ACHIEVEMENTS (JSON) =====
<JSON data>

===== STEP 5: REWARD MATRIX (CSV) =====
<CSV data>

===== STEP 6: DATABASE SCHEMA (JSON) =====
<JSON data>

===== STEP 7: SQL + TRIGGERS =====
<SQL script>
```

---

## 🧠 Notes

- Keep output compact but consistent (no filler text)
- Favor data formats that can be directly imported into Sheets, Airtable, or Supabase
- Where appropriate, include realistic numeric examples
- Use descriptive trigger names (e.g. `lesson_completed`, `task_shared`, `goal_achieved`)
- Assume Supabase compatibility

---

## 🏁 Execution Mode

Start at Step 1 and generate all outputs sequentially without needing user input between steps.

Return everything in one message.


