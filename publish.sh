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
  else
    git add "${@}"
    git commit -m "auto published by ${0}"
    git push
    echo -e '\nDEPLOY COMPLETE!!\n O/\n<Y\n/ >'
  fi
  git stash save
  git checkout -
  git stash pop || true
}
