import Foundation
import AppKit
import Security

/// Runs on first launch (when ~/Library/Application Support/SASApp/ doesn't exist)
/// to seed AUTH_SECRET, the setup token, and the SQLite database.
enum FirstRunSetup {
  /// Idempotent. Returns immediately if data dir already exists with a .env.
  @MainActor
  static func runIfNeeded() async throws {
    try DataPaths.ensureDirectoriesExist()
    if FileManager.default.fileExists(atPath: DataPaths.envPath.path) { return }

    let secret = generateAuthSecret()
    let envContent = """
    AUTH_SECRET=\(secret)
    AUTH_URL=http://localhost:11000
    DATABASE_URL=file:\(DataPaths.dbPath.path)
    """
    try envContent.write(to: DataPaths.envPath, atomically: true, encoding: .utf8)

    let token = generateSetupToken()
    try token.write(to: DataPaths.setupTokenPath, atomically: true, encoding: .utf8)

    showSetupTokenModal(token: token)
  }

  static func generateAuthSecret() -> String {
    var bytes = [UInt8](repeating: 0, count: 32)
    _ = SecRandomCopyBytes(kSecRandomDefault, 32, &bytes)
    return Data(bytes).base64EncodedString()
  }

  static func generateSetupToken() -> String {
    var bytes = [UInt8](repeating: 0, count: 32)
    _ = SecRandomCopyBytes(kSecRandomDefault, 32, &bytes)
    return bytes.map { String(format: "%02x", $0) }.joined()
  }

  static func parseEnvFile(_ content: String) -> [String: String] {
    var result: [String: String] = [:]
    for raw in content.split(separator: "\n") {
      let line = raw.trimmingCharacters(in: .whitespaces)
      if line.isEmpty || line.hasPrefix("#") { continue }
      let parts = line.split(separator: "=", maxSplits: 1, omittingEmptySubsequences: true)
      guard parts.count == 2 else { continue }
      result[String(parts[0]).trimmingCharacters(in: .whitespaces)] =
        String(parts[1]).trimmingCharacters(in: .whitespaces)
    }
    return result
  }

  @MainActor
  private static func showSetupTokenModal(token: String) {
    let alert = NSAlert()
    alert.messageText = "First-run setup"
    alert.informativeText = """
    Your one-time setup token is below. Copy it and paste it into the setup wizard \
    in your browser to finish creating your administrator account.

    Token:
    \(token)

    This token is also saved at:
    ~/Library/Application Support/SASApp/.setup-token
    """
    alert.addButton(withTitle: "Copy to Clipboard")
    alert.addButton(withTitle: "OK")
    let response = alert.runModal()
    if response == .alertFirstButtonReturn {
      let pb = NSPasteboard.general
      pb.clearContents()
      pb.setString(token, forType: .string)
    }
  }
}
