import SwiftUI
import AppKit

@main
struct SASAppApp: App {
  @StateObject private var serverManager: ServerManager = {
    let bundle = Bundle.main
    let resources = bundle.resourceURL ?? bundle.bundleURL
    let nodePath = resources.appendingPathComponent("Bundled/node").path
    let serverJsPath = resources.appendingPathComponent("Bundled/standalone/apps/web/server.js").path
    return ServerManager(nodeBinaryPath: nodePath, serverJsPath: serverJsPath)
  }()

  init() {
    let mgr = _serverManager
    Task { @MainActor in
      try? await FirstRunSetup.runIfNeeded()
      await mgr.wrappedValue.start()
      // Open browser when server reaches running state
      while mgr.wrappedValue.status != .running {
        try? await Task.sleep(nanoseconds: 500_000_000)
        if case .error = mgr.wrappedValue.status { return }
      }
      if let url = URL(string: "http://localhost:11000") {
        NSWorkspace.shared.open(url)
      }
    }
  }

  var body: some Scene {
    MenuBarExtra {
      MenuView(serverManager: serverManager)
    } label: {
      Image(systemName: serverManager.status.symbolName)
    }
    .menuBarExtraStyle(.menu)
  }
}
