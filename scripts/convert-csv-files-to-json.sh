#!/usr/bin/env bash
set -ex

# See README.md for instructions on steps to take before running this.

if [ -z "$1" ]; then
  echo "Usage: $0 <packet-id>"
  exit 1
fi

PACKET_ID=$1
here=$(dirname $0)
DATADIR=$here/../public/data

OUTPUTDIR=$DATADIR/json/
rm -rf $OUTPUTDIR
mkdir $OUTPUTDIR

# Iterate over all files in the data dir folder
for filepath in $DATADIR/csv/*.csv; do
  # https://github.com/Keyang/node-csvtojson?tab=readme-ov-file#command-line-usage
  npx csvtojson $filepath > $OUTPUTDIR/$(basename ${filepath%.csv}.json) --checkType=true
  echo "Converted $filepath to JSON."
done

# Copy some relatively small files into the src/data folder
SRCDATADIR=$here/../src/data/summary
rm -rf $SRCDATADIR
mkdir $SRCDATADIR
cp $OUTPUTDIR/summary_table_deaths_disease_country.json $SRCDATADIR
cp $OUTPUTDIR/summary_table_deaths_disease_subregion.json $SRCDATADIR

# Write to a file to record the packet-id and date-time stamp.
DATE_TIME=$(date '+%Y-%m-%d %H:%M:%S')
echo "Packet $PACKET_ID converted to json at $DATE_TIME" > $DATADIR/packet-id.txt
