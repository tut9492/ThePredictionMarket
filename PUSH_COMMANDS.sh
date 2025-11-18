#!/bin/bash
# Commands to push to GitHub
# Your GitHub username: tut9492

# First, create the repository on GitHub at:
# https://github.com/new
# Name: prediction-market-dashboard
# Description: "A comprehensive analytics dashboard for prediction markets (Polymarket & Kalshi)"
# DO NOT initialize with README, .gitignore, or license

# Then run these commands:

cd "/Users/shanemacinnes/Desktop/Prediction Market"

# Add remote (replace with your actual repo name if different)
git remote add origin https://github.com/tut9492/prediction-market-dashboard.git

# Push to GitHub
git push -u origin main

echo "✅ Code pushed to GitHub!"
echo "Repository: https://github.com/tut9492/prediction-market-dashboard"

