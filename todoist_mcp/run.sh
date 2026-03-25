#!/bin/sh
set -e

OPTIONS="/data/options.json"

if [ ! -f "$OPTIONS" ]; then
  echo "ERROR: /data/options.json not found — is this running inside a HAOS add-on?"
  exit 1
fi

export TODOIST_API_TOKEN
export PORT

TODOIST_API_TOKEN=$(jq -r '.todoist_api_token' "$OPTIONS")
PORT=$(jq -r '.port' "$OPTIONS")

if [ -z "$TODOIST_API_TOKEN" ] || [ "$TODOIST_API_TOKEN" = "null" ]; then
  echo "ERROR: todoist_api_token is not set. Open the add-on Configuration tab and add your Todoist API token."
  exit 1
fi

echo "Starting Todoist MCP Server on port ${PORT}..."
exec node /app/dist/index.js
