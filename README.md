# Todoist MCP Add-on Repository

This repository hosts the **Todoist MCP Server** — a [Model Context Protocol](https://modelcontextprotocol.io) server that gives AI assistants (Cursor, Claude Desktop, etc.) full access to your Todoist account: tasks, projects, sections, labels, and comments.

---

## Add-ons

| Add-on | Description |
|--------|-------------|
| [Todoist MCP Server](todoist_mcp/) | 25-tool MCP server for Todoist |

---

## Installation

### Option A — Home Assistant OS Add-on (recommended for HAOS users)

1. In Home Assistant, go to **Settings → Add-ons → Add-on Store**
2. Click the overflow menu (⋮) → **Repositories**
3. Add this URL: `https://github.com/michaelcavallaro/todoist-mcp`
4. Find **Todoist MCP Server** in the store and click **Install**
5. Open the add-on's **Configuration** tab and paste your [Todoist API token](https://app.todoist.com/app/settings/integrations/developer)
6. Start the add-on

Then point your MCP client at:

```
http://<homeassistant-ip>:3000/mcp
```

### Option B — Bare-metal (Raspberry Pi OS / any Linux)

See [todoist_mcp/README.md](todoist_mcp/README.md) for full instructions including a systemd unit file.

```bash
cd todoist_mcp
cp .env.example .env   # add TODOIST_API_TOKEN
yarn install
yarn build
yarn start
```

---

## Connecting an MCP client

### Cursor (`~/.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "todoist": {
      "url": "http://<your-host-ip>:3000/mcp"
    }
  }
}
```

### Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "todoist": {
      "url": "http://<your-host-ip>:3000/mcp"
    }
  }
}
```
