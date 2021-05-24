#!/bin/bash
#
# Publishes a new instance of the demo EHR.
#
set -e
set -E
set -u

trap 'echo -e "\nFAILED TO DEPLOY\n\\O/\n Y\n/ \\"' ERR

echo "Checking lint..."
npm run lint

echo "Ensuring that configuration is not set to localhost...";
grep '^const defaultAppUrl = ' src/Ehr.jsx | grep -v localhost

echo "Copying built page into /docs..."
cp -av build/ehr ../docs

echo "Inserting the missing URL paths in /docs/ehr/index.html..."
sed -i .bak -E '/ (href|src)=.\/ehr/s:"/ehr:"/swm-c10n-demo/ehr:' \
  ../docs/ehr/index.html \
  && rm -f ../docs/ehr/index.html.bak

echo "Checking for changes to publish..."
git status ../docs/ehr | grep -q 'nothing to commit' && echo "NOTHING NEW" && exit 0

echo "Publishing built ehr to GHPages..."
git add ../docs/ehr
git commit -m "auto deployed by ehr/deploy.sh"
git push

echo -e '\nDEPLOY COMPLETE!!\n O/\n<Y\n/ >'
