#!/usr/bin/env bash
set -ex

# See README.md for instructions on steps to take before running this.

if [ -z "$1" ]; then
  echo "Usage: $0 <packet-id>"
  exit 1
fi

PACKET_ID=$1
here=$(dirname $0)
DATADIR=$here/../public/data/$PACKET_ID

OUTPUTDIR=$DATADIR/json/
rm -rf $OUTPUTDIR
mkdir $OUTPUTDIR

# https://github.com/Keyang/node-csvtojson?tab=readme-ov-file#command-line-usage
npm i -g csvtojson

# Iterate over all files in the data dir folder
for filepath in $DATADIR/csv/*.csv; do
  csvtojson $filepath > $OUTPUTDIR/$(basename ${filepath%.csv}.json) --checkType=true
  echo "Converted $filepath to JSON."
done
