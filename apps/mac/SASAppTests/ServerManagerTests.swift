import XCTest
@testable import SASApp

final class ServerManagerTests: XCTestCase {
  @MainActor
  func testInitialStatusIsStopped() {
    let mgr = ServerManager(nodeBinaryPath: "/tmp/nonexistent-node", serverJsPath: "/tmp/nonexistent.js")
    XCTAssertEqual(mgr.status, .stopped)
  }

  @MainActor
  func testStartFailsCleanlyWhenBinaryMissing() async {
    let mgr = ServerManager(nodeBinaryPath: "/tmp/nonexistent-node", serverJsPath: "/tmp/nonexistent.js")
    await mgr.start()
    if case .error = mgr.status {
      // pass
    } else {
      XCTFail("Expected .error status, got \(mgr.status)")
    }
  }

  @MainActor
  func testStopOnAlreadyStoppedIsNoOp() async {
    let mgr = ServerManager(nodeBinaryPath: "/tmp/nonexistent-node", serverJsPath: "/tmp/nonexistent.js")
    await mgr.stop()
    XCTAssertEqual(mgr.status, .stopped)
  }
}
