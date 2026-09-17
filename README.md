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

## Gmail personal (@gmail.com) vs. Google Workspace

Amb un compte de **Google Workspace** (d'una organització/empresa), pots triar el tipus **"Internal"** a la OAuth consent screen: el refresh token no caduca i tot funciona sense límits addicionals.

Amb un **Gmail personal**, no existeix l'opció "Internal" — cal anar per **"External"**. Mentre l'app estigui en mode **Testing** (l'estat per defecte, sense verificar per Google), hi ha dues limitacions importants:

- **El refresh token caduca cada 7 dies.** Passat aquest temps, cal tornar a executar `npm run auth` i actualitzar `GMAIL_REFRESH_TOKEN` a `.env`, o el servidor deixarà de poder autenticar-se.
- Màxim 100 usuaris de prova poden autoritzar l'app.

Aquestes limitacions només desapareixen si es passa l'app pel procés de **verificació de Google** (obligatori per als scopes de Gmail, ja que es consideren sensibles/restringits): auditoria de seguretat, política de privacitat pública, domini verificat, etc. És un procés de setmanes pensat per a apps distribuïdes a molts usuaris — normalment no val la pena per a un ús personal com aquest. Si el token et caduca sovint, el més senzill és re-executar `npm run auth` cada vegada.

## Registrar-lo a Claude Code

```
claude mcp add gmail --scope user -- node /ruta/absoluta/a/gmail-mcp-server/index.mjs
```

Reinicia Claude Code perquè detecti el servidor nou.

## Seguretat

El fitxer `.env` conté credencials personals i mai s'ha de pujar a git (ja està al `.gitignore`). No compartisis el teu `GMAIL_REFRESH_TOKEN` amb ningú.
