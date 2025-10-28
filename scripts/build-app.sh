#!/usr/bin/env bash
set -ex

here=$(dirname $0)

DIST=$here/../dist/
rm -rf $DIST
mkdir $DIST

# Eventually this script will trigger the build of the Vue app to the dist folder, from which we will deploy to GHP
# .. for now just copy contents of static folder to dist
cp -a $here/../static/. $DIST