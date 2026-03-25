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

export function registerSectionTools(server: McpServer): void {
  server.registerTool(
    "get_sections",
    {
      description: "List sections, optionally filtered by project.",
      inputSchema: {
        projectId: z.string().optional().describe("Filter sections by project ID"),
        limit: z.number().int().min(1).max(200).optional().describe("Max sections to return"),
        cursor: z.string().optional().describe("Pagination cursor from a previous response"),
      },
    },
    async (args) => {
      try {
        const response = await todoist.getSections(args);
        return text(response);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.registerTool(
    "get_section",
    {
      description: "Get a single section by its ID.",
      inputSchema: {
        id: z.string().describe("The section ID"),
      },
    },
    async ({ id }) => {
      try {
        const section = await todoist.getSection(id);
        return text(section);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.registerTool(
    "create_section",
    {
      description: "Create a new section within a project.",
      inputSchema: {
        name: z.string().describe("The section name"),
        projectId: z.string().describe("The project ID to create the section in"),
        order: z.number().int().optional().describe("Sort order position within the project"),
      },
    },
    async (args) => {
      try {
        const section = await todoist.addSection(args);
        return text(section);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.registerTool(
    "update_section",
    {
      description: "Rename an existing section.",
      inputSchema: {
        id: z.string().describe("The section ID to update"),
        name: z.string().describe("New section name"),
      },
    },
    async ({ id, name }) => {
      try {
        const section = await todoist.updateSection(id, { name });
        return text(section);
      } catch (e) {
        return err(e);
      }
    }
  );

  server.registerTool(
    "delete_section",
    {
      description: "Delete a section and all tasks within it.",
      inputSchema: {
        id: z.string().describe("The section ID to delete"),
      },
    },
    async ({ id }) => {
      try {
        const success = await todoist.deleteSection(id);
        return text({ success });
      } catch (e) {
        return err(e);
      }
    }
  );
}
