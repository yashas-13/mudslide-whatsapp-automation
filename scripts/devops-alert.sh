#!/bin/bash
# devops-alert.sh — Send metric alerts to a WhatsApp recipient / group
# Usage: ./devops-alert.sh <recipient> <metric_name> <current_val> <threshold>

RECIPIENT=$1
METRIC=$2
CURRENT=$3
THRESHOLD=$4

if [ -z "$RECIPIENT" ] || [ -z "$METRIC" ]; then
  echo "Usage: $0 <recipient> <metric_name> [current_val] [threshold]"
  exit 1
fi

MSG="🚨 *DevOps Alert*\nHost: $(hostname)\nMetric: *${METRIC}*\nValue: *${CURRENT:-N/A}*\nThreshold: *${THRESHOLD:-N/A}*\nTime: $(date '+%Y-%m-%d %H:%M:%S UTC')"

mudslide send "$RECIPIENT" "$MSG"
