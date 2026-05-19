import XCTest
@testable import SASApp

final class DataPathsTests: XCTestCase {
  func testDataDirEndsWithSASApp() {
    XCTAssertTrue(DataPaths.dataDir.path.hasSuffix("/Application Support/SASApp"))
  }

  func testDbPathIsAppDbInDataDir() {
    XCTAssertEqual(DataPaths.dbPath.lastPathComponent, "app.db")
    XCTAssertEqual(DataPaths.dbPath.deletingLastPathComponent(), DataPaths.dataDir)
  }

  func testEnsureDirectoriesExistIsIdempotent() throws {
    try DataPaths.ensureDirectoriesExist()
    try DataPaths.ensureDirectoriesExist()
    XCTAssertTrue(FileManager.default.fileExists(atPath: DataPaths.dataDir.path))
    XCTAssertTrue(FileManager.default.fileExists(atPath: DataPaths.logsDir.path))
  }
}
