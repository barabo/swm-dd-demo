#!/bin/bash
#
# Publishes a new instance of the demo EHR.
#
set -e
set -E
set -u

this_script="${0}"

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

function publish() {
  echo "Publishing $@..."
  git stash save
  git checkout main
  if git status "${@}" | grep -q 'nothing to commit'; then
    echo "NOTHING NEW"
    git checkout -
    git stash pop
    exit 0
  fi
  git add "${@}"
  git commit -m "auto published by ${this_script}"
  git push
  git checkout -
  git stash pop
  echo -e '\nDEPLOY COMPLETE!!\n O/\n<Y\n/ >'
}

echo "Checking for changes to publish..."
publish ../docs/ehr
