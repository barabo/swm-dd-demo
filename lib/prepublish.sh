#!/bin/bash

set -e
set -u

if [[ $( basename $PWD ) == 'lib' ]]; then
  echo "Ensuring a clean build..."
  npm run lint

  echo "Ensuring a fresh build..."
  npm run build
fi

LATEST="$( npm show swm-client-lib version )"
NEXT="$( grep -e '^[ ]*"version":' package.json | cut -d'"' -f4 )"

# Make sure the version has been bumped before publishing.
if [[ $NEXT == $LATEST ]]; then
  echo "FAIL: Bump the version of the lib in package.json before publishing!"
  exit 1
fi

HIGHEST="$( echo -e "$LATEST\n$NEXT" | sort -V | tail -n1 )"
if [[ $HIGHEST == $LATEST ]]; then
  echo "FAIL: Detected a version regression!  Check npm and package.json!"
  exit 1
fi

echo "OK to publish new version: $NEXT"
