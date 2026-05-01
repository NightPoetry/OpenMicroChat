#!/bin/bash
# Copy frontend files to dist/ for Tauri packaging
set -e

DIST="dist"
rm -rf "$DIST"
mkdir -p "$DIST/src/modules/auth" \
         "$DIST/src/modules/chat" \
         "$DIST/src/modules/contacts" \
         "$DIST/src/modules/settings" \
         "$DIST/src/modules/tags" \
         "$DIST/src/modules/store" \
         "$DIST/src/modules/storage" \
         "$DIST/src/modules/utils" \
         "$DIST/src/modules/animations" \
         "$DIST/src/modules/clusters" \
         "$DIST/src/data"

cp index.html "$DIST/"
cp styles.css "$DIST/"
cp -r src/main.js "$DIST/src/"
cp -r src/data/* "$DIST/src/data/"
cp -r src/modules/auth/* "$DIST/src/modules/auth/"
cp -r src/modules/chat/* "$DIST/src/modules/chat/"
cp -r src/modules/contacts/* "$DIST/src/modules/contacts/"
cp -r src/modules/settings/* "$DIST/src/modules/settings/"
cp -r src/modules/tags/* "$DIST/src/modules/tags/"
cp -r src/modules/store/* "$DIST/src/modules/store/"
cp -r src/modules/storage/* "$DIST/src/modules/storage/"
cp -r src/modules/utils/* "$DIST/src/modules/utils/"
cp -r src/modules/animations/* "$DIST/src/modules/animations/"
cp -r src/modules/clusters/* "$DIST/src/modules/clusters/"

echo "Frontend built to $DIST/"
