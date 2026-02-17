#!/usr/bin/env bash
set -euo pipefail

echo "==> Creating changeset..."
pnpm changeset

echo ""
echo "==> Versioning packages..."
pnpm changeset version

echo ""
echo "==> Building..."
pnpm build

echo ""
echo "==> Committing version bumps..."
git add .
git commit -m "chore: version packages"

echo ""
echo "==> Publishing to npm..."
pnpm changeset publish

echo ""
echo "==> Pushing to git..."
git push --follow-tags

echo ""
echo "==> Done!"
