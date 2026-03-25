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

export function registerTaskTools(server: McpServer): void {
  server.registerTool(
    "get_tasks",
    {
      description:
        "List active tasks. Optionally filter by project, section, parent task, label, or specific IDs.",
      inputSchema: {
        projectId: z.string().optional().describe("Filter tasks by project ID"),
        sectionId: z.string().optional().describe("Filter tasks by section ID"),
        parentId: z.string().optional().describe("Filter tasks by parent task ID"),
        label: z.string().optional().describe("Filter tasks by label name"),
        ids: z.array(z.string()).optional().describe("Return only tasks with these IDs"),
        limit: z.number().int().min(1).max(200).optional().describe("Max number of tasks to return"),
        cursor: z.string().optional().describe("Pagination cursor from a previous response"),
      },
    },
    async (args) => {
      try {
        const response = await todoist.getTasks(args);
        return text(response);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.registerTool(
    "get_task",
    {
      description: "Get a single task by its ID.",
      inputSchema: {
        id: z.string().describe("The task ID"),
      },
    },
    async ({ id }) => {
      try {
        const task = await todoist.getTask(id);
        return text(task);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.registerTool(
    "create_task",
    {
      description: "Create a new task in Todoist.",
      inputSchema: {
        content: z.string().describe("The task content / title (supports Markdown)"),
        description: z.string().optional().describe("Longer description of the task (supports Markdown)"),
        projectId: z.string().optional().describe("Project to add the task to (defaults to Inbox)"),
        sectionId: z.string().optional().describe("Section within the project"),
        parentId: z.string().optional().describe("Parent task ID to create a sub-task"),
        labels: z.array(z.string()).optional().describe("List of label names to attach"),
        priority: z
          .number()
          .int()
          .min(1)
          .max(4)
          .optional()
          .describe("Priority: 1 (normal) to 4 (urgent)"),
        dueString: z
          .string()
          .optional()
          .describe("Natural-language due date, e.g. 'tomorrow', 'every Monday'"),
        dueDate: z.string().optional().describe("Due date in YYYY-MM-DD format"),
        dueDatetime: z
          .string()
          .optional()
          .describe("Due date + time in RFC3339 format, e.g. '2026-04-01T09:00:00Z'"),
        assigneeId: z.string().optional().describe("User ID to assign the task to"),
      },
    },
    async ({ dueDate, dueDatetime, ...rest }) => {
      try {
        const args =
          dueDatetime
            ? { ...rest, dueDatetime }
            : dueDate
            ? { ...rest, dueDate }
            : rest;
        const task = await todoist.addTask(args);
        return text(task);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.registerTool(
    "update_task",
    {
      description: "Update an existing task's content, due date, priority, labels, or other fields.",
      inputSchema: {
        id: z.string().describe("The task ID to update"),
        content: z.string().optional().describe("New task content / title"),
        description: z.string().optional().describe("New description"),
        labels: z.array(z.string()).optional().describe("Replace the full list of label names"),
        priority: z
          .number()
          .int()
          .min(1)
          .max(4)
          .optional()
          .describe("Priority: 1 (normal) to 4 (urgent)"),
        dueString: z
          .string()
          .optional()
          .describe("Natural-language due date. Use 'no date' to clear."),
        dueDate: z.string().optional().describe("Due date in YYYY-MM-DD format"),
        dueDatetime: z
          .string()
          .optional()
          .describe("Due date + time in RFC3339 format"),
        assigneeId: z.string().nullable().optional().describe("User ID to assign, or null to unassign"),
      },
    },
    async ({ id, dueDate, dueDatetime, ...rest }) => {
      try {
        const args =
          dueDatetime
            ? { ...rest, dueDatetime }
            : dueDate
            ? { ...rest, dueDate }
            : rest;
        const task = await todoist.updateTask(id, args);
        return text(task);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.registerTool(
    "complete_task",
    {
      description: "Mark a task as completed (close it).",
      inputSchema: {
        id: z.string().describe("The task ID to complete"),
      },
    },
    async ({ id }) => {
      try {
        const success = await todoist.closeTask(id);
        return text({ success });
      } catch (e) {
        return err(e);
      }
    }
  );

  server.registerTool(
    "delete_task",
    {
      description: "Permanently delete a task.",
      inputSchema: {
        id: z.string().describe("The task ID to delete"),
      },
    },
    async ({ id }) => {
      try {
        const success = await todoist.deleteTask(id);
        return text({ success });
      } catch (e) {
        return err(e);
      }
    }
  );
}
