#!/bin/bash

# Navigate to the project directory
cd /Users/mark/code/my-timeline-expo

# Git operations
echo "Committing changes..."
git add .
git commit -m "latest changes"

echo "Pushing to remote..."
git push

# Build the project
npx expo export --platform web

# Deploy to Firebase
echo "Deploying to Firebase..."
firebase deploy

echo "Deployment complete!"
