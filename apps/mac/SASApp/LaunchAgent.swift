import Foundation

/// Installs/uninstalls a LaunchAgent so SASApp starts at user login.
enum LaunchAgent {
  static let label = "com.sas-technology.sas-app"

  static var plistPath: URL {
    FileManager.default.urls(for: .libraryDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("LaunchAgents/\(label).plist")
  }

  static func isInstalled() -> Bool {
    FileManager.default.fileExists(atPath: plistPath.path)
  }

  static func install() throws {
    let programPath = Bundle.main.executablePath ?? "/Applications/SASApp.app/Contents/MacOS/SASApp"
    let content = plistContent(programPath: programPath)
    try FileManager.default.createDirectory(at: plistPath.deletingLastPathComponent(), withIntermediateDirectories: true)
    try content.write(to: plistPath, atomically: true, encoding: .utf8)
    _ = runLaunchctl(["load", plistPath.path])
  }

  static func uninstall() throws {
    if isInstalled() {
      _ = runLaunchctl(["unload", plistPath.path])
      try FileManager.default.removeItem(at: plistPath)
    }
  }

  static func plistContent(programPath: String) -> String {
    """
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
      <key>Label</key><string>\(label)</string>
      <key>ProgramArguments</key><array><string>\(programPath)</string></array>
      <key>RunAtLoad</key><true/>
      <key>KeepAlive</key><false/>
    </dict>
    </plist>
    """
  }

  @discardableResult
  private static func runLaunchctl(_ args: [String]) -> Int32 {
    let proc = Process()
    proc.executableURL = URL(fileURLWithPath: "/bin/launchctl")
    proc.arguments = args
    do { try proc.run() } catch { return -1 }
    proc.waitUntilExit()
    return proc.terminationStatus
  }
}
