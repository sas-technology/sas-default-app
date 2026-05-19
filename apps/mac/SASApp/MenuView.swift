import SwiftUI
import AppKit

struct MenuView: View {
  @ObservedObject var serverManager: ServerManager
  @State private var launchAtLoginEnabled: Bool = LaunchAgent.isInstalled()

  var body: some View {
    Text("● \(serverManager.status.displayLabel)")
      .foregroundColor(statusColor)

    Divider()

    Button("Open App") { openApp() }
      .keyboardShortcut("o")
      .disabled(serverManager.status != .running)

    Button("Restart Server") {
      Task { await serverManager.restart() }
    }

    Button("Open Data Folder") {
      NSWorkspace.shared.open(DataPaths.dataDir)
    }

    Button("View Logs") {
      NSWorkspace.shared.open(DataPaths.currentLogPath)
    }

    Divider()

    Toggle("Launch at Login", isOn: $launchAtLoginEnabled)
      .onChange(of: launchAtLoginEnabled) { _, newValue in
        if newValue { try? LaunchAgent.install() } else { try? LaunchAgent.uninstall() }
      }

    Divider()

    Button("Quit") {
      Task {
        await serverManager.stop()
        NSApp.terminate(nil)
      }
    }
    .keyboardShortcut("q")
  }

  private var statusColor: Color {
    switch serverManager.status {
    case .running: return .green
    case .starting: return .yellow
    case .error: return .red
    case .stopped: return .gray
    }
  }

  private func openApp() {
    if let url = URL(string: "http://localhost:11000") {
      NSWorkspace.shared.open(url)
    }
  }
}
