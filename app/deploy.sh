#!/bin/bash
#
# Publishes a new instance of the app demo.
#
set -e
set -E
set -u

source ../publish.sh

trap 'echo -e "\nFAILED TO DEPLOY\n\\O/\n Y\n/ \\"' ERR

echo "Checking lint..."
npm run lint

echo "Ensuring that configuration is not set to localhost...";
grep '^const defaultOrigin = ' src/App.jsx | grep -v localhost

echo "Copying built page into /docs..."
cp -av build/app ../docs

echo "Inserting the missing URL paths in /docs/app/index.html..."
sed -i .bak -E '/ (href|src)=.\/app/s:"/app:"/swm-dd-demo/app:' \
  ../docs/app/index.html \
  && rm -f ../docs/app/index.html.bak

echo "Checking for changes to publish..."
publish main ../docs/app
