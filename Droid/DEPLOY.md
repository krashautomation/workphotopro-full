# Deploy Katya Function Code

Since your function is connected to GitHub, you have two options:

## Option 1: Use Appwrite CLI (Recommended - Easiest)

### Step 1: Install Appwrite CLI

```bash
npm install -g appwrite-cli
```

### Step 2: Login to Appwrite

```bash
appwrite login
```

This will open a browser to authenticate.

### Step 3: Initialize Function

```bash
cd Droid/function
appwrite init function
```

Select your project and function (`katya-ai-agent`) when prompted.

### Step 4: Deploy Code

```bash
appwrite deploy function
```

This will deploy `index.js` directly to your function.

---

## Option 2: Use GitHub (If you want to keep GitHub connection)

### Step 1: Push code to GitHub

1. Create a new GitHub repository (or use existing)
2. Copy `Droid/function/index.js` to the repo
3. Push to GitHub

### Step 2: Connect in Appwrite

1. Go to Function → Settings → Source
2. Connect to your GitHub repo
3. Appwrite will auto-deploy from GitHub

---

## Option 3: Disconnect GitHub and Use Manual Entry

1. Go to Function → Settings → Source
2. Disconnect GitHub
3. You should now see a "Code" tab
4. Paste code from `Droid/function/index.js`
5. Deploy

---

**Recommended: Use Option 1 (Appwrite CLI)** - It's the fastest way to deploy your code.

