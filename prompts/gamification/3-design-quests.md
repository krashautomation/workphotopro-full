# 🗺 Gamification Designer — Step 3: Design Quests

Using the following actions:

[PASTE ACTIONS OR CSV HERE]

## 🧩 Instructions

Design:

- Daily quests (simple actions)
- Weekly quests (combo of actions)
- Milestone quests (long-term mastery)

Each quest should include:

- Name
- Type
- Description
- Goal (numeric)
- XPReward
- CoinsReward
- DependentActions (event triggers)

## 📤 Output Format

Output as **JSON array**:

```json
[
  {
    "name": "Complete 1 Lesson",
    "type": "daily",
    "description": "Finish one lesson today.",
    "goal": 1,
    "xpReward": 50,
    "coinsReward": 20,
    "dependentActions": ["lesson_completed"]
  }
]
```


