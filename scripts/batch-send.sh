#!/bin/bash
# batch-send.sh: Send same message to multiple recipients
# Usage: ./scripts/batch-send.sh recipients.txt "message"

FILE=$1
MSG="$2"
if [[ ! -f "$FILE" || -z "$MSG" ]]; then
  echo "Usage: $0 <recipients_file> \"message\""
  exit 1
fi

while IFS= read -r line; do
  [[ -z "$line" || "$line" =~ ^# ]] && continue
  echo "=> Sending to $line..."
  mudslide send "$line" "$MSG" 2>&1 | tail -2
  sleep 3
done < "$FILE"
