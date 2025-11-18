# GitHub Repository Setup Guide

## Option 1: Using GitHub Web Interface (Easiest)

1. **Go to GitHub**: https://github.com/new
2. **Repository name**: `prediction-market-dashboard`
3. **Description**: "A comprehensive analytics dashboard for prediction markets (Polymarket & Kalshi)"
4. **Visibility**: Choose Public or Private
5. **Important**: DO NOT check any boxes (no README, .gitignore, or license - we already have them)
6. **Click**: "Create repository"

After creating, GitHub will show you commands. Use these:

```bash
cd "/Users/shanemacinnes/Desktop/Prediction Market"
git remote add origin https://github.com/YOUR_USERNAME/prediction-market-dashboard.git
git push -u origin main
```

## Option 2: Using GitHub CLI (If Installed)

If you have GitHub CLI installed:

```bash
cd "/Users/shanemacinnes/Desktop/Prediction Market"
gh repo create prediction-market-dashboard --public --source=. --remote=origin --push
```

## Option 3: Install GitHub CLI First

```bash
# Install GitHub CLI
brew install gh

# Authenticate
gh auth login

# Create repository
cd "/Users/shanemacinnes/Desktop/Prediction Market"
gh repo create prediction-market-dashboard --public --source=. --remote=origin --push
```

## After Setup

Your repository will be live at:
`https://github.com/YOUR_USERNAME/prediction-market-dashboard`

