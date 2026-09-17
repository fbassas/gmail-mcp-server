# gmail-mcp-server

Servidor MCP (Model Context Protocol) mínim per a Gmail. Exposa 4 eines de només lectura/esborrany — no hi ha cap eina per enviar ni esborrar correus.

## Eines

- `search_emails(query, maxResults)` — cerca amb la sintaxi de cerca de Gmail (`label:`, `from:`, `is:unread`, etc.)
- `read_email(messageId)` — llegeix un correu sencer
- `list_labels()` — llista les etiquetes disponibles
- `create_draft(to, subject, body, threadId?)` — crea un esborrany (mai l'envia)

## Configuració

Cada persona necessita el seu propi projecte de Google Cloud i les seves pròpies credencials OAuth — no es comparteixen entre usuaris.

1. Crea un projecte a [Google Cloud Console](https://console.cloud.google.com).
2. Activa la **Gmail API** (APIs y servicios → Library).
3. Configura la **OAuth consent screen**: tipus "Internal" si el compte és d'un Google Workspace, o "External" en mode de prova si és un Gmail personal (afegeix-te com a usuari de prova).
4. Afegeix els scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.compose`
5. Crea unes credencials **OAuth client ID** de tipus "Web application", amb el redirect URI:
   ```
   http://localhost:8765/oauth2callback
   ```
6. Copia `.env.example` a `.env` i omple `GMAIL_CLIENT_ID` i `GMAIL_CLIENT_SECRET`.
7. Instal·la dependències i autoritza:
   ```
   npm install
   npm run auth
   ```
   Obre la URL que et mostra, autoritza amb el teu compte de Gmail, i copia el `GMAIL_REFRESH_TOKEN` resultant a `.env`.

## Registrar-lo a Claude Code

```
claude mcp add gmail --scope user -- node /ruta/absoluta/a/gmail-mcp-server/index.mjs
```

Reinicia Claude Code perquè detecti el servidor nou.

## Seguretat

El fitxer `.env` conté credencials personals i mai s'ha de pujar a git (ja està al `.gitignore`). No compartisis el teu `GMAIL_REFRESH_TOKEN` amb ningú.
