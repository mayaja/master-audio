#!/bin/bash

set -e

FILE_ID="1x8XMsXXLPhKvmKONb4blogMyF8OEjM9X"
TARGET_DIR="public/models"
OUT_FILE="$TARGET_DIR/htdemucs_embedded.onnx"

mkdir -p "$TARGET_DIR"

if [ -s "$OUT_FILE" ]; then
    echo "Asset already exists: $OUT_FILE"
    exit 0
fi

if [ -z "$FILE_ID" ]; then
    echo "Error: FILE_ID is empty."
    exit 1
fi

echo "Downloading StemMix model to $OUT_FILE..."
curl -L "https://drive.google.com/uc?export=download&id=$FILE_ID" -o "$OUT_FILE"

MIN_BYTES=100000000
FILE_SIZE=$(wc -c < "$OUT_FILE" | tr -d ' ')

if [ ! -s "$OUT_FILE" ] || [ "$FILE_SIZE" -lt "$MIN_BYTES" ]; then
    echo "Download failed or produced an invalid model file."
    rm -f "$OUT_FILE"
    exit 1
fi

echo "Download complete."
