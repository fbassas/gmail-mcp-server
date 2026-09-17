import "dotenv/config";
import http from "node:http";
import { google } from "googleapis";

const PORT = 8765;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
];

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  REDIRECT_URI,
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: SCOPES,
});

console.log("Obre aquesta URL al navegador i inicia sessio amb francesc.bassas@upc.edu:\n");
console.log(authUrl + "\n");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  if (url.pathname !== "/oauth2callback") {
    res.writeHead(404);
    res.end();
    return;
  }

  const code = url.searchParams.get("code");
  if (!code) {
    res.writeHead(400);
    res.end("Falta el parametre 'code' a la resposta de Google.");
    return;
  }

  const { tokens } = await oauth2Client.getToken(code);
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Autoritzat correctament. Ja pots tancar aquesta pestanya.");

  console.log("\nRefresh token obtingut. Afegeix aquesta linia al fitxer .env:\n");
  console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}\n`);

  server.close();
});

server.listen(PORT, () => {
  console.log(`Esperant l'autoritzacio a ${REDIRECT_URI} ...`);
});
