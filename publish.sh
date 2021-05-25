#!/bin/bash
#
# This is meant to be sourced by other scripts.
#

function publish() {
  local branch=$1 && shift
  echo "Publishing $@... to branch $branch"
  git stash save
  git checkout $branch
  git stash pop
  if git status "${@}" | grep -q 'nothing to commit'; then
    echo "NOTHING NEW"
    git stash save
    git checkout -
    git stash pop
    exit 0
  fi
  git add "${@}"
  git commit -m "auto published by ${0}"
  git push
  git stash save
  git checkout -
  git stash pop
  echo -e '\nDEPLOY COMPLETE!!\n O/\n<Y\n/ >'
}
