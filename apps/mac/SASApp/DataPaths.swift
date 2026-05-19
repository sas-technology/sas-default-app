import Foundation

/// Resolves filesystem paths under ~/Library/Application Support/SASApp/.
/// All app state (database, env, setup token, logs) lives in this directory
/// and survives app updates.
enum DataPaths {
  /// ~/Library/Application Support/SASApp/
  static var dataDir: URL {
    let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
    return base.appendingPathComponent("SASApp", isDirectory: true)
  }

  static var dbPath: URL { dataDir.appendingPathComponent("app.db") }
  static var envPath: URL { dataDir.appendingPathComponent(".env") }
  static var setupTokenPath: URL { dataDir.appendingPathComponent(".setup-token") }
  static var logsDir: URL { dataDir.appendingPathComponent("logs", isDirectory: true) }
  static var currentLogPath: URL { logsDir.appendingPathComponent("server.log") }

  /// Creates the data and logs directories if missing. Idempotent.
  static func ensureDirectoriesExist() throws {
    try FileManager.default.createDirectory(at: dataDir, withIntermediateDirectories: true)
    try FileManager.default.createDirectory(at: logsDir, withIntermediateDirectories: true)
  }
}
