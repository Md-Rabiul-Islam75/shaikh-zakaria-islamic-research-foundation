#!/bin/sh
set -e

echo "🔄 Applying database migrations..."
# Use the prisma CLI directly from the package (bypasses .bin symlink issues
# with Prisma 7's bundled CLI in Docker)
node ./node_modules/prisma/build/index.js migrate deploy

echo "🚀 Starting Next.js server on port ${PORT:-3000}..."
exec node server.js
