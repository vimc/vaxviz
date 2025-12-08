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

PUBLIC_JSON_DATA_DIR=$DATADIR/json/
rm -rf $PUBLIC_JSON_DATA_DIR
mkdir $PUBLIC_JSON_DATA_DIR

# Iterate over all files in the data dir folder
for filepath in $DATADIR/csv/*.csv; do
  # https://github.com/Keyang/node-csvtojson?tab=readme-ov-file#command-line-usage
  npx csvtojson $filepath > $PUBLIC_JSON_DATA_DIR/$(basename ${filepath%.csv}.json) --checkType=true
  echo "Converted $filepath to JSON."
done

# Move the file who_sub_regions.json to SRC_DATA_DIR.
SRC_DATA_DIR=$here/../src/data
rm -f $SRC_DATA_DIR/WHORegions.json
mv $DATADIR/json/who_sub_regions.json $SRC_DATA_DIR/WHORegions.json

# Derive options data from the converted JSON files.
# NB this node script has a dependency on the WHORegions.json file that has just been written.
OPTIONS_TARGET_DIR=$SRC_DATA_DIR/options
rm -rf $OPTIONS_TARGET_DIR
mkdir $OPTIONS_TARGET_DIR
node --experimental-transform-types $here/generateOptions.ts $PUBLIC_JSON_DATA_DIR $OPTIONS_TARGET_DIR

# Write to a file to record the packet-id and date-time stamp.
DATE_TIME=$(date '+%Y-%m-%d %H:%M:%S')
echo "Packet $PACKET_ID converted to json at $DATE_TIME" > $DATADIR/packet-id.txt
