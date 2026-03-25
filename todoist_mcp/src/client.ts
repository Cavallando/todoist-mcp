import { TodoistApi } from "@doist/todoist-api-typescript";
import "dotenv/config";

const token = process.env.TODOIST_API_TOKEN;
if (!token) {
  throw new Error(
    "TODOIST_API_TOKEN is not set. Copy .env.example to .env and add your token."
  );
}

export const todoist = new TodoistApi(token);
