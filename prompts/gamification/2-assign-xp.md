# ⚙️ Gamification Designer — Step 2: Assign XP and Points

Given this CSV of user actions:

[PASTE PREVIOUS CSV HERE]

## 🧩 Instructions

Assign XP, Coins, and Category to each action.

Rules:

- Base XP = 10 × ValueToUser
- Multiply by 1.2 if Effort = Medium, 1.5 if High
- Round to nearest 10
- Category: core, social, learning, exploration

## 📤 Output Format

Output as **CSV** with headers:

```
Action,EventTrigger,XP,Coins,Category,Notes
```

Example:

```
Complete Lesson,lesson_completed,60,10,learning,Core progression loop
Invite Friend,friend_invited,70,20,social,Encourage referrals
```


