#!/bin/bash
#
# Publishes a new instance of the demo EHR into GHPages.
#
set -e
set -E
set -u

source ../publish.sh

trap 'echo -e "\nFAILED TO DEPLOY\n\\O/\n Y\n/ \\"' ERR

echo "Checking lint..."
npm run lint

echo "Ensuring that configuration is not set to localhost...";
grep '^const defaultAppUrl = ' src/Ehr.jsx | grep -v localhost

echo "Copying built page into /docs..."
cp -av build/ehr ../docs

echo "Inserting the missing URL paths in /docs/ehr/index.html..."
sed -i .bak -E '/ (href|src)=.\/ehr/s:"/ehr:"/swm-dd-demo/ehr:' \
  ../docs/ehr/index.html \
  && rm -f ../docs/ehr/index.html.bak

echo "Checking for changes to publish..."
publish main ../docs/ehr
