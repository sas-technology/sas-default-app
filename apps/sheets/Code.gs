// Companion app — Google Apps Script + Sheets backend.
// Deployment: Tools → Script editor in any Google Sheet OR clasp from CLI.

const SHEET_ID = PropertiesService.getScriptProperties().getProperty("SHEET_ID")
const NOTES_TAB = "notes"

function doGet(e) {
  return HtmlService.createTemplateFromFile("index")
    .evaluate()
    .setTitle("SAS MiniApp — Sheets edition")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent()
}

function getCurrentUser() {
  return { email: Session.getActiveUser().getEmail() }
}

function getNotes() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(NOTES_TAB)
  if (!sheet || sheet.getLastRow() <= 1) return []
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues()
  return values
    .filter((r) => r[0])
    .map((r) => ({ timestamp: r[0], author: r[1], body: r[2] }))
}

function saveNote(body) {
  if (!body || typeof body !== "string" || body.length > 5000) {
    throw new Error("Invalid note body")
  }
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(NOTES_TAB)
  sheet.appendRow([new Date().toISOString(), Session.getActiveUser().getEmail(), body])
  return { ok: true }
}
