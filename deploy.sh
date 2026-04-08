#!/bin/bash

# Navigate to the project directory
cd /Users/mark/code/stl-web

# Git operations
echo "Committing changes..."
git add .
git commit -m "latest changes"

echo "Pushing to remote..."
git push

# Build the project
echo "Building project..."
npm run-script build

# Deploy to Firebase
echo "Deploying to Firebase..."
firebase deploy

echo "Deployment complete!"
