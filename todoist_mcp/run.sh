#!/usr/bin/with-contenv bashio

# Read configuration set by the user in the HA add-on UI.
export TODOIST_API_TOKEN
export PORT

TODOIST_API_TOKEN=$(bashio::config 'todoist_api_token')
PORT=$(bashio::config 'port')

if bashio::var.is_empty "${TODOIST_API_TOKEN}"; then
  bashio::log.fatal "todoist_api_token is not set. Open the add-on configuration and add your Todoist API token."
  exit 1
fi

bashio::log.info "Starting Todoist MCP Server on port ${PORT}..."
exec node /app/dist/index.js
