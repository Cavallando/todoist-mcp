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

export function registerLabelTools(server: McpServer): void {
  server.registerTool(
    "get_labels",
    {
      description: "List all personal labels for the current user.",
      inputSchema: {
        limit: z.number().int().min(1).max(200).optional().describe("Max labels to return"),
        cursor: z.string().optional().describe("Pagination cursor from a previous response"),
      },
    },
    async (args) => {
      try {
        const response = await todoist.getLabels(args);
        return text(response);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.registerTool(
    "get_label",
    {
      description: "Get a single label by its ID.",
      inputSchema: {
        id: z.string().describe("The label ID"),
      },
    },
    async ({ id }) => {
      try {
        const label = await todoist.getLabel(id);
        return text(label);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.registerTool(
    "create_label",
    {
      description: "Create a new personal label.",
      inputSchema: {
        name: z.string().describe("The label name"),
        color: z
          .string()
          .optional()
          .describe(
            "Color key, e.g. 'berry_red', 'red', 'orange', 'yellow', 'olive_green', 'lime_green', 'green', 'mint_green', 'teal', 'sky_blue', 'light_blue', 'blue', 'grape', 'violet', 'lavender', 'magenta', 'salmon', 'charcoal', 'grey', 'taupe'"
          ),
        isFavorite: z.boolean().optional().describe("Whether to mark this label as a favorite"),
        order: z.number().int().optional().describe("Sort order position"),
      },
    },
    async ({ color, ...rest }) => {
      try {
        const label = await todoist.addLabel({
          ...rest,
          ...(color ? { color: color as Parameters<typeof todoist.addLabel>[0]["color"] } : {}),
        });
        return text(label);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.registerTool(
    "update_label",
    {
      description: "Update an existing label's name, color, favorite status, or sort order.",
      inputSchema: {
        id: z.string().describe("The label ID to update"),
        name: z.string().optional().describe("New label name"),
        color: z.string().optional().describe("New color key (see create_label for options)"),
        isFavorite: z.boolean().optional().describe("Whether to mark as a favorite"),
        order: z.number().int().optional().describe("New sort order position"),
      },
    },
    async ({ id, color, ...rest }) => {
      try {
        const label = await todoist.updateLabel(id, {
          ...rest,
          ...(color ? { color: color as Parameters<typeof todoist.updateLabel>[1]["color"] } : {}),
        });
        return text(label);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.registerTool(
    "delete_label",
    {
      description: "Delete a personal label.",
      inputSchema: {
        id: z.string().describe("The label ID to delete"),
      },
    },
    async ({ id }) => {
      try {
        const success = await todoist.deleteLabel(id);
        return text({ success });
      } catch (e) {
        return err(e);
      }
    }
  );
}
