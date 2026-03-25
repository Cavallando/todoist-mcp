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

export function registerCommentTools(server: McpServer): void {
  server.registerTool(
    "get_comments",
    {
      description:
        "List comments on a task or project. Exactly one of taskId or projectId must be provided.",
      inputSchema: {
        taskId: z.string().optional().describe("Task ID to fetch comments for"),
        projectId: z.string().optional().describe("Project ID to fetch comments for"),
        limit: z.number().int().min(1).max(200).optional().describe("Max comments to return"),
        cursor: z.string().optional().describe("Pagination cursor from a previous response"),
      },
    },
    async ({ taskId, projectId, limit, cursor }) => {
      try {
        if (!taskId && !projectId) {
          return err(new Error("Either taskId or projectId must be provided"));
        }
        if (taskId && projectId) {
          return err(new Error("Only one of taskId or projectId may be provided"));
        }
        const args = taskId
          ? { taskId, limit, cursor }
          : { projectId: projectId!, limit, cursor };
        const response = await todoist.getComments(args as Parameters<typeof todoist.getComments>[0]);
        return text(response);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.registerTool(
    "get_comment",
    {
      description: "Get a single comment by its ID.",
      inputSchema: {
        id: z.string().describe("The comment ID"),
      },
    },
    async ({ id }) => {
      try {
        const comment = await todoist.getComment(id);
        return text(comment);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.registerTool(
    "create_comment",
    {
      description:
        "Add a comment to a task or project. Exactly one of taskId or projectId must be provided.",
      inputSchema: {
        content: z.string().describe("The comment text (supports Markdown)"),
        taskId: z.string().optional().describe("Task ID to comment on"),
        projectId: z.string().optional().describe("Project ID to comment on"),
      },
    },
    async ({ content, taskId, projectId }) => {
      try {
        if (!taskId && !projectId) {
          return err(new Error("Either taskId or projectId must be provided"));
        }
        if (taskId && projectId) {
          return err(new Error("Only one of taskId or projectId may be provided"));
        }
        const args = taskId
          ? { content, taskId }
          : { content, projectId: projectId! };
        const comment = await todoist.addComment(args as Parameters<typeof todoist.addComment>[0]);
        return text(comment);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.registerTool(
    "update_comment",
    {
      description: "Update the text content of an existing comment.",
      inputSchema: {
        id: z.string().describe("The comment ID to update"),
        content: z.string().describe("New comment text"),
      },
    },
    async ({ id, content }) => {
      try {
        const comment = await todoist.updateComment(id, { content });
        return text(comment);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.registerTool(
    "delete_comment",
    {
      description: "Delete a comment.",
      inputSchema: {
        id: z.string().describe("The comment ID to delete"),
      },
    },
    async ({ id }) => {
      try {
        const success = await todoist.deleteComment(id);
        return text({ success });
      } catch (e) {
        return err(e);
      }
    }
  );
}
