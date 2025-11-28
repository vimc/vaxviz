#!/usr/bin/env bash
set -ex

here=$(dirname $0)

DIST=$here/../dist/
rm -rf $DIST
mkdir $DIST

npm ci
npm run build
