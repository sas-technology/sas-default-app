# SAS MiniApp — Sheets edition

A companion "lite" version of the main app, built entirely on Google Apps Script with a Google Sheet as the database. No Node, no Docker, no servers — and auth is handled automatically by Google.

This is an alternative to the main Docker / Vercel / Netlify / Cloudflare deploys for situations where you want **zero infrastructure** and your users already have Google accounts.

## What you get

- A web form to add notes
- A list of recent notes
- The signed-in user's Google email shown at the top
- Each note stored as a row in a Google Sheet (Timestamp, Author, Body)
- Auth handled by Google — only people you allow can open the app

## What you don't get (vs. the main app)

- No AI safety guardrails (`@workspace/ai-safety` is Node-only)
- No shadcn UI component library
- No automated APCA accessibility tooling
- No real database — Google Sheets is fine for thousands of rows but gets slow well before the 5M-cell limit
- No background jobs, no streaming, no Server Components

## When to pick this

- You already use Google Workspace at your school or org
- You want sign-in "for free" — no NextAuth setup, no password storage
- You want to keep operating cost at **zero**
- The use case is simple (forms, lists, lookups, light reporting)

## When NOT to pick this

- You need any AI/LLM features
- You expect more than a few thousand records, or want fast queries
- You need offline support, mobile push, or background workers
- You need a public API or third-party integrations

## Setup (non-technical)

1. **Create the Sheet.** Open a new Google Sheet you own. Add a tab named exactly `notes`. In row 1 add headers: `Timestamp` | `Author` | `Body`.
2. **Copy the Sheet ID.** It's the long string in the URL between `/d/` and `/edit`. Save it for step 6.
3. **Open the script editor.** In the Sheet, click **Extensions → Apps Script**.
4. **Paste `Code.gs`.** Replace the contents of the default `Code.gs` file with the contents of `apps/sheets/Code.gs` from this repo.
5. **Add `index.html`.** Click the **+** next to "Files" → **HTML** → name it `index` → paste the contents of `apps/sheets/index.html`.
6. **Set the Sheet ID.** Click the gear icon (Project Settings) → scroll to "Script Properties" → **Add script property** → name: `SHEET_ID`, value: the ID from step 2.
7. **Set the manifest.** Still in Project Settings, tick "Show 'appsscript.json' manifest file in editor". Then back in the editor, open `appsscript.json` and replace its contents with `apps/sheets/appsscript.json` from this repo.
8. **Deploy.** Click **Deploy → New deployment**:
   - **Type:** Web app
   - **Execute as:** User accessing the web app
   - **Who has access:** Anyone within `your-domain.example` (for schools/orgs), or **Only myself** for testing
9. **Authorize.** Google will prompt you to grant permissions the first time. Approve them.
10. **Visit the URL.** Apps Script gives you a `script.google.com/macros/...` URL. Anyone in your domain who opens it will be signed in automatically.

## Updating the app

After editing `Code.gs` or `index.html` in the script editor, click **Deploy → Manage deployments → ✏ Edit → Version: New version → Deploy**. Re-using the same deployment keeps the URL stable.

## Using `clasp` instead (developer workflow)

If you'd rather sync from your terminal:

```bash
npm install -g @google/clasp
clasp login
cd apps/sheets
clasp create --type webapp --title "SAS MiniApp — Sheets edition"
clasp push
clasp deploy
```

`clasp` will create a `.clasp.json` linking the local files to the remote script project.

## Customising for a different table

To turn this into a different form (feedback, attendance, signups, etc.):

1. Rename the `notes` tab and update `NOTES_TAB` in `Code.gs`.
2. Adjust the column count in `getNotes` (currently reads 3 columns).
3. Update the `saveNote` call and the form in `index.html`.

## Cost

Free. Apps Script has generous quotas for individual and Workspace accounts — see [Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas).
