#!/bin/bash
# find-top-groups.sh: Rank groups by member count
mudslide groups 2>&1 | grep '^{' | while IFS= read -r line; do
  id=$(echo "$line" | grep -o '"id": "[^"]*"' | cut -d'"' -f4)
  subject=$(echo "$line" | grep -o '"subject": "[^"]*"' | cut -d'"' -f4)
  count=$(mudslide list-group "$id" 2>&1 | grep -c '"id"' || echo 0)
  printf "%3d  %-50s  %s\n" "$count" "$subject" "$id"
done | sort -rn | head -20
