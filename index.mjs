import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { google } from "googleapis";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, ".env") });

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
);
oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

const gmail = google.gmail({ version: "v1", auth: oauth2Client });

function extractBody(payload) {
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf-8");
  }
  const part = payload.parts?.find((p) => p.mimeType === "text/plain") ?? payload.parts?.[0];
  return part ? extractBody(part) : "";
}

const server = new McpServer({ name: "gmail-mcp-minimal", version: "1.0.0" });

server.tool(
  "search_emails",
  "Cerca correus a Gmail fent servir la sintaxi de cerca de Gmail (p. ex. 'from:algu@exemple.com is:unread').",
  { query: z.string(), maxResults: z.number().int().min(1).max(50).default(10) },
  async ({ query, maxResults }) => {
    const { data } = await gmail.users.messages.list({ userId: "me", q: query, maxResults });
    const messages = data.messages ?? [];
    const details = await Promise.all(
      messages.map(async (m) => {
        const { data: msg } = await gmail.users.messages.get({
          userId: "me",
          id: m.id,
          format: "metadata",
          metadataHeaders: ["Subject", "From", "Date"],
        });
        const headers = Object.fromEntries((msg.payload?.headers ?? []).map((h) => [h.name, h.value]));
        return { id: m.id, threadId: m.threadId, ...headers, snippet: msg.snippet };
      }),
    );
    return { content: [{ type: "text", text: JSON.stringify(details, null, 2) }] };
  },
);

server.tool(
  "list_labels",
  "Llista totes les etiquetes de Gmail (de sistema i personalitzades) amb el seu nom i id.",
  {},
  async () => {
    const { data } = await gmail.users.labels.list({ userId: "me" });
    const labels = (data.labels ?? []).map((l) => ({ id: l.id, name: l.name, type: l.type }));
    return { content: [{ type: "text", text: JSON.stringify(labels, null, 2) }] };
  },
);

server.tool(
  "read_email",
  "Llegeix el contingut complet d'un correu pel seu ID de missatge.",
  { messageId: z.string() },
  async ({ messageId }) => {
    const { data } = await gmail.users.messages.get({ userId: "me", id: messageId, format: "full" });
    const headers = Object.fromEntries((data.payload?.headers ?? []).map((h) => [h.name, h.value]));
    const body = extractBody(data.payload);
    return { content: [{ type: "text", text: JSON.stringify({ headers, body }, null, 2) }] };
  },
);

server.tool(
  "create_draft",
  "Crea un esborrany de correu a Gmail. Aquesta eina mai envia correus.",
  { to: z.string(), subject: z.string(), body: z.string(), threadId: z.string().optional() },
  async ({ to, subject, body, threadId }) => {
    const message = [`To: ${to}`, `Subject: ${subject}`, "Content-Type: text/plain; charset=utf-8", "", body].join("\n");
    const raw = Buffer.from(message).toString("base64url");
    const { data } = await gmail.users.drafts.create({
      userId: "me",
      requestBody: { message: { raw, threadId } },
    });
    return { content: [{ type: "text", text: `Esborrany creat amb id ${data.id}` }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
