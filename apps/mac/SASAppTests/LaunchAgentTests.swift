import XCTest
@testable import SASApp

final class LaunchAgentTests: XCTestCase {
  func testPlistContentIncludesBundleId() {
    let plist = LaunchAgent.plistContent(programPath: "/Applications/SASApp.app/Contents/MacOS/SASApp")
    XCTAssertTrue(plist.contains("com.sas-technology.sas-app"))
  }

  func testPlistContentIncludesProgramPath() {
    let plist = LaunchAgent.plistContent(programPath: "/Applications/SASApp.app/Contents/MacOS/SASApp")
    XCTAssertTrue(plist.contains("/Applications/SASApp.app/Contents/MacOS/SASApp"))
  }

  func testPlistContentIsValidXML() throws {
    let plist = LaunchAgent.plistContent(programPath: "/Applications/SASApp.app/Contents/MacOS/SASApp")
    let data = plist.data(using: .utf8)!
    let parsed = try PropertyListSerialization.propertyList(from: data, options: [], format: nil)
    let dict = parsed as? [String: Any]
    XCTAssertEqual(dict?["Label"] as? String, "com.sas-technology.sas-app")
    XCTAssertEqual(dict?["RunAtLoad"] as? Bool, true)
  }
}
