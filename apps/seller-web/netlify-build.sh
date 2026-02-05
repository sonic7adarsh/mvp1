#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

echo "Starting Build Script..."
echo "Current directory: $(pwd)"

# Function to build from root
build_from_root() {
  echo "Installing dependencies..."
  npm install
  
  echo "Building seller-web workspace..."
  npm run build --workspace=seller-web
}

# Check if we are in the root (package.json has workspaces)
if [ -f "package.json" ] && grep -q "workspaces" "package.json"; then
  echo "Detected Root environment."
  build_from_root
  
  # If running from root, artifacts are in apps/seller-web/dist.
  # Netlify expects them in 'dist' (based on publish="dist" in toml).
  echo "Copying artifacts to root dist..."
  rm -rf dist
  cp -r apps/seller-web/dist dist

else
  echo "Detected Subdirectory environment. Moving to root..."
  # Navigate to root
  cd ../..
  echo "Root directory: $(pwd)"
  
  build_from_root
  
  # Artifacts are now in apps/seller-web/dist (relative to root).
  # Since we started in apps/seller-web, this directory corresponds to ./dist
  # So we don't need to copy anything.
fi

echo "Build script completed successfully."
