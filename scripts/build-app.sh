#!/usr/bin/env bash
set -ex

here=$(dirname $0)

DIST=$here/../dist/
rm -rf $DIST
mkdir $DIST

# Pre-process CSV files into JSON
$here/convert-csv-files-to-json.sh

# Eventually this script will trigger the build of the Vue app to the dist folder, from which we will deploy to GHP
# .. for now just copy contents of static folder to dist
cp -a $here/../static/. $DIST

# https://dev.to/biomousavi/easiest-way-to-set-up-github-action-cicd-for-vuejs-apps-18ec
