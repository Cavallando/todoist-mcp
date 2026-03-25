import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { todoist } from "../client.js";

function text(value: unknown): { content: [{ type: "text"; text: string }] } {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
  };
}

function err(e: unknown): { content: [{ type: "text"; text: string }]; isError: true } {
  const message = e instanceof Error ? e.message : String(e);
  return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
}

export function registerProjectTools(server: McpServer): void {
  server.registerTool(
    "get_projects",
    {
      description: "List all of the user's projects.",
      inputSchema: {
        limit: z.number().int().min(1).max(200).optional().describe("Max projects to return"),
        cursor: z.string().optional().describe("Pagination cursor from a previous response"),
      },
    },
    async (args) => {
      try {
        const response = await todoist.getProjects(args);
        return text(response);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.registerTool(
    "get_project",
    {
      description: "Get a single project by its ID.",
      inputSchema: {
        id: z.string().describe("The project ID"),
      },
    },
    async ({ id }) => {
      try {
        const project = await todoist.getProject(id);
        return text(project);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.registerTool(
    "create_project",
    {
      description: "Create a new project.",
      inputSchema: {
        name: z.string().describe("The project name"),
        parentId: z.string().optional().describe("Parent project ID to nest this project under"),
        color: z
          .string()
          .optional()
          .describe(
            "Color key, e.g. 'berry_red', 'red', 'orange', 'yellow', 'olive_green', 'lime_green', 'green', 'mint_green', 'teal', 'sky_blue', 'light_blue', 'blue', 'grape', 'violet', 'lavender', 'magenta', 'salmon', 'charcoal', 'grey', 'taupe'"
          ),
        isFavorite: z.boolean().optional().describe("Whether to mark this project as a favorite"),
        viewStyle: z
          .enum(["list", "board"])
          .optional()
          .describe("Default view: 'list' or 'board'"),
      },
    },
    async ({ color, viewStyle, ...rest }) => {
      try {
        const project = await todoist.addProject({
          ...rest,
          ...(color ? { color: color as Parameters<typeof todoist.addProject>[0]["color"] } : {}),
          ...(viewStyle ? { viewStyle } : {}),
        });
        return text(project);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.registerTool(
    "update_project",
    {
      description: "Update an existing project's name, color, favorite status, or view style.",
      inputSchema: {
        id: z.string().describe("The project ID to update"),
        name: z.string().optional().describe("New project name"),
        color: z.string().optional().describe("New color key (see create_project for options)"),
        isFavorite: z.boolean().optional().describe("Whether to mark as a favorite"),
        viewStyle: z
          .enum(["list", "board"])
          .optional()
          .describe("Default view: 'list' or 'board'"),
      },
    },
    async ({ id, color, viewStyle, ...rest }) => {
      try {
        const project = await todoist.updateProject(id, {
          ...rest,
          ...(color ? { color: color as Parameters<typeof todoist.updateProject>[1]["color"] } : {}),
          ...(viewStyle ? { viewStyle } : {}),
        });
        return text(project);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.registerTool(
    "delete_project",
    {
      description: "Permanently delete a project and all of its tasks.",
      inputSchema: {
        id: z.string().describe("The project ID to delete"),
      },
    },
    async ({ id }) => {
      try {
        const success = await todoist.deleteProject(id);
        return text({ success });
      } catch (e) {
        return err(e);
      }
    }
  );
}
