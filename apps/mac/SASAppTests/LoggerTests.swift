import XCTest
@testable import SASApp

final class LoggerTests: XCTestCase {
  var tempDir: URL!

  override func setUp() {
    tempDir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    try? FileManager.default.createDirectory(at: tempDir, withIntermediateDirectories: true)
  }

  override func tearDown() {
    try? FileManager.default.removeItem(at: tempDir)
  }

  func testWriteAppendsToFile() throws {
    let logFile = tempDir.appendingPathComponent("server.log")
    let logger = ServerLogger(logFile: logFile)
    logger.write("hello\n")
    logger.write("world\n")
    let content = try String(contentsOf: logFile, encoding: .utf8)
    XCTAssertEqual(content, "hello\nworld\n")
  }

  func testWriteCreatesFileIfMissing() {
    let logFile = tempDir.appendingPathComponent("missing.log")
    let logger = ServerLogger(logFile: logFile)
    logger.write("first line\n")
    XCTAssertTrue(FileManager.default.fileExists(atPath: logFile.path))
  }
}
