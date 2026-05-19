import Foundation
import Combine

/// Manages the lifecycle of the bundled node process running the Next.js server.
@MainActor
final class ServerManager: ObservableObject {
  @Published private(set) var status: ServerStatus = .stopped

  private let nodeBinaryPath: String
  private let serverJsPath: String
  private let port: Int
  private var process: Process?
  private var healthCheckTask: Task<Void, Never>?
  private let logger: ServerLogger

  init(nodeBinaryPath: String, serverJsPath: String, port: Int = 11000) {
    self.nodeBinaryPath = nodeBinaryPath
    self.serverJsPath = serverJsPath
    self.port = port
    self.logger = ServerLogger(logFile: DataPaths.currentLogPath)
  }

  func start() async {
    guard process == nil else { return }
    status = .starting

    do {
      try DataPaths.ensureDirectoriesExist()
    } catch {
      status = .error("Failed to prepare data dir: \(error.localizedDescription)")
      return
    }

    let proc = Process()
    proc.executableURL = URL(fileURLWithPath: nodeBinaryPath)
    proc.arguments = [serverJsPath]
    proc.environment = buildEnvironment()

    let outPipe = Pipe()
    proc.standardOutput = outPipe
    logger.attach(to: outPipe)

    let errPipe = Pipe()
    proc.standardError = errPipe
    logger.attach(to: errPipe)

    do {
      try proc.run()
      process = proc
      healthCheckTask = Task { await runHealthCheckLoop() }
    } catch {
      status = .error("Failed to start node: \(error.localizedDescription)")
    }
  }

  func stop() async {
    healthCheckTask?.cancel()
    healthCheckTask = nil
    guard let proc = process else {
      status = .stopped
      return
    }
    proc.terminate()
    let deadline = Date().addingTimeInterval(5)
    while proc.isRunning && Date() < deadline {
      try? await Task.sleep(nanoseconds: 100_000_000)
    }
    if proc.isRunning { kill(proc.processIdentifier, SIGKILL) }
    process = nil
    status = .stopped
  }

  func restart() async {
    await stop()
    await start()
  }

  private func buildEnvironment() -> [String: String] {
    var env = ProcessInfo.processInfo.environment
    env["DATABASE_URL"] = "file:\(DataPaths.dbPath.path)"
    env["AUTH_URL"] = "http://localhost:\(port)"
    env["PORT"] = String(port)
    env["HOSTNAME"] = "127.0.0.1"
    env["SETUP_TOKEN_PATH"] = DataPaths.setupTokenPath.path
    if let envFile = try? String(contentsOf: DataPaths.envPath, encoding: .utf8) {
      for (k, v) in FirstRunSetup.parseEnvFile(envFile) {
        env[k] = v
      }
    }
    return env
  }

  private func runHealthCheckLoop() async {
    guard let url = URL(string: "http://localhost:\(port)/api/health") else { return }
    while !Task.isCancelled {
      do {
        let (_, response) = try await URLSession.shared.data(from: url)
        if let http = response as? HTTPURLResponse, http.statusCode == 200 {
          if status != .running { status = .running }
        }
      } catch {
        if status == .running { status = .error("Server unreachable") }
      }
      try? await Task.sleep(nanoseconds: 2_000_000_000)
    }
  }
}
