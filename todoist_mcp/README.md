# Todoist MCP Server

A Model Context Protocol (MCP) server that gives AI assistants (Cursor, Claude Desktop, etc.) full access to your Todoist account — tasks, projects, sections, labels, and comments.

---

## Tools (25 total)

| Category | Tools |
|----------|-------|
| **Tasks** | `get_tasks`, `get_task`, `create_task`, `update_task`, `complete_task`, `delete_task` |
| **Projects** | `get_projects`, `get_project`, `create_project`, `update_project`, `delete_project` |
| **Labels** | `get_labels`, `get_label`, `create_label`, `update_label`, `delete_label` |
| **Sections** | `get_sections`, `get_section`, `create_section`, `update_section`, `delete_section` |
| **Comments** | `get_comments`, `get_comment`, `create_comment`, `update_comment`, `delete_comment` |

---

## Prerequisites

- Node.js 20+ (LTS)
- A Todoist API token — from [https://app.todoist.com/app/settings/integrations/developer](https://app.todoist.com/app/settings/integrations/developer)

---

## Running as a Home Assistant OS Add-on

See the [repository README](../README.md) for one-click HAOS installation instructions.

---

## Bare-metal deployment (Raspberry Pi OS / any Linux)

### Quick start

```bash
cp .env.example .env     # fill in TODOIST_API_TOKEN
yarn install
yarn build
yarn start
# → Todoist MCP server listening on http://0.0.0.0:3000/mcp
```

### Auto-start with systemd

Create `/etc/systemd/system/todoist-mcp.service` (replace `pi` with your username):

```ini
[Unit]
Description=Todoist MCP Server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/todoist-mcp/todoist_mcp
EnvironmentFile=/home/pi/todoist-mcp/todoist_mcp/.env
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable todoist-mcp
sudo systemctl start todoist-mcp
journalctl -u todoist-mcp -f   # view logs
```

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `TODOIST_API_TOKEN` | Yes | — | Your Todoist API token |
| `PORT` | No | `3000` | Port the server listens on |

---

## Scripts

| Command | Description |
|---------|-------------|
| `yarn build` | Compile TypeScript → `dist/` |
| `yarn start` | Run compiled server |
| `yarn typecheck` | Type-check without emitting |
| `yarn dev` | Watch-mode compile + run |

---

## Project structure

```
todoist_mcp/
├── src/
│   ├── index.ts          # HTTP server + MCP setup
│   ├── client.ts         # Singleton Todoist API client
│   └── tools/
│       ├── tasks.ts
│       ├── projects.ts
│       ├── labels.ts
│       ├── sections.ts
│       └── comments.ts
├── config.yaml           # HAOS add-on manifest
├── Dockerfile            # Multi-arch container build
├── run.sh                # HAOS container entrypoint
├── build.yaml            # Arch → base image map
├── .env.example
├── package.json
└── tsconfig.json
```
