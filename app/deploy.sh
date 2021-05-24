#!/bin/bash
#
# Publishes a new instance of the app demo.
#
set -e
set -E
set -u

trap 'echo -e "\nFAILED TO DEPLOY\n\\O/\n Y\n/ \\"' ERR

echo "Checking lint..."
npm run lint

echo "Ensuring that configuration is not set to localhost...";
grep '^const defaultOrigin = ' src/App.jsx | grep -v localhost

echo "Copying built page into /docs..."
cp -av build/app ../docs

echo "Inserting the missing URL paths in /docs/app/index.html..."
sed -i .bak -E '/ (href|src)=.\/app/s:"/app:"/swm-c10n-demo/app:' \
  ../docs/app/index.html \
  && rm -f ../docs/app/index.html.bak

echo "Checking for changes to publish..."
git status ../docs/app | grep -q 'nothing to commit' && echo "NOTHING NEW" && exit 0

echo "Publishing built app to GHPages..."
git add ../docs/app
git commit -m "auto deployed by app/deploy.sh"
git push

echo -e '\nDEPLOY COMPLETE!!\n O/\n<Y\n/ >'
