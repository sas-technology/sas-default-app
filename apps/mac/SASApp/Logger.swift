import Foundation

/// Append-only writer that streams Process stdout/stderr to a log file.
/// Rotates when the file exceeds 5 MB; keeps the last 7 rotations.
final class ServerLogger {
  private let logFile: URL
  private let maxBytes: Int = 5 * 1024 * 1024
  private let maxRotations: Int = 7
  private let queue = DispatchQueue(label: "sas.app.logger")

  init(logFile: URL) {
    self.logFile = logFile
  }

  func write(_ text: String) {
    guard let data = text.data(using: .utf8) else { return }
    queue.sync { writeData(data) }
  }

  func attach(to pipe: Pipe) {
    pipe.fileHandleForReading.readabilityHandler = { [weak self] handle in
      let data = handle.availableData
      guard !data.isEmpty else { return }
      self?.queue.sync { self?.writeData(data) }
    }
  }

  private func writeData(_ data: Data) {
    let fm = FileManager.default
    if !fm.fileExists(atPath: logFile.path) {
      try? fm.createDirectory(at: logFile.deletingLastPathComponent(), withIntermediateDirectories: true)
      fm.createFile(atPath: logFile.path, contents: nil)
    }
    rotateIfNeeded()
    if let handle = try? FileHandle(forWritingTo: logFile) {
      try? handle.seekToEnd()
      try? handle.write(contentsOf: data)
      try? handle.close()
    }
  }

  private func rotateIfNeeded() {
    let attrs = try? FileManager.default.attributesOfItem(atPath: logFile.path)
    let size = (attrs?[.size] as? NSNumber)?.intValue ?? 0
    guard size >= maxBytes else { return }
    let fm = FileManager.default
    for i in stride(from: maxRotations - 1, through: 1, by: -1) {
      let src = logFile.appendingPathExtension(String(i))
      let dst = logFile.appendingPathExtension(String(i + 1))
      try? fm.removeItem(at: dst)
      try? fm.moveItem(at: src, to: dst)
    }
    try? fm.moveItem(at: logFile, to: logFile.appendingPathExtension("1"))
  }
}
